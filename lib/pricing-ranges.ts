/**
 * Care cost estimation for the CTA enrichment experience.
 *
 * Uses two existing data sources:
 * 1. `public/data/metro-cost-factors.json` — geographic cost multipliers per city
 * 2. `lib/types/benefits.ts` — PROGRAM_SAVINGS_ESTIMATES for funding options
 *
 * National baselines are from the Genworth Cost of Care Survey (2024).
 * These are multiplied by the metro cost factor for the provider's city
 * to produce a localized "typical range."
 *
 * Note: if this data needs to live in a DB table for admin editing,
 * migrate to Supabase — the structure is ready for that.
 */

import { getSavingsRange } from "@/lib/types/benefits";

// ─── National baselines (Genworth 2024) ──────────────────────────────────────

export interface PricingRange {
  low: number;
  high: number;
  unit: "/mo" | "/hr";
  description: string;
  /** Care types where Medicare is a primary coverage source */
  medicareCoverage?: "full" | "partial" | null;
  /** Short message about Medicare for this care type */
  medicareNote?: string;
}

const NATIONAL_BASELINES: Record<string, PricingRange> = {
  "Assisted Living": {
    low: 3500, high: 6500, unit: "/mo",
    description: "Base rate plus care level add-ons based on daily living needs.",
  },
  "Memory Care": {
    low: 5000, high: 9000, unit: "/mo",
    description: "Specialized dementia and Alzheimer's support with 24/7 supervision.",
  },
  "Independent Living": {
    low: 1500, high: 4000, unit: "/mo",
    description: "Housing, amenities, and community activities with minimal care services.",
  },
  "Nursing Homes": {
    low: 7000, high: 12000, unit: "/mo",
    description: "24/7 skilled nursing, rehabilitation, and medical care.",
    medicareCoverage: "partial",
    medicareNote: "Medicare covers the first 20 days fully after a qualifying hospital stay, then partial coverage up to 100 days.",
  },
  "Senior Communities": {
    low: 2000, high: 5000, unit: "/mo",
    description: "Age-restricted housing with shared amenities and optional services.",
  },
  "Continuing Care Retirement Communities": {
    low: 3000, high: 8000, unit: "/mo",
    description: "Multiple care levels on one campus, from independent to skilled nursing.",
  },
  "Residential Care Homes": {
    low: 3000, high: 6000, unit: "/mo",
    description: "Small-home setting with personalized care for a few residents.",
  },
  "Adult Day Care": {
    low: 1200, high: 2500, unit: "/mo",
    description: "Daytime supervision, activities, and meals while caregivers work.",
  },
  "Respite Care": {
    low: 150, high: 400, unit: "/mo",
    description: "Short-term relief care so primary caregivers can take a break.",
  },
  "Home Care (Non-medical)": {
    low: 20, high: 35, unit: "/hr",
    description: "Personal care, companionship, light housekeeping, and meal preparation.",
  },
  "Home Health Care": {
    low: 25, high: 50, unit: "/hr",
    description: "Skilled nursing, physical therapy, and medical monitoring at home.",
    medicareCoverage: "full",
    medicareNote: "Often covered by Medicare at no cost when ordered by a doctor.",
  },
  "Hospice": {
    low: 0, high: 0, unit: "/mo",
    description: "End-of-life comfort care, typically covered by Medicare, Medicaid, or insurance.",
  },
};

// ─── Care type alias normalization ───────────────────────────────────────────

const CARE_TYPE_ALIASES: Record<string, string> = {
  "assisted living": "Assisted Living",
  "memory care": "Memory Care",
  "independent living": "Independent Living",
  "nursing homes": "Nursing Homes",
  "nursing home": "Nursing Homes",
  "skilled nursing": "Nursing Homes",
  "skilled nursing facility": "Nursing Homes",
  "senior communities": "Senior Communities",
  "senior apartments": "Senior Communities",
  "ccrc": "Continuing Care Retirement Communities",
  "continuing care": "Continuing Care Retirement Communities",
  "residential care": "Residential Care Homes",
  "residential care homes": "Residential Care Homes",
  "adult family home": "Residential Care Homes",
  "adult day care": "Adult Day Care",
  "adult day services": "Adult Day Care",
  "respite care": "Respite Care",
  "home care": "Home Care (Non-medical)",
  "home care (non-medical)": "Home Care (Non-medical)",
  "non-medical home care": "Home Care (Non-medical)",
  "in-home care": "Home Care (Non-medical)",
  "home health care": "Home Health Care",
  "home health": "Home Health Care",
  "hospice": "Hospice",
};

function resolveCareType(label: string): string | null {
  const normalized = label.toLowerCase().trim();
  if (CARE_TYPE_ALIASES[normalized]) return CARE_TYPE_ALIASES[normalized];
  // Direct match (case-insensitive)
  const directMatch = Object.keys(NATIONAL_BASELINES).find(
    (k) => k.toLowerCase() === normalized
  );
  return directMatch || null;
}

