# Plan: Connections Tracker (gating-thread sub-task 4)

Created: 2026-06-01
Status: Phases 1–3 built (model + refactor + endpoints + UI) — MVP complete, needs a staging build/visual pass
Notion: "Connect the two sides — lead delivery, re-engagement + connections tracker" (`3725903a-0ffe-81f1-8a54-d32371a60243`)

## Goal

A live `/admin/connections` view — hero "successful connections" KPI + a prioritized intervention queue — so the team can see, at a glance, which care-seeker↔provider connections need a human nudge and which are healthy. The anchor that keeps the whole gating thread visible.

## The canonical definitions this view establishes

- **Successful connection** (the KPI): a connection (type `inquiry`/`request`) where the provider has posted a non-auto reply in `metadata.thread` **OR** `status='accepted'`. Computed live from `connections` — server-confirmed, not client click counts. This replaces the 3 divergent response-rate computations in `/admin/analytics`, `/admin/leads`, `/admin/activity`.
- **Temperature** = whose-turn-it-is + staleness, derived per connection:
  - `awaiting_provider` — family inquired, provider has no non-auto reply (the #1 intervention)
  - `awaiting_family` — last non-auto message is the provider's; family went quiet (sub-task 2's moment)
  - `live` — both sides have non-auto messages and last activity is recent
  - `going_cold` — an awaiting_* state past a staleness threshold (escalated by `nudge_count`)
  - `closed` — `declined`/`expired`/`metadata.ended`/`withdrawn`/`archived`
  - staleness = `now − last meaningful event` (last thread message `created_at`, else connection `created_at`)

## Success Criteria

- [ ] `/admin/connections` renders a hero KPI (live successful connections) + delta + sparkline via `PulseHeader`
- [ ] Below it, a "Needs you" queue sorted most-needs-action first (going_cold > awaiting_provider > awaiting_family), each row showing whose-turn label + relative age + family→provider
- [ ] A collapsed "Live & healthy (N)" section; closed connections excluded by default
- [ ] Temperature + "provider responded?" logic lives in ONE module, reused (not re-implemented)
- [ ] Visual matches the decided direction: warm, big serif KPI, calm fading dot, NO red/amber/green heatmap grid
- [ ] Sidebar link under Inbox; admin-auth gated; GET endpoints (browser-openable)
- [ ] `npm run build` / typecheck passes

## Non-Goals (cut from MVP — tracked as later phases)

- Provider lead-outcome follow-up ("what happened with this lead?") — Phase 4
- Consolidating leads/outreach/questions/activity/analytics into the ledger — Phase 5 (large, separate)
- Email-quality badge in rows — depends on sub-task 1; leave an integration point, don't build here
- A durable `connection_succeeded` event in `seeker_activity` — needs an event-allowlist CHECK migration (see Risks); MVP computes live instead

## Tasks

### Phase 1: Temperature model (pure logic) — ✅ DONE 2026-06-01
- [x] 1. Create `lib/connection-temperature.ts`: `getConnectionTemperature(connection)` → `{ state, stalenessMs, lastActorAt, lastActor, label, isSuccessful }`. Centralize the `providerResponded = thread.some(m => m.from_profile_id === to_profile_id && m.is_auto_reply !== true)` check (currently duplicated in `lead-response-nudge`, `lead-family-nudge`, `analytics/summary`, `analytics/response-leads`, `admin/leads/route`, `provider/connections/page`). Export `TEMPERATURE_CONFIG` (state → label, dot color, fade rule). Define staleness thresholds as named constants.
      - Files: `lib/connection-temperature.ts` (new), import `Connection` from `lib/types`
      - Depends on: none
      - Verify: temporary Node script feeding sample connection metadata (awaiting_provider 3h, awaiting_family 6d, live, going_cold 11d+2 nudges); assert state/staleness. `npx tsc --noEmit`.
