# MedJobs 2.0 — Master Implementation Matrix

> **Purpose:** take the operating-system diagram, zoom into any box, and see everything required for that
> box to function. One block per stage. **Framework:** [`../00-OPERATING-SYSTEM.md`](../00-OPERATING-SYSTEM.md).
>
> **Every block carries the same three layers:**
> **① User journey / technology** — what each user sees and does ·
> **② Human SOP** — what the responsible person does ·
> **③ System / handoff** — what is recorded, what fires next, who picks it up, and what is logged.
>
> **Roles:** Admin Team · Sales Lead (Logan) · User Success Manager (Chantel) · Portal.
> **Status:** intended design plus what the repository shows. Every "existing" line is a claim to verify.
> **Validation key:** ☐ not started · ◐ in progress · ✅ validated · ⚠️ incomplete · 🗑 stale · ✖ missing

---

## Scan table

| Stage | Objective | Owner | Biggest known gap |
|---|---|---|---|
| **PR1** Target list built | Verified, contactable providers in the service area | Admin Team | — |
| **PR-OUT** Provider outbound | Move a prospect to a booked meeting | Admin Team | Engagement data depends on the Smartlead webhook secret |
| **PR2** Provider meeting held | Convert, and capture what was promised | Sales Lead | — |
| **PR3** Client success | Carry the provider to a first hire | User Success Manager | "Client" has three definitions |
| **ST1** Target advisors | Named university stakeholders per site | Admin Team | — |
| **ST-OUT** University outbound | Move a stakeholder to a booked meeting | Admin Team | — |
| **ST2** Advisor meeting held | Secure agreement to reach students | Sales Lead | — |
| **ST3–ST7** University activation | Circulate the opportunity through five channels | User Success Manager | Channels are not modelled, so none is measurable |
| **ST8** Application submitted | Capture an application complete enough to assess | Portal | No source attribution |
| **QUAL** Portal vets application | Produce a qualified candidate pool | Portal | **Qualification criteria do not exist** |
| **MA1** Candidate intro | Put fitting candidates in front of the client | Portal · USM | — |
| **MA2** Interview held | A held interview, confirmed by both sides | Portal · USM | — |
| **MA3** Hire confirmed | A recorded placement | Portal · USM | — |
| **MA4** 6+ shifts confirmed | Verify real work happened | User Success Manager | **No implementation of any kind** |
| **MA5** Bill issued and collected | Money in, reconcilable | User Success Manager | **Two legacy paths, neither matches the model** |

---

## PR1 — Target list built

**Objective** Every provider in the service area identified, verified as a real operating agency, and made
contactable. **Owner** Admin Team. **Users** Admin Team.
**Completion criteria** Required contact fields present on the row; the row is cleared to launch.

**① User journey / technology**

| Actor | Sees / does | Surface |
|---|---|---|
| Admin Team | Site's provider list; verifies each; adds phone, email, address, decision-maker | Sites · prospect list · prospect drawer · enrichment |

**② Human SOP** — verify the agency is real, operating, non-medical home care, and in the service area ·
research contact details and a named decision-maker · time-box each row · park what cannot be found, with
the reason · report batch-level data defects rather than fixing them one at a time.

**③ System / handoff**

| Data captured | Status | Events | Next trigger | Handoff |
|---|---|---|---|---|
| Agency identity, address, phone, email, contacts, research notes | prospect → cleared | target added · contact added · prospect verified | Required fields complete | Stays with Admin Team → PR-OUT |

**Communications** None outbound at this stage.
**Existing** Sites and service-area computation · virtual provider prospects · materialize endpoint ·
catchment audit · contact enrichment · pre-flight checklist.
**Gaps** Confirm whether the checklist's required fields match what outbound actually needs.
**Validation** ☐ UI ☐ SOP ☐ events ☐ handoff

---

## PR-OUT — Provider outbound

