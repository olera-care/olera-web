"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import ProfileCompleteModal from "@/components/welcome/ProfileCompleteModal";
import type { BusinessProfile, FamilyMetadata } from "@/lib/types";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useCitySearch } from "@/hooks/use-city-search";

// ── Types ──

interface ProfileWizardProps {
  profile: BusinessProfile;
  userEmail?: string;
  onClose: () => void;
  onComplete: () => void;
  /** Called after each step is saved — use to refresh profile data */
  onStepSaved?: () => void;
}

// Each question in the wizard
interface Question {
  id: string;
  title: string;
  type: "tap" | "tap-single" | "short-type" | "long-type" | "location";
  options?: { label: string; value: string }[];
  placeholder?: string;
  /** Check if this question is already answered */
  isFilled: () => boolean;
  /** Get current value */
  getValue: () => string | string[];
  /** Set value (for tap questions, auto-advances) */
  setValue: (value: string | string[]) => void;
  /** Save this field to the database. Pass value directly for tap questions to avoid stale closures. Returns true on success. */
  save: (value?: string | string[]) => Promise<boolean>;
}

// ── Options ──

const CARE_RECIPIENTS = [
  { label: "Myself", value: "Myself" },
  { label: "My parent", value: "My parent" },
  { label: "My spouse", value: "My spouse" },
  { label: "Someone else", value: "Someone else" },
];

const TIMELINES = [
  { label: "As soon as possible", value: "immediate" },
  { label: "Within a month", value: "within_1_month" },
  { label: "In a few months", value: "within_3_months" },
  { label: "Just researching", value: "exploring" },
];

const CARE_TYPES = [
  { label: "Home Care", value: "Home Care" },
  { label: "Home Health Care", value: "Home Health Care" },
  { label: "Assisted Living", value: "Assisted Living" },
  { label: "Memory Care", value: "Memory Care" },
  { label: "Nursing Home", value: "Nursing Home" },
  { label: "Independent Living", value: "Independent Living" },
  { label: "Hospice Care", value: "Hospice Care" },
  { label: "Adult Day Care", value: "Adult Day Care" },
];

const CARE_NEEDS = [
  { label: "Daily living help", value: "Daily living help" },
  { label: "Health management", value: "Health management" },
  { label: "Companionship", value: "Companionship" },
  { label: "Memory care", value: "Memory care" },
  { label: "Mobility help", value: "Mobility help" },
];

const PAYMENT_OPTIONS = [
  { label: "Medicare", value: "Medicare" },
  { label: "Medicaid", value: "Medicaid" },
  { label: "Private insurance", value: "Private insurance" },
  { label: "Private pay", value: "Private pay" },
  { label: "Veterans benefits", value: "Veterans benefits" },
  { label: "Long-term care insurance", value: "Long-term care insurance" },
];

const CONTACT_METHODS = [
  { label: "Call", value: "Call" },
  { label: "Text", value: "Text" },
  { label: "Email", value: "Email" },
];

const SCHEDULE_OPTIONS = [
  { label: "Mornings", value: "mornings" },
  { label: "Afternoons", value: "afternoons" },
  { label: "Evenings", value: "evenings" },
  { label: "Overnight", value: "overnight" },
  { label: "Full-time", value: "full_time" },
  { label: "Flexible", value: "flexible" },
];

