# Provider Comms Frequency Gate — Phase 1 Spec

**Decided 2026-06-09 with TJ.** Builds on the provider-comms governance decision (memory `project_provider_comms_governance`).

## Goal
No provider receives more than **3 nudge emails per rolling 7 days**. Transactional / real-time emails always send and never count toward the cap. One chokepoint (`sendEmail`), impossible to bypass.

## Locked decisions
- **Flat cap of 3 nudges / rolling 7 days.** No priority tiers in v1 (defer to v2 only if data shows low-value nudges crowding out high-value ones).
- **Transactional always sends, never counts.** "Did a family/system do something the provider needs to know?" = transactional. "Are *we* prodding them?" = nudge.
- **Gate lives inside `sendEmail`** (extends the existing bounce/complaint suppression block, ~lines 320–334, which already returns `{ skipped: true }`). Global the moment it ships; rollout scope is controlled by the size of the nudge list.
- `new_review` and `first_lead_celebration` → transactional (real events).

## Classification (start the nudge set with the 3 highest-volume, expand later)
**Initial NUDGE set:** `weekly_analytics_digest`, `unread_reminder`, `provider_followup_day1|day3|day6|day10|day17|provider_followup` (lead-followup-sequence).
**Full nudge set (add incrementally):** + `provider_nudge`, `stale_conversation`, `dormant_reengagement`, `provider_still_silent`, `post_connection_followup`, `matches_nudge`, `matches_encouragement`, `provider_incomplete_profile`, `profile_incomplete_nudge`, `go_live_reminder`, `review_request`, `provider_milestone`, `provider_anniversary`.
**Transactional (always send):** `connection_request`, `question_received`, `new_message`, `connection_response`, `new_review`, `first_lead_celebration`, all `verification_*`, `welcome`/`provider_welcome`, `provider_reach_out` + confirmations.

---

## ⛔ Task 0 — Canonical provider identity (BLOCKER — must resolve first)
The audit (2026-06-09) found the three target senders stamp `email_log.provider_id` in **different identifier spaces**:
- `weekly-provider-digest` → the `provider_activity` loop id (slug OR legacy alphanumeric, resolved from `provider_questions`/`provider_activity`).
- `lead-followup-sequence` → `group.providerSlug` = `toProfile.slug || source_provider_id || toProfile.id`.
- `unread-reminders` → `recipientProfileId` = **`business_profiles.id` (profile UUID)** (set in `reserveEmailLogId`, route line ~248).

**Consequence:** the same provider is keyed up to 3 different ways → the gate's per-provider count fragments → the cap leaks. The gate cannot work until every nudge sender stamps ONE canonical key.

**Open decision — what is canonical?** Recommendation: the **`provider_activity`/slug space** (slug → source_provider_id → profile id fallback), because the conversion dashboard + question-decay + `email_log.provider_id` were all built around that space (email_log.provider_id was added specifically to join against provider_activity). 
**But verify first:** what space is `provider_activity.provider_id` / `provider_questions.provider_id` actually in, and is it *consistent* across event sources? (Legacy rows have random-prefix ids — see memory `feedback_provider_id_legacy_format`.) This investigation gates the whole build.

**Task 0 work once canonical key is confirmed:**
- `unread-reminders`: stop stamping the raw profile UUID; resolve profile → canonical (add `slug, source_provider_id` to the `business_profiles` select at line ~186, stamp that in `reserveEmailLogId`).
- `lead-followup-sequence`: verify `providerSlug` lands in the canonical space (it mostly does; the `|| toProfile.id` fallback diverges for providers with no slug/source_provider_id).
- `weekly-provider-digest`: already canonical.
- **Acceptance:** a single physical provider produces ONE `provider_id` value across all three senders' `email_log` rows.

## Task 1 — Nudge classification (`lib/email-governance.ts`)
`NUDGE_EMAIL_TYPES: Set<string>` (start = the 3) + `isGovernedNudge(type)`. Default = send freely. Log when a `recipientType:"provider"` email's type is in neither list (gap detection).

## Task 2 — The gate in `sendEmail` (`lib/email.ts`)
After the existing suppression block: `if (recipientType === "provider" && providerId && isGovernedNudge(emailType))` → count this provider's *sent* nudge rows in `email_log` (type ∈ nudge set, `created_at >= now-7d`). If `>= 3` → `return { success: true, skipped: true, reason: "nudge_cap" }`, log, don't send. One indexed query per nudge send (`idx_email_log_provider_id`). Single-recipient only (matches existing suppression scope).

## Task 3 — Stateful senders honor `skipped`
- `lead-followup-sequence`: on `skipped`, do NOT advance `followup_stage`/`followup_sent_at` — retry next run.
- `unread-reminders`: on `skipped`, don't bump `unread_reminder_count`/`last_reminder_sent_at`.
- `weekly-digest`: count as skipped, not sent (run-summary cosmetic).

## Rollout & rollback
Ship with the 3-type nudge set; watch per-provider `email_log` volume. Expand the set in follow-ups. No env killswitch (slow-leak rule) — code revert is the rollback; transactional-always-send default means a misclassification can't suppress a real lead.

## OUT of Phase 1
Priority tiers, the other ~12 nudge types, per-type unsubscribe granularity, day-staggering the digest (falls out free later), consolidating redundant crons.
