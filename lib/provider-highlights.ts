/**
 * Data-driven provider highlight generation.
 *
 * Replaces static per-category templates with a 5-tier priority waterfall
 * that surfaces verified, per-provider facts. Gracefully degrades to fewer
 * highlights when data is sparse — 1 honest highlight > 4 generic ones.
 */

import type {
  AiTrustSignals,
  CMSData,
  GoogleReviewsData,
  ProfileCategory,
} from "@/lib/types";

// ============================================================
// Types
// ============================================================

export type HighlightIconType =
  | "shield"    // licensed, clean record, medicare quality
  | "badge"     // accredited, bbb rated
  | "clock"     // years in operation / established
  | "star"      // highly rated (google reviews)
  | "check"     // background-checked, insured
  | "medical"   // health/medical capability
  | "house"     // home care capability
  | "people"    // community/social capability
  | "sparkle";  // generic fallback

export interface HighlightItem {
  label: string;
  icon: HighlightIconType;
}

export interface BuildHighlightsOpts {
  trustSignals?: AiTrustSignals | null;
  googleReviews?: GoogleReviewsData | null;
  cmsData?: CMSData | null;
  staffScreening?: {
    background_checked?: boolean;
    licensed?: boolean;
    insured?: boolean;
  } | null;
  careTypes?: string[] | null;
  category?: ProfileCategory | string | null;
  /** Max highlights to return. Default 4 (detail page). Use 3 for cards. */
  maxItems?: number;
  /** Skip Tier 5 capability label (use on browse cards where category is already visible). */
  skipCapability?: boolean;
}

// ============================================================
// Trust signal key → display label + icon
// ============================================================

const TRUST_SIGNAL_MAP: Record<string, { label: string; icon: HighlightIconType }> = {
  state_licensed:     { label: "State Licensed",  icon: "shield" },
  accredited:         { label: "Accredited",       icon: "badge" },
  bbb_rated:          { label: "BBB Rated",        icon: "badge" },
  regulatory_actions: { label: "Clean Record",     icon: "shield" },
  active_website:     { label: "Active Website",   icon: "sparkle" },
  google_business:    { label: "Google Verified",  icon: "check" },
  community_presence: { label: "Community Presence", icon: "people" },
};

// ============================================================
// Category → capability label (Tier 5 fallback, max 1 item)
// ============================================================

const CATEGORY_CAPABILITY: Record<string, { label: string; icon: HighlightIconType }> = {
  // ProfileCategory enum values
  home_care_agency:    { label: "In-Home Care",       icon: "house" },
  home_health_agency:  { label: "Skilled Nursing",     icon: "medical" },
  hospice_agency:      { label: "Hospice Care",        icon: "medical" },
  inpatient_hospice:   { label: "Inpatient Hospice",   icon: "medical" },
  assisted_living:     { label: "Assisted Living",     icon: "people" },
  memory_care:         { label: "Memory Care",         icon: "medical" },
  independent_living:  { label: "Community Living",    icon: "people" },
  nursing_home:        { label: "Skilled Nursing",     icon: "medical" },
  rehab_facility:      { label: "Rehabilitation",      icon: "medical" },
  adult_day_care:      { label: "Adult Day Care",      icon: "people" },
  wellness_center:     { label: "Wellness Programs",   icon: "people" },
  private_caregiver:   { label: "Private Caregiver",   icon: "house" },
  // Supabase provider_category strings (used by toCardFormat)
  "Home Care (Non-medical)": { label: "In-Home Care",       icon: "house" },
  "Home Health Care":        { label: "Skilled Nursing",     icon: "medical" },
  "Hospice":                 { label: "Hospice Care",        icon: "medical" },
  "Assisted Living":         { label: "Assisted Living",     icon: "people" },
  "Memory Care":             { label: "Memory Care",         icon: "medical" },
  "Independent Living":      { label: "Community Living",    icon: "people" },
  "Nursing Home":            { label: "Skilled Nursing",     icon: "medical" },
};

// ============================================================
// Synonym normalization for care_types labels
// ============================================================

const SYNONYM_MAP: Record<string, string> = {
  // Home care variants
  "home care (non-medical)": "Home Care",
  "non-medical home care": "Home Care",
  "home care": "Home Care",
  "homecare": "Home Care",
  "in-home care": "In-Home Care",
  "in home care": "In-Home Care",
  "inhome care": "In-Home Care",

  // Home health variants
  "home health care": "Home Health",
  "home health": "Home Health",
  "homehealth": "Home Health",

  // Nursing home variants
  "skilled nursing facility": "Nursing Home",
  "skilled nursing": "Skilled Nursing",
  "snf": "Nursing Home",
  "nursing home": "Nursing Home",
  "nursing facility": "Nursing Home",

  // Assisted living variants
  "assisted living": "Assisted Living",
  "assisted living facility": "Assisted Living",
  "assisted living community": "Assisted Living",

  // Memory care variants
  "memory care": "Memory Care",
  "memory care community": "Memory Care",
  "memory care facility": "Memory Care",
  "dementia care": "Memory Care",
  "alzheimer's care": "Memory Care",
  "alzheimers care": "Memory Care",

  // Hospice variants
  "hospice": "Hospice",
  "hospice care": "Hospice",
  "hospice agency": "Hospice",
  "palliative care": "Palliative Care",

  // Independent living variants
  "independent living": "Independent Living",
  "independent living community": "Independent Living",
  "senior living": "Senior Living",
  "senior living community": "Senior Living",

  // Rehab variants
  "rehabilitation": "Rehabilitation",
  "rehab": "Rehabilitation",
  "rehab facility": "Rehabilitation",

  // Other common labels
  "adult day care": "Adult Day Care",
  "adult day services": "Adult Day Care",
  "respite care": "Respite Care",
  "companion care": "Companion Care",
  "companionship": "Companion Care",
  "personal care": "Personal Care",
  "personal care assistance": "Personal Care",
  "medication management": "Medication Management",
  "medication reminders": "Medication Management",
  "physical therapy": "Physical Therapy",
  "occupational therapy": "Occupational Therapy",
  "speech therapy": "Speech Therapy",
  "transportation": "Transportation",
  "transportation services": "Transportation",
  "meal preparation": "Meal Preparation",
  "housekeeping": "Housekeeping",
  "light housekeeping": "Housekeeping",
};

