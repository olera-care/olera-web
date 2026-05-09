"use client";

/**
 * Shared client-side hook that resolves which CTA A/B arm a session
 * belongs to. Single source of truth — both DesktopCTAVariantRouter and
 * MobileCTAVariantRouter call this so they always agree on which arm
 * the visitor is in.
 *
 * Without a shared hook, two components calling assignCTAVariant
 * directly would drift apart the moment one was wired to the weighted
 * dial and the other wasn't — leading to a split-brain where the dial
 * shuts off an arm on one surface but not the other.
 *
 * Resolution sequence:
 *   1. Render. Returns `null` (variant unknown).
 *   2. Effect runs. Fetches /api/variant-weights/cta (CDN-cached
 *      ~30s, see app/api/variant-weights/cta/route.ts).
 *   3. Hashes the session id with the version namespace, walks the
 *      weighted-bucket assignment, returns the picked arm.
 *
 * Components that mount eagerly during SSR should treat `null` as
 * "unknown — don't take action yet" and only hide/swap on a concrete
 * arm value.
 */

import { useEffect, useState } from "react";
import { getOrCreateSessionId } from "@/lib/analytics/session";
import {
  assignCTAVariantWeighted,
  CTA_VARIANT_DEFAULT_WEIGHTS,
  type CTAVariant,
  type CTAWeightMap,
} from "@/lib/analytics/cta-variant";

// Preview mode support for CTA variants
const CTA_PREVIEW_PARAM = "preview_cta";
import { CTA_VARIANTS } from "@/lib/analytics/cta-variant";

function getCTAPreviewArm(): CTAVariant | null {
  if (typeof window === "undefined") return null;
  const raw = new URLSearchParams(window.location.search).get(CTA_PREVIEW_PARAM);
  if (!raw) return null;
  return (CTA_VARIANTS as readonly string[]).includes(raw)
    ? (raw as CTAVariant)
    : null;
}

export function isCTAPreviewMode(): boolean {
  return getCTAPreviewArm() !== null;
}

// Module-level cache so a single page render with multiple consumers
// (DesktopCTAVariantRouter + MobileCTAVariantRouter) only fetches
// weights once. Persists across client-side navigations — weights
// don't change per route, and a stale 30s-old value across a nav is
// harmless. Reset on hard reload.
let weightsPromise: Promise<{ weights: CTAWeightMap; version: number }> | null = null;

function fetchWeights(): Promise<{ weights: CTAWeightMap; version: number }> {
  if (weightsPromise) return weightsPromise;
  // Default fetch cache mode — we want the CDN's s-maxage=30 to actually
  // serve cached responses. `no-store` would bypass the CDN cache and
  // hammer the origin on every provider page hit.
  weightsPromise = fetch("/api/variant-weights/cta")
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => {
      if (!data || typeof data !== "object") {
        return { weights: CTA_VARIANT_DEFAULT_WEIGHTS, version: 0 };
      }
      return {
        weights: (data.weights as CTAWeightMap) ?? CTA_VARIANT_DEFAULT_WEIGHTS,
        version: typeof data.version === "number" ? data.version : 0,
      };
    })
    .catch(() => ({
      weights: CTA_VARIANT_DEFAULT_WEIGHTS,
      version: 0,
    }));
  return weightsPromise;
}

/**
 * Returns the CTA variant assigned to the current session, or `null`
 * while the weights fetch is pending. Stable across re-renders once
 * resolved; stable across components within the same page load
 * (module-level promise cache).
 */
export function useCTAVariant(): CTAVariant | null {
  const [variant, setVariant] = useState<CTAVariant | null>(null);
  useEffect(() => {
    // Admin preview override — bypasses the weights fetch entirely.
    // Components downstream check isCTAPreviewMode() to suppress event
    // firing, so the override never contaminates the A/B funnel.
    const previewArm = getCTAPreviewArm();
    if (previewArm) {
      setVariant(previewArm);
      return;
    }
    let cancelled = false;
    fetchWeights().then(({ weights, version }) => {
      if (cancelled) return;
      setVariant(assignCTAVariantWeighted(getOrCreateSessionId(), weights, version));
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return variant;
}