**Objective** Move a cleared prospect to a booked meeting. **Owner** Admin Team.
**Completion criteria** A meeting on the Sales Lead's calendar, or a recorded terminal outcome.

**① User journey / technology**

| Actor | Sees / does | Surface |
|---|---|---|
| Provider | Cold emails; answers or misses calls; replies | Email · phone |
| Admin Team | Launches the sequence; works the call queue daily; triages every reply | Launch action · Calls queue · Emails queue · log modals |

**② Human SOP** — launch on cleared rows only · work the call queue to zero daily · call rows that clicked
first · answer every inbound within one business day, same day for anything about a time · book the meeting
rather than sending collateral · log every outcome, always.

**③ System / handoff**

| Data captured | Status | Events | Next trigger | Handoff |
|---|---|---|---|---|
| Sends, opens, clicks, replies, bounces, call outcomes, notes | prospect → in outreach → engaged | `email_sent` · `email_opened` · `email_clicked` · `email_replied` · `email_bounced` · call outcome · `meeting_scheduled` | Meeting booked | **Admin Team → Sales Lead** — appears in the meetings queue with the timeline attached |

**Communications** Cold sequence (Smartlead) · call script · booking link · meeting confirmation.
**Existing** Smartlead bridge, sequence and lead refresh, webhook ingestion · cadence sequencer · Calls,
Emails and Follow-up queues · four log modals · Calendly and its webhook.
**Gaps** Engagement events require the Smartlead webhook secret to be set; without it the queues are blind.
**Validation** ☐ UI ☐ SOP ☐ comms ☐ events ☐ handoff

---

## PR2 — Provider meeting held

**Objective** Convert the provider and capture what was promised. **Owner** Sales Lead.
**Completion criteria** Outcome recorded and the relationship handed to the User Success Manager.

**① User journey / technology**

| Actor | Sees / does | Surface |
|---|---|---|
| Provider | Books, receives confirmation and reminder, attends | Scheduling · email · video |
| Sales Lead | Reads the prospect's history beforehand; records the outcome after | Meetings queue · entity drawer · log meeting modal |

**② Human SOP** — read the timeline before the call · run the standard structure and close with the soft
agreement ask · record the outcome the same day · write down anything promised in the room · hand off with
context, not just a status change.

**③ System / handoff**

| Data captured | Status | Events | Next trigger | Handoff |
|---|---|---|---|---|
| Outcome, notes, commitments made | engaged → converted / declined / follow-up | `meeting_held` · outcome · note added · stage change | Outcome recorded | **Sales Lead → User Success Manager** — appears in the clients queue |

**Communications** Confirmation · reminder · post-meeting details email with the agreement.
**Existing** Meetings queue · drawer timeline · log meeting modal · Calendly webhook.
**Gaps** Confirm the outcome can be recorded in under a minute, and that commitments survive the handoff.
**Validation** ☐ UI ☐ SOP ☐ comms ☐ events ☐ handoff

---

## PR3 — Client success

**Objective** Carry the provider from the meeting to an actual first hire. **Owner** User Success Manager.
**Completion criteria** Terms accepted, profile complete, staffing need recorded, candidates visible.

**① User journey / technology**

| Actor | Sees / does | Surface |
|---|---|---|
| Provider | Receives the follow-up; accepts terms; signs in; completes the profile; states the need | Email · magic link · portal · forms |
| User Success Manager | Sends the follow-up; chases answers; drives completion; captures the need | Clients queue · step board · templates |

**② Human SOP** — send the follow-up the same day as the meeting · chase at three and seven days · get the
standard hiring questions answered · verify the provider can actually sign in and see the board · record
the staffing need against the client within a day · never let a converted provider face an empty board.

**③ System / handoff**

| Data captured | Status | Events | Next trigger | Handoff |
|---|---|---|---|---|
| Terms acceptance, profile answers, demand profile, roles and headcount | converted → active client | terms accepted · profile completed · staffing need recorded | Staffing need recorded | **User Success Manager → Portal** — the need drives matching |

