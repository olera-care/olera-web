# MedJobs Post-Outreach Workflow — Build Plan

Status: **PLAN — approved to build**
Created: 2026-06-08
Owner: Claude (build) + Logan (decisions, Calendly/Smartlead setup, QA)
Related: `docs/medjobs/OPERATIONAL_BRIEF.md` (CRM state machine + discipline rules), the magic-link/pilot work (`lib/medjobs/welcome-token.ts`, `app/medjobs/m/[token]/route.ts`, `app/api/medjobs/pilot/activate/route.ts`).

## North star

Every post-outreach surface — Calls, Emails, Meetings — exists to move a provider to **one event: click the magic link → accept Terms → Trial Active.** Calls/emails/meetings are paths that raise interest to the point the provider will take that action. The drawers and Log modals are organized **action-first** and funnel toward that single conversion.

---

## 1. Research findings (locked facts)

### Smartlead
- **Reply ingestion:** the `EMAIL_REPLY` webhook delivers the reply body (`reply_body` HTML + `preview_text`), `to_email`/`to_name`, `campaign_id`, `sequence_number`. `UNTRACKED_REPLIES` covers unknown-sender replies. Webhooks register **per-campaign via the Create-Webhook API** (scriptable across all campus campaigns).
- **Threaded reply-send:** `POST /campaigns/{id}/reply-email-thread` with `email_body` + `email_stats_id` (the message being replied to); sends from the campaign mailbox, preserves the thread.
- **The `email_stats_id` chain (RISK):** the webhook gives the body but not clearly the reply-target id; the master-inbox `inbox-replies` API returns the thread, message ids, and bodies. Flow: webhook → `inbox-replies` (fetch body + reply-target id) → `reply-email-thread`. **The id-field match between those two endpoints is unconfirmed from docs → 30-min live spike (Phase 0) before building the send path.** Fallback if it doesn't line up: drawer shows the reply + copy-ready template; admin sends from Smartlead inbox.
- **Security:** Smartlead webhooks have **no signing** → secure our endpoint with a secret token in the URL.

### Calendly
- **Events:** `invitee.created`, `invitee.canceled`. Subscribe via `POST /webhook_subscriptions` (personal access token + org/user URI + scope + `signing_key`). **Requires a paid Calendly plan.**
- **Payload:** invitee name/email, event start/end, type, location; full detail via the invitee URI; a `tracking` object carrying `utm_*` if added to the booking link.
- **Correlation:** append `utm_content=<outreach_id>` to the Calendly link when we send it → returns in `tracking` (deterministic); **fallback = invitee email** match. Do both.
- **Verification:** `signing_key` → HMAC-SHA256 over `timestamp + "." + body`, headers `calendly-webhook-signature` + `calendly-webhook-timestamp`.

Sources: Smartlead reply webhook / reply-to-lead / inbox-replies; Calendly webhook-subscriptions / webhook-signatures.

