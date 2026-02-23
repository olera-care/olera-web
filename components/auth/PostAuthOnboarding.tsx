"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useAuth, type AuthFlowIntent, type AuthFlowProviderType } from "@/components/auth/AuthProvider";
import { getDeferredAction, clearDeferredAction } from "@/lib/deferred-action";
import type { Profile, ProfileCategory } from "@/lib/types";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

// ============================================================
// Types
// ============================================================

type OnboardingStep = "intent" | "profile-info" | "org-search" | "complete";

interface PostAuthOnboardingProps {
  intent: AuthFlowIntent;
  providerType: AuthFlowProviderType;
  claimProfile: Profile | null;
  onComplete: () => void;
}

// ============================================================
// Constants
// ============================================================

const ORG_CATEGORIES: { value: ProfileCategory; label: string }[] = [
  { value: "assisted_living", label: "Assisted Living" },
  { value: "independent_living", label: "Independent Living" },
  { value: "memory_care", label: "Memory Care" },
  { value: "nursing_home", label: "Nursing Home / Skilled Nursing" },
  { value: "home_care_agency", label: "Home Care Agency" },
  { value: "home_health_agency", label: "Home Health Agency" },
  { value: "hospice_agency", label: "Hospice" },
  { value: "rehab_facility", label: "Rehabilitation Facility" },
  { value: "adult_day_care", label: "Adult Day Care" },
  { value: "wellness_center", label: "Wellness Center" },
];

const CARE_TYPES = [
  "Assisted Living",
  "Memory Care",
  "Independent Living",
  "Skilled Nursing",
  "Home Care",
  "Home Health",
  "Hospice",
  "Respite Care",
  "Adult Day Care",
  "Rehabilitation",
];

// ============================================================
// Progress Indicator
// ============================================================

