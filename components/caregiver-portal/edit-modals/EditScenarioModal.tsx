"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Modal from "@/components/ui/Modal";
import { SCENARIO_QUESTIONS } from "@/lib/medjobs-completeness";
import { saveStudentProfile } from "./save-profile";
import type { BaseEditModalProps } from "./types";

type Step = 1 | 2 | 3;

// Short labels for each question step
const STEP_LABELS: Record<Step, string> = {
  1: "Reliability",
  2: "Judgement",
  3: "Commitment",
};

export default function EditScenarioModal({
  profile,
  onClose,
  onSaved,
  guidedMode,
  guidedStep,
  guidedTotal,
  onGuidedBack,
}: BaseEditModalProps) {
  const meta = profile.metadata;
  const responses = meta.scenario_responses || [];

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

  // Form state - one answer per question
  const [answers, setAnswers] = useState<string[]>(() =>
    SCENARIO_QUESTIONS.map((q) => {
      const existing = responses.find((r) => r.question === q.question);
      return existing?.answer || "";
    })
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const updateAnswer = (index: number, value: string) => {
    const next = [...answers];
    next[index] = value;
    setAnswers(next);
  };

  async function handleSave() {
    // Validate all answers
    const allValid = answers.every((a) => a.length >= 50);
    if (!allValid) {
      setError("Each answer needs at least 50 characters");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await saveStudentProfile({
        profileId: profile.id,
        metadataFields: {
          scenario_responses: SCENARIO_QUESTIONS.map((q, i) => ({
            question: q.question,
            answer: answers[i].trim(),
          })),
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

    // Check current answer length
    const currentAnswer = answers[currentStep - 1];
    if (currentAnswer.length > 0 && currentAnswer.length < 50) {
      setError("Please write at least 50 characters");
      return;
    }

    if (currentStep < 3) {
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

  // Check if current step has valid answer
  const currentAnswer = answers[currentStep - 1];
  const isCurrentStepComplete = currentAnswer.length >= 50;

  const getButtonText = () => {
    if (currentStep === 3) {
      return saving ? "Saving..." : guidedMode ? "Save & Next" : "Done";
    }
    if (isCurrentStepComplete) {
      return "Continue";
    }
    if (currentAnswer.length > 0) {
      return "Continue"; // Will show error if < 50
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

    const question = SCENARIO_QUESTIONS[currentStep - 1];
    const answer = answers[currentStep - 1];
    const charCount = answer.length;

    return (
      <div className={`transition-all duration-150 ease-out ${transitionClass}`}>
        {/* Question as the prompt */}
        <p className="text-sm text-gray-900 font-medium mb-4">
          {question.question}
        </p>

        {/* Answer textarea */}
        <textarea
          aria-label={`Answer for ${STEP_LABELS[currentStep]}`}
          value={answer}
          onChange={(e) => updateAnswer(currentStep - 1, e.target.value)}
          placeholder="Share your thoughtful response..."
          rows={8}
          className="w-full bg-white border border-gray-200 focus:border-primary-600 focus:ring-2 focus:ring-primary-100 outline-none rounded-xl px-4 py-3.5 text-sm text-gray-900 placeholder:text-gray-400 transition-all resize-y min-h-[200px]"
          autoFocus
        />

        <div className="flex items-center justify-between mt-2">
          <span className={`text-xs ${
            charCount === 0
              ? "text-gray-400"
              : charCount < 50
              ? "text-amber-600"
              : "text-gray-400"
          }`}>
            {charCount === 0
              ? "Minimum 50 characters"
              : charCount < 50
              ? `${50 - charCount} more characters needed`
              : `${charCount} characters`
            }
          </span>
          {charCount >= 50 && (
            <span className="flex items-center gap-1 text-xs text-primary-600">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Good
            </span>
          )}
        </div>
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
              <span className="text-gray-500 font-medium">{STEP_LABELS[currentStep]}</span>
              <span>·</span>
              <span>Question {currentStep} of 3</span>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={handleContinue}
          disabled={saving || isTransitioning}
          className={`px-6 py-2.5 text-sm font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            isCurrentStepComplete
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

  // Header
  const headerContent = (
    <h2 className="text-xl sm:text-[22px] font-semibold text-gray-900">Screening Questions</h2>
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
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-600 text-center" role="alert">{error}</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
