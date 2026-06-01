# Smartlead Bridge — Engineering Spec (sequencer → cold-email engine)

> **Status:** Draft for review. Not built. Target build window: Smartlead warmup
> (now → ~late June 2026).
>
> **Companion code:** `lib/smartlead.ts` (the API client, on branch
> `save/email-deliverability-session`, commit `03361d66`, dormant/env-gated).
>
> **Read first:** `docs/medjobs/OPERATIONAL_BRIEF.md` — especially the discipline
> rules (G1–G10), the deferred registry (D2, D25), and the conversion-routing
> invariant. This spec lives inside those constraints.

---

## 1. Purpose & scope

Today the MedJobs cadence (`lib/student-outreach/sequencer.ts` → `planSequence`)
queues per-day email + call tasks and the cron pipeline sends the **email** via
Resend on `olera.care`. Cold volume on `olera.care` pushed the bounce rate near
Resend's 4% ceiling, which threatens the transactional mail our users depend on.

The Smartlead Bridge moves the **cold email drip off `olera.care`** onto the
warmed `findmedjobs.co` mailboxes, driven through Smartlead's API the same way
the app drives Resend today. It is the glue between the CRM's existing
prospect/cadence model and `lib/smartlead.ts`.

**In scope (this spec):**
- Select eligible CRM rows → map to Smartlead leads → build the email sequence
  → create + configure a Smartlead campaign in **PAUSED** state.
- Filtering/dedupe/suppression, the 2,000-contact cap, 100-lead chunking,
  mailbox resolution, schedule, naming.
- The CRM-side state + linkage so a launched row is marked outreach-sent and a
  future webhook can attribute events back to it.

**Explicitly out of scope (deferred, do not build here):**
- **D2 — inbound reply/bounce → CRM.** Smartlead webhook → touchpoints is a
  separate Supabase Edge Function gated on Logan's sign-off. This spec only
  *prepares* for it (stores the linkage). See §10.
- **Auto-START.** The bridge never starts a campaign. A human starts it in the
  Smartlead UI after inspecting the PAUSED campaign, post-warmup. See §8.
- **Multi-domain rotation (D25).** Two mailboxes on one cousin domain for now.
- **Named-contact expansion.** v1 sends one lead per row (the org-level General
  Contact). Per-named-contact fan-out is a later iteration.

---

## 2. The architectural decision (read this before the rest)

**Smartlead owns the email drip. The CRM keeps the call cadence and remains the
system of record.**

The provider cadence (`lib/student-outreach/cadence.ts`) interleaves channels:

| Day | Channel(s) | Template |
|--|--|--|
| 0 | email + phone | `intro` |
| 3 | email | `followup_light` |
| 5 | phone | — |
| 7 | email | `followup_socialproof` |
| 8 | phone | — |
| 10 | email | `followup_final` |

Smartlead sends email only. So the bridge **extracts the email days
(0, 3, 7, 10)** into a Smartlead sequence and **leaves the phone days
(0, 5, 8) as CRM `outreach_followup_call` tasks** exactly as today. Nothing about
the Calls tab, call logging, or call supersession changes.

Consequences that must hold:
- In Smartlead mode, `planSequence` **must NOT queue `outreach_email_send`
  tasks** — Smartlead owns those sends, or we double-send. It still queues
  `outreach_followup_call` tasks.
- `email_sent` / `email_replied` / `email_bounced` touchpoints for these rows
  come from the **D2 webhook**, not from task execution. Until D2 ships, the CRM
  is blind to Smartlead-observed replies (see §10 transitional limitation).
- The row's `Status`/`Stage` derivation is unchanged — it still derives from
  touchpoints. The bridge just changes *who emits the email touchpoints*.

---

## 3. Module placement & shape

```
lib/medjobs/smartlead-bridge.ts        ← new. orchestration + pure helpers.
  ├─ selectEligibleRows(...)           ← pure: filter + reasons (testable)
  ├─ rowToLead(row): SmartleadLead     ← pure: CRM row → lead (testable)
  ├─ buildEmailSequence(cadenceKey)    ← pure: cadence email days → steps (testable)
  ├─ resolveMailboxPool()              ← calls listEmailAccounts(), warmup check
  └─ launchCampaign(input): Report     ← orchestration: create→attach→seq→leads→schedule→PAUSED
```

Mirror `planSequence`'s discipline: **the selection/mapping/sequence builders are
pure and unit-tested**; only `resolveMailboxPool` and `launchCampaign` touch the
network. The DB writes happen through the existing action handler (§7), never
in this module — that keeps G4 single-writer intact.

---

## 4. Input & lead selection

`launchCampaign` is driven per-campus (one campaign per campus — see §6).

