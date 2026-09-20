# Funnel refinement queue

The running list of what is left to make providers, students, the job board
and advisors good end to end. Raised 20 September. Each item carries what it
is, what has to be decided before it can be built, and where it stands.

**Statuses.** `SHIPPED` — built, on the branch. `READY` — agreed, buildable
as described. `ALIGN` — the shape is not settled; sketch and confirm first.
`CONTENT` — the work is words rather than code, and needs a sitting of its
own.

Once all eleven are done the four worked channels are finished, and student
orgs, campus events and professors are next.

---

## 1 · Move between providers from inside the drawer — SHIPPED

Screening a campus means opening a provider, looking, closing, opening the
next. The drawer now carries the next and previous record so a pass through
sixty providers is sixty clicks rather than a hundred and eighty.

Settled: the order follows the list, not the queue, because screening is a
sweep. The header reads `‹ 3 of 64 ›`, and the count is there because a sweep
of sixty needs to know how much of it is left.

## 2 · Come back to where you were — SHIPPED

Backing out of a record returned to the university with everything collapsed,
so the section had to be reopened every time. Which sections are open and
which record you were last on now live above the summary rather than inside
it; the row is scrolled back to the centre of the view and marked.

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

## 6 · The follow-up block, rethought around getting a meeting — SHIPPED

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

### Built, 20 September

**Four outcomes on every follow-up round**, the same shape already proven on
*Call to confirm the right contact*, where four buttons with hover hints beat
one button and a text box.

| Outcome | What it means | What it queues |
|---|---|---|
| No reply | Nothing came back. Called and emailed again. | The next round, on the existing cadence |
| They gave a time | A date is in hand. | Books the meeting; the remaining rounds are dropped |
| Replied, no time yet | Interested, no date. | The holding rung, three days out |
| Not interested | They declined. | Archives the record |

**A holding rung the board does not have today** — *Keep the conversation
going*. It is not a follow-up round and must not read like one: it shows the
last exchange, and its script replies to a thread rather than opening one.
Its own outcomes are *They gave a time*, *Still talking* (three days), *Gone
quiet* (back into the cadence where it left off), *Not interested*. A counter
runs, and at six rounds without a date a warning suggests archiving or asking
directly — the same restraint as the three-attempt prompt on the calling
rung: a hint, never a block.

**Booking captures three fields** — when, where, and optionally what they
said. Nothing else. `BoardTask.fields` already holds typed values, so this is
a rung input, not a new table.

**The meeting rung** takes over from the cadence. Outcomes: *Meeting held* →
on to the ask; *No-show* → reschedule (the record already counts
reschedules); *Cancelled, rebooking* → repeat.

#### The Calendly question

Three versions, and they differ less than they look:

- **A · a pasted calendar link.** No integration. The admin notices the
  reply, types the time in. Reminders are on us.
- **B · a Calendly link in the email, the admin still types the time in.**
  Identical to A from the board's side, but Calendly holds the calendar and
  sends the reminders — which is the part we are worst at.
- **C · Calendly with a webhook.** `invitee.created` fills the booking fields
  and moves the record on; `invitee.canceled` reopens it. Nobody types
  anything.

**Recommendation: B now, C later, and the design above is unchanged by which
one we pick** — a webhook fills the same three fields a person would.

The reason not to start at C: most providers will not click a link. They will
reply *how about Tuesday at 2* in prose, in a thread, to a person. The manual
path has to exist under every option, so C removes typing only for the
minority who self-book, and it cannot be justified until enough of them do.
B costs one link in one email and fixes the reminders today.

#### What changed from the proposal

**“Gone quiet” was dropped.** It was going to send a stalled conversation back
into the cold cadence, and there is no such thing: once a provider has replied,
the thread is warm for good, and the right next message references what they
said rather than asking whether the email reached the right person. Chasing is
what *Still talking* already does. It also removed the only piece of machinery
in the design — working out which follow-up round to resume at — so the
holding rung has three endings rather than four.

**Booking stayed on the rung that already existed.** The sketch drew the three
fields inline on the follow-up; they are on *Schedule the meeting* instead, so
there is one place a provider meeting is booked no matter which rung the time
came from. That rung will not log without a date and time on it.

