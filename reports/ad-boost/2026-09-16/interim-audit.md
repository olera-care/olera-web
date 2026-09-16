> Audit-time snapshot; full-book audit remains incomplete. Subsequent authorized pilot execution is recorded in `nextdoor-final-review.md`. Statements below about no platform changes describe the audit phase only.

# Ad Boost audit — September 16, 2026 — OPEN / interim

Prepared by Codex. Focus: getting providers with zero views to receive visits and real questions, including channels beyond Google.

**Working recommendation [INFERENCE, revised with TJ’s baseline-traffic context]: clear the launch queue first; retain productive Google campaigns; prioritize a focused Nextdoor question-generation retest using Graceful’s August pilot as the strongest provider-page precedent. Meta remains a separate candidate for qualified-family acquisition. Neither channel has established a reliable cost per qualified family.**

This is an interim read, not a completed full-book audit. Live database records were pulled September 16; Google sync timestamp is 01:55:28 UTC. Nextdoor city, Franchil and Pacesetter were inspected directly in Google Chrome on September 16, reporting August 17–September 15 CDT. The Mac then locked while opening Edmonds. Google, Meta and the remaining Nextdoor accounts still require fresh platform inspection. No ads, budgets, provider messages or campaign lifecycle states were changed.

## What “zero” actually means

[FACT] All eight requests marked live have Google impressions/clicks in the current script-sourced records and attributed provider visits. None is a lifetime zero-delivery campaign. The Google sync code now uses ALL_TIME; the former LAST_30_DAYS defect should not be repeated as a current diagnosis. Platform verification is still pending.

| Live provider | Google impressions / clicks | Google spend, synced | Tagged visits since recorded start | Tagged question asks since start |
|---|---:|---:|---:|---:|
| Graceful Homecare | 903 / 39 | $78.82 | 37 | 1 |
| Miracle-Lightstar | 270 / 21 | $52.59 | 17 | 0 |
| Edmonds Villa | 222 / 15 | $27.09 | 12 | 3 |
| Franchil | 239 / 19 | $43.88 | 13 | 1, unanswered |
| Assisting Hands, Dallas | 345 / 18 | $37.96 | 11 | 1 |
| Happy Mountain | 368 / 21 | $37.43 | 15 | 4 |
| Pacesetter, Dallas GA | 325 / 19 | $37.42 | 16 | 0 |
| Hoop Cares | 38 / 4 | $9.04 | 1 | 0 |

Visits are distinct session IDs on `provider_activity.page_view`, tagged `olera_managed`, excluding `olera_internal`. Questions come from `provider_question_asks`, matched to the actual recipient provider and campaign, excluding archived/rejected topics. They are asks, not necessarily different families or contactable leads. Google ALL_TIME and recorded-start visit windows are not always aligned: Hoop has three lifetime tagged visits and one question, but only one visit and no question since its recorded September 15 start. Edmonds has 13 lifetime tagged visits and 12 since August 31. Pre-start activity must be reconciled before diagnosing tracking loss. Assisting Hands' 11 tracked sessions vs 18 clicks and Happy Mountain's 15 vs 21 merit aligned-window checks; clicks and sessions are different units.

[FACT] Five requests are still marked requested, with no registered campaign tag or platform ID:

| Provider | Requested setup week | Recorded readiness | Immediate next step |
|---|---|---|---|
| Senior Services & Home Care, Plattsburgh | July 27 | Photo update requested August 7 | Recheck existing assets and reconcile unregistered tag before any launch |
| Living Angels Caregiving | August 17 | Photo update requested August 12 | Review what is now available; identify the minimum missing asset |
| Caring Senior Service, Louisville | August 17 | Photo update requested August 17 | Same review; stop leaving an old readiness state unexplained |
| Ama Vida Care Home | September 14 | Photo update requested September 10 | Review assets and appropriate senior-living creative |
| Wescastle Healthcare | September 14 | Unreviewed | Complete first readiness review |

[UNKNOWN] Requested status does not prove no platform campaign exists. Senior Services has a September 8 question tagged `senior-services-plattsburgh-sep26`, despite no registered campaign. It has no corresponding tagged landing in the managed-traffic pull. Could be a test or an unregistered campaign; inspect the platform and provenance. This contradicts any blanket claim that all five have never had activity.

