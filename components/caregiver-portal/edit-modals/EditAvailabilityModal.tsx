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
    setYearRoundAvailability((prev) => {
      // If clearing the selection, remove the entry entirely
      if (!status) {
        return Object.fromEntries(
          Object.entries(prev).filter(([key]) => key !== season)
        ) as typeof prev;
      }
      return {
        ...prev,
        [season]: { status, year: currentYear },
      };
    });
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
      case 3: {
        // Check for at least one season with a valid (non-empty) status
        const validEntries = Object.values(yearRoundAvailability).filter(
          (entry) => entry && typeof entry === "object" && "status" in entry && entry.status
        );
        return validEntries.length > 0;
      }
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
          <div>
            <label htmlFor="commitment-statement" className="block text-sm font-medium text-gray-700 mb-1">
              Your commitment to caregiving
            </label>
            <p id="commitment-description" className="text-sm text-gray-500 mb-4">
              This is the #1 thing providers look at. Describe your availability and how long you plan to work.
            </p>

            {/* Templates - show only when empty */}
            {!commitmentStatement && (
              <div className="mb-4">
                <p className="text-xs text-gray-400 mb-2">Start with a template:</p>
                <div className="flex flex-wrap gap-2">
                  {COMMITMENT_SUGGESTIONS.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCommitmentStatement(s)}
                      className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      Template {i + 1}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <textarea
              id="commitment-statement"
              aria-describedby="commitment-description"
              value={commitmentStatement}
              onChange={(e) => setCommitmentStatement(e.target.value)}
              placeholder="I am committed to working caregiving shifts around my class schedule for at least 6 months. Outside of class and exam periods, I am available for shifts including evenings, weekends, and overnights..."
              rows={8}
              className="w-full bg-white border border-gray-200 focus:border-primary-600 focus:ring-2 focus:ring-primary-100 outline-none rounded-xl px-4 py-3.5 text-sm text-gray-900 placeholder:text-gray-400 transition-all resize-y min-h-[200px]"
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
                <span className="flex items-center gap-1 text-xs text-primary-600">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Good
                </span>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Additional Pledges */}
        {currentStep === 2 && (
          <div role="group" aria-labelledby="pledges-label">
            <p id="pledges-label" className="block text-sm font-medium text-gray-700 mb-1">
              Additional commitments
            </p>
            <p className="text-sm text-gray-500 mb-5">
              These are optional, but help providers understand your flexibility.
            </p>

            <div className="space-y-4">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={prnWilling}
                  onChange={() => setPrnWilling(!prnWilling)}
                  className="mt-0.5 w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900 group-hover:text-primary-600 transition-colors">
                    On-call / PRN available
                  </span>
                  <p className="text-sm text-gray-500 mt-0.5">
                    I can be on-call until a client needs shifts that fit my schedule
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={advanceNoticePledge}
                  onChange={() => setAdvanceNoticePledge(!advanceNoticePledge)}
                  className="mt-0.5 w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900 group-hover:text-primary-600 transition-colors">
                    Regular schedule updates
                  </span>
                  <p className="text-sm text-gray-500 mt-0.5">
                    I commit to keeping my availability and course schedule updated
                  </p>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Step 3: Seasonal Availability */}
        {currentStep === 3 && (
          <div role="group" aria-labelledby="seasonal-availability-label">
            <p id="seasonal-availability-label" className="block text-sm font-medium text-gray-700 mb-1">
              Year-round availability
            </p>
            <p className="text-sm text-gray-500 mb-5">
              Let providers know your plans for each season.
            </p>

            <div className="space-y-4">
              {SEASONS.map((season) => {
                const data = yearRoundAvailability[season] as { status?: string; year?: number } | undefined;
                const isCurrent = season === currentSeason;
                const selectId = `season-${season}`;
                return (
                  <div key={season} className="flex items-center gap-3">
                    <label htmlFor={selectId} className="w-24 shrink-0">
                      <span className="text-sm font-medium text-gray-900">
                        {SEASON_LABELS[season]}
                      </span>
                      {isCurrent && (
                        <span className="ml-1.5 text-[10px] font-medium text-primary-600">
                          (now)
                        </span>
                      )}
                    </label>
                    <select
                      id={selectId}
                      value={data?.status || ""}
                      onChange={(e) => handleSeasonChange(season, e.target.value)}
                      className="flex-1 text-sm bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500"
                    >
                      <option value="">Select...</option>
                      {SEASONAL_STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 4: Additional Notes */}
        {currentStep === 4 && (
          <div>
            <label htmlFor="availability-notes" className="block text-sm font-medium text-gray-700 mb-1">
              Additional notes
            </label>
            <p id="notes-description" className="text-sm text-gray-500 mb-4">
              Optional: finals, spring break, planned travel, etc.
            </p>

            <textarea
              id="availability-notes"
              aria-describedby="notes-description"
              value={availabilityNotes}
              onChange={(e) => setAvailabilityNotes(e.target.value)}
              placeholder="Any specific dates or circumstances providers should know about..."
              rows={8}
              className="w-full bg-white border border-gray-200 focus:border-primary-600 focus:ring-2 focus:ring-primary-100 outline-none rounded-xl px-4 py-3.5 text-sm text-gray-900 placeholder:text-gray-400 transition-all resize-y min-h-[200px]"
            />
            <p className="text-xs text-gray-400 mt-2">
              This field is optional
            </p>
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
      <div className="pt-2">
        {renderStepContent()}

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
