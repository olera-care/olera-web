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

## Task 0 — Canonical provider identity (RESOLVED by data 2026-06-09)
Identity investigation (sampled live `email_log` / `provider_activity` / `provider_questions` + membership tests) settled this empirically — no judgment call:
- `provider_activity.provider_id`: **100% slug-ish**, resolves **96% to `olera-providers.slug`** (0% to `business_profiles.id`). Consistent — **no legacy-id mix in live data.**
- `weekly-provider-digest` email_log: 99% slug. **Already canonical.** ✅
- `lead-followup-sequence` email_log: 98% slug (`providerSlug` = `slug || source_provider_id || profile id`). **Already canonical.** ✅
- `unread-reminders` email_log: **100% `business_profiles.id` (profile UUID)** — the lone outlier. Zero raw-id overlap with the digest.

**Canonical key = the slug space** (`olera-providers.slug` == `provider_activity.provider_id` == `business_profiles.slug` for claimed). Confirmed it works for unread's providers: all 108 sampled have a `business_profiles.slug`, and 90% resolve straight into `provider_activity.provider_id` (the 10% just have no recent activity — not a format mismatch).

**The ONLY fix needed:** `unread-reminders` — add `slug, source_provider_id` to the recipient `business_profiles` select (~line 186) and stamp `recipient.slug || recipient.source_provider_id || recipientProfileId` (mirroring lead-followup's chain) instead of the raw `recipientProfileId` in `reserveEmailLogId` (~line 248). digest + lead-followup unchanged.
- **Acceptance:** a single physical provider produces ONE `provider_id` value across all three senders' `email_log` rows.

## Task 1 — Nudge classification (`lib/email-governance.ts`)
`NUDGE_EMAIL_TYPES: Set<string>` (start = the 3) + `isGovernedNudge(type)`. Default = send freely. Log when a `recipientType:"provider"` email's type is in neither list (gap detection).

## Task 2 — The gate in `sendEmail` (`lib/email.ts`)
After the existing bounce/complaint suppression block: `if (recipientType === "provider" && providerId && isGovernedNudge(emailType))` → count this provider's nudge rows in `email_log` where `email_type ∈ nudge set AND status = 'sent' AND created_at >= now-7d`. If `>= 3` → mark the reserved row (if `existingLogId`) `status:"failed", errorMessage:"nudge_cap"` (mirrors the bounce-suppression path at ~line 330), `return { success: true, skipped: true }`, don't send.
- **`status = 'sent'` filter is mandatory:** `reserveEmailLogId` writes a `pending` row BEFORE the send (so the in-flight send's own row must not self-count), and suppressed sends are `failed` (must not count). Confirmed lifecycle: pending → sent/failed.
- One indexed query per nudge send (`idx_email_log_provider_id`). Single-recipient only (matches existing suppression scope).

## Task 3 — Stateful senders honor `skipped` (only on `skipReason === "nudge_cap"`)
`sendEmail` now returns `skipReason` ("nudge_cap" | "suppressed" | "preference_disabled"). Crons hold state ONLY for `nudge_cap` (retry when budget frees); other skips fall through and advance as before (so a dead address isn't retried forever).
- `lead-followup-sequence`: on nudge_cap, don't advance `followup_stage`; count under `skipReasons.nudge_cap`.
- `unread-reminders`: on nudge_cap, don't bump `unread_reminder_count`/`last_reminder_sent_at`.
- `matches-unread`: **added (4th sender)** — it ALSO emits `unread_reminder` to providers (a known collision), so without it the cap on that type would leak. Now stamps the canonical slug + honors nudge_cap.
- `weekly-digest`: stateless per run; `sent` counter may cosmetically over-count a capped send (email_log is the truth). Left as-is.

### Pre-test notes — other senders of gated types (documented, out of Phase 1)
- `reengagement-blast` (admin, one-shot) emits `provider_followup_day17`+`provider` → gated, correctly keyed. Targets dormant providers (under cap), no recurring state → negligible impact; doesn't honor skip (harden later if needed).
- Admin manual sends (`connections/[id]`, `admin/emails`) can emit `unread_reminder` → also subject to the gate by design. Rare; no recurring state.
- `student-outreach` / `medjobs`: `provider_followup` is a cadence/template name there; those paths do NOT route through `sendEmail` → NOT gated. Verified.

## Rollout & rollback
Ship with the 3-type nudge set; watch per-provider `email_log` volume. Expand the set in follow-ups. No env killswitch (slow-leak rule) — code revert is the rollback; transactional-always-send default means a misclassification can't suppress a real lead.

## OUT of Phase 1
Priority tiers, the other ~12 nudge types, per-type unsubscribe granularity, day-staggering the digest (falls out free later), consolidating redundant crons.
