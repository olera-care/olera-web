"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useCitySearch } from "@/hooks/use-city-search";
import type { BusinessProfile, FamilyMetadata } from "@/lib/types";

// ============================================================
// Types
// ============================================================

type Step = 1 | 2 | 3 | 4 | 5;

interface QuickProfileWizardProps {
  profile: BusinessProfile;
  onClose: () => void;
  onSaved: () => void;
  /** Provider's city for location pre-fill */
  providerCity?: string;
  /** Provider's state for location pre-fill */
  providerState?: string;
}

// ============================================================
// Constants
// ============================================================

const CARE_TYPES = [
  "Home Care",
  "Home Health Care",
  "Assisted Living",
  "Memory Care",
  "Nursing Home",
  "Independent Living",
] as const;

const CARE_NEEDS = [
  "Personal care",
  "Household tasks",
  "Health management",
  "Companionship",
  "Memory care",
  "Mobility help",
] as const;

const PAYMENT_OPTIONS = [
  "Medicare",
  "Medicaid",
  "Private insurance",
  "Private pay",
  "Veterans benefits",
  "Long-term care insurance",
] as const;

const SCHEDULE_OPTIONS = [
  { value: "mornings", label: "Mornings" },
  { value: "afternoons", label: "Afternoons" },
  { value: "evenings", label: "Evenings" },
  { value: "overnight", label: "Overnight" },
  { value: "full_time", label: "Full-time" },
  { value: "flexible", label: "Flexible" },
] as const;

// ============================================================
// Helper Components
// ============================================================

function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`rounded-full transition-all duration-300 ${
            i < current
              ? "bg-primary-600 w-6 h-1.5"
              : i === current
              ? "bg-primary-600 w-6 h-1.5"
              : "bg-gray-200 w-1.5 h-1.5"
          }`}
        />
      ))}
    </div>
  );
}

