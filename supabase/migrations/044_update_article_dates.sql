-- Update 4 Texas articles: published_at → Mar 21 2026, updated_at → Apr 21 2026
UPDATE content_articles
SET
  published_at = '2026-03-21T10:00:00+00:00',
  updated_at = '2026-04-21T10:00:00+00:00'
WHERE slug IN (
  'how-to-get-paid-as-a-caregiver-in-texas',
  'star-plus-waiver-texas-complete-guide',
  'texas-medicaid-eligibility-seniors-2026',
  'how-to-pay-for-senior-care-in-texas'
);
