# /answer-email -- Answer the Support Inbox by Hand

Work a chosen cohort of `/admin/support-email` down to zero: select the threads nobody else will, research each person against their own record and the live web, compose the reply, have it attacked, and save it as a draft for TJ to send.

> **Status: v1, derived from a full hand-run on 2026-09-20** that cleared the benefits cohort, 12 threads, oldest waiting 47 days. Nothing here is theory. Every rule is something that run either got right for a reason or got wrong and had to be fixed before sending.

Optional `$ARGUMENTS`:

- **No argument**: ask which cohort to work. Do not guess.
- `benefits`: care seekers who came in through the benefits funnel and replied by email. **The only cohort derived so far.**
- `report`: read and propose. Change nothing, save nothing.
- `<threadId>`: one thread.

Other cohorts are stubbed at the bottom. Their selection queries are known; their procedures are not. **Work a batch by hand before writing one.**

---

## The one constraint that shapes everything

**Claude drafts. TJ sends.** `save_draft` writes a real Gmail draft and stamps `draft_body`; `send` is a human clicking a button. The rail is `app/api/admin/support-email/[threadId]/route.ts`, and before 2026-09-19 it had **never been used once** -- `draft_body` and `gmail_draft_id` were 0 across the whole table.

`/email-checker` owns triage and **must not be redone here**. Its Phase 2 protects `care_seeker` from every sweep, and its third hunt item is literally "a family asked for help and nobody answered." It finds them and stops. **This command is the handoff it never had.**

Writing `draft_body` straight to Supabase is safe: `app/admin/support-email/page.tsx:357` loads it into the reply box on open, and `:767` posts the box contents, which the route rebuilds the Gmail draft from. **TJ must reopen the thread** to pick up a changed draft.

---

## Ground truth

| Thing | Where |
|---|---|
| Threads, state, category, AI draft | `support_email_threads` |
| Message bodies and the real sender name | `support_email_messages` |
| Identity link | `matched_profile_id` -> `business_profiles.id`, `matched_profile_type='family'` |
| Benefits plan, cascade, pick | `business_profiles.metadata` |
| Same person on SMS | `sms_inbound`, `sms_queue`, keyed `phone_last10` |
| Suppression | `do_not_contact`, and `/admin/do-not-contact` is the only working UI |
| Send + draft logic | `app/api/admin/support-email/[threadId]/route.ts` |
| Adversarial pass | `scripts/attack-draft.js` |

---

## Phase 1 -- Select on the profile, never the subject

For `benefits`: `matched_profile_type='family'` -> `business_profiles` where `source='benefits_intake'` **OR** `metadata.benefits_cascade` exists.

Both halves earn their place. Three of twelve were `guest_connection` and qualified only via the cascade block. **Subject-matching `Re: Your first step for` returns 9 and misses the most urgent thread in the inbox** -- Linda Rials wrote with no subject at all, four days from a utility shutoff.

**Exclude `tj@olera.care` / `Test McTest`.** It is a live profile carrying `source='benefits_intake'` and it pollutes every profile query, including one sitting in the care-seeker queue as "Your home care request."

Report the count, and the wait in days per thread. Oldest first.

---

## Phase 2 -- Read the record before the message

Age, income, county, state and the cascade decide what is even legal to name. Read `metadata` before the email body.

**The profile lies, and it contradicts itself.** One family's profile said age 60 while her own message said "I'm a 46 year old women." Another listed `payment_methods` including veterans benefits while `veteranStatus` on the same record said `no`. When the record and the person disagree, **the person wins**, and never quote the record back at them as fact.

**Take the name from `support_email_messages.from_name`, never the profile.** `matched_profile_name` is the generic "Care Seeker" for almost everyone. `hollirials@gmail.com` is Linda. `dubb1148@cox.net` is Richard.

---

## Phase 3 -- Read every channel, not just this one

**The highest-value check in this file.** Look the profile's phone up in `sms_queue` and `sms_inbound` before composing.

`beckett@usa.com` IS `352-713-4271`. Her email asking about long-term care sat 17 days while we texted her three times about a different program, twice pointing her at a county program whose own page said applications were on hold. Neither inbox showed the other existed.

---

## Phase 4 -- Check what we actually sent, and whether it was cleared

Read the cascade block and `metadata.benefits_navigator.packet.clearance`.

**`clearance.cleared` is not a fit check.** It says the *program record* was verified, not that it suits this family. Both directions fail: a `cleared:false` pick carrying `holds:["program never verified"]` was sent to a Connecticut family as "Your first step for CT PACE" and **Connecticut has no PACE program**; a `cleared:true` pick sent an Austin family to a PACE site in El Paso that she was nine years too young for. Four of twelve were `cleared:false`.