**Source set:** materialized provider rows (`kind='provider'`) for the campus, or
an explicit `outreach_ids[]`.

**Filter (each exclusion returns a reason — no silent drops):**

| Exclude when | Reason code |
|--|--|
| status ∈ {not_interested, do_not_contact, wrong_contact, redirected} | `terminal_status` |
| status ∈ {engaged, meeting_scheduled, active_partner} | `already_in_flight` |
| `research_data.smartlead.campaign_id` already set | `already_enrolled` |
| effective General Contact email missing | `no_email` |
| email fails pre-send verification (`lib/email-verification.ts`) | `unverified_email` |
| duplicate email within this batch | `duplicate_in_batch` |

**Email source:** effective General Contact email =
`research_data.general_contact.email` (override) ?? `business_profile` directory
email. One lead per row (org-level). The pre-flight checklist already requires
this email, so most materialized rows have it.

**Suppression:** reuse the existing bounce/complaint suppression that `lib/email.ts`
applies for Resend, so a provider that bounced on `olera.care` isn't re-emailed
from `findmedjobs.co`. (Confirm the suppression list is provider-agnostic; if it
keys on Resend internals, extract the address set.)

---

## 5. Lead mapping (`rowToLead`)

```ts
{
  email:        effectiveEmail(row),
  first_name:   contactFirstName(row) ?? "",      // general inbox → "" → copy uses team greeting
  company_name: row.organization_name,            // provider/agency name
  custom_fields: {
    campus:         campus.name,                   // {{campus}} merge tag
    catchment_city: row.city ?? campus.city ?? "",
    outreach_id:    row.id,                         // ← critical: D2 attribution key
  },
}
```

`outreach_id` in custom_fields is the **join key** the D2 webhook will use to map
a Smartlead event back to the CRM row. Without it, inbound attribution is guesswork.

---

## 6. Sequence construction (`buildEmailSequence`)

Take the cadence's **email days only**, in order, and convert to Smartlead steps
with **relative** delays:

| Cadence day | seq_number | delay_in_days (relative to prev) | template |
|--|--|--|--|
| 0 | 1 | 0 | `intro` |
| 3 | 2 | 3 | `followup_light` |
| 7 | 3 | 4 | `followup_socialproof` |
| 10 | 4 | 3 | `followup_final` |

**Copy:** render each template body once via `getTemplate` / `defaultSnapshotsFor`
(the existing source of truth), then translate to Smartlead merge syntax:

- `{first_name}` → `{{first_name}}`
- organization name → `{{company_name}}`
- campus name → `{{campus}}` (custom field)
- Strip the per-recipient/general variant branching — Smartlead's
  `{{first_name}}` fallback handles the empty-name case, so one body per step
  works across all leads in the campaign.

Because campus is a per-lead custom field, **one sequence template covers every
provider in the campus** — no per-row body baking (unlike the Resend per-recipient
mode). Author the four bodies once, reuse across leads.

> **Decision for review:** author Smartlead-native bodies fresh (cleaner, but a
> second copy to maintain) vs. mechanically translate the existing templates
> (one source of truth, but tsx→HTML rendering is fiddly). Recommendation:
> translate, with a small `toSmartleadBody()` that renders the existing template
> to HTML and swaps merge tokens — one source of truth.

---

## 7. Campaign assembly & CRM write-back

`launchCampaign` sequence (all via `lib/smartlead.ts`, all PAUSED-first):

1. `resolveMailboxPool()` → `listEmailAccounts()`, filter to the env allowlist
   `SMARTLEAD_SENDER_EMAILS` (e.g. `logan@findmedjobs.co,partnerships@findmedjobs.co`).
   **Resolve IDs at runtime — never hardcode** (IDs are account state: today
   19285697 / 19292802, but treat as opaque). Warn if any mailbox's
   `warmup_details.status !== "ACTIVE"`.
2. `createCampaign("MedJobs — {campus} — {YYYY-MM}")` → capture `campaign_id`.
   **Persist `campaign_id` to a launch record immediately** (before pushing
   leads) so a mid-flight failure is recoverable, not orphaned.
3. `attachEmailAccounts(campaign_id, poolIds)`.
4. `saveSequence(campaign_id, buildEmailSequence("provider"))`.
5. `addLeads` in **chunks of 100** (the module does NOT chunk — the caller must;
   proven in the stress harness). Respect the **2,000 total-contact storage cap**:
   before each chunk, check `enrolledSoFar + chunk.length <= 2000 - existingStorage`;
   stop and report `dropped_over_cap` rather than silently truncating.
