/**
 * Campaign-level funnel for managed ads.
 *
 * WHY THIS EXISTS
 * `lib/ad-boost/delivered.server.ts` answers "how many families did this flight
 * deliver?" -- landings and inquiries, and nothing between them. That is enough
 * to say a flight failed and useless for saying WHERE it failed.
 *
 * The mid-funnel already exists. `growth_attribution_events` records
 * cta_visible -> cta_engaged -> lead_started -> lead_created on provider pages.
 * It just is not attributable on its own: the client attaches UTM parameters
 * only to `page_landed`, so every downstream event arrives with no campaign.
 *
 * The fix is a join, not new instrumentation. Every event in a visit shares an
 * `anonymous_id` and a `visit_id`, so a landing that carries
 * `utm_campaign` can lend its campaign to the rest of that visit.
 *
 * THE VISIT GUARD MATTERS
 * Joining on `anonymous_id` alone over-counts badly. A single long browsing
 * session in the Miracle-Lightstar data produced 1 landing and 178
 * cta_visible events, because `anonymous_id` persists across visits and drags
 * in unrelated activity. Scoping to (anonymous_id, visit_id) cut that to 12.
 *
 * WHAT THE VISIT GUARD COSTS -- READ BEFORE QUOTING `lead_created`
 * Same-visit scoping is right for ENGAGEMENT (did this arrival touch a CTA?)
 * and wrong for CONVERSION. A family who lands from an ad, leaves, and returns
 * two days later to inquire is a real conversion that this join drops: it moved
 * Pacesetter from 2 attributed inquiries to 1.
 *
 * So `lead_started` / `lead_created` here are a LOWER BOUND and must not be
 * used as the lead count. The canonical figure stays
 * `countDeliveredByCampaign` in `delivered.server.ts`, which reads
 * `utm_campaign` directly off the inquiry event and needs no join at all.
 * Use this module for the shape of the funnel and the engagement rate; use
 * that one for how many families a flight actually delivered.
 */

import { getServiceClient } from "@/lib/admin";

/** Referrer class stamped on our own traffic. Never a family from an ad. */
const INTERNAL_REFERRER_CLASS = "olera_internal";

/** Ordered funnel stages, shallowest first. */
export const FUNNEL_STAGES = [
  "landed",
  "cta_visible",
  "cta_engaged",
  "lead_started",
  "lead_created",
] as const;

export type FunnelStage = (typeof FUNNEL_STAGES)[number];

export interface CampaignFunnel {
  campaign: string;
  landed: number;
  cta_visible: number;
  cta_engaged: number;
  lead_started: number;
  lead_created: number;
  /** Share of arrivals that touched a CTA. The stage that actually leaks. */
  engagement_rate: number | null;
  /** Share of arrivals that sent an inquiry. */
  inquiry_rate: number | null;
  /** Visits counted, for judging how much weight the rates can bear. */
  visits: number;
}

interface LandingRow {
  anonymous_id: string | null;
  visit_id: string | null;
  metadata: { utm_source?: string; utm_campaign?: string; referrer_class?: string } | null;
}

interface EventRow {
  anonymous_id: string | null;
  visit_id: string | null;
  event_type: string;
  cta_id: string | null;
  page_category: string | null;
}

/** Key a visit. Falls back to anonymous_id when visit_id is absent (older rows). */
function visitKey(anonymousId: string | null, visitId: string | null): string | null {
  const a = anonymousId ?? "";
  if (!a) return null;
  return `${a}::${visitId ?? a}`;
}

function emptyFunnel(campaign: string): CampaignFunnel {
  return {
    campaign,
    landed: 0,
    cta_visible: 0,
    cta_engaged: 0,
    lead_started: 0,
    lead_created: 0,
    engagement_rate: null,
    inquiry_rate: null,
    visits: 0,
  };
}

/**
 * Build the funnel for managed-ad traffic, grouped by utm_campaign.
 *
 * @param since ISO date; defaults to all time. Note tagged landing tracking
 *              only began 2026-07-22, so anything earlier has inquiries
 *              without landings and cannot be read as a funnel.
 */