- [x] 2. Refactor the duplicated **boolean** predicate to `providerResponded()`. **Scope refined after reading the code** (the plan's original 6-site list was partly inaccurate):
      - ✅ Refactored (clean boolean `.some`, `meta`/`thread` existed only for the check): `app/api/admin/leads/route.ts` (×2: `providerNeedsEmail`, `providerNeedsEmailEnhanced`), `app/api/admin/leads/stats/route.ts` (`isNeedsEmail`). Removed now-dead local `ThreadMessage` types.
      - ⏭️ Left as-is, on purpose: `analytics/response-leads/route.ts:201` and `analytics/summary/route.ts:1335` use `thread.find(...)` to get the **provider message object** (for response-time/text), not a boolean — the boolean helper would be a regression there. `lead-response-nudge/route.ts:134` has a local `const providerResponded` name-collision + a shared `meta` used downstream; marginal value, skipped. `provider/connections/page.tsx:937` anchors on the logged-in provider's id (a different variable), not `to_profile_id`.
      - Verify: ✅ grep confirms only the 3 intentional `.find`/nudge sites remain; ✅ no orphaned `ThreadMessage`; ✅ module logic re-tested (incl. nullable `to_profile_id`). ⚠️ No local `tsc` (node_modules absent in worktree) — staging CI is the typecheck gate; signatures were loosened (`metadata?: unknown`, `to_profile_id?: string | null`) to remove assignability risk.

### Phase 2: Data endpoints (server, admin-gated, GET) — ✅ DONE 2026-06-01
- [x] 3. `GET /api/admin/connections/pulse` — `{ total, delta, series, bucket }`; `total` = successful connections (provider replied OR accepted) by `created_at` in range. Models `leads/stats`.
      - Files: `app/api/admin/connections/pulse/route.ts` (new)
- [x] 4. `GET /api/admin/connections` — fetch capped active set (3000), compute temperature per row, filter (state / search / include_closed), sort by `INTERVENTION_PRIORITY` then staleness, paginate, attach `provider_activity` engagement. Returns `{ connections, total, counts, engagement, truncated }`. `counts` is per-state over the searched set for section labels; `truncated` logs if the cap is hit (no silent caps).
      - Files: `app/api/admin/connections/route.ts` (new)
      - **Verified against real data (305 conns / 60d via direct Supabase REST + the real module logic):** KPI successful = **6** (matches the "~3 providers reached out" reality); distribution going_cold 218 / awaiting_provider 31 / awaiting_family 1 / live 1 / closed 54. ⚠️ Route-level wiring (auth wrapper, PostgREST join + `.not(cs)` filter) validated only by pattern-match against `leads/route.ts` (identical syntax) — no local server/node_modules; staging CI is the gate.

### Phase 3: Tracker UI — ✅ BUILT 2026-06-01 (needs staging visual pass)
- [x] 5. `app/admin/connections/page.tsx` — `PulseHeader` (title "Connections", `statsPath=/api/admin/connections/pulse`) + "Needs you" queue (rows from `/api/admin/connections`) + collapsed "Live & healthy (N)". Row = calm fading temperature dot + whose-turn label + "family → provider" + relative age; awaiting_family rows show the "↳ provider replied, no answer · nudge?" sub-line. Warm bg, big serif KPI (Perena/Wispr), one accent.
      - Files: `app/admin/connections/page.tsx` (new), `components/admin/ConnectionRow.tsx` (new), reuse `TEMPERATURE_CONFIG`
      - Built: serif (`font-display`) hero number from `/pulse` + delta + inline SVG sparkline; section tabs (Needs you / Live & healthy / Closed) with live counts; search; `ConnectionRow` with calm fading dot (`dotOpacityForStaleness`) + whose-turn label + age + the "↳ provider replied, no answer · nudge?" sub-line on awaiting_family. Default range `30d` (per `feedback_senior_care_monthly_windows`). Warm stone surface, no heatmap.
      - Files: `app/admin/connections/page.tsx` (new), `components/admin/ConnectionRow.tsx` (new)
- [x] 6. Sidebar link under **Inbox** ("Connections", after Demand). Empty/loading/error states present. Row click-through to a per-connection detail = **deferred** (no such detail page exists yet; rows are informational for MVP).
      - Files: `components/admin/AdminSidebar.tsx`
      - Verify: ⚠️ No local build (node_modules absent). Did import/export cross-check — **caught + fixed** a default-vs-named import bug on `DateRangePopover`. All other imports confirmed to exist. Full typecheck + visual pass = staging CI / `/run` on a built checkout. Pending: eyeball against the mock, confirm the fading dot + serif hero read right.

### Phase 4 (later — not this build)
- Provider lead-outcome follow-up: a cron emailing providers ~7d after connect ("what happened with this lead?"), writing the outcome to `metadata`, surfaced as an "outcome unknown" chip in the queue.
- Consolidation audit: fold leads/outreach/questions/activity into views on this tracker.
- Durable `connection_succeeded` event (after the event-allowlist migration) for clean historical time-series instead of live recomputation.

## Risks

- **Definition risk (decision needed):** "successful connection = provider-responded OR accepted" is a judgment call. If TJ wants a stricter bar (e.g. a real two-way exchange, or contact actually revealed), the KPI changes. Confirm before Phase 2.
- **In-memory computation:** temperature/`providerResponded` can't be a clean SQL filter (lives in `metadata.thread` JSONB), so it's computed per-row in the route like `/admin/leads` does. Fine at current volume (hundreds of active connections); cap the fetch and `log()` if truncated — no silent caps.
- **`accepted_at` is unreliable** (set inconsistently, sometimes null on accepted rows). Derive temperature from `thread` + `status`, not `accepted_at`.
- **Refactor regression (task 2):** the 6 call sites have subtly different thresholds/cooldowns. Centralize the *predicate*, keep each site's own thresholds; grep the function bodies after (per `feedback_grep_after_refactor`).
- **Brand regression:** easy to drift into an admin-dashboard heatmap. Hold the line on the decided calm/typographic direction.
- **Dual provider tables / name resolution:** family & provider display names need profile joins (provider may be `business_profiles` or `olera-providers` fallback) — reuse the leads route's resolution, don't reinvent.

## Notes

- This is the visual front-end of the retired P2 "Connection ledger + real KPI + admin consolidation" card (folded in).
- Sub-tasks 1–3 of the gating card produce the signals this view renders (email quality, provider-replied, delivery state); building them first means real data on day one. The tracker can ship against live `connections` data regardless.
- Reuse inventory: `PulseHeader` (KPI+chart), `connection-utils.ts` (status configs), `/admin/leads/route` engagement-join pattern, `EmailStatusPill` (for the later quality integration).
