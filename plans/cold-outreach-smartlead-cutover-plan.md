# Plan: Migrate MedJobs Cold Outreach from Resend to Smartlead

Created: 2026-06-01 · Updated: 2026-06-01 (outcome-focused rewrite + Resend audit)
Status: Not Started — awaiting Logan's Phase 1 review + Phase 0 decisions

## What we're doing

We're moving **one specific kind of email** — the cold outreach emails MedJobs admins launch from the Pre-Flight checklist — from Resend to Smartlead. **Everything else Resend does today keeps working exactly as it does today.**

The admin user experience stays the same: same buttons, same modal, same Launch flow. The difference is invisible — emails arrive from `findmedjobs.co` instead of `olera.care`, sent via the warmed cold-outreach infrastructure we built for this purpose.

---

## Phase 1: Understand what currently uses Resend

**Goal:** Make sure we don't break any email Resend is currently sending.

**Success looks like:**
- We know exactly which emails stay on Resend (every transactional + system + user-facing email)
- We know exactly which emails move to Smartlead (only MedJobs cold outreach to providers)
- We have written confirmation that the migration touches ONLY the MedJobs cold-outreach pathway

### Resend Usage Audit — every Resend-powered email in the system

Audited 60 call sites. Categorized below. **Only the first row migrates. Everything else stays on Resend.**

| # | What the email does | Triggered by | MedJobs outreach? | Transactional/system? | Stays on Resend? | Moves to Smartlead? |
|--:|---|---|---|---|---|---|
| **1** | **MedJobs cold outreach (Day 0/3/7 emails to providers)** | **Admin clicks Launch in Pre-Flight modal** | **YES** | No | **NO** | **YES** ← *this migration* |
| 2 | Email OTP login codes | User logs in with email | No | Yes | YES | No |
| 3 | Account-creation confirmation | User signs up | No | Yes | YES | No |
| 4 | Provider claim-listing OTP | Provider claims their page | No | Yes | YES | No |
| 5 | Provider claim-listing welcome | Provider completes claim | No | Yes | YES | No |
| 6 | Provider verification email | Admin verifies a provider | No | Yes | YES | No |
| 7 | Provider verification reminders (cron) | Daily cron | No | Yes | YES | No |
| 8 | Connection request notifications (6 endpoints) | Family connects with a provider | No | Yes | YES | No |
| 9 | Connection-thread inbox messages | Family or provider replies in the inbox | No | Yes | YES | No |
| 10 | Connection compare/guide saves | Family saves a comparison | No | Yes | YES | No |
| 11 | Care-post publish notifications | Family publishes a care post | No | Yes | YES | No |
| 12 | Care-post activate-matches | Family activates matching | No | Yes | YES | No |
| 13 | Match "reach out" notifications | Family reaches out to a matched provider | No | Yes | YES | No |
| 14 | Inline-answer Q&A capture | Family answers a question inline | No | Yes | YES | No |
| 15 | Provider Q&A answer notifications | Provider answers a question | No | Yes | YES | No |
| 16 | Provider review-request emails | Admin requests reviews | No | Yes | YES | No |
| 17 | Public review notifications | Review submitted | No | Yes | YES | No |
| 18 | Family digest (daily/weekly crons) | Cron schedule | No | Yes | YES | No |
| 19 | Family nudges (admin-triggered + cron) | Admin/cron nudges a family | No | Yes | YES | No |
| 20 | Lead-response nudges (cron) | Provider hasn't responded | No | Yes | YES | No |
| 21 | Matches-unread reminders (cron) | Family has unread matches | No | Yes | YES | No |
| 22 | MedJobs **applicant** emails (apply, partial, apply-to-provider) | A student applies for a job | No (different direction) | Yes | YES | No |
| 23 | MedJobs **applicant** interview emails | Interview scheduled/changed | No (different direction) | Yes | YES | No |
| 24 | MedJobs admin digest/nudges (cron) | Admin daily/weekly summary | No | Yes | YES | No |
| 25 | Stripe payment confirmation/failure | Stripe webhook | No | Yes | YES | No |
| 26 | Slack workflow notifications | Slack interaction | No | Yes | YES | No |
| 27 | Benefits checklist + saved results | Care-seeker benefits tool | No | Yes | YES | No |
| 28 | "Staffing outreach V2" (legacy `lib/staffing-outreach/resend-automation.ts`) | RETIRED — not actively firing | No (retired predecessor of MedJobs) | N/A | YES (dead code, leave alone) | No |