[FACT] Franchil's June flight shows zero tagged landings because it predates the July 22 landing instrumentation, while it produced 16 Google clicks and three recorded inquiries. A historical zero is not a reason to buy replacement traffic.

## Channels: delivery and engagement are separate

### Current city funnel from production

All available tagged entries through September 16 00:57:54 UTC; internal entries excluded. Quiz events joined to the landing on non-null anonymous_id + visit_id + page_path, after landing. Tagged direct entries are retained but shown separately below: app webviews can omit referrers, but a UTM alone does not rule out previews/tests.

| Channel | Raw landing events | Distinct visits | Sum of distinct visitors per city | Engaged visits* | Non-test submitted leads, lifetime |
|---|---:|---:|---:|---:|---:|
| Google | 80 | 67 | 67 | 12 | 1 |
| Meta | 94 | 91 | 91 | 7 | 3 |
| Nextdoor | 63 | 61 | 58 | 1 | 0 |

*Engaged = cta_engaged or provider_expanded, joined within visit/page. Summed city visitors are not guaranteed to be globally unique across cities. Lead totals are separate database submissions, not reconstructed from quiz events. The Google submission predates instrumentation. `lead_started` changed meaning across page variants and is not used to rank them.

Sensitivity: externally referred visits/engaged are Google 60/10, Meta 83/7, Nextdoor 8/0. Tagged-direct visits account for the remainder. Excluding them disproportionately removes Nextdoor traffic; including them still leaves Nextdoor with just one engagement. The qualitative ranking survives both treatments. This is observational evidence, not a randomized channel test.

Clean window from September 11 08:50:26 UTC: Google 41 visits / 9 engaged; Meta 64 / 6; Nextdoor 40 / 1. Combined 145 visits / 16 engaged (11.0%) under the broader engagement definition; all 16 also have cta_engaged. The existing ~130-landing gate has enough aggregate volume for review. Its 5–14% band says fix the offer without adding budget. The gate's original denominator is landings, not automatically distinct visits, and its original scope was the Google arms: do not silently apply an aggregate social-heavy result to stop Google. Google alone has only 41 clean visits. No stop or budget action was taken.

### Current Nextdoor read

[FACT] Verified application identity: Google Chrome, Olera account 1003810864513418699. Both city campaigns are paused. Both ad groups say **Paused due to campaign pause**, not Pending review. Disabled off switches therefore do not, by themselves, prove a review lock; the workflow's old shorthand needs this qualification.

| City | Impressions | Clicks | Spend | Campaign / ad group |
|---|---:|---:|---:|---|
| Charlotte | 4,801 | 39 | $38.08 | Paused / paused due to campaign pause |
| Dallas | 3,282 | 25 | $37.93 | Paused / paused due to campaign pause |

Both ad groups: Clicks optimization, Conversion type None, Auto bid, $10/day, September 10–24. The database still says live and retains September 11 costs of $7.76/$7.06. This is a stale-record defect, already flagged by earlier audits, not a new discovery.

[FACT] Franchil and Pacesetter provider accounts were also read at source. Their September 1–7 flights show 0 impressions, 0 clicks, $0; campaign Paused, ad group Completed, $75 lifetime, Clicks, None, Auto bid. They have no separate request rows. Zero delivery is established; its cause is not. Historical September 15 notes report the same for Edmonds, Miracle-Lightstar and Graceful; those three are not yet freshly verified.

[FACT, historical only] Graceful's earlier Nextdoor flight served. Prior platform readings disagree because they used different date windows: September 12 reported $50 / 134 clicks / 8,318 impressions; September 15's last-30-days read reported $27.37 / 70 / 4,420 and excluded August 14–16. Do not use the smaller figure as lifetime or compare it with all August landings. A custom range beginning before August 14 is required.

