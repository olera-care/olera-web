-- Migration: Ad Boost photo-readiness review + provider follow-up
--
-- Profile completeness currently counts gallery URLs, not whether those images
-- are useful campaign landing-page creative. A provider can therefore clear
-- the 70% profile gate with blurry text graphics or logos. These fields keep
-- creative review separate from campaign lifecycle status and give the
-- concierge/provider journey an auditable, idempotent closed loop.
--
-- Apply via Supabase dashboard before deploying the app code: Ad Boost SELECTs
-- name these columns directly.

ALTER TABLE ad_campaign_requests
  ADD COLUMN IF NOT EXISTS photo_readiness_status TEXT NOT NULL DEFAULT 'unreviewed';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ad_campaign_requests_photo_readiness_status_check'
  ) THEN
    ALTER TABLE ad_campaign_requests
      ADD CONSTRAINT ad_campaign_requests_photo_readiness_status_check
      CHECK (
        photo_readiness_status IN (
          'unreviewed',
          'update_requested',
          'review_requested',
          'ready'
        )
      );
  END IF;
END $$;

ALTER TABLE ad_campaign_requests
  ADD COLUMN IF NOT EXISTS photo_review_note TEXT,
  ADD COLUMN IF NOT EXISTS photo_reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS photo_reviewed_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS photo_update_requested_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS photo_update_submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS photo_nudge_email_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS photo_reminder_email_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS photo_ready_email_sent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_ad_campaign_requests_photo_readiness
  ON ad_campaign_requests(photo_readiness_status)
  WHERE deleted_at IS NULL AND status IN ('requested', 'scheduled');

COMMENT ON COLUMN ad_campaign_requests.photo_readiness_status IS
'Human-reviewed Ad Boost landing-page photo gate: unreviewed | update_requested | review_requested | ready. Separate from profile completeness and campaign lifecycle status.';

COMMENT ON COLUMN ad_campaign_requests.photo_review_note IS
'Internal concierge note explaining the latest photo-readiness decision. Provider emails use fixed supportive copy, never this free text.';

COMMENT ON COLUMN ad_campaign_requests.photo_update_requested_at IS
'When the concierge most recently asked the provider for stronger campaign photos. Starts that review cycle''s one-reminder clock.';

COMMENT ON COLUMN ad_campaign_requests.photo_update_submitted_at IS
'When the provider saved gallery changes after an update request, moving the campaign to review_requested.';

COMMENT ON COLUMN ad_campaign_requests.photo_nudge_email_sent_at IS
'Idempotency marker for the first Ad Boost photo-update email.';

COMMENT ON COLUMN ad_campaign_requests.photo_reminder_email_sent_at IS
'Idempotency marker for the one photo-update reminder after three business days.';

COMMENT ON COLUMN ad_campaign_requests.photo_ready_email_sent_at IS
'Idempotency marker for the resolution email sent after requested photos are approved.';
