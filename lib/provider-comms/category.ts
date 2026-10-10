import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProviderCategory } from "@/lib/email-templates";
import { primaryProviderCategory } from "@/lib/types/provider";

/**
 * business_profiles.category as one of the building emails' categories, or
 * null. Most claimed profiles hold the code ("home_care_agency"); about 110
 * older ones hold the directory's display name ("Home Care (Non-medical)",
 * "Assisted Living | Memory Care"), which would otherwise be skipped.
 */
const CODES = new Set<ProviderCategory>([
  "home_health_agency", "home_care_agency", "assisted_living", "memory_care", "nursing_home", "independent_living",
]);

const DISPLAY_NAMES: Record<string, ProviderCategory> = {
  "Home Care (Non-medical)": "home_care_agency",
  "Home Health Care": "home_health_agency",
  "Assisted Living": "assisted_living",
  "Independent Living": "independent_living",
  "Memory Care": "memory_care",
  "Nursing Home": "nursing_home",
};

export function buildingCategory(raw: string | null | undefined): ProviderCategory | null {
  if (!raw) return null;
  if (CODES.has(raw as ProviderCategory)) return raw as ProviderCategory;
  return DISPLAY_NAMES[primaryProviderCategory(raw)] ?? null;
}

const FACILITIES = new Set<ProviderCategory>(["assisted_living", "memory_care", "nursing_home", "independent_living"]);

/** Facilities house residents; home care and home health agencies go to the family. */
export function isFacilityCategory(category: ProviderCategory | null): boolean {
  return category !== null && FACILITIES.has(category);
}

/**
 * The profile's category, falling back to its directory listing. On 10 Oct
 * 2026, 90 of the first 191 building-stage profiles had no category of their
 * own but a directory row that did ("Assisted Living", "Home Health Care"):
 * without the fallback the services email skipped them and facilities missed
 * the photos email.
 */
export async function resolveBuildingCategory(
  db: SupabaseClient,
  profile: { category?: string | null; source_provider_id?: string | null },
): Promise<ProviderCategory | null> {
  const own = buildingCategory(profile.category ?? null);
  if (own || !profile.source_provider_id) return own;
  const { data, error } = await db.from("olera-providers")
    .select("provider_category")
    .eq("provider_id", profile.source_provider_id)
    .maybeSingle();
  if (error || !data) return null;
  return buildingCategory((data as { provider_category?: string | null }).provider_category ?? null);
}