**Check we sent it before apologizing for it.** One family's cascade was empty -- nothing had ever gone out -- and a draft nearly corrected her for a recommendation she never received.

---

## Phase 5 -- Verify, in three separate steps, in this order

1. **Does the program exist in their state?** CT PACE failed here.
2. **Does it serve their area, and their age?** The El Paso pick failed here.
3. **Is it accepting applications today?** Marion County rehab and the Florida LIHEAP portal failed here.

A program can pass two and fail the third. **An eligibility threshold is a fact and gets the same scrutiny as a phone number** -- more, because it decides whether the door is open at all. A draft said CHCPE serves 60+; Connecticut's own brochure says **"You are 65 or older."** That came from trusting a page summary for the age while cross-checking the phone number twice.

**Prefer the agency's applicant-facing PDF over its web pages.** `WebFetch` returns PDFs as binary and tells you where it saved them; `pdftotext -layout <file> -` reads them. The CHCPE age and the NC CAP/DA sibling rule were both settled that way and only that way.

**Hours, days and deadlines are perishable.** Phone numbers rot slowly; operating hours and program status rot fast and silently. Cover Virginia's Saturday hours ended 4 April 2026. **Editing a sentence is not verifying it** -- those hours were "fixed" once that night, moved from the wrong number to the right one, without anyone asking whether Saturday still existed.

---

## Phase 6 -- Cross-check on a second page of the same domain, and drop conflicts

Two pages on one agency's site disagreed on the hotline's closing time and on the income test. Two AHCCCS pages disagree on whether published limits are gross or post-deduction. **Say the agency is inconsistent rather than picking a side.** A family who finds the contradiction themselves then trusts us; a family we guessed at does not.

---

## Phase 7 -- Compose

- **Redirect and reframe. Never grade our own conduct.** Correcting the information is required; characterizing our conduct buys nothing and may be wrong, since we usually have not diagnosed it yet. Not "our earlier email pointed you at one, and that was our mistake" but "PACE operates only in states that have chosen to offer it, and Connecticut does not currently have one." Banned outright: `our mistake`, `our error`, `we were wrong`, `apologies`, `sorry`, `not a useful steer`, `should have`.
- **Match the reply to the question.** Diane asked three substantive questions and got 2,700 characters. Lorene asked what this was and got 420. The failure mode is treating every thread as a chance to deliver everything we know.
- **Cut sentences that explain rather than inform.** "That is common with these lines" tells nobody anything they can act on.
- **Never collapse two agencies into one number.** NC LIFTSS does referrals and assessments; the county DSS decides Medicaid eligibility. ADRC routes; it does not assess. Sending someone to the wrong desk costs them the call.
- **Claims about the family's own history get verified against the record.** "Your daughter used our benefits finder" was wrong twice over: `relationship_to_recipient` was `"Myself"`, and a care post came first.
- **Suggest, never instruct. Sign `Olera care team`.** See `feedback_family_guidance_voice`.
- **No em dashes.** US spelling.

**Two-tier fine print.** Default is the one-line house disclaimer. **If the email contains a dollar figure, an age threshold or an eligibility rule, swap in the long form**, which exists to stop families self-disqualifying -- the failure mode behind Lorene's "so I do not qualify":

> Now the fine print, and we mean it plainly rather than as boilerplate. We are not lawyers, benefits counselors or Medicare agents, and Olera is not a government agency. Nothing above is legal or financial advice, and none of it is final. These rules and dollar limits change every year and get applied case by case, and we could be missing something that only turns up on a real application. Please do not let anything we have written stop you from applying, or from getting an opinion from someone who can see your full picture.

Never stack both.

---

## Phase 8 -- Attack the draft, twice, and adjudicate

```bash
ENVFILE=$PWD/.env.local node scripts/attack-draft.js <context.json>
```

`context.json` is `{who, message, verified[], draft}`. **All four fields are required.** Without the family's own message it invents context -- it told a woman to wait until she returned from a trip she had come back from ten days earlier. Without `who` it confuses roles -- it addressed a professional advocate as the mother of her client's son.

