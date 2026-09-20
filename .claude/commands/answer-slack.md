# /answer-slack -- Answer Slack by Hand

Work a chosen scope of Slack down to zero real items: reconstruct the queue without unread state, separate what is blocked on TJ from what he only needs to know, draft in his voice, and post after he approves the batch.

> **Status: v1, derived from a hand-run on 2026-09-20.** Forty mentions over four weeks reduced to **one** genuinely open item. Every rule below is something that run got wrong first.

Optional `$ARGUMENTS`:

- **No argument**: ask which scope to work.
- `dms` | `mentions` | `threads` | `digest` | `all`
- `report`: read and propose. Post nothing, draft nothing.

---

## The one constraint that shapes everything

**There is no unread API.** Nothing lists unreads, nothing lists TJ's DM conversations, and nothing marks anything read. `slack_search_public_and_private` and `slack_read_channel` are the only inputs.

So the queue is **reconstructed by search**, and the signal that replaces unread is:

> **Is the newest message in this conversation from someone else, and is it asking for something?**

**This command will not clear the red badge.** It answers things. Say so rather than implying otherwise.

TJ's user id is `U0131NJURA7`.

---

## Ground truth

| Thing | Where |
|---|---|
| DMs | `slack_search_public_and_private`, `filters: "is:dm after:YYYY-MM-DD"` |
| Mentions | `keywords: ["<@U0131NJURA7>"]`, `channel_types: "public_channel,private_channel"` |
| Threads he is in | `filters: "is:thread with:<@U0131NJURA7>"` |
| Where he has replied | `filters: "from:<@U0131NJURA7> after:..."` |
| Thread contents | `slack_read_thread` with `channel_id` + parent `message_ts` |
| Channel ids | `slack_search_channels` |
| Draft | `slack_send_message_draft` -- **one attached draft per channel, hard cap** |
| Post | `slack_send_message`, which takes `draft_id` to delete the draft on send |

---

## Phase 1 -- Sweep

Paginate. Search returns **20 results maximum** per call with a `cursor` for the next page. Two pages of mentions covered four weeks.

**Never use `response_format: "concise"` during triage.** It strips the `Context after:` block, which is the only evidence that someone already got an answer. On the derivation run, concise mode produced **9 open items out of 40 mentions; context-checked triage produced 1.** A 90% false-positive rate, because TJ answers in threads, often within three minutes, and thread replies are invisible to a channel-level view of the parent.

**`slack_read_channel`'s `oldest` parameter did not filter.** It returned eight-month-old history and burned a large amount of context. Prefer search with `after:` throughout; use `read_channel` only when you already know you want a specific window and have tested it.

**`include_bots: false` does not suppress Slackbot.** `#olera-support` is roughly 95% Slackbot-forwarded email. Filter `USLACKBOT` explicitly, then read the human replies hanging off those parents.

---

## Phase 2 -- Triage into three buckets

1. **Blocked on him.** Newest message is not his and contains a request. These get drafts.
2. **Owes an ack.** Status updates and FYIs where silence reads as disinterest. One line, or a reaction.
3. **Digest.** Channel activity worth knowing, no reply owed. Read and forget.

**Rank bucket 1 by who is stalled, not by message age.** A four-day-old "should I start calling my four providers" outranks a thirteen-day-old "does the laptop need to stay on", because four providers are not being called.

**Decay runs opposite to email.** A 47-day-old email still deserves an answer. A 47-day-old Slack message usually does not -- the moment passed, someone routed around him, or it resolved itself. Part of the job is explicitly closing things out as no longer live.

---

## Phase 3 -- Know who owns what before drafting

**A reply that routes work back to the wrong person is worse than no reply.** It asks someone to operate where they are not comfortable and reads as a brush-off.

- **Esther** -- designer who moved into engineering via vibe coding. Does **not** own customer support, provider issues or database work. Tagging TJ on one of those *is the handoff*, not a request for direction.
- **Ces, Graize** -- provider and care-seeker outreach, calling, CRM.
- **Chantel** -- marketing, SEO, content, Aging in America.
- **Logan** -- cofounder. Strategy, grants, operating model.

When someone hands TJ something outside their lane, the reply confirms it is handled. It does not hand it back.

---

## Phase 4 -- Read the thread, and read what they actually wrote

Read the whole thread, not the mention. A bare `@TJ` usually means the substance is in the parent.

