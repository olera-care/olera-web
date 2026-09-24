// Server-side reader/writer for the program card flow experiment's row in
// experiment_weights. Same pattern as mobile-nav-variant-weights.ts: the
// public /api/variant-weights/program-card route serves the live dial with a
// short CDN cache, and /api/admin/analytics/program-card-variant-weights
// writes it. A missing row serves the 50/50 default, so no migration is
// needed to launch.

import { getServiceClient } from "@/lib/admin";
import {
  PROGRAM_CARD_FLOW_DEFAULT_WEIGHTS,
  PROGRAM_CARD_FLOWS,
  type ProgramCardFlow,
} from "./program-card-variant";

export const PROGRAM_CARD_EXPERIMENT_ID = "program_card_flow";

export type ProgramCardWeightsRecord = {
  weights: Record<ProgramCardFlow, number>;
  version: number;
};

function emptyWeightShape(): Record<ProgramCardFlow, number> {
  return Object.fromEntries(PROGRAM_CARD_FLOWS.map((v) => [v, 0])) as Record<ProgramCardFlow, number>;
}

function coerceWeights(raw: unknown): Record<ProgramCardFlow, number> {
  if (!raw || typeof raw !== "object") return { ...PROGRAM_CARD_FLOW_DEFAULT_WEIGHTS };
  const out = emptyWeightShape();
  const obj = raw as Record<string, unknown>;
  for (const v of PROGRAM_CARD_FLOWS) {
    const n = obj[v];
    if (typeof n === "number" && Number.isFinite(n) && n >= 0) out[v] = Math.round(n);
  }
  return out;
}

/** Live weights; the 50/50 default (version 0) when the row is missing or
 *  unreadable. */
export async function getProgramCardVariantWeights(): Promise<ProgramCardWeightsRecord> {
  try {
    const db = getServiceClient();
    const { data, error } = await db
      .from("experiment_weights")
      .select("weights, version")
      .eq("experiment_id", PROGRAM_CARD_EXPERIMENT_ID)
      .maybeSingle();
    if (error) {
      console.warn("[program-card-variant-weights] read returned error, serving defaults:", error.message);
      return { weights: { ...PROGRAM_CARD_FLOW_DEFAULT_WEIGHTS }, version: 0 };
    }
    if (!data) return { weights: { ...PROGRAM_CARD_FLOW_DEFAULT_WEIGHTS }, version: 0 };
    return {
      weights: coerceWeights(data.weights),
      version: typeof data.version === "number" ? data.version : 0,
    };
  } catch (err) {
    console.error("[program-card-variant-weights] read threw:", err);
    return { weights: { ...PROGRAM_CARD_FLOW_DEFAULT_WEIGHTS }, version: 0 };
  }
}

export type SaveResult =
  | { ok: true; record: ProgramCardWeightsRecord }
  | { ok: false; error: string };

/** Validate (known arms, non-negative integers, sum 100), write, bump version. */
export async function saveProgramCardVariantWeights(
  weights: Record<string, unknown>,
  updatedBy: string | null,
): Promise<SaveResult> {
  for (const key of Object.keys(weights)) {
    if (!(PROGRAM_CARD_FLOWS as readonly string[]).includes(key)) {
      return { ok: false, error: `Unknown variant: ${key}` };
    }
  }
  const cleaned = emptyWeightShape();
  let sum = 0;
  for (const v of PROGRAM_CARD_FLOWS) {
    const n = weights[v];
    if (n === undefined) continue;
    if (typeof n !== "number" || !Number.isFinite(n) || n < 0 || !Number.isInteger(n)) {
      return { ok: false, error: `${v} must be a non-negative integer` };
    }
    cleaned[v] = n;
    sum += n;
  }
  if (sum !== 100) return { ok: false, error: `Weights must sum to 100 (got ${sum})` };

  try {
    const db = getServiceClient();
    const existing = await db
      .from("experiment_weights")
      .select("version")
      .eq("experiment_id", PROGRAM_CARD_EXPERIMENT_ID)
      .maybeSingle();
    const nextVersion = (existing.data?.version ?? 0) + 1;
    const { error } = await db.from("experiment_weights").upsert({
      experiment_id: PROGRAM_CARD_EXPERIMENT_ID,
      weights: cleaned,
      version: nextVersion,
      updated_at: new Date().toISOString(),
      updated_by: updatedBy,
    });
    if (error) {
      console.error("[program-card-variant-weights] write failed:", error);
      return { ok: false, error: "Database write failed" };
    }
    return { ok: true, record: { weights: cleaned, version: nextVersion } };
  } catch (err) {
    console.error("[program-card-variant-weights] write threw:", err);
    return { ok: false, error: "Database write failed" };
  }
}
