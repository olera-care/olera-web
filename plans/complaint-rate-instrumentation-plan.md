# Plan: Surface Real Email Complaint-Rate (+ Bounce-Rate) with Threshold Alert

Created: 2026-06-15
Status: Implemented — pending staging QA. Discrepancy investigated (benign: manual suppression) + Notion card filed.
Branch from: `staging` → PR to `staging`

## Goal
Replace the misleading "0.00% by absence" reading with a real, account-wide email complaint-rate and bounce-rate in the admin email cockpit, colored against Resend's suspension thresholds — so the crown-jewel transactional account can't drift toward shutdown silently.

## Why (from /explore — verified against live code + DB)
- The complaint path is **NOT blind.** `supabase/functions/resend-webhook/index.ts` handles `email.complained` correctly and writes `email_events` (+ stamps `email_log.complained_at`) in real time (`received_at` ~2s after `occurred_at`).
- The gap is **display only**: no percentage is computed anywhere — admin shows raw counts, which over a window read as "0" and feel healthy.
- **Real numbers right now:** 30d complaint rate = **0.039%** (4 events / 10,184 delivered), 7d = 0.037%. That's ~half of Resend's **0.08%** suspension line, on the same account as auth/transactional. Bounce 30d = 2.87%.
- The headline number must come from `email_events` (4 distinct webhook events), **not** `email_log.complained_at` (12 — inflated by an 8-row same-timestamp fan-out for one recipient, `rdoyle@rlcommunities.com`).

## Locked Decisions (from clarifiers)
1. **Numerator** = `email_events` distinct complaint/bounce webhook events (`event_type` in `complained`/`bounced`, `occurred_at >= since`).
2. **Window / denominator** = trailing 30d, **complaints / delivered** (delivered = `email_log.delivered_at` count in window, which the automations route already sums per type).
3. **Scope** = compute `complaintRate30d` + `bounceRate30d` and render as colored % with thresholds. The `email_events` 4-vs-12 `email_log` discrepancy is **out of scope** → follow-up ticket.

## Design Decisions (made during planning)
- **Single authoritative home: the automations page** (`/admin/automations`) — it's the email-ops cockpit and already shows account-wide 30d counts (line 241). The account-wide rate lives here.
- **Do NOT touch the analytics page "Bounces & complaints" section** (`app/admin/analytics/page.tsx:786-805`). Those `f.bounced`/`f.complained` are **Q&A-cohort-scoped** (filtered to `question_received`/provider). Adding an account-wide rate there would conflate two different denominators. Leave it as honest Q&A counts.
- **Per-job rollups stay `email_log`-sourced** — per-type attribution needs `email_type`, which lives on `email_log`, not `email_events`. Only the account-wide *headline rate* switches to `email_events`.
- **Add exported threshold constants** to `lib/email.ts` — the `0.08%`/`4%` numbers are currently comment-only (lib/email.ts:133-134), not real constants.

## Thresholds (color logic)
| Metric | Yellow (warn) | Red (danger) | Source |
|---|---|---|---|
| Complaint rate | > 0.04% | > 0.08% | Resend AUP 0.08% |
| Bounce rate | > 2% | > 4% | Resend AUP 4% |

At today's data: complaint 0.039% → **just under yellow**; bounce 2.87% → **yellow**. (Good — proves the color logic renders, not a flat green.)

