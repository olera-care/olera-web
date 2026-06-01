# Plan: Complete Cold-Outreach Migration from Resend to Smartlead

Created: 2026-06-01
Status: Not Started — awaiting Logan approval + Phase 0 decisions

## Goal

Replace Resend with Smartlead for **all** MedJobs cold outreach (provider campaigns). No hybrid, no engine flag, no fallback. Resend keeps only its transactional jobs (provider notifications, password resets, lead emails, etc.). The admin pre-flight + Launch Outreach UI continues to work with no admin-visible change.

## Success Criteria

- [ ] Admin clicks Launch on a provider row → emails route through Smartlead, no Resend send fires
- [ ] Emails arrive from `logan@findmedjobs.co` OR `partnerships@findmedjobs.co` (rotated by Smartlead)
- [ ] `Graize Belandres` sender display name across both mailboxes
- [ ] Campus PDF attached to each step of each campaign (template-per-campus in Smartlead UI)
- [ ] One Smartlead lead per (General Contact + Specific Contact) — fan-out confirmed
- [ ] All leads for a campus enroll into the same campus campaign (sibling lookup)
- [ ] Replies land in CRM In-Basket Replies tab via webhook → `email_replied` touchpoint
- [ ] Calls cadence (Day 0/1/5) still queues as CRM tasks, surfaces in Calls tab
- [ ] Meetings, status transitions (engaged → meeting_scheduled → active_partner), distribution evidence, partner conversion all work via existing CRM actions
- [ ] `MEDJOBS_OUTREACH_ENGINE` env var no longer exists in code OR Vercel — Smartlead is unconditional
- [ ] `auto-send-executor.ts` + the `/api/cron/student-outreach-send` cron no longer fire for provider rows
- [ ] Zero Resend API calls for any `kind='provider'` outreach row

## Current Resend codepaths firing for cold outreach (must retire)

Mapped from this session's exploration:

| Codepath | What it does for cold outreach today | Retirement strategy |
|---|---|---|
| `route.ts:handleScheduleSequence` engine branch | Defaults to Resend when env unset; routes to Smartlead when set | **Delete the branch.** Always call `enrollRowIntoSmartlead` for `kind='provider'`. Stakeholder rows keep their current path (not in scope for this migration). |
| `route.ts:1769-1771` MEDJOBS_OUTREACH_ENGINE read | Reads env var to pick engine | **Delete.** Hardcode Smartlead for provider rows. |
| `body.engine` override field on schedule_sequence | Per-request engine override for testing | **Delete.** No longer needed. |
| `lib/student-outreach/auto-send-executor.ts:executeEmailTask` | Sends `outreach_email_send` tasks via Resend | **Gate by kind.** Skip provider rows entirely (return early with `outcome: "skipped_smartlead_owned"`). Stakeholder rows still use it. |
| `/api/cron/student-outreach-send` (every 15 min) | Polls for due `outreach_email_send` tasks | **Leave the cron.** With provider rows skipping email-task generation already (the existing Smartlead branch only queues call tasks), there are no provider email tasks for the cron to pick up. Cron continues serving stakeholder rows. |
| Pre-flight modal `email_snapshots_by_variant` payload | Admin's per-recipient body edits passed to Resend send | **Hide editors in Smartlead-owned flow.** Smartlead ships canonical templates from `templates.ts`; admin edits would be silently ignored. Keep the preview panel; remove the variant editors. |
| Pre-flight modal `call_scripts` payload | Per-day call scripts for CRM call tasks | **Keep.** Calls stay in the CRM — these still apply. |
| `email-send.ts:composeFooterHtml` | Resend-side footer (Graize block, Logan block, Reply STOP, signatures) | **Port to Smartlead.** Append the same footer to `buildEmailSequence` step bodies, with email addresses swapped to findmedjobs.co (Phase 0 decision). |
| `composeFooterHtml`'s "Reply STOP" line | Compliance unsubscribe footer | **Replace with Smartlead's native unsubscribe.** Smartlead injects a one-click unsubscribe link per recipient and surfaces it through the EMAIL_UNSUBSCRIBE webhook → maps to `do_not_contact` (already wired in Phase 2). |
| `lib/email.ts` (low-level Resend wrapper) | Generic Resend send helper used by transactional + outreach paths | **Leave.** Transactional uses it. The outreach call site will stop calling it (since auto-send-executor skips provider rows). |
| `supabase/functions/resend-webhook` | Resend → CRM events (delivered, opened, clicked, bounced, complained) | **Leave.** Transactional sends still fire it. No code change. |

