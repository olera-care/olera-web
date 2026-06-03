# Market Diagnostic — Phase 2 Plan (multi-city, on-demand)

> Parked 2026-06-03 to do more Find Families (Phase 1) optimizations first.
> Resume here when ready. Context: `project_market_diagnostic` memory + SCRATCHPAD.

## Goal
The diagnostic works for **any provider's city**, cached — instead of College-Station-computed-by-hand. Then flip the gate (`lib/market-gate.ts` → `marketGateEnabled` returns `true`) for rollout.

## Current state (Phase 1, shipped on PR #916)
- Engine = two dependency-free `.mjs` scripts (`scripts/market-diagnostic/fetch-diagnostic.mjs` + `analyze-diagnostic.mjs`), run **manually**, output committed as JSON, served by `app/api/provider/market-diagnostic` reading the committed file.
- Only College Station exists. Other cities → "Building your market report" placeholder.

## Shared core (needed regardless of approach)
1. **Cache table** `market_diagnostics` (migration 098): `city / state / care_type → data jsonb + status (pending|ready|failed) + generated_at + error`. Unique (city,state,care_type). Serve endpoint reads this instead of committed files. Seed with the existing CS snapshot.
2. **Engine as a server module** — port `fetch` + `analyze` logic into `lib/market-diagnostic/` so a server route can run it (keys stay server-side: GOOGLE_PLACES_API_KEY, CENSUS_API_KEY, ANTHROPIC_API_KEY). Keep the `.mjs` for manual runs (both import the shared lib).
3. **City resolver** — `city, state → lat/lng` (geocode via Google) + the area's ZIP set for Census demographics. **Check first:** the repo's city-search data (`public/data/cities-*.json` + ZIP index, per `lib/us-city-search.ts`) may already map city→ZIP — if so, ZIP-level demographics stay easy.

## The fork — how cities get computed
- **A · Batch precompute (recommended v1):** run the engine offline for the ~100–200 cities where providers actually cluster (distinct city/state from `olera-providers`, ranked by provider count). One-time ~$200–350. Covers the bulk of providers instantly; no serverless-timeout/polling complexity. Tail cities show "building" until backfilled.
- **B · Lazy on-demand:** compute on first visit to an uncached city. Complete but front-loads the hard infra — a 60–90s compute that can't block page load → Vercel function `maxDuration` (Pro allows up to 300s; confirm plan), a poll/"building report" UX, and dedup so two simultaneous visitors don't double-compute (claim a `pending` row first).
- **C · Hybrid:** batch the top cities now (instant for most), add lazy for the long tail later.

**Recommendation: A → C.** Batch ships multi-city value fast and de-risks; add lazy for the tail once real usage is visible. Lazy-only does the most engineering for the least-visited cities first.

## Open questions to settle before coding
1. **Demographics granularity** — ZIP-level "where to focus" (needs each city's ZIP set; easy if city-search data has it) vs county-level fallback (simpler, but loses the ZIP ranking — a strong feature).
2. **Rollout** — stay gated to Aggie/a cohort while watching cost + quality on real cities, then flip the gate. (Lean: yes.)
3. **Cost cap** — a hard ceiling on total compute spend (stop at $X)? Set the number.

## Guardrails (whichever approach)
- Cache TTL (~90 days; senior-care markets move slowly, Census is annual) before recompute.
- Compute budget cap.
- Rollout gating so cost/quality is watched on a cohort before going wide.

## Cost reminder
~$1.75 / market one-time (Places ~$1.20 + Haiku ~$0.50; Census free). Unit = **city × care-type, shared across all local providers** — not per-provider. (See `feedback_perplexity_real_cost` — Haiku is the cheap engine; don't reach for Perplexity here.)
