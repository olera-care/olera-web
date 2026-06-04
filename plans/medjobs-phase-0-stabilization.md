# Phase 0 — Stabilization

Phase index → [master plan §12](medjobs-master-plan.md#12-development-phases)

Created: 2026-06-04
Status: **READY TO EXECUTE** (no new code; QA + signoffs + env)
Owner: Claude (engineering) + Logan (signoffs) + TJ (merge admin)

## Goal

Get every completed-but-unmerged piece of MedJobs work into `staging`, complete the Smartlead production-readiness checklist, and collect Logan's pending signoffs — so that Phase 1 can ship live emails the day it merges.

Phase 0 is mostly **review + signoff cycles + env config**, not engineering. Total wall time ~2 days of actual work spread across ~3–5 calendar days waiting on async signoffs.

## What's in this phase

Six work items, ordered by what unblocks what:

| # | Item | Owner | Time | Blocks |
|---|------|-------|------|--------|
| 1 | QA Pre-Flight + Find Email/Form on Vercel preview | Claude + Logan | ~3 hours | 2, 6 |
| 2 | Merge `merge/medjobs-staging-2026-06-02` → `staging` | TJ | ~30 min | Phase 1 start |
| 3 | Smartlead env-var checklist (prod + preview) | Claude | ~30 min | 5 |
| 4 | Smartlead webhook registration (D2 activation prep) | Claude | ~1 hour | 5 |
| 5 | Smartlead sender + copy signoffs from Logan | Logan | async | Phase 1 send |
| 6 | Smartlead sender warmup status check | Claude | ~30 min | Phase 1 send |

Items 1–4 can run in parallel. Item 5 is the long pole (Logan async). Item 6 confirms readiness right before Phase 1 ships.

---

## Item 1 — QA Pre-Flight + Find Email/Form on Vercel preview

**Owner:** Claude (walks the preview, captures findings) + Logan (eyeballs the polished result)
**Time:** ~3 hours
**Vercel preview URL:** auto-deployed from the branch — find via `gh pr` or the Vercel dashboard

The merge branch carries 33 commits ahead of staging covering five workstreams:
- Phase 2b–2e Research Card consolidation (the most recent work; Logan hasn't seen it live)
- Phase 0a–2a earlier Research Card additions (already piloted by Logan; just re-confirming)
- Find Email + Find Contact Form per-row buttons + batch scripts (PR #925)
- Catchment correction (PR #919; already merged separately to staging but on this branch too)
- Market diagnostic merges (PR #916; gated to Aggie / TJ / `?market=1` — already in staging)

### QA test plan

**Test 1 — Pre-Flight Research Card (provider prospect row)**

Open the drawer on any provider prospect (e.g., one of the College Station rows). Confirm:

- Research Card renders with the new structure: Provider Profile header → Business Name → General Contact → Decision Maker → Verification → Research Notes → Pre-Flight action footer
- Header shows the "Research: X of 7" pill (passive indicator)
- General Contact section has Website / Phone / Email / Address / Fax / Contact Form rows
- Each contact field has "Find {field}" button when empty + "Mark not available" toggle
- "Fill from Website" pill in section header dispatches the "all" mode
- Pulse ring flashes on the input that just got auto-filled
- Decision Maker has Name / Role / Phone / Email + "Mark Decision Maker not available"
- Verification subsection shows current state: "Not yet confirmed" (gray) / "Information confirmed by phone" (primary green) / "Pre-Flight overridden" (amber)
- Pre-Flight action footer at bottom has Visit Website / Call to Confirm / Launch Outreach

**Test 2 — NextStepCard collapse**

On the same prospect row, confirm:
- NextStepCard shows ONLY "Pre-Flight in progress" headline + the direction "Complete the Research Card below — Visit Website, collect any missing info, Call to Confirm, then Launch Outreach"
- No checklist rows, no Visit Website / Call to Confirm / Launch Outreach buttons in NextStepCard (those moved to Research Card footer)

**Test 3 — Call to Confirm flow**

Click "Call to Confirm" in the Research Card footer. The CallForEmailModal opens. Walk each of the 6 outcomes:
1. **Confirmed Contact Information** — confirm verification advances to "Information confirmed by phone" (primary), Launch button enables
2. **No Answer** — confirm verification stays at "Not yet confirmed (1 attempt logged)"
3. **Voicemail** — same as No Answer, attempts counter increments
4. **Wrong Number** — same as above
5. **Not Interested** — confirm row closes (status = not_interested)
6. **Override Pre-Flight** — confirm verification advances to "Pre-Flight overridden" (amber), Launch button enables with "(override)" suffix

After each outcome, confirm the touchpoint lands in the OutreachTimeline. Test the optional notes field on at least 2 outcomes.

**Test 4 — Launch Outreach flow**

With verification passed (test 3 outcome 1 or 6) AND an email on file (General Contact OR Decision Maker), click "Launch outreach →" in the Research Card footer. Confirm:
- ProviderPreFlightModal opens
- Smartlead campaign-preview renders (recipients shown)
- On submit, `schedule_sequence` runs successfully
- Row transitions: prospect → in_outreach (visible in Next Step)
- Research Card disappears from the prominent slot (Snapshot moves to More Details collapse)
- Smartlead linkage written to `research_data.smartlead`

**Test 5 — Find buttons (per-field enrichment)**

On a fresh prospect row missing some fields:
- Click "Find email" → spinner → result fills + pulse ring flashes (or miss note appears)
- Click "Find contact form" → same
- Click "Find phone" → same
- Click "Find fax" → same
- Click "Find address" → confirms address parts populate independently (street, city, state, zip can each be edited without re-typing the rest)
- Click the header "✦ Fill from Website" pill → runs all five finders in parallel
- Verify no drawer-level errors fire (feedback stays inline per row)

**Test 6 — Cross-stage drawer integrity**

Walk the same provider through stages by logging touchpoints/outcomes:
- prospect → in_outreach (via Launch — already tested in test 4)
- in_outreach → call_due (via cadence task firing)
- call_due → meeting_set (via LogCallOutcomeModal outcome `meeting_scheduled`)
- meeting_set → converted (via LogMeetingModal outcome `done_client`)
- meeting_set → not_interested closed (via LogMeetingModal `not_a_fit`)

At each stage, confirm NextStepCard renders the right body (the OTHER stage bodies weren't touched by Phase 2e, but worth re-verifying nothing regressed).

**Test 7 — Mark not available + Override paths**

Pick a row missing an email. Mark email "not available." Confirm:
- Email row shows "Marked not available"
- Launch button stays disabled with reason "Add an email — General Contact or Decision Maker"
- Now add a Decision Maker email instead
- Launch button enables (after verification/override is also satisfied)

**Test 8 — Catchment audit (PR #919 sanity)**

Visit `/admin/medjobs/catchment-audit` (or wherever the surface is). For a campus like Texas A&M, confirm:
- Provider counts match the new non-medical filter (`Home Care (Non-medical)` only)
- No stale `business_profiles` reads — all should be `olera-providers`
- Pagination works through providers > 10K page size

### Pass criteria

QA passes when all 8 tests render correctly AND Logan eyeballs the Research Card aesthetics + verifies the Find buttons feel responsive on at least 3 real rows.

### Recording results

Claude captures findings in this section (replace this para with a bulleted list as tests are run). If anything fails, file as a blocking bug + fix before proceeding to Item 2.

---

## Item 2 — Merge `merge/medjobs-staging-2026-06-02` → `staging`

**Owner:** TJ (only TJ can merge to staging per CLAUDE.md)
**Time:** ~30 min including post-merge verification
**Depends on:** Item 1 QA passed

### Merge process

1. Logan / Claude opens a PR `merge/medjobs-staging-2026-06-02 → staging` if not already open
2. PR description carries the QA test results from Item 1 as the verification log
3. TJ reviews + merges via the `/pr-merge` slash command (authenticates as TJ, satisfies the merge-admin ruleset)
4. Branch protection on staging is satisfied (TJ in `merge-admins` team)

### Post-merge verification

After merge, verify on staging Vercel (`staging-olera2-web.vercel.app`):
- Pre-Flight Research Card consolidation works on a real staging row
- Smartlead bridge linkage on rows that previously had `research_data.smartlead` is intact
- No console errors on the In Basket / drawer surfaces
- Catchment audit shows the same counts as the preview tested in Item 1

### Pass criteria

Staging shows the merged behavior end-to-end. No regressions on existing flows (Replies tab, Calls tab, Meetings tab continue to work as they did pre-Phase-2e).

---

## Item 3 — Smartlead env-var checklist (prod + preview)

**Owner:** Claude (verification) + TJ (sets Vercel env vars; Claude doesn't have direct prod access)
**Time:** ~30 min

### Required env vars

Per `docs/medjobs/SMARTLEAD_BRIDGE_SPEC.md`:

| Var | Where | Value | Purpose |
|-----|-------|-------|---------|
| `SMARTLEAD_API_KEY` | Vercel prod + preview | (TJ has this) | Smartlead API auth |
| `SMARTLEAD_SENDER_EMAILS` | Vercel prod | Comma-list, see Item 6 | Allowlist of warm senders |
| `SMARTLEAD_WEBHOOK_SECRET` | Vercel prod + Supabase edge fn | Generated UUID | D2 webhook signature verify |
| `MEDJOBS_OUTREACH_ENGINE` | Vercel prod | `smartlead` (when Phase 1 is ready) | Engine swap flag — leave UNSET for now |

### Verification steps

1. Claude checks the master plan + spec to confirm var names + intent
2. TJ confirms which of these are already set vs need to be added (via Vercel UI)
3. For `SMARTLEAD_WEBHOOK_SECRET`: generate a fresh UUIDv4, set on both Vercel + the Supabase edge function (`supabase functions secrets set SMARTLEAD_WEBHOOK_SECRET=<uuid> --project-ref <ref>`)
4. **Critical:** `MEDJOBS_OUTREACH_ENGINE` stays UNSET in prod until Phase 1 tickets 1–11 ship. Setting it early would route real outreach through Smartlead with the OLD email copy.

### Pass criteria

`SMARTLEAD_API_KEY` and `SMARTLEAD_WEBHOOK_SECRET` set on prod + preview. `SMARTLEAD_SENDER_EMAILS` documented as a follow-up (set during Item 6). `MEDJOBS_OUTREACH_ENGINE` confirmed unset.

---

## Item 4 — Smartlead webhook registration (D2 activation prep)

**Owner:** Claude (Smartlead admin walkthrough) + TJ (admin access)
**Time:** ~1 hour including test event verification
**Depends on:** Item 3 (`SMARTLEAD_WEBHOOK_SECRET` must exist before webhook handler can verify signatures)

The D2 webhook (`supabase/functions/smartlead-webhook/`) is deployed but INERT — Smartlead doesn't know about it yet. Phase 0 registers the URL so the handler is reachable.

### Webhook URL

The Supabase edge function URL pattern: `https://<project-ref>.supabase.co/functions/v1/smartlead-webhook`

(TJ has the project ref; pull from the Supabase dashboard.)

### Smartlead admin steps

1. Log into Smartlead admin: smartlead.ai
2. Navigate to: Settings → Webhooks (or equivalent — Smartlead UI may have moved this)
3. Add a new webhook subscription:
   - URL: the Supabase edge function URL above
   - Secret: the `SMARTLEAD_WEBHOOK_SECRET` value from Item 3
   - Events: `email_reply`, `email_bounce` (the D2 events the current handler supports). **Do NOT add `email_open` or `email_link_click` yet** — those handlers don't exist until Phase 1 ticket 9.

### Test webhook delivery

Smartlead's admin should have a "send test event" button. Fire a test `email_reply` event. Confirm:
- Edge function logs show the inbound request
- Signature verification passes
- A `note_added` touchpoint with `reason: "test_webhook"` (or similar) lands in a test outreach row (the spec's test-row pattern)

### Pass criteria

Webhook is registered with `email_reply` + `email_bounce` events. Signature verification works. A test event reaches the edge function and logs cleanly.

---

## Item 5 — Smartlead sender + copy signoffs from Logan

**Owner:** Logan (signoff) + Claude (proposes drafts, captures decisions)
**Time:** Async; Logan async over 1–3 days
**Depends on:** None — can run in parallel with Items 1–4

Logan's role on the cold-channel deliverables narrowed to three things (per the SCRATCHPAD note from Pass 1 of the post-launch planning):

### Signoff 1 — Sender identity

Confirm: which sender(s) on the warmed `findmedjobs.co` domain are approved for production cold sends?

Default proposal (matches PR #900 setup):
- `logan@findmedjobs.co` — Logan as the visible sender (his name is on the copy)
- `partnerships@findmedjobs.co` — partner relations alias
- (NOT `tj@findmedjobs.co` — that's the admin/test sender, warmup off)

Logan picks: one of the above, both, or specifies different addresses. The picked list becomes the `SMARTLEAD_SENDER_EMAILS` env var value in Item 3.

### Signoff 2 — Footer + unsubscribe copy

The cold-channel footer is the deferred body piece from PR #900. Required content (per CAN-SPAM + standard cold-outreach norms):

- Physical postal address (per CAN-SPAM)
- Unsubscribe link (one-click, Smartlead handles the click → suppression)
- Brief identity line ("Olera, Inc. is recruiting student caregivers near {campus}")

Claude drafts → Logan approves or revises. Final copy lands in `lib/student-outreach/templates.ts` footer constant (read by all provider templates).

### Signoff 3 — Outreach body copy walkthrough

Logan reviews the Day 0 / Day 3 / Day 7 provider email bodies one last time before they go live. v3 plan § P1.D has the draft body:

> Hi Mr. French,
>
> Graize here, on behalf of Dr. Logan DuBose at Olera. We've been recruiting pre-nursing and pre-medical students from Texas A&M who are looking for caregiver shifts — and HomeSpark Care stood out as a great fit to invite into our pilot.
>
> Take a look at the students near you:
>
> **[ Review Texas A&M student caregivers → ]**
>
> A short background on the pilot is attached. If you'd rather chat first, you can [book a quick call with Dr. DuBose] — no pressure either way.

Plus the brand-consistency one-liner (§6.7 in master plan): "...you'll land on olera.care, our main platform."

Day 3 and Day 7 follow the same pattern but lighter (intro → light follow-up → graceful close). Drafts go in Item 5 when Logan is ready to review.

### Sign-off mechanism

Slack thread or Notion comment — whatever's friction-free for Logan. The decisions get captured in this doc + lift the copy into `templates.ts` in Phase 1 ticket 2.

### Pass criteria

All three signoffs received. Sender list documented in Item 3's env-var section. Footer + body copy locked. The brand-consistency one-liner is in the body.

---

## Item 6 — Smartlead sender warmup status check

**Owner:** Claude (Smartlead inspection)
**Time:** ~30 min
**Depends on:** Item 5 (sender list confirmed)

The cold senders have been warming since 5/29 per PR #900 notes. Expected ready ~late June. Phase 0 confirms each sender's current tier/health right before Phase 1 ships.

### Steps

1. Log into Smartlead. For each sender in the approved list (Item 5 signoff 1):
   - Inspect the mailbox's warmup status: is warmup ON, what tier (Pool 1/2/3/etc.), current daily send limit
   - Check reputation: any bounces during warmup? any spam complaints?
2. Cross-reference with the Smartlead deliverability dashboard for inbox-placement metrics

### Pass criteria

Each approved sender:
- Is at warmup tier appropriate for cold sends (typically Pool 3+ or warmup-complete)
- Has clean reputation (no flagged issues in Smartlead admin)
- Has a daily send limit that comfortably exceeds Phase 1's expected volume

If a sender isn't ready, document the expected ready date + adjust the Phase 1 ship date accordingly. **Phase 1 doesn't start sending until ALL approved senders pass.**

---

## Phase 0 definition of done

All six items complete:

- [ ] Item 1: QA passed; Pre-Flight + Find Email/Form work on Vercel preview
- [ ] Item 2: `merge/medjobs-staging-2026-06-02` merged into `staging`
- [ ] Item 3: Smartlead env vars set on Vercel prod + preview; `MEDJOBS_OUTREACH_ENGINE` confirmed unset
- [ ] Item 4: Smartlead webhook registered with `email_reply` + `email_bounce` events; signature verification confirmed
- [ ] Item 5: Logan signed off on sender identity, footer/unsubscribe copy, and outreach body copy
- [ ] Item 6: All approved senders verified warm + ready for cold sends

When all six are checked, Phase 1 ticket 1 can be cut.

---

## Risks specific to Phase 0

| Risk | Mitigation |
|------|------------|
| QA finds a regression from Phase 2b–2e | File a bug, fix on the same branch, re-QA before merging. Phase 0 timeline slips ~1–2 days. |
| Logan can't get to the signoffs for a week | Phase 0 stays open; Phase 1 ticket 1 + 2 + 3 (cadence, email template, pilot-tier predicate) can be DRAFTED but not merged until signoffs land. Item 5 is the gating signal. |
| Smartlead webhook can't be registered (UI changes / permission issue) | TJ has Smartlead admin; he handles the registration. Fallback: ngrok-tunnel the edge function for testing if production Smartlead is locked. |
| Sender warmup not complete by Phase 0 close | Phase 1 timeline slips to match. Use the slip time to write Phase 2 strategy depth-pass (parallel work). |
| `MEDJOBS_OUTREACH_ENGINE` is set early by accident | Items 3 + 6 verifications gate the flip. Document explicitly that this var is the "go-live" trigger and only flips AFTER Phase 1 tickets 1–11 ship. |

---

## Phase 0 output (artifacts)

When Phase 0 closes, these artifacts exist:

- `staging` branch contains Pre-Flight v9.x + Find Email/Form + catchment fixes (post-merge from Item 2)
- Smartlead admin shows webhook subscription (from Item 4)
- Vercel prod env carries the four Smartlead vars (from Item 3, minus `MEDJOBS_OUTREACH_ENGINE`)
- `lib/student-outreach/templates.ts` has the approved footer + body copy (from Item 5)
- This document has all 6 item sections updated with PASS / dates / signoff captures

Next: Phase 1 ticket cutting begins. See [Phase 1 plan](medjobs-phase-1-conversion-mvp.md) (to be written after Phase 0 review).