6. `setCampaignSchedule(campaign_id, { timezone: campusTz, days_of_the_week:
   [1,2,3,4,5], start_hour: "09:00", end_hour: "17:00", min_time_btw_emails: 10,
   max_new_leads_per_day: <warmup-safe, start ~20–40> })`.
7. `setCampaignStatus(campaign_id, "PAUSED")` — explicit, never `"START"`.

**CRM write-back (per successfully enrolled row only):** dispatch the existing
`schedule_sequence` action in **`engine: "smartlead"`** mode (see §9), which:
- transitions status `prospect`/`researched` → `outreach_sent`,
- queues the **call** tasks (not email tasks),
- writes the linkage to `research_data.smartlead = { campaign_id, lead_email,
  enrolled_at, mailbox_pool }` (JSONB — no migration, **G3 satisfied**),
- emits a `note_added{reason: "smartlead_enrolled"}` touchpoint (existing type —
  **G1/G5 satisfied**) so the timeline narrates the enrollment.

Write the linkage **only after that row's lead chunk succeeds**, so the CRM never
believes a row is enrolled when Smartlead rejected it.

**Return:** a `LaunchReport`:
```ts
{
  campaign_id,
  enrolled: number,
  skipped: { outreach_id, reason }[],
  dropped_over_cap: number,
  mailbox_warnings: string[],     // e.g. "partnerships@ warmup status PENDING"
  errors: { stage, message }[],   // any non-fatal smartlead {ok:false}
}
```
Surface this in the admin UI verbatim — no silent caps (matches the brief's
"log what was dropped" principle).

---

## 8. Safety rails

- **PAUSED-only.** The bridge has no code path that calls `setCampaignStatus("START")`.
  A campaign goes live only by a human in the Smartlead UI (or, later, a separate
  explicitly-gated admin action). Rationale: the `setCampaignStatus` comment —
  starting before the pool is warm is the #1 way to torch domain reputation.
- **Warmup gate is advisory at create-time, hard at start-time.** Creating a
  PAUSED campaign during warmup is fine and useful (lets us stage before late
  June). The warmup check produces *warnings*; the human owns the START decision.
- **Fail-closed inherited from the engine.** No `SMARTLEAD_API_KEY` → every call
  returns `{ok:false}`; `launchCampaign` reports errors and writes back nothing.
  A missing key can never partially enroll.
- **Idempotent re-runs.** Re-running for a campus skips `already_enrolled` rows
  (linkage check) and Smartlead dedupes on email — so a retry after partial
  failure tops up the campaign rather than duplicating.

---

## 9. The one route.ts change (needs explicit approval — G2)

G2 forbids new actions in `route.ts` without sign-off. The bridge does **not** add
an action; it extends the existing `schedule_sequence` handler with an `engine`
discriminator on the payload:

```ts
// schedule_sequence payload gains:
engine?: "resend" | "smartlead"   // default "resend" (current behavior, untouched)
```

- `engine: "resend"` (default) → today's path exactly. Zero behavior change.
- `engine: "smartlead"` → skip queuing `outreach_email_send` tasks; still queue
  `outreach_followup_call`; perform the linkage write + `note_added` touchpoint.
  The actual Smartlead API calls happen in `lib/medjobs/smartlead-bridge.ts`,
  invoked from the handler.

**No operator-facing toggle.** The engine is resolved from a **config default**
(env, e.g. `MEDJOBS_OUTREACH_ENGINE=smartlead`), not a per-launch UI control.
The interface for sending is the **existing pre-flight "Schedule sequence"
trigger** that operators already use — Smartlead is a backend swap underneath it,
invisible to the operator's flow. This is deliberate: per the team decision, the
cold-email frontend is left to **emerge with Logan and the team** rather than
building a campaigns/launch UI nobody has asked to use yet (see §12).

This is the **single** discipline-sensitive edit. It reuses the action, the status
transition, and existing touchpoint types — so G1 (no new enums), G3 (no
migrations), G4 (single-writer), G5 (every action emits a touchpoint) all hold.
**G2 is the one to surface for approval**: extending a handler's branch logic.
Flagging it here rather than shipping silently is the discipline working.

---

## 10. Relationship to D2 (inbound) — the transitional gap

The bridge is outbound-only. Until the D2 webhook ships:

- Smartlead **auto-pauses a lead's drip when it detects a reply** — so the email
  side self-heals.
- But the **CRM doesn't know** a reply happened, so:
  - the row stays in `outreach_sent`/Replies-awaiting and won't auto-`engaged`,
  - pending **call tasks won't auto-supersede** (a provider who replied could
    still get a scheduled call).
- Mitigation during the gap: an operator watches `logan@findmedjobs.co` and logs
  replies manually via `ReplyClassifierModal` (which fires `log_email_replied` →
  supersedes pending calls). The `outreach_id` custom field makes the manual
  match trivial.