- **Exactly two passes.** Every pass 1 found something real. Every pass 2 found something real, because the revision is new text that has never been attacked -- pass 2 caught a routing error in a sentence pass 1's fix had created. **Passes 3 and 4 were harmful both times**, repeating a false claim about NC family-caregiver exemptions that the state's own policy 3K-2 flatly contradicts.
- **Stop** on a repeated objection, on one refuted by a primary source, or at two passes.
- **Never adopt by attrition.** A repeated objection is not a stronger one. Re-running until the checker is satisfied means adopting its position by exhaustion.
- **Adopt the objection, never the citation, and never the prose.** Six of ten sources on one pass were content farms; the script flags them. Its rewrites carry bold markdown, "may" in every clause, and drop the recipient's name.
- **An objection that narrows a claim can be folded in as a question. One that reverses a claim must be verified first.** Reversals have been wrong every time they mattered.
- **It is also a retriever, and that is its best function.** State Medicaid sites and SSA block both `WebFetch` and the browser. It reached AHCCCS's published limits and SSA's Extra Help resource limits when nothing we had could load the page. Ask it to fetch and quote the agency page, not just critique.
- **Verify a retrieved figure without refetching**, since refetching is what is impossible: a second independent retrieval agreeing, or arithmetic derivability. MSP limits are 100/120/135% of FPL, so $1,330 / $1,596 / $1,796 and $1,804 / $2,164 / $2,435 check out. Derivable beats asserted.

**The gate is unconditional.** Every error that reached a draft was in a passage judged thin -- an age "detail", a throwaway line about a family's history, a "just a check-in". **Verification discipline degrades exactly where confidence is highest.** Never skip the pass because a thread looks simple.

---

## Phase 9 -- Save, verify, report

`save_draft` only. Then **read the database**, not the response: `draft_body` non-null, `gmail_draft_id` set, `state` still `needs_reply`. Tell TJ the search term that finds each thread, because **admin search covers `subject`, `snippet` and `matched_profile_name` only and cannot find a care seeker by name or email address**.

After he sends, verify again: `state='handled'`, `draft_body` null, an outbound row in `support_email_messages`.

Append the run to `SCRATCHPAD.md`, and propose edits to this file. Do not silently change the rules.

---

## Cohorts not yet derived

Selection is known. Procedure is not. **Work a batch by hand first, the way `benefits` was on 2026-09-20, then write the module.**

- **`care-requests`** -- `care_seeker` with no cascade. Load the inquiry and provider matches. Few external claims, so the gate rarely earns its cost.
- **`voicemail`** -- the largest bucket, 425 and never swept, because `/email-checker` correctly refuses: "those are real inbound calls." The output is a callback, not a reply, so this may want its own command.
- **`provider`** -- `matched_provider_id`. **Different voice**: plain, bold, no hedging, no self-blame (`feedback_provider_comms_plain_not_hedged`), and subject to the comms cap in `project_provider_comms_governance`. No agency claims, so no gate.
- **`billing` / `legal`** -- escalate, do not answer.

---

## Rules that cost real time when broken

1. **Tier 1 blocks:** county sites 403 `WebFetch` and render fine in the browser. **Tier 2:** `hhs.texas.gov`, `azahcccs.gov`, `ssa.gov` block the browser too. Perplexity is the only way in. See `reference_agency_sites_block_our_fetchers`.
2. **A cross-origin `fetch()` from inside a page is CORS-blocked.** Navigate the tab instead.
3. **Two Chrome processes can both hold 9222**, IPv4 and IPv6. The symptom is a `401 Not authenticated` from an endpoint that worked minutes earlier, and `/admin/*` silently redirecting to `/`. `lsof -nP -iTCP:9222 -sTCP:LISTEN` is the only honest check.
4. **The browser is TJ's.** It restarts mid-run and takes your tab with it. Re-list pages before every batch, and never kill a window with his work in it.
5. **Pace admin POSTs** by about a second or the WAF 429s a burst.
6. **Suppression is not on the thread.** The drawer's button renders only when `suggested_action === 'provider_removal'` (`page.tsx:709`), so a care seeker reporting a death can never reach it, and the route hardcodes `reason:'provider_request'`. Use `/admin/do-not-contact`, which takes a real reason.
7. **A reply does not stop the benefits cascade.** The coordinator's `active_thread` gate reads provider inquiry threads, never support email. A bereaved contact was spared a cheerful check-in only because the rung's 14-day window had expired.

---

## What this command is actually for

The inbox looks like a thousand threads. The benefits cohort was twelve people, and four of them were holding a program that was wrong, shut, or in the wrong state, because the pipeline shipped picks it had already flagged as unverified. One had a utility shutoff in two days. One had told us three weeks earlier that the person we were writing about had died.

Phases 3, 5 and 8 exist because no automated stage can do them: nothing reads the other inbox, nothing checks whether a program still exists, and nothing attacks a draft a human rewrote. Those three are the job. The composing is the easy part.
