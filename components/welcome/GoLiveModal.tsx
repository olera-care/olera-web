"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";

interface GoLiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called when user chooses to go live */
  onGoLive: () => Promise<void>;
  /** Called when user chooses "Not now" */
  onSkip: () => void;
  /** Whether the profile has minimum required data */
  canGoLive: boolean;
  /** List of missing items if can't go live */
  missingItems?: string[];
}

export default function GoLiveModal({
  isOpen,
  onClose,
  onGoLive,
  onSkip,
  canGoLive,
  missingItems = [],
}: GoLiveModalProps) {
  const [activating, setActivating] = useState(false);
  const [isToggled, setIsToggled] = useState(false);

  const handleGoLive = async () => {
    if (!canGoLive || activating) return;
    setActivating(true);
    try {
      await onGoLive();
    } catch (err) {
      console.error("[GoLiveModal] Failed to go live:", err);
      setActivating(false);
    }
  };

  const handleSkip = () => {
    onSkip();
  };

  // Benefits of going live
  const benefits = [
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
      title: "Get discovered",
      description: "Local providers can find your profile",
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      title: "Receive messages",
      description: "Providers can reach out directly",
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
      title: "Get matched",
      description: "We'll suggest providers who fit your needs",
    },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="py-4">
        {/* Header with celebration */}
        <div className="text-center mb-8">
          {/* Animated icon */}
          <div className="relative w-20 h-20 mx-auto mb-5">
            <div className="absolute inset-0 rounded-full bg-emerald-100 animate-ping opacity-30" />
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          <h2 className="text-2xl font-display font-semibold text-gray-900 mb-2">
            Your profile is ready!
          </h2>
          <p className="text-gray-500 max-w-sm mx-auto">
            You&apos;ve added everything providers need to understand your care situation.
          </p>
        </div>

        {/* Benefits section */}
        <div className="bg-gray-50 rounded-2xl p-5 mb-6">
          <p className="text-sm font-semibold text-gray-700 mb-4">
            When you go live, you can:
          </p>
          <div className="space-y-4">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-emerald-600 shrink-0">
                  {benefit.icon}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{benefit.title}</p>
                  <p className="text-sm text-gray-500">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Privacy note */}
        <div className="flex items-start gap-3 px-1 mb-8">
          <svg className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <p className="text-sm text-gray-500">
            Your contact info stays private until you choose to share it with a provider.
          </p>
        </div>

        {/* Actions */}
        {canGoLive ? (
          <div className="space-y-3">
            {/* Go Live toggle/button */}
            <button
              onClick={() => {
                if (!isToggled) {
                  setIsToggled(true);
                } else {
                  handleGoLive();
                }
              }}
              disabled={activating}
              className={`
                w-full py-4 px-6 rounded-2xl font-semibold text-lg transition-all duration-300
                ${isToggled
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200"
                  : "bg-gray-900 hover:bg-gray-800 text-white"
                }
                disabled:opacity-70 disabled:cursor-not-allowed
              `}
            >
              {activating ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Going live...
                </span>
              ) : isToggled ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Confirm — Go Live Now
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="4" />
                  </svg>
                  Go Live
                </span>
              )}
            </button>

            {/* Not now option */}
            <button
              onClick={handleSkip}
              disabled={activating}
              className="w-full py-3 px-6 text-gray-500 hover:text-gray-700 font-medium transition-colors disabled:opacity-50"
            >
              Not now, I&apos;ll do this later
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Can't go live - missing data */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
              <p className="text-sm text-amber-800">
                <span className="font-semibold">Almost there!</span> Add your {missingItems.join(" and ")} to go live.
              </p>
            </div>
            <button
              onClick={handleSkip}
              className="w-full py-3 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
            >
              Continue setting up
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
