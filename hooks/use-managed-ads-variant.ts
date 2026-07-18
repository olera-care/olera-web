"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import {
  assignManagedAdsVariantWeighted,
  MANAGED_ADS_VARIANT_DEFAULT_WEIGHTS,
  MANAGED_ADS_VARIANTS,
  type ManagedAdsVariant,
  type ManagedAdsWeightMap,
} from "@/lib/analytics/managed-ads-variant";

const PREVIEW_PARAM = "preview_managed_ads";
const CACHE_PREFIX = "olera_managed_ads_variant";

let weightsPromise: Promise<{ weights: ManagedAdsWeightMap; version: number }> | null = null;

function getPreviewArm(): ManagedAdsVariant | null {
  if (typeof window === "undefined") return null;
  const raw = new URLSearchParams(window.location.search).get(PREVIEW_PARAM);
  if (!raw) return null;
  return (MANAGED_ADS_VARIANTS as readonly string[]).includes(raw)
    ? (raw as ManagedAdsVariant)
    : null;
}

export function isManagedAdsPreviewMode(): boolean {
  return getPreviewArm() !== null;
}

function fetchWeights(): Promise<{ weights: ManagedAdsWeightMap; version: number }> {
  if (weightsPromise) return weightsPromise;
  weightsPromise = fetch("/api/variant-weights/managed-ads")
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => {
      if (!data || typeof data !== "object") {
        return { weights: MANAGED_ADS_VARIANT_DEFAULT_WEIGHTS, version: 0 };
      }
      return {
        weights: (data.weights as ManagedAdsWeightMap) ?? MANAGED_ADS_VARIANT_DEFAULT_WEIGHTS,
        version: typeof data.version === "number" ? data.version : 0,
      };
    })
    .catch(() => ({
      weights: MANAGED_ADS_VARIANT_DEFAULT_WEIGHTS,
      version: 0,
    }));
  return weightsPromise;
}

function cacheKey(providerKey: string): string {
  return `${CACHE_PREFIX}:${providerKey}`;
}

function getCached(providerKey: string): { variant: ManagedAdsVariant; version: number } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(cacheKey(providerKey));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { variant?: unknown; version?: unknown };
    if (
      typeof parsed.variant === "string" &&
      (MANAGED_ADS_VARIANTS as readonly string[]).includes(parsed.variant) &&
      typeof parsed.version === "number"
    ) {
      return { variant: parsed.variant as ManagedAdsVariant, version: parsed.version };
    }
  } catch {
    // localStorage blocked or malformed cache
  }
  return null;
}

function setCached(providerKey: string, variant: ManagedAdsVariant, version: number): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(cacheKey(providerKey), JSON.stringify({ variant, version }));
  } catch {
    // localStorage blocked or full
  }
}

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function useManagedAdsVariant(providerKey?: string | null): ManagedAdsVariant | null {
  const [variant, setVariant] = useState<ManagedAdsVariant | null>(null);

  useIsomorphicLayoutEffect(() => {
    const preview = getPreviewArm();
    if (preview) {
      setVariant(preview);
      return;
    }
    if (!providerKey) return;
    const cached = getCached(providerKey);
    if (cached) setVariant(cached.variant);
  }, [providerKey]);

  useEffect(() => {
    if (!providerKey || isManagedAdsPreviewMode()) return;
    let cancelled = false;
    fetchWeights().then(({ weights, version }) => {
      if (cancelled) return;
      const cached = getCached(providerKey);
      if (!cached || cached.version !== version) {
        const next = assignManagedAdsVariantWeighted(providerKey, weights, version);
        setCached(providerKey, next, version);
        setVariant(next);
      } else {
        setVariant(cached.variant);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [providerKey]);

  return variant;
}