**Key clarification on row 22-23:** The MedJobs APPLY endpoints are for **students applying for jobs**. They're transactional emails to applicants confirming their submission or notifying about interviews. They are NOT cold outreach to providers. They stay on Resend.

### Files we will touch in this migration

Only these files contain the MedJobs cold-outreach sending logic:
- `lib/student-outreach/email-send.ts` — the `sendOutreachEmail` function (row 1)
- `lib/student-outreach/auto-send-executor.ts` — the cron-driven executor that calls `sendOutreachEmail`
- `app/api/admin/student-outreach/[id]/route.ts` — the `schedule_sequence` action that admin's Launch button hits
- `components/admin/medjobs/ProviderPreFlightModal.tsx` — the UI

**The shared low-level wrapper `lib/email.ts:sendEmail` is NOT changed.** All 58 transactional call sites keep using it exactly as they do today.

### What needs to be true before Phase 2 starts

- [ ] Logan reviews the audit table above and confirms: "Yes, only row 1 moves to Smartlead. Everything else stays."
- [ ] Logan answers four product questions (see "Decisions" section below) so Phase 2 has a concrete spec.

---

## Phase 2: Connect Smartlead to MedJobs outreach

**Goal:** When an admin clicks Launch in the Pre-Flight modal, the emails ship through Smartlead — not Resend.

**Success looks like:**
- The admin clicks Launch on a provider row and Smartlead handles delivery
- No Resend send fires for that launch (verified by checking Resend's send log and Smartlead's campaign log)
- The MedJobs cold outreach pathway has exactly one engine: Smartlead. No fallback, no toggle, no env-var-gated branching.
- All other emails (rows 2-27) keep working

**What we'll do:**
- Remove the engine-flag plumbing (`MEDJOBS_OUTREACH_ENGINE` env var, `body.engine` override, conditional branches in `route.ts`). Smartlead becomes unconditional for provider rows.
- Add a safety net in the Resend executor: if a provider-row email task somehow reaches the cron (e.g., a stale task queued before the migration), it short-circuits and doesn't fire.
- Wire the campus PDF strategy (Smartlead UI templates per campus — see Decision D-0.3)
- Port the email footer to Smartlead's send pipeline so the body looks finished (Grazie + Logan signature blocks; see Decision D-0.1)

**How we'll know it's done:**
- Test row in staging → Launch → emails arrive from `logan@findmedjobs.co` or `partnerships@findmedjobs.co`
- Resend's dashboard shows zero outreach sends for the test row
- `git grep MEDJOBS_OUTREACH_ENGINE` returns zero hits in `app/` and `lib/`

---

## Phase 3: Verify outreach experience

**Goal:** The admin user experience after the migration is indistinguishable from before, except the email infrastructure is different under the hood.

**Success looks like:**
- The Launch Outreach UI still works exactly as it did
- General Contact emails still send correctly
- Specific Contact emails still send correctly (one per named contact)
- Email variables (campus name, provider name, first name, salutation) all render correctly
- The campus PDF arrives attached to every email
- Sender mailbox rotates between `logan@findmedjobs.co` and `partnerships@findmedjobs.co` across sends

**What we'll do:**
- Send test emails to your own inboxes (logan@olera.care, personal Gmail) via 3-5 test provider rows in staging
- Verify each personalization variable substitutes correctly per recipient
- Confirm the PDF arrives attached
- Confirm sender rotation by watching multiple sends

**How we'll know it's done:**
- You receive 5+ test emails covering both General Contact and Specific Contact paths
- Every email has the correct salutation ("Hello" for general, "Hi <First>" for named)
- Every email has the right campus name + provider name in subject and body
- Every email has the campus PDF attached
- Rotation is roughly 50/50 between the two sender inboxes across the test sends

---

## Phase 4: Verify workflow progression

**Goal:** The downstream operational workflow (calls, replies, meetings, status transitions, tracking) keeps working normally after a Smartlead launch — no card stuck, no broken state machine, no missing touchpoint.

**Success looks like:**
- Calls cadence (Day 0/1/5) queues correctly and appears in the Calls tab
- Replying to a Smartlead email surfaces the row in the In-Basket Replies tab within ~1 minute
- The row's status transitions correctly (e.g., reply moves it to "engaged")
- Bounces show as `bounce_fix` on the row
- Unsubscribes move the row to `do_not_contact`
- Opens and clicks are tracked on the row (engagement counters, not timeline noise)
- Meeting scheduling, partner conversion, distribution-evidence logging all still work

