"use client";

import { useState, useCallback, useRef, useEffect } from "react";

// ─── Types ──────────────────────────────────────────────────────────────────

export type SpeechEngine = "web-speech-api" | "deepgram" | "none";

export type PermissionState = "prompt" | "granted" | "denied" | "unavailable";

export interface UseSpeechRecognitionOptions {
  /** Language for recognition (default: "en-US") */
  lang?: string;
  /** Auto-stop after this many ms of silence (default: 10000) */
  silenceTimeout?: number;
}

export interface UseSpeechRecognitionReturn {
  /** Current transcript (interim + final combined) */
  transcript: string;
  /** Only the final (committed) portion of the transcript */
  finalTranscript: string;
  /** Whether actively listening */
  isListening: boolean;
  /** Which speech engine is available */
  engine: SpeechEngine;
  /** Microphone permission state */
  permissionState: PermissionState;
  /** Start listening */
  start: () => void;
  /** Stop listening */
  stop: () => void;
  /** Clear transcript */
  reset: () => void;
  /** Last error message, if any */
  error: string | null;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function getSpeechEngine(): SpeechEngine {
  if (typeof window === "undefined") return "none";
  if (window.SpeechRecognition || window.webkitSpeechRecognition) {
    return "web-speech-api";
  }
  // Deepgram fallback will be added in Phase 5
  return "none";
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions = {}
): UseSpeechRecognitionReturn {
  const { lang = "en-US", silenceTimeout = 10_000 } = options;

  const [transcript, setTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [engine, setEngine] = useState<SpeechEngine>("none");
  const [permissionState, setPermissionState] = useState<PermissionState>("prompt");
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stoppingRef = useRef(false);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hadResultsRef = useRef(false);

  // Detect engine on mount
  useEffect(() => {
    setEngine(getSpeechEngine());
  }, []);

  // Check permission state on mount (if supported)
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.permissions) return;
    navigator.permissions
      .query({ name: "microphone" as PermissionName })
      .then((status) => {
        setPermissionState(status.state as PermissionState);
        status.onchange = () => {
          setPermissionState(status.state as PermissionState);
        };
      })
      .catch(() => {
        // permissions.query not supported for microphone in some browsers
      });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }
    };
  }, []);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const startSilenceTimer = useCallback(() => {
    clearSilenceTimer();
    silenceTimerRef.current = setTimeout(() => {
      // Auto-stop after silence
      if (recognitionRef.current && !stoppingRef.current) {
        stoppingRef.current = true;
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    }, silenceTimeout);
  }, [silenceTimeout, clearSilenceTimer]);

  const start = useCallback(() => {
    setError(null);

    // Clear any pending retry
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    retryCountRef.current = 0;
    hadResultsRef.current = false;

    const currentEngine = getSpeechEngine();
    if (currentEngine === "none") {
      setError("Speech recognition is not supported in this browser.");
      setPermissionState("unavailable");
      return;
    }

    // Abort any existing session
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // ignore
      }
    }

    const SpeechRecognitionCtor =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionCtor();

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = lang;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      stoppingRef.current = false;
      setIsListening(true);
      setPermissionState("granted");
      startSilenceTimer();
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      hadResultsRef.current = true;
      let interim = "";
      let final = "";

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      setFinalTranscript(final);
      setTranscript(final + interim);

      // Reset silence timer on new speech
      if (interim || final) {
        startSilenceTimer();
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      clearSilenceTimer();

      switch (event.error) {
        case "not-allowed":
          setPermissionState("denied");
          setError("Microphone access was blocked. You can enable it in your browser settings.");
          break;
        case "no-speech":
          // Not a real error — user just didn't speak. Silence timeout handles this.
          break;
        case "audio-capture":
          // If we already captured speech, suppress — we got what we needed
          if (hadResultsRef.current) break;
          // Auto-retry once after a short delay (browser needs time to release mic)
          if (retryCountRef.current < 1) {
            retryCountRef.current++;
            retryTimerRef.current = setTimeout(() => start(), 500);
            return; // Skip setIsListening(false) — onend will handle it
          }
          setError("Microphone is busy or unavailable. Close other apps using the mic and try again.");
          break;
        case "network":
          setError("Network error during speech recognition. Check your connection.");
          break;
        case "aborted":
          // Intentional abort — not an error
          break;
        default:
          setError("Speech recognition error. Please try again.");
      }

      setIsListening(false);
    };

    recognition.onend = () => {
      clearSilenceTimer();
      stoppingRef.current = false;
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (err) {
      setError("Failed to start speech recognition. Please try again.");
      setIsListening(false);
    }
  }, [lang, startSilenceTimer, clearSilenceTimer]);

  const stop = useCallback(() => {
    clearSilenceTimer();
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    if (recognitionRef.current && !stoppingRef.current) {
      stoppingRef.current = true;
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
  }, [clearSilenceTimer]);

  const reset = useCallback(() => {
    setTranscript("");
    setFinalTranscript("");
    setError(null);
  }, []);

  return {
    transcript,
    finalTranscript,
    isListening,
    engine,
    permissionState,
    start,
    stop,
    reset,
    error,
  };
}