**The advancing outcome leads.** *They gave a time* is the first and primary
button, matching the confirming call, even though *No reply* is the one pressed
most often.

**Advisors and student orgs were left alone.** They share the follow-up block,
but their next rung is not a meeting and what the first ask should be is still
open — that is refinement 11. They keep the single “They replied” they have.

#### Two bugs this uncovered

Both on paths that were already live, and neither visible from the screen.

**A “repeat” outcome queued nothing.** The server reads the task rows, closes
the one in hand, then checks whether the rung it leads to is already waiting
— against the copy it read *before* the write. For a repeat the rung it leads
to is this one, so it saw the row it had just closed, decided the next task
existed, and wrote nothing. Voicemail and No answer on the confirming call have
been silently dropping providers off the board. Fixed in all three write paths.

**A no-show queued nothing either.** `resolveNext` had no case for
`reschedule`, so the server returned null where the screen queued the rung
again. Found by an exhaustive check that walks every action on the providers
ladder through both, which is now part of `scripts/check-follow-up.ts`.

## 7 · "Not yet" on a follow-up — SHIPPED

It may not mean anything here. A follow-up is already a dated thing in a
cadence; putting it off by two days is what the next round is. Decide
alongside 6, because the answer depends on what the outcomes become.

**Built:** "No reply" *is* "Not yet", said honestly — it logs the attempt and
queues the next round. Two buttons for one act is a button too many, so "Not
yet" is gone from every follow-up rung on all three ladders, and stays where it
still means something, which is a rung you have not done yet.

## 8 · The deferral menu — SHIPPED

Same question, one level up. Deferring is right for some rungs and noise on
others. Decide per rung rather than globally, once 6 is settled.

**Built,** per rung rather than globally: `defer: false` on a rung that already
runs on a cadence, and nothing else. That is every follow-up round on all three
ladders plus the holding rung. It stays on the confirming call, the programme
email and the booking — things a person does on a day and can honestly put off.
A check asserts the list, so a rung cannot lose its deferral quietly.

## 9 · Students: the meeting and the application open together — SHIPPED

Same as the provider opening block. When an application lands, both are the
next thing and neither waits on the other. The application rung already
closes itself when the student goes live, so a student who finishes alone
needs nothing; a student who needs the meeting to finish it gets both.

Built as `openTogether: 2`, with the same rule the providers block uses: a
rung the system can already see is satisfied is skipped rather than queued,
and so is a rung behind a fact that supersedes it.

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

## 12 · The ask is interest, not a meeting — ALIGN

Raised 20 September, after looking at the shipped follow-up screen. It
supersedes part of 6: the endings are right in shape and wrong in what they
sort for.

**The problem.** The whole provider ladder funnels into a meeting, and a
meeting is a big ask from a cold email. Worse, it is the *wrong* ask — what we
actually need is a provider who says *yes, tell me more*. Some will want a
meeting and that is good; some will happily self-serve. Gating onboarding on a
meeting makes the second kind wait for a calendar slot they never wanted.

**The goal moves.** From *meeting held* to **set up to receive a student**. The
meeting stops being rungs 4 and 5 of the sequence and becomes a branch a
provider can pull us into from any rung, running alongside onboarding rather
than in front of it.

### What the ladder becomes

| Rung | Change |
|---|---|
| Research | unchanged |
| Call to confirm the right contact | gains **They are interested**, which jumps straight to onboarding. A provider who says yes on the first call should not be sent a programme email and seven follow-ups |
| Send the program info | the ask becomes *would you like to hear more*, not *can we find fifteen minutes* |
| Follow up × 7 | see below |
| **Send the onboarding pack** | new. Replaces *Schedule the meeting* |
| **Confirm they can receive a student** | new. Replaces *Log the meeting*, and answers itself from the portal |
| Confirm they have signed up | unchanged, and now means what it says |
| Seasonal | unchanged |
| Keep the conversation going | unchanged branch, renamed outcome |
| **Meet them** | new branch. Optional, from anywhere, never a gate |

### The follow-up screen, rebuilt around the two acts