**What we'll do:**
- After Phase 3's test emails, run through the full downstream lifecycle on staging:
  - Reply to one → verify it lands in Replies
  - Log a "no answer" on a Day 0 call → verify the touchpoint
  - Mark "wants meeting" → verify the meeting flow
  - Mark partner conversion → verify the active_partner transition + distribution evidence
- Confirm the Smartlead webhook is wired to Supabase and fires for sends/replies/bounces/opens/clicks/unsubscribes

**How we'll know it's done:**
- Every step of the operational pipeline (Prospects → Calls → Replies → Meetings → Clients) progresses correctly for the test rows
- The webhook log shows events from Smartlead landing in Supabase
- The CRM timeline accurately narrates what happened on the test rows

---

## Phase 5: Validate and clean up

**Goal:** Cold outreach is fully running through Smartlead in production. Resend is still handling everything else. No regressions anywhere.

**Success looks like:**
- Smartlead is sending all MedJobs cold outreach in production
- Resend is still sending all transactional / system / user / notification emails (rows 2-27 above)
- The engine flag is gone from the codebase and from Vercel
- The Smartlead webhook is live in production
- TJ's campus-specific Smartlead sequence templates (with PDFs) are set up for the launch campuses
- Logan can be away for 2 weeks and Graize can launch new outreach campaigns without intervention

**What we'll do:**
- Operational cutover steps:
  - Set the Smartlead webhook secret in Supabase prod
  - Set the sender allowlist (`SMARTLEAD_SENDER_EMAILS`) in Vercel prod
  - Remove the demo `tj@findmedjobs.co` sender from Smartlead's account
  - Cancel any in-flight Resend-queued outreach tasks for provider rows (one SQL update)
  - Clear stale `research_data.smartlead` test data from prod (one SQL update)
- Launch one real prod outreach to confirm the production path works end-to-end
- Log the cutover in SCRATCHPAD + the canonical engineering brief (`docs/medjobs/OPERATIONAL_BRIEF.md`)

**How we'll know it's done:**
- One real prod outreach campaign launches successfully from the admin panel
- The downstream operational cards (Calls / Replies / Meetings) progress correctly
- Resend's dashboard shows transactional emails still flowing at normal rates
- No emails from rows 2-27 above have changed in any way

---

## Four product decisions Logan needs to make before Phase 2 starts

These are the decisions that determine the concrete shape of Phase 2's implementation. Each has a recommended answer based on what we've discussed; you just need to confirm or override.

### D-0.1 — Email footer for Smartlead-sent outreach

The Resend version of the cold outreach footer is:
- Grazie's signature block (headshot, name, role, email `graize@olera.care`)
- Horizontal divider with "Message Approved" label
- Your signature block (headshot, name, role, email `logan@olera.care`)
- "Reply STOP if you would like us to stop reaching out."

**Recommended (Option A):** Port the same structure to Smartlead. Drop Grazie's email line (she has no findmedjobs.co handle yet), keep yours as `logan@olera.care`, drop "Reply STOP" because Smartlead injects its own unsubscribe link.

**Why this matches what you said earlier:** You said "Grazie's block above Logan's block, with 'Message Approved' between" — Option A preserves that exactly.

### D-0.2 — The per-recipient body editors in the Pre-Flight modal

The modal today has editor blocks where admin can type changes to the email subject + body per recipient variant (general/named). **In Smartlead, these edits are silently ignored** — Smartlead always ships the canonical template from `templates.ts`.

**Recommended (Option A):** Remove the editor blocks from the Pre-Flight modal. Keep the Smartlead preview panel (which shows what will actually send, read-only). If template copy needs to change, it's a code change.

**Why:** Editing text that doesn't end up in the email is a UX bug. Better to hide it than mislead.

### D-0.3 — How the campus PDF gets attached

Smartlead's API does not support attachment uploads. The realistic options:

**Recommended (Option A):** TJ creates one Smartlead sequence template per campus (~25 templates over time), each with that campus's PDF pre-attached to each step. The bridge code creates campus campaigns FROM these templates. This is TJ's plan; he already has it partway built. *Risk: depends on Smartlead's `template_id` API behaving the way we expect — needs a 30-minute verification before we commit.*

