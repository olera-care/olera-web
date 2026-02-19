"use client";

import { useState, useRef, useEffect } from "react";
import StepIndicator from "@/components/providers/connection-card/StepIndicator";
import Pill from "@/components/providers/connection-card/Pill";
import { useCitySearch } from "@/hooks/use-city-search";
import {
  INTAKE_STEPS,
  TOTAL_INTAKE_STEPS,
  CARE_PREFERENCES,
  PRIMARY_NEEDS,
  INCOME_RANGES,
  MEDICAID_STATUSES,
  createEmptyIntakeAnswers,
} from "@/lib/types/benefits";
import type {
  BenefitsIntakeAnswers,
  CarePreference,
  PrimaryNeed,
  IncomeRange,
  MedicaidStatus,
  IntakeStep,
} from "@/lib/types/benefits";

// US state name → abbreviation for geolocation reverse-geocode
const stateAbbreviations: Record<string, string> = {
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

interface BenefitsIntakeFormProps {
  onSubmit: (answers: BenefitsIntakeAnswers, locationDisplay: string) => void;
}

export default function BenefitsIntakeForm({
  onSubmit,
}: BenefitsIntakeFormProps) {
  const [step, setStep] = useState<IntakeStep>(0);
  const [answers, setAnswers] = useState<BenefitsIntakeAnswers>(
    createEmptyIntakeAnswers()
  );
  const [locationInput, setLocationInput] = useState("");
  const [selectedStateCode, setSelectedStateCode] = useState<string | null>(null);
  const [ageInput, setAgeInput] = useState("");
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [isGeolocating, setIsGeolocating] = useState(false);

  const locationInputRef = useRef<HTMLInputElement>(null);
  const locationDropdownRef = useRef<HTMLDivElement>(null);

  const { results: cityResults, preload: preloadCities } = useCitySearch(locationInput);

  const stepInfo = INTAKE_STEPS[step];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        locationDropdownRef.current &&
        !locationDropdownRef.current.contains(e.target as Node)
      ) {
        setShowLocationDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ─── Geolocation ─────────────────────────────────────────────────────

  function detectLocation() {
    if (!navigator.geolocation) return;

    setIsGeolocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}&countrycodes=us`
          );
          const data = await response.json();

          const country = data.address?.country_code?.toUpperCase();
          if (country !== "US") {
            setIsGeolocating(false);
            return;
          }

          const city =
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            data.address?.county ||
            "Unknown";
          const stateName = data.address?.state || "";
          const stateAbbr =
            stateAbbreviations[stateName] || stateName.substring(0, 2).toUpperCase();

          setLocationInput(`${city}, ${stateAbbr}`);
          setSelectedStateCode(stateAbbr);
          setShowLocationDropdown(false);
        } catch {
          // Silently fail
        }
        setIsGeolocating(false);
      },
      () => {
        setIsGeolocating(false);
      }
    );
  }

  // ─── Validation ──────────────────────────────────────────────────────

  function canProceed(): boolean {
    switch (step) {
      case 0:
        return locationInput.trim().length > 0 && selectedStateCode !== null;
      case 1: {
        const age = parseInt(ageInput, 10);
        return !isNaN(age) && age >= 18 && age <= 120;
      }
      case 2:
        return answers.carePreference !== null;
      case 3:
        return answers.primaryNeeds.length > 0;
      case 4:
        return answers.incomeRange !== null;
      case 5:
        return answers.medicaidStatus !== null;
      default:
        return false;
    }
  }

  // ─── Navigation ──────────────────────────────────────────────────────

  function handleNext() {
    if (!canProceed()) return;

    if (step === 0) {
      setAnswers((prev) => ({
        ...prev,
        stateCode: selectedStateCode,
        zipCode: /^\d{5}$/.test(locationInput.trim()) ? locationInput.trim() : null,
      }));
    }

    if (step === 1) {
      setAnswers((prev) => ({ ...prev, age: parseInt(ageInput, 10) }));
    }

    if (step < 5) {
      setStep((step + 1) as IntakeStep);
    } else {
      const final: BenefitsIntakeAnswers = {
        ...answers,
        stateCode: selectedStateCode,
        zipCode: /^\d{5}$/.test(locationInput.trim()) ? locationInput.trim() : null,
        age: parseInt(ageInput, 10),
      };
      onSubmit(final, locationInput);
    }
  }

  function handleBack() {
    if (step > 0) setStep((step - 1) as IntakeStep);
  }

  // ─── Render Helpers ──────────────────────────────────────────────────

  function toggleNeed(need: PrimaryNeed) {
    setAnswers((prev) => {
      const has = prev.primaryNeeds.includes(need);
      return {
        ...prev,
        primaryNeeds: has
          ? prev.primaryNeeds.filter((n) => n !== need)
          : [...prev.primaryNeeds, need],
      };
    });
  }

  return (
    <div className="w-full">
      <StepIndicator current={step} total={TOTAL_INTAKE_STEPS} />

      <p className="text-lg font-semibold text-gray-800 mb-1 mt-4">
        {stepInfo.title}
      </p>
      <p className="text-base text-gray-600 mb-5">
        {step === 0 ? "Where are you located?" : stepInfo.question}
      </p>

      {/* Step 0: Smart Location Input */}
      {step === 0 && (
        <div className="relative mb-4" ref={locationDropdownRef}>
          <div
            className={`flex items-center px-4 py-3 bg-white rounded-xl border transition-colors cursor-text ${
              showLocationDropdown
                ? "border-primary-400 ring-2 ring-primary-100"
                : "border-gray-200 hover:border-gray-300"
            }`}
            onClick={() => {
              setShowLocationDropdown(true);
              locationInputRef.current?.focus();
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
              ref={locationInputRef}
              type="text"
              value={locationInput}
              onChange={(e) => {
                setLocationInput(e.target.value);
                setSelectedStateCode(null);
                setShowLocationDropdown(true);
              }}
              onFocus={() => {
                setShowLocationDropdown(true);
                preloadCities();
              }}
              placeholder="City or ZIP code"
              className="w-full ml-3 bg-transparent border-none text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-0 text-base"
            />
          </div>

          {/* Location Dropdown */}
          {showLocationDropdown && (
            <div className="absolute left-0 top-[calc(100%+8px)] w-full bg-white rounded-xl shadow-xl border border-gray-200 py-3 z-50 max-h-[340px] overflow-y-auto">
              {/* Use Current Location */}
              <div className="px-3 pb-3">
                <button
                  type="button"
                  onClick={detectLocation}
                  disabled={isGeolocating}
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-lg text-primary-700 font-medium transition-colors disabled:opacity-60"
                >
                  {isGeolocating ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0013 3.06V1h-2v2.06A8.994 8.994 0 003.06 11H1v2h2.06A8.994 8.994 0 0011 20.94V23h2v-2.06A8.994 8.994 0 0020.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" />
                    </svg>
                  )}
                  <span>{isGeolocating ? "Detecting location..." : "Use my current location"}</span>
                </button>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 px-4 py-1">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400 font-medium">or search</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* Popular Cities Label */}
              {!locationInput.trim() && cityResults.length > 0 && (
                <div className="px-4 pt-2 pb-1">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Popular cities
                  </span>
                </div>
              )}

              {/* City Results */}
              {cityResults.length > 0 ? (
                cityResults.map((loc) => (
                  <button
                    key={loc.full}
                    type="button"
                    onClick={() => {
                      setLocationInput(loc.full);
                      setSelectedStateCode(loc.state);
                      setShowLocationDropdown(false);
                    }}
                    className={`flex items-center gap-3 w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors ${
                      locationInput === loc.full
                        ? "bg-primary-50 text-primary-700"
                        : "text-gray-900"
                    }`}
                  >
                    <svg
                      className="w-4 h-4 text-gray-400 flex-shrink-0"
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
              ) : (
                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                  No locations found
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Step 1: Age */}
      {step === 1 && (
        <div className="mb-4">
          <input
            type="text"
            inputMode="numeric"
            maxLength={3}
            value={ageInput}
            onChange={(e) => setAgeInput(e.target.value.replace(/\D/g, ""))}
            placeholder="e.g. 72"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-lg text-gray-700 outline-none focus:border-primary-600 transition-colors"
          />
        </div>
      )}

      {/* Step 2: Care preference */}
      {step === 2 && (
        <div className="flex flex-col gap-2 mb-4">
          {(Object.entries(CARE_PREFERENCES) as [CarePreference, { displayTitle: string; icon: string }][]).map(
            ([key, val]) => (
              <Pill
                key={key}
                label={`${val.icon} ${val.displayTitle}`}
                selected={answers.carePreference === key}
                onClick={() =>
                  setAnswers((prev) => ({ ...prev, carePreference: key }))
                }
              />
            )
          )}
        </div>
      )}

      {/* Step 3: Primary needs (multi-select) */}
      {step === 3 && (
        <>
          <p className="text-sm text-gray-500 mb-2">Select all that apply</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {(Object.entries(PRIMARY_NEEDS) as [PrimaryNeed, { displayTitle: string; icon: string }][]).map(
              ([key, val]) => (
                <Pill
                  key={key}
                  label={`${val.icon} ${val.displayTitle}`}
                  selected={answers.primaryNeeds.includes(key)}
                  onClick={() => toggleNeed(key)}
                />
              )
            )}
          </div>
        </>
      )}

      {/* Step 4: Income range */}
      {step === 4 && (
        <div className="flex flex-col gap-2 mb-4">
          {(Object.entries(INCOME_RANGES) as [IncomeRange, { displayTitle: string }][]).map(
            ([key, val]) => (
              <Pill
                key={key}
                label={val.displayTitle}
                selected={answers.incomeRange === key}
                onClick={() =>
                  setAnswers((prev) => ({ ...prev, incomeRange: key }))
                }
              />
            )
          )}
        </div>
      )}

      {/* Step 5: Medicaid status */}
      {step === 5 && (
        <div className="flex flex-col gap-2 mb-4">
          {(Object.entries(MEDICAID_STATUSES) as [MedicaidStatus, { displayTitle: string }][]).map(
            ([key, val]) => (
              <Pill
                key={key}
                label={val.displayTitle}
                selected={answers.medicaidStatus === key}
                onClick={() =>
                  setAnswers((prev) => ({ ...prev, medicaidStatus: key }))
                }
              />
            )
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between mt-2">
        {step > 0 ? (
          <button
            onClick={handleBack}
            className="text-base text-gray-500 cursor-pointer bg-transparent border-none hover:text-gray-700 transition-colors font-medium"
          >
            &larr; Back
          </button>
        ) : (
          <div />
        )}
        <button
          onClick={handleNext}
          disabled={!canProceed()}
          className={`px-8 py-2.5 border-none rounded-[10px] text-base font-semibold cursor-pointer transition-all duration-200 ${
            canProceed()
              ? "bg-primary-600 text-white hover:bg-primary-500"
              : "bg-gray-200 text-gray-400 cursor-default"
          }`}
        >
          {step === 5 ? "Find Benefits" : "Next"}
        </button>
      </div>
    </div>
  );
}
