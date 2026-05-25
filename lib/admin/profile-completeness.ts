/**
 * Profile completeness calculations for admin views.
 *
 * These are server-side versions of the completeness checks, used in admin
 * analytics to show how complete a family's or provider's profile is.
 * This helps admins identify who to nudge and what action to suggest.
 */

import type { BusinessProfile, FamilyMetadata, OrganizationMetadata } from "@/lib/types";

export interface ProfileCompletenessResult {
  percentage: number;
  /** List of missing key fields (for display/nudge messaging) */
  missingFields: string[];
}

// ============================================================
// Family Profile Completeness
// ============================================================

/**
 * Calculate family profile completeness.
 *
 * Based on the user-facing completeness in components/portal/profile/completeness.ts
 * but simplified for admin display (just percentage + missing fields).
 *
 * Weights are optimized for enrichment flow completion:
 * - Higher weights for fields collected during enrichment (Steps 1-5)
 * - Lower weights for fields not in enrichment flow
 * - Name split: 5 for placeholder "Care Seeker", +5 bonus for real name
 * - Auto-filled fields (city, care_types) valued for Go Live requirements
 */
export function calculateFamilyCompleteness(
  profile: {
    display_name?: string | null;
    image_url?: string | null;
    phone?: string | null;
    city?: string | null;
    description?: string | null;
    care_types?: string[] | null;
    metadata?: FamilyMetadata | null;
  },
  email?: string | null
): ProfileCompletenessResult {
  const meta = (profile.metadata as FamilyMetadata) ?? {};
  const missingFields: string[] = [];

  // Check if name is a real name (not placeholder - case insensitive)
  const hasRealName = !!profile.display_name && profile.display_name.toLowerCase() !== "care seeker";

  // Field weights - prioritized for enrichment flow and provider value
  // Total: 100 points
  const checks: Array<{ weight: number; field: string; check: () => boolean }> = [
    // Basic Info (20 total)
    { weight: 2, field: "Photo", check: () => !!profile.image_url },
    { weight: 5, field: "Name", check: () => !!profile.display_name }, // Placeholder counts
    { weight: 5, field: "Real Name", check: () => hasRealName }, // Bonus for real name
    { weight: 8, field: "Location", check: () => !!profile.city }, // Required for Go Live
    // Contact (24 total)
    { weight: 10, field: "Email", check: () => !!email },
    { weight: 12, field: "Phone", check: () => !!profile.phone }, // Enrichment Step 5
    { weight: 2, field: "Contact Preference", check: () => !!meta.contact_preference },
    // Care Recipient (16 total)
    { weight: 10, field: "Relationship", check: () => !!meta.relationship_to_recipient || !!meta.who_needs_care }, // Enrichment Step 1
    { weight: 2, field: "Care Recipient Age", check: () => !!meta.age },
    { weight: 4, field: "Situation Description", check: () => !!profile.description || !!meta.about_situation },
    // Care Needs (28 total)
    { weight: 8, field: "Care Types", check: () => (profile.care_types?.length ?? 0) > 0 }, // Required for Go Live
    { weight: 6, field: "Care Needs", check: () => (meta.care_needs?.length ?? 0) > 0 }, // Enrichment Step 3
    { weight: 12, field: "Timeline", check: () => !!meta.timeline }, // Enrichment Step 2
    { weight: 2, field: "Schedule Preference", check: () => !!meta.schedule_preference },
    // Payment (12 total)
    { weight: 12, field: "Payment Methods", check: () => (meta.payment_methods?.length ?? 0) > 0 }, // Enrichment Step 4
  ];

  let earned = 0;
  for (const { weight, field, check } of checks) {
    if (check()) {
      earned += weight;
    } else {
      missingFields.push(field);
    }
  }

  return {
    percentage: Math.min(earned, 100),
    missingFields,
  };
}

// ============================================================
// Provider (Organization) Profile Completeness
// ============================================================

/**
 * Calculate provider profile completeness.
 *
 * Weights are designed to encourage providers to complete fields that
 * matter most for trust and lead conversion:
 * - Contact info (email, phone) - critical for leads
 * - Photo - improves trust
 * - Description - improves SEO and trust
 * - Pricing - families want to know costs
 * - License info - trust signal
 */
export function calculateProviderCompleteness(
  profile: {
    display_name?: string | null;
    image_url?: string | null;
    phone?: string | null;
    email?: string | null;
    website?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    description?: string | null;
    care_types?: string[] | null;
    metadata?: OrganizationMetadata | null;
  }
): ProfileCompletenessResult {
  const meta = (profile.metadata as OrganizationMetadata) ?? {};
  const missingFields: string[] = [];

  // Field weights - prioritize what matters for lead conversion
  const checks: Array<{ weight: number; field: string; check: () => boolean }> = [
    // Contact (35 total) - most critical for receiving leads
    { weight: 15, field: "Email", check: () => !!profile.email },
    { weight: 12, field: "Phone", check: () => !!profile.phone },
    { weight: 8, field: "Website", check: () => !!profile.website },

    // Trust signals (25 total)
    { weight: 12, field: "Photo", check: () => !!profile.image_url },
    { weight: 8, field: "License Number", check: () => !!meta.license_number },
    { weight: 5, field: "Year Founded", check: () => !!meta.year_founded },

    // Content (20 total)
    { weight: 12, field: "Description", check: () => !!profile.description && profile.description.length > 50 },
    { weight: 8, field: "Care Types", check: () => (profile.care_types?.length ?? 0) > 0 },

    // Location (10 total)
    { weight: 5, field: "Address", check: () => !!profile.address },
    { weight: 3, field: "City", check: () => !!profile.city },
    { weight: 2, field: "State", check: () => !!profile.state },

    // Pricing (10 total)
    {
      weight: 10,
      field: "Pricing",
      check: () => !!(meta.price_range || meta.lower_price || meta.contact_for_pricing),
    },
  ];

  let earned = 0;
  for (const { weight, field, check } of checks) {
    if (check()) {
      earned += weight;
    } else {
      missingFields.push(field);
    }
  }

  return {
    percentage: Math.min(earned, 100),
    missingFields,
  };
}
