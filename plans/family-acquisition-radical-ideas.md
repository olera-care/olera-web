# Olera Family Acquisition — 10 Radical Product Mechanics

**Author:** TJ + Claude (Head of Product mode)
**Date:** 2026-05-05
**Context:** Family intake converting at 0.21% (3,809 module impressions → 8 submits). Every downstream Olera revenue mechanism (Pro, marketplace, lead intelligence, Q&A relational, MedJobs cross-sell) depends on a contactable family base. Without one, the stack is starved. This is the existential bottleneck.

This doc is the output of a focused product ideation session. It draws from primary-source research across four anchor domains -- crypto points programs, viral waitlists/invite-trees, healthcare/eldercare acquisition, 2026 AI-native acquisition -- plus an internal codebase audit of every existing Olera intake surface and data table. Sources are at the bottom.

---

## The strategic frame (read before the ideas)

Two structural drops, two different problems. **3,809 → 72 (1.9% impression-to-engagement)** is the bigger one and it is not a copy problem. The visitor sees the module and decides "I don't know what this is or why I'd give you anything" before the first click. **72 → 8 (11% engagement-to-submit)** is a value-promise problem. The user starts engaging, then bails because the email-ask is concrete and the value-promise is abstract ("save your matches" -- save what, exactly?).

The fixes are different too. The 1.9% drop needs surface redesign or distribution change -- preview real value, change the page entirely, find a different surface where the visitor's intent is hotter. The 11% drop needs the value to become tangible BEFORE the email gate.

Layered on top: Olera's audience is in acute crisis. They have low energy and high trust requirement. Mechanics that worked on enthusiast crypto natives, marketing-savvy SaaS users, or 17-year-old TikTok users mostly won't transfer. The patterns that DO transfer are ones built around: **upfront giving (reciprocity), preview-before-ask, the multi-person nature of caregiving decisions, the commitment-device of having earned something, and the unique 2026 surfaces (AI agents, voice, MCP) that incumbents can't easily copy.**

A reality check the research surfaced: every adjacent platform that scaled in eldercare/family benefits (Cleo, Cariloop, Papa) eventually gave up on direct family acquisition and went B2B through health plans and employers. APFM's $300M+ revenue runs on a commission-only directory + human callbacks. The honest read is that direct family acquisition at scale is hard mode -- and Olera's structural moat (better digital product, no commission misalignment, agent-callable, real benefits intelligence) is exactly the kind of moat that requires several sharp product mechanics compounding to win.

**What's already built but underused.** The codebase audit revealed substantially more existing infrastructure than I assumed when first reading the metrics. Many of the ideas below are about ACTIVATING dormant mechanisms, not building new ones:

- **Full reverse-marketplace mechanic is shipped.** `/app/provider/matches/page.tsx` lets providers browse families with active care_posts (`FamilyMatchCard` showing care needs, payment methods, timeline, completeness score). `ReachOutDrawer` lets providers send a connection request with templated tone-based copy. Family receives `providerReachOutEmail`. The bottleneck is that only 17 families have opted in.
- **5-email re-engagement waterfall fires daily** via `/app/api/cron/family-nudges/route.ts` (3pm UTC). Sequence: go-live reminder → profile incomplete → provider recommendation → post-connection follow-up → dormant. One email per family per day. We already have a substantial post-signup retention machine.
- **SMS path exists** (V3 form lets users pick SMS over email; Twilio integration with STOP→opted_out handling). Most other competitors don't have this.
- **`benefits_results_tokens.provider_slug` is populated but UNUSED.** We have provider-page-to-signup attribution data sitting there.
- **`email_validity`, `phone_validity`, `preferred_contact_channel`** exist in schema but aren't gating sends. We can stop spamming bounced addresses + route through preferred channel for free.
- **`accounts.signup_source` + `session_id`** were just added (migration 065) but no analysis runs against them yet.

The product diagnosis shifts a bit because of this: the immediate lever isn't "build more" -- it's "show more of what's already there to families, route signups to it more aggressively, and add 1-2 net-new mechanics where there's genuine greenfield."

---

## The 10 ideas

Each idea: **mechanic** (one line) / **psychology** (why it works) / **Olera adaptation** (concrete) / **what we'd build** (rough scope) / **what could break** (the honest risks) / **conviction** (high / medium / speculative).

---

### 1. Preview-before-email -- show the answer, gate the artifact

**Mechanic.** Show the family the top 3 matches inline with names, savings ranges, eligibility hits, and a single-line "why this fits." No email required. The email gate moves to "save the full list," "email me the prefilled applications," or "set up alerts when programs change." Concrete value upfront; email earns a tangible artifact.