## Success Criteria
- [ ] `/admin/automations` shows a real **Complaint rate (30d)** and **Bounce rate (30d)** as percentages, not raw counts.
- [ ] Complaint-rate numerator comes from `email_events` distinct events (matches Resend's count = 4/30d), not `email_log` (12).
- [ ] Rates render colored: yellow at half-threshold, red at the AUP line.
- [ ] Raw event counts still visible (rate alone is meaningless without n).
- [ ] `npx tsc --noEmit` clean; page renders without runtime error.
- [ ] No change to the analytics page Q&A bounce/complaint section.

## Tasks

### Phase 1: Constants
- [ ] 1. Add exported threshold constants to `lib/email.ts`
      - `RESEND_COMPLAINT_LIMIT = 0.0008`, `RESEND_COMPLAINT_WARN = 0.0004`, `RESEND_BOUNCE_LIMIT = 0.04`, `RESEND_BOUNCE_WARN = 0.02`
      - Files: `lib/email.ts` (near the comment at :133)
      - Verify: `npx tsc --noEmit` clean; importable.

### Phase 2: Backend rate computation
- [ ] 2. In the automations route, query `email_events` for 30d complaint/bounce event counts
      - Add a `db.from("email_events").select("event_type").in("event_type", ["complained","bounced"]).gte("occurred_at", since).limit(...)` block (fail-soft, like the existing email_log try/catch). Tally `complaintEvents30d` / `bounceEvents30d`.
      - Files: `app/api/admin/automations/route.ts` (after the byType block ~:111)
      - Depends on: none (independent of task 1)
      - Verify: log/inspect — expect complaintEvents30d ≈ 4, bounceEvents30d ≈ 308.
- [ ] 3. Compute rates + extend the `summary` object
      - delivered30d = sum of `byType[*].delivered`; sent30d = sum of `byType[*].sent`.
      - `complaintRate30d = delivered30d ? complaintEvents30d/delivered30d : 0`; same for bounce.
      - Add `complaintRate30d`, `bounceRate30d`, `complaintEvents30d`, `bounceEvents30d`, `delivered30d` to the returned `summary`.
      - Keep existing `complaints30d`/`bounces30d` (email_log) for backward compat.
      - Files: `app/api/admin/automations/route.ts` (summary assembly)
      - Depends on: 2
      - Verify: hit `GET /api/admin/automations` (admin session), confirm `summary.complaintRate30d` ≈ 0.00039.

### Phase 3: UI
- [ ] 4. Add the type fields + render colored rate StatCards
      - Extend the `summary` TS interface (automations page :46) with the new fields.
      - Add two StatCards near line 241: "Complaint rate (30d)" and "Bounce rate (30d)", formatted as `%` (e.g. `(rate*100).toFixed(3)%`), with `danger`/warn coloring via the new constants, and the raw event count as `sub`.
      - Files: `app/admin/automations/page.tsx`
      - Depends on: 3
      - Verify: load `/admin/automations` — complaint card shows ~0.039%, bounce card ~2.87% yellow.

### Phase 4: Verify + ship
- [ ] 5. tsc + manual render check, then PR to staging
      - `npx tsc --noEmit` (run ONE at a time; kill strays first — see memory). Client component can throw despite tsc passing → load the page.
      - Files: none
      - Depends on: 4
      - Verify: page loads, numbers match the /explore diagnostic.

## Risks
- **Low volume = noisy.** 1 complaint swings the rate. Mitigated by 30d window + showing raw n alongside.
- **`email_events` query cost.** 53k rows total; filter by `event_type` + `occurred_at` uses `idx_email_events_type_occurred` (migration 051:49). Select only `event_type`. Fail-soft so a slow/absent table never breaks the cockpit.
- **Denominator mismatch.** delivered30d (email_log, keyed on `created_at`) vs complaint events (email_events, keyed on `occurred_at`) span slightly different cohorts at the window edge. Acceptable — directional KPI, not billing. Note in code comment.
- **Don't regress the analytics Q&A section** — explicitly out of scope; do not edit `app/admin/analytics/page.tsx`.

## Follow-up ticket (out of scope — file in Notion)
**Reconcile `email_events` (4) vs `email_log.complained_at` (12) complaint discrepancy.** The `rdoyle@rlcommunities.com` cluster (8 rows, identical `2026-06-06T17:04:35.556` timestamp across 8 email types) exists only in `email_log`, not `email_events` — a bulk/manual stamp or a lost-event path. Determine the source and make the two stores agree so suppression and any future per-recipient complaint logic don't double-count.

## Notes
- Webhook is confirmed healthy/live — no edge-function or Resend-dashboard work needed.
- Constants double as the single source of truth if we later add a Slack alert when the live rate crosses 0.08%.
