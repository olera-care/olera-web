"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";

interface GoLiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called when user chooses to go live */
  onGoLive: () => Promise<void>;
  /** Called when user chooses "Not now" */
  onSkip: () => void;
}

export default function GoLiveModal({
  isOpen,
  onClose,
  onGoLive,
  onSkip,
}: GoLiveModalProps) {
  const [activating, setActivating] = useState(false);
  const [showContent, setShowContent] = useState(false);

  // Entrance animation
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setShowContent(true), 100);
      return () => clearTimeout(timer);
    } else {
      setShowContent(false);
    }
  }, [isOpen]);

  const handleGoLive = async () => {
    if (activating) return;
    setActivating(true);
    try {
      await onGoLive();
    } catch (err) {
      console.error("[GoLiveModal] Failed to go live:", err);
      setActivating(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div
        className={`py-8 px-6 text-center transition-all duration-300 ${
          showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        {/* Simple, elegant illustration */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center">
          <div className="relative">
            {/* Pulse rings */}
            <div className="absolute inset-0 w-10 h-10 rounded-full bg-primary-400 opacity-20 animate-ping" />
            <div className="absolute inset-0 w-10 h-10 rounded-full bg-primary-400 opacity-10 animate-ping" style={{ animationDelay: '0.5s' }} />
            {/* Center icon */}
            <svg className="relative w-10 h-10 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        </div>

        {/* Headline - value-focused, punchy */}
        <h2 className="text-2xl font-display font-semibold text-gray-900 mb-3">
          Let providers find you
        </h2>

        {/* Simple, reassuring copy */}
        <p className="text-gray-500 leading-relaxed max-w-sm mx-auto mb-8">
          Care providers in your area will discover your profile and reach out directly.
        </p>

        {/* Actions */}
        <div className="space-y-3">
          {/* Go Live Button - primary color */}
          <button
            onClick={handleGoLive}
            disabled={activating}
            className="w-full py-4 px-6 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed shadow-md shadow-primary-600/20 hover:shadow-lg hover:shadow-primary-600/25 active:scale-[0.98]"
          >
            {activating ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Going live...
              </span>
            ) : (
              "Yes, let them find me"
            )}
          </button>

          {/* Not now - subtle */}
          <button
            onClick={onSkip}
            disabled={activating}
            className="w-full py-3 px-6 text-gray-400 hover:text-gray-600 font-medium transition-colors disabled:opacity-50"
          >
            Not now
          </button>
        </div>
      </div>
    </Modal>
  );
}
