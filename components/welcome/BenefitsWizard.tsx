"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import { useBenefitsState } from "@/hooks/use-benefits-state";
import { useSavedBenefits } from "@/hooks/use-saved-benefits";
import { useCitySearch } from "@/hooks/use-city-search";
import { useClickOutside } from "@/hooks/use-click-outside";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { BusinessProfile, FamilyMetadata } from "@/lib/types";
import {
  CARE_PREFERENCES,
  PRIMARY_NEEDS,
  INCOME_RANGES,
  MEDICAID_STATUSES,
  type CarePreference,
  type PrimaryNeed,
  type IncomeRange,
  type MedicaidStatus,
  type BenefitMatch,
} from "@/lib/types/benefits";

// State name → abbreviation mapping
const STATE_ABBREVIATIONS: Record<string, string> = {
  Alabama: "AL", Alaska: "AK", Arizona: "AZ", Arkansas: "AR", California: "CA",
  Colorado: "CO", Connecticut: "CT", Delaware: "DE", Florida: "FL", Georgia: "GA",
  Hawaii: "HI", Idaho: "ID", Illinois: "IL", Indiana: "IN", Iowa: "IA",
  Kansas: "KS", Kentucky: "KY", Louisiana: "LA", Maine: "ME", Maryland: "MD",
  Massachusetts: "MA", Michigan: "MI", Minnesota: "MN", Mississippi: "MS", Missouri: "MO",
  Montana: "MT", Nebraska: "NE", Nevada: "NV", "New Hampshire": "NH", "New Jersey": "NJ",
  "New Mexico": "NM", "New York": "NY", "North Carolina": "NC", "North Dakota": "ND", Ohio: "OH",
  Oklahoma: "OK", Oregon: "OR", Pennsylvania: "PA", "Rhode Island": "RI", "South Carolina": "SC",
  "South Dakota": "SD", Tennessee: "TN", Texas: "TX", Utah: "UT", Vermont: "VT",
  Virginia: "VA", Washington: "WA", "West Virginia": "WV", Wisconsin: "WI", Wyoming: "WY",
  "District of Columbia": "DC",
};

// ── Types ──

interface BenefitsWizardProps {
  profile?: BusinessProfile | null;
  onClose: () => void;
  onComplete: () => void;
}

// Map profile care_needs to benefits primaryNeeds
const CARE_NEEDS_TO_PRIMARY_NEEDS: Record<string, PrimaryNeed> = {
  "Personal Care": "personalCare",
  "Household Tasks": "householdTasks",
  "Health Management": "healthManagement",
  "Companionship": "companionship",
  "Memory Care": "memoryCare",
  "Mobility Help": "mobilityHelp",
};

// Map profile care_types to care preference
function inferCarePreference(careTypes: string[]): CarePreference | null {
  const facilityTypes = ["Assisted Living", "Memory Care", "Nursing Home", "Independent Living"];
  const homeTypes = ["Home Care", "Home Health Care"];

  const hasFacility = careTypes.some(t => facilityTypes.includes(t));
  const hasHome = careTypes.some(t => homeTypes.includes(t));

  if (hasFacility && !hasHome) return "exploringFacility";
  if (hasHome && !hasFacility) return "stayHome";
  if (hasFacility && hasHome) return "unsure";
  return null;
}

const STEPS = [
  { id: "location", title: "Location", subtitle: "Where are you located?" },
  { id: "age", title: "Age", subtitle: "How old is the person who needs care?" },
  { id: "care", title: "Care Setting", subtitle: "Hoping to stay home or explore facilities?" },
  { id: "needs", title: "Primary Needs", subtitle: "What kind of help is most needed?" },
  { id: "income", title: "Budget", subtitle: "What is your monthly budget for care expenses?" },
  { id: "medicaid", title: "Medicaid", subtitle: "Do you currently have Medicaid?" },
] as const;

