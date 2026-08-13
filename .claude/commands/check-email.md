# /check-email -- Process the Olera Support Inbox

Work the `support@olera.care` queue toward zero: surface what a human must answer, file what nobody needs to, suppress anyone who asked us to stop, and report what changed.

> **Status: v2, hardened by one full run on 2026-08-12** that took the queue from 2,703 to 906 and turned up six bugs. Phase 7 captures what each run teaches. The classifier, the filters, and the protected list are all still being tuned.

Optional `$ARGUMENTS`:

- No argument: process everything new since the last run, plus a backlog pass.
- `new`: only threads that arrived since the last recorded run. Fast daily check.
- `backlog`: only the aged tail. Use when deliberately working history down.
- `report`: analysis only. Produce the summary, propose nothing, change nothing.

---

## The one constraint that shapes everything

**Claude cannot execute the mutating endpoints.** `bulk-noise`, `bulk-handle`, `bulk-archive`, and every write in `/admin/support-email` require an admin browser session, and the Vercel WAF 429s server-side calls. Only TJ can click them.

So this command is: **Claude analyses and decides, TJ executes, Claude verifies.** Never claim a sweep ran because you generated the URL. Read the database afterward and confirm.

Claude *can* read and write Supabase directly with the service role key in `.env.local`, which covers analysis, `do_not_contact` writes, and all verification.

---

## Ground truth

| Thing | Where |
|---|---|
| Queue state, categories, agent recommendations | `support_email_threads` |
| Message bodies | `support_email_messages` |
| What was done, per thread | `support_email_actions` |
| Bulk-run history (the run watermark) | `audit_log` where `action LIKE 'support_email_bulk%'` |
| Suppression list | `do_not_contact` |
| Architecture | `docs/support-email.md` |

Gmail is the transport source of truth. Supabase owns triage state. `state` is derived from Gmail labels, so never reason about the inbox from `state` alone -- check `gmail_label_ids`.

---

## Phase 1 — Orient

Establish the watermark and the shape of the queue.

```
last run       = MAX(created_at) FROM audit_log WHERE action LIKE 'support_email_bulk%'
active         = state IN ('needs_reply','escalated')
in Gmail inbox = gmail_label_ids @> ARRAY['INBOX']
```

Report: active total, unread total, inbox total, and a per-category breakdown. Then split it: **arrived since the last run** vs **backlog**. Most of this queue is archaeology, and a run that re-litigates 1,500 old threads every time is useless.

**Check the classifier's health before trusting any category.** Count threads whose `agent_summary` is exactly:

> This message needs human review; the support recommendation was unavailable.

That string is the safe fallback. Every one of those threads was never classified. If the count is climbing, the classifier is broken, not the mail -- and every category number below it is understated. It reached **395 threads, a quarter of the queue**, before anyone noticed, because the failures pile into `other` and `other` looks like a category rather than a bug.

**Baseline after the 2026-08-12 cleanup**, so a future run knows what normal looks like: active 906, unread 480, `other` 14, voicemail 425, provider 210, care_seeker 74, billing 67, legal 40.

Chunk every `.in()` query at **200 IDs**. PostgREST silently returns `null` past roughly 400 -- it does not error. A `null` count is a failed query, not a zero.

---

## Phase 2 — Protect before you process

Pull these out **first**, every run. They are the business, and no sweep may ever touch them.

**Never auto-process:** `care_seeker`, `provider`, `legal`, `billing`, `voicemail`.

`security` is **not** on that list, despite sounding like it should be. It is 231 threads split 125 `urgent` / 106 `high` with nothing lower, because the classifier writes "possible account compromise" on every routine new-device sign-in. A shared mailbox used by a distributed team generates exactly that pattern. Treat the adjectives as noise, not evidence -- what protects that bucket is the identity, voicemail and opt-out guards, not the category.

Then actively hunt for these, because the classifier does not model them:

