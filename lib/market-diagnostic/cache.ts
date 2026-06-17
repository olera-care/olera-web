import { getServiceClient } from "@/lib/admin";
import { normCareType } from "./resolve";

/**
 * Cache layer for market diagnostics (table: market_diagnostics, migration 098).
 *
 * Serves computed reports and coordinates compute-on-visit with atomic claiming so two
 * simultaneous visitors to the same cold city don't both pay to compute it.
 *
 * Key = (city lowercased, state uppercased, care_type). The jsonb `data.meta.city` carries the
 * display-case city; the column is only the match key.
 */

const TTL_DAYS = 90;                        // senior-care markets move slowly; Census is annual
const STALE_PENDING_MS = 5 * 60 * 1000;     // a pending row older than this → the worker died, reclaimable
const MAX_ATTEMPTS = 3;
const MONTHLY_CAP_USD = 300;                 // compute-spend circuit-breaker

type Db = ReturnType<typeof getServiceClient>;

export interface DiagRow {
  id: string;
  city: string;
  state: string;
  care_type: string;
  status: "pending" | "ready" | "failed";
  data: unknown | null;
  error: string | null;
  attempts: number;
  cost_estimate: number;
  generated_at: string | null;
  claimed_at: string | null;
}

export interface DiagKey { city: string; state: string; careType: string }

export function normalizeKey(city: string, state: string, careType: string | null): DiagKey {
  return {
    city: city.trim().toLowerCase(),
    state: state.trim().toUpperCase(),
    careType: normCareType(careType),
  };
}

export function isFresh(row: DiagRow): boolean {
  if (row.status !== "ready" || !row.generated_at) return false;
  // Pre-#960 rows lack competitorLandscape.ranked (the self-rank source), and pre-referral-map
  // rows lack referralGraph.prioritizedTargets (the digest referral-teaser source). Treat them as
  // stale so warmCity + the serve route recompute them into the current product shape instead of
  // serving inert data that can never surface a provider's rank/referral map.
  const data = row.data as {
    competitorLandscape?: { ranked?: unknown[] };
    referralGraph?: { prioritizedTargets?: unknown[] };
  } | null;
  if (!Array.isArray(data?.competitorLandscape?.ranked)) {
    return false;
  }
  if (!Array.isArray(data?.referralGraph?.prioritizedTargets)) {
    return false;
  }
  const ageMs = Date.now() - new Date(row.generated_at).getTime();
  return ageMs < TTL_DAYS * 24 * 60 * 60 * 1000;
}

function isPendingStale(row: DiagRow): boolean {
  if (row.status !== "pending") return false;
  const claimed = row.claimed_at ? new Date(row.claimed_at).getTime() : 0;
  return Date.now() - claimed > STALE_PENDING_MS;
}

export async function getRow(key: DiagKey, db: Db = getServiceClient()): Promise<DiagRow | null> {
  const { data, error } = await db
    .from("market_diagnostics")
    .select("*")
    .eq("city", key.city).eq("state", key.state).eq("care_type", key.careType)
    .maybeSingle();
  if (error) { console.error("[market] getRow:", error.message); return null; }
  return (data as DiagRow) ?? null;
}

/** Month-to-date estimated compute spend (USD), for the circuit-breaker. */
export async function monthSpendUsd(db: Db = getServiceClient()): Promise<number> {
  const start = new Date();
  const monthStart = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1)).toISOString();
  const { data, error } = await db
    .from("market_diagnostics")
    .select("cost_estimate")
    .gte("generated_at", monthStart);
  if (error) { console.error("[market] monthSpend:", error.message); return 0; }
  return (data || []).reduce((s: number, r: { cost_estimate: number | null }) => s + (Number(r.cost_estimate) || 0), 0);
}

export async function isOverBudget(db: Db = getServiceClient()): Promise<boolean> {
  return (await monthSpendUsd(db)) >= MONTHLY_CAP_USD;
}

export { MONTHLY_CAP_USD, MAX_ATTEMPTS };

/**
 * Try to take ownership of computing this market. Returns true if THIS caller should compute.
 * Handles all states: no row (insert), stale-pending (reclaim), failed-with-retries-left (reclaim),
 * stale-ready (reclaim for background refresh). Concurrency-safe via unique constraint + guarded update.
 */
export async function claimForCompute(key: DiagKey, db: Db = getServiceClient()): Promise<boolean> {
  const row = await getRow(key, db);

  if (!row) {
    // Insert a fresh pending row; unique violation means a concurrent visitor beat us → they own it.
    const { error } = await db.from("market_diagnostics").insert({
      city: key.city, state: key.state, care_type: key.careType,
      status: "pending", attempts: 1, claimed_at: new Date().toISOString(),
    });
    if (error) {
      if (error.code === "23505") return false; // unique_violation: someone else claimed
      console.error("[market] claim insert:", error.message);
      return false;
    }
    return true;
  }

  // A fresh ready row needs no compute; a non-stale pending row is owned by a live worker.
  if (row.status === "ready" && isFresh(row)) return false;
  if (row.status === "pending" && !isPendingStale(row)) return false;
  if (row.status === "failed" && row.attempts >= MAX_ATTEMPTS) return false;

  // Reclaim: guarded update so only one caller wins. We require the row to still be in the
  // state we observed (claimed_at unchanged) to avoid two callers reclaiming the same row.
  const guard = db
    .from("market_diagnostics")
    .update({ status: "pending", attempts: row.attempts + 1, claimed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", row.id);
  const guarded = row.claimed_at ? guard.eq("claimed_at", row.claimed_at) : guard.is("claimed_at", null);
  const { data, error } = await guarded.select("id");
  if (error) { console.error("[market] reclaim:", error.message); return false; }
  return Array.isArray(data) && data.length === 1;
}

export async function writeReady(key: DiagKey, data: unknown, costEstimate: number, db: Db = getServiceClient()): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await db.from("market_diagnostics")
    .update({ status: "ready", data, error: null, cost_estimate: costEstimate, generated_at: now, updated_at: now })
    .eq("city", key.city).eq("state", key.state).eq("care_type", key.careType);
  if (error) console.error("[market] writeReady:", error.message);
}

export async function writeFailed(key: DiagKey, message: string, db: Db = getServiceClient()): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await db.from("market_diagnostics")
    .update({ status: "failed", error: message.slice(0, 500), updated_at: now })
    .eq("city", key.city).eq("state", key.state).eq("care_type", key.careType);
  if (error) console.error("[market] writeFailed:", error.message);
}
