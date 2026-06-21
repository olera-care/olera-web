import { getServiceClient } from "@/lib/admin";

/**
 * Count families delivered by managed-ad campaigns — the Ad Boost ROI signal.
 *
 * A "delivered family" is a `benefits_completed` seeker_activity event whose
 * metadata carries the campaign's `utm_campaign` tag (set when the campaign goes
 * live and stamped onto the landing URL; see /admin/ad-boost + lib/ad-boost/utm).
 * This is the server-confirmed conversion — not a click — so it's the honest
 * number to show a provider before we ever charge.
 *
 * Returns a map of campaign_tag → delivered count. Tags with no completions are
 * present with 0. Scoped to `utm_source=olera_managed` so we only scan managed
 * traffic (cheap at pilot volume).
 */
export async function countDeliveredByCampaign(
  db: ReturnType<typeof getServiceClient>,
  tags: string[],
): Promise<Record<string, number>> {
  const result: Record<string, number> = {};
  const wanted = tags.filter((t): t is string => !!t);
  if (wanted.length === 0) return result;
  for (const t of wanted) result[t] = 0;

  const { data, error } = await db
    .from("seeker_activity")
    .select("metadata")
    .eq("event_type", "benefits_completed")
    .filter("metadata->>utm_source", "eq", "olera_managed")
    .limit(50000);

  if (error || !data) return result;

  for (const row of data as Array<{ metadata: { utm_campaign?: string } | null }>) {
    const tag = row.metadata?.utm_campaign;
    if (tag && tag in result) result[tag] += 1;
  }
  return result;
}

/**
 * Real campaign performance for the provider-facing live panel: how many people
 * visited this provider's page and how many converted into leads since the
 * campaign launched.
 *
 * This is deliberately DIFFERENT from countDeliveredByCampaign. That counts
 * `benefits_completed` conversions tagged with the campaign UTM — a side funnel
 * the live provider page mostly doesn't even surface, so for most campaigns it
 * reads ~0 while real inquiries arrive through the page's primary CTA. This
 * instead reads the page's actual traffic + conversion from provider_activity:
 *   visitors = session-deduped `page_view` events
 *   leads    = `lead_received` events (the CTA inquiry — the true conversion)
 *
 * Single-provider attribution by approximation: a managed campaign points only
 * at this provider's page, and a provider's organic baseline is typically ~zero,
 * so "traffic on the page since launch" ≈ campaign performance. Clean
 * per-campaign UTM attribution (for many providers running at once) is a
 * separate, later piece; this is the honest number for a single live campaign.
 *
 * `since` is an ISO timestamp (the campaign's launch anchor). provider_activity
 * keys on the URL slug, so pass the provider's slug (plus profile id as a
 * defensive fallback for legacy rows) as `providerIdVariants`.
 */
export interface CampaignStats {
  visitors: number;
  leads: number;
}

export async function getCampaignStats(
  db: ReturnType<typeof getServiceClient>,
  options: { providerIdVariants: string[]; since: string },
): Promise<CampaignStats> {
  const variants = options.providerIdVariants.filter(
    (v): v is string => typeof v === "string" && v.length > 0,
  );
  if (variants.length === 0) return { visitors: 0, leads: 0 };

  const { data, error } = await db
    .from("provider_activity")
    .select("event_type, metadata")
    .in("provider_id", variants)
    .in("event_type", ["page_view", "lead_received"])
    .gte("created_at", options.since)
    .limit(50000);

  if (error || !data) return { visitors: 0, leads: 0 };

  // Visitors = distinct session_id across page_view (mirrors the dedup the
  // analytics endpoint + nightly rollup use). Leads = lead_received count.
  const sessions = new Set<string>();
  let leads = 0;
  for (const row of data as Array<{
    event_type: string;
    metadata: Record<string, unknown> | null;
  }>) {
    if (row.event_type === "lead_received") {
      leads += 1;
    } else if (row.event_type === "page_view") {
      const sid = row.metadata?.session_id;
      if (typeof sid === "string" && sid.length > 0) sessions.add(sid);
    }
  }
  return { visitors: sessions.size, leads };
}

// UI care-need bucket → human label (mirror of CARE_NEED_LABELS in
// app/api/benefits/save-results). Kept tiny + local to avoid coupling.
const CARE_NEED_LABELS: Record<string, string> = {
  stayingAtHome: "in-home care",
  payingForCare: "paying for care",
  memoryHealth: "memory & medical care",
  companionship: "caregiver & social support",
};

/** One delivered family behind an Ad Boost campaign — the rows behind the count.
 *  Deliberately NO name / PHI: just date + care need + state + where it came in. */
export interface CampaignLead {
  created_at: string;
  careNeed: string | null;
  state: string | null;
  entrySource: string | null;
}

/**
 * List the families a campaign delivered (the `benefits_completed` conversions
 * tagged with its utm_campaign), newest first. These are the receipts behind
 * `countDeliveredByCampaign`. No PHI — care need + state + entry source only.
 */
export async function listLeadsByCampaign(
  db: ReturnType<typeof getServiceClient>,
  tag: string,
): Promise<CampaignLead[]> {
  if (!tag) return [];
  const { data, error } = await db
    .from("seeker_activity")
    .select("created_at, metadata")
    .eq("event_type", "benefits_completed")
    .filter("metadata->>utm_source", "eq", "olera_managed")
    .filter("metadata->>utm_campaign", "eq", tag)
    .order("created_at", { ascending: false })
    .limit(500);

  if (error || !data) return [];

  return (
    data as Array<{
      created_at: string;
      metadata: { care_need?: string; state?: string; entry_source?: string } | null;
    }>
  ).map((r) => ({
    created_at: r.created_at,
    careNeed: r.metadata?.care_need
      ? CARE_NEED_LABELS[r.metadata.care_need] ?? r.metadata.care_need
      : null,
    state: r.metadata?.state ?? null,
    entrySource: r.metadata?.entry_source ?? null,
  }));
}