The rung says *check your inbox; no reply, call then email* — and the button
said **No reply**, which names something the provider did not do rather than
anything we did. Pressing it logged a non-event and queued another round, when
what should happen is the calling and the emailing, now.

So the rung opens on the one question that branches it — **have they replied?**
— and both answers are the start of work, not the end of it.

- **Nothing back** reveals the two acts inline: a click-to-dial button and a
  copy-the-email button, each with a tick. The log button stays disabled until
  both are done, and then reads what actually happened rather than what did
  not. A channel the record does not hold is not offered as a tick.
- **They replied** reveals what the reply produced: **They are interested** ·
  **Interested later** · **Not interested**.

### Interest, wherever it comes from

Interest can arrive by email, on a call, on a callback, or in a voicemail they
left, and all four should start the same thing. Pressing **They are
interested** asks for two facts and nothing else:

- **How did we hear?** Four chips. Worth having because it is the only way we
  will ever know which channel works.
- **They want to meet first.** A checkbox, not a rung. Ticked, it books a
  meeting *alongside* onboarding. Unticked, onboarding starts on its own.

### The onboarding pack

One email, built around one link, carrying six things: how applications reach
them (text, email, portal, and students ringing the office); reviewing an
application in under a minute; setting who they want, through their profile as
students see it and their requirements; applicant → interview → hire → billing
in four lines; the terms and what a hire costs; and their portal link. The
rung will not log without the link, because the email is mostly the link.

**Most of this exists.** `resolveOrClaimProviderProfile` creates the account,
the demand profile and requirements are already captured on
`business_profiles.metadata`, `HireCaregiversBoard` is the review surface,
`pilot/activate` is the self-serve claim, and `interview_terms_accepted_at` is
already how a provider accepts terms. This is wiring, not a new portal.

### The rung after it answers itself

**Confirm they can receive a student** should read three facts from the portal
— account claimed, requirements set, a candidate seen — the way the students
ladder reads its own. A provider set up but not looking is a nudge, not a
chase, and the rung should say which.

### To settle before any of it ships

1. **The billing terms, which are a live conflict and just moved again.**
   `07-OPEN-DECISIONS-AND-CONFLICTS.md` records $250+ per hire, provider only,
   **monthly in arrears**. The new statement is **first hire free, then $250
   per hire invoiced on the confirmed hire**. Those differ on the free hire and
   on the trigger. The onboarding email states the terms, so whatever it says
   becomes the thing providers hold us to — this cannot ship ahead of the
   decision.
2. **Where terms get signed.** Today it is at first *interview scheduling*, and
   that same timestamp is what makes a provider a Client and starts the 90-day
   pilot. Moving it to first *hire* changes both. Same open decision, second
   axis.
3. **Renumbering.** The new rungs take steps 4 and 5, which are written on task
   rows. Count what is actually sitting there before choosing between a
   migration and appending:

   ```sql
   select (payload->>'step')::int as step, t.status, count(*) as rows
   from student_outreach_tasks t
   join student_outreach o on o.id = t.outreach_id
   where o.kind = 'provider' and (payload->>'step')::int >= 4
   group by 1, 2 order by 1, 2;
   ```
4. **Logging a callback on an archived record.** Interest can arrive months
   later. Reviving and then pressing the outcome works, but it is two steps and
   the second is not obvious.

### Where it leaves 3 and 5

It decides them. The programme email and the seven follow-ups are asking for
the wrong thing, so the copy pass is no longer cosmetic — it is the same piece
of work as this.

---

## Suggested order

1. ~~**2, 1, 9**~~ — done.
2. ~~**6, 7, 8**~~ — done. The Calendly question is still open, and the design
   does not wait on it: whichever version we pick fills the same three fields.
3. **12** — the reframe. It changes the goal of the ladder, so it comes before
   any more copy or flow work. Blocked only on the terms decision.
4. **3 and 5** — the copy, which 12 has now decided the shape of.
5. **4** — the map-pack sweep, small once the instructions are written.
6. **11** — advisors, the largest, and the one that benefits most from
   everything above being settled.
7. **10** — waits on the qualification criteria, which is a decision rather
   than a build.
