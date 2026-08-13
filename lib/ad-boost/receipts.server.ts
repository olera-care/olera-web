import { getServiceClient } from "@/lib/admin";
import {
  getCampaignQuestions,
  getCampaignStats,
  listLeadsByCampaign,
  type CampaignLead,
} from "@/lib/ad-boost/delivered.server";

/**
 * The campaign receipt — the numbers behind "here is what your flight bought,"
 * composed once and rendered on three surfaces (provider boost panel, wrap-up
 * email, admin preview/detail) so they can never disagree.
 *
 * Two halves:
 *   Demand   — the ad worked and demand was real: impressions ("seen by"),
 *              clicks + CTR, visitors, profile saves, questions. This is what
 *              makes a ZERO-lead flight read as "underfunded," not
 *              "worthless" (the Tinder-Boost move: show reach even when
 *              there were no matches).
 *   Outcome  — what the leads became: the provider's one-tap self-reports
 *              (client / still talking / didn't work out). This is what makes
 *              a wrap-up ask provable (the Franchil lesson: a paying client
 *              the platform couldn't see).
 *
 * Honesty rules baked in here, not in the render layers:
 *   - Ad-platform numbers come only from the manually entered dashboard fields
 *     (ad_impressions / ad_clicks / ad_spend_cents). Absent fields render as
 *     absent — never estimated.
 *   - The math line uses the measured category benchmark (~1 lead per 30
 *     clicks, i.e. ~3% click→lead) and is phrased as arithmetic, not promise.
 */

/** Measured category benchmark: ~3% of ad clicks become inquiries, so ~1 lead
 *  per ~30 clicks. Source: Franchil/Abode flights + the SOP expectation math
 *  ($50 ≈ 25 clicks ≈ 0.7 expected leads). Keep in sync with the SOP if it is
 *  ever re-measured. */
export const CLICKS_PER_LEAD_BENCHMARK = 30;

export interface CampaignReceipt {
  /** Manual ad-platform numbers. The `google` key is a legacy wire name.
   * Null = not entered yet, render nothing. */
  google: {
    impressions: number | null;
    clicks: number | null;
    spendCents: number | null;
    /** Percent, 1 decimal, from the two manual fields. Null unless both set. */
    ctr: number | null;
    /** Cents per click. Null unless both set and clicks > 0. */
    cpcCents: number | null;
  };
  /** Our own tracked engagement since the launch anchor. */
  engagement: {
    visitors: number;
    saves: number;
    questionsReceived: number;
  };
  leads: CampaignLead[];
  /** Rollup of provider self-reports across attributed leads plus the optional
   * campaign-level direct-contact answer used when no inquiry row existed. */
  outcomes: { client: number; talking: number; no: number; unanswered: number };
  /** Expected leads for the clicks bought, per the category benchmark.
   *  Null when clicks were never entered. */
  expectedLeads: number | null;
  /** Rolling last-7-days momentum (bounded by the launch anchor) — the live
   *  view's "numbers going up" signal, from real event timestamps. */
  week: { visitors: number; questions: number; leads: number };
}

/** The request-row slice the receipt needs. Matches ad_campaign_requests. */
export interface ReceiptRequestRow {
  id: string;
  provider_id: string | null;
  provider_slug: string | null;
  campaign_tag: string | null;
  requested_setup_week: string | null;
  flight_start_date?: string | null;
  created_at: string;
  ad_impressions: number | null;
  ad_clicks: number | null;
  ad_spend_cents: number | null;
  /** Whole-flight answer for families who called or visited the provider
   * directly and therefore never created an Olera lead row. */
  provider_reported_outcome?: "client" | "talking" | "no" | null;
}

export async function getCampaignReceipt(
  db: ReturnType<typeof getServiceClient>,
  request: ReceiptRequestRow,
): Promise<CampaignReceipt> {
  const tag = request.campaign_tag || request.id;
  const since = new Date(
    request.flight_start_date || request.requested_setup_week || request.created_at,
  ).toISOString();
  const variants = [request.provider_slug, request.provider_id].filter(
    (v): v is string => typeof v === "string" && v.length > 0,
  );

  // Momentum window: the last 7 days, clipped to the launch anchor so a
  // 3-day-old campaign's "this week" never includes pre-launch traffic.
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const weekSince = sevenDaysAgo > since ? sevenDaysAgo : since;

  const [stats, questions, leads, saves, weekStats, weekQuestions] = await Promise.all([
    getCampaignStats(db, { providerIdVariants: variants, since }),
    getCampaignQuestions(db, { providerIdVariants: variants, since }),
    listLeadsByCampaign(db, tag),
    countSaves(db, variants, since),
    getCampaignStats(db, { providerIdVariants: variants, since: weekSince }),
    getCampaignQuestions(db, { providerIdVariants: variants, since: weekSince }),
  ]);

  const outcomes = { client: 0, talking: 0, no: 0, unanswered: 0 };
  for (const lead of leads) {
    if (lead.outcome) outcomes[lead.outcome] += 1;
    else outcomes.unanswered += 1;
  }
  // This sensor is only asked on zero-attributed-lead wrap-ups today, so it
  // does not double-count a known lead outcome. Keeping it in the shared
  // receipt means a later visit to /provider/boost reflects the answer the
  // provider just gave instead of leaving the strongest proof admin-only.
  if (request.provider_reported_outcome) {
    outcomes[request.provider_reported_outcome] += 1;
  }

  const impressions = request.ad_impressions ?? null;
  const clicks = request.ad_clicks ?? null;
  const spendCents = request.ad_spend_cents ?? null;
  const ctr =
    impressions != null && impressions > 0 && clicks != null
      ? Math.round((clicks / impressions) * 1000) / 10
      : null;
  const cpcCents =
    spendCents != null && clicks != null && clicks > 0
      ? Math.round(spendCents / clicks)
      : null;

  return {
    google: { impressions, clicks, spendCents, ctr, cpcCents },
    engagement: {
      visitors: stats.visitors,
      saves,
      questionsReceived: questions.received,
    },
    leads,
    outcomes,
    expectedLeads:
      clicks != null ? Math.round((clicks / CLICKS_PER_LEAD_BENCHMARK) * 10) / 10 : null,
    week: {
      visitors: weekStats.visitors,
      questions: weekQuestions.received,
      leads: weekStats.leads,
    },
  };
}

/** Families who saved this provider to their shortlist since launch — a real
 *  action (not an impression event), so it earns a receipt line. Same
 *  since-launch time-window attribution as getCampaignStats. */
async function countSaves(
  db: ReturnType<typeof getServiceClient>,
  variants: string[],
  since: string,
): Promise<number> {
  if (variants.length === 0) return 0;
  const { count } = await db
    .from("provider_activity")
    .select("id", { count: "exact", head: true })
    .in("provider_id", variants)
    .eq("event_type", "provider_saved")
    .gte("created_at", since);
  return count ?? 0;
}
