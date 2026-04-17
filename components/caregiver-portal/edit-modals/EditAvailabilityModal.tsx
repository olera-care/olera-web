"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Modal from "@/components/ui/Modal";
import { saveStudentProfile } from "./save-profile";
import type { BaseEditModalProps } from "./types";
import { SEASONAL_STATUS_OPTIONS, SEASON_LABELS, getCurrentSeasonKey } from "@/lib/medjobs-helpers";

const COMMITMENT_SUGGESTIONS = [
  "I am committed to working caregiving shifts around my class schedule for at least 6 months. Outside of class and exam periods, I am available for shifts including evenings, weekends, and overnights.",
  "I plan to work as a caregiver for multiple semesters. I will keep my schedule updated and give at least 2 weeks notice before any changes. I understand reliability is critical for the families I serve.",
  "Caregiving is part of my professional development plan. I am committed to 6-12 months of consistent availability, working all hours outside of my coursework, and communicating proactively about schedule changes.",
];

const SEASONS = ["spring", "summer", "fall", "winter"] as const;

type Step = 1 | 2 | 3 | 4;

export default function EditAvailabilityModal({
  profile,
  onClose,
  onSaved,
  guidedMode,
  guidedStep,
  guidedTotal,
  onGuidedBack,
}: BaseEditModalProps) {
  const meta = profile.metadata;
  const currentSeason = getCurrentSeasonKey();
  const currentYear = new Date().getFullYear();

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
  const [commitmentStatement, setCommitmentStatement] = useState(meta.commitment_statement || "");
  const [prnWilling, setPrnWilling] = useState(!!meta.prn_willing);
  const [advanceNoticePledge, setAdvanceNoticePledge] = useState(!!meta.advance_notice_pledge);
  const [yearRoundAvailability, setYearRoundAvailability] = useState(meta.year_round_availability || {});
  const [availabilityNotes, setAvailabilityNotes] = useState(meta.availability_notes || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stepLabels: Record<Step, string> = {
    1: "Commitment",
    2: "Pledges",
    3: "Seasons",
    4: "Notes",
  };

  const hasChanges =
    commitmentStatement !== (meta.commitment_statement || "") ||
    prnWilling !== !!meta.prn_willing ||
    advanceNoticePledge !== !!meta.advance_notice_pledge ||
    JSON.stringify(yearRoundAvailability) !== JSON.stringify(meta.year_round_availability || {}) ||
    availabilityNotes !== (meta.availability_notes || "");

  const isCommitmentValid = commitmentStatement.trim().length >= 50;

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

  const handleSeasonChange = (season: string, status: string) => {
    setYearRoundAvailability((prev) => ({
      ...prev,
      [season]: { status, year: currentYear },
    }));
  };

  async function handleSave() {
    if (!isCommitmentValid) {
      setError("Commitment statement must be at least 50 characters");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await saveStudentProfile({
        profileId: profile.id,
        metadataFields: {
          commitment_statement: commitmentStatement.trim(),
          prn_willing: prnWilling,
          advance_notice_pledge: advanceNoticePledge,
          year_round_availability: yearRoundAvailability,
          availability_notes: availabilityNotes.trim() || null,
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

    // Validate step 1 before proceeding
    if (currentStep === 1 && !isCommitmentValid) {
      setError("Commitment statement must be at least 50 characters");
      return;
    }

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
      case 1: return isCommitmentValid;
      case 2: return true; // Optional
      case 3: return Object.keys(yearRoundAvailability).length > 0;
      case 4: return true; // Optional
    }
  };

  const getButtonText = () => {
    if (currentStep === 4) {
      return saving ? "Saving..." : guidedMode ? "Save & Next" : "Done";
    }
    return "Continue";
  };

  const getBackButtonText = () => {
    if (currentStep === 1) {
      return guidedMode && onGuidedBack ? "Back" : "Cancel";
    }
    return "Back";
  };

  // Custom header with title and subtitle
  const headerContent = (
    <div>
      <h2 className="text-xl sm:text-[22px] font-semibold text-gray-900">Availability & Commitment</h2>
      <p className="text-sm text-gray-500 mt-0.5">Tell providers about your schedule</p>
    </div>
  );

  // Render step content
  const renderStepContent = () => {
    const transitionClass = isTransitioning
      ? slideDirection === "right"
        ? "opacity-0 translate-x-4"
        : "opacity-0 -translate-x-4"
      : "opacity-100 translate-x-0";

    return (
      <div className={`transition-all duration-150 ease-out ${transitionClass}`}>
        {/* Step 1: Commitment Statement */}
        {currentStep === 1 && (
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-primary-50 flex items-center justify-center">
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-1">Your commitment to caregiving</h3>
            <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
              This is the #1 thing providers look at.
            </p>

            <div className="w-full max-w-xl mx-auto">
              {!commitmentStatement && (
                <div className="mb-4 space-y-2">
                  <p className="text-xs text-gray-400 font-medium text-left">Quick start templates:</p>
                  {COMMITMENT_SUGGESTIONS.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCommitmentStatement(s)}
                      className="w-full text-left px-4 py-3 bg-white border border-gray-200 hover:border-primary-300 hover:bg-primary-50 rounded-xl text-sm text-gray-600 transition-all leading-relaxed"
                    >
                      {s.slice(0, 80)}...
                    </button>
                  ))}
                </div>
              )}

              <textarea
                value={commitmentStatement}
                onChange={(e) => setCommitmentStatement(e.target.value)}
                placeholder="Describe your commitment to taking shifts, your availability outside of class, and how long you plan to work..."
                rows={7}
                className="w-full bg-white border border-gray-200 focus:border-primary-600 focus:ring-2 focus:ring-primary-100 outline-none rounded-xl px-4 py-4 text-sm text-gray-900 placeholder:text-gray-400 transition-all resize-y min-h-[160px]"
                autoFocus
              />
              <div className="flex items-center justify-between mt-2">
                <span className={`text-xs ${commitmentStatement.trim().length < 50 ? "text-amber-600" : "text-gray-400"}`}>
                  {commitmentStatement.trim().length < 50
                    ? `${50 - commitmentStatement.trim().length} more characters needed`
                    : `${commitmentStatement.trim().length} characters`
                  }
                </span>
                {commitmentStatement.trim().length >= 50 && (
                  <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Additional Pledges */}
        {currentStep === 2 && (
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-primary-50 flex items-center justify-center">
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-1">Additional commitments</h3>
            <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
              Show providers you understand the responsibility.
            </p>

            <div className="max-w-md mx-auto space-y-3">
              <button
                type="button"
                onClick={() => setPrnWilling(!prnWilling)}
                className={`w-full flex items-start gap-3 px-4 py-4 rounded-xl text-left transition-all ${
                  prnWilling
                    ? "bg-primary-50 border-2 border-primary-600"
                    : "bg-white border border-gray-200 hover:border-gray-300"
                }`}
              >
                <span className={`inline-flex items-center justify-center w-5 h-5 rounded-md shrink-0 mt-0.5 transition-all ${
                  prnWilling ? "bg-primary-600 text-white" : "border-2 border-gray-300"
                }`}>
                  {prnWilling && (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
                <span className={`text-sm ${prnWilling ? "text-gray-900" : "text-gray-600"}`}>
                  I am okay to be on-call / PRN until a client needs shifts that fit my schedule
                </span>
              </button>

              <button
                type="button"
                onClick={() => setAdvanceNoticePledge(!advanceNoticePledge)}
                className={`w-full flex items-start gap-3 px-4 py-4 rounded-xl text-left transition-all ${
                  advanceNoticePledge
                    ? "bg-primary-50 border-2 border-primary-600"
                    : "bg-white border border-gray-200 hover:border-gray-300"
                }`}
              >
                <span className={`inline-flex items-center justify-center w-5 h-5 rounded-md shrink-0 mt-0.5 transition-all ${
                  advanceNoticePledge ? "bg-primary-600 text-white" : "border-2 border-gray-300"
                }`}>
                  {advanceNoticePledge && (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
                <span className={`text-sm ${advanceNoticePledge ? "text-gray-900" : "text-gray-600"}`}>
                  I commit to keeping my availability and course schedule updated regularly
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Seasonal Availability */}
        {currentStep === 3 && (
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-primary-50 flex items-center justify-center">
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-1">Year-round availability</h3>
            <p className="text-gray-500 text-sm mb-5 max-w-sm mx-auto">
              Let providers know your plans for each season.
            </p>

            <div className="max-w-lg mx-auto space-y-4 text-left">
              {SEASONS.map((season) => {
                const data = yearRoundAvailability[season] as { status?: string; year?: number } | undefined;
                const isCurrent = season === currentSeason;
                return (
                  <div key={season}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-gray-900">
                        {SEASON_LABELS[season]}
                      </span>
                      {isCurrent && (
                        <span className="px-2 py-0.5 bg-primary-600 text-white text-[10px] font-medium rounded-full">
                          Now
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {SEASONAL_STATUS_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => handleSeasonChange(season, opt.value)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                            data?.status === opt.value
                              ? "bg-gray-900 text-white"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 4: Additional Notes */}
        {currentStep === 4 && (
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-primary-50 flex items-center justify-center">
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-1">Anything else?</h3>
            <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
              Optional: Finals, spring break, planned travel, etc.
            </p>

            <div className="w-full max-w-xl mx-auto">
              <textarea
                value={availabilityNotes}
                onChange={(e) => setAvailabilityNotes(e.target.value)}
                placeholder="Any specific dates or circumstances providers should know about..."
                rows={7}
                className="w-full bg-white border border-gray-200 focus:border-primary-600 focus:ring-2 focus:ring-primary-100 outline-none rounded-xl px-4 py-4 text-sm text-gray-900 placeholder:text-gray-400 transition-all resize-y min-h-[160px]"
                autoFocus
              />
              <p className="text-xs text-gray-400 mt-3 text-center">
                This field is optional
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Footer component for sticky positioning
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
              <span>{currentStep} of 4</span>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={handleContinue}
          disabled={saving || isTransitioning || (currentStep === 1 && !isCommitmentValid)}
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
      title={headerContent}
      size="2xl"
      footer={footerContent}
    >
      <div className="pt-4">
        {/* Step Content - now centered without progress dots taking space */}
        <div className="min-h-[340px] flex items-start justify-center">
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
