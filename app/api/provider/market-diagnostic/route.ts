import { NextResponse } from "next/server";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

/**
 * Serves a provider's local market diagnostic ("Your Market").
 *
 * v0: reads precomputed snapshots committed under data/market-diagnostic/*.analysis.json
 * (one per city × care-type). The unit of computation is CITY × care-type, shared across
 * every provider in that market — so a single snapshot serves all local providers.
 *
 * Phase 2: on a cache miss, enqueue a background compute (scripts/market-diagnostic/*) and
 * write the result to a market_diagnostics cache table; this route then reads from there.
 */

const DIR = path.join(process.cwd(), "data/market-diagnostic");

function normCareType(input: string | null): "homecare" | "assisted_living" | null {
  if (!input) return null;
  const s = input.toLowerCase();
  if (/home[_\s-]?care|in[_\s-]?home|companion|private[_\s-]?duty/.test(s)) return "homecare";
  if (/assisted|memory|residential|senior[_\s-]?living/.test(s)) return "assisted_living";
  return null;
}

function loadSnapshots() {
  let files: string[] = [];
  try { files = readdirSync(DIR).filter((f) => f.endsWith(".analysis.json")); } catch { return []; }
  const out: { city: string; state: string; careType: string; data: unknown }[] = [];
  for (const f of files) {
    try {
      const data = JSON.parse(readFileSync(path.join(DIR, f), "utf8"));
      const m = data?.meta;
      if (m?.city && m?.state) out.push({ city: m.city, state: m.state, careType: m.careType, data });
    } catch { /* skip unreadable */ }
  }
  return out;
}

export function GET(req: Request) {
  const url = new URL(req.url);
  const city = (url.searchParams.get("city") || "").trim().toLowerCase();
  const state = (url.searchParams.get("state") || "").trim().toLowerCase();
  const careType = normCareType(url.searchParams.get("careType"));
  if (!city) return NextResponse.json({ error: "city required" }, { status: 400 });

  const snaps = loadSnapshots();
  const inCity = snaps.filter((s) =>
    s.city.toLowerCase() === city && (!state || s.state.toLowerCase() === state),
  );
  if (!inCity.length) return NextResponse.json({ available: false }, { status: 200 });

  // Prefer an exact care-type match; otherwise fall back to any snapshot for the city.
  const match = inCity.find((s) => normCareType(s.careType) === careType) ?? inCity[0];
  return NextResponse.json({ available: true, data: match.data });
}
