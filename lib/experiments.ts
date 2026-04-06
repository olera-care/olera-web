/**
 * CTA Experiment Infrastructure
 *
 * Cookie-based A/B testing for provider detail page CTAs.
 * Assigns visitors to variants, tracks impressions, and attributes connections.
 */

import { createClient } from "@/lib/supabase/client";

// ─── Types ───────────────────────────────────────────────────

export interface VariantConfig {
  headline: string;
  buttonText: string;
  trustLine: string;
  fields: ("email" | "phone" | "name" | "message")[];
  postSubmitFlow: "pricing" | "eligibility" | "availability" | "matches" | "basic";
}

export interface ExperimentVariant {
  id: string;
  experiment_id: string;
  name: string;
  config: VariantConfig;
  weight: number;
}

export interface Experiment {
  id: string;
  name: string;
  status: string;
  variants: ExperimentVariant[];
}

export interface ExperimentAssignment {
  experimentId: string;
  variantId: string;
}

// ─── Constants ───────────────────────────────────────────────

export const EXPERIMENT_COOKIE = "olera_exp";
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

// ─── Default variant (used when no experiment is active) ─────

export const DEFAULT_VARIANT_CONFIG: VariantConfig = {
  headline: "What does this cost?",
  buttonText: "Check cost & availability",
  trustLine: "No spam. No sales calls.",
  fields: ["email"],
  postSubmitFlow: "pricing",
};

// ─── Cache ───────────────────────────────────────────────────

let cachedExperiment: Experiment | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// ─── Core Functions ──────────────────────────────────────────

/**
 * Fetch the active experiment with its variants.
 * Returns null if no experiment is active.
 * Caches for 5 minutes to avoid hammering Supabase.
 */
export async function getActiveExperiment(): Promise<Experiment | null> {
  const now = Date.now();
  if (cachedExperiment && now - cacheTimestamp < CACHE_TTL) {
    return cachedExperiment;
  }

  const supabase = createClient();

  const { data: experiments, error: expError } = await supabase
    .from("experiments")
    .select("id, name, status")
    .eq("status", "active")
    .limit(1);

  if (expError || !experiments?.length) {
    cachedExperiment = null;
    cacheTimestamp = now;
    return null;
  }

  const exp = experiments[0];

  const { data: variants, error: varError } = await supabase
    .from("experiment_variants")
    .select("id, experiment_id, name, config, weight")
    .eq("experiment_id", exp.id)
    .gt("weight", 0)
    .order("created_at", { ascending: true });

  if (varError || !variants?.length) {
    cachedExperiment = null;
    cacheTimestamp = now;
    return null;
  }

  cachedExperiment = {
    id: exp.id,
    name: exp.name,
    status: exp.status,
    variants: variants as ExperimentVariant[],
  };
  cacheTimestamp = now;
  return cachedExperiment;
}

/**
 * Weighted random variant selection.
 * Weights don't need to sum to 100 — they're normalized internally.
 */
export function pickVariant(variants: ExperimentVariant[]): ExperimentVariant {
  const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
  let random = Math.random() * totalWeight;

  for (const variant of variants) {
    random -= variant.weight;
    if (random <= 0) return variant;
  }

  // Fallback (shouldn't happen)
  return variants[0];
}

/**
 * Read experiment assignment from cookie string.
 * Cookie format: `experimentId:variantId`
 */
export function parseAssignmentCookie(
  cookieValue: string | undefined
): ExperimentAssignment | null {
  if (!cookieValue) return null;
  const parts = cookieValue.split(":");
  if (parts.length !== 2) return null;
  return { experimentId: parts[0], variantId: parts[1] };
}

/**
 * Serialize assignment to cookie value.
 */
export function serializeAssignment(assignment: ExperimentAssignment): string {
  return `${assignment.experimentId}:${assignment.variantId}`;
}

/**
 * Get cookie options for the experiment cookie.
 */
export function getAssignmentCookieOptions() {
  return {
    maxAge: COOKIE_MAX_AGE,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    httpOnly: false, // Needs to be readable by client JS
  };
}

/**
 * Resolve the variant for a visitor.
 * 1. Check cookie for existing assignment
 * 2. Validate it matches the active experiment
 * 3. If no valid assignment, pick a new variant
 *
 * Returns { variant, assignment, isNew } where isNew=true means cookie needs to be set.
 */
export async function resolveVariant(
  cookieValue: string | undefined
): Promise<{
  variant: ExperimentVariant | null;
  config: VariantConfig;
  assignment: ExperimentAssignment | null;
  isNew: boolean;
}> {
  const experiment = await getActiveExperiment();

  // No active experiment — use default
  if (!experiment) {
    return {
      variant: null,
      config: DEFAULT_VARIANT_CONFIG,
      assignment: null,
      isNew: false,
    };
  }

  // Check existing cookie
  const existing = parseAssignmentCookie(cookieValue);
  if (existing && existing.experimentId === experiment.id) {
    const matchedVariant = experiment.variants.find(
      (v) => v.id === existing.variantId
    );
    if (matchedVariant) {
      return {
        variant: matchedVariant,
        config: matchedVariant.config,
        assignment: existing,
        isNew: false,
      };
    }
  }

  // Assign new variant
  const variant = pickVariant(experiment.variants);
  const assignment: ExperimentAssignment = {
    experimentId: experiment.id,
    variantId: variant.id,
  };

  return {
    variant,
    config: variant.config,
    assignment,
    isNew: true,
  };
}

// ─── Impression Tracking ─────────────────────────────────────

/**
 * Fire-and-forget impression tracking.
 * Called on CTA component mount. Non-blocking.
 */
export function trackImpression(variantId: string): void {
  fetch("/api/experiments/impression", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ variantId }),
  }).catch(() => {
    // Silent fail — impressions are best-effort
  });
}

// ─── Stats Helpers (for admin dashboard) ─────────────────────

/**
 * Calculate z-score for two proportions (conversion rates).
 * Used to determine statistical significance.
 */
export function calculateZScore(
  conversionsA: number,
  impressionsA: number,
  conversionsB: number,
  impressionsB: number
): { zScore: number; pValue: number; significant: boolean } {
  if (impressionsA === 0 || impressionsB === 0) {
    return { zScore: 0, pValue: 1, significant: false };
  }

  const pA = conversionsA / impressionsA;
  const pB = conversionsB / impressionsB;
  const pPooled =
    (conversionsA + conversionsB) / (impressionsA + impressionsB);
  const se = Math.sqrt(
    pPooled * (1 - pPooled) * (1 / impressionsA + 1 / impressionsB)
  );

  if (se === 0) return { zScore: 0, pValue: 1, significant: false };

  const z = (pA - pB) / se;

  // Approximate two-tailed p-value from z-score
  const absZ = Math.abs(z);
  const pValue = Math.exp(-0.5 * absZ * absZ) / Math.sqrt(2 * Math.PI);
  const twoTailedP = 2 * pValue;

  return {
    zScore: z,
    pValue: twoTailedP,
    significant: twoTailedP < 0.05,
  };
}
