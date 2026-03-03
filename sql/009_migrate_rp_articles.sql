-- Migrate the 18 Sanity-imported Research & Press articles
-- to section = 'research-and-press'

UPDATE content_articles
SET section = 'research-and-press'
WHERE slug IN (
  'aging-in-america-the-conversations-we-need-but-rarely-have',
  'aging-in-america-season-2-what-s-coming',
  'olera-s-q3-2023-update-a-season-of-significant-growth',
  'dr-logan-dubose-podcast-appearances-roundup',
  'the-origins-of-olera-sling-health',
  'olera-earns-third-place-at-the-prestigious-aggie-pitch-competition',
  'america-s-aging-care-system-is-broken-we-re-in-trouble-but-there-is-hope',
  'olera-enters-phase-2-of-the-cares-study-rethinking-aging-in-the-us',
  'why-americas-aging-care-system-is-broken-the-caregiving-crisis',
  'new-study-uncovering-the-real-challenges-faced-by-family-caregivers',
  'olera-featured-in-the-local-news-kbtx',
  'ceo-tj-falohun-to-represent-olera-at-gem-grad-lab',
  'olera-care-takes-aim-at-pay-per-lead-aggregators-with-ethical-alternative-for-senior-care-providers',
  'olera-s-innovation-in-senior-care-recognized-by-national-institute-on-aging-nia',
  'video-podcast-an-exclusive-conversation-with-olera-s-founder-and-ceo-tj-falohun',
  'inflation-and-labor-costs-increasing-for-senior-care',
  'co-founder-spotlight-olera-s-tj-falohun-in-questpress',
  'olera-receives-usd3m-grant-to-transform-senior-care-affordability'
);