**Re-read their own words before diagnosing.** On the derivation run a provider's support email ended on "the reset link does not work", and four tool calls went into proving a mechanism for that sentence when his *first* sentence -- "I was never prompted to create a password" -- was the actual problem. **Anchoring on the last sentence is the failure mode.** A test that contradicts the hypothesis is a signal to stop, not a gap to close.

---

## Phase 5 -- Compose in his voice, per relationship

His register differs by person: paragraphs on strategy with Logan, instructional and warm with Ces, brisk with Chantel. **Calibrate against the real corpus** -- `filters: "from:<@U0131NJURA7> with:<@USER>"` -- rather than from memory.

- Slack formatting: `<url|label>` links, single-asterisk `*bold*`, **no markdown headers**.
- Match the reply to the question. Most of this bucket is one or two lines.
- Do not manufacture commitments. "I'll look into it" is a new obligation; prefer an answer or a named owner.
- No em dashes. US spelling.

---

## Phase 6 -- Tier by blast radius

Slack messages can be edited and deleted, which email cannot. That makes optimistic execution reasonable **but not uniform**, because the damage is in the reading, not the persistence.

| Tier | Examples | If wrong | Rule |
|---|---|---|---|
| **Green** | acks, "seen, will look tomorrow", reactions | ~zero | auto-send once proven |
| **Amber** | loop-closers: "yes, go ahead", "here is the document" | someone does work they should not have | auto-send once proven |
| **Red** | loop-openers, anything committing him to a position in front of the team | he is publicly committed and correcting it reads as contradicting himself | **always his to send** |

**Earn the tiers; do not flip a switch.** First run fully supervised. If green and amber come back at or near 100% agreement, green goes auto on run two, amber on run three. Red never graduates. **A strike resets that tier.**

---

## Phase 7 -- Batch review, then post

**Slack drafts cannot hold a batch.** `slack_send_message_draft` allows one attached draft *per channel*, and a single channel routinely holds four items. So **the review happens in the terminal**: numbered list, full text, TJ approves or strikes individual items.

Then post with `slack_send_message`, passing `thread_ts` to reply in-thread and `draft_id` to delete the staged draft in the same call. Default to in-thread; a top-level post only when the answer matters to the whole channel.

**Reach for `slack_send_message_draft` by default.** Its own docs say so: *"If user has not reviewed the message, use slack_send_message_draft instead."*

---

## Phase 8 -- Summary DM, and the hard stop

Post a summary to his DM with himself (`channel_id: U0131NJURA7`): recipient, channel, the message verbatim, and a **permalink** so a correction is one tap. Search results carry `Permalink:`; `slack_send_message` returns `message_link`. Links, not prose.

**The hard stop: this command answers the backlog once. It never answers a reply to its own message.** A follow-up goes into the next run's queue for him. Without that rule, "reduce the backlog" quietly becomes "Claude is having conversations as TJ while he sleeps," which is a different product and not the one he asked for.

---

## Phase 9 -- Follow the item out of Slack

A Slack item is often a pointer into another system. On the derivation run the one open item was a forwarded provider support email, and answering it meant reading `support_email_threads`, the auth users table and `business_profiles` before a single word was written.

**Handle it end to end rather than acknowledging it.** If it belongs to another command, say so and hand over: provider and care-seeker email is `/answer-email`, inbox triage is `/email-checker`.

Then verify, and append the run to `SCRATCHPAD.md`.

---

## Rules that cost real time when broken

1. **`concise` during triage manufactures false positives.** 9 of 10 items it flagged were already answered.
2. **Search caps at 20 per page.** Paginate or you will conclude the backlog is smaller than it is.
3. **`slack_read_channel`'s `oldest` did not filter.** Verify a window on a small limit before pulling 30 messages.
4. **Slackbot survives `include_bots: false`.**
5. **Raw mention count is not backlog.** TJ replies fast. Most mentions are closed within the hour.
6. **Do not measure from one page and design for it.** A quiet fortnight is not the steady state; he has gone weeks without catching up. Build for the heavy case, report the light one honestly.

---

## What this command is actually for

The unread count looks like a wall. Behind it, on a good week, is one person genuinely waiting. On a bad one it is dozens, and the difference between those two worlds is not effort, it is whether anything separates *someone is blocked on you* from *something happened that you would want to know*.

Phases 2, 3 and 6 are the job. The composing is the easy part.