**BUILT (inert):** `supabase/functions/smartlead-webhook/` — maps Smartlead
reply/bounce events to `email_replied` / `email_bounced` touchpoints, keyed on the
lead's `custom_fields.outreach_id` (email fallback). No-op until
`SMARTLEAD_WEBHOOK_SECRET` is set AND Smartlead is pointed at it.

**G4 exception (sanctioned, documented):** the original plan was to route through
`log_email_replied` / `log_email_bounced`. Not viable — the Vercel WAF that forces
this off Vercel also blocks an Edge→Vercel callback, and the admin route needs a
session the webhook can't mint. So the function writes via the service role
directly: the ONLY non-`route.ts` writer of `student_outreach` state. Kept faithful
by replicating `insertTouchpoint` + `handleLogReply`/`handleLogTouch` exactly and
leaning on the derived-state model (the row surfaces in Replies via derivation).
One divergence: skips `transitionStage`'s `manual_followup` task. Verify the
Smartlead payload shape before activating.

---

## 11. Discipline compliance checklist (G1–G10)

| Rule | How this spec complies |
|--|--|
| G1 no new enum values | Reuses `note_added`, `stage_change`; `engine` is a payload field, not a DB enum |
| G2 no new actions | Extends `schedule_sequence`; **flagged for approval** (§9) |
| G3 no new tables/migrations | Linkage in `research_data.smartlead` JSONB |
| G4 single-writer | Bridge never writes DB; `schedule_sequence` handler is the writer. **One sanctioned exception:** the D2 Edge Function writes touchpoints/status directly (Vercel WAF makes routing through `route.ts` impossible) — see §10. |
| G5 every action emits a touchpoint | `note_added{smartlead_enrolled}` + the transition's `stage_change` |
| G6 one concept per commit | Suggested commits in §12 |
| G7 don't add silently | This doc; G2 surfaced; no new nouns invented |
| G8 verify-before-edit | Spec cites exact files/lines |
| G9/G10 named files untouched | `planSequence` body gets a guard, not a rewrite; modals untouched |

---

## 12. Suggested build order (each independently revertable)

1. ✅ **DONE** — `lib/medjobs/smartlead-bridge.ts` pure helpers
   (`selectEligibleRows`, `rowToLead`, `buildEmailSequence`). No network.
   Verified via `tsx` run (repo has no test framework); `tsc` clean.
   `buildEmailSequence` ships a **first-pass** Markdown→HTML converter that
   diverges from the production renderer (bare `<p>`, unstyled links, no footer)
   — folded into step 2 below.
2. `resolveMailboxPool` + `launchCampaign` orchestration against the live
   account, validated with a **PAUSED** test campaign (this also validates the
   mutation API shapes the stress harness could only mock).
   **Also in this step — body renderer unification:** export `bodyToHtml` from
   `lib/student-outreach/email-send.ts` and have `buildEmailSequence` reuse it
   (one source of truth; the markdown→HTML conversion is mechanical and safe to
   share). The **footer/signature + sender identity + unsubscribe** are the
   genuinely-Logan piece — settle those here too, but separately from the
   mechanical body conversion.
3. `schedule_sequence` `engine: "smartlead"` branch (the G2 edit) + the
   email-task skip guard in `planSequence`'s caller. **This is the whole
   interface for v1** — the existing pre-flight trigger now routes cold email
   through Smartlead. No new UI.
4. ✅ **BUILT (inert, gated)** — D2 Edge Function `supabase/functions/smartlead-webhook/`.
   Service-role direct write (sanctioned G4 exception, see §10). Activate only
   post-warmup + Logan sign-off; verify Smartlead payload shape first.

**Frontend deliberately deferred.** No launch button, no campaigns/monitor page
in v1. The send is tied to admin activities operators already perform; a
dedicated cold-email UI is left to emerge with Logan and the team once real usage
reveals what's actually needed (avoids building a surface nobody uses). The
monitor view (per-campaign send/open/reply, §interface discussion) gets built
only when send volume justifies watching it — and would need stats endpoints not
yet in `lib/smartlead.ts`.

---

## 13. Open decisions for TJ

1. **Copy: translate vs. author fresh** (§6). Rec: translate (one source of truth).
2. **Campaign granularity:** one per campus (rec — clean reporting + per-campus
   timezone) vs. one big campaign with campus as a custom field.
3. **`max_new_leads_per_day`** starting value during the warm-in (rec: 20, ramp to 40).
4. **Suppression source** — confirm the bounce/complaint set is reusable across
   the Resend→Smartlead boundary, or extract a shared address set.
5. **Mailbox #3** — spec assumes 2; trivially scales via the env allowlist if added.
