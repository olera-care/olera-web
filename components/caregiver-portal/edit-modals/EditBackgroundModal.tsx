"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Modal from "@/components/ui/Modal";
import { saveStudentProfile } from "./save-profile";
import type { BaseEditModalProps } from "./types";

const EXPERIENCE_OPTIONS = [
  { value: "0", label: "No experience yet", description: "Eager to learn and start my caregiving journey" },
  { value: "family", label: "Family caregiver", description: "Experience caring for family or friends" },
  { value: "1", label: "1–2 years", description: "Paid or volunteer caregiving experience" },
  { value: "3", label: "3+ years", description: "Extensive professional experience" },
];

const CERTIFICATION_OPTIONS = ["CNA", "BLS", "CPR / First Aid", "HHA", "Medication Aide", "Phlebotomy"];

const CARE_TYPE_OPTIONS = [
  "Dementia / Alzheimer's",
  "Post-Surgical Care",
  "Mobility Assistance",
  "Medication Management",
  "Personal Care",
  "Companionship",
  "Meal Preparation",
  "Hospice / End-of-Life",
  "Family member care",
];

const LANGUAGE_OPTIONS = ["English", "Spanish", "Mandarin", "Vietnamese", "Hindi", "Tagalog", "Arabic", "Korean", "French", "Other"];

type Step = 1 | 2 | 3 | 4;

