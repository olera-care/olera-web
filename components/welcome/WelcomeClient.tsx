"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/components/auth/AuthProvider";
import { useCitySearch } from "@/hooks/use-city-search";
import { useClickOutside } from "@/hooks/use-click-outside";

// ============================================================
// Types
// ============================================================

type Step = 1 | 2 | 3 | 4;

interface WelcomeClientProps {
  destination: string;
}

// ============================================================
// Constants
// ============================================================

const WHO_OPTIONS = [
  { id: "myself", label: "Myself", icon: "user" },
  { id: "parent", label: "My parent", icon: "parent" },
  { id: "spouse", label: "My spouse", icon: "heart" },
  { id: "other", label: "Someone else", icon: "people" },
] as const;

const CARE_TYPES = [
  "In-home care",
  "Memory care",
  "Assisted living",
  "Skilled nursing",
  "Adult day care",
  "Hospice",
  "Respite care",
] as const;

// SessionStorage key for MatchesActivatedBanner
const MATCHES_ACTIVATED_KEY = "olera_matches_activated";

// ============================================================
// Helper Components
// ============================================================

function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2.5">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
            i < current
              ? "bg-primary-600"
              : i === current
              ? "bg-primary-600 scale-110"
              : "bg-gray-200"
          }`}
        />
      ))}
    </div>
  );
}

function WhoIcon({ type }: { type: string }) {
  const iconClass = "w-6 h-6 lg:w-7 lg:h-7";

  switch (type) {
    case "user":
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      );
    case "parent":
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    case "heart":
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      );
    case "people":
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      );
    default:
      return null;
  }
}

// ============================================================
// Main Component
// ============================================================

export default function WelcomeClient({ destination }: WelcomeClientProps) {
  const router = useRouter();
  const { user, account, activeProfile, profiles, isLoading, refreshAccountData } = useAuth();

  // Form state
  const [whoNeedsCare, setWhoNeedsCare] = useState<string | null>(null);
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [selectedCareTypes, setSelectedCareTypes] = useState<string[]>([]);

  // UI state
  const [step, setStep] = useState<Step>(1);
  const [saving, setSaving] = useState(false);
  const [hasCheckedGuards, setHasCheckedGuards] = useState(false);

  // City picker state
  const [locationInput, setLocationInput] = useState("");
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const cityDropdownRef = useRef<HTMLDivElement>(null);
  const cityInputRef = useRef<HTMLInputElement>(null);
  const { results: cityResults, preload: preloadCities } = useCitySearch(locationInput);
  useClickOutside(cityDropdownRef, () => setShowCityDropdown(false));

  // ──────────────────────────────────────────────────────────
  // Helpers
  // ──────────────────────────────────────────────────────────

  const isMatchesActive = useCallback(() => {
    const carePost = (activeProfile?.metadata as Record<string, unknown>)?.care_post as
      | { status?: string }
      | undefined;
    return carePost?.status === "active" || carePost?.status === "paused";
  }, [activeProfile]);

  const isProfileComplete = useCallback(() => {
    if (!activeProfile) return false;
    const hasCity = !!activeProfile.city;
    const hasCareTypes = Array.isArray(activeProfile.care_types) && activeProfile.care_types.length > 0;
    return hasCity && hasCareTypes;
  }, [activeProfile]);

  const isProviderProfile = useCallback(() => {
    if (!activeProfile) return false;
    return activeProfile.type === "organization" || activeProfile.type === "caregiver";
  }, [activeProfile]);

  const getFirstMissingStep = useCallback((): Step => {
    // If no city, start at step 2
    if (!activeProfile?.city) return 2;
    // If no care types, start at step 3
    if (!Array.isArray(activeProfile?.care_types) || activeProfile.care_types.length === 0) return 3;
    // Otherwise, show Matches offer
    return 4;
  }, [activeProfile]);

  // ──────────────────────────────────────────────────────────
  // Entry Guards
  // ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (isLoading || hasCheckedGuards) return;
    if (!user) return; // Wait for auth to resolve

    // Guard 0: Provider profile → redirect immediately
    if (isProviderProfile()) {
      router.replace(destination);
      return;
    }

    // Guard 1: onboarding_completed + Matches active → redirect
    if (account?.onboarding_completed && isMatchesActive()) {
      router.replace(destination);
      return;
    }

    // Guard 2: onboarding_completed + profile complete + Matches NOT active → step 4 only
    if (account?.onboarding_completed && isProfileComplete() && !isMatchesActive()) {
      setStep(4);
      setHasCheckedGuards(true);
      return;
    }

    // Guard 3: onboarding_completed + profile incomplete → start at first missing step
    if (account?.onboarding_completed && !isProfileComplete()) {
      setStep(getFirstMissingStep());
      setHasCheckedGuards(true);
      return;
    }

    // Guard 4: Fresh user → full flow from step 1
    setStep(1);
    setHasCheckedGuards(true);

    // Pre-fill from existing profile data if available
    if (activeProfile?.city) {
      setCity(activeProfile.city);
      setState(activeProfile.state || "");
      setLocationInput(
        activeProfile.state
          ? `${activeProfile.city}, ${activeProfile.state}`
          : activeProfile.city
      );
    }
    if (activeProfile?.care_types && activeProfile.care_types.length > 0) {
      setSelectedCareTypes(activeProfile.care_types);
    }
  }, [
    isLoading,
    user,
    account,
    activeProfile,
    hasCheckedGuards,
    destination,
    router,
    isProviderProfile,
    isMatchesActive,
    isProfileComplete,
    getFirstMissingStep,
  ]);

  // ──────────────────────────────────────────────────────────
  // Save & Exit Logic
  // ──────────────────────────────────────────────────────────

  const saveAndExit = useCallback(
    async (activateMatches: boolean = false) => {
      setSaving(true);

      try {
        // Get display name from account or derive from email
        const displayName =
          account?.display_name ||
          user?.email?.split("@")[0]?.replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) ||
          "Family";

        // Save profile data (best-effort)
        try {
          await fetch("/api/auth/create-profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              intent: "family",
              displayName,
              city: city || undefined,
              state: state || undefined,
              careTypes: selectedCareTypes.length > 0 ? selectedCareTypes : undefined,
            }),
          });
        } catch (err) {
          console.error("[welcome] Failed to save profile:", err);
          // Continue — never block
        }

        // Activate Matches if requested (best-effort)
        if (activateMatches) {
          try {
            const activateRes = await fetch("/api/care-post/activate-matches", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                city: city || undefined,
                state: state || undefined,
                primaryNeeds: [],
              }),
            });

            if (activateRes.ok) {
              // Set sessionStorage for MatchesActivatedBanner
              if (typeof window !== "undefined") {
                sessionStorage.setItem(MATCHES_ACTIVATED_KEY, "true");
              }
            }
          } catch (err) {
            console.error("[welcome] Failed to activate matches:", err);
            // Continue — never block
          }
        }

        // Refresh auth context (best-effort)
        try {
          await refreshAccountData();
        } catch {
          // Continue
        }
      } finally {
        setSaving(false);
        router.push(destination);
      }
    },
    [account, user, city, state, selectedCareTypes, destination, router, refreshAccountData]
  );

  const handleSkip = () => {
    saveAndExit(false);
  };

  // ──────────────────────────────────────────────────────────
  // Step Navigation
  // ──────────────────────────────────────────────────────────

  const handleWhoSelect = (who: string) => {
    setWhoNeedsCare(who);
    setStep(2);
  };

  const handleCitySelect = (selectedCity: string, selectedState: string) => {
    setCity(selectedCity);
    setState(selectedState);
    setLocationInput(`${selectedCity}, ${selectedState}`);
    setShowCityDropdown(false);
    setStep(3);
  };

  const handleCareTypesContinue = () => {
    setStep(4);
  };

  const toggleCareType = (type: string) => {
    setSelectedCareTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleMatchesYes = () => {
    saveAndExit(true);
  };

  const handleMatchesNo = () => {
    saveAndExit(false);
  };

  // ──────────────────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────────────────

  // Loading state flag — show shell immediately, spinner in content area
  const showLoading = isLoading || !hasCheckedGuards;

  return (
    <div className="min-h-screen bg-white flex flex-col" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {/* Header — sticky with backdrop blur */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white/95 backdrop-blur-sm">
        <Image
          src="/images/olera-logo.png"
          alt="Olera"
          width={36}
          height={36}
          className="object-contain"
        />
        <button
          type="button"
          onClick={handleSkip}
          disabled={saving || showLoading}
          className="min-h-[44px] px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:border-gray-400 hover:text-gray-900 active:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Skip for now
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-12 lg:py-16">
        {/* Loading state — show spinner in content area while keeping shell visible */}
        {showLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
            <p className="mt-4 text-sm text-gray-500">Loading...</p>
          </div>
        ) : (
        <div className="w-full max-w-md lg:max-w-lg">
          {/* Progress Dots */}
          <div className="mb-10">
            <ProgressDots current={step - 1} total={4} />
          </div>

          {/* Step 1: Who needs care */}
          {step === 1 && (
            <div className="animate-wizard-in">
              <h1 className="font-display font-bold text-2xl lg:text-4xl text-gray-900 text-center tracking-tight mb-8 lg:mb-10">
                Who needs care?
              </h1>
              <div className="grid grid-cols-2 gap-3 lg:gap-4">
                {WHO_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleWhoSelect(option.id)}
                    className="group flex flex-col items-center gap-3 p-5 lg:p-6 rounded-2xl border-2 border-gray-200 hover:border-primary-400 hover:shadow-md active:scale-[0.98] active:border-primary-500 bg-white transition-all duration-200"
                  >
                    <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-xl bg-primary-50 group-hover:bg-primary-100 group-active:bg-primary-100 flex items-center justify-center transition-colors duration-200">
                      <div className="text-primary-600">
                        <WhoIcon type={option.icon} />
                      </div>
                    </div>
                    <span className="text-sm lg:text-[15px] font-semibold text-gray-900">
                      {option.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Where */}
          {step === 2 && (
            <div className="animate-wizard-in">
              <h1 className="font-display font-bold text-2xl lg:text-4xl text-gray-900 text-center tracking-tight mb-3">
                Where are you looking for care?
              </h1>
              <p className="text-gray-500 text-center mb-8 lg:mb-10">
                We&apos;ll show you providers in your area
              </p>

              <div className="relative" ref={cityDropdownRef}>
                <div
                  className={`flex items-center min-h-[56px] px-4 py-4 bg-white rounded-2xl border-2 transition-all cursor-text ${
                    showCityDropdown
                      ? "border-primary-400 ring-2 ring-primary-100"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => {
                    setShowCityDropdown(true);
                    cityInputRef.current?.focus();
                  }}
                >
                  <svg
                    className="w-5 h-5 text-gray-400 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <input
                    ref={cityInputRef}
                    type="text"
                    value={locationInput}
                    onChange={(e) => {
                      setLocationInput(e.target.value);
                      setShowCityDropdown(true);
                      setCity("");
                      setState("");
                    }}
                    onFocus={() => {
                      setShowCityDropdown(true);
                      preloadCities();
                    }}
                    placeholder="Search city or ZIP code"
                    className="w-full ml-3 bg-transparent border-none text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0 text-base"
                  />
                </div>

                {/* City dropdown */}
                {showCityDropdown && (
                  <div className="absolute left-0 top-[calc(100%+8px)] w-full bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 max-h-[320px] overflow-y-auto overscroll-contain">
                    {!locationInput.trim() && cityResults.length > 0 && (
                      <div className="px-4 pt-2 pb-2">
                        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                          Popular cities
                        </span>
                      </div>
                    )}
                    {cityResults.length > 0 ? (
                      cityResults.map((loc) => (
                        <button
                          key={loc.full}
                          type="button"
                          onClick={() => handleCitySelect(loc.city, loc.state)}
                          className="flex items-center gap-3 w-full px-4 py-3.5 min-h-[48px] text-left text-sm text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                        >
                          <svg
                            className="w-5 h-5 text-gray-300 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                          <span className="font-medium">{loc.full}</span>
                        </button>
                      ))
                    ) : locationInput.trim() ? (
                      <div className="px-4 py-5 text-sm text-gray-500 text-center">
                        No cities found
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: What kind of care */}
          {step === 3 && (
            <div className="animate-wizard-in">
              <h1 className="font-display font-bold text-2xl lg:text-4xl text-gray-900 text-center tracking-tight mb-3">
                What kind of care are you looking for?
              </h1>
              <p className="text-gray-500 text-center mb-8 lg:mb-10">
                Select all that apply
              </p>

              <div className="flex flex-wrap gap-2.5 lg:gap-3 justify-center mb-10">
                {CARE_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleCareType(type)}
                    className={`px-4 py-3 min-h-[44px] rounded-full text-sm font-medium border-2 transition-all duration-200 active:scale-[0.97] ${
                      selectedCareTypes.includes(type)
                        ? "bg-primary-50 text-primary-700 border-primary-400 shadow-sm"
                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 active:border-gray-400 hover:shadow-sm"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleCareTypesContinue}
                disabled={selectedCareTypes.length === 0}
                className="w-full min-h-[52px] py-3.5 px-6 rounded-xl text-base font-semibold text-white bg-gradient-to-b from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 shadow-[0_1px_3px_rgba(25,144,135,0.3)] hover:shadow-[0_3px_8px_rgba(25,144,135,0.35)] disabled:from-gray-200 disabled:to-gray-200 disabled:text-gray-400 disabled:shadow-none disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.98]"
              >
                Continue
              </button>
            </div>
          )}

          {/* Step 4: Matches offer */}
          {step === 4 && (
            <div className="animate-wizard-in text-center">
              {/* Illustration with subtle glow */}
              <div className="mb-8 lg:mb-10">
                <div className="relative w-28 h-28 lg:w-32 lg:h-32 mx-auto">
                  <div className="absolute inset-0 bg-primary-200/50 rounded-full blur-xl" />
                  <div className="relative w-full h-full rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center shadow-sm">
                    <svg
                      className="w-14 h-14 lg:w-16 lg:h-16 text-primary-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <h1 className="font-display font-bold text-2xl lg:text-4xl text-gray-900 tracking-tight mb-4">
                Sit back — let care come to you
              </h1>
              <p className="text-gray-500 text-base lg:text-lg mb-10 max-w-sm mx-auto leading-relaxed">
                Providers near you will reach out directly. You just reply to the ones you like.
              </p>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleMatchesYes}
                  disabled={saving}
                  className="w-full min-h-[52px] py-3.5 px-6 rounded-xl text-base font-semibold text-white bg-gradient-to-b from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 shadow-[0_1px_3px_rgba(25,144,135,0.3)] hover:shadow-[0_3px_8px_rgba(25,144,135,0.35)] disabled:opacity-50 disabled:shadow-none transition-all duration-200 active:scale-[0.98]"
                >
                  {saving ? "Saving..." : "Yes, find me providers"}
                </button>

                <button
                  type="button"
                  onClick={handleMatchesNo}
                  disabled={saving}
                  className="w-full min-h-[44px] py-3 text-sm font-medium text-gray-500 hover:text-gray-700 active:text-gray-900 disabled:opacity-50 transition-colors"
                >
                  I&apos;ll keep searching on my own
                </button>
              </div>
            </div>
          )}
        </div>
        )}
      </main>
    </div>
  );
}