// ─── Metro cost factor loading ───────────────────────────────────────────────

let metroCostFactors: Record<string, number> | null = null;

async function loadMetroCostFactors(): Promise<Record<string, number>> {
  if (metroCostFactors) return metroCostFactors;
  try {
    const res = await fetch("/data/metro-cost-factors.json");
    metroCostFactors = await res.json();
    return metroCostFactors!;
  } catch {
    return {};
  }
}

function getMetroCostFactor(
  factors: Record<string, number>,
  city: string | null,
  state: string | null,
): number {
  if (!city || !state) return 1.0;
  const key = `${city}|${state}`;
  return factors[key] ?? 1.0;
}

// ─── Public API ──────────────────────────────────────────────────────────────

export interface PricingInfo {
  range: PricingRange | null;
  localizedRange: PricingRange | null;
  careTypeLabel: string | null;
  isHospice: boolean;
  medicareCoverage: "full" | "partial" | null;
  medicareNote: string | null;
  costFactor: number;
}

/**
 * Get pricing info for a provider's care types, localized by metro cost factor.
 * Uses national Genworth baselines adjusted by the geographic multiplier.
 */
export async function getPricingForProvider(
  careTypes: string[],
  city: string | null,
  state: string | null,
): Promise<PricingInfo> {
  const factors = await loadMetroCostFactors();
  const costFactor = getMetroCostFactor(factors, city, state);

  for (const ct of careTypes) {
    const canonical = resolveCareType(ct);
    if (canonical && NATIONAL_BASELINES[canonical]) {
      const base = NATIONAL_BASELINES[canonical];
      const localized: PricingRange = {
        low: Math.round(base.low * costFactor / 50) * 50, // Round to nearest $50
        high: Math.round(base.high * costFactor / 50) * 50,
        unit: base.unit,
        description: base.description,
      };
      return {
        range: base,
        localizedRange: localized,
        careTypeLabel: canonical,
        isHospice: canonical === "Hospice",
        medicareCoverage: base.medicareCoverage || null,
        medicareNote: base.medicareNote || null,
        costFactor,
      };
    }
  }

  return { range: null, localizedRange: null, careTypeLabel: null, isHospice: false, medicareCoverage: null, medicareNote: null, costFactor: 1.0 };
}

/**
 * Synchronous version for initial render (uses national baselines, no metro adjustment).
 * Use the async version when you have access to fetch.
 */
export function getPricingForProviderSync(
  careTypes: string[],
): { range: PricingRange | null; careTypeLabel: string | null; isHospice: boolean; medicareCoverage: "full" | "partial" | null; medicareNote: string | null } {
  for (const ct of careTypes) {
    const canonical = resolveCareType(ct);
    if (canonical && NATIONAL_BASELINES[canonical]) {
      const base = NATIONAL_BASELINES[canonical];
      return {
        range: base,
        careTypeLabel: canonical,
        isHospice: canonical === "Hospice",
        medicareCoverage: base.medicareCoverage || null,
        medicareNote: base.medicareNote || null,
      };
    }
  }
  return { range: null, careTypeLabel: null, isHospice: false, medicareCoverage: null, medicareNote: null };
}

/**
 * Format a pricing range for display.
 */
export function formatPricingRange(range: PricingRange): string | null {
  if (range.low === 0 && range.high === 0) return null;
  const low = range.low.toLocaleString("en-US");
  const high = range.high.toLocaleString("en-US");
  return `$${low} – $${high}${range.unit}`;
}

// ─── Funding options (references existing benefits infrastructure) ────────────

export interface FundingOption {
  label: string;
  monthlySavings: { low: number; high: number } | null;
  relevantTo: string; // short description of who this helps
}

/**
 * Get relevant funding options for care. Uses PROGRAM_SAVINGS_ESTIMATES
 * from the benefits system for savings ranges.
 */
export function getFundingOptions(): FundingOption[] {
  return [
    {
      label: "Long-term care insurance",
      monthlySavings: null, // varies by policy
      relevantTo: "Covers assisted living, memory care, and home care",
    },
    {
      label: "VA Aid & Attendance",
      monthlySavings: getSavingsRange("Aid & Attendance (A&A)"),
      relevantTo: "Veterans and surviving spouses needing daily assistance",
    },
    {
      label: "Medicaid",
      monthlySavings: getSavingsRange("Medicaid"),
      relevantTo: "Covers nursing home and some home care for eligible individuals",
    },
    {
      label: "Medicaid HCBS Waivers",
      monthlySavings: getSavingsRange("Medicaid Home and Community-Based Services (HCBS)"),
      relevantTo: "Home and community-based care as an alternative to facilities",
    },
    {
      label: "Medicare (limited)",
      monthlySavings: getSavingsRange("Medicare Savings Program (QMB)"),
      relevantTo: "Short-term skilled nursing and home health for recovery",
    },
  ];
}
