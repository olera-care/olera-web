-- Seed: the Franchil Killeen case, backfilled
--
-- The first case written into ad_campaign_log, and the one that motivated the table.
-- Franchil ran twice in the same city: flight 1 (Google campaign 23961292547, June)
-- produced 3 inquiries at ~$12 each on 124 impressions — the best result in the
-- program's history. Flight 2 (24166094865, August) was rebuilt from scratch and
-- served 1 impression in 12 days.
--
-- Backfilled 2026-09-04, so occurred_at is the real date and created_at is now.
-- Author is recorded as 'claude (backfill)' rather than pretending these were
-- written at the time.
--
-- Apply via Supabase dashboard (NOT CLI), per project convention. Run AFTER 202.

INSERT INTO ad_campaign_log
  (request_id, google_campaign_id, campaign_tag, entry_type, summary, detail,
   before_state, after_state, expected_signal, review_after, occurred_at, author)
VALUES

-- ── Flight 1: 22 Jun – 5 Jul 2026 ────────────────────────────────────────────
('77d221c8-3c35-494c-bf4f-2155c53736d4', '23961292547', 'franchil-killeen-jun26',
 'setup',
 'Flight 1 built. $50 total over 14 days, 21 phrase-match keywords, no negatives.',
 E'First campaign in the Ad Boost program.\n\nMaximize Clicks with a $2.50 max CPC cap. Google Search only. Killeen TX +20mi Presence. English + Spanish. AI Max off. One ad group, one responsive search ad.\n\nNo negative keywords of any kind — the shared list did not exist yet. This turns out to matter more than anything else in the case.',
 NULL,
 '{"budget_per_day": 3.57, "budget_total": 50, "flight_days": 14, "keywords": 21, "negatives": 0, "max_cpc": 2.50}'::jsonb,
 NULL, NULL, '2026-06-22T12:00:00Z', 'claude (backfill)'),

('77d221c8-3c35-494c-bf4f-2155c53736d4', '23961292547', 'franchil-killeen-jun26',
 'outcome',
 'Flight 1 closed: 124 impressions, 16 clicks, 3 inquiries at ~$12 each. Best in program history.',
 E'12.90% CTR — the highest ever recorded in this account. $36.50 of $50 spent, avg CPC $2.28. 74.75% of impression share lost to rank, only 4.48% to budget.\n\nGoogle recorded ZERO conversions. All three inquiries were captured by Olera''s UTM attribution only.\n\nAll 16 clicks came from five keywords: "senior care killeen" (53 impr, 5 clicks), "home care killeen" (17 impr, 5 clicks, 29.41% CTR), "caregiver killeen tx" (20 impr, 4 clicks), "home care copperas cove" (11 impr, 1 click), "in home care killeen tx" (9 impr, 1 click). The four generic non-geo keywords produced 6 impressions and zero clicks between them.\n\nWHAT THE TRAFFIC ACTUALLY WAS: 22 named search terms, overwhelmingly facility-seeking and competitor-brand rather than in-home-care intent. rosewood villas killeen (an assisted living community, 2 clicks), visiting angels killeen tx (competitor, 1 click), memory care killeen tx (1 click), assisted living killeen tx, nursing homes killeen, senior living killeen, home health care killeen tx, at home instead senior care, cornerstone caregiving killeen, elara caring temple tx, killeen retirement homes.\n\nPERMANENTLY OPEN: 12 of the 16 clicks sit in Google''s unnamed "Other search terms" aggregate. All 3 conversions came from those. We do not know and cannot know which query produced the best advertising result Olera has ever had.',
 NULL,
 '{"impressions": 124, "clicks": 16, "ctr": 0.1290, "cost": 36.50, "avg_cpc": 2.28, "inquiries": 3, "cost_per_inquiry": 12.17, "google_conversions": 0, "lost_is_rank": 0.7475, "lost_is_budget": 0.0448}'::jsonb,
 NULL, NULL, '2026-07-05T12:00:00Z', 'claude (backfill)'),

('77d221c8-3c35-494c-bf4f-2155c53736d4', '23961292547', 'franchil-killeen-jun26',
 'provider_comms',
 'Wrap-up email sent with the outcome question. Never answered.',
 'No outcome was ever recorded in the system for this flight. A verbal claim of one client was made by the provider during a later audit; it is undocumented, and this provider''s claims have been found inaccurate on a separate matter.',
 NULL, NULL, NULL, NULL, '2026-07-08T12:00:00Z', 'claude (backfill)'),

