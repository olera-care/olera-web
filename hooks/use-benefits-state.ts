"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type {
  BenefitsIntakeAnswers,
  BenefitsSearchResult,
  IntakeStep,
} from "@/lib/types/benefits";
import { createEmptyIntakeAnswers } from "@/lib/types/benefits";

// ─── Types ──────────────────────────────────────────────────────────────────

export type PageState = "intake" | "loading" | "results" | "error";

export interface BenefitsState {
  answers: BenefitsIntakeAnswers;
  step: IntakeStep;
  pageState: PageState;
  result: BenefitsSearchResult | null;
  errorMsg: string | null;
  /** Display string for location input (e.g. "Austin, TX" or "78701") */
  locationDisplay: string;
  /** Live preview of how many programs may match (null = not enough data yet) */
  previewCount: number | null;
}

export interface BenefitsActions {
  updateAnswers: (partial: Partial<BenefitsIntakeAnswers>) => void;
  setLocationDisplay: (display: string) => void;
  goToStep: (step: IntakeStep) => void;
  submit: () => Promise<void>;
  reset: () => void;
}

// ─── localStorage ───────────────────────────────────────────────────────────

const STORAGE_KEY = "olera-benefits-draft";

interface StoredDraft {
  answers: BenefitsIntakeAnswers;
  locationDisplay: string;
  step: IntakeStep;
  savedAt: number;
}

/** Max age for stored draft: 24 hours */
const MAX_DRAFT_AGE_MS = 24 * 60 * 60 * 1000;

function loadDraft(): StoredDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const draft: StoredDraft = JSON.parse(raw);
    if (Date.now() - draft.savedAt > MAX_DRAFT_AGE_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return draft;
  } catch {
    return null;
  }
}

function saveDraft(answers: BenefitsIntakeAnswers, locationDisplay: string, step: IntakeStep) {
  if (typeof window === "undefined") return;
  try {
    const draft: StoredDraft = { answers, locationDisplay, step, savedAt: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // Storage full or unavailable — silently ignore
  }
}

function clearDraft() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Silently ignore
  }
}

// ─── Hook ───────────────────────────────────────────────────────────────────

/** Debounce delay for live preview API calls */
const PREVIEW_DEBOUNCE_MS = 800;

export function useBenefitsState(): BenefitsState & BenefitsActions {
  const [answers, setAnswers] = useState<BenefitsIntakeAnswers>(createEmptyIntakeAnswers);
  const [step, setStep] = useState<IntakeStep>(0);
  const [pageState, setPageState] = useState<PageState>("intake");
  const [result, setResult] = useState<BenefitsSearchResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [locationDisplay, setLocationDisplay] = useState("");
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const initialized = useRef(false);
  const previewAbort = useRef<AbortController | null>(null);

  // ── Restore draft on mount ─────────────────────────────────────────────
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const draft = loadDraft();
    if (draft) {
      setAnswers(draft.answers);
      setLocationDisplay(draft.locationDisplay);
      setStep(draft.step);
    }
  }, []);

  // ── Persist draft on change ────────────────────────────────────────────
  useEffect(() => {
    if (!initialized.current) return;
    if (pageState === "intake") {
      saveDraft(answers, locationDisplay, step);
    }
  }, [answers, locationDisplay, step, pageState]);

  // ── Live eligibility preview (debounced) ─────────────────────────────
  useEffect(() => {
    // Only preview during intake and when we have at least a state code
    if (pageState !== "intake" || !answers.stateCode) {
      setPreviewCount(null);
      return;
    }

    const timer = setTimeout(() => {
      // Cancel any in-flight preview request
      previewAbort.current?.abort();
      const controller = new AbortController();
      previewAbort.current = controller;

      fetch("/api/benefits/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(answers),
        signal: controller.signal,
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data: BenefitsSearchResult | null) => {
          if (data && !controller.signal.aborted) {
            setPreviewCount(data.matchedPrograms.length);
          }
        })
        .catch(() => {
          // Aborted or network error — ignore silently
        });
    }, PREVIEW_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      previewAbort.current?.abort();
    };
  }, [answers, pageState]);

  // ── Actions ────────────────────────────────────────────────────────────

  const updateAnswers = useCallback((partial: Partial<BenefitsIntakeAnswers>) => {
    setAnswers((prev) => ({ ...prev, ...partial }));
  }, []);

  const goToStep = useCallback((target: IntakeStep) => {
    setStep(target);
    if (pageState !== "intake") {
      setPageState("intake");
    }
  }, [pageState]);

  const submit = useCallback(async () => {
    setPageState("loading");
    setErrorMsg(null);

    try {
      const res = await fetch("/api/benefits/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(answers),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Something went wrong");
      }

      const data: BenefitsSearchResult = await res.json();
      setResult(data);
      setPageState("results");
      clearDraft();
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Failed to find matching programs"
      );
      setPageState("error");
    }
  }, [answers]);

  const reset = useCallback(() => {
    setAnswers(createEmptyIntakeAnswers());
    setLocationDisplay("");
    setStep(0);
    setResult(null);
    setErrorMsg(null);
    setPreviewCount(null);
    setPageState("intake");
    clearDraft();
  }, []);

  return {
    // State
    answers,
    step,
    pageState,
    result,
    errorMsg,
    locationDisplay,
    previewCount,
    // Actions
    updateAnswers,
    setLocationDisplay,
    goToStep,
    submit,
    reset,
  };
}
