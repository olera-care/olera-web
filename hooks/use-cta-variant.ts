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
 *   1. Render. Reads cached variant from localStorage (instant, no flash).
 *   2. Effect runs. Fetches /api/variant-weights/cta (CDN-cached ~30s).
 *   3. Compares version — if changed, re-resolves variant and updates cache.
 *   4. On first visit (no cache), resolves and caches variant.
 *
 * This eliminates the flash on return visits since localStorage is
 * synchronous and read during initial render.
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

// localStorage key for cached variant (includes version for invalidation)
const CTA_CACHE_KEY = "olera_cta_variant";
const CTA_VERSION_KEY = "olera_cta_version";

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
 * Read cached variant from localStorage (synchronous, no flash).
 * Returns null if no cache or invalid.
 */
function getCachedVariant(): CTAVariant | null {
  if (typeof window === "undefined") return null;
  try {
    const cached = localStorage.getItem(CTA_CACHE_KEY);
    if (cached && (CTA_VARIANTS as readonly string[]).includes(cached)) {
      return cached as CTAVariant;
    }
  } catch {
    // localStorage blocked or unavailable
  }
  return null;
}

/**
 * Get cached version number for invalidation check.
 */
function getCachedVersion(): number {
  if (typeof window === "undefined") return -1;
  try {
    const v = localStorage.getItem(CTA_VERSION_KEY);
    return v ? parseInt(v, 10) : -1;
  } catch {
    return -1;
  }
}

/**
 * Cache the resolved variant and version.
 */
function setCachedVariant(variant: CTAVariant, version: number): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CTA_CACHE_KEY, variant);
    localStorage.setItem(CTA_VERSION_KEY, String(version));
  } catch {
    // localStorage blocked or full
  }
}

/**
 * Returns the CTA variant assigned to the current session.
 *
 * On first visit: Returns null briefly while fetching, then caches result.
 * On return visits: Returns cached variant immediately (no flash), then
 * validates in background and updates if version changed.
 */
export function useCTAVariant(): CTAVariant | null {
  // Initialize with cached value to prevent flash on return visits
  const [variant, setVariant] = useState<CTAVariant | null>(() => {
    // Preview mode takes precedence
    const previewArm = getCTAPreviewArm();
    if (previewArm) return previewArm;
    // Return cached variant (or null on first visit)
    return getCachedVariant();
  });

  useEffect(() => {
    // Preview mode already handled in useState initializer
    if (isCTAPreviewMode()) return;

    let cancelled = false;
    fetchWeights().then(({ weights, version }) => {
      if (cancelled) return;

      const cachedVersion = getCachedVersion();
      const cachedVariant = getCachedVariant();

      // If version changed or no cache, resolve and cache new variant
      if (version !== cachedVersion || !cachedVariant) {
        const newVariant = assignCTAVariantWeighted(getOrCreateSessionId(), weights, version);
        setCachedVariant(newVariant, version);
        setVariant(newVariant);
      }
      // If version matches and we have cache, variant is already set from useState init
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return variant;
}
