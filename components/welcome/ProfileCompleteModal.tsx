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
  const [showButton, setShowButton] = useState(false);

  // Staggered entrance animation
  useEffect(() => {
    if (isOpen) {
      const contentTimer = setTimeout(() => setShowContent(true), 200);
      const buttonTimer = setTimeout(() => setShowButton(true), 600);
      return () => {
        clearTimeout(contentTimer);
        clearTimeout(buttonTimer);
      };
    } else {
      setShowContent(false);
      setShowButton(false);
    }
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onContinue} size="md">
      <div className="py-6 px-2">
        {/* Custom Illustration - Abstract sunrise/dawn representing new beginning */}
        <div className="relative w-full h-48 mb-8 overflow-hidden rounded-2xl bg-gradient-to-b from-amber-50 via-orange-50 to-rose-50">
          {/* Animated sun rays */}
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 400 200"
            preserveAspectRatio="xMidYMax slice"
          >
            {/* Gradient definitions */}
            <defs>
              <linearGradient id="sunGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FCD34D" />
                <stop offset="100%" stopColor="#F59E0B" />
              </linearGradient>
              <linearGradient id="rayGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FDE68A" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#FDE68A" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="hillGradient1" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#86EFAC" />
                <stop offset="100%" stopColor="#4ADE80" />
              </linearGradient>
              <linearGradient id="hillGradient2" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#A7F3D0" />
                <stop offset="100%" stopColor="#6EE7B7" />
              </linearGradient>
            </defs>

            {/* Sun rays - animated */}
            <g className="origin-[200px_220px]" style={{ animation: "spin 60s linear infinite" }}>
              {[...Array(12)].map((_, i) => (
                <rect
                  key={i}
                  x="198"
                  y="80"
                  width="4"
                  height="60"
                  rx="2"
                  fill="url(#rayGradient)"
                  transform={`rotate(${i * 30} 200 220)`}
                  style={{
                    opacity: 0.4 + (i % 2) * 0.2,
                  }}
                />
              ))}
            </g>

            {/* Sun */}
            <circle
              cx="200"
              cy="220"
              r="50"
              fill="url(#sunGradient)"
              className="drop-shadow-lg"
              style={{
                animation: "pulse 4s ease-in-out infinite",
              }}
            />

            {/* Rolling hills - back */}
            <ellipse
              cx="100"
              cy="220"
              rx="180"
              ry="60"
              fill="url(#hillGradient2)"
            />
            <ellipse
              cx="350"
              cy="230"
              rx="150"
              ry="50"
              fill="url(#hillGradient2)"
            />

            {/* Rolling hills - front */}
            <ellipse
              cx="200"
              cy="240"
              rx="250"
              ry="70"
              fill="url(#hillGradient1)"
            />

            {/* Small decorative elements - flowers/dots */}
            <circle cx="80" cy="185" r="3" fill="#FCA5A5" opacity="0.8" />
            <circle cx="120" cy="175" r="2" fill="#FCD34D" opacity="0.8" />
            <circle cx="280" cy="180" r="2.5" fill="#A5B4FC" opacity="0.8" />
            <circle cx="320" cy="170" r="2" fill="#FCA5A5" opacity="0.8" />
            <circle cx="160" cy="165" r="2" fill="#86EFAC" opacity="0.8" />
          </svg>

          {/* Floating particles */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  left: `${15 + i * 15}%`,
                  top: `${20 + (i % 3) * 20}%`,
                  backgroundColor: ["#FDE68A", "#A7F3D0", "#FECACA", "#C7D2FE", "#FCD34D", "#86EFAC"][i],
                  animation: `float ${3 + i * 0.5}s ease-in-out infinite`,
                  animationDelay: `${i * 0.3}s`,
                  opacity: 0.7,
                }}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div
          className={`text-center transition-all duration-500 ${
            showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <h2 className="text-2xl font-display font-semibold text-gray-900 mb-3">
            Beautifully done
          </h2>
          <p className="text-gray-500 leading-relaxed max-w-sm mx-auto mb-8">
            Your profile tells your story. Now local care providers can understand
            exactly what you&apos;re looking for.
          </p>

          {/* Subtle hint about next step */}
          <div className="flex items-center justify-center gap-2 text-sm text-gray-400 mb-6">
            <span className="w-8 h-px bg-gray-200" />
            <span>One more step to get discovered</span>
            <span className="w-8 h-px bg-gray-200" />
          </div>
        </div>

        {/* CTA Button */}
        <div
          className={`transition-all duration-500 ${
            showButton ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <button
            onClick={onContinue}
            className="group relative w-full py-4 px-6 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-2xl transition-all duration-300 overflow-hidden"
          >
            {/* Subtle shimmer effect on hover */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <span className="relative flex items-center justify-center gap-2">
              Continue
              <svg
                className="w-4 h-4 transition-transform group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          </button>
        </div>

        {/* Keyframe animations */}
        <style jsx>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.02); }
          }
        `}</style>
      </div>
    </Modal>
  );
}
