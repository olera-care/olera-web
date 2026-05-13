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

  // Field weights (same as user-facing version)
  const checks: Array<{ weight: number; field: string; check: () => boolean }> = [
    // Basic Info
    { weight: 15, field: "Photo", check: () => !!profile.image_url },
    { weight: 5, field: "Name", check: () => !!profile.display_name },
    { weight: 5, field: "Location", check: () => !!profile.city },
    // Contact
    { weight: 10, field: "Email", check: () => !!email },
    { weight: 10, field: "Phone", check: () => !!profile.phone },
    { weight: 5, field: "Contact Preference", check: () => !!meta.contact_preference },
    // Care Recipient
    { weight: 5, field: "Relationship", check: () => !!meta.relationship_to_recipient },
    { weight: 5, field: "Care Recipient Age", check: () => !!meta.age },
    { weight: 5, field: "Situation Description", check: () => !!profile.description },
    // Care Needs
    { weight: 5, field: "Care Types", check: () => (profile.care_types?.length ?? 0) > 0 },
    { weight: 4, field: "Care Needs", check: () => (meta.care_needs?.length ?? 0) > 0 },
    { weight: 3, field: "Timeline", check: () => !!meta.timeline },
    { weight: 3, field: "Schedule Preference", check: () => !!meta.schedule_preference },
    // Payment
    { weight: 20, field: "Payment Methods", check: () => (meta.payment_methods?.length ?? 0) > 0 },
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
