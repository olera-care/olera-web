import { resolveCity, normCareType, type CareType } from "./resolve";
import { fetchMarketSnapshot } from "./fetch";
import { analyzeSnapshot, type MarketAnalysis } from "./analyze";

/**
 * Orchestrates a full market-diagnostic compute for one (city, state, care-type):
 *   resolve geo (free) → fetch Places/Census/Olera → classify + analyze with Haiku.
 * Returns the analysis object (the exact shape the UI renders) plus an estimated USD cost,
 * used by the monthly spend circuit-breaker.
 *
 * ~60-90s of work — call this from a background context (Next `after()`), never inline in a
 * request that must respond fast.
 */

// Places "Enterprise" SKU (phone/website/rating fields) ≈ $0.035 / request.
const PLACES_COST_PER_REQUEST = 0.035;
// Haiku classification: ~one 50-place batch ≈ a few thousand tokens ≈ ~$0.02.
const HAIKU_COST_PER_PLACE = 0.0004;

export interface ComputeResult {
  analysis: MarketAnalysis;
  costEstimate: number; // USD
}

export async function computeMarket(
  cityRaw: string,
  stateRaw: string,
  careTypeRaw: string | null,
): Promise<ComputeResult> {
  const careType: CareType = normCareType(careTypeRaw);
  const resolved = resolveCity(cityRaw, stateRaw);
  if (!resolved) throw new Error(`city not resolvable: ${cityRaw}, ${stateRaw}`);

  const { snapshot, placesRequests } = await fetchMarketSnapshot(resolved, careType);
  const { analysis, classified } = await analyzeSnapshot(snapshot);

  const costEstimate = +(placesRequests * PLACES_COST_PER_REQUEST + classified * HAIKU_COST_PER_PLACE).toFixed(4);
  return { analysis, costEstimate };
}