**Psychology.** Reciprocity primed by upfront giving (Cialdini's classic). The ask is no longer abstract -- the user has already received concrete value, so the email is "to take this with me," not "to find out if there's anything." NerdWallet's CardFinder is the canonical version: 10-question quiz, no email required to see recommendations, email is for downstream personalization. Endowed-progress effect compounds it (Nunes & Drèze 2006: 19% completion on a 0/8 punch card vs 34% on a 2/10 card with same effective requirement). When the user already SEES a list of 3 real matches, they're "halfway done" toward the saved list.

**Olera adaptation.** Restructure `BenefitsDiscoveryModule` (`components/providers/BenefitsDiscoveryModule.tsx`) so step 3 is "Here are your top 3 matches in [State]" with names, dollar ranges, one-line eligibility verdict, and a single primary CTA: "Save the full list of [N-3] matches + get prefilled applications by email." The matching engine (`lib/benefits/match-care-need.ts` + the in-memory program library) is already there. The information is already computed. We just stop hiding it.

**What we'd build.**
- Reorder steps in `BenefitsDiscoveryModule`: care_need → relationship → **inline preview (3 cards)** → email
- Each preview card: program name, monthly $ range, color-coded eligibility hit ("you qualify based on [income / state / age]"), source link
- Email CTA copy: "Save your full list of [N] matches" -- N is real, computed from the matchingPrograms array we already have
- New event: `benefits_preview_viewed` so we can measure preview→email conversion separately
- Migration to `seeker_activity` allowlist for that event (per the 2026-04-29 lesson on coupling app + DB CHECK)

**What could break.**
- Preview is so satisfying users don't email-gate (the "give the product away free" risk). Counter: gate the prefilled APPLICATIONS, not just the list. The list is the hook; the prefilled application is what they pay (with email) for.
- We mis-compute eligibility on the preview and create a false-positive impression. Counter: show RANGE language, not certainty ("you may qualify for $X-$Y if income is below $Z"). Same hedge we already use in copy.
- Provider page weight increases (more on-page rendering). Counter: the 3 cards are tiny; the matching is already client-side memoized.

**Conviction: HIGH.** This is the canonical fix. NerdWallet validates it. The only reason we don't have it is V3 was scoped as "minimum-form" rather than "preview-then-form." Net 4-7 day build. **This is one of the top 3 to ship.**

---

### 2. Sibling Mode -- the multi-person family profile

**Mechanic.** "Add my sister/brother to this care thread." When a family member starts the intake, they invite 1-3 other family members (sibling, spouse, adult child) to the thread. Each invitee gets an email with a magic link, joins the same `business_profiles type='family'` profile via a join-token, and adds their own care-context (what they've noticed about Mom, what they think she needs, their email, their contact preference). One profile becomes 2-4 contacts.

**Psychology.** Caregiving is structurally a multi-person decision. Siblings + spouse + adult children deliberate for weeks before committing. Olera currently captures one person at a time; the natural shape of the decision is a group. This mechanic ALSO converts identity-priming into a viral loop: the first member is the one who acts ("I'm advocating for Mom"); each invitee accepts because of social pressure within the family ("my sister is worried about Mom, she set this up, I should look at it"). Dropbox's two-sided referral pattern (250MB free for both inviter + invitee in their classic playbook -- the move that took them from 100K to 2.2M users in 15 months) applies here, but the reward is meaningful: "added care-team members get to see and approve the matches before final decisions." It's invitation as a literal feature of the product, not a marketing add-on.

**Olera adaptation.** Extend `business_profiles type='family'.metadata` with a new `care_team` field (array of `{ user_id, role, email, joined_at }`). Build `/api/care-team/invite` that issues an invitation token, sends an email via `inviteFamilyMemberEmail()`, and on accept appends to the array + creates an `accounts` row pointing at the same profile. The relational primitive `connections` table already supports this shape (multiple `from_profile_id` rows pointing to the same `to_profile_id`), so the schema additions are minimal.

**What we'd build.**
- New post-submit step (or quick add inline at submit): "Add up to 3 family members to this care thread"
- New email template `inviteFamilyMemberEmail` (reuses existing magic-link infra)
- New endpoint `/api/care-team/invite`
- New page `/portal/family/care-team` showing all invited/joined members + their contributions
- New event types `care_team_invite_sent`, `care_team_member_joined`
- Seed mechanic: at submit, family sees "Most families decide as siblings. Add yours, they'll see the same matches." 1-2 default suggestion fields, optional.

**What could break.**
- Privacy concerns. We're inviting people to a thread about their parent's care without that parent's consent. Counter: invitations are ALWAYS to family members the inviter explicitly chose; never auto-suggested from an address book. Email subject lines stay PHI-free per the 2026-04-26 memory rule.
- Low invite acceptance because the inviter doesn't actually want their sibling to know they're shopping for care (family conflict). Counter: opt-in. Don't push it.
- Engineering scope creeps as we build a real "thread" UI. Counter: V1 is just a join-the-profile mechanic; the "thread" can be email-based for the first 6 weeks of measurement.

**Conviction: HIGH.** Caregiving is structurally multi-person and we're treating it as single-user. The market is unserved here -- I cannot find a single eldercare platform doing this well. Differentiated, defensible, and a real expansion of value per signup. **Second of the top 3.**

---

### 3. The 30-Second AI Benefits Screen

**Mechanic.** Replace the form with a conversational AI agent that, in under 30 seconds, asks 3 things in plain language ("Who is care for? What state? Any current insurance?"), then names the top 1-3 programs the family qualifies for with a real dollar number ("you may qualify for $X-$Y/month from Y program"). Then offers to email a prefilled application + reminder schedule. The screen IS the product. Talkiatry's insurance-first reorder + Hims & Hers' quiz-style consultation pattern, but agentic and faster.

**Psychology.** Reciprocity primed by the agent's upfront work. By the time the email is asked, the agent has already DONE something for the user. Endowed progress: the agent says "I've already pulled the eligibility rules for [State] -- one more question and I can tell you what you qualify for." Voice or text, user's choice. The "give before you ask" pattern that Cleo (3x program engagement vs other vendors) and Cariloop (Care Coach pairing as the first interaction, not the form) both use, condensed into a 30-second AI experience that scales.

**Olera adaptation.** New surface: a one-question-at-a-time chat module with Anthropic-style design. Backend: Claude with tool-use against the existing waiver-library + match engine. The agent is a thin layer that calls our existing `/api/benefits/programs?state=XX` and `lib/benefits/match-care-need.ts`. Output is conversational summarization of what we already compute. The structured email-prefill leverages existing program metadata (eligibility rules, application URLs, savings ranges).

**What we'd build.**
- New module `components/providers/AIBenefitsScreen.tsx` (replaces or A/Bs against `BenefitsDiscoveryModule`)
- API route `/api/agent/benefits-screen` -- one or two streamed Claude calls with the program library as context
- Prompt-caching the program library so per-call cost stays under $0.02 (Anthropic prompt caching, 5-min TTL, cuts cached input cost ~10x)
- Email template `prefilledBenefitsApplicationEmail` -- includes the actual application form filled in with the family's state/care-need + provider directory link
- Voice option later (phase 2) -- text first to keep scope tight
- Event types: `ai_screen_started`, `ai_screen_match_revealed`, `ai_screen_email_captured`

**What could break.**
- LLM hallucinates eligibility numbers. Counter: prompt heavily constrains output to the program library shape; numbers come from structured data, not generation; we also keep "you may qualify" hedging language. The risk lives entirely on the prompt-engineering side, not at runtime.
- API cost blows up at scale. Counter: prompt caching makes this cheap. At $0.02/screen and 30K screens/month it's $600/mo. Worth it if conversion goes from 0.21% to 1%.
- 2026 user base is increasingly voice-native, but the older sub-segment (the parent themselves) prefers calls and humans. Counter: voice version comes second. Text first.

**Conviction: HIGH.** This is the Cleo/Cariloop/Talkiatry insight applied at machine scale. Differentiated from APFM's "fill the form, wait for the call" pattern. Leverages the agent-callable thesis from your 5/3 strategic narrative. Builds on existing infrastructure. **Third of the top 3.**

---

### 4. Care Receipt -- the shareable artifact

**Mechanic.** After submit, generate a beautiful, shareable, single-page "Care Receipt" -- a personalized summary of the family's situation, the top matches, and a clear next-step checklist. Designed to be screenshotted and texted to a sibling, posted to a family WhatsApp group, or saved to the iPhone wallet. The receipt is the product the user pays for (with email); it's also the viral mechanism.

**Psychology.** Lensa's $30M month from "magic avatars" wasn't really about the avatars -- it was that each user's avatar was a status-positive artifact they couldn't NOT share. The same psychology applies inverted in caregiving: the artifact is identity-positive ("I'm being a good advocate for Mom"). Marques Brownlee's 631% download spike for Lensa came from a single influencer post -- imagine the equivalent in eldercare from one popular family-finance creator (Scott Galloway's daughter, Nicole Lapin's audience, NextAvenue, AARP newsletters). Each receipt that gets shared functions as proof-of-concept to other families that asking for help is something good people do.

**Olera adaptation.** After submit, the user lands on `/m/[token]` (existing). Add: a "Save as image / PDF" generator that produces a 1080×1920 vertical card with: family situation summary line ("[Name] for [Mom], [State]"), top 3 program matches with savings ranges, a 5-step "what to do this week" checklist, and an Olera watermark. Add WhatsApp / iMessage / email share buttons. Track shares as a first-class event.

**What we'd build.**
- New route `/api/receipt/[token]/image` -- server-rendered image (`@vercel/og` or similar) from the family profile + matches
- Client component to display + share buttons
- Three pre-built share intents: WhatsApp, iMessage, copy-link, email-to-myself
- Event types `receipt_generated`, `receipt_shared` (per channel)
- A "Get your own care receipt" landing page for the recipient — tracks UTMs, captures the receiving family's email

**What could break.**
- Caregiving is more private than selfies. Most users won't share. Counter: even a 5-10% share rate is useful at our base, and the existence of the artifact is its own reward (it makes the user feel they got something concrete). Don't optimize for K-factor first; optimize for the user feeling cared for.
- Share content might leak PHI (parent's name in image alt-text). Counter: design carefully, no full names in image rendering by default; strip metadata.
- Visual design is hard. Counter: this is a brand investment that compounds. Worth doing well.

**Conviction: MEDIUM-HIGH.** Lensa-pattern transferability is the question. Worth a 1-2 sprint test. The artifact is valuable even without virality.

---

### 5. Reverse Marketplace amplification -- providers come to families

**Mechanic.** When a family submits intake AND opts into "let providers find me" (the existing care_post mechanic, currently used by ~17 families), surface the published profile to providers in their city + category. Providers respond with availability + pricing. Family sees a live ticker: "3 providers responded in the last 12 hours." The act of submitting flips from "I'm asking for help" to "providers are competing for me."

**Critical correction (added after codebase audit):** This mechanic is FAR MORE BUILT than the surface metrics suggest. The provider-side experience is fully shipped: `/app/provider/matches/page.tsx` lets verified providers browse published families, see `FamilyMatchCard` with care needs / payment methods / timeline / completeness score, and reach out via `ReachOutDrawer` with templated tone-based copy. The family receives `providerReachOutEmail` automatically. The mechanism works end to end TODAY for the 17 families who have published. The bottleneck is purely on the family-side opt-in rate, not on the build.

**Psychology.** Inverted-power dynamics. Today the family does the work of contacting 5 providers; in this model the providers do the work of contacting 1 family. The 17 published care_posts are the existing proof point that families WILL opt in -- the mechanic is just buried at step 6 of a 7-step form most families never reach. Live evidence of provider activity is the unlock: families see "[N] providers in [City] responded to families this week" and the mechanic becomes legible.

**Olera adaptation.** Two surfaces, both relatively cheap because the provider side is already done:
1. **Family-facing:** Amplify the "Let providers find me" opt-in into a primary CTA on submit. Show what they'd get: "Providers will reach out within 24h with real pricing and availability." Show live activity: "Providers in [City] responded to [N] families this week" (real number from connections.type='request' filtered by area + recency). Position it as the PRIMARY value of completing the intake, not a checkbox afterthought.
2. **Provider-facing:** Provider Matches page exists but isn't well-promoted to providers. Add a daily/weekly "X new families published in [Your City]" digest email (using the existing `family-nudges` cron pattern, just for providers). Reduce time-to-first-response by surfacing the new family inside the post-Q&A-answer hero (Strategic Backlog #5 already shipped that hero -- piggyback on it).

**What we'd build (smaller than I initially scoped because the mechanism is shipped):**
- Reorder the post-submit overlay to lead with the care_post opt-in, with live activity evidence
- Show the family a "publish to providers" CTA in their `/m/[token]` page if they didn't opt in at submit time (deferred conversion)
- New cron: weekly provider digest of "new families in your area" (reuses the family-nudges cron pattern)
- Surface "new family published in your city" inside the existing V2 dashboard hero so providers see it on their next session
- Add `family_responses_count` to family metadata, increments per `connections` row received, drives the live counter
- Backfill the 17 existing care_posts by emailing those families "Here's what's happened with your published profile" -- both as a re-engagement and as evidence the mechanic works

**What could break.**
- Providers don't engage with the matches page. Counter: tie a CTA into the existing post-Q&A-answer hero -- providers who answered a question are HOT and we're already in their inbox.
- Families feel surveilled by the live ticker. Counter: opt-in. Default to "first name + city only" representation. Toggle for fully anonymous.
- 17 published profiles is a small base. Counter: that's the test. If the family-side opt-in rate doubles or triples, the mechanic compounds. The provider-side machinery is already designed for ~1000s of published families.

**Conviction: HIGH.** The build is mostly done. The bottleneck is family-side surfacing + live-evidence loop. Cheaper and faster than I rated it on first pass. **Bumped into the top 3 ship list because of the audit finding.**

---

### 6. Earned-Access Care Concierge -- 1:1 onboarding, scarcity-gated

**Mechanic.** No phone number on the website. Families EARN a 30-min Care Concierge call by completing the intake form (60 seconds, 4 fields). The concierge is a real human (initially TJ, later staff) who walks them through their matches, customizes a checklist, and coordinates first provider outreach. Superhuman's playbook: 1:1 onboarding for every paying user, ~20 specialists at peak, 2x retention vs self-serve.

**Psychology.** Scarcity is a commitment device. APFM's 30-year moat is human callbacks; Olera's version is BETTER human callbacks, gated behind enough effort that the pool is filtered to serious intent. Reciprocity again -- the user invests effort, then receives a real human's attention. Cleo and Cariloop both use "you'll be paired with a Guide / Coach" as the first promise; Olera's version is more selective but identical in psychology. The 17 published care_posts and the 24 weekly Q&A sign-ins suggest there ARE families willing to commit; the funnel just needs a value-promise that matches the effort.

**Olera adaptation.** Add a post-submit step: "We have one Care Concierge slot open this week. Click to claim." 4 daily/weekly slots in early days. Direct-book Calendly link or magic-link confirmation. After the call, the concierge files a written care plan to the family's `/portal/family/care-team` view (overlap with idea #2). Mechanic ties to TJ's "build value first, gate later" philosophy because the value (real human help) is real and the gate (intake completion) is light.

**What we'd build.**
- A "claim concierge call" button post-submit, gated by intake completion
- Calendly integration with TJ's calendar to start (5-7 slots/week)
- A Care Plan template in Notion or Google Docs that gets shared post-call
- A simple admin view of upcoming concierge calls
- Event type `concierge_claimed`, `concierge_completed`

**What could break.**
- Doesn't scale beyond 5-10 calls/week without staff. Counter: this is the test phase; if conversion lifts substantially, it justifies hiring.
- Quality varies between calls. Counter: TJ has the highest signal-to-noise; he should be the only one doing this for the first 2-3 months.
- People expect APFM-style commission-free advice. Counter: explicitly market it as commission-free advisory with no financial relationship to providers.

**Conviction: MEDIUM.** Real but operationally narrow. Worth shipping in parallel with #1-3 because it filters serious intent and produces hand-coded user research we don't otherwise get. The Superhuman lesson is that 1:1 onboarding at small scale produces superfan users who drive word-of-mouth.

---

### 7. Voice-First Crisis Triage

**Mechanic.** A phone number (and WhatsApp number) families call. They talk for 30 seconds in natural language about their situation. An ElevenLabs/Sesame/Vapi-quality AI voice agent surfaces 3 program matches + offers to text/email them. Lower friction than ANY form -- nothing to read, nothing to type, no UI to navigate. For a 65-year-old caregiver burnt out on their phone late at night, this is the lowest-friction surface in 2026.

**Psychology.** Defaults / nudge theory: voice is the most natural human interface, and an exhausted caregiver who can't read another form will TALK. Acute-state buyer behavior favors real-time low-cognitive-load interaction. Cariloop's Care Coach pairing ("immediately paired with a Care Coach") is structurally the same idea, but voice is faster and scales without staff. Talkiatry's insurance-first reorder works in voice too -- "do you have Medicaid, Medicare, or private insurance?" is the first question that reduces eligibility-anxiety.

**Olera adaptation.** Spin up an inbound number via Twilio (already integrated for WhatsApp). Pipe it through Vapi or ElevenLabs Conversational. The agent's prompt loads the same waiver-library context as #3. After the call, agent emails or texts the matches. Voice transcript saved to seeker_activity with PHI redaction.

**What we'd build.**
- Twilio inbound number (Olera Care Line)
- Vapi or ElevenLabs flow with system prompt anchored to program library
- Tool-call to `/api/benefits/programs` mid-conversation
- Post-call SMS or email with matches
- Optional: same surface on WhatsApp (already integrated)
- Promotion: phone number in footer of every email, on every provider page, in the welcome email

**What could break.**
- Voice agent quality is not yet 100%. Counter: it's good enough for a 30-second triage now; not good enough for full counseling.
- Reliability + telephony cost. Counter: small, capped early. Like ~$0.10/minute, and call lengths are short.
- Older caregivers expect a real human voice. Counter: this is the magic -- 2026 voice agents pass for human well enough that quality is the bigger battle, not authenticity. Opt-out to a human concierge call (#6) as fallback.

**Conviction: MEDIUM-HIGH.** Differentiator nobody else in eldercare has. Cost is bounded. The mechanic that goes from "low-energy crisis state" → "qualified contact" without ever asking the family to type. **Worth a 2-3 week MVP.**

---

### 8. Hospital Discharge Trojan Horse

**Mechanic.** Most acute-state families come in via hospital discharge. Build a dedicated landing page (`/discharge`) optimized for "[city] hospital discharge to home care," "discharge planner senior care [state]," etc. Page asks one thing first: "When are you being discharged?" Captures discharge date AND email AND care-need. Promise: "We'll have your benefits paperwork ready by then." Reciprocity primed by date-anchored urgency.

**Psychology.** Time-bound urgency is the strongest commitment device available. Hospital discharge produces a 24-72 hour decision window, and the family will share email/care-need at this moment that they wouldn't share casually. Time-pressured users have radically different conversion behavior than browsers. Combined with a deliverable that clearly maps to their deadline ("paperwork by [discharge date]"), this becomes the intake surface for the highest-intent visitors Olera could possibly reach.

**Olera adaptation.** New route `/discharge/[city]` (or `/discharge` with a city picker). Single H1: "Your loved one is being discharged from the hospital. We'll have benefits paperwork ready before they go home." Step 1 question: discharge date. Step 2: city + insurance. Step 3: email + phone. Then the existing matching engine kicks in. Push the page in: Google Ads on hospital-related searches in 5 cities; partnerships with discharge planners (B2B sales motion); content piece on the page itself reaching SEO over time.

**What we'd build.**
- Page route + variant
- Date-of-discharge field added to family metadata
- Cron that sends a "your discharge is in 3 days, here's your prefilled paperwork" email at the right time
- 5-city Google Ads pilot ($500-$1000/mo to test)
- A B2B-sale sheet for hospital discharge planners (separate sales motion)

**What could break.**
- We don't actually have hospital partnerships, so the "paperwork" promise has to be self-served. Counter: it can be -- prefilled Medicaid waiver applications + a checklist + provider matches IS the paperwork.
- Google Ads in healthcare are expensive and competitive. Counter: long-tail discharge-specific queries are NOT competitive. APFM doesn't optimize for these.
- The mechanic only matters at acute moment. Counter: that's the point. Acute is where Olera's structural advantage compounds.

**Conviction: MEDIUM.** Channel-specific but powerful. The mechanic is a real product (the page + the deliverable), not just a marketing channel. Worth a 3-week pilot in one city.

---

### 9. Insurance-First Reordering (the Talkiatry move)

**Mechanic.** Flip the SBF intake. Step 1 isn't "what kind of care?" -- it's "Does your loved one have Medicaid, Medicare, or private insurance?" Filter eligibility upfront. Reduces the silent "wait, can I afford this?" exit. Shows we know how the care system works. Talkiatry got 95% verification accuracy + 8:1 ROI in 12 months by reordering this way.

**Psychology.** Loss aversion in benefits applications is the canonical reason Medicaid take-up rates are low (Currie & Madrian; many subsequent studies). Families ASSUME they don't qualify and exit before checking. If we name the insurance vector first and tell them what's possible, the eligibility exit door closes. Choice architecture for stressed decision-makers: name the most-likely-relevant constraint first; reduce the search burden.

**Olera adaptation.** Reorder the existing 2-step V3 module: insurance → care_need → relationship → contact. Or: ask insurance simultaneously with care_need ("Care for whom? + Insurance?"). The existing match engine already filters by Medicaid eligibility -- this just makes the filter visible to the user upfront, instead of silently culling matches in the backend.

**What we'd build.**
- Reorder steps in `BenefitsDiscoveryModule`
- New copy: "What insurance does [Mom] have? We'll only show care options [Mom] qualifies for."
- Match engine already handles this (filter by `metadata.medicaid_status` and `payment_methods`)
- Event type `insurance_status_captured` (early in funnel, not late)

**What could break.**
- Some users don't know their parents' insurance. Counter: "Not sure" option that triggers a magic-link follow-up email asking them to check.
- Privacy posture -- naming insurance early can feel intrusive. Counter: framing matters ("we'll only show options [Mom] qualifies for, no surprises"). Talkiatry's success here is the proof point.

**Conviction: HIGH.** Cheapest test possible (literally a step reorder + copy change). Talkiatry validates the pattern. **Could ship in a single afternoon as an A/B variant.**

---

### 11. Hyper-optimize for mobile (added 2026-05-05 PM by TJ)

**Mechanic.** Acute-state caregivers are overwhelmingly on phones (hospital lobby, late at night with the parent, in transit, in the parking lot of the rehab facility). If the module is broken or awkward on mobile -- broken keyboard handling, viewport jumps, autofill not firing, layout shifts pushing the SBF further down the page, form state lost on accidental back -- that IS the 1.9% impression-to-engagement collapse.

**Psychology.** Removing friction at the moment of intent. There's no clever positive psychology here -- it's just "if it doesn't work, they leave." Acute-state users have less patience for broken UI than enthusiastic users; their patience budget is already spent on the situation that brought them here. Mobile-first is not a design philosophy at this stage, it's a diagnostic.

**Olera adaptation.** Two phases.

Phase 1 (the diagnosis -- can be done today): split the existing benefits funnel by device. Add `device_type` to seeker_activity metadata if not already there. Look at impression → start → submit rates for mobile vs desktop separately. **If mobile converts at 1/10 the rate of desktop, the entire 1.9% is mobile and the diagnosis is done.** If mobile converts the same as desktop, the problem is structural to the surface, not the device.

Phase 2 (the fixes): assuming the data shows mobile is the problem, audit and fix:
- **Tap targets:** every interactive element ≥44px. Audit every button in `BenefitsDiscoveryModule`.
- **Keyboard handling:** input fields scroll into view above the keyboard, don't get covered. iOS Safari + Android Chrome both. Use `scrollIntoView({ block: "center" })` on focus.
- **Autofill:** `autocomplete="email"`, `autocomplete="tel-national"` already set; verify they fire on iOS Safari + Chrome Android. Check if email field type is `email` (triggers email keyboard) and phone is `tel`.
- **Form state persistence:** if user accidentally backs out or background-tabs, restore on return. We already use localStorage for the standalone /benefits/finder; verify embedded V3 does too.
- **Layout shifts:** check Cumulative Layout Shift on the provider page. If the SBF is being pushed below the fold by an asynchronously-loading hero image or ad, fix that.
- **Below-the-fold detection:** is the SBF even visible without scrolling on a 375pt iPhone SE viewport? If not, that's most of the impression-to-engagement drop.
- **Accidental tap dismissal:** the modal pattern in BenefitsDiscoveryModule has nested click handlers; check if a stray tap collapses the form mid-flow.
- **Slow networks:** test on throttled 3G in Chrome DevTools. If the module renders late, it's invisible during the user's first scroll.

**What we'd build.**

- Diagnostic step: device split in admin/analytics for benefits funnel
- Mobile audit pass: real device testing, not just Lighthouse. iOS Safari, Chrome Android, low-end Android (4GB RAM), throttled 3G.
- Fixes per the list above
- Per-fix A/B testing if it's a meaningful UX change; small CSS/keyboard tweaks ship without A/B
- Event types to track resolved: `mobile_form_lost_focus`, `mobile_keyboard_covered_input` (these are diagnostic, drop after fixes)

**What could break.**

- Audit reveals the problem isn't mobile after all. **Counter:** that's a useful negative result; pivots us to other mechanics in the top 4.
- Mobile fixes regress desktop. **Counter:** common, fixable. CSS targeting of mobile-only via media queries.
- The fix list is a maintenance project, not a single ship. **Counter:** prioritize the top 2-3 worst issues by funnel-loss attribution, ship those, then continue.

**Conviction: HIGH** if the device split shows mobile is materially worse. **Lower conviction** if mobile and desktop convert similarly -- in which case the problem is structural and we route to other mechanics. The diagnostic comes first.

### 12. "Get help" real-time chat (added 2026-05-05 PM by TJ)

**Mechanic.** A persistent "Get help" or "Chat with us" button bottom-right of every provider page (and `/benefits/finder`). Opens a real-time chat. Initially staffed manually by TJ; AI-augmented as volume grows. Conversation captures contact info naturally as the chat unfolds, NOT as a form gate. **Different surface for engagement entirely** -- captures users who would never fill a form.

**Psychology.** Acute-state caregivers under emotional load want to TALK to a human, not fill a form. Cleo's Care Coach pairing (3x program engagement vs other vendors) and Cariloop's Care Coach (immediate pairing on signup) both win on this exact pattern. APFM's 30-year moat is human callbacks -- the existence of a real person to talk to is the dominant trust signal in this category. Real-time chat compresses the APFM 24-hour callback into 30 seconds, async-friendly (the family can step away and come back), and never requires the family to commit to a phone call before they've decided whether they want one.

**Olera adaptation.** Two phases.

Phase 1 (low-effort install, ship in a week): add Crisp, HelpScout Beacon, or Intercom Lite to every provider page + `/benefits/finder`. Initial staffing: TJ for first 2-3 weeks (during business hours; auto-reply with "we'll get back to you within X hours" outside). Capture email + care need + city + relationship in the conversation, not a form. The chat IS the intake.

Phase 2 (when manual scale breaks): AI agent that does triage and surfaces matches in-chat (similar to idea #3 30-Second AI Benefits Screen but conversational rather than form-styled). Hands off to TJ/staff for high-intent / complex conversations. Voice option (calls become inbound to the chat surface, transcribed in real time).

**What we'd build.**

- Phase 1: Crisp / HelpScout / Intercom integration on every provider page + finder
- Custom widget styling to match Olera brand (avoid generic chat-app feel)
- TJ-staffing schedule + after-hours auto-response
- Capture mechanism: chat transcripts persisted as `seeker_activity` events; email/phone extracted and written to `business_profiles type='family'` on consent
- Phase 2: AI triage agent (Claude with tool-use against waiver-library + match-engine, same pattern as idea #3)
- Phase 2: voice/phone fallback via Twilio (overlaps with idea #7)

**What could break.**

- TJ's bandwidth -- can't sustain manually beyond a few weeks at meaningful volume. **Counter:** that's the test. If volume is high enough to overwhelm, the AI triage layer is justified. If volume is low, manual is fine for months.
- Quality varies, especially with AI triage. **Counter:** TJ-only mode for first month; AI introduced gradually with TJ reviewing every transcript.
- Generic chat widgets feel un-Olera. **Counter:** custom-style the widget aggressively; or build a custom widget on top of websockets/SSE if the off-the-shelf doesn't fit.
- Chat doesn't scale the way forms do because each conversation requires attention. **Counter:** that's the point -- it's a different funnel for users the form doesn't capture. Form continues to handle the form-friendly users.

**Conviction: HIGH** as a parallel surface to the form. Cleo, Cariloop, APFM all validate the human-first-touch pattern. The cheap install (Crisp / HelpScout / Intercom) means we can test it inside a sprint without over-committing.

### 13. Bring back V2 (control_legacy_v2) benefits (added 2026-05-05 PM by TJ)

**Mechanic.** Reroute SBF traffic to the legacy V2 5-step intake. A/B against V3 (current 2-step). If V2 wins materially on submit rate, V3 was the regression and we ship V2 + the preview-before-email layer (idea #1) on top of it.

**Psychology.** V3's simplification was supposed to LIFT conversion (targets: 55% step-1 pickup, 15% contact completion). It didn't. Reality: 1.9% engagement, 0.21% submit. The simplification may have removed the things that were doing the work in V2:

- **Endowed progress effect** -- visible "step 1 of 5" creates artificial advancement, drives completion. Nunes & Drèze 2006: 19% completion on a 0/8 punch card vs 34% on a 2/10 card with same effective requirement.
- **Sunk-cost investment** -- 5 questions answered creates commitment that makes step 6 (email) feel cheap. 2 questions answered (V3) doesn't have the same compounding effect.
- **Question diversity = signal of real matching** -- when V2 asked income range, Medicaid status, veteran status, the user felt the matching was REAL. V3's 2 questions can read as a glorified email-capture form.
- **Loss-aversion language opportunity** -- V2's longer flow had room for hedged eligibility framing ("you may qualify for...") that V3's compressed flow doesn't carry.

**Olera adaptation.** Cheapest test possible. The `control_legacy_v2` variant exists in the variant assignment library (per the codebase audit). Two paths:

Path A (if the V2 component code still exists): re-enable the variant in `assignBenefitsVariant`, route a meaningful % of traffic to it, A/B against V3 for 14-21 days.

Path B (if the V2 code was deleted in the V3 cutover): re-implement V2's 5-step structure as a new variant. Use `BenefitsIntakeForm` (the standalone /benefits/finder version) as the structural template, embed it in the provider page surface.

**What we'd build.**

- Verify `control_legacy_v2` variant code state
- Reroute or rebuild
- A/B variant assignment update (gcd math for clean independent splits already validated for the 4-arm intake)
- Funnel events tagged with variant
- 14-21 day measurement window
- Ship-decision gate: if V2 submit rate exceeds V3 by ≥2x, V2 wins

**What could break.**

- V2 wasn't actually better; we just remember it as better. **Counter:** A/B test answers this directly.
- V2 had its own unmeasured friction; we just hadn't hit the ceiling on it. **Counter:** measurement is cheap; this experiment costs us 14 days and minimal eng time.
- We end up running V2 forever and V3 was the right direction with a different fix needed. **Counter:** V2-with-preview-before-email layer is a real synthesis path if both win partially.

**Conviction: HIGH.** Honest correction is cheap. If TJ's intuition that V2 was converting is right, this is the fastest path back to a working baseline.

### 10. Care-Readiness Points -- crypto-mechanic stripped of speculation

**Mechanic.** A points system anchored to TANGIBLE care-readiness rewards, not speculative tokens. Family earns "Care Points" for: completing intake (50), saving 3+ providers (25), publishing care_post (100), inviting a sibling (75), uploading discharge paperwork (50), attending the concierge call (100). Points unlock real services: free 30-min senior care attorney consult (250), free Medicaid application review by benefits specialist (350), prioritized provider response window (500). The "tokens" are real-world utility services Olera coordinates.

**Psychology.** This is the crypto points-program mechanic with the speculative element removed. Hyperliquid distributed 31% of supply to 94K users (avg $45K) -- the magic was earned-future-value with a clear path to claim. Friend.tech failed because the future-value was pure speculation with no underlying utility -- once enthusiasm faded, retention collapsed (DAU went from peak to <100, then <15). The lesson: points programs work when the future-value is REAL and ANCHORED. For families in crisis, real future-value = expert services they couldn't otherwise afford. Endowed-progress effect compounds (showing them they're at 150/250 for the attorney consult creates persistence to complete).

**Olera adaptation.** New table `family_points_ledger` (entry per action). New `business_profiles type='family'.metadata.care_points` running balance. New page `/portal/family/care-readiness` showing: current balance, recent earnings, available rewards, claimed rewards. Initial reward services are coordinated by TJ + small partner network (one attorney, one benefits specialist, one Medicaid navigator) -- this is OPERATIONALLY scoped, not infinitely scalable, but the mechanic generates contact info + commitment + repeat returns from the same family. The point isn't massive scale; it's deeper engagement per family.

**What we'd build.**
- `family_points_ledger` migration
- A `/api/points/award` route called by every event-firing surface
- `/portal/family/care-readiness` page with progress UI
- Reward redemption flow (email-the-attorney with the family's profile attached)
- Three partner relationships (attorney / benefits specialist / Medicaid navigator) -- TJ-led BD
- Welcome email update: "You've earned 50 Care Points. 200 more unlocks a free attorney consult."

**What could break.**
- The "tokens" must actually deliver. If the attorney consult is poor or delayed, the system breaks. Counter: white-glove service quality from day one; small partner pool we vet personally.
- Operationally light at first; sustainable economics if family→Pro conversion is high enough. Counter: this is the test.
- Could read mercenary in healthcare. Counter: name it "Care Readiness" not "Care Points." Reward UTILITY, not status.

**Conviction: MEDIUM.** Most ambitious of the ideas. Worth piloting with a small cohort first (top 50 most-engaged families) before broad rollout. Ties to "build value first, gate later" because the value (free expert services) is genuine and the gate (engagement milestones) is earned.

---

## Honorable mentions (cut from top 10 but worth flagging)

- **Olera as a ChatGPT App / MCP Server** -- distribute via OpenAI's app store. ChatGPT has 900M WAU and 50M paid as of early 2026. App SDK shipped April 2025. MCP server registry grew from 1,200 (Q1 2025) to 9,400+ (April 2026). The thesis from your 5/3 strategic narrative is right; the deeper move is to package the family intake as a CONSUMER-FACING ChatGPT App. Cut from top 10 because H2 (PR #726) already covers the foundation.
- **WhatsApp Concierge** -- inbound WhatsApp number for families. Twilio integration exists. Older audiences ARE on WhatsApp in 2026. Cut because it's mostly a sub-mechanic of #7 (Voice-First Triage) and will land in that v2.
- **AI Twin / Care Plan as Artifact** -- voice or text creates an AI twin of Mom's situation, family shares with relatives + doctors. Cut because it's an extension of #4 (Care Receipt) more than a distinct mechanic.
- **Empathy Reactivation for cold list** -- "just checking on you" two-button email for non-converted families. Cut because it's a downstream retention play, not an acquisition mechanic.

---

## What I'd ship now (top 4) -- REVISED 2026-05-05 PM

**Reframe by TJ:** my original top 3 (Preview / Reverse Marketplace / Sibling Mode) didn't directly address the conversion problem. Sibling Mode is a value-per-signup expansion; Reverse Marketplace is a post-signup retention play. Both could compound AFTER we fix the funnel, but neither fixes the 1.9% impression-to-engagement collapse or the 11% engagement-to-submit drop. The corrected top 4 stays inside the conversion frame.

**Also corrected:** V3 (the current 2-step embedded SBF) was supposed to LIFT conversion vs the 5-step V2 it replaced. V3 targets: 55%+ step-1 pickup, 15%+ contact completion. Reality: 1.9% engagement, 0.21% submit. V3 is a regression. The simplification may have removed the very things that were doing the work in V2 -- visible step progress, question diversity creating sunk-cost investment, multi-field signal that the matching was real. **V3-as-fixed-baseline was the wrong assumption.**

1. **Preview-before-email (#1).** Cheapest, most testable, most likely to move the 11% engagement-to-submit number. NerdWallet-validated. 4-7 day build. Single A/B test.
2. **Hyper-optimize for mobile (#11).** Acute-state caregivers are overwhelmingly on phones. If the module is broken on mobile, that IS the 1.9% drop. **First diagnostic: split the existing funnel by device.** If mobile is 0.1% and desktop is 1%, that's the entire problem in one cell. 1-2 weeks for the audit + fixes.
3. **"Get help" real-time chat (#12).** Different surface for engagement entirely. Some users won't fill a form, period. APFM's moat in chat form, but lower friction. Persistent CTA on every provider page. TJ-staffed initially; AI-augmented as volume grows. ~1 week for a Crisp / HelpScout install + manual staffing; longer for AI-augmentation.
4. **Bring back V2 (control_legacy_v2) benefits (#13).** Reroute traffic to V2 if the variant code still exists. A/B against V3. If V2 wins materially, V3 was the regression and we ship V2 + the preview-before-email layer on top. Cheapest test possible. ~1 day if code exists; 2-3 days to re-implement if deleted.

Then in parallel:
- **Insurance-First Reorder (#9)** as a same-day A/B variant. Cheapest possible test on V3; tells us in 7-10 days whether eligibility-friction is the silent exit cause.

**Now-deprioritized (good ideas, but post-conversion-fix):**
- Sibling Mode (#2), Reverse Marketplace amplification (#5), Care Receipt (#4), 30-Second AI Benefits Screen (#3), Voice-First Triage (#7), Hospital Discharge Trojan Horse (#8), Earned-Access Concierge (#6), Care-Readiness Points (#10) -- all stay in the doc as next-tier plays once conversion is unblocked.

**Free wins from the audit (not radical ideas, just hygiene):**
- Use `email_validity` and `phone_validity` to gate the `family-nudges` cron sends. Stop emailing bounced addresses.
- Use `preferred_contact_channel` to route messages through SMS for the families who picked it.
- Run the `benefits_results_tokens.provider_slug` data through an analysis to see which provider pages convert best -- already in the database, just unused.
- Persist `profile_completeness` on write rather than recomputing per render. Lets cron jobs filter by it.

Don't run more than the top 4 concurrently. The constraint isn't ideas; it's measurement clarity. If experiments are live simultaneously without baselines, attribution is impossible.

---

## What I'm explicitly NOT recommending

- **Caregiver streak / Duolingo-style gamification.** Wrong audience. Caregiving isn't a daily habit you want to grind through.
- **Public family profile board.** Privacy posture risk. Even anonymized, families don't want their parent's care situation up for browsing.
- **Pure speculation-driven points/rewards.** Friend.tech is the warning. Without underlying utility, mercenary engagement evaporates.
- **Hospital partnerships at this stage.** Long enterprise sales cycle. The B2B path is real (Cleo, Cariloop, Papa all eventually went there) but it's a Logan-2027 move, not a Q2 2026 move.

---

## Sources

### Crypto / points programs
- [Hyperliquid (HYPE) Airdrop Details — CoinDesk Nov 28 2024](https://www.coindesk.com/business/2024/11/28/crypto-exchange-hyper-liquid-to-airdrop-310-m-tokens-to-early-adopters)
- [Hyperliquid airdrop — CoinGecko learn](https://www.coingecko.com/learn/what-is-hyperliquid-and-what-the-hyperliquid-airdrop-means-for-defi)
- [EigenLayer EIGEN airdrop controversy — DLNews](https://www.dlnews.com/articles/defi/users-gripe-about-eigenlayers-airdrop/)
- [EigenLayer's EIGEN airdrop and the demise of points — CoinDesk](https://www.coindesk.com/tech/2024/05/09/eigenlayers-eigen-airdrop-might-signal-demise-of-once-popular-points)
- [Eigen Foundation expanded EIGEN allocation — CoinMarketCap](https://coinmarketcap.com/academy/article/eigen-foundation-expands-eigen-token-allocation-by-dollar280m-to-address-concerns)
- [Friend.tech rise + fall — CryptoPragmatist](https://cryptopragmatist.com/p/rise-fall-friendtech-cautionary-tale-web3-developers)
- [Friend.tech token crash 98% — Bitcoinist](https://bitcoinist.com/friend-tech-fiasco-token-tanks-98-after-airdrop/)
- [Friend.tech failure analysis — DLNews](https://www.dlnews.com/articles/defi/socialfi-rose-in-popularity-last-year-before-falling/)
- [Blur airdrop guide — Boxmining](https://www.boxmining.com/blur-token-airdrop-guide/)
- [Blur Season 2 case study — Medium](https://thegreatarbitrageur.medium.com/how-blur-enhances-nfts-liquidity-through-airdrop-events-a-case-study-of-season-2-b5a3371c1f31)

### Viral waitlists / invite-trees
- [Dropbox referral program 3900% growth — GrowSurf](https://growsurf.com/blog/dropbox-referral-program)
- [Dropbox referral case study — Viral Loops](https://viral-loops.com/blog/dropbox-grew-3900-simple-referral-program/)
- [Robinhood pre-launch waitlist 1M — Prefinery](https://www.prefinery.com/blog/referral-programs/prelaunch-campaign/robinhood/)
- [Robinhood waitlist case study — Waitlister](https://waitlister.me/growth-hub/case-studies/robinhood)
- [Superhuman onboarding playbook — First Round Review](https://review.firstround.com/superhuman-onboarding-playbook/)
- [Superhuman secret to success — Lenny's Newsletter](https://www.lennysnewsletter.com/p/superhumans-secret-to-success-rahul-vohra)
- [Cal AI growth strategy — Plutus](https://growwithplutus.com/blog/cal-ai-app-tiktok-strategy)
- [Cal AI 17yo founder $1M MRR — Micro Empires](https://www.microempires.cc/p/cal-ai)
- [Lensa AI Magic Avatars viral — TechCrunch](https://techcrunch.com/2022/12/01/lensa-ai-climbs-the-app-store-charts-as-its-magic-avatars-go-viral/)
- [Lensa AI $50M revenue analysis — Startup Spells](https://startupspells.com/p/lensa-ai-avatars-riding-ai-wave)

### Healthcare / eldercare acquisition
- [A Place for Mom funnel friction paradox — Kristen Berman Substack](https://kristenberman.substack.com/p/a-place-for-mom-lead-gen-hacking)
- [A Place for Mom 2026 review — Senior Living](https://www.seniorliving.org/companies/a-place-for-mom/)
- [Caring.com directory + reviews](https://www.caring.com/)
- [Cleo family benefits employer model — Cleo](https://hicleo.com/for-employers/)
- [Cleo Most Innovative 2024 — Fast Company](https://www.fastcompany.com/91040286/cleo-most-innovative-companies-2024)
- [Cariloop caregiver concierge employer pivot — D Magazine](https://www.dmagazine.com/healthcare-business/2026/02/ca/)
- [Papa companion care signup — Papa.com](https://www.papa.com/)
- [Honor home care unicorn — TechCrunch](https://techcrunch.com/2021/10/05/senior-care-startup-honor-secures-370m-in-debt-and-equity-reaches-unicorn-status/)
- [Talkiatry insurance-first intake — Sohar Health](https://www.soharhealth.com/client/talkiatry)
- [Talkiatry verification 95% accuracy — PRNewswire](https://www.prnewswire.com/news-releases/sohar-health-and-talkiatry-expand-access-to-mental-health-care-by-automating-insurance-eligibility-process-302419189.html)
- [Hims & Hers email-marketing $1.5B telehealth — List Growth Engineers](https://www.listgrowthengineers.com/blog/hims-telehealth-email-marketing-case-study)
- [Modern Fertility hormone test mechanic — Ro.co](https://ro.co/fertility/)
- [NerdWallet personalized recommendations — Emily Scott Design](https://www.hellomynameisemily.com/design-work/personalized-rec)

### 2026 AI-native + behavioral econ
- [ChatGPT 900M WAU 2026 — ALM Corp](https://almcorp.com/blog/chatgpt-900-million-weekly-active-users/)
- [ChatGPT 2026 statistics — DemandSage](https://www.demandsage.com/chatgpt-statistics/)
- [MCP adoption statistics 2026 — Digital Applied](https://www.digitalapplied.com/blog/mcp-adoption-statistics-2026-model-context-protocol)
- [AP2 protocol announcement — Google Cloud](https://cloud.google.com/blog/products/ai-machine-learning/announcing-agents-to-payments-ap2-protocol)
- [AP2 protocol docs](https://ap2-protocol.org/)
- [Google AI agent commerce protocol — TechCrunch Jan 2026](https://techcrunch.com/2026/01/11/google-announces-a-new-protocol-to-facilitate-commerce-using-ai-agents/)
- [Universal Commerce Protocol 2026 — A2A Protocol](https://a2aprotocol.ai/blog/2026-universal-commerce-protocol)
- [Endowed Progress Effect — Nunes & Drèze 2006 (SSRN)](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=991962)
- [Endowed Progress Effect — Coglode behavioral nugget](https://www.coglode.com/nuggets/endowed-progress-effect)

---

*Doc owner: TJ + Claude (Head of Product mode). Update as ideas ship and measure.*