## 2. Locked decisions
1. **Interested replies → "Awaiting Activation"** (don't disappear); 2–3 email **activation follow-up cadence** (spacing +2d / +5d / +9d) auto-stops on Terms accepted; plus a manual nudge button.
2. **Wants-to-schedule → dual human response** (offer "send me times and I'll book it" **and** Dr. DuBose's Calendly link).
3. **Calendly booking completes obsolete Call/Email cards** + creates the Meeting card; **Meetings tab = real scheduled meetings only** (no "finding a time" state).
4. **No Tasks tab.** Post-meeting follow-up creates **Call/Email** work via a dedicated post-meeting cadence.
5. **Reply-send via Smartlead from our UI** (pending the Phase-0 spike; copy-paste fallback).
6. **Smartlead webhook secured by secret token in the URL.**
7. Drawers are **action-first**: one-line *why* → **DO THIS NOW** (never collapsed) → context below.

## 3. Discipline (G1–G10 compatibility)
- **No new Status/Stage/TouchpointType enums.** "Awaiting Activation" + "needs nudge" are **derived** sub-states (like `replies_state`), computed from: status=engaged + `interview_terms_accepted_at` null + an "activation link sent" marker.
- **"Activation link sent" marker** = `note_added` touchpoint with `payload.reason="activation_link_sent"` (no new touchpoint type).
- **Reply body storage** = on the `email_replied` touchpoint `payload` (`reply_body`, `from`, `subject`, `message_id`) — **no new table** (G3).
- **Reply-send + webhooks = new API routes** (`/api/webhooks/smartlead`, `/api/webhooks/calendly`, a reply-send endpoint), NOT new actions in the `route.ts` dispatcher (G2). They reuse existing handlers (`classify_reply`, `mark_meeting_scheduled`, supersession).
- **New cadence keys** (`activation_followup`, `post_meeting_followup`) + templates = content/config; surfaced + approved here (G7).

## 4. State model

```
Replies tab sub-states (derived):
  engaged ─ replied, working
  awaiting_activation ─ interested + link sent + not yet Trial Active   [NEW derived]
  awaiting_schedule   ─ wants meeting, no Calendly booking yet          [NEW derived]
  needs_nudge         ─ any of the above, stalled > N days              [NEW derived]

Card completion (a card leaves active work when):
  • Calendly booking        → Meeting card created; Call+Email cards completed
  • Terms accepted / Trial  → Converted; all pending cancelled
  • Not interested          → closed
  • Cadence exhausted       → stale → no_response_closed (auto-revive on inbound)
```

## 5. Drawers (action-first; per the agreed wireframes)
One-line **why** → **DO THIS NOW** box (channel action + script/template + primary Log button) → **CONTEXT** (link status + condensed history; full timeline collapsible) → danger zone.
- **Call drawer:** click-to-call + Day-N script; link status line.
- **Email drawer:** **the real reply body** (from the webhook) → reply pills + editable template + **Send** + Log; activation link.
- **Meeting drawer:** scheduled-meeting prep + activation link ready; (no "finding a time" — that lives in Replies).

## 6. Outcome modals (grouped: Moving forward → Still working → Stop; effect shown per choice; artifact inline)
- **Call:** Interested ★ · Wants meeting · Ready to sign up ✓ · No answer · Voicemail · Promised callback · Not interested · Wrong number.
- **Reply:** Interested ★ · Wants to schedule · Already booked · Ready to sign up ✓ · Redirected · Not interested.
- **Meeting (simplified):** Held → activate ✓★ · Held → follow-up · Held → not a fit · No-show/reschedule.
Each maps to **existing** CRM actions; the inline panel surfaces the link/template/Calendly when a forward outcome is picked.

## 7. Email reply loop (the core)
1. Provider replies → Smartlead `EMAIL_REPLY` webhook → our endpoint (secret-validated) → create `email_replied` touchpoint w/ `payload.reply_body` → row → engaged, unread, surfaces in Replies. (Auto-revive if it was closed.)
2. Admin opens Email drawer → sees the real reply.
3. Admin picks a **pill** → editable template generated → **Send** (reply-email-thread via Smartlead) → records `email_sent` + applies the pill's existing `classify_reply` outcome.
4. Interested → **Awaiting Activation** + activation cadence starts.

## 8. Cadences (new)
### Activation follow-up (`activation_followup`) — Day 0 (the manual interested-reply) then +2 / +5 / +9
Goal: nudge an interested-but-not-activated provider to accept Terms. Each email: short, references the prior reply, single CTA = the magic link; auto-stops on Trial Active. Email-only (no calls).

### Post-meeting follow-up (`post_meeting_followup`) — +1 / +4 / +8 (email + call)
Goal: RA team clears blockers to activation after a meeting. Email copy + **call scripts that reference the sent email**, all carrying the magic link. Triggered by Meeting outcome "Held → follow-up." Creates Call + Email operational cards.

## 9. Calendly integration
- `/api/webhooks/calendly` (signing-key verified) → on `invitee.created`: resolve provider (utm_content=outreach_id → fallback invitee email) → `mark_meeting_scheduled` (existing) → supersede pending Call/Email tasks → Meeting card appears. `invitee.canceled` → meeting back to follow-up/awaiting_schedule.
- The drawer's "Send Calendly link" appends `utm_content=<outreach_id>` for correlation.

## 10. Reply templates
- **Interested** → activation magic link ("here's your link to review students + get set up").
- **Wants to schedule** → dual (send-availability + Calendly link w/ utm).
- **Not interested** → gracious close.
- **Redirected** → ask for the right contact (+ capture).
- **Other** → free-text (blank).
- **Activation cadence** emails (×3) + **post-meeting** emails/scripts (§8).

## 11. Activation-link variants
- Standard: magic link → board (campus-filtered) + welcome banner.
- **Post-interest / post-meeting:** link carries `&activate=1` → board **auto-opens `PilotTermsModal`** so the provider lands directly on accept-Terms. (Small addition to `app/medjobs/candidates/page.tsx` + the welcome flow.)

## 12. Manual setup (you / TJ)
- **Calendly:** paid plan ✓, **personal access token** + **org/user URI** (provide when ready) → we register the webhook (scripted) with a `signing_key`.
- **Smartlead:** generate a **webhook secret**; we register the `EMAIL_REPLY`/`UNTRACKED_REPLIES` webhooks per campaign (scripted) with `?secret=…`.
- Env vars: `CALENDLY_TOKEN`, `CALENDLY_ORG_URI`, `CALENDLY_WEBHOOK_SIGNING_KEY`, `SMARTLEAD_WEBHOOK_SECRET`.

## 13. Build phases
- **Phase 0 — Spike (30 min):** confirm `inbox-replies` id → `reply-email-thread` `email_stats_id` works. Decides whether in-UI send ships or falls back to copy-paste.
- **Phase 1 — Reply ingestion:** `lib/smartlead.ts` add `getInboxReplies`; `/api/webhooks/smartlead` (secret-validated) → `email_replied` touchpoint w/ body; webhook-registration script. *Accept: a real reply appears in the Email drawer.*
- **Phase 2 — Reply-from-UI:** pills + editable templates + `sendReply` + send endpoint → reply sent + outcome logged. *(Or fallback per Phase 0.)*
- **Phase 3 — Awaiting Activation + activation cadence + nudge button** (auto-stop on Trial Active). + the `&activate=1` link variant.
- **Phase 4 — Calendly webhook:** registration script + `/api/webhooks/calendly` → Meeting card + complete Call/Email cards.
- **Phase 5 — Post-meeting follow-up cadence** (call + email) + simplified Meeting outcomes.
- **Phase 6 — Drawer/modal action-first redesign** + anti-stall nudge surfacing.

Each phase = one revertable PR, typecheck clean, staging→main per workflow.

## 14. Risks
- `email_stats_id` chain (Phase 0 gate).
- Smartlead webhook reliability/dedupe (idempotency on touchpoint creation).
- Calendly correlation when utm is stripped → email fallback.
- Provider-reviews Stripe coupling untouched; directory claim paths untouched (prior guardrail).

## 15. Open items
- Exact activation/post-meeting email copy (draft in Phase 3/5, Logan review).
- Whether "Awaiting Activation" gets a visible chip vs its own sub-tab (recommend chip in Replies).