**Communications** Post-meeting details email · agreement · reminders · welcome on first authentication.
**Existing** Clients queue · business-profile step boards · provider portal · eligibility screener ·
internship agreement modal · magic link.
**Gaps** "Client" resolves to three different flags — signed agreement, pilot terms, eligibility screener.
Until one wins, the entry condition into MA1 is ambiguous and the conversion rate has no stable denominator.
**Validation** ☐ UI ☐ SOP ☐ comms ☐ events ☐ handoff

---

## ST1 — Target advisors

**Objective** Named university stakeholders identified per site. **Owner** Admin Team.
**Completion criteria** Named humans with contact details and a stated reason they are the right person.

**① User journey / technology**

| Actor | Sees / does | Surface |
|---|---|---|
| Admin Team | Builds the stakeholder list by subtype; enriches; records why each is right | Partner prospects · partner sourcing |

**② Human SOP** — work advising pages, org directories, department pages · check org rosters are current ·
capture subtype, since it drives the copy · target 15–25 named humans per site.

**③ System / handoff**

| Data captured | Status | Events | Next trigger | Handoff |
|---|---|---|---|---|
| Name, title, subtype, department, contacts, rationale | prospect | target added · contact added | Contactable | Stays with Admin Team → ST-OUT |

**Communications** None at this stage.
**Existing** Partner prospects · partner sourcing · source-partners endpoint · subtype model.
**Gaps** Confirm subtype coverage matches the five channels we now run.
**Validation** ☐ UI ☐ SOP ☐ events ☐ handoff

---

## ST-OUT — University outbound

**Objective** Move a stakeholder to a booked meeting. **Owner** Admin Team.
**Completion criteria** Advisor meeting booked, or a recorded terminal outcome.

**① User journey / technology**

| Actor | Sees / does | Surface |
|---|---|---|
| Stakeholder | Receives subtype-appropriate outreach; replies or books | Email · phone · scheduling |
| Admin Team | Launches, calls, triages, books | Partners queue · Calls · Emails · log modals |

**② Human SOP** — use the subtype's tone and ask · keep the ask small and specific · same reply SLA as the
provider side · respect professor permission gating.

**③ System / handoff**

| Data captured | Status | Events | Next trigger | Handoff |
|---|---|---|---|---|
| Sends, engagement, replies, call outcomes | prospect → in outreach → engaged | `email_sent` · `email_replied` · call outcome · `meeting_scheduled` | Meeting booked | **Admin Team → Sales Lead** |

**Communications** Subtype-aware sequences · call script · booking link.
**Existing** Shared outreach machinery · subtype-aware templates · professor permission dependency ·
bulk professors action.
**Gaps** Confirm the copy reflects the current five-channel ask.
**Validation** ☐ UI ☐ SOP ☐ comms ☐ events ☐ handoff

---

## ST2 — Advisor meeting held

**Objective** Secure agreement to reach students. **Owner** Sales Lead.
**Completion criteria** Outcome recorded, agreed channels captured, relationship handed on.

**① User journey / technology**

| Actor | Sees / does | Surface |
|---|---|---|
| Advisor | Books, attends, agrees to specific channels | Scheduling · video |
| Sales Lead | Prepares; runs the meeting; records what was agreed | Meetings queue · drawer · log meeting modal |

**② Human SOP** — ask for specific channels, not general partnership · record which of the five were agreed ·
capture permissions granted, especially for professor access · hand off with the agreed channels attached.

**③ System / handoff**

| Data captured | Status | Events | Next trigger | Handoff |
|---|---|---|---|---|
| Outcome, agreed channels, permissions, contacts offered | engaged → active partner | `meeting_held` · distribution agreed · permission granted | Outcome recorded | **Sales Lead → User Success Manager** — appears in the partners queue |