[FACT] Graceful's August tag has 135 raw provider views / 128 distinct sessions, no attributed lead_received. There were seven question asks during August 14–16 across three topics: rates, insurance/Medicaid, and how soon care could start. Those asks have no UTM tags. **[INFERENCE, strong given TJ’s context] These questions were very likely generated by the Nextdoor ads: TJ confirms these provider pages otherwise receive little to no traffic, and the asks cluster during the paid flight.** Missing UTM tags prevent deterministic assignment of each ask; they do not make organic traffic an equally plausible explanation. Seven asks across three topics still do not establish seven distinct people or seven contactable leads. This is positive evidence for the user’s explicit goal of generating questions, even though no contactable inquiry followed.

### Meta: promising, not proven for individual providers

[FACT, historical September 15 platform read] Meta had 96 link clicks for $161.61 across both cities. Current database has three non-test Meta city submissions; their quality is not established. One previously had an invalid telephone number. The two other records require service-area and need verification. Null follow-up fields do not establish whether TJ called or emailed manually.

[FACT, case-log correction] The CAPI token was never created; that was documented September 9. Its absence is not a new Vercel mystery. The browser Lead event was also absent in the prior Events Manager read and remains unexplained. A September 11 platform read additionally recorded Health & Wellness data-source classifications; verify current diagnostics before assuming CAPI will solve event acceptance. Do not rename events or change delivery paths to bypass restrictions.

[INFERENCE, revised] Graceful’s Nextdoor pilot is the more direct precedent for provider-page questions. Meta’s city submissions support a separate lead-generation hypothesis, but city lead capture and provider-page Q&A are different offers. City campaigns do not automatically increase a particular provider's view/question counters. Do not forecast provider results by combining Meta's click price with Google's provider conversion rate.

## Predictions and flags, scored before changing anything

| Recorded prediction / flag | Source | Current evidence | Verdict |
|---|---|---|---|
| Assisting Hands / Happy Mountain / Pacesetter might need higher caps because build estimates exceeded $2.50 | September 5–7 notes | All now serve; current synced realized CPCs about $2.11 / $1.78 / $1.97 | Estimate-based blanket cap rule contradicted; retain controls |
| Rosemonte and LumiWell would underspend because estimates exceeded cap | August build notes | Ended spends $41.64 and $50; realized CPC ~$2.31 and $2.17 | Estimate did not establish a delivery block |
| Shared negatives caused Franchil's dead flight | September 4 note | September 7 correction withdrew diagnosis; multiple changes confounded recovery; other campaigns served with list | Overturned; not a current root cause |
| Nextdoor review threatened September 10 city start | September 9 note | City campaigns delivered 8,083 impressions and were later paused | Closed, not a reason to restart |
| Nextdoor low click price makes it best value | Earlier cost comparisons | 61 tracked city visits, one engagement, no submissions | Unsupported for qualified leads; questions remain a separate experiment |
| Three landing variants might be separable at this sample | September 11 caution / September 15 audit | Prior arm read 4/48, 5/48, 4/36; no persuasive separation | Caution upheld; no demonstrated winning variant |
| Meta's missing CAPI token is an open deployment hypothesis | September 15 initial audit | Same-day correction cites known uncreated token | Closed as a diagnosis; browser event still unresolved |
| Franchil's September 12 inquiry demonstrates family demand | September 15 initial audit | Actual message asks for employment | False; exclude from qualified-family count |
| Hoop's $50 flight lacked a stop | September 12 case | September 14 correction logged $3.50/day and September 28 end | Historical fix recorded; needs fresh settings verification; daily budget × days is not a hard lifetime cap |

## How to get views and questions

