# Not an agency: where the initiative stands

**The one place for this initiative.** Open this file first. It pulls together the memo, the pilot scope and the 10 Oct Cortex brief, and says what is decided, what is open, and what happens next. Change this file when anything moves. If an entry in the log at the bottom is more than two weeks old, the thread has stalled.

**Last updated:** 11 Oct 2026, from Cortex brief d245251b (raised in #cortex on 10 Oct).

**Sources** (every line below cites one):

| Short name | What it is |
|---|---|
| **Memo** | `docs/strategy/not-an-agency-caregiver-marketplace.md`, PR #2295, merged to staging 30 Sep, in production 30 Sep (promotion #2309) |
| **Scope** | `docs/strategy/family-direct-pilot-scope.md`, PR #2314, merged to staging 7 Oct, in production 7 Oct (promotion #2448). Written 1 Oct |
| **Brief** | Cortex handoff d245251b, 10 Oct 2026: TJ's ask in #cortex and the questions Cortex raised |
| **Scratchpad** | `SCRATCHPAD.md`, entries dated 30 Sep to 4 Oct (the Assisting Hands North Texas pilot) |

---

## 1. What it is

Instead of only matching families to agencies, Olera would help families find non-medical home caregivers directly. TJ's reasons: agencies don't respond, cost too much, aren't nearby, or aren't the right fit (Memo §1, quoting TJ on 30 Sep). He named it "not an agency", limited it to non-medical home care, and called liability the central problem (Memo §1).

It is not new. Olera 3.0's Phase 2, decided at the 14 May 2026 Product Development meeting, is "families to caregivers direct, with the family as customer" (Memo §2). Chantel Wright's 3 Sep competitor research covered the same ground and recommended the opposite structure: a licensed agency that employs its caregivers (Memo §2).

## 2. What the memo recommends, and why

**The memo was revised the same day it was written, and the brief describes the first version.** The first commit (`a13efcfe8`, 30 Sep) recommended keeping January on the broker model, with family-direct as a post-award decision. After TJ's follow-up, the memo was revised (`32403106f`, then `4c2dea3ef`). The version merged in #2295 recommends something different:

- **Test family-direct now, narrowly, as a pilot Olera runs and pays for itself,** and name it in the January application as a second path to commercial traction (Memo §6).
- **Shape: a registry (model A) with companion and homemaker scope only.** The family is the employer. Olera vets and matches. No hands-on personal care. No payroll or insurance program for Olera. It can be stopped in a day. Counsel confirms the state's exemption before the first family (Memo §6).
- **Why:** the committed model has three gates Olera doesn't control (university, student, provider), and the notes show it blocked at the university gate (University of Florida, 28 Sep). Family-direct removes two of them: families already come to Olera, and working caregivers don't need a university (Memo §2).
- **Stop lines** (proposed by the memo, not set by anyone): any safety incident; fewer than 15 vetted caregivers after 4 weeks; under half of requests matched within 14 days; under a third of matched families booking again within 30 days; no written counsel confirmation means no launch (Memo §7).

The three models, by who employs the caregiver (Memo §3):

| Model | Employer | Against the January application (Memo §4) |
|---|---|---|
| A. Registry | Family | Contradicts it |
| B. Olera as agency | Olera | Contradicts it |
| C. Broker into licensed agencies | Provider | Extends it (this is the committed Caregiver Staffing model) |

One inconsistency to know about: Memo §6 says the pilot goes into the application "as a second path to commercial traction, not a fallback", and two paragraphs later says it is "named honestly in the application as the fallback". The Scope says "No CRP document changes until the pilot has numbers" (Scope, last section). How the application describes this is not settled.

## 3. What the pilot scope says

The Scope answers one question: can a minimal pilot be live by mid-October? Its answer is **yes, but only as a hand-run concierge pilot in Dallas-Fort Worth with paid demand** (Scope, short answer).

- **Demand is thin.** 807 families sent an inquiry in the 90 days to 1 Oct; 132 tagged Home Care. Dallas-Fort Worth is the densest metro at 27 families, 5 tagged Home Care: about two home-care families a month (Scope §1). So the pilot has to buy demand: 20 requests at September cost per lead is about $1,500 to $3,000 (Scope §3, item 5).
- **Metro: Dallas-Fort Worth,** because it has the most demand, Texas law is already researched, and the ad setup exists (Scope §2).
- **Nothing gets built to start.** A person matches the first ten families with a shared sheet and the existing inbox (Scope §3, item 8).
- **What blocks launch, in order:** counsel's written sign-off on the Texas registry model, including whether a family fee keeps the exemption; insurance; a vetting vendor; family and caregiver terms; a named ops owner (Scope §3).
- **The planned timeline** assumed counsel engaged 1 to 14 Oct and confirming around 15 Oct, which was the launch date (Scope §4).

## 4. Where it actually stands (11 Oct)

- **No record that the pilot has started.** Nothing in the repo or the scratchpad shows counsel engaged, an insurance or vetting quote, an ops owner named, ad spend approved, or caregiver jobs posted. The brief found no Slack discussion of it through 9 Oct (Brief). Some of this may have happened outside the record; only TJ can say.
- **The "mid-October" date depends on counsel, and counsel is the real gate.** The Scope ties launch to counsel's answer and says: if counsel can't answer by about **1 November**, April is the honest submission date (Scope §4, §6). So "mid-October" should not be rolled forward quietly. It should be restated as "launch when counsel confirms in writing; decide January or April by 1 Nov."
- **The January bar is paying providers.** The commercial-readiness claim rests on twelve providers who have paid by 5 Jan 2027; the count is one (Brief). A registry pilot adds no paying providers. It adds evidence of family demand and caregiver supply, and revenue only if counsel allows a family fee and TJ chooses to charge one (Scope §5).

## 5. The Assisting Hands Dallas pilot: separate, but in the same metro

The brief asked not to conflate the two, and to say so if the Scope links them. **It does, by geography:**

- The Scope picks Dallas-Fort Worth and names Robbie: "Assisting Hands Dallas (Robbie) wants North Texas preferred-provider status but isn't paying" (Scope §2). That was true on 1 Oct.
- On 30 Sep, TJ and Logan agreed a North Texas pilot with Robbie in principle: **every North Texas family routes to Robbie** (Scratchpad, 30 Sep late entry). An Olera-run Assisting Hands North Texas Meta form went live 1 Oct, $150 to 15 Oct (Scratchpad, 1 Oct). Robbie's first family came through the Dallas form on 3 Oct (Scratchpad, 4 Oct). A check-in call with Robbie is booked for Wed 14 Oct (Scratchpad, 1 Oct and 4 Oct entries).

So the two pilots want the same families in the same metro. Robbie was not paying on 1 Oct (Scope §2), but paying providers are the number the January application rests on (Brief), so a provider in an active pilot matters more than his current revenue. TJ has said competing with customers is not a concern (Memo §1 follow-up, point 2), and the Scope flags it only "so the Robbie conversation isn't a surprise." Whether family-direct still belongs in DFW, given Robbie's pilot, is open (question 5 below).

## 6. Decided and open

**What TJ said** (his own words, as quoted in the sources):

- The application can't rest on students alone: "Everything is up in the air. The January application won't hold if we say it's only students and we're not able to show commercial traction with students." (Memo §8, 30 Sep)
- Competing with customers is not a concern: the Amazon model, own goods alongside a vendor market (Memo §1 follow-up, 30 Sep).
- Be nimble, but "not just do something that is doomed from the start" (Memo §1 follow-up, 30 Sep).
- He wants an active working session on this, with the pieces in one place first, and he doesn't trust that the current state is as settled as it sounds (Brief, 10 Oct).

**What the documents recommend, not confirmed by TJ:**

- A registry pilot, companion and homemaker scope, family as employer (Memo §6).
- Dallas-Fort Worth, hand-run, with paid demand (Scope §2).
- The stop lines in §2 above (Memo §7: "TJ sets them before the pilot starts").
- Mid-October launch (Scope §4).

**Open questions.** Answers go here as TJ gives them.

| # | Question | Source | Answer |
|---|---|---|---|
| 1 | What form should the single place take: this file, a checklist, or something opened daily? | Brief | *Open.* This file is the default until he says otherwise. |
| 2 | Has the pilot started? If not, what is the real gate? | Brief | *Open.* The record shows no start (§4). The Scope names counsel's written sign-off as the gate. |
| 3 | Is the January model settled in his mind: broker (C) only, or C plus a registry pilot (A)? | Brief; Memo §6 | *Open.* |
| 4 | Who owns the pilot day to day? Provider calls are TJ and Ces only. | Brief; Scope §3, item 7 | *Open.* |
| 5 | Is it connected to the Assisting Hands Dallas pilot? Does family-direct still go in DFW? | Brief; §5 above | *Open.* The Scope links them by metro. |
| 6 | What would make him call it dead rather than slow? | Brief | *Open.* |
| 7 | Engage counsel? | Scope §6, decision 1 | *Open.* |
| 8 | Charge families a match fee? | Scope §6, decision 2 | *Open.* |
| 9 | Approve the ad spend, about $1,500 to $3,000? | Scope §6, decision 3 | *Open.* Note the Cortex spend ceiling is $0 (`docs/cortex/POLICY.md`); this would be TJ's spend, not Cortex's. |
| 10 | Submit in January with whatever the pilot shows, or move to April? | Memo §8; Scope §6 | *Open.* Logan and Qiping said in August either was fine (Memo §8). |
| 11 | Set the stop lines before launch. | Memo §7 | *Open.* |

## 7. Next three actions

All three are TJ's, because no ops owner is named (Scope §3, item 7). The dates are proposed, tied to dates already in the sources.

| # | Action | Owner | By | Why this date |
|---|---|---|---|---|
| 1 | Decide whether family-direct runs in DFW alongside Robbie, or somewhere else, and answer questions 2 to 5 above | TJ | **Wed 14 Oct**, before the Robbie check-in call | The call is booked for 14 Oct (Scratchpad) and the North Texas form runs to 15 Oct |
| 2 | Engage counsel on the Texas registry model and the family-fee question, or say the pilot is parked | TJ | **Fri 16 Oct** | The Scope's plan had counsel engaged by 14 Oct (Scope §4); every other blocker waits on it |
| 3 | Decide January or April for the family-direct evidence, based on whether counsel has answered | TJ | **Sun 1 Nov** | The Scope's own cut-off (Scope §6) |

## 8. Log

Newest first. One line per thing that moved.

| Date | What moved | Source |
|---|---|---|
| 11 Oct | This file created to hold the initiative in one place | Brief d245251b |
| 10 Oct | TJ in #cortex: the pieces are not together and the thread could fall apart | Brief |
| 7 Oct | Pilot scope merged to staging and production | PR #2314 |
| 4 Oct | Robbie's first North Texas family handed over (separate pilot, same metro) | Scratchpad |
| 1 Oct | Pilot scope written: DFW, hand-run, counsel is the gate | Scope |
| 30 Sep | Memo written, revised after TJ's follow-up, merged and promoted | PR #2295 |
| 30 Sep | Robbie North Texas pilot agreed in principle | Scratchpad |