**Communications** Confirmation · reminder · post-meeting thank-you with the agreed asks.
**Existing** Meetings queue · distribution evidence · partner activation · partner portal.
**Gaps** Agreed channels are not captured as structured data, so ST3–ST7 start without a defined scope.
**Validation** ☐ UI ☐ SOP ☐ comms ☐ events ☐ handoff

---

## ST3–ST7 — University activation

**Objective** Circulate the MedJobs opportunity through five parallel channels until students apply.
**Owner** User Success Manager, with the Sales Lead where a physician in the room changes the answer.
**Completion criteria** Each agreed channel is live, and its distribution is recorded.

**① User journey / technology**

| Channel | Who acts | Student sees | Surface |
|---|---|---|---|
| **ST3** University job board | USM posts; advisor approves | A posting on a board they already check | Job postings · opportunity model |
| **ST4** Student org relationships | USM + Sales Lead build; officer shares | A post in their group chat or a mention at a meeting | Partner portal · flyer |
| **ST5** Campus events | USM + Sales Lead run | A table, a talk, a QR code | Partner portal event route |
| **ST6** Advisor listservs | USM supplies copy; advisor sends | An email from a trusted sender | Partner portal message route |
| **ST7** Professor outreach + class visits | USM + Sales Lead, once permitted | An in-class introduction | Professor gating · bulk professors |

**② Human SOP** — activate every agreed channel within two weeks of ST2 · supply ready-to-send copy so the
partner only has to forward · record distribution evidence on the partner row with a rough reach estimate ·
report results back to the partner so they share again · re-check org leadership each term.

**③ System / handoff**

| Data captured | Status | Events | Next trigger | Handoff |
|---|---|---|---|---|
| Channel, date, partner, reach estimate, asset used | partner active → distributing | channel activated · distribution recorded | A student follows the link | **→ Portal (ST8)** |

**Communications** Ready-to-send copy per channel · the flyer as the shared asset · results-back note.
**Existing** Partner portal with activate, colleague, event and message routes · distribution evidence ·
job postings · flyer asset.
**Gaps** The five channels are **not modelled as distinct entities**, so distribution cannot be attributed
per channel and we cannot tell which of the five produces students. This is the single highest-value
instrumentation gap on the student side.
**Validation** ☐ UI ☐ SOP ☐ comms ☐ events ☐ handoff

---

## ST8 — Student application submitted

**Objective** Capture an application complete enough to assess. **Owner** Portal, supported by the USM.
**Completion criteria** A submitted application with everything qualification needs.

**① User journey / technology**

| Actor | Sees / does | Surface |
|---|---|---|
| Student | Lands, screens in, applies, uploads documents and video, reads the agreement | Public page · screener · application · uploads |
| User Success Manager | Sees stalled applications and nudges them | Candidates queue |

**② Human SOP** — touch every started-but-unfinished application within 24 hours · nudge with an offer of
help, not a reminder · one further nudge at day three, then leave it · log why students stall.

**③ System / handoff**

| Data captured | Status | Events | Next trigger | Handoff |
|---|---|---|---|---|
| Eligibility answers, availability, documents, video, terms acceptance | started → submitted | student eligibility completed · application started · application submitted | Submission | **→ QUAL** |

**Communications** Confirmation · resume-your-application nudge · submission acknowledgement.
**Existing** Public page · student eligibility screener · `apply` and `apply-partial` · document, photo and
video upload · student agreement.
**Gaps** **Nothing records how the student heard about MedJobs**, so ST3–ST7 cannot be evaluated from the
student side either. Confirm a partial application can actually be resumed.
**Validation** ☐ UI ☐ SOP ☐ comms ☐ events ☐ handoff

---

## QUAL — Portal vets the application

**Objective** Produce a qualified candidate pool a provider can trust. **Owner** Portal, exceptions to USM.
**Completion criteria** A decision recorded against defined criteria, and the student told the outcome.

**① User journey / technology**

| Actor | Sees / does | Surface |
|---|---|---|
| Student | Learns whether they qualified and what happens next | Portal · email |
| User Success Manager | Reviews outcomes and handles exceptions | Candidates view |