-- ── Flight 2: 23 Aug 2026 – 21 Nov 2026 ──────────────────────────────────────
('f3ff5374-5c90-4f71-b69c-4fe82a172812', '24166094865', 'franchil-killeen-90d-aug26',
 'setup',
 'Flight 2 built as a NEW campaign, not a revival. Keywords rebuilt from scratch; none carried over by performance.',
 E'Budget structure changed from $50-total over 14 days to $1.67/day over 90 days. Keywords 21 → 16, rebuilt rather than carried forward.\n\nAt 11:03 CT, three minutes after the build, the shared 98-term negative keyword list was applied.\n\nNo hypothesis was recorded, and no check was made against flight 1''s keyword performance. That omission is the defect this whole case exists to document.',
 '{"keywords": 21, "budget_per_day": 3.57, "negatives": 0}'::jsonb,
 '{"keywords": 16, "budget_per_day": 1.67, "flight_days": 90, "negatives": 98, "negatives_source": "shared list 12134249254"}'::jsonb,
 NULL, NULL, '2026-08-23T16:00:00Z', 'claude (backfill)'),

('f3ff5374-5c90-4f71-b69c-4fe82a172812', '24166094865', 'franchil-killeen-90d-aug26',
 'provider_comms',
 'Launch email sent telling the provider the campaign had launched. The claim was false for 12 days and is still uncorrected.',
 NULL, NULL, NULL, NULL, NULL, '2026-08-23T18:00:00Z', 'claude (backfill)'),

('f3ff5374-5c90-4f71-b69c-4fe82a172812', '24166094865', 'franchil-killeen-90d-aug26',
 'observation',
 'Zero impressions in 11 days. Everything on our side checks out.',
 E'Campaign Enabled, start date passed, 7 of 10 visible keywords Eligible, ad Eligible, all 10 responsive-search-ad assets Eligible with no policy issue, tracking URL correct, account billing fine (the same account spent $273.15 in the same window).\n\nA stale campaign-level chip reads "All ads under review" while every entity beneath it reads Eligible. Which layer Google treats as authoritative is unknown.',
 NULL,
 '{"impressions": 0, "clicks": 0, "cost": 0, "days_live": 11}'::jsonb,
 NULL, NULL, '2026-09-03T20:00:00Z', 'claude (backfill)'),

('f3ff5374-5c90-4f71-b69c-4fe82a172812', '24166094865', 'franchil-killeen-90d-aug26',
 'observation',
 'Root cause: the negative list removed the query pool. Three other explanations tried and discarded first.',
 E'DISCARDED — "no market in Killeen". Keyword Planner shows 10 searches/month for "in home care" in Killeen city, but flight 1 served 124 impressions in the same city. The Planner figure describes flight 2''s narrow keywords, not flight 1''s reach.\n\nDISCARDED — "budget too low". Graceful Homecare runs the identical $1.67/day in Concord NC and serves 184 impressions and 15 clicks.\n\nDISCARDED — "the rebuild deleted the winning keywords". Partially true, but "senior care killeen" — flight 1''s best keyword at 53 impressions and 5 clicks — IS present in flight 2, Eligible, with zero impressions. The winner survived and still produced nothing.\n\nHOLDS — the negative list removed the query pool. "senior care killeen" is phrase match; Google matched it via close variants onto assisted living, senior living, nursing homes, retirement homes and memory care queries. The 98-term list blocks all of those categories. The keyword is eligible with nothing left to match.\n\nPROOF flight 1 ran with no negatives: it served on assisted living killeen tx, memory care killeen tx, nursing homes killeen, visiting angels killeen tx, elara caring temple tx and cornerstone caregiving killeen. Every one is blocked by the list today. Those impressions could not have occurred if the list were active. 19 of flight 1''s 57 named impressions and 2 of its 4 named clicks would be blocked now.\n\nTHE UNCOMFORTABLE IMPLICATION: our own HomeWell audit examined this exact traffic pattern, called it "wrong-category or competitor", and the 98-term list was built to eliminate it. We may have negated the traffic that was converting, on the assumption it was junk, without ever testing whether it converted.\n\nCOUNTER-EVIDENCE, kept deliberately: HomeWell produced zero inquiries in its July flight BEFORE it had any negatives, so negatives are not necessary for failure. And Graceful runs the full list and still serves. The list is not a universal blocker — it interacts with how broad each campaign''s keywords are.',
 NULL, NULL, NULL, NULL, '2026-09-04T14:00:00Z', 'claude (backfill)'),

