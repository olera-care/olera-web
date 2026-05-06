"use client";

/**
 * Shared client-side hook that resolves which intake A/B arm a session
 * belongs to. Single source of truth — both IntakeVariantSlots (the
 * SBF/outreach surface gates) and QASectionV2 (the qa_email_capture
 * enrichment treatment) call this so they always agree on which arm
 * the visitor is in.
 *
 * Without a shared hook, two components calling assignIntakeVariant
 * directly would drift apart the moment one was wired to the weighted
 * dial and the other wasn't — leading to a split-brain where the dial
 * shuts off an arm on one surface but not the other.
 *
 * Resolution sequence:
 *   1. Render. Returns `null` (variant unknown).
 *   2. Effect runs. Fetches /api/variant-weights/intake (CDN-cached
 *      ~30s, see app/api/variant-weights/intake/route.ts).
 *   3. Hashes the session id with the version namespace, walks the
 *      weighted-bucket assignment, returns the picked arm.
 *
 * Components that mount eagerly during SSR (e.g. BenefitsArmGate,
 * which renders children before the variant resolves) should treat
 * `null` as "unknown — don't take action yet" and only hide/swap on
 * a concrete arm value.
 */

import { useEffect, useState } from "react";
import { getOrCreateSessionId } from "@/lib/analytics/session";
import {
  assignIntakeVariantWeighted,
  INTAKE_VARIANT_DEFAULT_WEIGHTS,
  type IntakeVariant,
  type IntakeWeightMap,
} from "@/lib/analytics/variant";

// Module-level cache so a single page render with multiple consumers
// (BenefitsArmGate + AgentOutreachSlot + QASectionV2) only fetches
// weights once. Persists across client-side navigations — weights
// don't change per route, and a stale 30s-old value across a nav is
// harmless. Reset on hard reload.
let weightsPromise: Promise<{ weights: IntakeWeightMap; version: number }> | null = null;

function fetchWeights(): Promise<{ weights: IntakeWeightMap; version: number }> {
  if (weightsPromise) return weightsPromise;
  // Default fetch cache mode — we want the CDN's s-maxage=30 to actually
  // serve cached responses. `no-store` would bypass the CDN cache and
  // hammer the origin on every provider page hit.
  weightsPromise = fetch("/api/variant-weights/intake")
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => {
      if (!data || typeof data !== "object") {
        return { weights: INTAKE_VARIANT_DEFAULT_WEIGHTS, version: 0 };
      }
      return {
        weights: (data.weights as IntakeWeightMap) ?? INTAKE_VARIANT_DEFAULT_WEIGHTS,
        version: typeof data.version === "number" ? data.version : 0,
      };
    })
    .catch(() => ({
      weights: INTAKE_VARIANT_DEFAULT_WEIGHTS,
      version: 0,
    }));
  return weightsPromise;
}

/**
 * Returns the intake variant assigned to the current session, or
 * `null` while the weights fetch is pending. Stable across re-renders
 * once resolved; stable across components within the same page load
 * (module-level promise cache).
 */
export function useIntakeVariant(): IntakeVariant | null {
  const [variant, setVariant] = useState<IntakeVariant | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetchWeights().then(({ weights, version }) => {
      if (cancelled) return;
      setVariant(assignIntakeVariantWeighted(getOrCreateSessionId(), weights, version));
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return variant;
}