**② Human SOP** — review every borderline case rather than letting it sit · record the reason for any
override · feed recurring failure reasons back into the application.

**③ System / handoff**

| Data captured | Status | Events | Next trigger | Handoff |
|---|---|---|---|---|
| Criteria evaluated, decision, reason, reviewer | submitted → qualified / not qualified | qualification decision · went live | Qualified | **→ MA1** |

**Communications** Outcome message · you're-live message · what-to-expect-next.
**Existing** Student eligibility model · go-live route · candidates board. Today "live" effectively means
*profile complete and active*, which is a completeness check, not a qualification decision.
**Gaps** **The qualification criteria do not exist.** Nothing is written down that says what makes a
student qualified, so the step cannot be automated, delegated, audited, or explained to a provider.
Writing them is the prerequisite to auditing this stage at all.
**Validation** ☐ criteria written ☐ UI ☐ SOP ☐ comms ☐ events ☐ handoff

---

## MA1 — Candidate intro

**Objective** Put candidates who fit the staffing need in front of the client. **Owner** Portal, driven by
the USM. **Completion criteria** The client has seen candidates and can act on them.

**① User journey / technology**

| Actor | Sees / does | Surface |
|---|---|---|
| Provider | Browses candidates with a match line explaining the fit | Candidate board · candidate detail |
| Student | Is visible; may be invited | Student portal |
| User Success Manager | Confirms the client is looking; intervenes if not | Client view |

**② Human SOP** — check every active client has candidates to look at · call, do not email, a client who
has not logged in within three days · if nobody fits, that is a supply brief, not a client problem.

**③ System / handoff**

| Data captured | Status | Events | Next trigger | Handoff |
|---|---|---|---|---|
| Candidates surfaced, viewed, match basis | qualified → introduced | candidates viewed | Invite sent | **→ MA2** |

**Communications** New-match notification to the provider · nudge if the board is untouched.
**Existing** Candidates board · candidate cards with match lines · job match logic · invite route ·
go-live notification to providers in the area.
**Gaps** Confirm the match line reflects the recorded staffing need rather than generic availability.
**Validation** ☐ UI ☐ SOP ☐ comms ☐ events ☐ handoff

---

## MA2 — Interview held

**Objective** An interview that actually happens, confirmed by both sides. **Owner** Portal, driven by the
USM. **Completion criteria** Both parties confirm it was held.

**① User journey / technology**

| Actor | Sees / does | Surface |
|---|---|---|
| Provider | Invites, proposes times, attends, confirms | Invite flow · calendar |
| Student | Receives the invitation, accepts, attends | Interview flow · calendar |
| User Success Manager | Chases both handshakes; follows up the day after | Interview view |

**② Human SOP** — confirm with both sides 24 hours before · follow up within one day of every interview,
by phone · never let a held interview sit without a next step.

**③ System / handoff**

| Data captured | Status | Events | Next trigger | Handoff |
|---|---|---|---|---|
| Invite, acceptance, scheduled time, held confirmation | introduced → interviewing | interview invited · accepted · held | Held and confirmed | **→ MA3** |

**Communications** Invitation · acceptance · calendar file · reminder · post-interview prompt to both sides.
**Existing** Interviews route and quick-invite · claim-interview for both parties · interview calendar ·
`.ics` · token validation.
**Gaps** Confirm the two-sided handshake and that a no-show has a defined state.
**Validation** ☐ UI ☐ SOP ☐ comms ☐ events ☐ handoff

---

## MA3 — Hire confirmed

**Objective** A recorded placement both parties agree to. **Owner** Portal, driven by the USM.
**Completion criteria** Placement recorded as confirmed, with the agreement signed.

**① User journey / technology**

| Actor | Sees / does | Surface |
|---|---|---|
| Provider | Makes the offer and signs the agreement | Offer flow · agreement modal |
| Student | Sees the offer and accepts | Offer view |
| User Success Manager | Walks a first-time client through it; confirms both sides see the same state | Client and candidate views |