export async function getCampaignFunnels(
  db: ReturnType<typeof getServiceClient>,
  opts: { since?: string; campaigns?: string[] } = {},
): Promise<CampaignFunnel[]> {
  // 1. Every managed-ad arrival, with its campaign.
  let landingQuery = db
    .from("growth_attribution_events")
    .select("anonymous_id, visit_id, metadata")
    .eq("event_type", "page_landed")
    .filter("metadata->>utm_source", "eq", "olera_managed")
    .order("occurred_at", { ascending: false })
    .limit(20000);
  if (opts.since) landingQuery = landingQuery.gte("occurred_at", opts.since);

  const { data: landings, error: landErr } = await landingQuery;
  if (landErr) throw new Error(`campaign-funnel landings: ${landErr.message}`);

  const visitToCampaign = new Map<string, string>();
  const byCampaign = new Map<string, CampaignFunnel>();

  for (const row of (landings ?? []) as LandingRow[]) {
    const m = row.metadata;
    if (!m) continue;
    if (m.referrer_class === INTERNAL_REFERRER_CLASS) continue; // our own QA traffic
    const campaign = m.utm_campaign;
    if (!campaign) continue;
    if (opts.campaigns && !opts.campaigns.includes(campaign)) continue;

    const key = visitKey(row.anonymous_id, row.visit_id);
    if (!key) continue;

    if (!byCampaign.has(campaign)) byCampaign.set(campaign, emptyFunnel(campaign));
    const f = byCampaign.get(campaign)!;

    // One landing per visit. A refresh must not look like a second family.
    if (!visitToCampaign.has(key)) {
      visitToCampaign.set(key, campaign);
      f.landed += 1;
      f.visits += 1;
    }
  }

  if (visitToCampaign.size === 0) return [];

  // 2. Downstream events for exactly those visits.
  const anonIds = [...new Set([...visitToCampaign.keys()].map((k) => k.split("::")[0]))];
  const CHUNK = 200;
  for (let i = 0; i < anonIds.length; i += CHUNK) {
    const { data: events, error: evErr } = await db
      .from("growth_attribution_events")
      .select("anonymous_id, visit_id, event_type, cta_id, page_category")
      .in("anonymous_id", anonIds.slice(i, i + CHUNK))
      .neq("event_type", "page_landed")
      .limit(50000);
    if (evErr) throw new Error(`campaign-funnel events: ${evErr.message}`);

    for (const e of (events ?? []) as EventRow[]) {
      const key = visitKey(e.anonymous_id, e.visit_id);
      if (!key) continue;
      const campaign = visitToCampaign.get(key); // visit guard: same visit only
      if (!campaign) continue;

      // The benefits module logs cta_visible on provider pages for UI that does
      // not render. Left in, it reported 287 CTA impressions where the true
      // figure was 48 -- 83% of the column was phantom.
      if (e.cta_id === "benefits_intake") continue;
      // A visit that arrived from an ad and then wandered to a benefits or
      // editorial page would otherwise donate those events to the campaign,
      // including a benefits lead_created showing up as an ad-driven inquiry.
      if (e.page_category && e.page_category !== "provider") continue;
      const f = byCampaign.get(campaign);
      if (!f) continue;
      if (e.event_type === "cta_visible") f.cta_visible += 1;
      else if (e.event_type === "cta_engaged") f.cta_engaged += 1;
      else if (e.event_type === "lead_started") f.lead_started += 1;
      else if (e.event_type === "lead_created") f.lead_created += 1;
    }
  }

  const out = [...byCampaign.values()];
  for (const f of out) {
    f.engagement_rate = f.landed > 0 ? f.cta_engaged / f.landed : null;
    f.inquiry_rate = f.landed > 0 ? f.lead_created / f.landed : null;
  }
  return out.sort((a, b) => b.landed - a.landed);
}