function TappableOption({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full py-3.5 px-4 rounded-xl text-[15px] font-medium text-center transition-all duration-150 border ${
        selected
          ? "bg-gray-900 text-white border-gray-900"
          : "bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98]"
      }`}
    >
      {selected && (
        <span className="inline-flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          {children}
        </span>
      )}
      {!selected && children}
    </button>
  );
}

// ============================================================
// Location Dropdown with Portal
// ============================================================

function LocationDropdown({
  inputRef,
  dropdownRef,
  results,
  onSelect,
  show,
}: {
  inputRef: React.RefObject<HTMLInputElement | null>;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  results: { city: string; state: string }[];
  onSelect: (city: string, state: string) => void;
  show: boolean;
}) {
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (show && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
      });
    }
  }, [show, inputRef]);

  if (!mounted || !show || results.length === 0) return null;

  return createPortal(
    <div
      ref={dropdownRef}
      className="fixed z-[100] bg-white border border-gray-200 rounded-xl shadow-2xl max-h-48 overflow-y-auto"
      style={{
        top: position.top,
        left: position.left,
        width: position.width,
      }}
    >
      {results.map((result) => (
        <button
          key={`${result.city}-${result.state}`}
          type="button"
          onClick={() => onSelect(result.city, result.state)}
          className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors first:rounded-t-xl last:rounded-b-xl"
        >
          <span className="font-medium text-gray-900">{result.city}</span>
          <span className="text-gray-500">, {result.state}</span>
        </button>
      ))}
    </div>,
    document.body
  );
}

// ============================================================
// Main Component
// ============================================================

export default function QuickProfileWizard({
  profile,
  onClose,
  onSaved,
  providerCity,
  providerState,
}: QuickProfileWizardProps) {
  const { refreshAccountData } = useAuth();
  const meta = (profile.metadata || {}) as FamilyMetadata;

  // Calculate first incomplete step based on existing profile data
  const getFirstIncompleteStep = (): Step => {
    // Step 1: Care Types - complete if has at least one
    if (!profile.care_types || profile.care_types.length === 0) return 1;
    // Step 2: Care Needs - complete if has at least one
    if (!meta.care_needs || meta.care_needs.length === 0) return 2;
    // Step 3: Payment - complete if has at least one
    if (!meta.payment_methods || meta.payment_methods.length === 0) return 3;
    // Step 4: Schedule - complete if set
    if (!meta.schedule_preference) return 4;
    // Step 5: Details - complete if has name AND location
    if (!profile.display_name || !profile.city) return 5;
    // All complete - go to last step for review
    return 5;
  };

  // Step state - start at first incomplete step
  const [step, setStep] = useState<Step>(getFirstIncompleteStep);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Go Live prompt state (shown after successful save)
  const [showGoLivePrompt, setShowGoLivePrompt] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  // Check if profile is already live
  const isAlreadyLive = meta.care_post?.status === "active";

  // Step 1: Care Types (multi-select)
  const [careTypes, setCareTypes] = useState<string[]>(profile.care_types || []);

  // Step 2: Care Needs (multi-select)
  const [careNeeds, setCareNeeds] = useState<string[]>(meta.care_needs || []);

  // Step 3: Payment (multi-select)
  const [payments, setPayments] = useState<string[]>(meta.payment_methods || []);

  // Step 4: Schedule (single-select)
  const [schedule, setSchedule] = useState<string>(meta.schedule_preference || "");

  // Step 5: Quick Details
  const [displayName, setDisplayName] = useState(profile.display_name || "");
  const [phone, setPhone] = useState(profile.phone || "");
  const [city, setCity] = useState(profile.city || providerCity || "");
  const [state, setState] = useState(profile.state || providerState || "");
  const [locationInput, setLocationInput] = useState(
    profile.city && profile.state
      ? `${profile.city}, ${profile.state}`
      : providerCity && providerState
      ? `${providerCity}, ${providerState}`
      : ""
  );
  const [age, setAge] = useState<string>(meta.age ? String(meta.age) : "");
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const cityInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { results: cityResults, preload: preloadCities } = useCitySearch(locationInput);

  // Check if phone was already collected (skip showing phone input)
  const hasPhone = !!profile.phone;

  // Scroll lock + Escape key handler
  useEffect(() => {
    const scrollY = window.scrollY;
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      const storedScrollY = parseInt(document.body.style.top || "0", 10) * -1;
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      requestAnimationFrame(() => {
        window.scrollTo({ top: storedScrollY, behavior: "instant" });
      });
    };
  }, [onClose]);

  // Preload cities on mount
  useEffect(() => {
    preloadCities();
  }, [preloadCities]);

  // Close dropdown on click outside (check both input AND dropdown portal)
  useEffect(() => {
    if (!showCityDropdown) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      const clickedInput = cityInputRef.current?.contains(target);
      const clickedDropdown = dropdownRef.current?.contains(target);
      if (!clickedInput && !clickedDropdown) {
        setShowCityDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showCityDropdown]);

  // Toggle functions
  const toggleCareType = (type: string) => {
    setCareTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const toggleCareNeed = (need: string) => {
    setCareNeeds((prev) =>
      prev.includes(need) ? prev.filter((n) => n !== need) : [...prev, need]
    );
  };

  const togglePayment = (option: string) => {
    setPayments((prev) =>
      prev.includes(option) ? prev.filter((p) => p !== option) : [...prev, option]
    );
  };

  const handleCitySelect = (cityName: string, stateCode: string) => {
    setCity(cityName);
    setState(stateCode);
    setLocationInput(`${cityName}, ${stateCode}`);
    setShowCityDropdown(false);
  };

  // Save all data
  const saveAll = useCallback(async () => {
    if (!isSupabaseConfigured() || !profile) return;
    setSaving(true);
    setSaveError(null);

    try {
      const supabase = createClient();
      const { data: current } = await supabase
        .from("business_profiles")
        .select("metadata")
        .eq("id", profile.id)
        .single();

      const existingMeta = (current?.metadata || {}) as Record<string, unknown>;

      // Build updated metadata - always save selections (even empty) for consistency
      const updatedMeta: Record<string, unknown> = { ...existingMeta };
      updatedMeta.care_needs = careNeeds;
      updatedMeta.payment_methods = payments;
      if (schedule) updatedMeta.schedule_preference = schedule;
      if (age) updatedMeta.age = parseInt(age, 10);

      const updatePayload = {
        display_name: displayName || null,
        city: city || null,
        state: state || null,
        phone: phone || profile.phone || null,
        care_types: careTypes,
        metadata: updatedMeta,
      };

      const { error } = await supabase
        .from("business_profiles")
        .update(updatePayload)
        .eq("id", profile.id);

      if (error) {
        console.error("[QuickProfileWizard] Save failed:", error);
        setSaveError("Couldn't save. Please try again.");
        return;
      }

      // Notify providers of profile update (fire-and-forget)
      fetch("/api/profile/notify-connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId: profile.id }),
      }).catch(() => {});

      // Log profile enrichment event
      fetch("/api/activity/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actor_type: "family",
          profile_id: profile.id,
          event_type: "profile_enriched",
          metadata: {
            source: "quick_wizard",
            fields_set: [
              displayName && "display_name",
              city && "city",
              phone && "phone",
              careTypes.length > 0 && "care_types",
              careNeeds.length > 0 && "care_needs",
              payments.length > 0 && "payment_methods",
              schedule && "schedule_preference",
              age && "age",
            ].filter(Boolean),
          },
        }),
      }).catch(() => {});

      await refreshAccountData();

      // Check if we should show Go Live prompt
      // Requirements: has city AND has care_types (current values, not stale props) AND not already live
      const hasCity = !!city;
      const hasCareTypes = careTypes.length > 0;
      const shouldShowGoLive = hasCity && hasCareTypes && !isAlreadyLive;

      if (shouldShowGoLive) {
        // Show Go Live prompt - don't call onSaved yet or wizard will unmount
        setShowGoLivePrompt(true);
      } else {
        // No Go Live needed - close wizard and dismiss nudge
        onSaved();
      }
    } catch (err) {
      console.error("[QuickProfileWizard] Save error:", err);
      setSaveError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [
    profile,
    displayName,
    city,
    state,
    phone,
    careTypes,
    careNeeds,
    payments,
    schedule,
    age,
    refreshAccountData,
    onSaved,
    isAlreadyLive,
  ]);

  // Handle Go Live
  const handleGoLive = useCallback(async () => {
    setPublishing(true);
    setPublishError(null);

    try {
      const res = await fetch("/api/care-post/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "publish" }),
      });

      if (!res.ok) {
        throw new Error("Failed to publish");
      }

      // Log go_live event
      fetch("/api/activity/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actor_type: "family",
          profile_id: profile.id,
          event_type: "profile_published",
          metadata: { source: "quick_wizard" },
        }),
      }).catch(() => {});

      await refreshAccountData();
      onSaved(); // Dismiss nudge and close wizard
    } catch (err) {
      console.error("[QuickProfileWizard] Publish error:", err);
      setPublishError("Couldn't publish. Please try again.");
    } finally {
      setPublishing(false);
    }
  }, [profile.id, refreshAccountData, onSaved]);

  // Handle Maybe Later
  const handleMaybeLater = useCallback(() => {
    // Log skip event for re-engagement tracking
    fetch("/api/activity/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        actor_type: "family",
        profile_id: profile.id,
        event_type: "go_live_skipped",
        metadata: { source: "quick_wizard" },
      }),
    }).catch(() => {});

    onSaved(); // Dismiss nudge and close wizard
  }, [profile.id, onSaved]);

  // Advance to next step
  const nextStep = () => {
    if (step < 5) {
      setStep((step + 1) as Step);
    }
  };

  // Go back
  const prevStep = () => {
    if (step > 1) {
      setStep((step - 1) as Step);
    }
  };

  // Get the city to display in Go Live prompt
  const displayCity = city || profile.city || providerCity || "";

  // ── Go Live Prompt ──
  if (showGoLivePrompt) {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-[2px] animate-fade-in"
          onClick={handleMaybeLater}
        />

        {/* Sheet/Modal */}
        <div
          className={[
            "relative bg-white w-full flex flex-col",
            "max-h-[92dvh] animate-sheet-up rounded-t-2xl",
            "sm:max-w-[480px] sm:max-h-[85dvh] sm:animate-modal-pop sm:rounded-2xl",
          ].join(" ")}
          style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
          {/* Drag handle — mobile only */}
          <div className="sm:hidden flex justify-center pt-2 pb-1 shrink-0">
            <div className="w-10 h-1 rounded-full bg-gray-300" />
          </div>

          {/* Close button */}
          <div className="absolute top-4 right-4 sm:top-5 sm:right-5 z-10">
            <button
              type="button"
              onClick={handleMaybeLater}
              className="w-10 h-10 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 text-center animate-step-in">
            {/* Illustration */}
            <div className="w-56 h-40 mb-6 relative">
              <Image
                src="/go-live-illustration.png"
                alt="Providers can find you"
                fill
                className="object-contain"
                priority
              />
            </div>

            {/* Title */}
            <h2 className="text-[28px] md:text-[32px] font-bold text-gray-900 tracking-tight leading-tight mb-3">
              Let providers find you
            </h2>

            {/* Subtitle */}
            <p className="text-[16px] text-gray-600 leading-relaxed max-w-sm mb-8">
              {displayCity
                ? `Providers in ${displayCity} will be able to see your care needs and reach out.`
                : "Providers will be able to see your care needs and reach out."}
            </p>

            {/* Error message */}
            {publishError && (
              <p className="text-sm text-red-600 mb-4">{publishError}</p>
            )}

            {/* Go Live button */}
            <button
              type="button"
              onClick={handleGoLive}
              disabled={publishing}
              className="w-full max-w-xs py-4 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {publishing ? "Publishing..." : "Go Live"}
            </button>

            {/* Maybe later */}
            <button
              type="button"
              onClick={handleMaybeLater}
              disabled={publishing}
              className="mt-4 py-2 text-[15px] text-gray-400 hover:text-gray-600 font-medium transition-colors disabled:opacity-50"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Wizard Steps ──
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px] animate-fade-in"
        onClick={onClose}
      />

      {/* Sheet/Modal */}
      <div
        className={[
          "relative bg-white w-full flex flex-col",
          // Mobile: bottom sheet
          "max-h-[92dvh] animate-sheet-up rounded-t-2xl",
          // Desktop: centered modal
          "sm:max-w-[480px] sm:max-h-[85dvh] sm:animate-modal-pop sm:rounded-2xl",
        ].join(" ")}
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {/* Drag handle — mobile only */}
        <div className="sm:hidden flex justify-center pt-2 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-3 sm:pt-5 pb-2 shrink-0">
          {/* Back button */}
          <div className="w-10">
            {step > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="w-10 h-10 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label="Go back"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
          </div>

          {/* Progress */}
          <ProgressDots current={step - 1} total={5} />

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 pb-6">
          {/* Step 1: Care Type */}
          {step === 1 && (
            <div className="animate-step-in">
              <h3 className="text-xl font-semibold text-gray-900 mb-1 mt-2">
                What type of care are you looking for?
              </h3>
              <p className="text-sm text-gray-500 mb-5">Select all that apply</p>

              <div className="space-y-2">
                {CARE_TYPES.map((type) => (
                  <TappableOption
                    key={type}
                    selected={careTypes.includes(type)}
                    onClick={() => toggleCareType(type)}
                  >
                    {type}
                  </TappableOption>
                ))}
              </div>

              {careTypes.length > 0 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="w-full mt-6 py-3.5 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl transition-colors"
                >
                  Continue
                </button>
              ) : (
                <button
                  type="button"
                  onClick={nextStep}
                  className="w-full mt-6 py-2 text-[14px] text-gray-400 hover:text-gray-600 font-medium transition-colors"
                >
                  Skip
                </button>
              )}
            </div>
          )}

          {/* Step 2: Care Needs */}
          {step === 2 && (
            <div className="animate-step-in">
              <h3 className="text-xl font-semibold text-gray-900 mb-1 mt-2">
                What kind of help is needed?
              </h3>
              <p className="text-sm text-gray-500 mb-5">Select all that apply</p>

              <div className="space-y-2">
                {CARE_NEEDS.map((need) => (
                  <TappableOption
                    key={need}
                    selected={careNeeds.includes(need)}
                    onClick={() => toggleCareNeed(need)}
                  >
                    {need}
                  </TappableOption>
                ))}
              </div>

              {careNeeds.length > 0 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="w-full mt-6 py-3.5 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl transition-colors"
                >
                  Continue
                </button>
              ) : (
                <button
                  type="button"
                  onClick={nextStep}
                  className="w-full mt-6 py-2 text-[14px] text-gray-400 hover:text-gray-600 font-medium transition-colors"
                >
                  Skip
                </button>
              )}
            </div>
          )}

          {/* Step 3: Payment */}
          {step === 3 && (
            <div className="animate-step-in">
              <h3 className="text-xl font-semibold text-gray-900 mb-1 mt-2">
                How will you pay for care?
              </h3>
              <p className="text-sm text-gray-500 mb-5">Select all that apply</p>

              <div className="space-y-2">
                {PAYMENT_OPTIONS.map((option) => (
                  <TappableOption
                    key={option}
                    selected={payments.includes(option)}
                    onClick={() => togglePayment(option)}
                  >
                    {option}
                  </TappableOption>
                ))}
              </div>

              {payments.length > 0 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="w-full mt-6 py-3.5 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl transition-colors"
                >
                  Continue
                </button>
              ) : (
                <button
                  type="button"
                  onClick={nextStep}
                  className="w-full mt-6 py-2 text-[14px] text-gray-400 hover:text-gray-600 font-medium transition-colors"
                >
                  Skip
                </button>
              )}
            </div>
          )}

          {/* Step 4: Schedule */}
          {step === 4 && (
            <div className="animate-step-in">
              <h3 className="text-xl font-semibold text-gray-900 mb-1 mt-2">
                Preferred schedule?
              </h3>
              <p className="text-sm text-gray-500 mb-5">When do you need care</p>

              <div className="space-y-2">
                {SCHEDULE_OPTIONS.map((option) => (
                  <TappableOption
                    key={option.value}
                    selected={schedule === option.value}
                    onClick={() => {
                      setSchedule(option.value);
                      // Auto-advance after single selection
                      setTimeout(() => nextStep(), 150);
                    }}
                  >
                    {option.label}
                  </TappableOption>
                ))}
              </div>

              <button
                type="button"
                onClick={nextStep}
                className="w-full mt-6 py-2 text-[14px] text-gray-400 hover:text-gray-600 font-medium transition-colors"
              >
                Skip
              </button>
            </div>
          )}

          {/* Step 5: Quick Details */}
          {step === 5 && (
            <div className="animate-step-in">
              <h3 className="text-xl font-semibold text-gray-900 mb-1 mt-2">
                A few quick details
              </h3>
              <p className="text-sm text-gray-500 mb-5">Help providers understand your needs</p>

              <div className="space-y-5">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Your name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full px-4 py-3 rounded-xl bg-gray-100 border-0 focus:bg-white focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-gray-900 placeholder:text-gray-400"
                  />
                </div>

                {/* Phone - only show if not already collected */}
                {!hasPhone && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Phone number
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(555) 123-4567"
                      className="w-full px-4 py-3 rounded-xl bg-gray-100 border-0 focus:bg-white focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-gray-900 placeholder:text-gray-400"
                    />
                  </div>
                )}

                {/* Location */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Location
                  </label>
                  <input
                    ref={cityInputRef}
                    type="text"
                    value={locationInput}
                    onChange={(e) => {
                      setLocationInput(e.target.value);
                      setShowCityDropdown(true);
                    }}
                    onFocus={() => setShowCityDropdown(true)}
                    placeholder="Search for your city..."
                    className="w-full px-4 py-3 rounded-xl bg-gray-100 border-0 focus:bg-white focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-gray-900 placeholder:text-gray-400"
                  />
                  <LocationDropdown
                    inputRef={cityInputRef}
                    dropdownRef={dropdownRef}
                    results={cityResults}
                    onSelect={handleCitySelect}
                    show={showCityDropdown}
                  />
                </div>

                {/* Age */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Age of care recipient
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="120"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="Enter age"
                    className="w-full max-w-[140px] px-4 py-3 rounded-xl bg-gray-100 border-0 focus:bg-white focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-gray-900 placeholder:text-gray-400"
                  />
                </div>
              </div>

              {/* Error message */}
              {saveError && (
                <p className="mt-4 text-sm text-red-600 text-center">{saveError}</p>
              )}

              {/* Done button */}
              <button
                type="button"
                onClick={saveAll}
                disabled={saving}
                className="w-full mt-6 py-4 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : "Done"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