/**
 * Normalize a care service/type label to its canonical form.
 * Returns the original label (title-cased) if no synonym match.
 */
export function normalizeCareLabel(label: string): string {
  const key = label.trim().toLowerCase();
  return SYNONYM_MAP[key] ?? label.trim();
}

// ============================================================
// Main highlight builder
// ============================================================

/**
 * Build provider highlights using a 5-tier priority waterfall.
 *
 * Tier 1: AI Trust Signals (confirmed) — "State Licensed", "Accredited", "BBB Rated", "Clean Record"
 * Tier 2: Longevity + Social Proof — "Est. 2008", "Highly Rated"
 * Tier 3: CMS Medicare Quality — "Medicare Quality: 5/5"
 * Tier 4: Staff Screening — "Background-Checked", "Licensed", "Insured"
 * Tier 5: One capability label — "Home Care", "Skilled Nursing" (max 1, normalized)
 *
 * Stops filling when we run out of verified data. Fewer honest > more generic.
 */
export function buildHighlights(opts: BuildHighlightsOpts): HighlightItem[] {
  const maxItems = opts.maxItems ?? 4;
  const items: HighlightItem[] = [];
  const seen = new Set<string>(); // dedup by lowercase label

  function push(item: HighlightItem): boolean {
    if (items.length >= maxItems) return false;
    const key = item.label.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    items.push(item);
    return true;
  }

  // ── Tier 1: AI Trust Signals (confirmed only) ──
  if (opts.trustSignals?.signals) {
    // Priority order: licensed > accredited > bbb > clean record
    const priorityOrder = ["state_licensed", "accredited", "bbb_rated", "regulatory_actions"];

    for (const signalKey of priorityOrder) {
      if (items.length >= maxItems) break;
      const signal = opts.trustSignals.signals.find(
        (s) => s.signal === signalKey && s.status === "confirmed"
      );
      if (signal) {
        const mapped = TRUST_SIGNAL_MAP[signalKey];
        if (mapped) push(mapped);
      }
    }
  }

  // ── Tier 2: Longevity + Social Proof ──

  // Years in operation → "Est. YYYY"
  if (items.length < maxItems && opts.trustSignals?.signals) {
    const yearsSignal = opts.trustSignals.signals.find(
      (s) => s.signal === "years_in_operation" && s.status === "confirmed" && s.detail
    );
    if (yearsSignal?.detail) {
      // Extract 4-digit year from detail string (e.g., "Founded in 2008", "Since 2008", "2008")
      const yearMatch = yearsSignal.detail.match(/\b(19|20)\d{2}\b/);
      if (yearMatch) {
        push({ label: `Est. ${yearMatch[0]}`, icon: "clock" });
      }
    }
  }

  // Google reviews → "Highly Rated" or "Well Reviewed"
  if (items.length < maxItems && opts.googleReviews) {
    const { rating, review_count } = opts.googleReviews;
    if (rating >= 4.5 && review_count >= 10) {
      push({ label: "Highly Rated", icon: "star" });
    } else if (rating >= 4.0 && review_count >= 15) {
      push({ label: "Well Reviewed", icon: "star" });
    }
  }

  // ── Tier 3: CMS Medicare Quality (5-star only in highlights) ──
  if (
    items.length < maxItems &&
    opts.cmsData?.overall_rating != null &&
    opts.cmsData.overall_rating === 5
  ) {
    push({ label: "Medicare Quality: 5/5", icon: "shield" });
  }

  // ── Tier 4: Staff Screening ──
  if (items.length < maxItems && opts.staffScreening) {
    if (opts.staffScreening.background_checked) {
      push({ label: "Background-Checked", icon: "check" });
    }
    if (opts.staffScreening.licensed) {
      push({ label: "Licensed", icon: "shield" });
    }
    if (opts.staffScreening.insured) {
      push({ label: "Insured", icon: "check" });
    }
  }

  // ── Tier 5: One capability label (max 1) ──
  // Skipped on browse cards where category is already visible in the card header.
  if (!opts.skipCapability && items.length < maxItems) {
    // Try care_types first (normalized)
    if (opts.careTypes && opts.careTypes.length > 0) {
      const normalized = normalizeCareLabel(opts.careTypes[0]);
      push({ label: normalized, icon: getCapabilityIcon(normalized) });
    }
    // Fall back to category-inferred capability
    else if (opts.category) {
      const cap = CATEGORY_CAPABILITY[opts.category as string];
      if (cap) push(cap);
    }
  }

  return items;
}

/**
 * Infer an icon for a capability label (Tier 5).
 */
function getCapabilityIcon(label: string): HighlightIconType {
  const lower = label.toLowerCase();
  if (lower.includes("home") || lower.includes("housekeep")) return "house";
  if (lower.includes("nurs") || lower.includes("health") || lower.includes("medic") || lower.includes("hospice") || lower.includes("rehab") || lower.includes("therapy")) return "medical";
  if (lower.includes("companion") || lower.includes("communit") || lower.includes("social") || lower.includes("living") || lower.includes("day care")) return "people";
  return "sparkle";
}