## Phase 0: Decisions Logan must make BEFORE coding

These have been deferred since PR #907 and block a clean cutover. Each needs a yes/no or a choice.

### D-0.1: Smartlead-side footer/signature

The Resend footer is:
```
[Grazie signature block: headshot, name, role, graize@olera.care]
[divider]
"Message Approved"
[Logan signature block: headshot, name, role, logan@olera.care, www.olera.care]
[Reply STOP if you would like us to stop reaching out.]
```

**Option A (recommended):** Port the same structure to Smartlead. Swap email lines:
- Grazie's line: `graize@olera.care` → just remove the email (Grazie doesn't have a findmedjobs.co handle yet)
- Logan's line: `logan@olera.care` → leave as-is (still his identity)
- Drop "Reply STOP" line — Smartlead injects its own unsubscribe block

**Option B:** Build a leaner cold-channel footer (smaller, no signature blocks, just "Olera Inc. · Reply STOP / unsubscribe").

**Option C:** Skip footer entirely; rely on Smartlead's default unsubscribe block. Riskier for cold-email best practice (no physical address fails CAN-SPAM).

**Decision needed: A, B, or C?** My read: A. You confirmed earlier "Grazie's block above Logan's block, with 'Message Approved' between." Option A matches that.

### D-0.2: Per-recipient body editing in the modal

Currently the pre-flight modal lets admin edit subject + body per day per variant (general/named). This edit data is sent to the server as `email_snapshots_by_variant`. **Smartlead ignores this entirely** — it always ships canonical templates from `templates.ts`.

**Option A (recommended):** Remove the variant editors from the pre-flight modal entirely for provider rows. Keep only the Smartlead preview panel (read-only). Admin sees what will send; can't edit. If template copy needs to change, it's a code change in `templates.ts`.

**Option B:** Keep the editors but ignore the data. Risks admin editing thinking it matters → confused later when emails don't match what they typed.

**Option C:** Keep the editors AND wire them through to Smartlead by creating a per-row campaign with per-row body. Defeats the campus-campaign reuse design + 25× campaign count per send → not viable at scale.

**Decision needed: A or B?** My read: A. Edits-that-don't-apply is a UX bug. Strip the editors.

### D-0.3: Campus PDF strategy

Smartlead's API has no attachment endpoint. Two viable strategies:

