"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { useCitySearch } from "@/hooks/use-city-search";
import { RECIPIENT_OPTIONS } from "./constants";
import type { CareRecipient } from "./types";
import {
  trackEnrichmentStarted,
  trackEnrichmentStepCompleted,
  trackEnrichmentStepSkipped,
  trackEnrichmentCompleted,
  trackEnrichmentGoLive,
  trackEnrichmentGoLiveSkipped,
  type EnrichmentStep as EnrichmentStepNumber,
} from "@/lib/analytics/enrichment-tracking";

type EnrichmentStep = "recipient" | "timeline" | "careType" | "careNeed" | "payment" | "details" | "goLive";

// Map step names to step numbers for tracking
const STEP_TO_NUMBER: Record<EnrichmentStep, EnrichmentStepNumber> = {
  recipient: 1,
  timeline: 2,
  careType: 3,
  careNeed: 4,
  payment: 5,
  details: 6,
  goLive: 6, // Go Live doesn't have its own tracking number - it's part of step 6
};
type TimelineValue = "immediate" | "within_1_month" | "within_3_months" | "exploring";
type ContactPref = "Call" | "Text" | "Email";

interface EnrichmentStateProps {
  providerName: string;
  /** Provider ID/slug for analytics tracking */
  providerId: string;
  onSave: (data: {
    careRecipient?: CareRecipient;
    urgency?: string;
    contactPreference?: ContactPref;
    phone?: string;
    careType?: string;
    careNeed?: string;
    paymentMethod?: string;
    name?: string;
    city?: string;
    state?: string;
  }) => void;
  onSkip: () => void;
  saving?: boolean;
  priceRange?: string | null;
  /** @deprecated No longer used in new UI but kept for backward compatibility */
  careTypes?: string[];
  /** Provider's category (e.g., "Home Care") - used to pre-fill care type and skip that step */
  providerCategory?: string | null;
  /** Custom success banner title. Defaults to "Sent to {providerName}" */
  successTitle?: string;
  /** Custom success banner subtitle. Defaults to "{priceRange} estimated" if priceRange exists */
  successSubtitle?: string;
  /** Hide the success banner entirely */
  hideSuccessBanner?: boolean;
  /** Provider's city for location pre-fill */
  providerCity?: string | null;
  /** Provider's state for location pre-fill */
  providerState?: string | null;
  /** CTA variant for A/B test attribution */
  ctaVariant?: string | null;
  /** CTA surface (desktop/mobile) */
  ctaSurface?: "desktop" | "mobile";
  /** Provider image URL for avatar in success banner */
  providerImage?: string | null;
  /** Multiple provider images for stacked avatars (Compare variant) */
  providerImages?: (string | null)[];
  /** Whether user's profile is already published (skip Go Live step) */
  isAlreadyLive?: boolean;
}

const TIMELINE_OPTIONS: { label: string; value: TimelineValue }[] = [
  { label: "As soon as possible", value: "immediate" },
  { label: "Within a month", value: "within_1_month" },
  { label: "In a few months", value: "within_3_months" },
  { label: "Just researching", value: "exploring" },
];

const CARE_TYPE_OPTIONS: { label: string; value: string }[] = [
  { label: "Home Care", value: "home_care" },
  { label: "Home Health Care", value: "home_health" },
  { label: "Assisted Living", value: "assisted_living" },
  { label: "Memory Care", value: "memory_care" },
  { label: "Nursing Home", value: "nursing_home" },
  { label: "Independent Living", value: "independent_living" },
];

const CARE_NEED_OPTIONS: { label: string; value: string }[] = [
  { label: "Daily living help", value: "daily_living" }, // Covers personal care + household tasks
  { label: "Health management", value: "health_management" },
  { label: "Companionship", value: "companionship" },
  { label: "Memory care", value: "memory_care" },
  { label: "Mobility help", value: "mobility_help" },
];

const PAYMENT_OPTIONS: { label: string; value: string }[] = [
  { label: "Medicare", value: "medicare" },
  { label: "Medicaid", value: "medicaid" },
  { label: "Private insurance", value: "private_insurance" },
  { label: "Private pay", value: "private_pay" },
  { label: "Veterans benefits", value: "veterans_benefits" },
  { label: "Long-term care insurance", value: "long_term_care_insurance" },
];

