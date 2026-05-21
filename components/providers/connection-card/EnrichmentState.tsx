"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useCitySearch } from "@/hooks/use-city-search";
import { RECIPIENT_OPTIONS } from "./constants";
import type { CareRecipient } from "./types";

type EnrichmentStep = "recipient" | "timeline" | "careType" | "careNeed" | "payment" | "details";
type TimelineValue = "immediate" | "within_1_month" | "within_3_months" | "exploring";
type ContactPref = "Call" | "Text" | "Email";

interface EnrichmentStateProps {
  providerName: string;
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
  { label: "Personal care", value: "personal_care" },
  { label: "Household tasks", value: "household_tasks" },
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

// Location Dropdown with Portal
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

export default function EnrichmentState({
  providerName,
  onSave,
  onSkip,
  saving,
  priceRange = null,
  careTypes: _careTypes,
  successTitle,
  successSubtitle,
  hideSuccessBanner = false,
  providerCity,
  providerState,
}: EnrichmentStateProps) {
  void _careTypes; // Suppress unused variable warning

  const [step, setStep] = useState<EnrichmentStep>("recipient");

  // Step 1: Recipient
  const [recipient, setRecipient] = useState<CareRecipient | null>(null);
  // Step 2: Timeline
  const [timeline, setTimeline] = useState<TimelineValue | null>(null);
  // Step 3: Care Type
  const [careType, setCareType] = useState<string | null>(null);
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

  // Compute display values
  const displayTitle = successTitle ?? `Sent to ${providerName}`;
  const displaySubtitle = successSubtitle ?? (priceRange ? `${priceRange} estimated` : null);

  // Preload cities on mount
  useEffect(() => {
    preloadCities();
  }, [preloadCities]);

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
    setTimeout(() => setStep("timeline"), 150);
  }, []);

  // Step 2: Select timeline → auto-advance
  const selectTimeline = useCallback((val: TimelineValue) => {
    setTimeline(val);
    setTimeout(() => setStep("careType"), 150);
  }, []);

  // Step 3: Select care type → auto-advance
  const selectCareType = useCallback((val: string) => {
    setCareType(val);
    setTimeout(() => setStep("careNeed"), 150);
  }, []);

  // Step 4: Select care need → auto-advance
  const selectCareNeed = useCallback((val: string) => {
    setCareNeed(val);
    setTimeout(() => setStep("payment"), 150);
  }, []);

  // Step 5: Select payment → auto-advance
  const selectPayment = useCallback((val: string) => {
    setPaymentMethod(val);
    setTimeout(() => setStep("details"), 150);
  }, []);

  // Step 6: Details form submission → save all data
  const handleDetailsSubmit = useCallback(() => {
    onSave(getAllData());
  }, [onSave, getAllData]);

  // Handle city selection
  const handleCitySelect = useCallback((cityName: string, stateCode: string) => {
    setCity(cityName);
    setState(stateCode);
    setLocationInput(`${cityName}, ${stateCode}`);
    setShowCityDropdown(false);
  }, []);

  // Skip from any step — save whatever we have
  const handleSkip = useCallback(() => {
    if (step === "recipient" && !recipient) {
      onSkip();
    } else {
      onSave(getAllData());
    }
  }, [step, recipient, onSave, onSkip, getAllData]);

  // Progress indicator (steps 1-6)
  const stepNumber = {
    recipient: 1,
    timeline: 2,
    careType: 3,
    careNeed: 4,
    payment: 5,
    details: 6,
  }[step];
  const totalSteps = 6;

  return (
    <div>
      {/* Success banner */}
      {!hideSuccessBanner && (
        <div className="mb-6 bg-emerald-50/60 rounded-xl p-4 border border-emerald-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-emerald-600"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div>
              <p className="text-[15px] font-semibold text-gray-900">
                {displayTitle}
              </p>
              {displaySubtitle && (
                <p className="text-[13px] text-gray-500 mt-0.5">
                  {displaySubtitle}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Progress dots */}
      <div className="flex items-center justify-center gap-1.5 mb-4">
        {Array.from({ length: totalSteps }, (_, i) => (
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

      {/* Step 4: What help is needed most? */}
      {step === "careNeed" && (
        <div className="animate-in fade-in duration-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            What help is needed most?
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
                className="w-full px-4 py-3 rounded-xl bg-gray-100 border-0 focus:bg-white focus:ring-2 focus:ring-gray-900/10 outline-none transition-all text-gray-900 placeholder:text-gray-400"
              />
              <LocationDropdown
                inputRef={cityInputRef}
                dropdownRef={dropdownRef}
                results={cityResults}
                onSelect={handleCitySelect}
                show={showCityDropdown}
              />
            </div>
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

    </div>
  );
}
