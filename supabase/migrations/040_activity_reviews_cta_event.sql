-- Migration: Add reviews_cta_clicked event type to provider_activity
-- Tracks when a provider clicks the "Get your first review" / "Get more reviews" CTA
-- on the onboard page profile preview

ALTER TABLE provider_activity DROP CONSTRAINT IF EXISTS provider_activity_event_type_check;
ALTER TABLE provider_activity ADD CONSTRAINT provider_activity_event_type_check
  CHECK (event_type IN (
    'email_click', 'page_view', 'lead_opened',
    'question_received', 'question_responded',
    'review_viewed', 'one_click_access', 'contact_revealed',
    'reviews_cta_clicked'
  ));
