import { resolveCity } from "./resolve";
import { computeMarket } from "./compute";
import { normalizeKey, getRow, isFresh, claimForCompute, writeReady, writeFailed, isOverBudget } from "./cache";

/**
 * Warm (precompute + cache) a city's market diagnostic so Find Families is instant when
 * the provider gets there — moving the ~16s compute OFF the critical path. Safe to
 * fire-and-forget from a background context (Next `after()`).
 *
 * No-ops when: the city isn't resolvable, the diagnostic is already fresh, another worker
 * is already computing it, or we're over the monthly compute budget. The cache is shared
 * by city × care-type, so a second provider in the same market reuses this for free.
 */
export async function warmCity(cityRaw: string, stateRaw: string, careTypeRaw: string | null): Promise<void> {
  if (!cityRaw || !resolveCity(cityRaw, stateRaw)) return;
  const key = normalizeKey(cityRaw, stateRaw, careTypeRaw);

  const existing = await getRow(key);
  if (existing && existing.status === "ready" && isFresh(existing)) return; // already warm
  if (await isOverBudget()) return;
  if (!(await claimForCompute(key))) return; // unknown/unclaimable or another worker owns it

  try {
    const { analysis, costEstimate } = await computeMarket(cityRaw, stateRaw, careTypeRaw);
    await writeReady(key, analysis, costEstimate);
  } catch (e) {
    await writeFailed(key, (e as Error).message);
    console.error(`[market] warm failed ${key.city},${key.state}:`, (e as Error).message);
  }
}
