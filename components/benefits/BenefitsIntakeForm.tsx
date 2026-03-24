"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useClickOutside } from "@/hooks/use-click-outside";
import Pill from "@/components/providers/connection-card/Pill";
import { useCitySearch } from "@/hooks/use-city-search";
import { useCareProfile } from "@/lib/benefits/care-profile-context";
import { useAuth } from "@/components/auth/AuthProvider";
import type { FamilyMetadata } from "@/lib/types";
import type { VoiceMode } from "@/hooks/use-benefits-state";
import {
  INTAKE_STEPS,
  TOTAL_INTAKE_STEPS,
  CARE_PREFERENCES,
  PRIMARY_NEEDS,
  INCOME_RANGES,
  MEDICAID_STATUSES,
  VETERAN_STATUSES,
} from "@/lib/types/benefits";
import type {
  CarePreference,
  PrimaryNeed,
  IncomeRange,
  MedicaidStatus,
  VeteranStatus,
  IntakeStep,
} from "@/lib/types/benefits";
import VoiceMicButton from "./VoiceMicButton";
import VoiceModeSelection from "./VoiceModeSelection";
import GuidedVoicePrompt, { GUIDED_CONFIRMATIONS, GUIDED_PROMPTS } from "./GuidedVoicePrompt";
import type { VoiceParseResult } from "@/lib/benefits/voice-intent-parser";
import { zipToState } from "@/lib/benefits/zip-lookup";
import { useSpeechSynthesis } from "@/hooks/use-speech-synthesis";
import { preloadFullCityData } from "@/lib/us-city-search";

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

