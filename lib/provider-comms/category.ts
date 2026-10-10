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
