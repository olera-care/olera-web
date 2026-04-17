"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Modal from "@/components/ui/Modal";
import { SCENARIO_QUESTIONS } from "@/lib/medjobs-completeness";
import { saveStudentProfile } from "./save-profile";
import type { BaseEditModalProps } from "./types";

type Step = 1 | 2 | 3;

// Icons and context for each question
const STEP_CONFIG: Record<Step, { icon: React.ReactNode; context: string; shortLabel: string }> = {
  1: {
    shortLabel: "Reliability",
    context: "Providers need to know you can balance school and work.",
    icon: (
      <svg className="w-10 h-10 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  2: {
    shortLabel: "Judgement",
    context: "This tests your ability to handle difficult situations.",
    icon: (
      <svg className="w-10 h-10 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  3: {
    shortLabel: "Commitment",
    context: "Show providers you're serious about caregiving.",
    icon: (
      <svg className="w-10 h-10 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
  },
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

  const originalAnswers = SCENARIO_QUESTIONS.map((q) => {
    const existing = responses.find((r) => r.question === q.question);
    return existing?.answer || "";
  });

  const hasChanges = JSON.stringify(answers) !== JSON.stringify(originalAnswers);

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

    const config = STEP_CONFIG[currentStep];
    const question = SCENARIO_QUESTIONS[currentStep - 1];
    const answer = answers[currentStep - 1];
    const charCount = answer.length;

    return (
      <div className={`transition-all duration-150 ease-out ${transitionClass}`}>
        <div className="text-center">
          {/* Icon */}
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary-50 flex items-center justify-center">
            {config.icon}
          </div>

          {/* Context */}
          <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
            {config.context}
          </p>

          {/* Question */}
          <div className="max-w-md mx-auto mb-6">
            <p className="text-base font-medium text-gray-900 leading-relaxed">
              "{question.question}"
            </p>
          </div>

          {/* Answer textarea */}
          <div className="max-w-md mx-auto">
            <textarea
              value={answer}
              onChange={(e) => updateAnswer(currentStep - 1, e.target.value)}
              placeholder="Share your thoughtful response..."
              rows={4}
              className="w-full bg-white border border-gray-200 focus:border-primary-600 focus:ring-2 focus:ring-primary-100 outline-none rounded-2xl px-5 py-4 text-sm text-gray-900 placeholder:text-gray-400 transition-all resize-none"
              autoFocus
            />
            <div className="flex items-center justify-between mt-3 px-1">
              <span className={`text-xs ${
                charCount === 0
                  ? "text-gray-400"
                  : charCount < 50
                  ? "text-amber-600"
                  : "text-primary-600"
              }`}>
                {charCount === 0
                  ? "Minimum 50 characters"
                  : charCount < 50
                  ? `${50 - charCount} more characters needed`
                  : `${charCount} characters`
                }
              </span>
              {charCount >= 50 && (
                <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </div>

          {/* Tip */}
          <p className="text-xs text-gray-400 mt-6 max-w-sm mx-auto">
            Be specific and honest. Providers may ask follow-up questions in interviews.
          </p>
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
              <span className="text-gray-500 font-medium">{STEP_CONFIG[currentStep].shortLabel}</span>
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
        <div className="min-h-[380px] flex items-start justify-center pt-4">
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