function StepProgress({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5 mb-6">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <div
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              i < current
                ? "bg-primary-600"
                : i === current
                ? "bg-primary-600 scale-125"
                : "bg-gray-200"
            }`}
          />
          {i < total - 1 && (
            <div
              className={`w-6 h-0.5 rounded-full transition-colors duration-300 ${
                i < current ? "bg-primary-600" : "bg-gray-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Component
// ============================================================

export default function PostAuthOnboarding({
  intent: initialIntent,
  providerType: initialProviderType,
  claimProfile,
  onComplete,
}: PostAuthOnboardingProps) {
  const router = useRouter();
  const { user, account, activeProfile, refreshAccountData } = useAuth();
  const isAddingProfile = !!activeProfile;

  // Determine starting step
  const getInitialStep = useCallback((): OnboardingStep => {
    if (claimProfile) return "profile-info"; // claim has data pre-filled
    if (initialIntent) return "profile-info"; // intent known, skip question
    return "intent";
  }, [initialIntent, claimProfile]);

  const [step, setStep] = useState<OnboardingStep>(getInitialStep);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Form data
  const [intent, setIntent] = useState<"family" | "provider" | null>(
    initialIntent as "family" | "provider" | null
  );
  const [providerType, setProviderType] = useState<"organization" | "caregiver" | null>(
    initialProviderType as "organization" | "caregiver" | null
  );
  const [displayName, setDisplayName] = useState(claimProfile?.display_name || "");
  const [city, setCity] = useState(claimProfile?.city || "");
  const [state, setState] = useState(claimProfile?.state || "");
  const [careTypes, setCareTypes] = useState<string[]>(claimProfile?.care_types || []);
  const [category, setCategory] = useState<ProfileCategory | null>(claimProfile?.category || null);

  // Org search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [claimedProfile, setClaimedProfile] = useState<Profile | null>(claimProfile);

  // When intent is set from claim profile
  useEffect(() => {
    if (claimProfile) {
      setIntent("provider");
      setProviderType("organization");
    }
  }, [claimProfile]);

  // ──────────────────────────────────────────────────────────
  // Progress computation
  // ──────────────────────────────────────────────────────────

  const hasIntentStep = !initialIntent && !claimProfile;
  const hasOrgSearch = intent === "provider" && providerType === "organization" && !claimedProfile;
  const totalSteps = (hasIntentStep ? 1 : 0) + 1 + (hasOrgSearch ? 1 : 0);

  const currentStepIndex =
    step === "intent"
      ? 0
      : step === "profile-info"
      ? hasIntentStep ? 1 : 0
      : step === "org-search"
      ? hasIntentStep ? 2 : 1
      : 0;

  // ──────────────────────────────────────────────────────────
  // Intent Selection
  // ──────────────────────────────────────────────────────────

  const handleIntentSelect = (selectedIntent: "family" | "provider") => {
    if (selectedIntent === "provider") {
      onComplete(); // closes modal
      router.push("/provider/onboarding");
      return;
    }
    setIntent(selectedIntent);
    setStep("profile-info");
  };

  // ──────────────────────────────────────────────────────────
  // Profile Info Validation
  // ──────────────────────────────────────────────────────────

  const isProfileInfoValid = (): boolean => {
    if (intent === "family") {
      return displayName.trim().length > 0;
    }
    // Provider
    return displayName.trim().length > 0 && careTypes.length > 0;
  };

  // ──────────────────────────────────────────────────────────
  // Profile Info → Next Step
  // ──────────────────────────────────────────────────────────

  const handleProfileInfoNext = () => {
    if (intent === "provider" && providerType === "organization" && !claimedProfile) {
      setSearchQuery(displayName);
      setStep("org-search");
    } else {
      handleSubmit();
    }
  };

  // ──────────────────────────────────────────────────────────
  // Org Search
  // ──────────────────────────────────────────────────────────

  const searchOrgs = useCallback(async (query: string) => {
    if (!query.trim() || !isSupabaseConfigured()) return;
    setSearching(true);

    try {
      const supabase = createClient();
      const { data: profiles } = await supabase
        .from("business_profiles")
        .select("*")
        .eq("type", "organization")
        .eq("claim_state", "unclaimed")
        .ilike("display_name", `%${query.trim()}%`)
        .limit(10);

      setSearchResults((profiles as Profile[]) || []);
    } catch {
      setSearchResults([]);
    } finally {
      setHasSearched(true);
      setSearching(false);
    }
  }, []);

  // Auto-search when entering org-search step
  useEffect(() => {
    if (step === "org-search" && searchQuery && !hasSearched) {
      searchOrgs(searchQuery);
    }
  }, [step, searchQuery, hasSearched, searchOrgs]);

  const handleOrgSearchNext = () => {
    if (selectedOrgId) {
      const profile = searchResults.find((p) => p.id === selectedOrgId);
      if (profile) {
        setClaimedProfile(profile);
      }
    }
    handleSubmit(selectedOrgId ? searchResults.find((p) => p.id === selectedOrgId) : null, selectedOrgId);
  };

  // ──────────────────────────────────────────────────────────
  // Submit Profile
  // ──────────────────────────────────────────────────────────

  const handleSubmit = async (
    claimProfileOverride?: Profile | null,
    claimIdOverride?: string | null
  ) => {
    if (!user) {
      setError("Session not found. Please close this dialog and try again.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      // Ensure account exists first
      if (!account?.id) {
        const ensureRes = await fetch("/api/auth/ensure-account", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ display_name: displayName }),
        });

        if (!ensureRes.ok) {
          const errorData = await ensureRes.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to set up account");
        }
      }

      // Create profile via server-side API (bypasses RLS)
      const response = await fetch("/api/auth/create-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intent,
          providerType,
          displayName,
          orgName: providerType === "organization" ? displayName : undefined,
          city,
          state,
          careTypes,
          category,
          claimedProfileId: claimIdOverride ?? claimedProfile?.id ?? null,
          careNeeds: intent === "family" ? careTypes : undefined,
          isAddingProfile,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to create profile");
      }

      // Refresh auth context to pick up the new profile
      await refreshAccountData();

      // Handle deferred action
      const deferred = getDeferredAction();
      if (deferred?.returnUrl) {
        clearDeferredAction();
        router.push(deferred.returnUrl);
        onComplete();
        return;
      }

      // Route based on intent
      if (intent === "family" && !isAddingProfile) {
        router.push("/browse");
      } else if (intent === "provider" && !isAddingProfile) {
        router.push("/provider");
      } else {
        router.push("/portal");
      }

      onComplete();
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "message" in err
          ? (err as { message: string }).message
          : String(err);
      console.error("Post-auth onboarding error:", message, err);
      setError(`Something went wrong: ${message}`);
      setLoading(false);
    }
  };

  // ──────────────────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────────────────

  return (
    <div>
      {/* Progress indicator */}
      <StepProgress current={currentStepIndex} total={totalSteps} />

      {error && (
        <div className="mb-5 bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm" role="alert">
          {error}
        </div>
      )}

      {/* ─── Intent Selection ─── */}
      {step === "intent" && (
        <div key="intent" className="animate-step-enter space-y-5">
          <div className="text-center mb-2">
            <h2 className="text-2xl font-semibold text-gray-900">What brings you to Olera?</h2>
            <p className="text-gray-500 mt-2">
              Tell us a bit about yourself so we can personalize your experience.
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleIntentSelect("family")}
            className="w-full text-left p-6 rounded-2xl border-2 border-gray-100 shadow-xs hover:border-primary-300 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                <svg className="w-7 h-7 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">I&apos;m looking for care</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Find care providers for yourself or a loved one
                </p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleIntentSelect("provider")}
            className="w-full text-left p-6 rounded-2xl border-2 border-gray-100 shadow-xs hover:border-secondary-300 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-secondary-50 flex items-center justify-center flex-shrink-0">
                <svg className="w-7 h-7 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">I&apos;m a care provider</h3>
                <p className="text-sm text-gray-500 mt-1">
                  List your services and connect with families
                </p>
              </div>
            </div>
          </button>
        </div>
      )}

      {/* ─── Profile Info ─── */}
      {step === "profile-info" && (
        <div key="profile-info" className="animate-step-enter space-y-5">
          <div className="text-center mb-2">
            <h2 className="text-2xl font-semibold text-gray-900">
              {intent === "family" ? "Tell us about yourself" : "Set up your profile"}
            </h2>
          </div>

          {intent === "provider" && !providerType && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">I am a...</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setProviderType("organization")}
                  className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium border-2 transition-all duration-150 ${
                    providerType === "organization"
                      ? "border-primary-500 bg-primary-50 text-primary-700 shadow-xs"
                      : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  Organization
                </button>
                <button
                  type="button"
                  onClick={() => setProviderType("caregiver")}
                  className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium border-2 transition-all duration-150 ${
                    providerType === "caregiver"
                      ? "border-primary-500 bg-primary-50 text-primary-700 shadow-xs"
                      : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  Private Caregiver
                </button>
              </div>
            </div>
          )}

          <Input
            label={intent === "provider" && providerType === "organization" ? "Organization name" : "Your name"}
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName((e.target as HTMLInputElement).value)}
            placeholder={intent === "provider" && providerType === "organization" ? "e.g., Sunrise Senior Living" : "First and last name"}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="City"
              type="text"
              value={city}
              onChange={(e) => setCity((e.target as HTMLInputElement).value)}
              placeholder="City"
            />
            <Input
              label="State"
              type="text"
              value={state}
              onChange={(e) => setState((e.target as HTMLInputElement).value)}
              placeholder="State"
            />
          </div>

          {intent === "provider" && providerType === "organization" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Organization type
              </label>
              <select
                value={category || ""}
                onChange={(e) => setCategory(e.target.value as ProfileCategory || null)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors min-h-[44px]"
              >
                <option value="">Select a type...</option>
                {ORG_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2.5">
              {intent === "family" ? "What type of care are you looking for?" : "Care types offered"}
            </label>
            <div className="flex flex-wrap gap-2">
              {CARE_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    if (careTypes.includes(type)) {
                      setCareTypes(careTypes.filter((t) => t !== type));
                    } else {
                      setCareTypes([...careTypes, type]);
                    }
                  }}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all duration-150 ${
                    careTypes.includes(type)
                      ? "bg-primary-50 text-primary-700 border-primary-300 shadow-xs"
                      : "bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-1">
            <Button
              type="button"
              onClick={handleProfileInfoNext}
              disabled={!isProfileInfoValid() || loading}
              loading={loading}
              fullWidth
              size="lg"
            >
              {intent === "provider" && providerType === "organization" && !claimedProfile
                ? "Continue"
                : "Complete setup"}
            </Button>
          </div>

          {!initialIntent && (
            <button
              type="button"
              onClick={() => { setStep("intent"); setError(""); }}
              className="w-full text-center text-sm text-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
          )}
        </div>
      )}

      {/* ─── Org Search ─── */}
      {step === "org-search" && (
        <div key="org-search" className="animate-step-enter space-y-5">
          <div className="text-center mb-2">
            <h2 className="text-2xl font-semibold text-gray-900">Is your organization listed?</h2>
            <p className="text-gray-500 mt-2">
              Search to claim your existing profile, or skip to create a new one.
            </p>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by organization name..."
              className="flex-1 px-4 py-3 rounded-xl border border-gray-300 text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors min-h-[44px]"
            />
            <Button
              type="button"
              onClick={() => { setHasSearched(false); searchOrgs(searchQuery); }}
              loading={searching}
              variant="secondary"
            >
              Search
            </Button>
          </div>

          {hasSearched && (
            <div className="max-h-60 overflow-y-auto space-y-2">
              {searchResults.length === 0 ? (
                <p className="text-sm text-gray-500 py-6 text-center">
                  No matching organizations found. You can create a new profile.
                </p>
              ) : (
                searchResults.map((org) => (
                  <button
                    key={org.id}
                    type="button"
                    onClick={() => setSelectedOrgId(selectedOrgId === org.id ? null : org.id)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-150 ${
                      selectedOrgId === org.id
                        ? "border-primary-500 bg-primary-50/50 shadow-sm"
                        : "border-gray-200 hover:border-gray-300 hover:shadow-xs"
                    }`}
                  >
                    <p className="font-medium text-gray-900">{org.display_name}</p>
                    {(org.city || org.state) && (
                      <p className="text-sm text-gray-500 mt-0.5">
                        {[org.city, org.state].filter(Boolean).join(", ")}
                      </p>
                    )}
                    {org.care_types && org.care_types.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {org.care_types.slice(0, 3).map((type) => (
                          <span
                            key={type}
                            className="px-2.5 py-0.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-600"
                          >
                            {type}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>
          )}

          <div className="pt-1">
            <Button type="button" onClick={handleOrgSearchNext} loading={loading} fullWidth size="lg">
              {selectedOrgId ? "Claim this organization" : "Create new profile"}
            </Button>
          </div>

          <button
            type="button"
            onClick={() => { setStep("profile-info"); setError(""); setHasSearched(false); }}
            className="w-full text-center text-sm text-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        </div>
      )}
    </div>
  );
}
