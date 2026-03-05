"use client";

import { useEffect, useState, useCallback } from "react";

// Wizard step configuration - 3 steps to reduce friction
const WIZARD_STEPS = [
  {
    id: "profile",
    target: "profile",
    greeting: "Hello & Welcome!",
    title: "Update your profile",
    description: "Add your details so families know who you are.",
    mobileDescription: "Your profile helps families learn about your care services and what makes you unique.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    id: "matches",
    target: "leads",
    title: "See your matches",
    description: "View families actively searching for care in your area.",
    mobileDescription: "We match you with families looking for exactly what you offer. No more cold outreach.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    id: "connected-families",
    target: null,
    title: "Connect with families",
    description: "Messages, leads, Q&A, and reviews — all in one place.",
    mobileDescription: "Manage all your family communications, respond to questions, and build your reputation.",
    buttonText: "Get started",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
];

interface OnboardingWizardProps {
  step: number;
  onNext: () => void;
  onComplete: () => void;
}

export default function OnboardingWizard({
  step,
  onNext,
  onComplete,
}: OnboardingWizardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  const currentStep = WIZARD_STEPS[step];
  const totalSteps = WIZARD_STEPS.length;

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Calculate tooltip position based on target element (desktop only)
  const calculatePosition = useCallback(() => {
    if (isMobile) {
      // Mobile uses bottom sheet, no positioning needed
      setPosition({ top: 0, left: 0 });
      return;
    }

    if (currentStep.target) {
      // Find the nav button with matching text
      const buttons = document.querySelectorAll("nav button");
      const targetButton = Array.from(buttons).find(
        (btn) => btn.textContent?.toLowerCase().includes(currentStep.target!)
      );

      if (targetButton) {
        const rect = targetButton.getBoundingClientRect();
        setPosition({
          top: rect.bottom + 12,
          left: rect.left + rect.width / 2,
        });
      }
    } else {
      // Center on screen for final step
      setPosition({
        top: 200,
        left: window.innerWidth / 2,
      });
    }
  }, [currentStep.target, isMobile]);

  useEffect(() => {
    setIsVisible(false);

    const timer = setTimeout(() => {
      calculatePosition();
      setIsVisible(true);
    }, 150);

    window.addEventListener("resize", calculatePosition);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", calculatePosition);
    };
  }, [step, calculatePosition]);

  const handleNext = () => {
    if (step === totalSteps - 1) {
      onComplete();
    } else {
      onNext();
    }
  };

  if (!position) return null;

  const isLastStep = step === totalSteps - 1;

  // ════════════════════════════════════════════════════════════
  // Mobile: Bottom Sheet Experience
  // ════════════════════════════════════════════════════════════
  if (isMobile) {
    return (
      <>
        {/* Backdrop */}
        <div
          className={`fixed inset-0 bg-black/30 z-50 transition-opacity duration-300 ${
            isVisible ? "opacity-100" : "opacity-0"
          }`}
          onClick={handleNext}
          aria-hidden="true"
        />

        {/* Bottom Sheet */}
        <div
          className={`fixed inset-x-0 bottom-0 z-50 transition-transform duration-300 ease-out ${
            isVisible ? "translate-y-0" : "translate-y-full"
          }`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="wizard-title-mobile"
        >
          <div className="bg-white rounded-t-3xl shadow-xl">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* Content */}
            <div className="px-6 pb-8">
              {/* Step indicator pills */}
              <div className="flex items-center justify-center gap-2 mb-6">
                {WIZARD_STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === step
                        ? "w-8 bg-primary-600"
                        : i < step
                          ? "w-1.5 bg-primary-300"
                          : "w-1.5 bg-gray-200"
                    }`}
                  />
                ))}
              </div>

              {/* Icon + Greeting */}
              <div className="flex flex-col items-center text-center mb-5">
                {currentStep.greeting && (
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl">🌿</span>
                    <span className="text-sm font-semibold text-primary-600">{currentStep.greeting}</span>
                  </div>
                )}

                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center mb-4 border border-primary-100/60">
                  <div className="text-primary-600">
                    {currentStep.icon}
                  </div>
                </div>

                <h3 id="wizard-title-mobile" className="text-xl font-display font-bold text-gray-900 mb-2">
                  {currentStep.title}
                </h3>

                <p className="text-[15px] text-gray-500 leading-relaxed max-w-xs">
                  {currentStep.mobileDescription || currentStep.description}
                </p>
              </div>

              {/* Features preview (show what they'll get) */}
              {step === 0 && (
                <div className="bg-vanilla-50 rounded-xl p-4 mb-5 border border-warm-100/40">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">What you can do</p>
                  <div className="space-y-2.5">
                    {[
                      "Add photos & description",
                      "Set your pricing & services",
                      "Showcase staff credentials",
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2.5">
                        <div className="w-5 h-5 rounded-full bg-primary-100 flex items-center justify-center">
                          <svg className="w-3 h-3 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-sm text-gray-700">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="bg-vanilla-50 rounded-xl p-4 mb-5 border border-warm-100/40">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Families are looking for</p>
                  <div className="flex flex-wrap gap-2">
                    {["Memory Care", "24/7 Support", "Pet Friendly", "Private Rooms"].map((tag, i) => (
                      <span key={i} className="px-3 py-1.5 bg-white rounded-full text-sm text-gray-700 border border-gray-200">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="bg-vanilla-50 rounded-xl p-4 mb-5 border border-warm-100/40">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">All in one place</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { icon: "💬", label: "Messages" },
                      { icon: "⭐", label: "Reviews" },
                      { icon: "❓", label: "Q&A" },
                      { icon: "📊", label: "Analytics" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-gray-100">
                        <span>{item.icon}</span>
                        <span className="text-sm text-gray-700">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Primary action button */}
              <button
                onClick={handleNext}
                className="w-full py-4 bg-primary-600 text-white text-base font-semibold rounded-xl hover:bg-primary-700 active:scale-[0.99] transition-all shadow-sm"
              >
                {currentStep.buttonText || "Next"}
              </button>

              {/* Skip link */}
              {!isLastStep && (
                <button
                  onClick={onComplete}
                  className="w-full mt-3 py-2 text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Skip tour
                </button>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

  // ════════════════════════════════════════════════════════════
  // Desktop: Tooltip Experience
  // ════════════════════════════════════════════════════════════
  return (
    <>
      {/* Backdrop with subtle blur */}
      <div
        className={`fixed inset-0 bg-black/25 backdrop-blur-[2px] z-50 transition-all duration-300 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleNext}
        aria-hidden="true"
      />

      {/* Tooltip */}
      <div
        className={`fixed z-50 transition-all duration-300 ease-out ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3"
        }`}
        style={{
          top: position.top,
          left: position.left,
          transform: "translateX(-50%)",
          maxWidth: "320px",
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="wizard-title-desktop"
      >
        {/* Arrow (only show when pointing to nav item) */}
        {currentStep.target && (
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45 border-l border-t border-gray-200/80 shadow-sm" />
        )}

        {/* Card - matching dashboard card styling */}
        <div className="relative bg-white rounded-2xl shadow-lg border border-gray-200/80 p-6 w-full min-w-[280px]">
          {/* Greeting (only on first step) */}
          {currentStep.greeting && (
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center border border-primary-100/60">
                <span className="text-base">🌿</span>
              </div>
              <span className="text-sm font-semibold text-primary-600">{currentStep.greeting}</span>
            </div>
          )}

          {/* Title - using font-display */}
          <h3 id="wizard-title-desktop" className="text-lg font-display font-bold text-gray-900 mb-2">
            {currentStep.title}
          </h3>

          {/* Description */}
          <p className="text-[15px] text-gray-500 leading-relaxed mb-5">
            {currentStep.description}
          </p>

          {/* Button - matching dashboard button styling */}
          <button
            onClick={handleNext}
            className="w-full py-3 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 active:scale-[0.99] transition-all min-h-[48px] shadow-sm"
          >
            {currentStep.buttonText || "Next"}
          </button>

          {/* Step indicators */}
          <div className="flex items-center justify-center gap-2 mt-5">
            {WIZARD_STEPS.map((_, i) => (
              <div
                key={i}
                className={`transition-all duration-200 rounded-full ${
                  i === step
                    ? "w-6 h-2 bg-primary-600"
                    : i < step
                      ? "w-2 h-2 bg-primary-300"
                      : "w-2 h-2 bg-gray-200"
                }`}
                aria-label={`Step ${i + 1} of ${totalSteps}`}
                aria-current={i === step ? "step" : undefined}
              />
            ))}
          </div>

          {/* Skip link for accessibility */}
          {!isLastStep && (
            <button
              onClick={onComplete}
              className="w-full mt-4 text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors"
            >
              Skip tour
            </button>
          )}
        </div>
      </div>
    </>
  );
}