// Location Dropdown with Portal - updates position on scroll/resize
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

  // Update position when shown and on scroll/resize
  useEffect(() => {
    if (!show || !inputRef.current) return;

    const updatePosition = () => {
      if (!inputRef.current) return;
      const rect = inputRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
      });
    };

    // Initial position
    updatePosition();

    // Update on scroll (capture phase to catch all scrollable containers)
    const handleScroll = () => updatePosition();
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleScroll);
    };
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

// Map provider category to care type values
// Handles both database format (e.g., "home_care_agency") from profile.category
// and display format (e.g., "Home Care") from careTypes array
const CATEGORY_TO_CARE_TYPE: Record<string, string> = {
  // Database format (from profile.category via CTAVariantRouter)
  "home_care_agency": "home_care",
  "home_health_agency": "home_health",
  "hospice_agency": "home_health",
  "assisted_living": "assisted_living",
  "memory_care": "memory_care",
  "nursing_home": "nursing_home",
  "independent_living": "independent_living",
  "adult_day_care": "home_care",
  "inpatient_hospice": "home_health",
  "rehab_facility": "home_health",
  "wellness_center": "home_care",
  "private_caregiver": "home_care",
  // Display format (from careTypes[0] in some components)
  "Home Care": "home_care",
  "Home Care (Non-medical)": "home_care",
  "Home Health Care": "home_health",
  "Home Health": "home_health",
  "Assisted Living": "assisted_living",
  "Memory Care": "memory_care",
  "Nursing Home": "nursing_home",
  "Independent Living": "independent_living",
  "Hospice": "home_health",
  "Inpatient Hospice": "home_health",
  "Adult Day Care": "home_care",
  "Rehabilitation": "home_health",
  "Wellness Center": "home_care",
  "Private Caregiver": "home_care",
};