export default function BenefitsIntakeForm() {
  const {
    answers,
    step,
    locationDisplay,
    voiceMode,
    updateAnswers,
    setLocationDisplay,
    goToStep,
    submit,
    publishCarePost,
    setPublishCarePost,
    setVoiceMode,
  } = useCareProfile();
  const { user, activeProfile, openAuth } = useAuth();

  // ─── Local UI state (not shared via context) ────────────────────────────
  const [locationInput, setLocationInputLocal] = useState(locationDisplay);
  const [selectedStateCode, setSelectedStateCode] = useState<string | null>(
    answers.stateCode
  );
  const [ageInput, setAgeInput] = useState(
    answers.age ? String(answers.age) : ""
  );
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [isGeolocating, setIsGeolocating] = useState(false);
  /** Whether the user has chosen a mode yet (false = show mode selection) */
  const [modeChosen, setModeChosen] = useState(false);
  /** Guided voice: confirmation text to display */
  const [guidedConfirmation, setGuidedConfirmation] = useState<string | null>(null);
  /** Guided voice: whether mic should auto-start */
  const [guidedAutoStart, setGuidedAutoStart] = useState(false);

  // TTS narration for guided mode
  const { speak: narrate, stop: stopNarration, isSpeaking } = useSpeechSynthesis();

  const locationInputRef = useRef<HTMLInputElement>(null);
  const locationDropdownRef = useRef<HTMLDivElement>(null);
  const autoAdvanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { results: cityResults, preload: preloadCities } = useCitySearch(locationInput);

  // Preload full city data on location step (needed for voice city search)
  useEffect(() => {
    if (step === 0) preloadFullCityData();
  }, [step]);

  // ─── Pre-fill from user profile (if no draft exists) ────────────────────
  const prefillApplied = useRef(false);
  useEffect(() => {
    if (prefillApplied.current) return;
    if (!activeProfile) return;

    // Check if there's an existing draft — don't override user's work
    const hasDraft = typeof window !== "undefined" && localStorage.getItem("olera-benefits-draft");
    if (hasDraft) return;

    // Check if answers already have data (restored from DB)
    if (answers.stateCode || answers.age) return;

    prefillApplied.current = true;
    const meta = (activeProfile.metadata || {}) as FamilyMetadata;

    // Pre-fill location from profile
    if (activeProfile.city && activeProfile.state) {
      const display = `${activeProfile.city}, ${activeProfile.state}`;
      setLocationInputLocal(display);
      setLocationDisplay(display);
      setSelectedStateCode(activeProfile.state);
      updateAnswers({ stateCode: activeProfile.state });
    }

    // Pre-fill age from metadata
    if (meta.age) {
      setAgeInput(String(meta.age));
      updateAnswers({ age: meta.age });
    }

    // Map care_types to primaryNeeds
    const careTypes = activeProfile.care_types || [];
    const needsMap: Record<string, PrimaryNeed> = {
      "personal_care": "personalCare",
      "bathing": "personalCare",
      "dressing": "personalCare",
      "grooming": "personalCare",
      "household": "householdTasks",
      "housekeeping": "householdTasks",
      "meal_prep": "householdTasks",
      "medication": "healthManagement",
      "health": "healthManagement",
      "medical": "healthManagement",
      "companion": "companionship",
      "social": "companionship",
      "memory_care": "memoryCare",
      "dementia": "memoryCare",
      "alzheimers": "memoryCare",
      "mobility": "mobilityHelp",
      "transfer": "mobilityHelp",
      "wheelchair": "mobilityHelp",
    };

    const mappedNeeds: PrimaryNeed[] = [];
    for (const ct of careTypes) {
      const normalized = ct.toLowerCase().replace(/[^a-z_]/g, "");
      for (const [key, need] of Object.entries(needsMap)) {
        if (normalized.includes(key) && !mappedNeeds.includes(need)) {
          mappedNeeds.push(need);
        }
      }
    }
    if (mappedNeeds.length > 0) {
      updateAnswers({ primaryNeeds: mappedNeeds });
    }

    // Map living_situation or care_location to carePreference
    const livingSituation = meta.living_situation?.toLowerCase() || "";
    const careLocation = meta.care_location?.toLowerCase() || "";
    if (livingSituation.includes("home") || careLocation.includes("home")) {
      updateAnswers({ carePreference: "stayHome" });
    } else if (livingSituation.includes("facility") || careLocation.includes("facility") ||
               livingSituation.includes("assisted") || careLocation.includes("assisted")) {
      updateAnswers({ carePreference: "exploringFacility" });
    }

    // Pre-fill income range if available
    if (meta.income_range) {
      const incomeMap: Record<string, IncomeRange> = {
        "under_1500": "under1500",
        "under_2500": "under2500",
        "under_4000": "under4000",
        "under_6000": "under6000",
        "over_6000": "over6000",
        "prefer_not_to_say": "preferNotToSay",
      };
      const mapped = incomeMap[meta.income_range];
      if (mapped) {
        updateAnswers({ incomeRange: mapped });
      }
    }

    // Pre-fill medicaid status if available
    if (meta.medicaid_status) {
      const medicaidMap: Record<string, MedicaidStatus> = {
        "already_has": "alreadyHas",
        "has_medicaid": "alreadyHas",
        "applying": "applying",
        "not_sure": "notSure",
        "does_not_have": "doesNotHave",
        "no_medicaid": "doesNotHave",
      };
      const mapped = medicaidMap[meta.medicaid_status];
      if (mapped) {
        updateAnswers({ medicaidStatus: mapped });
      }
    }
  }, [activeProfile, answers.stateCode, answers.age, updateAnswers, setLocationDisplay]);

  const stepInfo = INTAKE_STEPS[step];

  // If voice mode was restored from draft, mark mode as chosen
  // Also exit guided mode if speech recognition is unavailable
  useEffect(() => {
    if (voiceMode === "guided" && !modeChosen) {
      const speechAvailable =
        typeof window !== "undefined" &&
        !!(window.SpeechRecognition || window.webkitSpeechRecognition);
      if (!speechAvailable) {
        setVoiceMode("off");
        return;
      }
      setModeChosen(true);
    }
  }, [voiceMode, modeChosen, setVoiceMode]);

  // Also mark mode as chosen if user has progressed past step 0
  useEffect(() => {
    if (step > 0 && !modeChosen) {
      setModeChosen(true);
    }
  }, [step, modeChosen]);

  // ─── Sync local state from context (e.g. sidebar navigation) ────────────
  // When step changes externally (sidebar click), re-derive local inputs
  useEffect(() => {
    setLocationInputLocal(locationDisplay);
    setSelectedStateCode(answers.stateCode);
    setAgeInput(answers.age ? String(answers.age) : "");
  }, [step, locationDisplay, answers.stateCode, answers.age]);

  // Set default for "publish care post" when arriving at step 5
  // Skip if draft from step 5 exists (user already saw checkbox before auth redirect)
  const publishDefaultSet = useRef(false);
  useEffect(() => {
    if (step !== 5 || !user || !activeProfile || publishDefaultSet.current) return;
    publishDefaultSet.current = true;

    // Check if there's a saved draft FROM the last step - meaning user was on this step
    // before auth redirect and their checkbox selection should be preserved
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem("olera-benefits-draft") : null;
      if (raw) {
        const draft = JSON.parse(raw);
        if (draft.step === 6 && draft.publishCarePost !== undefined) {
          // User was on last step before, their selection is already restored
          return;
        }
      }
    } catch {
      // Ignore parse errors
    }

    // Set smart default based on existing care post status
    const meta = (activeProfile.metadata || {}) as FamilyMetadata;
    const isAlreadyActive = meta.care_post?.status === "active";
    setPublishCarePost(!isAlreadyActive);
  }, [step, user, activeProfile, setPublishCarePost]);

  // Close dropdown when clicking outside (blur-before-close prevents scroll-to-footer)
  useClickOutside(locationDropdownRef, () => setShowLocationDropdown(false));

  // Cleanup auto-advance timer on unmount
  useEffect(() => {
    return () => {
      if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
    };
  }, []);

  // ─── Location helpers ───────────────────────────────────────────────────

  function setLocationInput(value: string) {
    setLocationInputLocal(value);
    setLocationDisplay(value);
  }

  function selectLocation(display: string, stateCode: string) {
    setLocationInputLocal(display);
    setLocationDisplay(display);
    setSelectedStateCode(stateCode);
    setShowLocationDropdown(false);

    // Flush to context so the useEffect sync doesn't reset selectedStateCode
    updateAnswers({
      stateCode,
      zipCode: /^\d{5}$/.test(display.trim()) ? display.trim() : null,
    });

    // Auto-advance — user made a deliberate choice, no need to confirm
    goToStep(1);
  }

  // ─── Geolocation ───────────────────────────────────────────────────────

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

          selectLocation(`${city}, ${stateAbbr}`, stateAbbr);
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

  // ─── Validation ────────────────────────────────────────────────────────

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
      case 6:
        return answers.veteranStatus !== null;
      default:
        return false;
    }
  }

  // ─── Navigation ────────────────────────────────────────────────────────

  function handleNext() {
    if (!canProceed()) return;

    // Flush intermediate inputs to context before advancing
    if (step === 0) {
      updateAnswers({
        stateCode: selectedStateCode,
        zipCode: /^\d{5}$/.test(locationInput.trim()) ? locationInput.trim() : null,
      });
    }

    if (step === 1) {
      updateAnswers({ age: parseInt(ageInput, 10) });
    }

    if (step < 6) {
      goToStep((step + 1) as IntakeStep);
    } else {
      // Submit with all answers flushed — no auth gate, results are free
      updateAnswers({
        stateCode: selectedStateCode,
        zipCode: /^\d{5}$/.test(locationInput.trim()) ? locationInput.trim() : null,
        age: parseInt(ageInput, 10),
      });
      submit();
    }
  }

  function handleBack() {
    // Flush current step data before going back
    if (step === 0) {
      updateAnswers({
        stateCode: selectedStateCode,
        zipCode: /^\d{5}$/.test(locationInput.trim()) ? locationInput.trim() : null,
      });
    }
    if (step === 1) {
      updateAnswers({ age: parseInt(ageInput, 10) || null });
    }
    if (step > 0) goToStep((step - 1) as IntakeStep);
  }

  // ─── Answer helpers ────────────────────────────────────────────────────

  function toggleNeed(need: PrimaryNeed) {
    const has = answers.primaryNeeds.includes(need);
    updateAnswers({
      primaryNeeds: has
        ? answers.primaryNeeds.filter((n) => n !== need)
        : [...answers.primaryNeeds, need],
    });
  }

  // ─── Mode selection handler ─────────────────────────────────────────────

  function handleModeSelect(mode: VoiceMode) {
    setVoiceMode(mode);
    setModeChosen(true);
    if (mode === "guided") {
      // Narrate the first prompt, then auto-start mic when speech finishes
      narrate(GUIDED_PROMPTS[0], () => {
        setGuidedAutoStart(true);
      });
    }
  }

  function exitGuidedMode() {
    stopNarration();
    setVoiceMode("off");
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
  }

  // ─── Voice input handler ─────────────────────────────────────────────────

  const handleVoiceResult = useCallback(
    (result: VoiceParseResult) => {
      switch (result.type) {
        case "zipCode": {
          const zip = result.value;
          const stateCode = zipToState(zip);
          setLocationInputLocal(zip);
          setLocationDisplay(zip);
          setSelectedStateCode(stateCode);
          updateAnswers({ zipCode: zip, stateCode });
          if (stateCode) goToStep(1);
          break;
        }
        case "location": {
          const display = result.city
            ? `${result.city}, ${result.stateCode}`
            : result.stateCode;
          setLocationInputLocal(display);
          setLocationDisplay(display);
          setSelectedStateCode(result.stateCode);
          updateAnswers({ zipCode: null, stateCode: result.stateCode });
          goToStep(1);
          break;
        }
        case "age": {
          const age = result.value;
          setAgeInput(String(age));
          updateAnswers({ age });
          goToStep(2);
          break;
        }
        case "carePreference":
          updateAnswers({ carePreference: result.value });
          goToStep(3);
          break;
        case "primaryNeeds":
          // Additive: merge voice results with existing selections
          updateAnswers({
            primaryNeeds: Array.from(
              new Set([...answers.primaryNeeds, ...result.value])
            ),
          });
          // Don't auto-advance — user might want to add more via tap
          break;
        case "incomeRange":
          updateAnswers({ incomeRange: result.value });
          goToStep(5);
          break;
        case "medicaidStatus":
          updateAnswers({ medicaidStatus: result.value });
          goToStep(6);
          break;
        case "veteranStatus":
          updateAnswers({ veteranStatus: result.value });
          break;
        case "navigation":
          if (result.value === "back") handleBack();
          else if (result.value === "skip" && step < 6) goToStep((step + 1) as IntakeStep);
          else if (result.value === "continue" && step < 6) goToStep((step + 1) as IntakeStep);
          break;
        case "unknown":
          // Handled by VoiceMicButton (shows clarification)
          break;
      }
    },
    [answers.primaryNeeds, step, updateAnswers, goToStep, setLocationDisplay]
  );

  // ─── Guided voice: result handler with auto-advance ──────────────────────

  const handleGuidedVoiceResult = useCallback(
    (result: VoiceParseResult) => {
      // Build guided confirmation text
      let confirmDetail = "";
      switch (result.type) {
        case "zipCode":
          confirmDetail = result.value;
          break;
        case "location":
          confirmDetail = result.city
            ? `${result.city}, ${result.stateCode}`
            : result.stateCode;
          break;
        case "age":
          confirmDetail = String(result.value);
          break;
        case "carePreference":
          switch (result.value) {
            case "stayHome": confirmDetail = "Staying at home"; break;
            case "exploringFacility": confirmDetail = "Exploring facilities"; break;
            case "unsure": confirmDetail = "Not sure yet"; break;
          }
          break;
        case "primaryNeeds": {
          const names = result.value.map((n) =>
            n.replace(/([A-Z])/g, " $1").toLowerCase().trim()
          );
          confirmDetail = names.join(" and ");
          break;
        }
        case "incomeRange":
          confirmDetail = "";
          break;
        case "medicaidStatus":
          confirmDetail = "";
          break;
        case "veteranStatus":
          confirmDetail = "";
          break;
      }

      // Show guided confirmation
      const confirmFn = GUIDED_CONFIRMATIONS[step];
      if (confirmFn) {
        setGuidedConfirmation(confirmFn(confirmDetail));
      }

      // Apply the result to state (same logic as manual)
      handleVoiceResult(result);

      // For needs step, don't auto-advance (user says "done" to advance)
      // For navigation "continue", the handleVoiceResult already advances
      if (result.type === "primaryNeeds" || result.type === "navigation") {
        // For navigation "done"/"continue" on needs step, narrate the next prompt
        if (result.type === "navigation") {
          const nextStep = (step + 1) as IntakeStep;
          if (nextStep <= 6) {
            narrate(GUIDED_PROMPTS[nextStep], () => {
              setGuidedAutoStart(true);
            });
          }
        }
        return;
      }

      // Auto-advance with narration (except final step)
      if (step < 6 && result.type !== "unknown") {
        if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);

        // Build narration: confirmation + next question
        const nextStep = (step + 1) as IntakeStep;
        const confirmText = confirmFn ? confirmFn(confirmDetail) : "";
        const nextPrompt = GUIDED_PROMPTS[nextStep] || "";
        const narrationText = confirmText
          ? `${confirmText} ${nextPrompt}`
          : nextPrompt;

        // Narrate, then auto-start mic after speech finishes
        autoAdvanceTimerRef.current = setTimeout(() => {
          setGuidedConfirmation(null);
          narrate(narrationText, () => {
            setGuidedAutoStart(true);
          });
        }, 500); // Brief pause before narrating
      }

      // Final step — narrate closing, then auto-submit
      if (step === 6 && result.type === "veteranStatus") {
        if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
        narrate("Thanks, that\u2019s everything. Let me find what\u2019s available.", () => {
          handleNext();
        });
      }
    },
    [step, handleVoiceResult, handleNext, narrate]
  );

  // Reset guided state when step changes
  useEffect(() => {
    setGuidedConfirmation(null);
  }, [step]);

  // ─── Mode selection screen ──────────────────────────────────────────────

  if (!modeChosen && step === 0) {
    return <VoiceModeSelection onSelect={handleModeSelect} />;
  }

  // ─── Guided voice mode layout ──────────────────────────────────────────

  if (voiceMode === "guided") {
    return (
      <div className="w-full">
        {/* Guided prompt */}
        <GuidedVoicePrompt step={step} confirmation={guidedConfirmation} isSpeaking={isSpeaking} />

        {/* Large centered mic */}
        <div className="flex justify-center my-6">
          <VoiceMicButton
            step={step}
            onResult={handleGuidedVoiceResult}
            guided
            autoStart={guidedAutoStart}
            narratingActive={isSpeaking}
          />
        </div>

        {/* Form inputs below (read-only feel but still tappable) */}
        <div className="border-t border-gray-100 pt-5 mt-2">
          <p className="text-xs text-gray-400 mb-3">Or tap to select</p>

          {/* Step 0: Location */}
          {step === 0 && (
            <div className="relative" ref={locationDropdownRef}>
              <div
                className={`flex items-center px-4 py-3.5 bg-white rounded-xl border transition-colors cursor-text ${
                  showLocationDropdown
                    ? "border-gray-400 ring-2 ring-gray-100"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => {
                  setShowLocationDropdown(true);
                  locationInputRef.current?.focus();
                }}
              >
                <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
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

              {showLocationDropdown && (
                <div className="absolute left-0 top-[calc(100%+8px)] w-full bg-white rounded-xl shadow-xl border border-gray-200 py-3 z-50 max-h-[340px] overflow-y-auto">
                  <div className="px-3 pb-3">
                    <button
                      type="button"
                      onClick={detectLocation}
                      disabled={isGeolocating}
                      className="flex items-center justify-center gap-2 w-full py-2.5 min-h-[44px] bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-lg text-primary-700 font-medium transition-colors disabled:opacity-60"
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
                  <div className="flex items-center gap-3 px-4 py-1">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-xs text-gray-400 font-medium">or search</span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>
                  {!locationInput.trim() && cityResults.length > 0 && (
                    <div className="px-4 pt-2 pb-1">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Popular cities</span>
                    </div>
                  )}
                  {cityResults.length > 0 ? (
                    cityResults.map((loc) => (
                      <button
                        key={loc.full}
                        type="button"
                        onClick={() => selectLocation(loc.full, loc.state)}
                        className={`flex items-center gap-3 w-full px-4 py-2.5 min-h-[44px] text-left hover:bg-gray-50 transition-colors ${
                          locationInput === loc.full ? "bg-primary-50 text-primary-700" : "text-gray-900"
                        }`}
                      >
                        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="font-medium">{loc.full}</span>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-gray-500 text-center">No locations found</div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 1: Age */}
          {step === 1 && (
            <input
              type="text"
              inputMode="numeric"
              maxLength={3}
              value={ageInput}
              onChange={(e) => setAgeInput(e.target.value.replace(/\D/g, ""))}
              placeholder="e.g. 72"
              className="w-full px-4 py-3.5 rounded-xl border border-gray-200 text-lg text-gray-900 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-colors"
            />
          )}

          {/* Step 2: Care preference */}
          {step === 2 && (
            <div className="flex flex-col gap-2.5">
              {(Object.entries(CARE_PREFERENCES) as [CarePreference, { displayTitle: string; icon: string }][]).map(
                ([key, val]) => (
                  <Pill
                    key={key}
                    label={`${val.icon} ${val.displayTitle}`}
                    selected={answers.carePreference === key}
                    onClick={() => updateAnswers({ carePreference: key })}
                  />
                )
              )}
            </div>
          )}

          {/* Step 3: Primary needs */}
          {step === 3 && (
            <>
              <p className="text-xs text-gray-400 mb-3">Select all that apply</p>
              <div className="flex flex-wrap gap-2.5">
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
            <div className="flex flex-col gap-2.5">
              {(Object.entries(INCOME_RANGES) as [IncomeRange, { displayTitle: string }][]).map(
                ([key, val]) => (
                  <Pill
                    key={key}
                    label={val.displayTitle}
                    selected={answers.incomeRange === key}
                    onClick={() => updateAnswers({ incomeRange: key })}
                  />
                )
              )}
            </div>
          )}

          {/* Step 5: Medicaid */}
          {step === 5 && (
            <div className="flex flex-col gap-2.5">
              {(Object.entries(MEDICAID_STATUSES) as [MedicaidStatus, { displayTitle: string }][]).map(
                ([key, val]) => (
                  <Pill
                    key={key}
                    label={val.displayTitle}
                    selected={answers.medicaidStatus === key}
                    onClick={() => updateAnswers({ medicaidStatus: key })}
                  />
                )
              )}
            </div>
          )}

          {/* Step 6: Veteran status */}
          {step === 6 && (
            <>
              <div className="flex flex-col gap-2.5">
                {(Object.entries(VETERAN_STATUSES) as [VeteranStatus, { displayTitle: string }][]).map(
                  ([key, val]) => (
                    <Pill
                      key={key}
                      label={val.displayTitle}
                      selected={answers.veteranStatus === key}
                      onClick={() => updateAnswers({ veteranStatus: key })}
                    />
                  )
                )}
              </div>

              <label className="flex items-start gap-3 mt-4 px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={publishCarePost}
                  onChange={(e) => setPublishCarePost(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-400 shrink-0 accent-gray-900"
                />
                <div className="min-w-0">
                  <span className="text-sm font-medium text-gray-700 leading-tight block">
                    Let providers find me
                  </span>
                  <span className="text-xs text-gray-400 leading-relaxed block mt-0.5">
                    Share your care profile so providers in your area can reach out.
                    {!user && " (requires sign-in)"}
                  </span>
                </div>
              </label>
            </>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <div className="flex items-center gap-4">
            {step > 0 && (
              <button
                onClick={handleBack}
                className="text-sm text-gray-400 cursor-pointer bg-transparent border-none hover:text-gray-600 transition-colors font-medium min-h-[44px]"
              >
                Back
              </button>
            )}
            <button
              onClick={exitGuidedMode}
              className="text-sm text-gray-400 cursor-pointer bg-transparent border-none hover:text-gray-600 transition-colors min-h-[44px]"
            >
              Switch to form
            </button>
          </div>
          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className={`px-10 py-3 border-none rounded-full text-sm font-medium cursor-pointer transition-all duration-200 min-h-[44px] ${
              canProceed()
                ? "bg-gray-900 text-white hover:bg-gray-800"
                : "bg-gray-100 text-gray-300 cursor-default"
            }`}
          >
            {step === 6 ? "Find my benefits" : "Continue"}
          </button>
        </div>
      </div>
    );
  }

  // ─── Manual form layout (original) ─────────────────────────────────────

  return (
    <div className="w-full">
      {/* Step content — keyed to animate on step change */}
      <div key={step} className="animate-step-in">
      <p className="text-xs text-gray-400 mb-3 tabular-nums">
        {step + 1} / {TOTAL_INTAKE_STEPS}
      </p>
      <h2 className={`font-display text-display-sm font-medium text-gray-900 leading-snug tracking-tight ${step === 4 ? "mb-2" : "mb-8"}`}>
        {step === 0 ? "Where are you located?" : stepInfo.question}
      </h2>
      {step === 4 && (
        <p className="text-sm text-gray-500 mb-8">This helps us find programs and providers that fit your budget. It does not need to be exact.</p>
      )}

      {/* Step 0: Smart Location Input */}
      {step === 0 && (
        <>
        <div className="relative mb-4" ref={locationDropdownRef}>
            <div
              className={`flex items-center px-4 py-3.5 bg-white rounded-xl border transition-colors cursor-text ${
                showLocationDropdown
                  ? "border-gray-400 ring-2 ring-gray-100"
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
                  className="flex items-center justify-center gap-2 w-full py-2.5 min-h-[44px] bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-lg text-primary-700 font-medium transition-colors disabled:opacity-60"
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
                    onClick={() => selectLocation(loc.full, loc.state)}
                    className={`flex items-center gap-3 w-full px-4 py-2.5 min-h-[44px] text-left hover:bg-gray-50 transition-colors ${
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
        <VoiceMicButton step={0} onResult={handleVoiceResult} className="mt-3" />
        </>
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
            className="w-full px-4 py-3.5 rounded-xl border border-gray-200 text-lg text-gray-900 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-colors"
          />
          <VoiceMicButton step={1} onResult={handleVoiceResult} className="mt-3" />
        </div>
      )}

      {/* Step 2: Care preference */}
      {step === 2 && (
        <div className="mb-4">
          <div className="flex flex-col gap-2.5">
            {(Object.entries(CARE_PREFERENCES) as [CarePreference, { displayTitle: string; icon: string }][]).map(
              ([key, val]) => (
                <Pill
                  key={key}
                  label={`${val.icon} ${val.displayTitle}`}
                  selected={answers.carePreference === key}
                  onClick={() => updateAnswers({ carePreference: key })}
                />
              )
            )}
          </div>
          <VoiceMicButton step={2} onResult={handleVoiceResult} className="mt-3" />
        </div>
      )}

      {/* Step 3: Primary needs (multi-select) */}
      {step === 3 && (
        <>
          <p className="text-xs text-gray-400 mb-3">Select all that apply</p>
          <div className="flex flex-wrap gap-2.5 mb-4">
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
          <VoiceMicButton step={3} onResult={handleVoiceResult} className="mt-1" />
        </>
      )}

      {/* Step 4: Income range */}
      {step === 4 && (
        <div className="mb-4">
          <div className="flex flex-col gap-2.5">
            {(Object.entries(INCOME_RANGES) as [IncomeRange, { displayTitle: string }][]).map(
              ([key, val]) => (
                <Pill
                  key={key}
                  label={val.displayTitle}
                  selected={answers.incomeRange === key}
                  onClick={() => updateAnswers({ incomeRange: key })}
                />
              )
            )}
          </div>
          <VoiceMicButton step={4} onResult={handleVoiceResult} className="mt-3" />
        </div>
      )}

      {/* Step 5: Medicaid status */}
      {step === 5 && (
        <div className="flex flex-col gap-2.5 mb-4">
          {(Object.entries(MEDICAID_STATUSES) as [MedicaidStatus, { displayTitle: string }][]).map(
            ([key, val]) => (
              <Pill
                key={key}
                label={val.displayTitle}
                selected={answers.medicaidStatus === key}
                onClick={() => updateAnswers({ medicaidStatus: key })}
              />
            )
          )}
          <VoiceMicButton step={5} onResult={handleVoiceResult} className="mt-3" />
        </div>
      )}

      {/* Step 6: Veteran status */}
      {step === 6 && (
        <>
        <div className="flex flex-col gap-2.5 mb-4">
          {(Object.entries(VETERAN_STATUSES) as [VeteranStatus, { displayTitle: string }][]).map(
            ([key, val]) => (
              <Pill
                key={key}
                label={val.displayTitle}
                selected={answers.veteranStatus === key}
                onClick={() => updateAnswers({ veteranStatus: key })}
              />
            )
          )}
        </div>

        {/* Let providers find me — shown to everyone, auth required at submit */}
        <label className="flex items-start gap-3 mt-2 px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50/50 cursor-pointer">
          <input
            type="checkbox"
            checked={publishCarePost}
            onChange={(e) => setPublishCarePost(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-400 shrink-0 accent-gray-900"
          />
          <div className="min-w-0">
            <span className="text-sm font-medium text-gray-700 leading-tight block">
              Let providers find me
            </span>
            <span className="text-xs text-gray-400 leading-relaxed block mt-0.5">
              Share your care profile so providers in your area can reach out.
              {!user && " (requires sign-in)"}
            </span>
          </div>
        </label>
        </>
      )}
      </div>{/* end animate-step-in wrapper */}

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8">
        {step > 0 ? (
          <button
            onClick={handleBack}
            className="text-sm text-gray-400 cursor-pointer bg-transparent border-none hover:text-gray-600 transition-colors font-medium min-h-[44px]"
          >
            Back
          </button>
        ) : (
          <div />
        )}
        <button
          onClick={handleNext}
          disabled={!canProceed()}
          className={`px-10 py-3 border-none rounded-full text-sm font-medium cursor-pointer transition-all duration-200 min-h-[44px] ${
            canProceed()
              ? "bg-gray-900 text-white hover:bg-gray-800"
              : "bg-gray-100 text-gray-300 cursor-default"
          }`}
        >
          {step === 6 ? "Find my benefits" : "Continue"}
        </button>
      </div>
    </div>
  );
}
