# /answer-sms -- Answer the SMS Inbox by Hand

Work `/admin/inbox` down to zero real conversations: triage the bookkeeping out, research each remaining family against their own profile and the live web, compose the reply, and send it through the UI so the bookkeeping happens.

> **Status: v1, derived from a full hand-run on 2026-09-19** that answered three families and produced these steps. Nothing here is theory. Every rule below is something that run either got right for a reason or nearly got wrong.

Optional `$ARGUMENTS`:

- No argument: full pass over everything in **Needs reply**.
- `<last10>`: one thread, by the last ten digits of the phone.
- `triage`: bookkeeping only. Clear STOPs and outcome keywords, compose nothing.
- `report`: read and propose. Change nothing, send nothing.

---

## The one constraint that shapes everything

**The send happens in a browser, never through Twilio.** A direct Twilio send skips everything the real path does: the thread never gets marked handled, the draft is never cleared, and `family_answer_jobs.sent_body` is never stamped, which is what makes the draft-vs-sent comparison possible. Sending straight through the API defeats the point of having an inbox.

The `chrome-devtools` MCP is in **attach mode**. It will not spawn a browser. Anthropic's **Control Chrome** extension (`execute_javascript`, `list_tabs`) is *not* registered as an MCP server as of 2026-09-19 and its tools do not load. Do not wait for them. Hand-launch Chrome:

```bash
lsof -nP -iTCP:9222 -sTCP:LISTEN            # must be empty; SIGTERM anything holding it
PROFILE="$HOME/.cache/chrome-devtools-mcp/chrome-profile-google"   # already signed into admin
nohup "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --user-data-dir="$PROFILE" --remote-debugging-port=9222 "--remote-allow-origins=*" \
  --no-first-run --no-default-browser-check --restore-last-session=false \
  --window-size=1440,900 --window-position=40,40 \
  "https://olera.care/admin/inbox" >/tmp/chrome-9222.log 2>&1 &
```

Then just make a `chrome-devtools` call. It reattaches on its own. The Vercel checkpoint clears itself.

**Read through in-page `fetch`, send by clicking the real buttons.** The WAF 429s server-side calls, so `curl` is useless, but `evaluate_script` running `fetch` inside the signed-in page works and is far cheaper than snapshotting a 250-line DOM. Reserve the clicks for the actual sends, so the UI's own confirm gates and state refresh fire exactly as they would for a human.

---

## Ground truth

| Thing | Where |
|---|---|
| Thread list | `GET /api/admin/sms-inbox?unhandled=true` |
| One thread, profile, draft, schedule, quiet hours | `GET /api/admin/sms-inbox/<last10>` |
| Actions | `POST` same path: `reply` \| `save_draft` \| `discard_draft` \| `mark_handled` \| `cancel_scheduled` |
| Inbound texts | `sms_inbound`, keyed `phone_last10` |
| Saved drafts | `sms_drafts` |
| Scheduled sends | `sms_queue` where `origin = 'admin_reply'` and `status = 'pending'` |
| Researched answers | `family_answer_jobs` where `status = 'ready'` |
| Suppression | `do_not_contact`, `phone` = last 10 |
| Quiet-hours policy | `lib/sms/quiet-hours.ts` |
| The drafting engine | `lib/family-answers/engine.server.ts` |
| Send + gate logic | `app/api/admin/sms-inbox/[phone]/route.ts`, `app/admin/inbox/page.tsx` |

The phone IS the identity. Most senders map to no account at all, so never reason about a thread from a profile id.

---

## Phase 1 — Triage before you compose

Most of the queue is not a conversation. Clear it first so the real count is visible.

- **STOP and opt-out keywords.** The Twilio webhook already wrote the `do_not_contact` row. Confirm it exists, then `mark_handled`. There is nothing to answer and replying would 409 anyway.
- **Outcome keywords** (`CALLED`, `APPLIED`, `NO ANSWER`, `NEED DOCS`, `WAITING`, `STUCK`). These are the follow-up chain working. If the outcome is already recorded on the plan and only the inbound rows are unmarked, that is bookkeeping. `STUCK` is the exception: it is a real conversation.

Report the count before and after. On 2026-09-19 this took 7 unhandled down to 3 actual families.

---

## Phase 2 — Read the profile before the message

**Age, income, county and state decide which program is even legal to name.** The GET returns `seeker` with the intake form and their saved plan. Read it before you read the text they sent.

Dorothy Rainey sat four days with no draft because triage read a crisis, correctly, and the engine writes nothing for a crisis. Her age was `60` in the intake form, one field away, and it was the entire answer: at 60 she clears EHEAP, the one Florida program that pays for AC replacement.