export default function EditBackgroundModal({
  profile,
  onClose,
  onSaved,
  guidedMode,
  guidedStep,
  guidedTotal,
  onGuidedBack,
}: BaseEditModalProps) {
  const meta = profile.metadata;

  // Track mounted state
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Wizard state
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [slideDirection, setSlideDirection] = useState<"left" | "right">("right");
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Form state
  const [yearsExperience, setYearsExperience] = useState<string>(
    meta.years_caregiving != null ? String(meta.years_caregiving) : ""
  );
  const [certifications, setCertifications] = useState<string[]>(meta.certifications || []);
  const [careTypes, setCareTypes] = useState<string[]>(meta.care_experience_types || []);
  const [languages, setLanguages] = useState<string[]>(meta.languages || []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stepLabels: Record<Step, string> = {
    1: "Experience",
    2: "Certifications",
    3: "Care Types",
    4: "Languages",
  };

  const originalYears = meta.years_caregiving != null ? String(meta.years_caregiving) : "";
  const hasChanges =
    yearsExperience !== originalYears ||
    JSON.stringify(certifications) !== JSON.stringify(meta.certifications || []) ||
    JSON.stringify(careTypes) !== JSON.stringify(meta.care_experience_types || []) ||
    JSON.stringify(languages) !== JSON.stringify(meta.languages || []);

  // Navigate with animation
  const navigateToStep = useCallback((step: Step) => {
    if (step === currentStep || isTransitioning) return;
    setSlideDirection(step > currentStep ? "right" : "left");
    setIsTransitioning(true);
    setTimeout(() => {
      if (isMountedRef.current) {
        setCurrentStep(step);
        setIsTransitioning(false);
      }
    }, 150);
  }, [currentStep, isTransitioning]);

  const toggleArrayItem = (
    current: string[],
    setter: (val: string[]) => void,
    item: string
  ) => {
    if (current.includes(item)) {
      setter(current.filter((i) => i !== item));
    } else {
      setter([...current, item]);
    }
  };

  async function handleSave() {
    setSaving(true);
    setError(null);

    try {
      await saveStudentProfile({
        profileId: profile.id,
        metadataFields: {
          years_caregiving: yearsExperience === "family" ? 0 : yearsExperience ? Number(yearsExperience) : null,
          certifications,
          care_experience_types: careTypes,
          languages,
        },
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      if (isMountedRef.current) {
        setSaving(false);
      }
    }
  }

  function handleContinue() {
    setError(null);
    if (currentStep < 4) {
      navigateToStep((currentStep + 1) as Step);
    } else {
      handleSave();
    }
  }

  function handleBack() {
    if (currentStep === 1) {
      if (guidedMode && onGuidedBack) {
        onGuidedBack();
      } else {
        onClose();
      }
    } else {
      navigateToStep((currentStep - 1) as Step);
    }
  }

  // Check if current step has content
  const isCurrentStepComplete = () => {
    switch (currentStep) {
      case 1: return !!yearsExperience;
      case 2: return certifications.length > 0;
      case 3: return careTypes.length > 0;
      case 4: return languages.length > 0;
    }
  };

  const getButtonText = () => {
    if (currentStep === 4) {
      return saving ? "Saving..." : guidedMode ? "Save & Next" : "Done";
    }
    if (isCurrentStepComplete()) {
      return "Continue";
    }
    return "Skip for now";
  };

  const getBackButtonText = () => {
    if (currentStep === 1) {
      return guidedMode && onGuidedBack ? "Back" : "Cancel";
    }
    return "Back";
  };

  // Render step content
  const renderStepContent = () => {
    const transitionClass = isTransitioning
      ? slideDirection === "right"
        ? "opacity-0 translate-x-4"
        : "opacity-0 -translate-x-4"
      : "opacity-100 translate-x-0";

    return (
      <div className={`transition-all duration-150 ease-out ${transitionClass}`}>
        {/* Step 1: Experience Level */}
        {currentStep === 1 && (
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary-50 flex items-center justify-center">
              <svg className="w-10 h-10 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mb-2">Your experience level</h3>
            <p className="text-gray-500 text-sm mb-8 max-w-sm mx-auto">
              How much caregiving experience do you have? All levels welcome.
            </p>

            <div className="max-w-sm mx-auto space-y-3">
              {EXPERIENCE_OPTIONS.map((opt) => {
                const isSelected = yearsExperience === opt.value ||
                  (opt.value === "family" && yearsExperience === "0" && meta.years_caregiving === 0);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setYearsExperience(opt.value)}
                    className={`w-full flex flex-col items-start px-5 py-4 rounded-2xl text-left transition-all ${
                      isSelected
                        ? "bg-primary-50 border-2 border-primary-600 shadow-sm"
                        : "bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <span className={`text-sm font-medium ${isSelected ? "text-primary-700" : "text-gray-900"}`}>
                      {opt.label}
                    </span>
                    <span className={`text-xs mt-0.5 ${isSelected ? "text-primary-600" : "text-gray-500"}`}>
                      {opt.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Certifications */}
        {currentStep === 2 && (
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary-50 flex items-center justify-center">
              <svg className="w-10 h-10 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mb-2">Any certifications?</h3>
            <p className="text-gray-500 text-sm mb-8 max-w-sm mx-auto">
              Select all that apply. No certifications? No problem — you can skip this.
            </p>

            <div className="max-w-md mx-auto flex flex-wrap justify-center gap-2">
              {CERTIFICATION_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleArrayItem(certifications, setCertifications, c)}
                  className={`px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
                    certifications.includes(c)
                      ? "bg-primary-600 text-white shadow-sm"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            {certifications.length > 0 && (
              <p className="text-xs text-primary-600 mt-6">
                {certifications.length} selected
              </p>
            )}
          </div>
        )}

        {/* Step 3: Care Types */}
        {currentStep === 3 && (
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary-50 flex items-center justify-center">
              <svg className="w-10 h-10 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mb-2">Types of care you can provide</h3>
            <p className="text-gray-500 text-sm mb-8 max-w-sm mx-auto">
              Select all areas where you have experience or are willing to learn.
            </p>

            <div className="max-w-lg mx-auto flex flex-wrap justify-center gap-2">
              {CARE_TYPE_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleArrayItem(careTypes, setCareTypes, c)}
                  className={`px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
                    careTypes.includes(c)
                      ? "bg-primary-600 text-white shadow-sm"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            {careTypes.length > 0 && (
              <p className="text-xs text-primary-600 mt-6">
                {careTypes.length} selected
              </p>
            )}
          </div>
        )}

        {/* Step 4: Languages */}
        {currentStep === 4 && (
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary-50 flex items-center justify-center">
              <svg className="w-10 h-10 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mb-2">Languages you speak</h3>
            <p className="text-gray-500 text-sm mb-8 max-w-sm mx-auto">
              Being bilingual is a huge plus for many families.
            </p>

            <div className="max-w-md mx-auto flex flex-wrap justify-center gap-2">
              {LANGUAGE_OPTIONS.map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => toggleArrayItem(languages, setLanguages, l)}
                  className={`px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
                    languages.includes(l)
                      ? "bg-primary-600 text-white shadow-sm"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>

            {languages.length > 0 && (
              <p className="text-xs text-primary-600 mt-6">
                {languages.length} selected
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  // Footer component
  const footerContent = (
    <div className="pt-4 border-t border-gray-100">
      {/* Guided mode progress bar */}
      {guidedMode && guidedStep && guidedTotal && (
        <div className="flex gap-0.5 px-1 mb-4">
          {Array.from({ length: guidedTotal }, (_, i) => (
            <div
              key={i}
              className={`flex-1 h-[3px] rounded-full transition-colors duration-300 ${
                i + 1 <= guidedStep ? "bg-primary-600" : "bg-gray-100"
              }`}
            />
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleBack}
          disabled={isTransitioning || saving}
          className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
        >
          {getBackButtonText()}
        </button>

        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          {guidedMode && guidedStep && guidedTotal ? (
            <span>Step {guidedStep} of {guidedTotal}</span>
          ) : (
            <>
              <span className="text-gray-500 font-medium">{stepLabels[currentStep]}</span>
              <span>·</span>
              <span>Step {currentStep} of 4</span>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={handleContinue}
          disabled={saving || isTransitioning}
          className={`px-6 py-2.5 text-sm font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            isCurrentStepComplete()
              ? "bg-primary-600 text-white hover:bg-primary-700 shadow-sm hover:shadow"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving...
            </span>
          ) : (
            getButtonText()
          )}
        </button>
      </div>
    </div>
  );

  return (
    <Modal
      isOpen
      onClose={onClose}
      title=""
      size="2xl"
      footer={footerContent}
    >
      <div className="px-2">
        {/* Step Content */}
        <div className="min-h-[360px] flex items-start justify-center pt-4">
          {renderStepContent()}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-auto max-w-md mt-4 p-4 bg-red-50 border border-red-200 rounded-2xl">
            <p className="text-sm text-red-600 text-center" role="alert">{error}</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
