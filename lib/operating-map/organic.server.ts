import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * CR2 — organic visitors.
 *
 * "Organic" is `referrer_class = 'search'`, the same bucket GA calls Organic
 * Search. AI chat referrals are classified separately by
 * `lib/analytics/referrer.ts` and are deliberately NOT counted here, so this
 * number stays comparable to the GA figure it is meant to be read against.
 *
 * "Visitors", precisely: distinct `olera_session` ids. That cookie is a
 * 30-day sliding id (see lib/analytics/session.ts), so it identifies a
 * returning person, not a GA-style 30-minute session. Compare this to GA4
 * Organic Search *users*; comparing it to GA sessions will always read low,
 * because one person visiting twice in a day is two sessions and one visitor.
 *
 * The population is the same one CR4 covers — provider pages plus the
 * editorial and benefits content pages — which the platform splits across two
 * tables with two different shapes:
 *
 *   provider_activity  visitor id in metadata->>session_id
 *   page_events        visitor id in a top-level session_id column
 *
 * Ids are unioned across both, so someone who read a benefits guide and then
 * a provider page counts once.
 */

/** Traffic class that counts as organic. Kept explicit — see the note above. */
const ORGANIC_REFERRER_CLASS = "search";

const PAGE_SIZE = 1000;

/**
 * Ceiling on rows scanned per table. Distinct sessions cannot be counted in
 * the database through PostgREST, so the rows have to come back to be
 * de-duplicated here. If this trips the result is a floor and says so.
 */
const MAX_ROWS = 150_000;

/**
 * The date `lib/analytics/referrer.ts` shipped. Page views recorded before
 * this carry no `referrer_class`, so they can never match and simply do not
 * count. A range reaching back past this looks like a collapse in organic
 * traffic when it is really the absence of instrumentation — callers must
 * surface `partialInstrumentation` rather than present the number bare.
 */
export const REFERRER_INSTRUMENTATION_START = "2026-08-12";

/**
 * The date visitor city started being recorded on page events. Before this
 * no event carries a city, so a city-scoped count over an earlier range is
 * structurally zero rather than genuinely quiet.
 */
export const VISITOR_GEO_START = "2026-09-06";

export interface OrganicVisitors {
  /** Distinct visitors with at least one organic page view. */
  value: number;
  /** A row ceiling was hit, so `value` is a floor. */
  truncated: boolean;
  /** The range reaches back before referrer classification existed. */
  partialInstrumentation: boolean;
  /** The range reaches back before visitor city was recorded. */
  partialCityData: boolean;
}

async function collectSessions(
  db: SupabaseClient,
  table: "provider_activity" | "page_events",
  sessions: Set<string>,
  from: string | null,
  to: string | null,
  citySlug: string | null,
): Promise<boolean> {
  let scanned = 0;

  for (;;) {
    if (scanned >= MAX_ROWS) return true;

    // Both tables keep referrer_class in metadata; only the session id moved.
    // Aliasing the JSON path keeps the payload to one short string per row
    // instead of dragging the whole metadata object back.
    let query = db
      .from(table)
      .select(table === "page_events" ? "sid:session_id" : "sid:metadata->>session_id")
      .eq("event_type", "page_view")
      .filter("metadata->>referrer_class", "eq", ORGANIC_REFERRER_CLASS);

    // Visitor city, recorded from Vercel's edge headers since VISITOR_GEO_START.
    if (citySlug) query = query.filter("metadata->>geo_city", "eq", citySlug);
    if (from) query = query.gte("created_at", from);
    if (to) query = query.lt("created_at", to);

    const { data, error } = await query.range(scanned, scanned + PAGE_SIZE - 1);
    if (error) throw error;

    const rows = (data ?? []) as unknown as { sid: string | null }[];
    if (rows.length === 0) return false;

    for (const row of rows) {
      if (typeof row.sid === "string" && row.sid.length > 0) sessions.add(row.sid);
    }

    scanned += rows.length;
    if (rows.length < PAGE_SIZE) return false;
  }
}

/**
 * Distinct organic visitors in a date range, optionally in one city.
 *
 * The city is the visitor's own location, resolved at the edge — not the
 * market a page is about. Someone in Chicago reading about Houston providers
 * counts as Chicago.
 */
export async function getOrganicVisitors(
  db: SupabaseClient,
  range: { from: string | null; to: string | null },
  citySlug: string | null = null,
): Promise<OrganicVisitors> {
  const sessions = new Set<string>();

  const truncatedProvider = await collectSessions(
    db,
    "provider_activity",
    sessions,
    range.from,
    range.to,
    citySlug,
  );
  const truncatedContent = await collectSessions(
    db,
    "page_events",
    sessions,
    range.from,
    range.to,
    citySlug,
  );

  return {
    value: sessions.size,
    truncated: truncatedProvider || truncatedContent,
    partialInstrumentation:
      !range.from || range.from < REFERRER_INSTRUMENTATION_START,
    partialCityData:
      Boolean(citySlug) && (!range.from || range.from < VISITOR_GEO_START),
  };
}
