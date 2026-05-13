// Variant copy strings and labels for the CTA A/B test.
//
// Consumers:
//   1. /admin/analytics — ctaVariantLabel + ctaVariantSubLabel for the
//      traffic-allocation dial cards.
//
// Single source of truth so changing copy in one place updates every
// surface.

import type { CTAVariant } from "./cta-variant";

// Surface label for the admin UI. Maps the technical variant name to
// something a non-engineer reading the dashboard can scan.
export function ctaVariantLabel(variant: CTAVariant): string {
  switch (variant) {
    case "legacy":
      return "Legacy CTA";
    case "compare":
      return "Compare";
    case "guide":
      return "Guide";
    default: {
      // Exhaustive check — TypeScript will error if a variant is missing above
      const _exhaustive: never = variant;
      throw new Error(`Unknown CTA variant: ${_exhaustive}`);
    }
  }
}

// One-line description of what each arm puts in front of a visitor.
// Used as the small sublabel under the variant name in the traffic-
// allocation dial. Adding a new arm requires extending the switch;
// TypeScript will error on the exhaustive check if a case is missing.
export function ctaVariantSubLabel(variant: CTAVariant): string {
  switch (variant) {
    case "legacy":
      return "Current CTA design";
    case "compare":
      return "Compare with nearby providers";
    case "guide":
      return "PDF guide download";
    default: {
      // Exhaustive check — TypeScript will error if a variant is missing above
      const _exhaustive: never = variant;
      throw new Error(`Unknown CTA variant: ${_exhaustive}`);
    }
  }
}
