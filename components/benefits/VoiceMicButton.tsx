"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { parseVoiceIntent, getConfirmationMessage } from "@/lib/benefits/voice-intent-parser";
import type { VoiceParseResult } from "@/lib/benefits/voice-intent-parser";
import type { IntakeStep } from "@/lib/types/benefits";
import VoiceTranscript from "./VoiceTranscript";

const PRIVACY_PROMPTED_KEY = "olera-mic-permission-prompted";

interface VoiceMicButtonProps {
  /** Current intake step (determines how transcript is parsed) */
  step: IntakeStep;
  /** Called when a valid answer is parsed from speech */
  onResult: (result: VoiceParseResult) => void;
  /** Optional className for positioning */
  className?: string;
  /** Guided mode: large centered mic with auto-restart */
  guided?: boolean;
  /** Auto-start mic when component mounts or step changes (guided mode) */
  autoStart?: boolean;
  /** Called when confirmation is shown (guided mode uses this for auto-advance) */
  onConfirmation?: (msg: string) => void;
}

export default function VoiceMicButton({
  step,
  onResult,
  className = "",
  guided = false,
  autoStart = false,
  onConfirmation,
}: VoiceMicButtonProps) {
  const {
    transcript,
    isListening,
    engine,
    permissionState,
    start,
    stop,
    reset,
    error: speechError,
  } = useSpeechRecognition();

  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [clarification, setClarification] = useState<string | null>(null);
  const [showPrivacyNote, setShowPrivacyNote] = useState(false);
  const prevStepRef = useRef(step);
  const processedTranscriptRef = useRef<string>("");
  const autoStartedRef = useRef(false);

  // Clear state when step changes
  useEffect(() => {
    if (prevStepRef.current !== step) {
      prevStepRef.current = step;
      reset();
      setConfirmation(null);
      setClarification(null);
      processedTranscriptRef.current = "";
      autoStartedRef.current = false;
    }
  }, [step, reset]);

  // Auto-start mic in guided mode
  useEffect(() => {
    if (!autoStart || autoStartedRef.current) return;
    if (engine === "none" || permissionState === "denied") return;

    autoStartedRef.current = true;

    // Check privacy note first
    if (typeof window !== "undefined" && !localStorage.getItem(PRIVACY_PROMPTED_KEY)) {
      setShowPrivacyNote(true);
      localStorage.setItem(PRIVACY_PROMPTED_KEY, "1");
      const timer = setTimeout(() => {
        setShowPrivacyNote(false);
        start();
      }, 1500);
      return () => clearTimeout(timer);
    }

    // Small delay to let the UI settle after step transition
    const timer = setTimeout(() => start(), 300);
    return () => clearTimeout(timer);
  }, [autoStart, engine, permissionState, start, step]);

  // Process transcript when listening stops
  useEffect(() => {
    if (isListening || !transcript || transcript === processedTranscriptRef.current) return;
    processedTranscriptRef.current = transcript;

    const result = parseVoiceIntent(transcript, step);
    const msg = getConfirmationMessage(result);

    if (result.type === "unknown") {
      setClarification(result.clarification);
      setConfirmation(null);
    } else {
      setConfirmation(msg);
      setClarification(null);
      onResult(result);
      if (msg) onConfirmation?.(msg);
    }
  }, [isListening, transcript, step, onResult, onConfirmation]);

  const handleClick = useCallback(() => {
    if (isListening) {
      stop();
      return;
    }

    // Reset previous state
    setConfirmation(null);
    setClarification(null);
    reset();
    processedTranscriptRef.current = "";

    // Show privacy note on first use
    if (typeof window !== "undefined" && !localStorage.getItem(PRIVACY_PROMPTED_KEY)) {
      setShowPrivacyNote(true);
      localStorage.setItem(PRIVACY_PROMPTED_KEY, "1");
      setTimeout(() => {
        setShowPrivacyNote(false);
        start();
      }, 1500);
      return;
    }

    start();
  }, [isListening, start, stop, reset]);

  // Don't render if speech recognition is completely unavailable
  if (engine === "none" && typeof window !== "undefined") {
    return null;
  }

  // Don't render during SSR
  if (typeof window === "undefined") {
    return null;
  }

  const isDisabled = permissionState === "denied";

  // ─── Guided (large) variant ─────────────────────────────────────────────

  if (guided) {
    return (
      <div className={`flex flex-col items-center ${className}`}>
        <button
          type="button"
          onClick={handleClick}
          disabled={isDisabled}
          aria-label={isListening ? "Stop listening" : "Speak your answer"}
          aria-pressed={isListening}
          className={`
            relative flex items-center justify-center
            w-20 h-20 rounded-full
            transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
            ${isListening
              ? "bg-primary-100 border-2 border-primary-300 text-primary-700 shadow-lg focus-visible:ring-primary-400"
              : isDisabled
                ? "bg-gray-50 border-2 border-gray-100 text-gray-300 cursor-not-allowed"
                : "bg-white border-2 border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-600 hover:border-gray-300 shadow-md hover:shadow-lg focus-visible:ring-gray-400 cursor-pointer"
            }
          `}
        >
          {/* Pulse ring when listening */}
          {isListening && (
            <span className="absolute inset-0 rounded-full border-2 border-primary-300 animate-ping opacity-30" />
          )}

          <svg
            className={`w-8 h-8 ${isListening ? "animate-pulse" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
          >
            {isDisabled ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 19L5 5m0 0l14 14M12 18.75a6 6 0 01-6-6v-1.5m12 1.5a6 6 0 01-.75 2.906M12 1.5a3 3 0 00-3 3v6.75"
              />
            ) : (
              <>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 1.5a3 3 0 00-3 3v7.5a3 3 0 006 0V4.5a3 3 0 00-3-3z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 10.5a7.5 7.5 0 01-15 0"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 18.75V22.5"
                />
              </>
            )}
          </svg>
        </button>

        <span className="mt-3 text-xs text-gray-400">
          {isListening ? "Listening\u2026 tap to stop" : "Tap to speak"}
        </span>

        {/* Privacy note (first use only) */}
        {showPrivacyNote && (
          <p className="mt-1.5 text-xs text-gray-400 text-center animate-fade-in">
            Audio is processed on-device and is not stored.
          </p>
        )}

        {/* Transcript display */}
        <VoiceTranscript
          transcript={transcript}
          isListening={isListening}
          confirmation={confirmation}
          clarification={clarification}
          error={speechError}
        />
      </div>
    );
  }

  // ─── Default (pill) variant ─────────────────────────────────────────────

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <button
        type="button"
        onClick={handleClick}
        disabled={isDisabled}
        aria-label={isListening ? "Stop listening" : "Speak your answer"}
        aria-pressed={isListening}
        className={`
          relative flex items-center justify-center gap-2 px-4 py-2 rounded-full
          min-h-[40px] text-sm font-medium
          transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
          ${isListening
            ? "bg-primary-50 border border-primary-200 text-primary-700 focus-visible:ring-primary-400"
            : isDisabled
              ? "bg-gray-50 border border-gray-100 text-gray-300 cursor-not-allowed"
              : "bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-600 hover:border-gray-300 focus-visible:ring-gray-400 cursor-pointer"
          }
        `}
      >
        {/* Mic icon */}
        <svg
          className={`w-4 h-4 ${isListening ? "animate-pulse" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          {isDisabled ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 19L5 5m0 0l14 14M12 18.75a6 6 0 01-6-6v-1.5m12 1.5a6 6 0 01-.75 2.906M12 1.5a3 3 0 00-3 3v6.75"
            />
          ) : (
            <>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 1.5a3 3 0 00-3 3v7.5a3 3 0 006 0V4.5a3 3 0 00-3-3z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 10.5a7.5 7.5 0 01-15 0"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 18.75V22.5"
              />
            </>
          )}
        </svg>

        <span>{isListening ? "Listening..." : "Speak"}</span>
      </button>

      {/* Privacy note (first use only) */}
      {showPrivacyNote && (
        <p className="mt-1.5 text-xs text-gray-400 text-center animate-fade-in">
          Audio is processed on-device and is not stored.
        </p>
      )}

      {/* Transcript display */}
      <VoiceTranscript
        transcript={transcript}
        isListening={isListening}
        confirmation={confirmation}
        clarification={clarification}
        error={speechError}
      />
    </div>
  );
}