('f3ff5374-5c90-4f71-b69c-4fe82a172812', '24166094865', 'franchil-killeen-90d-aug26',
 'tweak',
 'Restored flight 1''s five earning keywords. 16 → 20 keywords.',
 E'Added as phrase match: "home care killeen" (flight 1: 17 impr, 5 clicks, 29.41% CTR), "caregiver killeen tx" (20 impr, 4 clicks), "home care copperas cove" (11 impr, 1 click), "in home care killeen tx" (9 impr, 1 click). "senior care killeen" was already present.\n\nReason: three of flight 1''s earners had been reworded into low-volume variants and one was deleted outright. "senior care killeen" also exists as "senior home care killeen", which Google flags Low search volume. "caregiver killeen tx" had no replacement at all.',
 '{"keywords": 16}'::jsonb,
 '{"keywords": 20, "added": ["home care killeen", "caregiver killeen tx", "home care copperas cove", "in home care killeen tx"], "match_type": "phrase"}'::jsonb,
 'Impressions on the restored keywords, particularly "senior care killeen", within 72 hours.',
 '2026-09-07T12:00:00Z', '2026-09-04T18:00:00Z', 'claude (backfill)'),

('f3ff5374-5c90-4f71-b69c-4fe82a172812', '24166094865', 'franchil-killeen-90d-aug26',
 'tweak',
 'Detached the shared 98-term negative list; replaced with 21 jobseeker-only negatives.',
 E'Removed: shared list 12134249254 — ~55 competitor brands, ~19 care-category terms (assisted living, memory care, nursing home, home health care, independent living, retirement community, skilled nursing, hospice, adult day care), ~22 jobseeker terms, and "free".\n\nAdded at campaign level, broad match: jobs, hiring, careers, employment, apply, application, resume, salary, wages, get paid, become a caregiver, caregiver positions, certification, classes, courses, training, volunteer, visa, sponsorship, foreigners, work from home.\n\nReason: restore the query pool flight 1 converted on, while still excluding traffic that is unambiguously not families seeking care.\n\nBLAST RADIUS VERIFIED CONTAINED: the shared list still exists with all 98 terms and now shows 9 campaigns using it, down from 10. Graceful, Miracle, LumiWell, Pacesetter and the rest are untouched. Graceful remains a clean control.',
 '{"negative_source": "shared list 12134249254", "negative_count": 98, "categories_blocked": true, "competitors_blocked": true}'::jsonb,
 '{"negative_source": "campaign-level", "negative_count": 21, "categories_blocked": false, "competitors_blocked": false, "jobseeker_blocked": true}'::jsonb,
 'Facility-type search terms reappearing: nursing homes, assisted living, memory care in Killeen.',
 '2026-09-07T12:00:00Z', '2026-09-04T18:05:00Z', 'claude (backfill)'),

('f3ff5374-5c90-4f71-b69c-4fe82a172812', '24166094865', 'franchil-killeen-90d-aug26',
 'tweak',
 'Budget raised $1.67/day → $3.57/day to match flight 1''s effective daily rate.',
 E'Flight 1 was $50 over 14 days, an effective $3.57/day. Google''s own estimate on the change: "Estimated 1 more click, $1.85 increase in cost."\n\nRequired a "Confirm it''s you" re-auth, completed by TJ. Post-auth verification confirmed nothing was wiped: 20 keywords intact, responsive search ad present with 11 headlines, final URL still carrying utm_source=olera_managed&utm_medium=paid_search&utm_campaign=franchil-killeen-90d-aug26. This check was run deliberately — a re-auth on this account on 10 August wiped 13 headlines, 4 descriptions and 13 keywords from another campaign.\n\nOPEN: at $3.57/day to the 21 Nov end date this campaign will spend roughly $278, against flight 1''s $50. Shortening the end date to ~18 Sep would make it a true 14-day replication and cap exposure. Not done — TJ''s call.',
 '{"budget_per_day": 1.67}'::jsonb,
 '{"budget_per_day": 3.57}'::jsonb,
 'Combined with the keyword and negative changes: impressions returning within 72 hours. If still zero, all three explanations were wrong and the remaining suspect is whatever also suppresses Miracle-Lightstar August.',
 '2026-09-07T12:00:00Z', '2026-09-04T18:10:00Z', 'claude (backfill)');
