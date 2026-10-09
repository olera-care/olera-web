# Meeting Context: David Qu Check-In (2026-10-08)

This was a one-hour call at 9:00 AM CT: "David x TJ x Logan - Check In". Logan joined
while away. This file keeps the context that lasts: the prep, the outcome, the
numbers as they were verified, and the corrections. The source notes are the Notion
meeting page ([link](https://app.notion.com/p/3f35903a0ffe81578d80ca04aba480b4)); the
transcript is not in the repo. The status labels mean the following. LOCKED: agreed
in the call. SOLVING: open. WATCH: a risk to anticipate.

## 1. Who David is (correct this everywhere)

He is **David Qu, Managing Director, Trusted Innovation Partners.** He is an LP in
7Wire Ventures and Alumni Ventures, and an angel investor. He is a former home-care
CEO and operated a home-care tech company that served hundreds of agencies in the US
and Canada. He is a former Joint Commission International executive. He recently
joined the board of IHI (Institute for Healthcare Improvement). **He is NOT a Ziegler
partner.** The CRP draft still says that (scorecard C6, open). The Ziegler contact is
Jenny Poth.

## 2. What the call answered

David's email of 2 Oct set five questions:

1. Who we sell to.
2. Who the end users are, and whether we are a broker.
3. Who pays, and what traction we have had since 1 Sep.
4. How we scale go-to-market without an expensive D2C model.
5. Whether an AI stack is actually built, and whether we have a CTO.

His 26 Sep critique: running Google Ads and student matching by hand is "a path with
no future investment opportunity".

TJ sent a written update before the call. It is "Olera: October update", a Claude
Doc ([link](https://claude.ai/code/artifact/4fc3838b-7a8c-4361-814e-8751a5921642)).
It is built on TJ's thesis:

- The north star is the network on both sides, plus innovation speed.
- The KPI is usage by families and by providers.
- Monetization follows the network: families are free, and providers pay for
  clients and for staff.
- Payers are a later line.
- No raise is required.
- TJ is the CTO, and the team builds AI-native on purpose to keep costs low.

TJ's private prep brief is a separate doc
([link](https://claude.ai/code/artifact/506a1c96-61fc-4cf0-8dce-fe9dc17ccecb)).

## 3. Outcome

**LOCKED: network first.** David agreed not to optimize for revenue at this stage
and to grow network volume (families, providers, students). His reason is that
volume opens several revenue channels: providers, payers, employers, and pharma or
device advertising. He thinks providers are unlikely to be the main long-term payer
because their budgets are limited. Payers and employers look stronger, but they need
a track record first. The team's consensus: show the network and the path to
monetization, and don't force early revenue numbers.

**LOCKED: the CRP framing is a controlled pilot.** Present market activity as a
deliberate experiment with a defined geographic or university scope, not a national
campaign. Texas A&M is the named student-recruitment site. Lead with top-of-funnel
metrics (signups, accounts, family inquiries), not closed transactions.

**SOLVING: Olera Pro as one subscription.** TJ is reframing monetization as one
integrated provider subscription, with Managed Ads and MedJobs as its beachhead,
rather than two separate products. The October update doc says: "We run parts of
them by hand on purpose... and we automate each step as it proves out. We're not an
ads company or a staffing agency."

**LOCKED: AI automation is the differentiator.** Show sourcing, screening and
matching being automated. Logan said the family-connection side is now about 90%
AI-driven with 10% human oversight, a level reached in the two weeks before the call.
David's comparables:

- Mama Health: AI agents recruiting clinical-trial patients.
- Secure Health: bulk patient assignments from regional payers.
- Goldman Sachs: AI-video screening before human interviews.

**Moat:** industry knowledge, provider relationships, private channels and AI
automation, not the technology alone.

**WATCH: winning the CRP is not the same as being investor ready.** A separate gap
analysis is needed after the award. David's fund reviewed 800+ decks last year, ran
about 30 diligences and made 2 investments.

## 4. David's role on the CRP

- He offered an **investor support letter**. The CRP now uses a structured
  intent-to-collaborate letter, not a term sheet. The precedent is Blake's Aggie
  Angel Network letter from the prior round. The goal is 1 to 2 letters by January.
- He may join the application as a **team member or co-applicant**. Reviewers want
  multidisciplinary founders (clinical, business, technology), ideally co-located.
- His upcoming events: Backers Chicago (early November), the Vegas Housing
  Conference (mid-November), and JP Morgan (January).
- The engagement terms are still unresolved in writing.

## 5. Action items

- [ ] Logan sends David the investor support letter template.
- [ ] David reviews it and considers joining as a co-applicant.
- [ ] TJ refines the CRP narrative around Olera Pro and the controlled-pilot framing.
- [ ] Logan corrects the provider signup numbers by removing test accounts.
- [ ] The team agrees 4 to 5 KPIs to report weekly, which feed the market-traction
      section.
- [ ] Logan and TJ hold the first student-provider interviews this week or next.
- [ ] Logan continues weekly updates to David.

TJ sent the recap email on 9 Oct from tj@olera.care, cc Logan, subject "Meeting
summary and next steps for Olera CRP application". It had no numbers. TJ took out
the line thanking David for offering to join the application.

## 6. Numbers as verified (production DB, 8 Oct, test accounts excluded)

Test accounts were excluded by these rules: emails matching `@olera.care`,
`@findmedjobs.co`, `tfalohun` or `uiuxesther`, and names starting with "Test" or
containing "(Test)". Use these figures, not the ones quoted in the meeting notes.

| Metric | Value |
| --- | --- |
| Claimed provider accounts | **1,036** (1,056 with a login; 2,624 organization profiles in total) |
| Family inquiries | 1,566 all-time; 275 in the last 30 days |
| Family profiles | 2,519 |
| Managed Ads requests | 36 from 27 providers; 18 ran campaigns; 9 in the queue; 15 since 1 Sep |
| Managed Ads paying | 1 (Hoop Cares, $75/mo, since 15 Sep); about 13 live free intros |
| MedJobs students | about 41 real (45 raw); 36 since 1 Sep; 2 fully live |
| MedJobs providers signed up | 74 (90 raw) |
| MedJobs clients (accepted interview terms) | 1 (HoneyBee HomeCare, Hawaii) |
| MedJobs paid / real placements in the system | 0 / 0 |

**WATCH: two figures do not reconcile.**

- The meeting notes cite **"3,300+ claimed provider accounts"**. The DB shows 1,036.
  Don't use 3,300 in the CRP until it is reconciled.
- The CRP docs record **about $6K of hand-run MedJobs revenue** and pilot placement
  counts (20+, 25 and about 100 in different documents). None of this is in the
  system. Confirm it against Logan's invoices.

The call's own snapshot gives operating context that is not in the DB:

- About 4 MedJobs providers are "ready for students".
- About 20 students are in ready areas.
- The first qualified candidate came two days before the call, and the first hire is
  expected 2 to 4 weeks out.
- MedJobs pricing: the first hire per provider is free, then $250 per placement.
- Olera Pro: about 4 to 5 new signups a week. The target is 5 (bear) to 12 (bull)
  paying customers by January.

## 7. Behavior trends (weekly, Jun to 8 Oct 2026)

Organic search clicks fell about 23% from July (about 3,430/wk) to September (about
2,640/wk). Against that:

| Change | Before | After | Read |
| --- | --- | --- | --- |
| Benefits completions | about 45/wk (Aug) | 97 to 116/wk (from wk of 14 Sep) | Moved. Conversion per visit about doubled. It started before the 30 Sep redesign, and the cause is not pinned down. |
| Provider sign-ins after one-click access (30 Jul, #1428) | 78/wk (Jul) | 92 to 100/wk (Aug to Sep) | Moved, about +20%. Partly mechanical, because one-click links log sign-ins. |
| Provider answer rate on family questions | 3.4% | 6.0% and 6.5% (last 2 weeks) | Possibly moved; only 2 weeks of data |
| Family inquiries | 80/wk (Jun) | 61/wk (Sep) | Fell 24%, in step with traffic; conversion per click is flat |
| Questions asked | 590/wk | 350/wk | Fell 40%, more than traffic explains; cause unknown |
| Claims, profile editors, in-thread provider replies | about 38/wk, about 15/wk, 1 to 4/wk | flat | No visible change |

Everything that shipped since 22 Sep needs 4 to 6 more weeks before it can be judged:
lead hold, campaign home, case inbox, team logins, the benefits conversation, and
agent readiness. **Caveat:** `provider_activity` has no actor field, so internal or
concierge work cannot be separated from providers' own actions.

## 8. Rules for anything sent to David

- Don't say "customers" in the plural. One provider pays.
- Don't present free trials as customers.
- Don't quote a placement count until it is reconciled.
- Don't say "AI agents fully in production". Screening, the case inbox, the benefits
  caseworker and Cortex are live. AI-assistant access is in build.
- Don't quote dollar amounts of aid "identified". The eligibility data is not
  verified.
- Don't present benefits as a funnel into the marketplace. Only 6 families have ever
  used both.
- Logan is off until about 19 Oct and has not seen TJ's 4 Oct D1 decision. Logan's
  2 Oct proposal narrowed Olera to AI plus family navigation sold through payers and
  EAPs. **Don't argue the TJ/Logan difference in front of David.** David's own advice
  (network first, payers later) now sits between the two positions.
- Open: the update doc says Olera doesn't need to raise. The CRP Fundraising
  criterion wants documented investor interest. David's letter, and possibly his
  co-applicant role, covers most of that gap.
