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
