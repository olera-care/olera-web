"use client";

import { useEffect, useState, useCallback } from "react";

// Wizard step configuration - 3 steps matching the original claim flow
const WIZARD_STEPS = [
  {
    id: "profile",
    target: "sidebar", // Points to Profile Completeness sidebar
    targetSelector: "[data-wizard-target='sidebar']",
    title: "Update your profile",
    description: "Add your details so families know who you are.",
    mobileDescription: "Your profile helps families learn about your care services and what makes you unique.",
  },
  {
    id: "reviews",
    target: "reviews", // Points to Reviews nav item
    targetSelector: "[data-wizard-target='reviews']",
    title: "Generate reviews",
    description: "Positive reviews help you stand out to families.",
    mobileDescription: "Build trust with families by collecting and responding to reviews.",
  },
  {
    id: "inbox",
    target: "inbox", // Points to Inbox nav item
    targetSelector: "[data-wizard-target='inbox']",
    title: "Connect with families",
    description: "View messages, respond to questions, and convert clients.",
    mobileDescription: "Manage all your family communications in one place.",
    buttonText: "Get started",
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

    if (currentStep.targetSelector) {
      const targetElement = document.querySelector(currentStep.targetSelector);

      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();

        if (currentStep.target === "sidebar") {
          // Position tooltip to the left of the sidebar
          setPosition({
            top: rect.top + 100,
            left: rect.left - 20,
          });
        } else {
          // Position tooltip below nav items
          setPosition({
            top: rect.bottom + 12,
            left: rect.left + rect.width / 2,
          });
        }
        return;
      }
    }

    // Fallback: center on screen
    setPosition({
      top: 200,
      left: window.innerWidth / 2,
    });
  }, [currentStep.targetSelector, currentStep.target, isMobile]);

  // Elevate target element above overlay (spotlight effect)
  useEffect(() => {
    if (!currentStep.targetSelector) return;

    const targetElement = document.querySelector(currentStep.targetSelector) as HTMLElement;
    if (!targetElement) return;

    // Save original styles
    const originalStyles = {
      position: targetElement.style.position,
      zIndex: targetElement.style.zIndex,
      backgroundColor: targetElement.style.backgroundColor,
      borderRadius: targetElement.style.borderRadius,
      boxShadow: targetElement.style.boxShadow,
      padding: targetElement.style.padding,
    };

    // Elevate above the overlay (z-50 = 50, so we use 51)
    targetElement.style.position = "relative";
    targetElement.style.zIndex = "51";
    targetElement.style.backgroundColor = "white";
    targetElement.style.borderRadius = "12px";
    targetElement.style.boxShadow = "0 0 0 4px white, 0 4px 20px rgba(0,0,0,0.15)";

    // Add subtle padding for nav items (not sidebar)
    if (currentStep.target !== "sidebar") {
      targetElement.style.padding = "8px 16px";
    }

    return () => {
      // Restore original styles
      targetElement.style.position = originalStyles.position;
      targetElement.style.zIndex = originalStyles.zIndex;
      targetElement.style.backgroundColor = originalStyles.backgroundColor;
      targetElement.style.borderRadius = originalStyles.borderRadius;
      targetElement.style.boxShadow = originalStyles.boxShadow;
      targetElement.style.padding = originalStyles.padding;
    };
  }, [currentStep.targetSelector, currentStep.target]);

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

              {/* Icon */}
              <div className="flex flex-col items-center text-center mb-5">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center mb-4 border border-primary-100/60">
                  <div className="text-primary-600">
                    {currentStep.id === "profile" && (
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    )}
                    {currentStep.id === "reviews" && (
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    )}
                    {currentStep.id === "inbox" && (
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    )}
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
                className="w-full py-4 bg-primary-600 text-white text-base font-semibold rounded-xl hover:bg-primary-700 active:scale-[0.99] transition-all shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2"
              >
                {currentStep.buttonText || "Next"}
              </button>

              {/* Skip link */}
              {!isLastStep && (
                <button
                  onClick={onComplete}
                  className="w-full mt-3 py-2 text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors min-h-[44px] focus:outline-none focus-visible:text-gray-900"
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
  // Desktop: Tooltip with Backdrop + Spotlight on Target
  // ════════════════════════════════════════════════════════════
  return (
    <>
      {/* Backdrop with subtle blur - target element elevated above this */}
      <div
        className={`fixed inset-0 bg-black/25 backdrop-blur-[2px] z-50 transition-all duration-300 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleNext}
        aria-hidden="true"
      />

      {/* Tooltip */}
      <div
        className={`fixed z-[52] transition-all duration-300 ease-out ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3"
        }`}
        style={{
          top: position.top,
          left: position.left,
          transform: currentStep.target === "sidebar" ? "translateX(-100%)" : "translateX(-50%)",
          width: "280px",
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="wizard-title-desktop"
      >
        {/* Arrow pointing up to nav item */}
        {currentStep.target !== "sidebar" && (
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45 border-l border-t border-gray-200 shadow-sm" />
        )}

        {/* Arrow pointing right to sidebar */}
        {currentStep.target === "sidebar" && (
          <div className="absolute top-6 -right-2 w-4 h-4 bg-white rotate-45 border-r border-t border-gray-200 shadow-sm" />
        )}

        {/* Card */}
        <div className="relative bg-white rounded-xl shadow-lg border border-gray-200 p-5">
          {/* Title */}
          <h3 id="wizard-title-desktop" className="text-base font-semibold text-gray-900 mb-1.5">
            {currentStep.title}
          </h3>

          {/* Description */}
          <p className="text-sm text-gray-500 leading-relaxed mb-4">
            {currentStep.description}
          </p>

          {/* Button */}
          <button
            onClick={handleNext}
            className="w-full py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 active:scale-[0.99] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2"
          >
            {currentStep.buttonText || "Next"}
          </button>

          {/* Step dots */}
          <div className="flex items-center justify-center gap-1.5 mt-4">
            {WIZARD_STEPS.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === step ? "bg-primary-600" : "bg-gray-200"
                }`}
                aria-label={`Step ${i + 1} of ${totalSteps}`}
                aria-current={i === step ? "step" : undefined}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
