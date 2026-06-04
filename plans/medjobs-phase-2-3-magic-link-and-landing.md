# Phase 2+3 — Magic Link + Provider Landing Experience

Status: **SKELETON** (scope locked from Logan-approved bullets 2026-06-04; full detail pass before build starts)
Coupling: **Ships to prod together** — Phase 2 alone would land magic-link clicks on the existing redacted/paywalled candidate board (broken interim state)
Branch: `medjobs/phase-2-3-magic-link-landing` (created off `staging` when Phase 1 ships)
Owner: Claude (build) + Logan (approval gate before build starts)

## Goal

Cold providers click the magic-link CTA in their outreach email → silently authenticated via JIT account creation → land on the candidate board in preview mode with the empty-state ladder rendering whatever it can show for their catchment.

## Phase II bullets (outbound communication layer)

1. **Magic-link token infrastructure** — `lib/medjobs/welcome-token.ts` with sign / verify / JTI revocation set / 30-day TTL
2. **Magic-link landing route** — `/medjobs/m/[token]` server handler that decodes token, runs `auto-sign-in`, creates account just-in-time if needed, redirects to candidate board
3. **Account/profile resolution at click** — advance axis 1 (auth) + axis 2a (account linkage). **Do NOT touch `claim_state`** (waits for terms acceptance in Phase 5 to avoid spurious cron triggers)
4. **Co-tenancy edge case** — when `business_profile.account_id` is already a different user, sign in but stay in read-only mode + emit `note_added(reason: "claim_conflict")` admin task
5. **Token security** — one-shot JTI redemption, signature verification, expiry handling, "this link expired" page on failure
6. **New provider email templates** — Day 0 / Day 3 / Day 7 with "Review {campus} student caregivers →" CTA pointing at `olera.care/medjobs/m/<token>`
7. **Brand-consistency one-liner** in email body ("…you'll land on olera.care, our main platform")
8. **Audit touchpoint** — `note_added(reason: "platform_visited")` emitted on successful magic-link click

## Phase III bullets (provider landing experience)

1. **`pilot_active_through` field** added to `business_profiles.metadata` (no migration; JSONB extension)
2. **Pilot tier predicate** — extend `medjobs_subscription_active` to OR-include pilot membership (Option A — single predicate, single source of truth)
3. **Candidate board preview mode** — pre-pilot signed-in accounts see preview cards (no contact info, action buttons disabled with action-verb tooltips like "Accept the pilot agreement to invite")
4. **Candidate board full mode** — pilot-active accounts see full cards (existing behavior; the pilot-tier predicate gates this)
5. **Catchment filtering on the board** — filter to the provider's campus / catchment area by default
6. **Empty-state ladder component** — `EmptyCandidates.tsx`: real local students → sample students from peer campuses → labeled demo (Logan profile) → "recruiting in progress" momentum banner
7. **Demo profile setup** — Logan's bio + photo rendered with prominent DEMO badge when this rung is filled

## Canonical detail to write before build starts

Before this branch is cut, a detail-pass updates this skeleton with:
- File-by-file change spec (paths + lines + responsibilities)
- UX wireframes (especially for the preview-mode board + empty-state ladder)
- Token schema + signature scheme (JWT? Branca? Paseto?)
- Smoke-test scenarios per ticket
- Acceptance criteria for the phase as a whole
- Demo-profile copy + photo source for Logan
- Catchment-filter logic (existing predicate or new?)

That detail pass is its own ~2 days of strategy work, scheduled to run during Phase 1 build (parallel).

## Acceptance criteria (placeholder)

Will be refined during detail pass. Provisional:
- Real cold provider clicks magic link → lands authenticated on candidate board within ~2 seconds
- Pre-pilot board shows preview cards (no contact info, disabled action buttons with action-verb tooltips)
- Empty-state ladder displays the correct rung for the provider's catchment
- Co-tenancy conflict properly creates admin reconcile task instead of blocking the signed-in session
- "This link expired" page renders gracefully for expired tokens

## Build log

(populated during build)

## Open issues / mid-build findings

(populated during build; cross-reference `medjobs-known-issues.md`)

## References

- Master plan: [`medjobs-master-plan.md`](medjobs-master-plan.md) § 4.5, 4.6, 4.7, 4.8, 4.12, 4.14, 4.16, 6.7
- v3 post-launch plan: [`post-launch-outreach-redesign-plan.md`](post-launch-outreach-redesign-plan.md) § P1.D, P1.E (the T0–T10 journey is the canonical reference for this phase), P1.F, P1.I
- Logan's 10-bullet framing (in thread 2026-06-04): items 1, 2, 5, 7