Never compose from the message body alone.

---

## Phase 3 — Read what we already sent and what they already tried

**The highest-value check in this list.** Read the whole `messages` array, both directions, not just the last inbound.

Both stale drafts on 2026-09-19 failed the same way: each recommended an agency the family had already called and already reported back on. One told a woman to ask CFCAA to screen her, when she had called CFCAA on 18 Aug and come back on 27 Aug with "none help". When a family has walked a path and told us it failed, the answer is the **next** step, never the same step with more words.

Watch for the correction pattern too. The same family corrected our intake ("I am disabled but not 60"), which silently invalidates every program with an age floor.

---

## Phase 4 — Verify the program is still open today

Programs move, close, and change administrator. Web-search every program name, phone number, URL and deadline before it goes in a text.

Two that were live on 2026-09-19 and will go stale: **EHEAP moved from Elder Affairs to FloridaCommerce this year**, so the Elder Options number we gave a family in August is wrong. The **federal cooling program year ends 30 Sep**, which is the most actionable fact for every Florida family in the queue, and after it passes the right ask is a reopen date, not another screening.

A stale phone number is worse than no phone number. It costs a sick person a call they had to work up to making.

---

## Phase 5 — Compose

- **480 characters max.** The server rejects longer and the box counts for you.
- **One concrete action**, with the number or URL inline. Not a category of help.
- **Plain. No hedging, no over-apologising, no em dashes.** Never call their situation sad.
- Sign `- Olera`.
- **Never quote a dollar figure from the benefits DB.** It is not versioned or verified.
- Save with `save_draft` as you go. Drafts are server-side rows and survive any restart, a crash, or a context compaction.

---

## Phase 6 — Send

**Quiet hours are the server's decision, not yours.** `POST reply` schedules automatically when the recipient's local clock is outside 8am-8pm. You do not have to compute anything.

- **Never click "Send now", and never pass `sendNow: true`, unless TJ says so in this session.** That button exists so urgency is one click away. Urgency is his call, not yours.
- **Crisis threads are exempt and send immediately at any hour.** They also skip the unchecked confirm. That is deliberate: someone who texted at 3am is awake and has asked for help. Expect a bare *Send text* with no schedule option, and say so in the report, because a crisis reply wakes someone up.
- **The schedule label is Eastern; the send is recipient-local.** `formatEtTime` renders the button. "Schedule 2:00 PM" on a Hawaii thread means 8:00 AM HST. Never report the button label as the family's time.
- **The button takes two clicks when the draft was never re-checked.** The second label is "Send unchecked?" or "Schedule unchecked?". Either run **Re-check** first or confirm deliberately, and state in the report which one you did.
- **One scheduled reply per thread.** A second POST 409s with the existing `sendAfter`. Use `cancel_scheduled` to undo; the text goes back to the draft box.
- **A suppressed number 409s.** Do not work around it.

---

## Phase 7 — Verify against the API, then report

The UI saying "Reply sent." is not verification. Re-read `GET /api/admin/sms-inbox/<last10>` for every number you touched:

- **Sent** = `draft: null` and `scheduled: null`.
- **Scheduled** = a `scheduled` object with `id`, `send_after` and `queued_by`.

Report one row per thread with the result and the send time in **both** the recipient's clock and ET. Then append the run to `SCRATCHPAD.md`: what went out, what got held and until when, and anything the queue taught that this file does not say yet.

---

## Rules that cost real time when broken

1. **Free port 9222 before launching.** Only one process holds it. Shut the old one down with `kill -TERM`, never `kill -9`, or Chrome never flushes cookies and the next run lands on a login wall.
2. **Quote `--remote-allow-origins=*`.** Unquoted, zsh globs it and the browser never starts.
3. **`lsof` tells you which browser you are driving, `/json/version` does not.** Dia reports itself as `Chrome/...`. The `COMMAND` column is the only honest check.
4. **Do not probe the profile's cookie store.** The auto-mode classifier denies it as credential exploration. Launch the profile and look at the page instead.
5. **`draft` is one row per phone, not per message.** `save_draft` upserts on `phone_last10`. There is no draft history.

---

## What this command is actually for

The queue looks like 150 threads. It is three or four conversations with people who are sick and waiting, buried in bookkeeping. Phases 1 through 4 exist because the engine cannot do them: it cannot read the intake form against the message, it cannot notice that a family already tried what it is about to suggest, and it cannot check whether a program still exists today. Those three checks are the whole job. The composing is the easy part.