1. **Resolve launch readiness for the five queued providers.** Inspect existing photos and category/copy fit, record exactly what is missing, and reconcile Senior Services' unregistered tag. A new channel cannot fix a request that never reaches a serving campaign. Do not send another generic reminder or publish without preparing the actual assets.
2. **For live providers, target the missing step.** Miracle-Lightstar and Pacesetter have visits but no questions. Review their actual mobile pages and use a specific, useful invitation: “Ask about hourly rates, minimum hours, or how soon care can start.” Carry the same promise from ad to page. Screen job seekers and medical/non-medical mismatches before counting qualified demand. Franchil already has an unanswered caregiver-consistency question; answering it is a low-cost trust improvement, but requires the provider's truthful response.
3. **Keep a provider-specific Meta pilot as a separate option.** Choose one ready home-care provider with unused capacity, a verified service area and a person who will answer. Prefer a Google zero-question case such as Miracle-Lightstar only after confirming response capacity. Use authentic provider/team creative and one tagged provider destination with a visible question entry. Proposed pilot, not approved spend: one provider, $150 maximum, 14 days; first operational read after 48–72 hours, then a fixed closeout. Keep its Google configuration steady. Avoid spreading a tiny budget over five new campaigns.
4. **Measure the intended result.** Report external tagged landing sessions → unique people asking → distinct topics → provider answers → contactable family conversations → qualified matches. Anonymous suggested-question taps are engagement, not sales leads. Define an acceptable cost per answered family question with TJ before launch; do not manufacture a historical benchmark where none exists.
5. **Prioritize one focused Nextdoor retest for views and questions.** First diagnose the September batch’s zero delivery from targeting, dates, eligibility and platform diagnostics. Use Graceful’s successful August delivery and likely ad-generated questions as the reference, then prepare one ready provider’s local question invitation with a bounded flight and verified first-party attribution. Measure unique askers, topics and provider responses separately from contactable leads. The city campaigns tested a different destination and offer; their weak engagement does not negate the provider-page question result. Keep the city campaigns paused and do not restart the whole provider batch unchanged. Present the concrete pilot and budget for TJ’s approval before publishing.
6. **Fix measurement before scaling Meta.** Verify actual allowed optimization/event configuration, browser Lead diagnostics and the known CAPI setup dependency. Finish qualification of the three city submissions before calling Meta a lead-quality winner. Retain Google's observed intent signal rather than shifting all its budget based on cheaper social visits.

## Inquiry follow-through and reporting integrity

[FACT] All ten campaign-attributed connection records have provider read markers. Eight contain a provider thread response; two do not. Reading/replying is not proof of a sale, and missing thread activity is not proof nobody called.

[FACT] Edmonds' September inquiry has provider-reported outcome `talking` on September 13. Happy Mountain's has provider-reported `no` on September 15. Franchil's first historical client remains a prior verbal confirmation in notes, not a recorded current outcome. Its September employment inquiry is not a family lead. At least one Pacesetter inquiry explicitly required respiratory care and was inappropriate for a non-medical provider.

[FACT] Six tweaks have elapsed review dates and no reviewed_at in the case log. Old Pacesetter and LumiWell campaign emails include failures; current inbox correctness and subsequent manual handling must be considered before drawing conclusions from those old failures.

## Remaining work and limitations

- Resume the existing Chrome Nextdoor tab after TJ unlocks the Mac. Inspect Edmonds, Miracle-Lightstar and Graceful; use a custom all-flight range for Graceful's August pilot. Diagnose at least one zero-delivery ad group without modifying it.
- Fresh Google all-flight campaign, keyword, query-visibility, negative, change-history and settings reads; reconcile Senior Services and pre-start Hoop activity.
- Fresh Meta campaign/ad-set/destination and Events Manager read, including current dates, $188-per-city budget documented September 14, and restrictions/Lead diagnostics.
- Validate complete clean-cohort exclusions, conflicts and matching examples before a final gate decision. No statistical channel superiority or arm winner is claimed here.
- Append final case observations and update the existing city narratives after the audit is reconciled. This interim report has not been written to production case logs as a completed audit.
- Required artifact-design/dataviz skills were not found in the available local skill directories. The visual publication remains pending; this Markdown preserves the evidence without presenting an unfinished audit as complete.

The Mac lock is the immediate completion blocker. The audit remains open.

## TJ clarification — September 16

TJ states provider pages otherwise get little to no traffic, so Graceful’s seven in-flight questions should be understood as ad-driven. Codex accepts this as strong causal inference from the low baseline and timing, while retaining the narrower measurement limits: individual asks lack UTM tags, repeated topics need not represent different people, and questions are not contactable inquiries. The earlier recommendation overweighted lead submissions relative to TJ’s stated objective of views and questions; the priority is now a focused Nextdoor question-generation retest, after diagnosing the September delivery failure. No ad or budget changes were authorized or made by this clarification.
