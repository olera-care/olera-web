import { getServiceClient } from "@/lib/admin";
import {
  MANAGED_ADS_VARIANT_DEFAULT_WEIGHTS,
  MANAGED_ADS_VARIANTS,
  type ManagedAdsVariant,
} from "./managed-ads-variant";

export const MANAGED_ADS_EXPERIMENT_ID = "managed_ads_pitch_variant";

export type ManagedAdsWeightsRecord = {
  weights: Record<ManagedAdsVariant, number>;
  version: number;
};

function emptyWeightShape(): Record<ManagedAdsVariant, number> {
  return Object.fromEntries(MANAGED_ADS_VARIANTS.map((v) => [v, 0])) as Record<ManagedAdsVariant, number>;
}

function coerceWeights(raw: unknown): Record<ManagedAdsVariant, number> {
  if (!raw || typeof raw !== "object") return { ...MANAGED_ADS_VARIANT_DEFAULT_WEIGHTS };
  const out = emptyWeightShape();
  const obj = raw as Record<string, unknown>;
  for (const v of MANAGED_ADS_VARIANTS) {
    const n = obj[v];
    if (typeof n === "number" && Number.isFinite(n) && n >= 0) {
      out[v] = Math.round(n);
    }
  }
  return out;
}

export async function getManagedAdsVariantWeights(): Promise<ManagedAdsWeightsRecord> {
  try {
    const db = getServiceClient();
    const { data, error } = await db
      .from("experiment_weights")
      .select("weights, version")
      .eq("experiment_id", MANAGED_ADS_EXPERIMENT_ID)
      .maybeSingle();
    if (error) {
      console.warn("[managed-ads-variant-weights] read returned error, serving defaults:", error.message);
      return { weights: { ...MANAGED_ADS_VARIANT_DEFAULT_WEIGHTS }, version: 0 };
    }
    if (!data) {
      return { weights: { ...MANAGED_ADS_VARIANT_DEFAULT_WEIGHTS }, version: 0 };
    }
    return {
      weights: coerceWeights(data.weights),
      version: typeof data.version === "number" ? data.version : 0,
    };
  } catch (err) {
    console.error("[managed-ads-variant-weights] read threw:", err);
    return { weights: { ...MANAGED_ADS_VARIANT_DEFAULT_WEIGHTS }, version: 0 };
  }
}

export type SaveResult =
  | { ok: true; record: ManagedAdsWeightsRecord }
  | { ok: false; error: string };

export async function saveManagedAdsVariantWeights(
  weights: Record<string, unknown>,
  updatedBy: string | null,
): Promise<SaveResult> {
  for (const key of Object.keys(weights)) {
    if (!(MANAGED_ADS_VARIANTS as readonly string[]).includes(key)) {
      return { ok: false, error: `Unknown variant: ${key}` };
    }
  }

  const cleaned = emptyWeightShape();
  let sum = 0;
  for (const v of MANAGED_ADS_VARIANTS) {
    const n = weights[v];
    if (n === undefined) continue;
    if (typeof n !== "number" || !Number.isFinite(n) || n < 0 || !Number.isInteger(n)) {
      return { ok: false, error: `${v} must be a non-negative integer` };
    }
    cleaned[v] = n;
    sum += n;
  }
  if (sum !== 100) {
    return { ok: false, error: `Weights must sum to 100 (got ${sum})` };
  }

  try {
    const db = getServiceClient();
    const existing = await db
      .from("experiment_weights")
      .select("version")
      .eq("experiment_id", MANAGED_ADS_EXPERIMENT_ID)
      .maybeSingle();
    const nextVersion = (existing.data?.version ?? 0) + 1;

    const { error } = await db
      .from("experiment_weights")
      .upsert({
        experiment_id: MANAGED_ADS_EXPERIMENT_ID,
        weights: cleaned,
        version: nextVersion,
        updated_at: new Date().toISOString(),
        updated_by: updatedBy,
      });
    if (error) {
      console.error("[managed-ads-variant-weights] write failed:", error);
      return { ok: false, error: "Database write failed" };
    }
    return { ok: true, record: { weights: cleaned, version: nextVersion } };
  } catch (err) {
    console.error("[managed-ads-variant-weights] write threw:", err);
    return { ok: false, error: "Database write failed" };
  }
}
