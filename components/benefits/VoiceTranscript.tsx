"use client";

import { useEffect, useState } from "react";

interface VoiceTranscriptProps {
  /** Real-time transcript text */
  transcript: string;
  /** Whether speech recognition is active */
  isListening: boolean;
  /** Confirmation message after successful parse */
  confirmation: string | null;
  /** Clarification/error message after failed parse */
  clarification: string | null;
  /** Error from speech recognition */
  error: string | null;
}

export default function VoiceTranscript({
  transcript,
  isListening,
  confirmation,
  clarification,
  error,
}: VoiceTranscriptProps) {
  const [visible, setVisible] = useState(false);

  // Auto-hide confirmation after 3s
  useEffect(() => {
    if (confirmation) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [confirmation]);

  // Show during listening or when there's content to display
  const hasContent = isListening || transcript || confirmation || clarification || error;

  if (!hasContent && !visible) return null;

  return (
    <div
      className="mt-3 min-h-[2rem]"
      aria-live="polite"
      aria-atomic="true"
    >
      {/* Listening transcript */}
      {isListening && transcript && (
        <p className="text-sm text-gray-500 italic animate-pulse">
          &ldquo;{transcript}&rdquo;
        </p>
      )}

      {/* Listening but no speech yet */}
      {isListening && !transcript && (
        <p className="text-sm text-gray-400 italic">Listening...</p>
      )}

      {/* Confirmation (successful parse) */}
      {!isListening && confirmation && visible && (
        <p className="text-sm text-green-700 font-medium">
          {confirmation}
        </p>
      )}

      {/* Final transcript shown after listening stops (before parse result) */}
      {!isListening && transcript && !confirmation && !clarification && !error && (
        <p className="text-sm text-gray-500">
          &ldquo;{transcript}&rdquo;
        </p>
      )}

      {/* Clarification (failed parse) */}
      {!isListening && clarification && (
        <div className="flex items-start gap-2">
          <p className="text-sm text-gray-500">
            &ldquo;{transcript}&rdquo;
          </p>
          <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full whitespace-nowrap">
            Try again
          </span>
        </div>
      )}

      {/* Error — only show if no parsed result (confirmation or clarification) */}
      {error && !confirmation && !clarification && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
