-- Migration: Add new engagement event types to provider_activity
-- contact_revealed: provider copied email/phone from lead detail
-- one_click_access: provider used otk token for auto-sign-in
-- question_received: legacy compat (already tracked)

ALTER TABLE provider_activity
  DROP CONSTRAINT IF EXISTS provider_activity_event_type_check;

ALTER TABLE provider_activity
  ADD CONSTRAINT provider_activity_event_type_check
  CHECK (event_type IN (
    'email_click',
    'page_view',
    'lead_opened',
    'question_received',
    'question_responded',
    'review_viewed',
    'contact_revealed',
    'one_click_access'
  ));
