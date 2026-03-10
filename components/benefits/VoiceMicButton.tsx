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
}

export default function VoiceMicButton({
  step,
  onResult,
  className = "",
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

  // Clear state when step changes
  useEffect(() => {
    if (prevStepRef.current !== step) {
      prevStepRef.current = step;
      reset();
      setConfirmation(null);
      setClarification(null);
      processedTranscriptRef.current = "";
    }
  }, [step, reset]);

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
    }
  }, [isListening, transcript, step, onResult]);

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
      // Start after a brief delay so user sees the note
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

  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleClick}
          disabled={isDisabled}
          aria-label={isListening ? "Stop listening" : "Speak your answer"}
          aria-pressed={isListening}
          className={`
            relative flex items-center justify-center w-10 h-10 rounded-full
            transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
            ${isListening
              ? "bg-red-50 text-red-600 focus-visible:ring-red-400"
              : isDisabled
                ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 focus-visible:ring-gray-400 cursor-pointer"
            }
          `}
          title={
            isDisabled
              ? "Microphone access blocked — enable in browser settings"
              : isListening
                ? "Tap to stop"
                : "Speak your answer"
          }
        >
          {/* Pulse rings when listening */}
          {isListening && (
            <>
              <span className="absolute inset-0 rounded-full bg-red-200 animate-ping opacity-20 motion-reduce:hidden" />
              <span className="absolute inset-[-4px] rounded-full border-2 border-red-300 animate-pulse motion-reduce:hidden" />
            </>
          )}

          {/* Mic icon */}
          <svg
            className="w-5 h-5 relative z-10"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            {isDisabled ? (
              // Mic off icon
              <>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 19L5 5m0 0l14 14M12 18.75a6 6 0 01-6-6v-1.5m12 1.5a6 6 0 01-.75 2.906M12 1.5a3 3 0 00-3 3v6.75"
                />
              </>
            ) : (
              // Mic icon
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

        {/* Privacy note (first use only) */}
        {showPrivacyNote && (
          <span className="text-xs text-gray-400 animate-fade-in">
            Audio is processed to understand your answer and is not stored.
          </span>
        )}
      </div>

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