**② Human SOP** — walk the first offer personally · confirm the student understood what they accepted ·
record the start date, because it is the clock MA4 runs on.

**③ System / handoff**

| Data captured | Status | Events | Next trigger | Handoff |
|---|---|---|---|---|
| Offer, agreement signature, acceptance, start date | interviewing → hired | offer made · accepted · hire confirmed | Confirmed | **→ MA4** |

**Communications** Offer notification · acceptance confirmation to both sides · start-of-work note.
**Existing** Placements record with offered / accepted / confirmed states · internship agreement modal ·
offer and accept surfaces on both sides.
**Gaps** Confirm a start date is captured — without it MA4 has no clock. Confirm the entry condition from
PR3 is unambiguous once "Client" is defined.
**Validation** ☐ UI ☐ SOP ☐ comms ☐ events ☐ handoff

---

## MA4 — Six or more shifts worked, confirmed

**Objective** Verify the placement produced real work. **Owner** User Success Manager.
**Completion criteria** Six shifts confirmed by an agreed method, with a recorded result and timestamp.

> **This is the commercial threshold of the entire model and it has no implementation.** No shift or
> hours-worked concept exists anywhere in MedJobs. The only related value is a 120-hour threshold on the
> placement record, which backs the service guarantee rather than the bill. Everything below is a design
> to decide, not a workflow to audit.

**① User journey / technology** — undecided. The three plausible shapes:

| Option | Who confirms | Effort | Trust |
|---|---|---|---|
| Provider attestation | Provider clicks to confirm six shifts | Lowest | Depends on the provider |
| Student log | Student records shifts as worked | Moderate | Cross-checkable against the provider |
| Manual confirmation | USM asks both sides and records the answer | Highest | Highest, and does not scale |

**② Human SOP** — undefined until the mechanism is chosen. Whatever the mechanism, the USM must be able to
see which placements are approaching the threshold, and chase the confirmation.

**③ System / handoff**

| Data captured | Status | Events | Next trigger | Handoff |
|---|---|---|---|---|
| Shift count, confirmation source, confirmed-at, confirmer | hired → threshold met | six shifts confirmed | Threshold met | **→ MA5** |

**Communications** Confirmation request · confirmation acknowledgement to both sides.
**Existing** **None.**
**Gaps** Everything: the mechanism, the data model, the UI on both sides, the SOP, the events, and the
trigger into billing. Nothing downstream of here can run until this is decided.
**Validation** ✖ missing

---

## MA5 — Bill issued and collected

**Objective** Invoice against the confirmed threshold and collect. **Owner** User Success Manager.
**Completion criteria** Payment received and reconcilable.

**① User journey / technology**

| Actor | Sees / does | Surface |
|---|---|---|
| Provider | Sees what they owe and why, and pays | **Undefined** |
| User Success Manager | Issues the invoice, tracks it, chases it | **Undefined** |

**② Human SOP** — manual invoicing is acceptable for the first placements · reference the signed agreement
and the confirmed shift count · track invoiced against collected weekly · chase at fourteen days.

**③ System / handoff**

| Data captured | Status | Events | Next trigger | Handoff |
|---|---|---|---|---|
| Amount, basis, invoice date, payment date, method | threshold met → billed → collected | bill issued · payment collected | Payment received | **→ ongoing support** |

**Communications** Invoice · receipt · reminder.
**Existing** A legacy subscription path — checkout, billing portal, Stripe webhook — and stubbed fee fields
on the placement record. **Neither implements bill-after-six-shifts.** Treat the subscription path as stale
unless the audit finds it supports the current model.
**Gaps** The fee, the payer and the trigger are all still open. Until they are decided, no billing
technology should be built — but manual invoicing can start immediately once MA4 produces a confirmation.
**Validation** 🗑 legacy path likely stale ☐ manual process defined
