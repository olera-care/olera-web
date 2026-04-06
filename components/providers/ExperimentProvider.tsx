"use client";

import { useEffect, useState } from "react";
import {
  resolveVariant,
  serializeAssignment,
  EXPERIMENT_COOKIE,
  DEFAULT_VARIANT_CONFIG,
  type VariantConfig,
} from "@/lib/experiments";

function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

function setCookie(name: string, value: string, maxAge: number) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
}

interface ExperimentState {
  config: VariantConfig;
  variantId: string | undefined;
  ready: boolean;
}

/**
 * Hook that resolves the CTA experiment variant for the current visitor.
 * Reads/writes the `olera_exp` cookie to persist assignment.
 *
 * Returns DEFAULT_VARIANT_CONFIG immediately (no flash) — updates if
 * an active experiment assigns a different variant.
 */
export function useExperiment(): ExperimentState {
  const [state, setState] = useState<ExperimentState>({
    config: DEFAULT_VARIANT_CONFIG,
    variantId: undefined,
    ready: false,
  });

  useEffect(() => {
    let cancelled = false;

    async function resolve() {
      const cookieValue = getCookie(EXPERIMENT_COOKIE);
      const result = await resolveVariant(cookieValue);

      if (cancelled) return;

      // Set cookie if new assignment
      if (result.isNew && result.assignment) {
        setCookie(
          EXPERIMENT_COOKIE,
          serializeAssignment(result.assignment),
          30 * 24 * 60 * 60
        );
      }

      setState({
        config: result.config,
        variantId: result.variant?.id,
        ready: true,
      });
    }

    resolve();
    return () => { cancelled = true; };
  }, []);

  return state;
}
