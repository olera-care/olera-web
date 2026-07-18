# MedJobs Outreach — Email Launch & Domain Warmup Plan

> Companion to `OPERATIONAL_BRIEF.md`. This is the **ops** plan for getting cold + activation
> outreach live without burning sender reputation. The copy + wiring are in code; the warmup and
> sending discipline below are operational and happen in the Smartlead dashboard + your DNS host.
>
> Framing note: the program is **"Olera's {campus} Student Caregiver Program"** everywhere now
> (no "internship"). The single source for the name is `programName()` in
> `lib/student-outreach/templates.ts`.

---

## 1. How sending works today (the moving parts)

| Piece | Where | Notes |
|--|--|--|
| **Cold + activation cadence** | Smartlead | Campaigns created PAUSED; a human starts them in the Smartlead UI. Email days become sequence steps; phone days stay as CRM call tasks. |
| **Day-0 inline / transactional** | Resend | Some sends go inline via Resend; Smartlead carries the multi-step cadence. |
| **Sender pool (rotation)** | `SMARTLEAD_SENDER_EMAILS` env (allowlist) | Smartlead **rotates across whatever mailboxes are in this pool, per campaign**. This IS the rotation mechanism. Add/remove warmed inboxes here. |
| **Events → admin UI** | `supabase/functions/smartlead-webhook` | sent / reply / open / click / bounce / unsubscribe → touchpoints in the drawer. **Inert until `SMARTLEAD_WEBHOOK_SECRET` is set.** |
| **Warmup automation** | NOT built (D25) | Smartlead's own warmup feature is used per-mailbox in its dashboard; there is no in-app warmup orchestration yet. |

**Key implication:** "domain rotation" = curate the mailbox pool + let Smartlead spread sends. There is
nothing to build to rotate; there IS work to **warm** new mailboxes before they enter the pool.

---

## 2. Domain strategy (protect the primary)

Do **not** send cold volume from `olera.care` — that's the transactional/brand domain and a cold-send
reputation hit there would damage real user email (auth, receipts, family/provider notifications).

- **Use a dedicated cold-outreach domain** (a clean lookalike), e.g. `findmedjobs.co` (already the
  current sender per the brand-jump one-liner in the provider intro) or a fresh `try-olera.com` /
  `oleramedjobs.com`. Pick **one** launch domain with a name that reads legitimately for a
  Dr. DuBose / Olera program.
- Stand up **2–4 mailboxes** on that domain (e.g. `graize@`, `dubose-team@`, `students@`,
  `partners@`). Multiple mailboxes on one warmed domain is the cheapest way to get rotation headroom.
- DNS per domain: **SPF + DKIM + DMARC** (start `p=none`, move to `quarantine` after data), plus a
  **custom tracking domain** in Smartlead so open/click links aren't on a shared tracker.

---

## 3. Warmup plan (the 2–4 week runway)

1. Create each mailbox; verify SPF/DKIM/DMARC are green.
2. Turn on **Smartlead warmup** per mailbox. Let it run **2–4 weeks** before any cold send.
   - Target ~40–50 warmup emails/day/mailbox at a healthy reply rate.
   - Watch the warmup/health score; do not cold-send a mailbox until it's consistently "good."
3. Ramp real cold volume slowly once warm: **~20/day/mailbox week 1**, then +10–20/day each week,
   capping around **40–50/day/mailbox** for cold. Activation/partner-welcome volume is tiny and warm,
   so it rides on top safely.

---

## 4. Launch sequence using the two warm inboxes you have now

You don't have to wait for the new domain to start — run a **small, careful pilot** on the two
already-warm inboxes while the new domain warms in parallel.

**Week 0 (now):**
- Put the **two warm inboxes** in `SMARTLEAD_SENDER_EMAILS`.
- Set `SMARTLEAD_WEBHOOK_SECRET` so replies/opens/bounces flow into the admin UI (otherwise the team
  is flying blind).
- Seed **1–2 Sites** (per the brief: validate catchment + provider data first).
- Launch **one** provider cold campaign at **low volume** (~20–30 sends/day total across both
  inboxes). Keep activation + partner-welcome ready but triggered by real signals.
- Start the **new launch domain's** mailboxes warming in Smartlead the same day.

**Weeks 1–3:**
- Hold provider cold at a conservative daily cap on the two warm inboxes; log replies, watch bounce +
  complaint rates (see §5). Iterate copy from real replies.
- New-domain mailboxes finish warmup.

**Week ~3–4 (scale):**
- Add the **warmed new-domain mailboxes** to `SMARTLEAD_SENDER_EMAILS`. Smartlead now rotates across
  the larger pool.
- Begin ramping per the schedule in §3. Expand to more Sites once catchments are validated.

---

## 5. Guardrails (when to slow down)

| Signal | Threshold | Action |
|--|--|--|
| Bounce rate | > 3–4% | Pause that mailbox; clean the list; re-verify addresses before resuming. |
| Spam complaints | > 0.1% | Pause; review copy + targeting; the `email_complained` path auto-DNCs the recipient. |
| Warmup/health score | drops below "good" | Pull the mailbox from the pool; let warmup recover. |
| Reply rate | trending toward zero | Copy/targeting problem, not a deliverability one — iterate the sequence. |

---

## 6. Pre-launch checklist

- [ ] New launch domain chosen + purchased; SPF/DKIM/DMARC + custom tracking domain configured.
- [ ] 2–4 mailboxes created on it; Smartlead warmup running (2–4 weeks).
- [ ] `SMARTLEAD_WEBHOOK_SECRET` set (events flow to the admin UI).
- [ ] `SMARTLEAD_SENDER_EMAILS` = the two warm inboxes (new-domain mailboxes added after warmup).
- [ ] 1–2 Sites seeded; catchment + provider data spot-checked.
- [ ] One provider cold campaign launched at low volume; replies landing in the In Basket.
- [ ] Copy reviewed end to end (done — all sequences are on the Student Caregiver Program framing).

---

## 7. What is NOT built (so expectations are right)

- **Automated warmup / reputation orchestration in-app** (D25) — handled in the Smartlead dashboard
  for now.
- **Inbound reply auto-classification** (D2) — admins classify replies manually in the Reply modal.
- The webhook is **inert until the secret is set** — setting it is step one of any live launch.