**Option A (recommended, TJ's plan):** Per-campus sequence templates in Smartlead UI. One template per campus (~25 templates), each with the campus PDF pre-attached to each step. The bridge code stays the same — when launching a campus's first row, it creates a campaign FROM the campus template (Smartlead supports `template_id` on campaign create — needs verification).

**Option B:** Skip PDF attachment for now; include a link to a hosted PDF in the body. Less compelling than attached, but unblocks audit.

**Option C:** Per-row dynamic attachments via a paid Smartlead tier that supports the attachments API (does not exist in their public docs as of session start).

**Decision needed: A, B, or C?** My read: A, with B as a 1-week fallback if A's template_id mechanism doesn't work as expected. TJ's already partway through setting this up.

### D-0.4: Stakeholder rows (advisor / professor / student_org / dept_head)

This migration is provider-scoped. Stakeholder rows are a different cadence + still small-volume. Two options:

**Option A (recommended):** Stakeholder rows continue using Resend. Scope this migration to provider rows only. Smartlead is for cold outreach; stakeholder outreach is warmer (intro emails to campus contacts), Resend stays appropriate.

**Option B:** Migrate stakeholder rows too. More scope, less benefit.

**Decision needed: A or B?** My read: A. Don't expand scope.

## Tasks

### Phase 1: Decommission the engine flag (after Phase 0 decisions land)

- [ ] 1. **Remove `MEDJOBS_OUTREACH_ENGINE` env var read + `body.engine` override**
   - Files: `app/api/admin/student-outreach/[id]/route.ts:1769-1779`
   - For `kind='provider'`: always call `enrollRowIntoSmartlead`. For non-provider: unchanged Resend path.
   - Remove `engine` from `handleScheduleSequence` body type
   - Remove `outreach_engine` from `DrawerContext` (no longer a variable)
   - Verify: `git grep -i "MEDJOBS_OUTREACH_ENGINE\|body.engine\|outreach_engine"` returns zero hits in `app/` and `lib/`

- [ ] 2. **Skip provider rows in auto-send-executor**
   - Files: `lib/student-outreach/auto-send-executor.ts:executeEmailTask`
   - Add early return: if the row's `kind === 'provider'`, log `outcome: "skipped_smartlead_owned"`, mark task `completed`, return. (Belt-and-suspenders — provider rows shouldn't have email tasks anyway, but if a stale row from before the cutover sits in the queue, we don't want it firing through Resend.)
   - Verify: tsx test calls `executeEmailTask` with a fake provider task → returns skipped, no Resend call

- [ ] 3. **Strip the engine flag from Vercel** (after PR merges)
   - Vercel staging + prod: delete `MEDJOBS_OUTREACH_ENGINE` env var if set
   - No code change — operational step
   - Verify: Vercel project dashboard shows no `MEDJOBS_OUTREACH_ENGINE` row

### Phase 2: Modal cleanup (Decision D-0.2 = Option A)

- [ ] 4. **Remove variant editors from ProviderPreFlightModal for provider rows**
   - Files: `components/admin/medjobs/ProviderPreFlightModal.tsx`
   - Delete the per-day general/named variant editor blocks (`VariantEditor` instances)
   - Keep the recipient roster + Smartlead preview panel + call-script editor + PDF indicator
   - Remove `generalSnaps` / `namedSnaps` state, `defaults`, `updateGeneral`, `updateNamed`
   - `onSubmit` now sends only `recipients` + `call_scripts` (no `email_snapshots_by_variant`)
   - Update server-side validation in `route.ts:handleScheduleSequence` to make `email_snapshots_by_variant` optional → if absent for provider rows, use the canonical templates path
   - Verify: open pre-flight on a provider row in staging → no variant editors visible, only preview + calls

- [ ] 5. **Update the modal subtitle + remove Smartlead-mode conditionals**
   - The "smartleadMode" toggle in headers (added in Phase 3 of last session) becomes the only mode — flatten the JSX
   - Files: `components/admin/medjobs/ProviderPreFlightModal.tsx`
   - Verify: no `engine === "smartlead"` ternaries remain in the file

### Phase 3: Smartlead footer + sender identity (Decision D-0.1 = Option A)

- [ ] 6. **Build Smartlead footer in the bridge**
   - Files: `lib/medjobs/smartlead-bridge.ts:toSmartleadHtml`
   - Port the Grazie + Logan signature blocks from `email-send.ts:composeFooterHtml`
   - Grazie's block: remove the `graize@olera.care` email line (no findmedjobs.co handle yet)
   - Logan's block: leave email as `logan@olera.care` (his standing identity)
   - Drop "Reply STOP" line — Smartlead handles unsubscribe
   - Order: Grazie block → "Message Approved" divider → Logan block (matches Resend)
   - Verify: tsx render the Smartlead body; confirm both signature blocks render in correct order, no email-leak from removed line, no "Reply STOP" text

- [ ] 7. **Verify Smartlead's native unsubscribe block renders**
   - In Smartlead UI, set the campaign's unsubscribe behavior to "show unsubscribe link in footer"
   - No code — operational step
   - Verify: a test send to your inbox shows the Smartlead unsubscribe link below the footer

### Phase 4: Campus PDFs in Smartlead UI (Decision D-0.3 = Option A)

- [ ] 8. **Verify Smartlead supports campaign-from-template via API**
   - Files: `lib/smartlead.ts` — check Smartlead's API docs for `template_id` on the createCampaign call
   - If supported: extend `createCampaign` signature to accept `template_id`, plumb through `provisionCampaign` → `launchCampaign` / `enrollRowIntoCampusCampaign`
   - If NOT supported: fall back to D-0.3 Option B (link to hosted PDF in body) for v1; revisit in v2
   - Verify: a one-off test API call creates a campaign from an existing Smartlead template with PDF attached

- [ ] 9. **TJ: build one campus template in Smartlead UI**
   - Operational, TJ-owned
   - Pick one launch campus (e.g. Texas A&M). Create a sequence template with the 3 Day-0/3/7 steps, body copy matching `buildEmailSequence` output, campus PDF attached to each step
   - Save template name as `medjobs-{campus-slug}` so the bridge can resolve by slug
   - Verify: a manual API call creates a campaign from this template; PDF is attached to outbound sends

- [ ] 10. **Bridge picks the right campus template by slug**
    - Files: `lib/medjobs/smartlead-bridge.ts:provisionCampaign`
    - Resolve `template_id` from a campus-slug → template-id mapping (env var or DB column on `student_outreach_campuses`)
    - If no template exists for the campus, fall back to API-only campaign creation (no PDF) + log a warning
    - Verify: enroll a Texas A&M row → campaign created from the campus template, PDF arrives in the test send

- [ ] 11. **TJ: build the remaining ~24 campus templates**
    - Operational, TJ-owned, post-cutover (~late June). Don't block cutover on this — Texas A&M can launch first, others added as TJ creates the templates
    - No code — content/setup work

### Phase 5: Verification pass — Logan's audit checklist

After Phases 1-4 land on staging, run this checklist against staging (env vars + webhook secret set on staging only). Use your own inboxes per the safety conversation.

- [ ] 12. **Send emails successfully**
    - Create test provider row in staging with General Contact = `logan@olera.care`, Named Contact = personal Gmail
    - Pre-flight → Launch → manually START campaign in Smartlead UI
    - Verify: both inboxes receive a Day 0 email within Smartlead's send window

- [ ] 13. **Inbox rotation works**
    - Run task 12 multiple times with different test rows
    - Verify: roughly half the test sends come from `logan@findmedjobs.co`, half from `partnerships@findmedjobs.co` (Smartlead rotates per-lead, not per-send)

- [ ] 14. **PDF attachment arrives**
    - Verify: each Day 0 email has the campus PDF attached
    - If Phase 4 task 8 fell back to "link in body," verify the link works instead

- [ ] 15. **General + Specific Contact fan-out**
    - Test row has 1 General Contact email + 2 Named Contacts (different first names)
    - Verify: 3 leads in Smartlead, each with the right `salutation` custom field ("Hello" for general, "Hi <First>" for named)
    - Each Named Contact's email has "Hi <First>," at the top; General Contact email has "Hello,"

- [ ] 16. **Campus-campaign reuse**
    - Launch 2 test rows under the same campus from different drawer sessions
    - Verify: both rows enroll into the SAME Smartlead campaign (campaign id matches in `research_data.smartlead.campaign_id`)
    - Launch a third row under a DIFFERENT campus
    - Verify: new campaign created with the different campus's name

- [ ] 17. **Replies surface in CRM**
    - Reply to a test email from your inbox
    - Verify (within ~1 min): `email_replied` touchpoint lands on the row, row appears in In-Basket Replies tab, status transitions to `engaged` (if pre-engagement)

- [ ] 18. **Bounce + unsubscribe work**
    - Trigger a bounce (send to a fake address — Smartlead simulator if available, or modify a test row's email to `bounce@test.smartlead.dev` if Smartlead supports test addresses)
    - Verify: `email_bounced` touchpoint lands
    - Click unsubscribe in your test email
    - Verify: `email_complained` touchpoint lands + row transitions to `do_not_contact`

- [ ] 19. **Open + click counters update**
    - Open a test email + click any link in it
    - Verify: `research_data.smartlead.engagement.opens` and `.clicks` incremented on the row; `last_opened_at` / `last_clicked_at` populated; NO timeline touchpoint for the open/click

- [ ] 20. **Calls cadence still works**
    - Launch outreach on a test row with `phone` populated
    - Verify: 3 `outreach_followup_call` tasks queue in Calls tab on Day 0, Day 1, Day 5 schedule
    - Log a "no answer" outcome on Day 0 call → `call_no_answer` touchpoint lands

- [ ] 21. **Meeting scheduling still works**
    - Click "Wants meeting" in the reply classifier modal on a row with an `email_replied` touchpoint
    - Verify: `meeting_scheduled` touchpoint lands, row transitions to `meeting_scheduled`, calendar invite logic fires (no change from Resend path)

- [ ] 22. **Partner conversion still works**
    - Click "Became a partner" → fill distribution evidence
    - Verify: row transitions to `active_partner`, distribution touchpoint lands, partner-prospect gate unlocks for the catchment

### Phase 6: Prod cutover (after Phase 5 passes)

- [ ] 23. **Set Smartlead webhook secret in Supabase**
    - Operational: `supabase secrets set SMARTLEAD_WEBHOOK_SECRET=<random-string>`
    - Deploy: `supabase functions deploy smartlead-webhook`
    - In Smartlead UI: register the function URL for all 6 event types with `?secret=<same-string>`
    - Verify: a Smartlead test event lands in Supabase function logs

- [ ] 24. **Set sender allowlist in Vercel prod**
    - Vercel prod: `SMARTLEAD_SENDER_EMAILS=logan@findmedjobs.co,partnerships@findmedjobs.co`
    - Trigger redeploy
    - Verify: env vars page in Vercel shows the value

- [ ] 25. **TJ confirms warmup complete**
    - Both mailboxes show `warmup_details.status === "ACTIVE"` in Smartlead account
    - Domain reputation check (Google Postmaster or similar) shows "high" or "medium-high"

- [ ] 26. **Disconnect `tj@findmedjobs.co` from Smartlead** (cleanup)
    - Operational: remove the demo sender from Smartlead so it can't accidentally rotate into prod sends
    - Verify: `listEmailAccounts()` returns only the two intended mailboxes

- [ ] 27. **First prod launch**
    - Launch outreach on ONE real prod provider row that Logan picks (high-confidence-no-immediate-spam-risk prospect)
    - Verify: Smartlead campaign created (PAUSED), human starts it in Smartlead UI, email arrives at the prospect, downstream events flow

- [ ] 28. **Update SCRATCHPAD + Notion**
    - Log the cutover, dates, decisions made, link to this plan
    - Mark "MedJobs cold outreach: Smartlead = system of record for sends" in the canonical engineering brief (`docs/medjobs/OPERATIONAL_BRIEF.md`)
    - Operational

## Risks

- **R-1: Smartlead's `template_id` API may not exist** (Phase 4 task 8). If it doesn't, the campus-template-per-campus strategy needs a manual fallback (TJ creates campaigns from templates in Smartlead UI per campus, the bridge stops calling `createCampaign` and instead calls `addLeads` against the pre-existing campaign). Mitigation: spike task 8 BEFORE committing to Phase 4. If it fails, fall to D-0.3 Option B (link in body) for v1.
- **R-2: Smartlead's per-mailbox daily campaign cap during late warmup** (~20-50/day for first few weeks even after mailboxes show ACTIVE). Mitigation: launch slowly — 1-2 campuses per week post-cutover, not all 25 at once.
- **R-3: Footer order in Smartlead body may render differently than Resend** because Smartlead injects its own unsubscribe block AFTER the body. Mitigation: send 3-5 test emails to yourself in Phase 5 task 12, eyeball the rendered output; adjust footer spacing if Smartlead's unsubscribe collides with our signature block.
- **R-4: Existing in-flight Resend campaigns at cutover time** — if a provider row had its Day 0 email sent by Resend and its Day 3 follow-up is still queued, the Day 3 task fires through Resend post-cutover (since auto-send-executor checks kind, not engine history). Mitigation: pre-cutover script to cancel pending `outreach_email_send` tasks for provider rows. ~5 lines.
- **R-5: Stale provider rows with `research_data.smartlead.campaign_id` from staging tests** could collide with prod campaigns. Mitigation: dump + clear `research_data.smartlead` from prod before cutover (one SQL UPDATE).
- **R-6: Webhook idempotency may double-process** if Smartlead retries faster than the touchpoint dedupe query commits. Mitigation: monitored — current implementation queries `payload->>smartlead_event_id` synchronously before insert; race window is ~10ms; acceptable. Add a unique index on `(touchpoint_type, payload->>smartlead_event_id)` if duplicates appear.
- **R-7: Grazie has no findmedjobs.co handle** — her signature email line is removed in D-0.1 Option A. Long-term, when she gets `graize@findmedjobs.co`, restore the line. Mitigation: log this as a follow-up in SCRATCHPAD; not blocking.

## Notes for future sessions

- This plan supersedes the engine-flag-based "gradual rollout" strategy from PR #907/#909. Smartlead becomes unconditional for provider rows.
- The Smartlead bridge code (`lib/medjobs/smartlead-bridge.ts`) already implements the per-recipient fan-out + `{{salutation}}` merge tag (PR #909). This plan REUSES that code; doesn't refactor it.
- The D2 webhook (`supabase/functions/smartlead-webhook/index.ts`) already covers the full event vocabulary (PR #909). No webhook code changes.
- Stakeholder cadences (advisor / student_org / dept_head / professor) intentionally OUT OF SCOPE. They continue using Resend via the existing `auto-send-executor` path.
- Auto-send-executor's `outreach_followup_email` task type is provider-cadence-only (call days 0/1/5 vs email days 0/3/7) — phase 1 task 2's gate by `kind === 'provider'` is the only safety net needed.
