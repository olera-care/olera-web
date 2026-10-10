import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Page views on a provider's page in the last 30 days, across the ids a page
 * view can be filed under (profile id, slug, directory id). Null when it
 * can't be counted, so the email leaves the line out rather than guess.
 */
export async function monthlyPageViews(db: SupabaseClient, providerIds: Array<string | null | undefined>): Promise<number | null> {
  const ids = [...new Set(providerIds.filter((id): id is string => Boolean(id)))];
  if (!ids.length) return null;
  const since = new Date(Date.now() - 30 * 24 * 3600_000).toISOString();
  const { count, error } = await db.from("provider_activity")
    .select("id", { count: "exact", head: true })
    .in("provider_id", ids)
    .eq("event_type", "page_view")
    .gte("created_at", since);
  return error || typeof count !== "number" ? null : count;
}