export default function BenefitsWizard({ profile, onClose, onComplete }: BenefitsWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [prefilled, setPrefilled] = useState(false);

  // Benefits state management
  const {
    answers,
    updateAnswers,
    locationDisplay,
    setLocationDisplay,
    pageState,
    result,
    submit,
  } = useBenefitsState();

  // Saved benefits
  const { isSaved, toggleSave } = useSavedBenefits();

  // Location autocomplete
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const locationDropdownRef = useRef<HTMLDivElement>(null);
  const { results: cityResults, preload: preloadCities } = useCitySearch(locationDisplay);

  // ── Prefill from profile ──
  useEffect(() => {
    if (prefilled || !profile) return;
    setPrefilled(true);

    const meta = (profile.metadata || {}) as FamilyMetadata;
    const updates: Parameters<typeof updateAnswers>[0] = {};

    // Location
    if (profile.city && profile.state) {
      const stateCode = STATE_ABBREVIATIONS[profile.state] || profile.state;
      setLocationDisplay(`${profile.city}, ${profile.state}`);
      updates.stateCode = stateCode;
    }

    // Age
    if (meta.age) {
      updates.age = meta.age;
    }

    // Care preference (infer from care_types)
    if (profile.care_types && profile.care_types.length > 0) {
      const inferred = inferCarePreference(profile.care_types);
      if (inferred) {
        updates.carePreference = inferred;
      }
    }

    // Primary needs (map from care_needs)
    if (meta.care_needs && meta.care_needs.length > 0) {
      const mappedNeeds: PrimaryNeed[] = [];
      for (const need of meta.care_needs) {
        const mapped = CARE_NEEDS_TO_PRIMARY_NEEDS[need];
        if (mapped) mappedNeeds.push(mapped);
      }
      if (mappedNeeds.length > 0) {
        updates.primaryNeeds = mappedNeeds;
      }
    }

    // Income range (if already saved)
    if (meta.income_range) {
      updates.incomeRange = meta.income_range as IncomeRange;
    }

    // Medicaid status (if already saved)
    if (meta.medicaid_status) {
      updates.medicaidStatus = meta.medicaid_status as MedicaidStatus;
    }

    if (Object.keys(updates).length > 0) {
      updateAnswers(updates);
    }
  }, [profile, prefilled, updateAnswers, setLocationDisplay]);

  useClickOutside(locationDropdownRef, () => setShowLocationDropdown(false));

  // ── Sync answers back to profile ──
  const syncToProfile = async () => {
    if (!profile || !isSupabaseConfigured()) return;

    try {
      const supabase = createClient();
      const { data: current } = await supabase
        .from("business_profiles")
        .select("metadata")
        .eq("id", profile.id)
        .single();

      const existingMeta = (current?.metadata || {}) as FamilyMetadata;

      // Build metadata updates from benefits answers
      const metaUpdates: Partial<FamilyMetadata> = {};

      if (answers.age) {
        metaUpdates.age = answers.age;
      }

      if (answers.incomeRange) {
        metaUpdates.income_range = answers.incomeRange;
      }

      if (answers.medicaidStatus) {
        metaUpdates.medicaid_status = answers.medicaidStatus;
      }

      // Map primaryNeeds back to care_needs format
      if (answers.primaryNeeds.length > 0) {
        const careNeeds: string[] = [];
        const reverseMap: Record<PrimaryNeed, string> = {
          personalCare: "Personal Care",
          householdTasks: "Household Tasks",
          healthManagement: "Health Management",
          companionship: "Companionship",
          financialHelp: "Financial Help",
          memoryCare: "Memory Care",
          mobilityHelp: "Mobility Help",
        };
        for (const need of answers.primaryNeeds) {
          careNeeds.push(reverseMap[need]);
        }
        metaUpdates.care_needs = careNeeds;
      }

      // Store benefits results reference
      if (result) {
        metaUpdates.benefits_results = {
          matchCount: result.matchedPrograms.length,
          completed_at: new Date().toISOString(),
        };
      }

      await supabase
        .from("business_profiles")
        .update({
          metadata: { ...existingMeta, ...metaUpdates },
        })
        .eq("id", profile.id);
    } catch (err) {
      console.error("[BenefitsWizard] Sync to profile failed:", err);
    }
  };

  const handleLocationSelect = (result: { city: string; state: string; full: string }) => {
    setLocationDisplay(result.full);
    // Convert state name to state code
    const stateCode = STATE_ABBREVIATIONS[result.state] || null;
    updateAnswers({
      stateCode,
      zipCode: null, // We're using city, not ZIP
    });
    setShowLocationDropdown(false);
  };

  // Pill renderer
  const renderPill = (
    label: string,
    icon: string | null,
    isSelected: boolean,
    onClick: () => void
  ) => (
    <button
      key={label}
      type="button"
      onClick={onClick}
      className={[
        "px-4 py-3 rounded-xl text-sm font-medium border transition-all duration-200 flex items-center gap-2",
        isSelected
          ? "bg-primary-50 border-primary-300 text-primary-700"
          : "bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50",
      ].join(" ")}
    >
      {icon && <span>{icon}</span>}
      {label}
    </button>
  );

  // Navigation
  const handleNext = async () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Last step — submit and get results
      await submit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    const step = STEPS[currentStep];
    switch (step.id) {
      case "location":
        return !!answers.stateCode;
      case "age":
        return answers.age !== null && answers.age >= 18;
      case "care":
        return !!answers.carePreference;
      case "needs":
        return answers.primaryNeeds.length > 0;
      case "income":
        return !!answers.incomeRange;
      case "medicaid":
        return !!answers.medicaidStatus;
      default:
        return true;
    }
  };

  // ── Results Screen ──
  if (pageState === "results" && result) {
    const topMatches = result.matchedPrograms.slice(0, 5);
    const savedCount = topMatches.filter(m => isSaved(m.program.name)).length;

    // Results header for Modal title
    const resultsHeader = (
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
          <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {result.matchedPrograms.length} programs found
          </h2>
          <p className="text-sm text-gray-500">
            Based on your answers in {locationDisplay}
          </p>
        </div>
      </div>
    );

    return (
      <Modal isOpen onClose={onClose} size="2xl" title={resultsHeader}>
        <div className="flex flex-col max-h-[80vh]">
          {/* Results List */}
          <div className="flex-1 overflow-y-auto py-4">
            <div className="space-y-3">
              {topMatches.map((match) => (
                <ProgramCard
                  key={match.id}
                  match={match}
                  isSaved={isSaved(match.program.name)}
                  onToggleSave={() => toggleSave(match.program.name)}
                />
              ))}
            </div>

            {result.matchedPrograms.length > 5 && (
              <div className="mt-4 text-center">
                <Link
                  href="/benefits/finder"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-primary-600 hover:text-primary-700"
                >
                  See all {result.matchedPrograms.length} programs →
                </Link>
              </div>
            )}
          </div>

          {/* Footer — Save encouragement */}
          <div className="px-1 py-4 border-t border-gray-100 bg-gray-50/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-gray-600">
                  {savedCount > 0
                    ? `${savedCount} program${savedCount > 1 ? "s" : ""} saved to your profile`
                    : "Save programs to track them in your profile"
                  }
                </span>
              </div>
              <button
                onClick={async () => {
                  await syncToProfile();
                  onComplete();
                }}
                className="px-5 py-2.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </Modal>
    );
  }

  // ── Loading Screen ──
  if (pageState === "loading") {
    return (
      <Modal isOpen onClose={onClose} size="md" title="Finding programs...">
        <div className="py-8 text-center">
          <div className="w-12 h-12 mx-auto mb-4">
            <div className="w-12 h-12 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-sm text-gray-500">Matching you with benefits you may qualify for</p>
        </div>
      </Modal>
    );
  }

  // ── Main Wizard ──
  const step = STEPS[currentStep];

  // Step header for Modal title
  const stepHeader = (
    <div>
      <p className="text-sm text-gray-400 mb-1">
        Step <span className="font-semibold text-gray-600">{currentStep + 1}</span> of {STEPS.length}
      </p>
      <h2 className="text-xl font-semibold text-gray-900">{step.title}</h2>
      <p className="text-sm text-gray-500 mt-0.5">{step.subtitle}</p>
    </div>
  );

  return (
    <Modal isOpen onClose={onClose} size="2xl" title={stepHeader}>
      <div className="flex flex-col min-h-[420px]">
        {/* Form Content */}
        <div className={`flex-1 pt-5 ${step.id === "location" ? "overflow-visible" : "overflow-y-auto"}`}>

          {/* Step 1: Location */}
          {step.id === "location" && (
            <div className="relative" ref={locationDropdownRef}>
              <div className="relative">
                <input
                  type="text"
                  value={locationDisplay}
                  onChange={(e) => {
                    setLocationDisplay(e.target.value);
                    setShowLocationDropdown(true);
                  }}
                  onFocus={() => {
                    preloadCities();
                    setShowLocationDropdown(true);
                  }}
                  placeholder="Start typing a city..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </div>

              {/* Dropdown */}
              {showLocationDropdown && cityResults.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white rounded-xl border border-gray-200 shadow-lg max-h-60 overflow-y-auto">
                  {cityResults.map((result, index) => (
                    <button
                      key={`${result.city}-${result.state}-${index}`}
                      type="button"
                      onClick={() => handleLocationSelect(result)}
                      className="w-full px-4 py-3 text-left text-sm text-gray-900 hover:bg-gray-50 transition-colors first:rounded-t-xl last:rounded-b-xl flex items-center gap-3"
                    >
                      <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{result.full}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Age */}
          {step.id === "age" && (
            <Input
              label="Age"
              type="number"
              value={answers.age?.toString() || ""}
              onChange={(e) => {
                const val = (e.target as HTMLInputElement).value;
                updateAnswers({ age: val ? parseInt(val, 10) : null });
              }}
              placeholder="Enter age (e.g. 72)"
            />
          )}

          {/* Step 3: Care Preference */}
          {step.id === "care" && (
            <div className="flex flex-wrap gap-2">
              {Object.entries(CARE_PREFERENCES).map(([key, { displayTitle, icon }]) =>
                renderPill(
                  displayTitle,
                  icon,
                  answers.carePreference === key,
                  () => updateAnswers({ carePreference: key as CarePreference })
                )
              )}
            </div>
          )}

          {/* Step 4: Primary Needs */}
          {step.id === "needs" && (
            <div className="space-y-3">
              <p className="text-base text-gray-600">Select all that apply</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(PRIMARY_NEEDS).map(([key, { displayTitle, icon }]) =>
                  renderPill(
                    displayTitle,
                    icon,
                    answers.primaryNeeds.includes(key as PrimaryNeed),
                    () => {
                      const needs = answers.primaryNeeds;
                      const updated = needs.includes(key as PrimaryNeed)
                        ? needs.filter((n) => n !== key)
                        : [...needs, key as PrimaryNeed];
                      updateAnswers({ primaryNeeds: updated });
                    }
                  )
                )}
              </div>
            </div>
          )}

          {/* Step 5: Income Range */}
          {step.id === "income" && (
            <div className="flex flex-wrap gap-2">
              {Object.entries(INCOME_RANGES).map(([key, { displayTitle }]) =>
                renderPill(
                  displayTitle,
                  null,
                  answers.incomeRange === key,
                  () => updateAnswers({ incomeRange: key as IncomeRange })
                )
              )}
            </div>
          )}

          {/* Step 6: Medicaid Status */}
          {step.id === "medicaid" && (
            <div className="flex flex-wrap gap-2">
              {Object.entries(MEDICAID_STATUSES).map(([key, { displayTitle }]) =>
                renderPill(
                  displayTitle,
                  null,
                  answers.medicaidStatus === key,
                  () => updateAnswers({ medicaidStatus: key as MedicaidStatus })
                )
              )}
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <div className="flex items-center justify-between">
            {/* Left side - Skip (step 1) or Back (step 2+) */}
            <div>
              {currentStep > 0 ? (
                <button
                  onClick={handleBack}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Back
                </button>
              ) : (
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Skip
                </button>
              )}
            </div>

            {/* Right side - Next only */}
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {currentStep === STEPS.length - 1 ? (
                "Find Programs"
              ) : (
                <>
                  Next
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ── Program Card Component ──

function ProgramCard({
  match,
  isSaved,
  onToggleSave,
}: {
  match: BenefitMatch;
  isSaved: boolean;
  onToggleSave: () => void;
}) {
  const { program, matchScore, tierLabel } = match;

  const tierColors = {
    "Top Match": "bg-primary-100 text-primary-700",
    "Good Fit": "bg-blue-100 text-blue-700",
    "Worth Exploring": "bg-gray-100 text-gray-700",
  };

  return (
    <div className="flex items-start gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-colors">
      {/* Score badge */}
      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
        <span className="text-sm font-bold text-gray-900">{matchScore}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-medium text-gray-900 line-clamp-1">
              {program.short_name || program.name}
            </h3>
            <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${tierColors[tierLabel]}`}>
              {tierLabel}
            </span>
          </div>

          {/* Save button */}
          <button
            onClick={onToggleSave}
            className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
              isSaved
                ? "bg-primary-100 text-primary-600"
                : "bg-gray-100 text-gray-400 hover:text-primary-600 hover:bg-primary-50"
            }`}
            aria-label={isSaved ? "Remove from saved" : "Save program"}
          >
            <svg
              className="w-4 h-4"
              fill={isSaved ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </button>
        </div>

        <p className="mt-1 text-sm text-gray-500 line-clamp-2">
          {program.description}
        </p>
      </div>
    </div>
  );
}
