"use client";

/**
 * Which program-card flow arm this visitor is in (control | three_tap).
 *
 * Resolution: a `?card_flow=<arm>` query param forces the arm (previews and
 * QA); otherwise the live weights from /api/variant-weights/program-card are
 * hashed with the olera session id, so the arm is sticky per visitor for as
 * long as the session cookie lives and reshuffles only when the dial's
 * version changes.
 *
 * Returns null until resolved. Both arms render the same capture step, so a
 * null arm never shows the visitor anything different; the page waits for a
 * resolved arm before firing its card-view event so every view is tagged.
 * No localStorage cache (unlike the mobile nav hook): there is no first-paint
 * difference to protect, and the hash is already deterministic.
 */

import { useEffect, useState } from "react";
import { getOrCreateSessionId } from "@/lib/analytics/session";
import {
  assignProgramCardFlowWeighted,
  isProgramCardFlow,
  PROGRAM_CARD_FLOW_DEFAULT_WEIGHTS,
  PROGRAM_CARD_FLOW_PARAM,
  type ProgramCardFlow,
  type ProgramCardFlowWeightMap,
} from "@/lib/analytics/program-card-variant";

/** The forced arm from the URL, or null. SSR-safe. */
export function getForcedProgramCardFlow(): ProgramCardFlow | null {
  if (typeof window === "undefined") return null;
  const raw = new URLSearchParams(window.location.search).get(PROGRAM_CARD_FLOW_PARAM);
  return isProgramCardFlow(raw) ? raw : null;
}

let weightsPromise: Promise<{ weights: ProgramCardFlowWeightMap; version: number }> | null = null;

function fetchWeights(): Promise<{ weights: ProgramCardFlowWeightMap; version: number }> {
  if (weightsPromise) return weightsPromise;
  weightsPromise = fetch("/api/variant-weights/program-card")
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => {
      if (!data || typeof data !== "object") {
        return { weights: PROGRAM_CARD_FLOW_DEFAULT_WEIGHTS, version: 0 };
      }
      return {
        weights: (data.weights as ProgramCardFlowWeightMap) ?? PROGRAM_CARD_FLOW_DEFAULT_WEIGHTS,
        version: typeof data.version === "number" ? data.version : 0,
      };
    })
    .catch(() => ({ weights: PROGRAM_CARD_FLOW_DEFAULT_WEIGHTS, version: 0 }));
  return weightsPromise;
}

export function useProgramCardFlow(enabled = true): ProgramCardFlow | null {
  const [flow, setFlow] = useState<ProgramCardFlow | null>(null);
  useEffect(() => {
    if (!enabled) return;
    const forced = getForcedProgramCardFlow();
    if (forced) {
      setFlow(forced);
      return;
    }
    let cancelled = false;
    const sessionId = getOrCreateSessionId();
    fetchWeights().then(({ weights, version }) => {
      if (!cancelled) setFlow(assignProgramCardFlowWeighted(sessionId, weights, version));
    });
    return () => {
      cancelled = true;
    };
  }, [enabled]);
  return flow;
}