// ── Location Dropdown with Portal ──

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
    if (!show || !inputRef.current) return;
    const updatePosition = () => {
      if (!inputRef.current) return;
      const rect = inputRef.current.getBoundingClientRect();
      setPosition({ top: rect.bottom + 8, left: rect.left, width: rect.width });
    };
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [show, inputRef]);

  if (!mounted || !show || results.length === 0) return null;

  return createPortal(
    <div
      ref={dropdownRef}
      className="fixed z-[100] bg-white border border-gray-200 rounded-xl shadow-2xl max-h-48 overflow-y-auto"
      style={{ top: position.top, left: position.left, width: position.width }}
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

// ── Main Component ──

export default function ProfileWizard({
  profile,
  userEmail,
  onClose,
  onComplete,
  onStepSaved,
}: ProfileWizardProps) {
  const meta = (profile.metadata || {}) as FamilyMetadata;

  // ── State for all fields ──
  const [relationship, setRelationship] = useState(meta.relationship_to_recipient || "");
  const [timeline, setTimeline] = useState(meta.timeline || "");
  const [careTypes, setCareTypes] = useState<string[]>(profile.care_types || []);
  const [careNeeds, setCareNeeds] = useState<string[]>(meta.care_needs || []);
  const [payments, setPayments] = useState<string[]>(meta.payment_methods || []);
  const [contactPref, setContactPref] = useState(meta.contact_preference || "");
  const [schedule, setSchedule] = useState(meta.schedule_preference || "");
  const [age, setAge] = useState(meta.age ? String(meta.age) : "");
  const [displayName, setDisplayName] = useState(
    profile.display_name && profile.display_name !== "Care Seeker" ? profile.display_name : ""
  );
  const [phone, setPhone] = useState(profile.phone || "");
  const [city, setCity] = useState(profile.city || "");
  const [state, setState] = useState(profile.state || "");
  const [locationInput, setLocationInput] = useState(
    profile.city && profile.state ? `${profile.city}, ${profile.state}` : ""
  );

  // ── UI State ──
  const [currentIndex, setCurrentIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Location autocomplete
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const cityInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { results: cityResults, preload: preloadCities } = useCitySearch(locationInput);

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
      if (!clickedInput && !clickedDropdown) setShowCityDropdown(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showCityDropdown]);

  // ── Save helpers ──
  const saveField = useCallback(async (field: string, value: unknown, metaField?: string): Promise<boolean> => {
    if (!isSupabaseConfigured() || !profile) return true; // Skip if not configured
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

      if (metaField) {
        const { error } = await supabase
          .from("business_profiles")
          .update({ metadata: { ...existingMeta, [metaField]: value } })
          .eq("id", profile.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("business_profiles")
          .update({ [field]: value })
          .eq("id", profile.id);
        if (error) throw error;
      }
      onStepSaved?.();
      return true;
    } catch (err) {
      console.error("[ProfileWizard] Save failed:", err);
      setSaveError("Couldn't save. Please try again.");
      return false;
    } finally {
      setSaving(false);
    }
  }, [profile, onStepSaved]);

  // ── Build dynamic question list ──
  // Order: tap questions first (low effort), then short type, then longer type
  const questions: Question[] = useMemo(() => {
    const q: Question[] = [];

    // 1. Who needs care? (tap) - 5 pts
    q.push({
      id: "relationship",
      title: "Who needs care?",
      type: "tap",
      options: CARE_RECIPIENTS,
      isFilled: () => Boolean(relationship),
      getValue: () => relationship,
      setValue: (v) => setRelationship(v as string),
      save: (v) => saveField("", v ?? relationship, "relationship_to_recipient"),
    });

    // 2. How soon? (tap) - 3 pts
    q.push({
      id: "timeline",
      title: "How soon do you need care?",
      type: "tap",
      options: TIMELINES,
      isFilled: () => Boolean(timeline),
      getValue: () => timeline,
      setValue: (v) => setTimeline(v as string),
      save: (v) => saveField("", v ?? timeline, "timeline"),
    });

    // 3. What type of care? (tap-single) - 5 pts
    q.push({
      id: "careType",
      title: "What type of care are you looking for?",
      type: "tap-single",
      options: CARE_TYPES,
      isFilled: () => careTypes.length > 0,
      getValue: () => careTypes,
      setValue: (v) => setCareTypes(Array.isArray(v) ? v : [v]),
      save: (v) => saveField("care_types", v ?? careTypes),
    });

    // 4. What help is needed? (tap-single) - 4 pts
    q.push({
      id: "careNeed",
      title: "What help do you need?",
      type: "tap-single",
      options: CARE_NEEDS,
      isFilled: () => careNeeds.length > 0,
      getValue: () => careNeeds,
      setValue: (v) => setCareNeeds(Array.isArray(v) ? v : [v]),
      save: (v) => saveField("", v ?? careNeeds, "care_needs"),
    });

    // 5. How will you pay? (tap-single) - 20 pts
    q.push({
      id: "payment",
      title: "How will you pay for care?",
      type: "tap-single",
      options: PAYMENT_OPTIONS,
      isFilled: () => payments.length > 0,
      getValue: () => payments,
      setValue: (v) => setPayments(Array.isArray(v) ? v : [v]),
      save: (v) => saveField("", v ?? payments, "payment_methods"),
    });

    // 6. How should we contact you? (tap) - 5 pts
    q.push({
      id: "contactPref",
      title: "How would you like to be contacted?",
      type: "tap",
      options: CONTACT_METHODS,
      isFilled: () => Boolean(contactPref),
      getValue: () => contactPref,
      setValue: (v) => setContactPref(v as string),
      save: (v) => saveField("", v ?? contactPref, "contact_preference"),
    });

    // 7. When do you need care? (tap) - 3 pts
    q.push({
      id: "schedule",
      title: "When do you need care?",
      type: "tap",
      options: SCHEDULE_OPTIONS,
      isFilled: () => Boolean(schedule),
      getValue: () => schedule,
      setValue: (v) => setSchedule(v as string),
      save: (v) => saveField("", v ?? schedule, "schedule_preference"),
    });

    // 8. Their age? (short type) - 5 pts
    q.push({
      id: "age",
      title: "How old is the care recipient?",
      type: "short-type",
      placeholder: "e.g. 72",
      isFilled: () => Boolean(age),
      getValue: () => age,
      setValue: (v) => setAge(v as string),
      save: (v) => {
        const val = (v as string) ?? age;
        return saveField("", val ? Number(val) : null, "age");
      },
    });

    // 9. Your name (type) - 5 pts
    q.push({
      id: "name",
      title: "What's your name?",
      type: "short-type",
      placeholder: "Your full name",
      isFilled: () => Boolean(displayName),
      getValue: () => displayName,
      setValue: (v) => setDisplayName(v as string),
      save: (v) => saveField("display_name", v ?? displayName),
    });

    // 10. Phone (type) - 10 pts
    q.push({
      id: "phone",
      title: "What's your phone number?",
      type: "short-type",
      placeholder: "(555) 123-4567",
      isFilled: () => Boolean(phone),
      getValue: () => phone,
      setValue: (v) => setPhone(v as string),
      save: (v) => saveField("phone", v ?? phone),
    });

    // 11. Location (select) - 5 pts
    q.push({
      id: "location",
      title: "Where are you located?",
      type: "location",
      placeholder: "Start typing a city...",
      isFilled: () => Boolean(city && state),
      getValue: () => locationInput,
      setValue: (v) => setLocationInput(v as string),
      save: async () => {
        // Location uses city/state from component state (set via handleCitySelect)
        // No stale closure issue here because user clicks Continue after selecting
        const citySuccess = await saveField("city", city);
        if (!citySuccess) return false;
        const stateSuccess = await saveField("state", state);
        return stateSuccess;
      },
    });

    return q;
  }, [
    relationship, timeline, careTypes, careNeeds, payments, contactPref,
    schedule, age, displayName, phone, city, state, locationInput, saveField,
  ]);

  // Filter to only unfilled questions
  const unfilledQuestions = useMemo(() => {
    return questions.filter((q) => !q.isFilled());
  }, [questions]);

  // Current question
  const currentQuestion = unfilledQuestions[currentIndex] || null;
  const totalQuestions = unfilledQuestions.length;

  // ── Navigation ──

  // Advance to next question (for Continue button on typing/location questions)
  // NOTE: After save, the list shrinks by 1, so no index increment needed.
  const goToNext = useCallback(async () => {
    if (!currentQuestion) {
      setShowCompleteModal(true);
      return;
    }

    // Clear any previous error
    setSaveError(null);

    // Save current question (no value passed - uses current state)
    const success = await currentQuestion.save();

    // Don't advance if save failed
    if (!success) return;

    // After save, this question becomes "filled" and list shrinks.
    // If this was the only question, show complete.
    if (totalQuestions <= 1) {
      setShowCompleteModal(true);
      return;
    }

    // Visual transition (no index increment — list shrinks naturally)
    setIsTransitioning(true);
    setTimeout(() => {
      setIsTransitioning(false);
    }, 150);
  }, [currentQuestion, totalQuestions]);

  // For tap questions: select, save immediately with value, then auto-advance
  // NOTE: After save, the unfilledQuestions list shrinks by 1, so we do NOT
  // increment currentIndex — index 0 automatically points to the next question.
  const handleTapSelect = useCallback(async (value: string) => {
    if (!currentQuestion) return;

    // Clear any previous error
    setSaveError(null);

    // Capture previous value for rollback on failure
    const previousValue = currentQuestion.getValue();

    // Update state for visual feedback
    currentQuestion.setValue(value);

    // Save IMMEDIATELY with the passed value (avoids stale closure issue)
    const success = await currentQuestion.save(value);

    // Rollback and don't advance if save failed
    if (!success) {
      currentQuestion.setValue(previousValue);
      return;
    }

    // After save, the list will shrink (this question becomes "filled").
    // If this was the ONLY unfilled question, list is now empty → show complete.
    // Otherwise, index 0 now points to what was index 1 — no increment needed.
    if (totalQuestions <= 1) {
      setShowCompleteModal(true);
      return;
    }

    // Visual transition (list shrinks during this time, next question appears at same index)
    setIsTransitioning(true);
    setTimeout(() => {
      setIsTransitioning(false);
    }, 150);
  }, [currentQuestion, totalQuestions]);

  // For tap-single questions: select one, save immediately, then auto-advance
  // NOTE: Same logic as handleTapSelect — list shrinks, no index increment needed.
  const handleTapSingleSelect = useCallback(async (value: string) => {
    if (!currentQuestion) return;

    // Clear any previous error
    setSaveError(null);

    const arrayValue = [value];

    // Capture previous value for rollback on failure
    const previousValue = currentQuestion.getValue();

    // Update state for visual feedback
    currentQuestion.setValue(arrayValue);

    // Save IMMEDIATELY with the passed value
    const success = await currentQuestion.save(arrayValue);

    // Rollback and don't advance if save failed
    if (!success) {
      currentQuestion.setValue(previousValue);
      return;
    }

    // After save, the list shrinks. If this was the only question, show complete.
    if (totalQuestions <= 1) {
      setShowCompleteModal(true);
      return;
    }

    // Visual transition (no index increment — list shrinks naturally)
    setIsTransitioning(true);
    setTimeout(() => {
      setIsTransitioning(false);
    }, 150);
  }, [currentQuestion, totalQuestions]);

  // Handle location selection
  const handleCitySelect = useCallback((cityName: string, stateCode: string) => {
    setCity(cityName);
    setState(stateCode);
    setLocationInput(`${cityName}, ${stateCode}`);
    setShowCityDropdown(false);
  }, []);

  // Skip current question
  // NOTE: Unlike save handlers, skip DOES increment the index because
  // the skipped question stays in the unfilled list (nothing was saved).
  const handleSkip = useCallback(() => {
    if (currentIndex < totalQuestions - 1) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
        setIsTransitioning(false);
      }, 150);
    } else {
      setShowCompleteModal(true);
    }
  }, [currentIndex, totalQuestions]);

  // Handle completion
  const handleContinue = useCallback(() => {
    onComplete();
  }, [onComplete]);

  // ── Render ──

  // If all questions are filled, show complete modal
  if (totalQuestions === 0 || showCompleteModal) {
    return <ProfileCompleteModal isOpen onContinue={handleContinue} />;
  }

  if (!currentQuestion) {
    return <ProfileCompleteModal isOpen onContinue={handleContinue} />;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop with blur */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px] animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={[
          "relative bg-white w-full flex flex-col",
          "max-h-[92dvh] animate-sheet-up rounded-t-2xl",
          "sm:max-w-[480px] sm:max-h-[85dvh] sm:animate-modal-pop sm:rounded-2xl sm:shadow-2xl",
        ].join(" ")}
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {/* Mobile drag handle */}
        <div className="sm:hidden flex justify-center pt-2 pb-1 shrink-0">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Close button */}
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10">
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

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-1.5 pt-4 sm:pt-6 pb-2 shrink-0">
          {Array.from({ length: totalQuestions }, (_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all duration-300 ${
                i < currentIndex
                  ? "bg-primary-600 w-6 h-1.5"
                  : i === currentIndex
                    ? "bg-primary-600 w-6 h-1.5"
                    : "bg-gray-200 w-1.5 h-1.5"
              }`}
            />
          ))}
        </div>

        {/* Question content */}
        <div
          className={[
            "flex-1 overflow-y-auto px-6 pb-6 pt-4",
            isTransitioning ? "opacity-0" : "opacity-100 animate-step-in",
            "transition-opacity duration-150",
          ].join(" ")}
        >
          <h2 className="text-xl sm:text-[22px] font-semibold text-gray-900 mb-6 text-center">
            {currentQuestion.title}
          </h2>

          {/* Tap questions - single select with auto-advance */}
          {currentQuestion.type === "tap" && currentQuestion.options && (
            <div className="space-y-2">
              {currentQuestion.options.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleTapSelect(opt.value)}
                  disabled={saving}
                  className={`w-full py-3.5 px-4 rounded-xl text-[15px] font-medium text-center transition-all duration-150 border ${
                    currentQuestion.getValue() === opt.value
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98]"
                  } disabled:opacity-50`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {/* Tap-single questions - pick one from a list */}
          {currentQuestion.type === "tap-single" && currentQuestion.options && (
            <div className="space-y-2">
              {currentQuestion.options.map((opt) => {
                const currentValue = currentQuestion.getValue();
                const isSelected = Array.isArray(currentValue) && currentValue.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    onClick={() => handleTapSingleSelect(opt.value)}
                    disabled={saving}
                    className={`w-full py-3.5 px-4 rounded-xl text-[15px] font-medium text-center transition-all duration-150 border ${
                      isSelected
                        ? "bg-gray-900 text-white border-gray-900"
                        : "bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98]"
                    } disabled:opacity-50`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Short type questions */}
          {currentQuestion.type === "short-type" && (
            <div className="space-y-4">
              <input
                type={currentQuestion.id === "age" ? "number" : currentQuestion.id === "phone" ? "tel" : "text"}
                value={currentQuestion.getValue() as string}
                onChange={(e) => currentQuestion.setValue(e.target.value)}
                placeholder={currentQuestion.placeholder}
                autoFocus
                className="w-full px-4 py-3.5 rounded-xl bg-gray-100 border-0 focus:bg-white focus:ring-2 focus:ring-gray-900/10 outline-none transition-all text-gray-900 placeholder:text-gray-400 text-center text-lg"
              />
              <button
                onClick={goToNext}
                disabled={saving || !(currentQuestion.getValue() as string)}
                className="w-full py-3.5 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : "Continue"}
              </button>
            </div>
          )}

          {/* Location question */}
          {currentQuestion.type === "location" && (
            <div className="space-y-4">
              <div className="relative">
                <input
                  ref={cityInputRef}
                  type="text"
                  value={locationInput}
                  onChange={(e) => {
                    setLocationInput(e.target.value);
                    setShowCityDropdown(true);
                  }}
                  onFocus={() => {
                    preloadCities();
                    setShowCityDropdown(true);
                  }}
                  placeholder={currentQuestion.placeholder}
                  autoFocus
                  className="w-full px-4 py-3.5 rounded-xl bg-gray-100 border-0 focus:bg-white focus:ring-2 focus:ring-gray-900/10 outline-none transition-all text-gray-900 placeholder:text-gray-400 text-center text-lg"
                />
                <LocationDropdown
                  inputRef={cityInputRef}
                  dropdownRef={dropdownRef}
                  results={cityResults}
                  onSelect={handleCitySelect}
                  show={showCityDropdown}
                />
              </div>
              <button
                onClick={goToNext}
                disabled={saving || !city || !state}
                className="w-full py-3.5 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : "Continue"}
              </button>
            </div>
          )}

          {/* Error message */}
          {saveError && (
            <div className="mt-4 px-4 py-2.5 rounded-lg bg-red-50 border border-red-100 text-center">
              <p className="text-sm text-red-600">{saveError}</p>
            </div>
          )}

          {/* Skip option */}
          <button
            onClick={handleSkip}
            disabled={saving}
            className="w-full py-2 mt-4 text-[13px] text-gray-400 hover:text-gray-600 font-normal bg-transparent border-none transition-colors disabled:opacity-50"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
