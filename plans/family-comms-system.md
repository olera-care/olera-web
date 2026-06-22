# Family Comms Intelligence System — Build Plan

**Branch:** `mighty-carson` · **Date:** 2026-06-22 · status: building
Companion to `plans/provider-comms-gate.md` (the provider-side precedent this mirrors).

## Why

Family (care-seeker) email is sent by **7 independent crons** with no global coordination.
They avoid collisions today only by accident — staggered timing windows + per-flag
suppression — and there are **3 known unguarded overlaps** where one family can get two
emails in a day. Same firehose problem we already fixed for providers, minus the two
layers that fixed it:

1. **Governance cap** — `lib/email.ts` gates only `recipientType === "provider"`. Families
   have no frequency ceiling.
2. **Arbitration** — no single brain picks the *one best* message per family per cycle.

This plan adds both. The arbitration ladder also encodes the locked strategy
(`project_family_help_cascade`): **help cascade, not publish funnel** — connection-triggered
help is top priority; publish/completion nudges are demoted to the bottom.

## Part 1 — Family governance cap (independent, ships first)

Mirror the provider gate at `lib/email.ts:489`.

- `lib/email-governance.ts`:
  - `FAMILY_NUDGE_WEEKLY_CAP = 3`, reuse `NUDGE_WINDOW_DAYS = 7`.
  - `FAMILY_NUDGE_EMAIL_TYPES` (proactive nudges only — transactional/real-time EXEMPT):
    `family_outcome_check, family_provider_silent, family_never_engaged, day_10_awaiting,
    post_connection_followup, family_reach_out_nudge, family_nudge, go_live_reminder,
    stale_conversation, matches_nudge, provider_still_silent, dormant_reengagement,
    completion_nudge_1..4, completion_maintenance, publish_nudge_1..4, publish_maintenance,
    monthly_recommendations, inactivity_reengagement`.
  - EXEMPT (never cap): `new_message, question_answered, question_confirmation,
    question_received, matches_live, compare_save_welcome, guide_download, guide_save,
    inline_answer_welcome, welcome, returning_signin, care_report, checklist, daily_digest,
    provider_reach_out, reach_out_confirmation, reach_out_auto_declined, review_request,
    connection_sent, connection_request, completion_celebration, verification_*`.
  - `isGovernedFamilyNudge(emailType)` helper.
- `lib/email.ts`: sibling branch to the provider gate. Family has no stable `provider_id`,
  so key on **`recipient` (email) + `recipient_type = 'family'`**, `status = 'sent'`,
  `email_type IN FAMILY_NUDGE_EMAIL_TYPES`, `created_at >= windowStart`. Same fail-open
  behavior (a missed cap beats a wrongly-dropped real notification). No schema change.
- Surfaces automatically in `/admin/automations` (already family-aware).

## Part 2 — Family Comms Coordinator (`family-comms-coordinator`)

One daily cron. For each candidate family: build context once, evaluate rungs top-down,
send the FIRST eligible rung's email (cap-checked), stamp that rung's existing dedup flag
(so it stays compatible with the paused originals) PLUS a unified
`metadata.last_coordinator_email_at` / `last_coordinator_rung`. `?dry_run=true` returns the
selection per family without sending. Recorded via `withCronRun("family-comms-coordinator")`.

### The ladder (priority order — first match wins)

**Rung 0 — GLOBAL STOPS** (skip family entirely, no email):
- `from_profile.metadata.nudges_unsubscribed === true`
- Family self-reported outcome `=== "yes"` on any connection
- Family is in an *active live conversation* (provider responded AND family replied, thread
  activity < 7d) — never interrupt a working thread.

**Rung 1 — Outcome check (the self-report sensor)** → `family_outcome_check`
Inquiry 48–72h old; no `metadata.outcome`; no `outcome_check_sent_at`; no provider message
in thread. *This is the help-cascade's sensing layer.*

**Rung 2 — Provider silent → alternatives** → `family_provider_silent`
Inquiry 96–120h; family engaged (sent ≥1 msg); no provider responded anywhere; outcome ≠ yes;
no `family_alternatives_sent_at`; ≥3 responsive alternative providers exist (same city/state,
matching care_types, responded in last 60d).

**Rung 3 — Never engaged → resource** → `family_never_engaged`
Inquiry 120–144h; family NEVER sent a message in any connection; no provider responded;
outcome ≠ yes; no `family_never_engaged_sent_at`.

**Rung 4 — Awaiting match (warm hand)** → `day_10_awaiting`
Provider responded 9–11d ago; family hasn't replied since; no `day_10_awaiting_sent_at`.

**Rung 5 — Pending reach-out** → `family_reach_out_nudge`
`request` connection, status pending, ≥3d old; `family_reach_out_nudged_at` unset or >7d.

**Rung 6 — Lead follow-up** → `family_nudge` (incomplete) / `go_live_reminder` (≥60% unpublished)
Inquiry ≥2d; NOT (complete AND published); relevant nudge flag unset or >7d.

**Rung 7 — DEMOTED publish/completion sequences** (lowest)
The `family-nudges` profile-state sequences (completion, publish, monthly-recs,
reengagement). This is the funnel we are *demoting*, so it is the bottom rung by design.

### Decision: how to treat Rung 7 (the family-nudges state machine)

`family-nudges` is a ~10-variant state machine (completion_sequence, publish_sequence,
monthly_recommendations, post_connection_followup, inactivity_reengagement). Faithfully
rewriting it into the coordinator is high-risk churn **on the exact funnel we're demoting**.

**Chosen approach:** coordinator fully owns Rungs 0–6 (the help cascade — the valuable,
strategic part). `family-nudges` stays as its own cron but is **subordinated**: (a) it's now
governed by the family cap, and (b) it gains a coordinator-awareness guard — skip any family
with `last_coordinator_email_at` within the current cycle. Net effect: the coordinator wins
every collision; publish/completion only fire when the cascade had nothing to say. We get the
full arbitration benefit without rewriting the demoted machine. Rung 7 can be absorbed later
if it ever earns the investment (it's being demoted, so probably not).

### Rollout / safety

1. Land cap (Part 1), verify in `/admin/automations`.
2. Land coordinator with all rungs behind `?dry_run=true`. Validate selections against live
   data before any real send.
3. Add to `lib/crons/registry.ts` + `vercel.json` (drift guard requires both).
4. Flip the 6 connection-triggered crons OFF via `cron_config` pause (NOT code deletion —
   keep them pausable/revertible). Coordinator becomes the single sender for those rungs.
5. `family-nudges` stays ON but subordinated (cap + coordinator-awareness guard).
6. Rollback = unpause the 6 crons + pause the coordinator in `cron_config`. No deploy needed.

### Migration / schema

No new schema for the cap. Coordinator reuses existing metadata flags + adds
`last_coordinator_email_at` / `last_coordinator_rung` (free-form `connections.metadata` /
`business_profiles.metadata`, no migration). Migration 115 (self-report event type) still
must be applied before the outcome-check rung sends in prod.
