# Push — Break Your Own Answer

You just gave a conclusion or recommendation. This command is not a request to defend it or restate it more
confidently. It is a request to **try to break it.** If it survives, good — say so and say why it held. If it
doesn't, this is the moment to find out, before code gets written on a shaky premise.

This is a thinking-quality forcing function, **NOT a request to implement. Do not write code while running it.**

The failure mode this exists to kill: **surface-level analysis that sounds authoritative.** A tidy
recommendation built on assumptions you asserted but never verified. The fix is to go to ground truth.

## The bar

> Treat your own prior answer as the thing under review, not the thing being delivered.
> Assume there's a flaw in it and go find it. If there genuinely isn't one, say so plainly — do not
> manufacture doubt to look rigorous.

## Method (do these in order)

1. **Extract the load-bearing assumptions.** List the claims your recommendation actually rests on — especially
   the ones you stated as fact but did NOT verify against a file, a query, or real data. Be honest about which
   were memory, inference, or vibes. These are where it breaks.

2. **Go to ground truth. Read the actual files. Run the actual query.** Do not re-reason from memory — the whole
   point is that your memory of the schema / the gating / the audience / the data is where the error hides. Open
   the code paths that decide the behavior. Pull the numbers if they're pullable. Surface-level analysis is the
   enemy; this step is non-negotiable.

3. **Find the real axis.** Surface framings often split on the wrong variable (the one whose *name* sounds right)
   instead of the one the system actually keys on. Ask: what does the code/data actually branch on? The correct
   decision axis is frequently not the one you first reached for.

4. **Untangle conflated concerns.** When a goal bundles two things ("protect X in case of Y"), check whether the
   proposed lever actually moves both — or whether one lever is primary and the other is cosmetic. Name which is
   which.

5. **Look for the existing decision.** Often the "new" call has already been made elsewhere in the system and the
   current problem is just a gap where it wasn't applied. That reframes a strategy debate into closing a leak —
   a much cheaper, more confident move. Check before proposing something net-new.

6. **Name remaining blindspots — including in the new answer.** The deeper answer has its own assumptions and
   risks. State them. Do not present the revised conclusion as bulletproof; that just recreates the original sin
   one level down.

7. **Say what would settle it.** Identify the specific data, query, test, or file that converts the remaining
   judgment calls into facts. Offer to go get it.

## How to report

Structure the response as:

- **Where I was shallow / wrong** — name it explicitly. "I framed this as X; that's the wrong axis because…"
  Intellectual honesty here is the whole value. Don't bury the correction.
- **The sharper model** — the corrected framing, grounded in what you just verified (cite file:line / the number).
- **The corrected path** — what to actually do, given the better model.
- **Remaining unknowns** — honest blindspots + the specific query/test/file that resolves them, with an offer to pull it.

## What NOT to do

- Don't defend the original answer or restate it louder.
- Don't manufacture objections to seem thorough — a clean survival is a valid, valuable outcome ("I tried to break it on A, B, C; here's why each held").
- Don't reason purely from memory — if you didn't open a file or run a query, you didn't push.
- Don't start implementing. This is a thinking pass. Return to the task only after the user has the sharper picture.

## Reference

The session that birthed this command: a weekly-digest email-domain recommendation. The first answer split on
"cold vs. healthy variant" and treated a domain move as the fix. Pushing it — reading the actual cron gating —
revealed the system splits on **claim state, not variant**; that the biggest leak was the variant whose name
sounded *least* cold; that domain reputation and account-wide suspension are **two different concerns** with two
different levers (and the real fix, verification, was being treated as an afterthought); and that the "new"
decision had already been made for the transactional sibling email — the digest was just the gap. None of that
was visible from the surface. All of it came from opening the files.