1. **Opt-outs.** First-person requests to stop: `remove me`, `take me off`, `stop emailing`, `stop contacting`, `unsubscribe me`, `leave me alone`, `do not contact me`, `never signed up`, plus a body that *starts with* "done" (the literal instruction in Olera's outreach). Never match bare `unsubscribe` or `opt out` -- that boilerplate is in every legitimate marketing footer.
2. **Listing / authorization complaints.** `did not authorize`, `I am not a group home`, `take my listing down`, `remove me from your website`. These are trust-and-safety, not support.
3. **Unanswered real leads.** `care_seeker` threads with `message_count = 1`, no outbound reply, aged past a week. A family asked for help and nobody answered.

For opt-outs, **write `do_not_contact` yourself** -- Claude can do this. Check for an existing row first and insert only what is missing; never overwrite. `reason` is CHECK-constrained: `provider_request | angry_optout | legal | spam_complaint | other` (plus `sms_stop`, added by a later migration that 128 does not reflect). Put the verbatim quote and date in `note`.

Everything else in this phase gets **surfaced to TJ, not actioned**. Naming a stuck family is the highest-value thing this command does.

---

## Phase 3 — Mechanical cleanup

Only after Phase 2. Produce the exact click-list, in order, with the numbers you measured:

1. **Archive the noise categories** — `/api/admin/support-email/bulk-noise`. Sweeps `marketing`, `automated`, `security`, `partner`, `internal` and archives in one pass. This is the workhorse; start here.
2. **Archive what is already decided** — `/api/admin/support-email/bulk-archive`. Files any remaining `handled` or `noise` threads out of the Gmail inbox.
3. `bulk-handle?category=marketing|automated` still exists and gates on confidence ≥ 0.95. It is now the conservative option, useful when you want to sweep without archiving.

Dry run first, always. The response carries a `confirmUrl` whose `confirm=` is the exact cohort size. Tell TJ to use the number the dry run returns, never a remembered one -- a mismatch 409s, which is the safety net working, not a failure.

4. **Audit the mailbox's Gmail labels** — `/api/admin/support-email/labels`. Read-only; joins real label names and message counts with recency. There is no delete path, and there should not be: removing a Gmail label is irreversible and dissolves the grouping on every message that carried it.

Prefix every URL with `https://olera.care`. Browser only.

**After a large sweep the admin header will read "Catching up" for a while.** A batch of 1,000+ label changes lands in Gmail's history as very few records, and the sync worker walks one record per pass by design (`HISTORY_PAGE_SIZE = 1`). That is the bounded-sync fix doing its job, not a stall. Do not re-run anything to "help".

**Confidence is the wrong gate for whole categories.** The early sweeps required ≥ 0.95 and a single-message thread. That is right when the question is "is this cold solicitation?", because a wrong answer buries a real person. It is wrong for categories nobody reads either way: a cold pitch does not become worth reading because the model was 0.92 sure, or because the sender followed up twice. Gate on *identity, voicemail and opt-out*; those are the guards that carry weight.

Before proposing a sweep, **read the dry-run sample**. If any entry looks like a real person rather than a vendor, stop and say so.

---

## Phase 4 — The long tail

After the noise sweep, what remains is `voicemail`, `provider`, `care_seeker`, `legal` and `billing` -- all real work by definition, none of it sweepable.

For the aged tail the honest lever is **age, not category**. A voicemail from four months ago will not be returned; a provider email from last autumn is cold. Archiving is not a claim that something was handled -- it is admitting it aged out, and nothing is lost because everything stays in All Mail.

**Never apply an age rule without an explicit cutoff from TJ**, and never apply one to `care_seeker` or `legal` regardless of the cutoff.

`voicemail` is the largest bucket and is not cleanup. Those are real inbound calls. Summarize the callbacks worth making; do not propose burying them.

---

## Phase 5 — Verify

After TJ runs anything, **query the database**. Do not trust the endpoint response alone.

- Did the counts move by the amount claimed?
- `support_email_actions` rows == threads processed, no duplicates?
- One `audit_log` entry per run with the filter recorded?
- Did anything protected get caught? `care_seeker` count must be unchanged.
- Threads that were swept: `unread = false`, correct state, and for archives `gmail_label_ids` no longer contains `INBOX`.

State plainly what moved and what did not.

---

## Phase 6 — Report

Short, in TJ's register. Lead with what needs him.

1. **Needs a human** — named threads, with the sender, the ask, and how long it has been waiting. This goes first.
2. **What changed** — counts before and after, what was swept, archived, suppressed.
3. **What is left** — by category, with the honest note that the tail needs a decision rather than another sweep.
4. **Open decisions** — the age cutoff, anything ambiguous you refused to guess on.

Use real numbers. "Active queue 2,703 → 1,575" beats "made good progress."

---

## Phase 7 — Improve this command

Every run should teach it something. Note anything worth folding back in:

- A classification that was wrong in a way the filters do not catch.
- A new opt-out or complaint phrasing worth adding to Phase 2.
- A category that should join the protected list.
- A bug in the endpoints themselves. Six were found by running this for real, none by reading the code: `mark_handled` never touching Gmail, thread state resurrecting when someone merely read the mail, the archive route re-offering work it had already done, archiving destroying the `noise` classification, a JSON parse failure hiding a quarter of the mailbox, and an over-conservative confidence gate that spared cold spam nobody wanted.

Propose the edit. Do not silently change the filters.

### Re-classifying threads the classifier failed on

When Phase 1 finds a pile of fallback summaries, they can be re-run in bulk **without waiting for new mail**, using the real classifier rather than a copy of its prompt:

1. `lib/support-email/classify.server.ts` imports `server-only`, which does not resolve under `tsx`. Create a no-op shim at `node_modules/server-only/index.js` (gitignored, so it never ships) and the real module imports cleanly.
2. Read each thread's messages, map them back to `NormalizedGmailMessage` shape, and call `classifySupportThread({ messages, identity })`.
3. Write `category`, `priority`, `agent_summary`, `agent_reason`, `agent_confidence`, `suggested_action`, `agent_risk_flags`, `analyzed_at`, `analysis_message_id`, plus a `support_email_recommendations` row.
4. **Do not touch `state`.** Re-reading a thread is not a triage decision; the sweeps own that and they have dry-run guards.

Concurrency of 4 is comfortable. 395 threads cost a couple of dollars on Haiku and a few minutes.

---

## Guardrails

- **Never claim an endpoint ran.** Claude cannot call them. Verify in the database.
- **Never bulk-process `care_seeker`, `provider`, `legal`, `billing` or `voicemail`.** Not at any confidence, not at any age.
- **Do not read the classifier's adjectives as evidence.** It calls routine sign-in alerts "possible account compromise". Check what actually happened before escalating anything.
- **Never auto-reply.** Drafts are advisory; a human sends.
- **One Supabase instance behind staging and production.** Anything you touch is live. There is no sandbox.
- **Crons run against production only.** Staging has no cron; use Sync now.
- **Chunk `.in()` at 200.** Silent `null` past ~400.
- **Opt-outs get suppressed, never buried.** The reply *is* the opt-out record.
- **A big sweep costs the sync worker.** 1,000+ label changes land as very few Gmail history records; expect "Catching up" and let it drain.
- **The queue is not the whole mailbox.** TJ's own Gmail labels sit outside it -- `Care Seekers` alone held 105 unread that no sweep ever saw. Say so rather than implying the inbox is clear.
- **When a thread is ambiguous, surface it.** Cost of asking is one line; cost of burying a family is the whole product.
