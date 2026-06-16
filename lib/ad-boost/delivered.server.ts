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
