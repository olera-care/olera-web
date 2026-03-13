"use client";

import { useState, useCallback, useRef, useEffect } from "react";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface UseSpeechSynthesisReturn {
  /** Whether TTS is currently speaking */
  isSpeaking: boolean;
  /** Whether the Web Speech Synthesis API is available */
  available: boolean;
  /** Speak the given text. Cancels any in-progress utterance. */
  speak: (text: string, onDone?: () => void) => void;
  /** Stop speaking immediately */
  stop: () => void;
}

// ─── Voice selection ────────────────────────────────────────────────────────

/** Pick the best English voice available — prefer natural/premium voices. */
function pickVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  const english = voices.filter((v) => v.lang.startsWith("en"));
  if (english.length === 0) return null;

  // Prefer Google or premium voices (they sound more natural)
  const preferred = [
    "Google US English",
    "Samantha",
    "Karen",
    "Daniel",
    "Zoe",
    "Allison",
  ];

  for (const name of preferred) {
    const match = english.find((v) => v.name.includes(name));
    if (match) return match;
  }

  // Fallback: first local English voice (non-remote tends to be lower latency)
  return english.find((v) => v.localService) ?? english[0];
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useSpeechSynthesis(): UseSpeechSynthesisReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [available, setAvailable] = useState(false);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const onDoneRef = useRef<(() => void) | null>(null);

  // Detect availability and load voices
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    setAvailable(true);

    // Voices may load asynchronously (Chrome does this)
    const loadVoice = () => {
      voiceRef.current = pickVoice();
    };

    loadVoice();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoice);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", loadVoice);
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speak = useCallback((text: string, onDone?: () => void) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    // Cancel anything in progress
    window.speechSynthesis.cancel();
    onDoneRef.current = onDone ?? null;

    const utterance = new SpeechSynthesisUtterance(text);
    if (voiceRef.current) utterance.voice = voiceRef.current;
    utterance.lang = "en-US";
    utterance.rate = 0.95; // Slightly slower for clarity
    utterance.pitch = 1.02; // Slight warmth (matches iOS)

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      onDoneRef.current?.();
      onDoneRef.current = null;
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      // Still fire callback — don't leave the flow stuck
      onDoneRef.current?.();
      onDoneRef.current = null;
    };

    window.speechSynthesis.speak(utterance);
  }, []);

  const stop = useCallback(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    onDoneRef.current = null;
  }, []);

  return { isSpeaking, available, speak, stop };
}
