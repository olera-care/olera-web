"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";

interface ProfileCompleteModalProps {
  isOpen: boolean;
  onContinue: () => void;
}

export default function ProfileCompleteModal({
  isOpen,
  onContinue,
}: ProfileCompleteModalProps) {
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

  return (
    <Modal isOpen={isOpen} onClose={onContinue} size="md">
      <div
        className={`py-8 px-6 text-center transition-all duration-300 ${
          showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        {/* Simple, elegant checkmark illustration */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        {/* Headline */}
        <h2 className="text-2xl font-display font-semibold text-gray-900 mb-3">
          Profile complete!
        </h2>

        {/* Simple copy */}
        <p className="text-gray-500 leading-relaxed max-w-sm mx-auto mb-8">
          Providers can now see what you&apos;re looking for. Ready to go live and start receiving messages?
        </p>

        {/* CTA Button - primary color */}
        <button
          onClick={onContinue}
          className="w-full py-4 px-6 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-md shadow-primary-600/20 hover:shadow-lg hover:shadow-primary-600/25 active:scale-[0.98]"
        >
          Continue
        </button>
      </div>
    </Modal>
  );
}
