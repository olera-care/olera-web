import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Liberalized MedJobs search resolution (v10).
 *
 * Shared by every surface that filters `student_outreach` rows by a free-text
 * admin query — the In Basket queue endpoint, the dedicated entity list pages
 * (which reuse the queue endpoint), and the Partners endpoint. Centralizing
 * "which rows match the text?" in one place means the notion of searchability
 * stays consistent everywhere and expanding it is a one-line change here
 * rather than an edit across a half-dozen scattered `.ilike` call sites.
 *
 * Given a raw term, resolves the full set of `student_outreach.id`s whose text
 * matches across every reasonable surface an admin would type:
 *   - the organization name,
 *   - the on-row research emails (general-contact email, decision-maker
 *     name/email, official email — all JSONB on `research_data`), and
 *   - any active `student_outreach_contacts` record (name / first / last /
 *     email).
 *
 * Callers intersect the returned IDs with their own status/campus/type scoping
 * via `.in("id", …)`, so this resolver deliberately applies NO campus/type
 * filter — every consumer re-applies those alongside the `.in`, making scoping
 * here redundant work.
 *
 * Returns a de-duplicated array. `[]` means "searched, matched nothing" — the
 * caller should render an empty list (and skip the `.in()`, since an empty
 * `in.()` is a no-op set anyway). Each source is capped so a broad term can't
 * produce a pathological `.in()` payload.
 */
export async function resolveOutreachSearchIds(
  db: SupabaseClient,
  rawSearch: string,
): Promise<string[]> {
  // PostgREST `.or()` treats , . ( ) as structural delimiters; % and * are
  // ilike wildcards. Strip the characters that could corrupt the filter
  // string or inject a wildcard (real names/emails never legitimately contain
  // them). If nothing usable remains, treat it as a no-match rather than an
  // unfiltered query. `%…%` matches the repo-wide `.or()` convention.
  const term = rawSearch.replace(/[,()%*\\"]/g, " ").trim();
  if (!term) return [];
  const like = `%${term}%`;
  const ids = new Set<string>();

  // Source 1 — the outreach row itself: org name + JSONB research fields.
  //
  // Decision makers live in TWO stores (see lib/student-outreach/decision-
  // makers.ts): the current `decision_makers` PLURAL array and the legacy
  // `decision_maker` SINGULAR object. PostgREST can't `ilike` into individual
  // array elements, so we match each store as a whole via `->>` — which
  // returns the value's JSON text — letting the pattern hit any name / email /
  // role inside it. (A term that happens to be a bare JSON key like "email"
  // or "role" will over-match here, but real name/email searches are precise;
  // this is the trade for making decision-maker NAMES searchable at all.)
  const { data: rowMatches } = await db
    .from("student_outreach")
    .select("id")
    .or(
      [
        `organization_name.ilike.${like}`,
        `research_data->>official_email.ilike.${like}`,
        `research_data->general_contact->>email.ilike.${like}`,
        `research_data->>decision_makers.ilike.${like}`,
        `research_data->>decision_maker.ilike.${like}`,
      ].join(","),
    )
    .limit(1000);
  for (const r of (rowMatches ?? []) as Array<{ id: string }>) ids.add(r.id);

  // Source 2 — named contacts (mapped back to their outreach_id). Only active
  // contacts match; dropped ones shouldn't surface their row.
  const { data: contactMatches } = await db
    .from("student_outreach_contacts")
    .select("outreach_id")
    .eq("status", "active")
    .or(
      [
        `name.ilike.${like}`,
        `first_name.ilike.${like}`,
        `last_name.ilike.${like}`,
        `email.ilike.${like}`,
      ].join(","),
    )
    .limit(1000);
  for (const c of (contactMatches ?? []) as Array<{ outreach_id: string }>)
    ids.add(c.outreach_id);

  return Array.from(ids);
}