**Fallback (Option B):** Instead of attached PDFs, include a link to the hosted PDF in the email body. Less compelling than attached, but unblocks launch if A doesn't work.

### D-0.4 — Stakeholder rows (advisor, professor, student org, dept head)

These are a separate, smaller cadence (warmer emails to campus contacts). They currently use Resend.

**Recommended (Option A):** Keep them on Resend. They're not cold outreach; they're closer to transactional intro emails. Scope of this migration stays on provider rows only.

---

## What we will NOT do as part of this migration

To keep this focused and safe, the following are explicitly out of scope:

- ❌ **Touching any of the 58 transactional Resend call sites** (rows 2-27 in the audit). They keep working exactly as they do today.
- ❌ **Migrating stakeholder cadences** (advisor / student org / dept head / professor) to Smartlead. They stay on Resend.
- ❌ **Building a hybrid mode, toggle, or fallback.** Smartlead is unconditional for provider rows once the cutover happens.
- ❌ **Rewriting the `lib/email.ts` low-level Resend wrapper.** It stays; transactional paths keep using it.
- ❌ **Retiring the `/api/cron/student-outreach-send` cron entirely.** It still serves stakeholder rows; we just gate it so provider rows can't accidentally fire through it.

---

## Risks & how we manage each

- **R-1: Smartlead's template_id API may not behave as expected.** This is the single highest-uncertainty technical item. We spike it BEFORE committing to Phase 2 — 30 minutes of testing with a real API call. If it fails, we fall back to D-0.3 Option B (link in body).
- **R-2: Per-mailbox daily send caps during late warmup.** Smartlead typically caps at ~20-50 sends/day per mailbox during the first few weeks even after mailboxes show ACTIVE. We launch slowly — 1-2 campuses per week post-cutover.
- **R-3: Smartlead's native unsubscribe block may render visually after our footer.** Could collide with the signature blocks. We send 3-5 test emails in Phase 3, eyeball the rendered output, adjust footer spacing if needed.
- **R-4: Stale Resend-queued outreach tasks at cutover time.** If a provider row had Day 0 sent by Resend pre-cutover and Day 3 is still queued, the Day 3 task would fire through Resend post-cutover. **Mitigation:** pre-cutover SQL to cancel all pending `outreach_email_send` tasks for provider rows. ~5 lines.
- **R-5: Stale test data in prod's `research_data.smartlead`.** Could collide with prod campaign IDs. **Mitigation:** pre-cutover SQL to clear that field from prod rows. One UPDATE.
- **R-6: Grazie has no findmedjobs.co email handle yet.** Her signature email line is removed under D-0.1 Option A. **Mitigation:** logged as a follow-up; when she gets one, restore the line. Not blocking.

---

## What gets logged where after the cutover

- SCRATCHPAD entry: "MedJobs cold outreach migrated to Smartlead, Resend remains for transactional. Cutover date: <date>."
- `docs/medjobs/OPERATIONAL_BRIEF.md`: update the engineering reference to say "Smartlead is the system of record for cold-outreach sends; CRM is the system of record for the operational state."
- This plan file gets marked Status: Complete with the cutover date.

---

## Open question for Logan before Phase 2 starts

Four answers needed:
1. **D-0.1 footer** — Option A?
2. **D-0.2 modal editors** — strip them?
3. **D-0.3 campus PDF** — Option A with the 30-min spike to confirm Smartlead's template API?
4. **D-0.4 stakeholder rows** — stay on Resend?

If all four are A/yes, Phase 2 implementation is ~6 hours of code + Phase 3 audit. If any decision goes a different direction, the spec adjusts and I'll re-estimate.

---

## Appendix: Technical task list (for engineer reference, hidden from the business view above)

<details>
<summary>Click to expand the full step-by-step technical breakdown</summary>

### Phase 2 implementation tasks

