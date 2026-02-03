"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { ProfileType, ProfileCategory } from "@/lib/types";
import IntentStep from "@/components/onboarding/IntentStep";
import ProfileInfoStep from "@/components/onboarding/ProfileInfoStep";
import OrgClaimStep from "@/components/onboarding/OrgClaimStep";

export interface OnboardingData {
  intent: ProfileType | null;
  displayName: string;
  category: ProfileCategory | null;
  city: string;
  state: string;
  zip: string;
  careTypes: string[];
  // Family-specific
  timeline: string;
  relationshipToRecipient: string;
  // Org claim
  claimedProfileId: string | null;
}

const INITIAL_DATA: OnboardingData = {
  intent: null,
  displayName: "",
  category: null,
  city: "",
  state: "",
  zip: "",
  careTypes: [],
  timeline: "",
  relationshipToRecipient: "",
  claimedProfileId: null,
};

type Step = "intent" | "profile-info" | "org-claim";

export default function OnboardingPage() {
  const { user, account, refreshAccountData } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<Step>("intent");
  const [data, setData] = useState<OnboardingData>(INITIAL_DATA);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const updateData = (partial: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...partial }));
  };

  const handleIntentSelected = (intent: ProfileType) => {
    updateData({ intent });
    setStep("profile-info");
  };

  const handleProfileInfoComplete = () => {
    if (data.intent === "organization" && !data.claimedProfileId) {
      setStep("org-claim");
    } else {
      handleSubmit();
    }
  };

  const handleClaimComplete = (claimedProfileId: string | null) => {
    updateData({ claimedProfileId });
    handleSubmit(claimedProfileId);
  };

  const handleSubmit = async (claimedId?: string | null) => {
    if (!user || !account || !isSupabaseConfigured()) return;
    setSubmitting(true);
    setError("");

    try {
      const supabase = createClient();
      const profileId = claimedId ?? data.claimedProfileId;

      if (profileId) {
        // Claiming an existing seeded profile
        const { error: claimError } = await supabase
          .from("profiles")
          .update({
            account_id: account.id,
            claim_state: "claimed" as const,
            display_name: data.displayName || undefined,
            city: data.city || undefined,
            state: data.state || undefined,
            zip: data.zip || undefined,
            care_types: data.careTypes.length > 0 ? data.careTypes : undefined,
          })
          .eq("id", profileId);

        if (claimError) throw claimError;

        // Set as active profile and mark onboarding complete
        const { error: accountError } = await supabase
          .from("accounts")
          .update({
            active_profile_id: profileId,
            onboarding_completed: true,
            display_name: data.displayName || account.display_name,
          })
          .eq("id", account.id);

        if (accountError) throw accountError;

        // Create membership for providers (trial)
        if (data.intent !== "family") {
          await supabase.from("memberships").upsert({
            account_id: account.id,
            plan: "free",
            status: "trialing",
            trial_ends_at: new Date(
              Date.now() + 30 * 24 * 60 * 60 * 1000
            ).toISOString(),
          });
        }
      } else {
        // Creating a new profile
        const slug = generateSlug(data.displayName, data.city, data.state);

        const { data: newProfile, error: profileError } = await supabase
          .from("profiles")
          .insert({
            account_id: account.id,
            slug,
            type: data.intent!,
            category: data.category,
            display_name: data.displayName,
            city: data.city || null,
            state: data.state || null,
            zip: data.zip || null,
            care_types: data.careTypes,
            claim_state: "claimed" as const,
            verification_state: "unverified" as const,
            source: "user_created" as const,
            is_active: true,
            metadata: buildMetadata(data),
          })
          .select("id")
          .single();

        if (profileError) throw profileError;

        // Set as active profile and mark onboarding complete
        const { error: accountError } = await supabase
          .from("accounts")
          .update({
            active_profile_id: newProfile.id,
            onboarding_completed: true,
            display_name: data.displayName || account.display_name,
          })
          .eq("id", account.id);

        if (accountError) throw accountError;

        // Create membership for providers (trial)
        if (data.intent !== "family") {
          await supabase.from("memberships").upsert({
            account_id: account.id,
            plan: "free",
            status: "trialing",
            trial_ends_at: new Date(
              Date.now() + 30 * 24 * 60 * 60 * 1000
            ).toISOString(),
          });
        }
      }

      await refreshAccountData();

      // Redirect based on role
      if (data.intent === "family") {
        router.push("/browse");
      } else {
        router.push("/portal");
      }
    } catch (err) {
      console.error("Onboarding error:", err);
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  const stepNumber =
    step === "intent" ? 1 : step === "profile-info" ? 2 : 3;
  const totalSteps = data.intent === "organization" ? 3 : 2;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-2xl">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-base text-gray-500">
              Step {stepNumber} of {totalSteps}
            </span>
            {step !== "intent" && (
              <button
                type="button"
                onClick={() => {
                  if (step === "org-claim") setStep("profile-info");
                  else setStep("intent");
                }}
                className="text-base text-primary-600 hover:text-primary-700 font-medium focus:outline-none focus:underline"
              >
                Back
              </button>
            )}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(stepNumber / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {error && (
          <div
            className="mb-6 bg-red-50 text-red-700 px-4 py-3 rounded-lg text-base"
            role="alert"
          >
            {error}
          </div>
        )}

        {step === "intent" && (
          <IntentStep onSelect={handleIntentSelected} />
        )}

        {step === "profile-info" && (
          <ProfileInfoStep
            data={data}
            onChange={updateData}
            onComplete={handleProfileInfoComplete}
            submitting={submitting && data.intent !== "organization"}
          />
        )}

        {step === "org-claim" && (
          <OrgClaimStep
            data={data}
            onClaim={handleClaimComplete}
            onSkip={() => handleSubmit(null)}
            submitting={submitting}
          />
        )}
      </div>
    </div>
  );
}

function generateSlug(name: string, city: string, state: string): string {
  const parts = [name, city, state].filter(Boolean);
  const slug = parts
    .join(" ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  // Append short random suffix for collision resistance
  const suffix = Math.random().toString(36).substring(2, 6);
  return `${slug}-${suffix}`;
}

function buildMetadata(data: OnboardingData): Record<string, unknown> {
  if (data.intent === "family") {
    return {
      timeline: data.timeline || undefined,
      relationship_to_recipient: data.relationshipToRecipient || undefined,
    };
  }
  // Organization and caregiver start with empty metadata
  return {};
}