export default function EnrichmentState({
  providerName,
  providerId,
  onSave,
  onSkip,
  saving,
  priceRange = null,
  careTypes: _careTypes,
  providerCategory,
  successTitle,
  successSubtitle,
  hideSuccessBanner = false,
  providerCity,
  providerState,
  ctaVariant,
  ctaSurface,
  providerImage,
  providerImages,
  isAlreadyLive = false,
}: EnrichmentStateProps) {
  void _careTypes; // Suppress unused variable warning
  void providerImage; // Props kept for API compatibility
  void providerImages; // Props kept for API compatibility

  // Pre-fill care type from provider category
  const prefilledCareType = providerCategory ? CATEGORY_TO_CARE_TYPE[providerCategory] || null : null;

  const [step, setStep] = useState<EnrichmentStep>("recipient");
  const hasTrackedStart = useRef(false);

  // Track enrichment started on mount
  useEffect(() => {
    if (!hasTrackedStart.current && providerId) {
      hasTrackedStart.current = true;
      trackEnrichmentStarted({ providerId, ctaVariant, ctaSurface });
    }
  }, [providerId, ctaVariant, ctaSurface]);

  // Tracking params for all events (memoized to prevent useCallback recreation)
  const trackingParams = useMemo(
    () => ({ providerId, ctaVariant, ctaSurface }),
    [providerId, ctaVariant, ctaSurface]
  );

  // Step 1: Recipient
  const [recipient, setRecipient] = useState<CareRecipient | null>(null);
  // Step 2: Timeline
  const [timeline, setTimeline] = useState<TimelineValue | null>(null);
  // Step 3: Care Type (pre-filled from provider category if available)
  const [careType, setCareType] = useState<string | null>(prefilledCareType);
  // Step 4: Care Need
  const [careNeed, setCareNeed] = useState<string | null>(null);
  // Step 5: Payment
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  // Step 6: Details
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState(providerCity || "");
  const [state, setState] = useState(providerState || "");
  const [locationInput, setLocationInput] = useState(
    providerCity && providerState ? `${providerCity}, ${providerState}` : ""
  );
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const cityInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { results: cityResults, preload: preloadCities } = useCitySearch(locationInput);

  // Step 7: Go Live
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  // Compute display values for success banner
  const displayTitle = successTitle ?? `Connected with ${providerName}`;

  // Preload cities on mount
  useEffect(() => {
    preloadCities();
  }, [preloadCities]);

  // Preload Go Live illustration so it's ready when user reaches that step
  useEffect(() => {
    if (!isAlreadyLive) {
      const img = new window.Image();
      img.src = "/illustration-go-live.png";
    }
  }, [isAlreadyLive]);

  // Close dropdown on click outside
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

  // Gather all collected data
  const getAllData = useCallback(() => ({
    careRecipient: recipient || undefined,
    urgency: timeline || undefined,
    careType: careType || undefined,
    careNeed: careNeed || undefined,
    paymentMethod: paymentMethod || undefined,
    name: name.trim() || undefined,
    phone: phone.trim() || undefined,
    city: city || undefined,
    state: state || undefined,
  }), [recipient, timeline, careType, careNeed, paymentMethod, name, phone, city, state]);

  // Step 1: Select recipient → auto-advance
  const selectRecipient = useCallback((val: CareRecipient) => {
    setRecipient(val);
    trackEnrichmentStepCompleted(1, trackingParams);
    setTimeout(() => setStep("timeline"), 150);
  }, [trackingParams]);

  // Step 2: Select timeline → auto-advance (skip careType if pre-filled)
  const selectTimeline = useCallback((val: TimelineValue) => {
    setTimeline(val);
    trackEnrichmentStepCompleted(2, trackingParams);
    // If care type is pre-filled from provider category, skip step 3 and go to step 4
    if (prefilledCareType) {
      trackEnrichmentStepCompleted(3, trackingParams); // Mark step 3 as completed (pre-filled)
      setTimeout(() => setStep("careNeed"), 150);
    } else {
      setTimeout(() => setStep("careType"), 150);
    }
  }, [trackingParams, prefilledCareType]);

  // Step 3: Select care type → auto-advance (only shown if not pre-filled)
  const selectCareType = useCallback((val: string) => {
    setCareType(val);
    trackEnrichmentStepCompleted(3, trackingParams);
    setTimeout(() => setStep("careNeed"), 150);
  }, [trackingParams]);

  // Step 4: Select care need → auto-advance
  const selectCareNeed = useCallback((val: string) => {
    setCareNeed(val);
    trackEnrichmentStepCompleted(4, trackingParams);
    setTimeout(() => setStep("payment"), 150);
  }, [trackingParams]);

  // Step 5: Select payment → auto-advance
  const selectPayment = useCallback((val: string) => {
    setPaymentMethod(val);
    trackEnrichmentStepCompleted(5, trackingParams);
    setTimeout(() => setStep("details"), 150);
  }, [trackingParams]);

  // Step 6: Details form submission → advance to Go Live step (or complete if already live)
  const handleDetailsSubmit = useCallback(() => {
    trackEnrichmentStepCompleted(6, trackingParams);
    if (isAlreadyLive) {
      // User is already live - skip Go Live step, just save and complete
      trackEnrichmentCompleted(trackingParams);
      onSave(getAllData());
    } else {
      setTimeout(() => setStep("goLive"), 150);
    }
  }, [trackingParams, isAlreadyLive, onSave, getAllData]);

  // Handle city selection
  const handleCitySelect = useCallback((cityName: string, stateCode: string) => {
    setCity(cityName);
    setState(stateCode);
    setLocationInput(`${cityName}, ${stateCode}`);
    setShowCityDropdown(false);
  }, []);

  // Skip from any step — advance to next step (save & exit only on final step)
  const handleSkip = useCallback(() => {
    const currentStepNumber = STEP_TO_NUMBER[step];

    // Calculate which steps were completed before skipping
    const completedSteps: EnrichmentStepNumber[] = [];
    if (recipient) completedSteps.push(1);
    if (timeline) completedSteps.push(2);
    if (careType) completedSteps.push(3);
    if (careNeed) completedSteps.push(4);
    if (paymentMethod) completedSteps.push(5);

    // Track the skip event
    trackEnrichmentStepSkipped(currentStepNumber, trackingParams, completedSteps);

    // Advance to next step (or save & exit on final step)
    switch (step) {
      case "recipient":
        setTimeout(() => setStep("timeline"), 150);
        break;
      case "timeline":
        // If care type is pre-filled, skip to careNeed
        if (prefilledCareType) {
          setTimeout(() => setStep("careNeed"), 150);
        } else {
          setTimeout(() => setStep("careType"), 150);
        }
        break;
      case "careType":
        setTimeout(() => setStep("careNeed"), 150);
        break;
      case "careNeed":
        setTimeout(() => setStep("payment"), 150);
        break;
      case "payment":
        setTimeout(() => setStep("details"), 150);
        break;
      case "details":
        // Advance to Go Live step (or complete if already live)
        if (isAlreadyLive) {
          // User is already live - skip Go Live step
          const userSelectedCareType1 = !prefilledCareType && careType;
          const hasUserProvidedData1 = recipient || timeline || userSelectedCareType1 || careNeed || paymentMethod || name.trim() || phone.trim();
          trackEnrichmentCompleted(trackingParams);
          if (hasUserProvidedData1) {
            onSave(getAllData());
          } else {
            onSkip();
          }
        } else {
          setTimeout(() => setStep("goLive"), 150);
        }
        break;
      case "goLive":
        // "Maybe later" on Go Live - save data and complete
        const userSelectedCareType = !prefilledCareType && careType;
        const hasUserProvidedData = recipient || timeline || userSelectedCareType || careNeed || paymentMethod || name.trim() || phone.trim();
        trackEnrichmentCompleted(trackingParams);
        if (hasUserProvidedData) {
          onSave(getAllData());
        } else {
          onSkip();
        }
        break;
    }
  }, [step, recipient, timeline, careType, careNeed, paymentMethod, name, phone, prefilledCareType, isAlreadyLive, onSave, onSkip, getAllData, trackingParams]);

  // Progress indicator - excludes Go Live step (it has its own UI without progress dots)
  // Also excludes Go Live from count when user is already live
  const getBaseSteps = () => {
    if (isAlreadyLive) {
      // Already live: 5 steps (no careType) or 6 steps (with careType), no Go Live
      return prefilledCareType ? 5 : 6;
    } else {
      // Not live: 6 steps (no careType) or 7 steps (with careType), includes Go Live
      return prefilledCareType ? 6 : 7;
    }
  };
  const totalSteps = getBaseSteps();

  // Adjust step numbers when careType is skipped and/or user is already live
  const getStepNumber = (): number => {
    if (prefilledCareType) {
      const map: Record<string, number> = { recipient: 1, timeline: 2, careNeed: 3, payment: 4, details: 5, goLive: 6 };
      return map[step] ?? 1;
    }
    const map: Record<string, number> = { recipient: 1, timeline: 2, careType: 3, careNeed: 4, payment: 5, details: 6, goLive: 7 };
    return map[step] ?? 1;
  };
  const stepNumber = getStepNumber();

  // Handle Go Live - publish profile first, then save enrichment data
  const handleGoLive = useCallback(async () => {
    setPublishing(true);
    setPublishError(null);

    try {
      // First publish the profile (before onSave which may unmount component)
      const res = await fetch("/api/care-post/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "publish" }),
      });

      if (!res.ok) {
        throw new Error("Failed to publish");
      }

      // Track Go Live event (writes to provider_activity for funnel analytics)
      trackEnrichmentGoLive(trackingParams);

      // Track completion
      trackEnrichmentCompleted(trackingParams);

      // Now save enrichment data and complete the flow (this may unmount the component)
      onSave(getAllData());

    } catch (err) {
      console.error("[EnrichmentState] Go Live failed:", err);
      setPublishError("Couldn't publish. Please try again.");
      setPublishing(false);
    }
  }, [onSave, getAllData, trackingParams]);

  // Handle "Maybe later" - save data without publishing
  const handleMaybeLater = useCallback(() => {
    trackEnrichmentCompleted(trackingParams);

    // Track Go Live skipped (writes to provider_activity for funnel analytics)
    trackEnrichmentGoLiveSkipped(trackingParams);

    // Save enrichment data and complete
    const userSelectedCareType = !prefilledCareType && careType;
    const hasUserProvidedData = recipient || timeline || userSelectedCareType || careNeed || paymentMethod || name.trim() || phone.trim();
    if (hasUserProvidedData) {
      onSave(getAllData());
    } else {
      onSkip();
    }
  }, [trackingParams, prefilledCareType, careType, recipient, timeline, careNeed, paymentMethod, name, phone, onSave, onSkip, getAllData]);

  // Compute price display for banner
  const priceDisplay = priceRange || successSubtitle;

  return (
    <div>
      {/* Success banner - shown on steps 1-6, hidden on Go Live step */}
      {step !== "goLive" && !hideSuccessBanner && (
        <div className="mb-4 bg-emerald-50/70 rounded-xl px-4 py-3 border border-emerald-100">
          <div className="flex items-center gap-2.5">
            {/* Checkmark icon */}
            <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center shrink-0">
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-white"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            {/* Text content */}
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold text-gray-900 truncate">
                {displayTitle}
              </p>
              {priceDisplay && (
                <p className="text-[12px] text-gray-600 truncate">
                  {priceDisplay}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Progress dots - hidden on Go Live step */}
      {step !== "goLive" && (
      <div className="flex items-center justify-center gap-1.5 mb-4">
        {/* When isAlreadyLive, totalSteps already excludes goLive, so don't subtract 1 */}
        {/* When !isAlreadyLive, subtract 1 to exclude goLive from dot count */}
        {Array.from({ length: isAlreadyLive ? totalSteps : totalSteps - 1 }, (_, i) => (
          <div
            key={i}
            className={`rounded-full transition-all duration-300 ${
              i < stepNumber
                ? "bg-gray-900 w-6 h-1.5"
                : i === stepNumber - 1
                ? "bg-gray-900 w-6 h-1.5"
                : "bg-gray-200 w-1.5 h-1.5"
            }`}
          />
        ))}
      </div>
      )}

      {/* Step 1: Who needs care? */}
      {step === "recipient" && (
        <div className="animate-in fade-in duration-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Who needs care?
          </h3>
          <div className="space-y-2 mb-4">
            {RECIPIENT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => selectRecipient(opt.value as CareRecipient)}
                className={`w-full py-3.5 px-4 rounded-xl text-[15px] font-medium text-center transition-all duration-150 border ${
                  recipient === opt.value
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button
            onClick={handleSkip}
            disabled={saving}
            className="w-full py-2 text-[13px] text-gray-400 hover:text-gray-600 font-normal bg-transparent border-none transition-colors disabled:opacity-50"
          >
            Skip
          </button>
        </div>
      )}

      {/* Step 2: How soon? */}
      {step === "timeline" && (
        <div className="animate-in fade-in duration-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            How soon do you need care?
          </h3>
          <div className="space-y-2 mb-4">
            {TIMELINE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => selectTimeline(opt.value)}
                className={`w-full py-3.5 px-4 rounded-xl text-[15px] font-medium text-center transition-all duration-150 border ${
                  timeline === opt.value
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button
            onClick={handleSkip}
            disabled={saving}
            className="w-full py-2 text-[13px] text-gray-400 hover:text-gray-600 font-normal bg-transparent border-none transition-colors disabled:opacity-50"
          >
            Skip
          </button>
        </div>
      )}

      {/* Step 3: What type of care? */}
      {step === "careType" && (
        <div className="animate-in fade-in duration-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            What type of care are you looking for?
          </h3>
          <div className="space-y-2 mb-4">
            {CARE_TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => selectCareType(opt.value)}
                className={`w-full py-3.5 px-4 rounded-xl text-[15px] font-medium text-center transition-all duration-150 border ${
                  careType === opt.value
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button
            onClick={handleSkip}
            disabled={saving}
            className="w-full py-2 text-[13px] text-gray-400 hover:text-gray-600 font-normal bg-transparent border-none transition-colors disabled:opacity-50"
          >
            Skip
          </button>
        </div>
      )}

      {/* Step 4: What help do you need? */}
      {step === "careNeed" && (
        <div className="animate-in fade-in duration-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            What help do you need?
          </h3>
          <div className="space-y-2 mb-4">
            {CARE_NEED_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => selectCareNeed(opt.value)}
                className={`w-full py-3.5 px-4 rounded-xl text-[15px] font-medium text-center transition-all duration-150 border ${
                  careNeed === opt.value
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button
            onClick={handleSkip}
            disabled={saving}
            className="w-full py-2 text-[13px] text-gray-400 hover:text-gray-600 font-normal bg-transparent border-none transition-colors disabled:opacity-50"
          >
            Skip
          </button>
        </div>
      )}

      {/* Step 5: How will you pay? */}
      {step === "payment" && (
        <div className="animate-in fade-in duration-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            How will you pay for care?
          </h3>
          <div className="space-y-2 mb-4">
            {PAYMENT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => selectPayment(opt.value)}
                className={`w-full py-3.5 px-4 rounded-xl text-[15px] font-medium text-center transition-all duration-150 border ${
                  paymentMethod === opt.value
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button
            onClick={handleSkip}
            disabled={saving}
            className="w-full py-2 text-[13px] text-gray-400 hover:text-gray-600 font-normal bg-transparent border-none transition-colors disabled:opacity-50"
          >
            Skip
          </button>
        </div>
      )}

      {/* Step 6: Quick details */}
      {step === "details" && (
        <div className="animate-in fade-in duration-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            A few quick details
          </h3>
          <p className="text-sm text-gray-500 mb-5">Help providers understand your needs</p>

          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Your name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-3 rounded-xl bg-gray-100 border-0 focus:bg-white focus:ring-2 focus:ring-gray-900/10 outline-none transition-all text-gray-900 placeholder:text-gray-400"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Phone number
              </label>
              <input
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 123-4567"
                autoComplete="tel"
                className="w-full px-4 py-3 rounded-xl bg-gray-100 border-0 focus:bg-white focus:ring-2 focus:ring-gray-900/10 outline-none transition-all text-gray-900 placeholder:text-gray-400"
              />
            </div>

            {/* Location is pre-filled silently from provider's city/state */}
          </div>

          {/* Done button */}
          <button
            onClick={handleDetailsSubmit}
            disabled={saving}
            className="w-full mt-6 py-3.5 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Done"}
          </button>

          {/* Skip option */}
          <button
            onClick={handleSkip}
            disabled={saving}
            className="w-full py-2 mt-2 text-[13px] text-gray-400 hover:text-gray-600 font-normal bg-transparent border-none transition-colors disabled:opacity-50"
          >
            Skip
          </button>
        </div>
      )}

      {/* ── Step 7: Go Live ── */}
      {step === "goLive" && (
        <div className="animate-step-in text-center">
          {/* Illustration */}
          <div className="w-40 h-40 mx-auto mb-4 relative">
            <Image
              src="/illustration-go-live.png"
              alt="Let care come to you"
              fill
              className="object-contain"
              priority
            />
          </div>

          {/* Title */}
          <h3 className="text-[24px] font-display font-semibold text-gray-900 mb-1.5">
            Let care come to you
          </h3>

          {/* Subtitle */}
          <p className="text-[16px] text-gray-500 mb-5 max-w-xs mx-auto">
            Providers who match you will reach out.
          </p>

          {/* Error message */}
          {publishError && (
            <p className="text-sm text-red-600 mb-4">{publishError}</p>
          )}

          {/* Go Live button */}
          <button
            onClick={handleGoLive}
            disabled={publishing}
            className="w-full py-3.5 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 touch-manipulation"
          >
            {publishing ? (
              "Publishing..."
            ) : (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                Go live
              </>
            )}
          </button>

          {/* Maybe later */}
          <button
            onClick={handleMaybeLater}
            disabled={publishing}
            className="w-full py-2 mt-3 text-[14px] text-gray-400 hover:text-gray-600 font-medium bg-transparent border-none transition-colors disabled:opacity-50"
          >
            Maybe later
          </button>
        </div>
      )}

    </div>
  );
}