- [ ] T1. Remove the `engine` branch in `route.ts:handleScheduleSequence` (lines 1769-1779). For `kind='provider'`: always call `enrollRowIntoSmartlead`. Remove `body.engine` from the action's body type. Remove `outreach_engine` field from `DrawerContext`.
- [ ] T2. Gate `auto-send-executor.executeEmailTask` by row kind: provider rows return early with `outcome: "skipped_smartlead_owned"`. Belt-and-suspenders safety net.
- [ ] T3. Remove `MEDJOBS_OUTREACH_ENGINE` env var from Vercel staging + prod (operational step, post-merge).
- [ ] T4. Strip the variant editor blocks from `ProviderPreFlightModal.tsx`. Remove `generalSnaps`/`namedSnaps` state, `defaults`, `updateGeneral`, `updateNamed`. `onSubmit` payload drops `email_snapshots_by_variant`. Server-side, make that field optional and treat absence as "use canonical templates."
- [ ] T5. Remove the `smartleadMode` ternary headers in the modal — there's only one mode now.
- [ ] T6. Port `composeFooterHtml` from `email-send.ts` to `lib/medjobs/smartlead-bridge.ts:toSmartleadHtml`. Adjust email lines per D-0.1.
- [ ] T7. Verify Smartlead's unsubscribe block renders correctly in the campaign settings (operational).
- [ ] T8. **SPIKE**: verify Smartlead's `template_id` parameter on `createCampaign` works (30 minutes, one real API call). If pass → proceed with T9-T11. If fail → fall to D-0.3 Option B (link in body).
- [ ] T9. TJ: build the first campus template in Smartlead UI (Texas A&M). Save as `medjobs-{slug}`. Operational.
- [ ] T10. Bridge resolves `template_id` from campus slug → template-id mapping. Source of truth: env var or new column on `student_outreach_campuses`.
- [ ] T11. TJ: build remaining ~24 campus templates over weeks (operational, non-blocking).

### Phase 3 verification tasks

- [ ] V1. Test row, General Contact = logan@olera.care, 2 Named Contacts (your inboxes). Launch → confirm preview shows correctly.
- [ ] V2. Manually START the campaign in Smartlead UI. Confirm Day 0 email arrives at all 3 inboxes within send window.
- [ ] V3. Re-run V1+V2 with 3-5 different campuses to confirm rotation across both sender mailboxes.
- [ ] V4. Confirm `{{salutation}}` substitutes per recipient ("Hello" vs "Hi <First>").
- [ ] V5. Confirm `{{company_name}}` + `{{campus}}` substitute correctly.
- [ ] V6. Confirm campus PDF arrives attached to every email.
- [ ] V7. Confirm signature blocks (Grazie + Logan) render in correct order with correct content.

### Phase 4 verification tasks

- [ ] V8. Reply to one test email → confirm `email_replied` touchpoint + row in Replies tab within ~1 min.
- [ ] V9. Open + click test → confirm `engagement.opens` + `engagement.clicks` increment on the row, NO timeline touchpoint.
- [ ] V10. Trigger bounce via Smartlead test address → confirm `email_bounced` touchpoint.
- [ ] V11. Click unsubscribe in test email → confirm `email_complained` touchpoint + row transitions to `do_not_contact`.
- [ ] V12. Phone present on test row → confirm 3 `outreach_followup_call` tasks queue on Day 0/1/5.
- [ ] V13. Log call no-answer → confirm `call_no_answer` touchpoint.
- [ ] V14. "Wants meeting" classifier → confirm meeting flow proceeds.
- [ ] V15. Partner conversion → confirm distribution evidence + `active_partner` transition.

### Phase 5 cutover tasks

- [ ] C1. Supabase prod: `supabase secrets set SMARTLEAD_WEBHOOK_SECRET=<random>`
- [ ] C2. Deploy webhook: `supabase functions deploy smartlead-webhook`
- [ ] C3. Smartlead UI: register webhook URL for all 6 event types with secret param.
- [ ] C4. Vercel prod: `SMARTLEAD_SENDER_EMAILS=logan@findmedjobs.co,partnerships@findmedjobs.co` + redeploy.
- [ ] C5. Confirm both mailboxes show `warmup_details.status === "ACTIVE"`.
- [ ] C6. Disconnect `tj@findmedjobs.co` from Smartlead account.
- [ ] C7. SQL: `UPDATE student_outreach_tasks SET status = 'cancelled' WHERE task_type = 'outreach_email_send' AND status = 'pending' AND outreach_id IN (SELECT id FROM student_outreach WHERE kind = 'provider')` — cancel in-flight Resend tasks for provider rows.
- [ ] C8. SQL: clear stale `research_data.smartlead` from any prod rows that have it from prior testing.
- [ ] C9. Launch one real prod provider outreach (Logan-picked, low-risk).
- [ ] C10. Update SCRATCHPAD + `docs/medjobs/OPERATIONAL_BRIEF.md`.
- [ ] C11. Mark this plan Status: Complete.

</details>
