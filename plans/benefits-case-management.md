# Benefits case management — the caseload view

Approved by TJ 2026-07-28, one PR. Branch `benefits-case-management` off
staging (post-#1406 promote). Timing constants UNCHANGED (0 / 2-3 / 5-6
sequence stays; revisit with first-cohort data next week).

## Scope (agreed)

1. **Registry truth-up** — lib/crons/registry.ts entry
   `family-comms-coordinator`: description + recipientCohort must include the
   benefits rungs (B1 first step day 2-3, B2 check-in day 5-6 w/ done-retarget,
   consent-gated SMS mirrors), completion track (Track 2), and that benefits
   families are in cohort (not just connection families).

2. **Stuck states** (lib/family-comms/benefits-cascade.server.ts):
   `caseStatus(cascade, lastViewedAt, now)` returning:
   - `wants_help` (existing outcome)
   - `silent_after_checkin` — check_sent_at ≥4d, no outcome
   - `action_stall` — plan viewed (benefits_results_tokens.last_viewed_at
     AFTER first_step_sent_at) but no first_step_done_at ≥4d after send
   - `attention_stall` — first_step_sent_at ≥3d, plan never viewed since send
   - else null (healthy/matched/moving/resolved)
   Resolved/contacted (case actions) suppress the float.

3. **Families API** (app/api/admin/benefits/families/route.ts): add per-row
   `caseStatus` + `case` (notes count, contacted_at, resolved_at) and float
   order: wants_help > silent_after_checkin > action_stall > attention_stall >
   rest newest-first. Summary counts stuck totals.

4. **Timeline drill-in** — new GET
   /api/admin/benefits/families/[profileId]/timeline (admin-authed):
   chronological events assembled from:
   - seeker_activity (benefits_completed, profile_enriched, benefits_outcome_reported)
   - email_log (email_type in benefits_results_saved/benefits_first_step/
     benefits_check_in; sent + first_opened_at + first_clicked_at)
   - benefits_cascade stamps (first_step_sent/sms/done, check_sent/sms,
     outcome, docs_checked count)
   - benefits_results_tokens.last_viewed_at
   - case actions (notes/contacted/resolved)
   Render in BenefitsFamiliesView as expandable row (client fetch on expand).

5. **Case actions** — POST
   /api/admin/benefits/families/[profileId]/case (admin-authed):
   { action: "note", text } | { action: "contacted" } | { action: "resolved" }
   → profile metadata.benefits_case = { notes: [{at, by, text}] (cap 20),
   contacted_at, resolved_at }. by = admin display name. UI: buttons + note
   input in the expanded row; error feedback (fb:error_feedback_first).

6. **Signed-in acknowledgement** — app/m/[token]/page.tsx: createServerClient
   auth.getUser(); if user's account owns this profile (accounts.user_id →
   account_id match), pass signedIn to BenefitsHome → quiet line under
   greeting: "Saved to your account." (no em dashes).

7. **Explicitly out**: B3 auto-email (silent families route to human), SMS
   short-link auth, queue pagination changes.

## Validate

tsc; local test of caseStatus edge cases via probe script; drill-in +
actions exercised on dev server against shadow family
(tfalohun+prodtest@gmail.com — KEEP, do not delete; TJ's live cascade QA);
pre-test review; PR → staging.

## Status
- [x] Branch
- [ ] Registry truth-up
- [ ] caseStatus helper
- [ ] Families API stuck states + float
- [ ] Timeline endpoint + expandable row UI
- [ ] Case actions endpoint + UI
- [ ] Signed-in line
- [ ] Validation + PR
