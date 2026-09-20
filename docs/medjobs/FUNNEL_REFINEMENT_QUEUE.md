# Funnel refinement queue

The running list of what is left to make providers, students, the job board
and advisors good end to end. Raised 20 September. Each item carries what it
is, what has to be decided before it can be built, and where it stands.

**Statuses.** `READY` — agreed, buildable as described. `ALIGN` — the shape
is not settled; sketch and confirm first. `CONTENT` — the work is words
rather than code, and needs a sitting of its own.

Once all eleven are done the four worked channels are finished, and student
orgs, campus events and professors are next.

---

## 1 · Move between providers from inside the drawer — READY

Screening a campus means opening a provider, looking, closing, opening the
next. The drawer should carry the next and previous record so a pass through
sixty providers is sixty clicks rather than a hundred and eighty.

Open: whether the order follows the list (alphabetical) or the queue (what is
due first). Probably the list, since screening is a sweep.

## 2 · Come back to where you were — READY

Backing out of a record returns to the university with everything collapsed,
so the section has to be reopened every time. It should return with that
section already expanded and the record you were on in view.

## 3 · Every email and call script, reviewed — CONTENT

All of it in one pass rather than rung by rung: the provider programme email,
the seven follow-ups, the call scripts, and the same for advisors once 11 is
settled. Needs the positioning decided first — see 6 and 11, both of which
turn on what the email is actually asking for.

## 4 · A final sweep against the Google map pack — ALIGN

The directory is where the provider list comes from and it will have missed
agencies. After the loaded providers are worked, one last task per campus:
search the map pack, compare against what is on the board, and add by hand
anything viable that is not there.

To settle: what counts as viable, written as instructions somebody can follow
without judgement calls; how the task knows it is done; whether it recurs.
Adding a provider by hand already exists, so the UX cost is small — this is a
question of instructions, not machinery.

## 5 · The provider flyer — CONTENT

Read it as a whole and improve the copy. Same sitting as 3.

## 6 · The follow-up block, rethought around getting a meeting — ALIGN

The largest item. Today a follow-up round is *check your inbox, then call and
email again*, and the only outcomes are logging that or "They replied", which
takes a summary and moves on. That does not describe what actually happens.

Four things a provider can do, and only the first is handled:

- **Nothing.** Call and email again. Works today.
- **Reply with a time.** Book it and move to the meeting. No path today.
- **Reply, interested, no time given.** Needs a way to keep the exchange
  going and arrive at a time — which may take several rounds over weeks.
  No path today.
- **Reply, not interested.** Close it. No path today.

So the reply needs a second question after the summary: what did it produce.
And the third case needs a state the board can hold — *talking, no time yet*
— that prompts a return without pretending it is a cold follow-up.

To settle: whether scheduling goes through Calendly or a calendar link.
Calendly automates reminders and could webhook back to organise meetings,
which is the argument for it; the argument against is forcing a tool into a
flow that a pasted link would serve. Not decided.

## 7 · "Not yet" on a follow-up — ALIGN

It may not mean anything here. A follow-up is already a dated thing in a
cadence; putting it off by two days is what the next round is. Decide
alongside 6, because the answer depends on what the outcomes become.

## 8 · The deferral menu — ALIGN

Same question, one level up. Deferring is right for some rungs and noise on
others. Decide per rung rather than globally, once 6 is settled.

## 9 · Students: the meeting and the application open together — READY

Same as the provider opening block. When an application lands, both are the
next thing and neither waits on the other. The application rung already
closes itself when the student goes live, so a student who finishes alone
needs nothing; a student who needs the meeting to finish it gets both.

We meet every student regardless, so the meeting does not disappear when the
application completes on its own.

## 10 · Students: qualify the application — ALIGN

A rung after the application is complete, deciding whether the student is
qualified. Logan's reading: it needs a complete application *and* a meeting,
so it may belong open alongside those two rather than strictly after.

To settle: **what qualified means.** There are no criteria today, which MATRIX
already flags at QUAL — *the moment a student presses Go Live, the system
tells providers a candidate is ready to interview, and that is a
qualification claim made under our name with no criteria behind it.* This
rung is where that gets fixed, so the criteria have to be written before the
rung can exist.

## 11 · Advisors, end to end — ALIGN

The bones are there; the flow is not. Nothing comes from the directory, so a
new university starts at zero and the first rung is research — going online
to find the advising offices and career centres. Then the same shape as
providers: confirm the contact, send the programme, follow up.

What makes it different, and harder:

- **The ask is a relationship, not a signature.** An advisor can circulate a
  flyer, name the student organisations, say which campus events matter, and
  open the door to professors. Asking for all of it at once buries them.
- **The first ask is the whole thing.** Meet to discuss, or here is the
  information — self-serve. Those pull in opposite directions and the right
  answer probably depends on the campus.
- **A reply can generate work.** If they say post it here, sign up for that,
  email this person, we do those things first and then come back having done
  them. That is a real and unpredictable list of tasks the board has no way
  to hold.
- **The terminal state is not a signature either.** It is a seasonal rhythm
  with a named plan: what goes out each term, through which channel.

So this may need custom tasks — a way to log and track what an advisor asked
for. Worth resisting until the shape is clear, and worth building if the
alternative is work that happens off the board.

---

## Suggested order

1. **2, 1, 9** — the three that are agreed and make everything else easier to
   work with. One pass.
2. **6, then 7 and 8** — one surface, one decision. The Calendly question
   first, because the outcomes hang off it.
3. **3 and 5** — the copy, once 6 has settled what the emails are asking for.
4. **4** — the map-pack sweep, small once the instructions are written.
5. **11** — advisors, the largest, and the one that benefits most from
   everything above being settled.
6. **10** — waits on the qualification criteria, which is a decision rather
   than a build.
