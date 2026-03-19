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
  const [showActions, setShowActions] = useState(false);

  // Staggered entrance animation
  useEffect(() => {
    if (isOpen) {
      const contentTimer = setTimeout(() => setShowContent(true), 150);
      const actionsTimer = setTimeout(() => setShowActions(true), 400);
      return () => {
        clearTimeout(contentTimer);
        clearTimeout(actionsTimer);
      };
    } else {
      setShowContent(false);
      setShowActions(false);
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
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="py-4 px-2">
        {/* Custom Illustration - Connection/Discovery concept */}
        <div className="relative w-full h-56 mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-teal-50 via-cyan-50 to-sky-50">
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 400 224"
            preserveAspectRatio="xMidYMid slice"
          >
            <defs>
              {/* Gradients */}
              <linearGradient id="centerGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#14B8A6" />
                <stop offset="100%" stopColor="#0D9488" />
              </linearGradient>
              <linearGradient id="nodeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#5EEAD4" />
                <stop offset="100%" stopColor="#2DD4BF" />
              </linearGradient>
              <radialGradient id="pulseGradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#14B8A6" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#14B8A6" stopOpacity="0" />
              </radialGradient>

              {/* Filter for soft glow */}
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Animated pulse rings from center */}
            <circle cx="200" cy="112" r="80" fill="url(#pulseGradient)" style={{ animation: "expandPulse 3s ease-out infinite" }} />
            <circle cx="200" cy="112" r="60" fill="url(#pulseGradient)" style={{ animation: "expandPulse 3s ease-out infinite 1s" }} />
            <circle cx="200" cy="112" r="40" fill="url(#pulseGradient)" style={{ animation: "expandPulse 3s ease-out infinite 2s" }} />

            {/* Connection lines - animated dash */}
            <g stroke="#99F6E4" strokeWidth="1.5" fill="none" strokeDasharray="4 4" style={{ animation: "dash 20s linear infinite" }}>
              <path d="M200 112 L80 60" />
              <path d="M200 112 L320 50" />
              <path d="M200 112 L60 150" />
              <path d="M200 112 L340 160" />
              <path d="M200 112 L140 180" />
              <path d="M200 112 L280 190" />
            </g>

            {/* Outer nodes (providers) - animated subtle movement */}
            <g filter="url(#glow)">
              {/* Top left */}
              <circle cx="80" cy="60" r="14" fill="url(#nodeGradient)" style={{ animation: "nodeFloat 4s ease-in-out infinite" }} />
              <circle cx="80" cy="60" r="6" fill="white" opacity="0.9" />

              {/* Top right */}
              <circle cx="320" cy="50" r="12" fill="url(#nodeGradient)" style={{ animation: "nodeFloat 4s ease-in-out infinite 0.5s" }} />
              <circle cx="320" cy="50" r="5" fill="white" opacity="0.9" />

              {/* Left */}
              <circle cx="60" cy="150" r="10" fill="url(#nodeGradient)" style={{ animation: "nodeFloat 4s ease-in-out infinite 1s" }} />
              <circle cx="60" cy="150" r="4" fill="white" opacity="0.9" />

              {/* Right */}
              <circle cx="340" cy="160" r="13" fill="url(#nodeGradient)" style={{ animation: "nodeFloat 4s ease-in-out infinite 1.5s" }} />
              <circle cx="340" cy="160" r="5" fill="white" opacity="0.9" />

              {/* Bottom left */}
              <circle cx="140" cy="180" r="11" fill="url(#nodeGradient)" style={{ animation: "nodeFloat 4s ease-in-out infinite 2s" }} />
              <circle cx="140" cy="180" r="4" fill="white" opacity="0.9" />

              {/* Bottom right */}
              <circle cx="280" cy="190" r="9" fill="url(#nodeGradient)" style={{ animation: "nodeFloat 4s ease-in-out infinite 2.5s" }} />
              <circle cx="280" cy="190" r="3.5" fill="white" opacity="0.9" />
            </g>

            {/* Center node (you) - larger, prominent */}
            <circle cx="200" cy="112" r="28" fill="url(#centerGlow)" filter="url(#glow)" />
            <circle cx="200" cy="112" r="12" fill="white" opacity="0.95" />

            {/* Small person icon in center */}
            <g transform="translate(200, 112)">
              <circle cx="0" cy="-4" r="3" fill="#0D9488" />
              <path d="M-4 2 Q0 6 4 2" stroke="#0D9488" strokeWidth="2" fill="none" strokeLinecap="round" />
            </g>
          </svg>

          {/* Subtle floating particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full bg-teal-300"
                style={{
                  width: `${4 + (i % 3) * 2}px`,
                  height: `${4 + (i % 3) * 2}px`,
                  left: `${10 + i * 11}%`,
                  top: `${15 + (i % 4) * 18}%`,
                  opacity: 0.4,
                  animation: `particleFloat ${5 + i * 0.7}s ease-in-out infinite`,
                  animationDelay: `${i * 0.4}s`,
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
            Ready to be discovered?
          </h2>
          <p className="text-gray-500 leading-relaxed max-w-md mx-auto mb-8">
            Go live so providers can find and message you. Your contact details stay private until you share them.
          </p>

          {/* Visual benefit hints - minimal, elegant */}
          <div className="flex justify-center gap-8 mb-8">
            <div className="text-center">
              <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-teal-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <p className="text-xs text-gray-500">Visible to<br/>providers</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-teal-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-xs text-gray-500">Receive<br/>messages</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-teal-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <p className="text-xs text-gray-500">Get<br/>matched</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div
          className={`space-y-3 transition-all duration-500 ${
            showActions ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          {/* Go Live Button - the hero action */}
          <button
            onClick={handleGoLive}
            disabled={activating}
            className="group relative w-full py-4 px-6 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-2xl transition-all duration-300 overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-teal-200 hover:shadow-xl hover:shadow-teal-200"
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            <span className="relative flex items-center justify-center gap-2">
              {activating ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Going live...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="4" />
                  </svg>
                  Go Live
                </>
              )}
            </span>
          </button>

          {/* Not now - subtle, no pressure */}
          <button
            onClick={onSkip}
            disabled={activating}
            className="w-full py-3 px-6 text-gray-400 hover:text-gray-600 font-medium transition-colors disabled:opacity-50"
          >
            I&apos;ll do this later
          </button>
        </div>

        {/* Keyframe animations */}
        <style jsx>{`
          @keyframes expandPulse {
            0% { transform: scale(0.8); opacity: 0.6; }
            100% { transform: scale(2); opacity: 0; }
          }
          @keyframes dash {
            to { stroke-dashoffset: -100; }
          }
          @keyframes nodeFloat {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-6px); }
          }
          @keyframes particleFloat {
            0%, 100% { transform: translate(0, 0); }
            25% { transform: translate(5px, -8px); }
            50% { transform: translate(-3px, -12px); }
            75% { transform: translate(-6px, -4px); }
          }
        `}</style>
      </div>
    </Modal>
  );
}
