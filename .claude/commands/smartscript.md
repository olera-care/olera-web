# Smart Script

Input: `$ARGUMENTS` — a provider name, a family/care-seeker name, a slug, or a profile ID. Nothing means the person we most recently discussed.

A call script built out of what this person has actually done, not a template with their name dropped into it. The test it has to pass: **every claim in it could only be said to this one person.** If a line would be true of any provider on the book, cut it.

The value is not "here is our pitch." It is "you did X on the 8th, which means Y is the next thing worth doing." That is only possible because we hold the record. Use it.

## Phase 1 — Resolve and pull the briefing

Resolve the name against `business_profiles` (providers) or `care_seekers` (families). If a fragment matches both, show both and stop.

**Do not rebuild the data layer — it exists.** For providers, `provider_growth_tracking` holds the row, and `GET /api/admin/provider-growth/<tracking_id>/briefing` returns questions, leads, engagement, photos, reviews, profile completeness, Ad Boost state, feature engagement and email stats, all computed from real records. Fetch it from the authenticated browser (the automation profile is signed into olera.care; a `401` means TJ has to sign in there first).

Get the tracking id by `business_profile_id`, not `provider_id` — that column does not exist on that table.

**Treat the endpoint's own `openingScript` as raw material, not output.** It is generated from templates and it routinely opens on the deficit ("you've reached 0 families so far"), which is exactly what we do not do. Take its numbers; write your own words.

## Phase 2 — Go outside our database

The briefing only knows what Olera saw. Three sources it cannot see, and each has produced something decisive:

- **Live Google Business Profile** via Places `searchText` (key in `.env.local`, `GOOGLE_PLACES_API_KEY`). Ask for rating, `userRatingCount`, `regularOpeningHours`, `websiteUri`, `formattedAddress` and `reviews.relativePublishTimeDescription`. **Review recency matters more than count** — a 5.0 built on reviews that are all three years old is a different conversation from a 5.0 that is still accumulating.
- **Their own website.** Read the nav. It tells you what lines of business they actually run, whether they are hiring, and whether they publish pricing. Providers routinely run a second business we have no record of.
- **Their own marketing assets** (profile images are often flyers). These carry service area, hours, positioning and taglines in their own words — facts we otherwise ask for and get wrong.

**Cross-check the facts against each other and report every disagreement.** Address, phone, hours, service area and business name diverging across Olera / Google / their flyer is normal, and each divergence is either a thing to fix or a thing to ask. Never silently pick one.

## Phase 3 — Read the history as a story

Pull the actual sequence, not the counts: `provider_activity` for their own logins, edits, question answers and dashboard visits; `email_log` for what we sent and what they opened and clicked; `provider_touches` / `family_touches` for whether a human has ever spoken to them.

What to look for:

- **The turn.** Most providers ignore us for months and then engage over a few days. Find that week and name it — it is the most persuasive thing you can say, because it is about them.
- **Speed.** How fast did they answer a family question? Seconds and minutes are worth quoting back.
- **What they built.** Which profile sections they edited, and when. Someone who filled seven sections in one sitting is telling you something.
- **What we owe them.** Unanswered questions, undelivered leads, emails we promised and never sent, stale pipeline stages.
- **What they have never used.** Review requests, Find Families, the market view. An unused feature they plainly need is the strongest offer available, because it costs them nothing and we can turn it on.

## Phase 4 — Write the script

Structure, in this order:

1. **Open on what is happening, never on what failed.** Lead with the live thing, the recent thing, the thing they did. `dont_lead_with_the_deficit` applies to calls exactly as it does to copy. "Your campaign has been running since the 11th" opens; "you've had zero leads" does not.
2. **Then hand them the floor, before you report anything.** One broad question about their own business — how it started, how it's going, what they're working on — and then stop talking. Do this even when the profile, the website and the flyer have already told you the care type. Two reasons, and neither is manners. **Everything we hold is a record of behaviour inside our product**: it cannot tell you capacity, whether they are taking clients this month, which of their businesses is the real one, or what they are short on — and we are usually about to spend money on their behalf against exactly those unknowns. And their own phrasing is better ad copy than ours, because so far every word written for them was written by us.

   The line between this and interrogation is what the question is *for*. "Tell me about the business" gives them room. "What services do you offer, what's your service area, what are your hours" is data collection for facts we already hold, and that is what rule 5 below forbids. Same sentence shape, opposite move. Log what they say — it is the most valuable thing the call produces.
3. **Earn the right to advise by proving you looked.** One or two specifics only they could have done. This is the whole difference between a cold call and this call.
4. **Name the one thing that should happen next**, and why it follows from what they did. One. Not a menu.
5. **Ask at most two further questions, and make them count.** TJ's rule: people come to us to take the burden off them, not to be interrogated. A question we could have answered from our own data is a tell that we did not look.
6. **Ask which problem is harder, at the very end.** One question, after the work is visibly done: *"which one's the harder problem right now, finding clients or finding caregivers?"* Ask for the **harder one** — a "staffing or clients?" binary gets "both" from every agency in this industry and teaches us nothing. Position is what makes it safe: at minute two it is a sales probe, at minute twenty after you have fixed their page it is someone who helped them being interested. Never ask "what problems are you having" — everyone hears the pitch loading, and the page questions in rule 3 surface the same answers honestly.

   **Route the answer, and do not promise past our footprint.** MedJobs places caregivers near four active campuses only — Arizona State, Ohio State, Utah, Wisconsin-Madison — so outside AZ and OH the honest reply is "not something we cover in your area yet, but I'm writing it down." Check `student_outreach_campuses` where `is_active` before treating it as an offer; the answer is a demand signal for where MedJobs opens next, which is worth collecting everywhere.
7. **Book the next conversation before hanging up**, with a real agenda and a date. Two weeks out is the default for anyone with a live campaign, because there will be actual numbers by then: *"let's put fifteen minutes in the diary and I'll walk you through what your ads did."* Put it in the calendar **on the call** — offering to send times later is the same failure mode as asking for photos by email. This is what turns one call into a relationship, and it means the next conversation opens on their results rather than another ask.
8. **Say what we will do**, with a date. The call should end with our obligation, not theirs.

Also produce: **what to listen for** (the answers that would change the plan), **what not to say** (claims our data does not support, and any live conflict they could catch us on), and **what to log afterwards** — write it to `provider_touches` / `family_touches` with `/touch`.

## Discipline

- **Never state a number the data does not carry.** If a figure is unverified, say so in the script itself so the caller does not assert it.
- **Distinguish what we measured from what we can see.** Campaign-attributed counts are not the same as everything that happened; say "at least" when the tag may be undercounting.
- **Do not promise anything not yet built.** Check the feature exists before it becomes an offer.
- **Flag anything the person could contradict on the call** — a wrong address in their profile, a stale pipeline stage, an email we said we'd send. Better that the caller knows first.
- Keep the whole script on one screen. A caller cannot read an essay while dialling.
