/**
 * Campus → university bridge. Cold-provider stabilization, Chunk 5
 * (2026-06-04).
 *
 * Two university registries exist and their slugs DIVERGE (e.g. Texas A&M is
 * `texas-am` in student_outreach_campuses / PARTNER_UNIVERSITIES but
 * `texas-a-m` in medjobs_universities). Students store
 * `metadata.university_id` referencing medjobs_universities. The magic-link
 * `?campus=<slug>` references the outreach/campus registry. So a naive
 * slug===slug join breaks on the flagship campus.
 *
 * The reliable join key is the NAME (identical across both registries). This
 * resolver maps a campus slug → the medjobs_universities row so the candidate
 * board can filter to the students who actually attend that university.
 *
 * (A slug reconciliation in the DB would let us key on slug directly — tracked
 * as optional cleanup in the stabilization plan — but name-matching is correct
 * today with zero schema/data change.)
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { getPartnerUniversity } from "@/lib/medjobs/catchment";

export interface CampusUniversity {
  university_id: string | null;
  university_name: string | null;
}

export async function resolveCampusUniversity(
  db: SupabaseClient,
  campusSlug: string,
): Promise<CampusUniversity> {
  const uni = getPartnerUniversity(campusSlug);
  if (!uni) return { university_id: null, university_name: null };

  // Primary: match by name (stable across the two registries' slug drift).
  const { data: byName } = await db
    .from("medjobs_universities")
    .select("id, name")
    .ilike("name", uni.name)
    .limit(1)
    .maybeSingle();
  if (byName) {
    return {
      university_id: byName.id as string,
      university_name: byName.name as string,
    };
  }

  // Fallback: slug equality (covers any campus whose slugs already align).
  const { data: bySlug } = await db
    .from("medjobs_universities")
    .select("id, name")
    .eq("slug", campusSlug)
    .limit(1)
    .maybeSingle();
  if (bySlug) {
    return {
      university_id: bySlug.id as string,
      university_name: bySlug.name as string,
    };
  }

  // Known campus, but no matching student registry row yet.
  return { university_id: null, university_name: uni.name };
}
