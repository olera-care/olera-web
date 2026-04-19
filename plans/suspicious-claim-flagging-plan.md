# Plan: Flag Suspicious One-Click Sign-Ins for Manual Review

Created: 2026-04-18
Status: Not Started
Owner: TJ
Priority: P1 🔥 (Backend)
Notion: [Flag suspicious one-click sign-ins for manual review](https://www.notion.so/Flag-suspicious-one-click-sign-ins-for-manual-review-3445903a0ffe81c6b6e6d3c91ec0ccae)
Estimate: ~1 day

## Goal

When a provider claims a listing via the one-click sign-in flow, score the email↔provider match into a `high`/`medium`/`low` bucket, persist it on `business_profiles`, and surface `low` results to admins in the Activity Center + Slack — without blocking the provider's access.

## Success Criteria

- [ ] A claim from `admin@sunriseseniorliving.com` on "Sunrise Senior Living" → `high`, no flag
- [ ] A claim from `sunrise.senior@gmail.com` → `medium`, no flag
- [ ] A claim from `randomuser99@gmail.com` on "Sunrise Senior Living" → `low`, **flagged**
- [ ] Low-trust claims appear in Admin Activity Center → Providers tab under a new filter "Suspicious claims"
- [ ] Low-trust claims post a Slack alert to `SLACK_WEBHOOK_URL`
- [ ] Provider experience is unchanged — they're signed in and see their dashboard regardless of score
- [ ] All existing claim flow tests / happy-path still pass

## Design Decisions

| Decision | Choice | Reason |
|---|---|---|
| Hook point | `app/api/claim/finalize/route.ts` only | Single binding point; validate-token and auto-sign-in don't yet know the final provider↔email pairing |
| Score storage | New column `business_profiles.claim_trust_level` (TEXT CHECK) | Queryable, simple, doesn't bury value in metadata JSON |
| Bucket values | `high` / `medium` / `low` | Matches ticket; non-technical friendly |
| Admin surface | Reuse existing Activity Center + new `event_type = 'suspicious_claim'` | Zero new UI scaffolding; filter dropdown gets one more entry |
| Slack notification | Ship in first PR (not optional) | TJ explicit |
| **Scoring method** | **LLM (Claude Haiku 4.5) with thin rule-based fast-path** | Real-world emails are too messy for regex. Handles `.io` vs `.org`, abbreviations, subsidiary franchise names, small-biz gmails, etc. Fast-path skips LLM for slam-dunk `.gov`/`.edu` cases to save latency |
| Fallback on LLM error | Return `medium` (never `low`) | A `low` on error would spam admins and false-flag providers. `medium` is silent, safe, and auditable |
| Block suspicious claims? | No | Ticket explicit: "don't block — admin team knows to check" |

## Tasks

### Phase 1: Schema (do first — code depends on it)

- [ ] **1. Add `claim_trust_level` column to `business_profiles`**
  - Files: `supabase/migrations/###_add_claim_trust_level.sql` (new)
  - DDL: `ALTER TABLE business_profiles ADD COLUMN claim_trust_level TEXT CHECK (claim_trust_level IN ('high','medium','low'))` — nullable, no default
  - Depends on: none
  - Verify: `select claim_trust_level from business_profiles limit 1;` returns with column present

- [ ] **2. Allow `suspicious_claim` event_type in `provider_activity`**
  - Files: same or separate migration file
  - Find the current CHECK/enum constraint on `provider_activity.event_type` (explore agent noted it exists — must confirm shape) and add `'suspicious_claim'`
  - Depends on: none (parallel with task 1)
  - Verify: `insert into provider_activity (provider_id, event_type) values (<test-id>, 'suspicious_claim')` succeeds, then rolled back

### Phase 2: Trust scoring utility

- [ ] **3. Build `lib/claim-trust.ts` (LLM-backed)**
  - Files: `lib/claim-trust.ts` (new)
  - Exports:
    - `scoreClaimTrust({ email, providerName, providerCity?, providerState?, providerCategory?, providerDomain? }): Promise<{ level: 'high'|'medium'|'low', reason: string }>`
  - Model: `claude-haiku-4-5-20251001` (~$0.001/call, ~800ms, ~50 claims/day → ~$1.50/mo)
  - SDK: `@anthropic-ai/sdk` is already installed (see `app/api/matches/generate-message/route.ts` for pattern)
  - API key: `ANTHROPIC_API_KEY` already in `.env.local`
  - Fast-path (no API call): if email domain is `.gov` or `.edu` → return `high` immediately. These are institutional and essentially impossible to spoof.
  - Otherwise → LLM call. System prompt (marked for prompt caching since it's identical across calls):
    ```
    You're evaluating whether an email plausibly belongs to someone authorized to claim
    a senior-care business listing. You'll see the claimant's email and the business info.

    Return JSON: { "level": "high" | "medium" | "low", "reason": "<one short sentence>" }

    Guidance:
    - high: email clearly matches the business — corporate domain matching the name (any TLD
      variant like .com/.io/.org/.care is fine), initials matching ("lccg.care" for "Loving
      Caregivers Group"), .gov/.edu, or a small-biz gmail whose local-part clearly references
      the business name.
    - medium: plausible but uncertain — generic domain with a weak/partial name match, or
      an unusual corporate domain we can't confirm.
    - low: clear mismatch — generic domain (gmail/yahoo/outlook/etc.) with an unrelated
      local-part claiming a well-known multi-location brand (Sunrise Senior Living,
      Brookdale, Home Instead, etc.). Small family-run homes with gmail are NOT low-trust.

    Be charitable. We are not blocking anyone — this flag just routes claims to manual review.
    Err toward medium over low when unsure.
    ```
  - User message: compact block with email, business name, city/state, category, known domain
  - Response parsing: JSON-mode via `response_format` if available in SDK version, else manual JSON.parse with validation (level ∈ allowed values)
  - Error handling: any API/parse error → return `{ level: 'medium', reason: 'llm_error: <error.message>' }`. Log to console.
  - Timeout: 5s max — if LLM is slow, we don't want to delay claim finalize
  - Depends on: none
  - Verify: inline test scratch with `npx tsx` against the three example scenarios in success criteria + a franchise case (`admin@homeinstead-nj.io` for "Home Instead of New Jersey" → expect high) and a small-biz gmail (`bella.vista.apts@gmail.com` for "Bella Vista Apartments" → expect high or medium, not low)

- [ ] **4. Add `slackSuspiciousClaim` helper**
  - Files: `lib/slack.ts` (edit)
  - Mirror shape of existing `slackProviderClaimed` (line 74–102)
  - Include: provider name, provider slug (deep-link to public page), claimed-by email, trust level badge, reason, link to admin activity center filtered to suspicious claims
  - Depends on: none
  - Verify: type-check passes, no runtime yet

### Phase 3: Wire into finalize

- [ ] **5. Compute + persist trust in `claim/finalize`**
  - Files: `app/api/claim/finalize/route.ts` (edit)
  - Before the UPDATE (~line 178) and before the INSERT (~line 220), compute `scoreClaimTrust(...)`. Pass `providerName` from the matched row (`claimedBp.display_name` or the olera-providers row) and `providerDomain` if one exists on the row
  - Include `claim_trust_level: level` in both the UPDATE payload and INSERT payload
  - Depends on: tasks 1, 3
  - Verify: manual — claim a test profile with a gmail address, check `select claim_trust_level from business_profiles where id = ...`

- [ ] **6. Write `provider_activity` row + Slack on `low`**
  - Files: `app/api/claim/finalize/route.ts` (same edit as task 5)
  - After the successful UPDATE/INSERT, if `level === 'low'`:
    - Insert `provider_activity` row: `{ provider_id: <bp.id>, event_type: 'suspicious_claim', metadata: { email, trustReason, trustLevel: 'low' } }`
    - Call `sendSlackAlert(slackSuspiciousClaim(...))` — fire-and-forget, wrapped so failure never breaks the claim (match existing pattern at lines 296–311)
  - Depends on: tasks 2, 4, 5
  - Verify: manually test with a mismatched email, confirm activity row exists + Slack message arrives

### Phase 4: Admin Activity Center filter

- [ ] **7. Add filter option**
  - Files: `app/admin/activity/page.tsx` (edit, around line 637)
  - Add `{ value: 'suspicious_claim', label: 'Suspicious claims' }` to `PROVIDER_EVENT_FILTER_OPTIONS`
  - Depends on: task 6
  - Verify: open `/admin/activity`, switch to Providers tab, open filter dropdown — new option appears; selecting it shows only suspicious claim rows

- [ ] **8. Confirm admin API passes through new event_type**
  - Files: `app/api/admin/activity/route.ts`
  - Read the query — if it filters `event_type` against an allowlist, add `suspicious_claim`; if it passes through whatever filter string arrives, no change needed
  - Depends on: task 7
  - Verify: GET `/api/admin/activity?tab=providers&filter=suspicious_claim` returns expected rows

- [ ] **9. Row rendering — make sure the new event_type renders sensibly**
  - Files: `app/admin/activity/page.tsx` (row formatter code — likely a switch statement on `event_type`)
  - Add a case for `suspicious_claim` that shows: provider name, claimed-by email, trust reason. Use a red/amber accent to make it visually distinct
  - Depends on: task 7
  - Verify: row displays correctly in admin UI

### Phase 5: End-to-end verification

- [ ] **10. Smoke test all three tiers**
  - Create three test claim scenarios (can be done with test-provider script or direct DB insert → simulated token):
    - high: `admin@sunriseseniorliving.com` on "Sunrise Senior Living"
    - medium: `sunrise.senior@gmail.com` on "Sunrise Senior Living"
    - low: `randomuser99@gmail.com` on "Sunrise Senior Living"
  - Confirm: column written correctly, activity row only for low, Slack only for low
  - Depends on: all prior
  - Verify: see success criteria

- [ ] **11. Regression check**
  - Run `npm run build` to catch TS errors
  - Run lint
  - Verify an existing `.org` / corporate-domain claim still finalizes cleanly (no error, writes `high`)
  - Depends on: task 10

## Risks

- **Migration ordering** — if code deploys before the migration runs, the INSERT with `claim_trust_level` will fail the CHECK constraint, or the `suspicious_claim` event insert will violate its constraint. **Mitigation**: land migrations first, wait for Supabase to apply, then merge code. Supabase is shared staging + prod (see memory `reference_supabase_single_instance.md`) — one migration is enough.
- **Silent failures on `provider_activity` event_type constraint** — past incidents where CHECK-constrained event writes fail without visible errors. **Mitigation**: task 2 verifies by inserting + rolling back before task 6 ships; task 6 wraps the insert in a try/catch that logs (don't silently swallow).
- **LLM latency in finalize** — Haiku is ~800ms but could spike. Claim finalize is not a hot path but the provider is waiting. **Mitigation**: 5s timeout, LLM error falls back to `medium` (silent, not `low`). Fast-path handles `.gov`/`.edu` without LLM call.
- **LLM misclassification** — charitable prompt means some mid-suspicious claims land as `medium` and don't alert. **Acceptable** since ticket says we're not blocking and just want admin signal. Tune prompt + downgrade threshold in followups based on what admins see.
- **LLM cost runaway** — if claim volume spikes 10x, cost goes from $1.50 → $15/mo. Still cheap, but worth a console log of claim rate we can monitor.
- **Finalize race retry** — the route already handles 23505 (unique violation retry at line 106). New column is nullable, new event insert is separate statement, so race doesn't re-enter the trust scoring. Safe.

## Out of Scope (explicit)

- Blocking the provider (ticket)
- Retroactive scoring of already-claimed rows (follow-up candidate)
- Changing the provider-facing one-click UX
- Dashboards / metrics for trust-level distribution

## Branch + PR shape

- Branch from `staging` (per CLAUDE.md workflow)
- One PR bundling everything — migrations + scoring + UI filter + Slack
- PR target: `staging`
- Tag `@logan` for review once up

## Notes

- Hook decision was judgment call: only `finalize` is the true email↔profile binding point. `validate-token` and `auto-sign-in` happen before the UPDATE/INSERT. Scoring twice would duplicate work and create drift.
- `claim_trust_level` is nullable so existing rows don't need backfill — follow-up task if TJ wants historical scoring.
- Generic-domain list stays small (8–10 entries) and lives inline in `claim-trust.ts`. If this list grows, move to a Supabase lookup table.
