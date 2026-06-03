# Market Diagnostic — Phase 2 Plan (lazy compute-on-visit)

> Revised 2026-06-04. Approach = **lazy-only** (compute on first visit, cache forever w/ TTL).
> Batch precompute was rejected — see "Why lazy, not batch" below.
> Context: `project_market_diagnostic` memory + SCRATCHPAD.

## Goal
The diagnostic works for **any provider's city**, computed on demand and cached — instead of
College-Station-computed-by-hand. Then flip the gate (`lib/market-gate.ts` →
`marketGateEnabled` returns `true`) for rollout.

## Why lazy, not batch (decided 2026-06-04, grounded in live data)
- Live `get_coverage_summary()` RPC: **74,159 providers across 4,008 cities**. The distribution is
  brutally flat — top 100 cities = only **12.8%** of providers; #1 city (Houston) = 241 = 0.3%.
  There is **no dense head worth batching**.
- The decisive fact: 74K providers but only a tiny fraction ever open Find Families. A batch of
  300–5,000 cities would be ~90%+ wasted spend on markets no provider ever views.
- **Lazy optimizes for the visit, not the inventory.** Pay for a city only when a real provider
  lands on it. Cache + shared-by-city means the 2nd provider in that city gets it instantly;
  popular cities amortize to ~$0. CS already seeded.
- The only thing batch dodged — first-visit compute latency — is already solved by the existing
  `MarketLoading.tsx` (built as "the Phase-2 cache-miss experience").

## Current state (Phase 1, shipped on PR #916, in prod, gated)
- Engine = two dependency-free `.mjs` scripts (`scripts/market-diagnostic/fetch-diagnostic.mjs` +
  `analyze-diagnostic.mjs`), run **manually**, output committed as JSON, served by
  `app/api/provider/market-diagnostic` reading the committed CS file.
- Only College Station exists. Other cities → "Building your market report" placeholder.

## The three pieces
1. **Cache table** `market_diagnostics` (migration 098):
   `city, state, care_type → data jsonb, status (pending|ready|failed), generated_at, error,
   attempts, cost_estimate`. Unique (city,state,care_type). Stale-pending recovery: a `pending`
   row older than ~5 min is reclaimable. Seed with the committed CS snapshot. Serve endpoint reads
   this instead of the committed file.
2. **Engine as a server lib** — port fetch + analyze into `lib/market-diagnostic/` (server-only,
   keys stay server-side: GOOGLE_PLACES_API_KEY, CENSUS_API_KEY, ANTHROPIC_API_KEY). Keep thin
   `.mjs` wrappers that import the shared lib for manual runs.
3. **City resolver** — NO Google geocoding, NO paid demographics:
   - city→lat/lng from olera-web `public/data/cities-tier2.json` (`[city,state,pop,lat,lng]`, 18K).
   - city→ZIP set for ZCTA Census from the expansion-map `cities.json` `z` field (port it into
     olera-web `public/data/`, it's the canonical city→ZIP source; county in `cn`).

## Compute-on-visit flow
1. Provider lands on Find Families → `GET /api/provider/market-diagnostic?city&state&careType`.
2. Cache hit + fresh (≤90d) → return data immediately.
3. Cache hit + stale (>90d) → return stale data NOW (stale-while-revalidate) + trigger background
   refresh.
4. Cache miss → atomically claim a `pending` row (unique constraint dedups concurrent visitors;
   loser just polls) → trigger async compute → return `{status:"building"}`.
5. Client shows `MarketLoading` and polls every ~3s until the row flips `ready` (or `failed`).

### Async execution model (the crux — Vercel serverless)
- Compute is ~60–90s; cannot block or dangle (Vercel kills pending promises after response —
  see `feedback_serverless_fire_and_forget`).
- **Plan A (default): dedicated compute route** `POST /api/provider/market-compute` with
  `export const maxDuration = 300` (confirm Pro plan allows 300s). Serve route triggers it via a
  fire-and-forget fetch whose *initiation* is awaited (handoff completes before responding); the
  compute route then runs independently in its own function lifetime, runs the engine, writes the
  row. Auth: internal shared-secret header (not user session).
- **Plan B (fallback if maxDuration too low / trigger unreliable): Vercel Cron drains the queue** —
  serve route just leaves the `pending` row; a 1-min cron computes pending rows. Slightly slower
  first paint; zero trigger fragility.
- Pick during build after confirming the Vercel plan's maxDuration.

## Guardrails
- **Cost circuit-breaker:** sum `cost_estimate` of rows generated month-to-date; at **$300/mo**
  hard-stop new computes (cache misses show a graceful "check back shortly" instead) + Slack alert.
  Monthly ceiling is a single knob.
- **TTL 90 days** (senior-care markets move slowly, Census is annual) → stale-while-revalidate.
- **Per-city cost ~$1.50–1.75** (validated: 25 Places queries × ~1.5 pages × ~$0.035 Enterprise
  SKU + Haiku; Census/geocode/ZIP free). A lean-fetch option (maxPages=1 on referral queries, drop
  2 weakest roles) ~halves Places spend with no quality loss — apply it.
- **Rollout gating:** stay gated to Aggie / `?market=1` / TJ email while watching cost + quality on
  real cities, THEN flip `marketGateEnabled` → `true`.
- **Failure handling:** `failed` status + bounded retries (attempts col); show the existing
  "Building your market report" unavailable state, not a crash.

## First-visit UX (open product call)
First visitor to an uncached city waits ~60–90s on the narrated loader. Options:
- (a) Just keep the narrated loader for the full ~90s (low visit rate → rare; loader is nice).
- (b) After ~20s, degrade to "still building — we'll have this ready in a minute, check back" while
  polling continues. Softer on the one unlucky first visitor.
Lean (b) for grace. Settle with TJ.

## Cost reminder
~$1.50–1.75 / market, charged **only on real cache-miss visits**, shared across all local providers
in that city. Haiku is the cheap engine (`feedback_perplexity_real_cost`) — don't reach for
Perplexity.
