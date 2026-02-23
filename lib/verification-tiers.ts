import type { Profile } from "@/lib/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type VerificationTier = 1 | 2 | 3;

export interface VerificationStep {
  id: string;
  tier: VerificationTier;
  label: string;
  description: string;
  completed: boolean;
  /** Where to go to complete this step, or null if auto / coming soon */
  href: string | null;
  comingSoon: boolean;
}

export interface VerificationStatus {
  /** Highest tier where ALL steps (in that tier and below) are complete. */
  currentTier: VerificationTier;
  /** 0–1 fractional progress across Tier 2 steps. */
  tier2Progress: number;
  steps: VerificationStep[];
}

// ---------------------------------------------------------------------------
// Tier configuration
// ---------------------------------------------------------------------------

const TIER_LABELS: Record<VerificationTier, string> = {
  1: "Confirmed",
  2: "Profile Complete",
  3: "Verified",
};

export { TIER_LABELS };

// ---------------------------------------------------------------------------
// Computation
// ---------------------------------------------------------------------------

export function computeVerificationStatus(
  profile: Profile,
  emailConfirmed: boolean,
): VerificationStatus {
  const steps: VerificationStep[] = [
    // ── Tier 1: Confirmed ──
    {
      id: "email_verified",
      tier: 1,
      label: "Email verified",
      description: "Your email address has been confirmed",
      completed: emailConfirmed,
      href: null,
      comingSoon: false,
    },
    {
      id: "profile_claimed",
      tier: 1,
      label: "Profile claimed",
      description:
        profile.claim_state === "pending"
          ? "Your claim is being reviewed"
          : "You've claimed ownership of this listing",
      completed: profile.claim_state === "claimed",
      href: null,
      comingSoon: false,
    },

    // ── Tier 2: Profile Complete ──
    {
      id: "contact_phone",
      tier: 2,
      label: "Phone number",
      description: "Add a phone number so families can reach you",
      completed: !!profile.phone?.trim(),
      href: "/provider",
      comingSoon: false,
    },
    {
      id: "contact_email",
      tier: 2,
      label: "Contact email",
      description: "Add a public contact email for inquiries",
      completed: !!profile.email?.trim(),
      href: "/provider",
      comingSoon: false,
    },
    {
      id: "profile_photo",
      tier: 2,
      label: "Profile photo",
      description: "Upload a photo to help families recognize you",
      completed: !!profile.image_url?.trim(),
      href: "/provider",
      comingSoon: false,
    },
    {
      id: "business_location",
      tier: 2,
      label: "Business location",
      description: "Set your city and state so families can find you",
      completed: !!profile.city?.trim() && !!profile.state?.trim(),
      href: "/provider",
      comingSoon: false,
    },
    {
      id: "about_description",
      tier: 2,
      label: "About section",
      description: "Write at least 50 characters about your services",
      completed: (profile.description?.trim().length ?? 0) >= 50,
      href: "/provider",
      comingSoon: false,
    },

    // ── Tier 3: Verified (coming soon) ──
    {
      id: "id_document",
      tier: 3,
      label: "Identity document",
      description: "Upload a government-issued ID for verification",
      completed: false,
      href: null,
      comingSoon: true,
    },
    {
      id: "background_check",
      tier: 3,
      label: "Background check",
      description: "Complete a background check to earn full verification",
      completed: false,
      href: null,
      comingSoon: true,
    },
  ];

  // Determine current tier (highest tier where ALL non-comingSoon steps are complete)
  const tier1Steps = steps.filter((s) => s.tier === 1);
  const tier2Steps = steps.filter((s) => s.tier === 2);

  const tier1Complete = tier1Steps.every((s) => s.completed);
  const tier2Complete = tier2Steps.every((s) => s.completed);

  const tier2CompletedCount = tier2Steps.filter((s) => s.completed).length;
  const tier2Progress =
    tier2Steps.length > 0 ? tier2CompletedCount / tier2Steps.length : 0;

  let currentTier: VerificationTier = 1;
  if (tier1Complete && tier2Complete) {
    currentTier = 2;
  } else if (!tier1Complete) {
    currentTier = 1;
  }

  return { currentTier, tier2Progress, steps };
}
