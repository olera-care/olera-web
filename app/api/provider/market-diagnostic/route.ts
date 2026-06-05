import { NextResponse } from "next/server";
import { after } from "next/server";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { getServiceClient } from "@/lib/admin";
import { sendSlackAlert } from "@/lib/slack";
import { resolveCity } from "@/lib/market-diagnostic/resolve";
import { computeMarket } from "@/lib/market-diagnostic/compute";
import {
  normalizeKey, getRow, isFresh, claimForCompute, writeReady, writeFailed,
  isOverBudget, MONTHLY_CAP_USD, MAX_ATTEMPTS, type DiagKey,
} from "@/lib/market-diagnostic/cache";

/**
 * Serves a provider's local market diagnostic ("Your Market"), computed on demand.
 *
 * Cache-first: reads the market_diagnostics table (migration 098). On a miss it atomically
 * claims a pending row and computes in the background via Next `after()` (~60-90s) — the
 * request returns {status:"building"} immediately and the client polls until it flips ready.
 * The unit of computation is CITY × care-type, shared across every provider in that market.
 *
 * College Station (and any committed *.analysis.json) is served directly from disk as a
 * zero-cost fallback so the original snapshot never regresses.
 */

export const maxDuration = 300; // gives the background after() compute room (Pro plan)
// This is a POLLING endpoint: the client hits it every ~3s while a city computes. The
// response status flips building→ready over the poll, so it must NEVER be cached — a
// cached "building" response would be served forever, the poll would never see "ready",
// and the client would fall into the "check back shortly" give-up state with the data
// actually ready in the cache. force-dynamic + no-store on every response prevents that.
export const dynamic = "force-dynamic";

/** JSON response that is never cached by the browser or the CDN (see note above). */
function reply(body: unknown, init?: ResponseInit) {
  return NextResponse.json(body, {
    ...init,
    headers: { "Cache-Control": "no-store, max-age=0", ...(init?.headers || {}) },
  });
}

const DIR = path.join(process.cwd(), "data/market-diagnostic");

function normCareTypeFile(input: string | null): "homecare" | "assisted_living" | null {
  if (!input) return null;
  const s = input.toLowerCase();
  if (/home[_\s-]?care|in[_\s-]?home|companion|private[_\s-]?duty/.test(s)) return "homecare";
  if (/assisted|memory|residential|senior[_\s-]?living/.test(s)) return "assisted_living";
  return null;
}

/** Committed-file fallback (College Station + any seeded snapshots). */
function loadFileSnapshot(city: string, state: string, careType: "homecare" | "assisted_living" | null): unknown | null {
  let files: string[] = [];
  try { files = readdirSync(DIR).filter((f) => f.endsWith(".analysis.json")); } catch { return null; }
  const matches: { careType: string; data: { meta?: { city?: string; state?: string; careType?: string } } }[] = [];
  for (const f of files) {
    try {
      const data = JSON.parse(readFileSync(path.join(DIR, f), "utf8"));
      const m = data?.meta;
      if (m?.city?.toLowerCase() === city && (!state || m?.state?.toLowerCase() === state)) {
        matches.push({ careType: m.careType, data });
      }
    } catch { /* skip */ }
  }
  if (!matches.length) return null;
  const exact = matches.find((s) => normCareTypeFile(s.careType) === careType);
  return (exact ?? matches[0]).data;
}

/** Kick off the background compute for a claimed key (runs after the response is sent). */
function scheduleCompute(key: DiagKey, city: string, state: string, careType: string | null) {
  after(async () => {
    try {
      const db = getServiceClient();
      if (await isOverBudget(db)) {
        await writeFailed(key, `monthly compute budget ($${MONTHLY_CAP_USD}) reached`, db);
        await sendSlackAlert(`:moneybag: Market-diagnostic monthly compute budget ($${MONTHLY_CAP_USD}) reached — new market computes paused for ${key.city}, ${key.state}. Resets next month.`);
        return;
      }
      const { analysis, costEstimate } = await computeMarket(city, state, careType);
      await writeReady(key, analysis, costEstimate, db);
    } catch (e) {
      await writeFailed(key, (e as Error).message);
      console.error(`[market] compute failed ${key.city},${key.state}:`, (e as Error).message);
    }
  });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const cityRaw = (url.searchParams.get("city") || "").trim();
  const stateRaw = (url.searchParams.get("state") || "").trim();
  const careTypeRaw = url.searchParams.get("careType");
  if (!cityRaw) return reply({ status: "unavailable", available: false, error: "city required" }, { status: 400 });

  const cityLc = cityRaw.toLowerCase();
  const stateLc = stateRaw.toLowerCase();
  const key = normalizeKey(cityRaw, stateRaw, careTypeRaw);
  const db = getServiceClient();

  // 1. Cache table — the fast path for any previously-computed city.
  const row = await getRow(key, db);
  if (row && row.status === "ready" && isFresh(row)) {
    return reply({ status: "ready", available: true, data: row.data });
  }

  // 2. Committed-file fallback (College Station etc.) — serve immediately, no compute.
  const fileData = loadFileSnapshot(cityLc, stateLc, normCareTypeFile(careTypeRaw));
  if (fileData && (!row || row.status !== "ready")) {
    return reply({ status: "ready", available: true, data: fileData });
  }

  // 3. Stale-but-ready — serve stale now, refresh in the background (stale-while-revalidate).
  if (row && row.status === "ready" && row.data) {
    if (resolveCity(cityRaw, stateRaw) && await claimForCompute(key, db)) {
      scheduleCompute(key, cityRaw, stateRaw, careTypeRaw);
    }
    return reply({ status: "ready", available: true, data: row.data });
  }

  // 4. Can we even diagnose this city? Unknown city → we don't cover this area; say so honestly
  //    (reason: "uncovered") rather than implying a report is on the way.
  if (!resolveCity(cityRaw, stateRaw)) {
    return reply({ status: "unavailable", available: false, reason: "uncovered" });
  }

  // 5. Terminal failure (out of retries / budget-paused) → unavailable, don't poll forever.
  if (row && row.status === "failed" && row.attempts >= MAX_ATTEMPTS) {
    return reply({ status: "unavailable", available: false });
  }

  // 6. Cache miss / stale-pending / retryable-failure → claim + compute in background, tell client to poll.
  if (await claimForCompute(key, db)) {
    scheduleCompute(key, cityRaw, stateRaw, careTypeRaw);
  }
  return reply({ status: "building", available: false });
}
