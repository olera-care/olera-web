-- Migration: contact-channel tracking on business_profiles for the V3 SBF flow
--
-- Context: V3's contact step lets the user pick email or SMS. We need to track
-- (a) which channel they prefer for follow-up sends, and (b) whether the
-- chosen channel is still deliverable, so we can:
--   1. Stop sending to bouncing/opted-out destinations (Twilio cost; sender
--      reputation on Resend).
--   2. Surface clean vs dirty leads in admin/analytics.
--   3. Flip the active channel server-side if one fails.
--
-- The `phone` column already exists from migration 001 — not re-added.
--
-- Allowed values:
--   email_validity:
--     'unverified' — never sent (default for existing rows)
--     'delivered'  — at least one successful Resend delivery
--     'bounced'    — hard or soft bounce reported by Resend
--     'complained' — spam complaint reported by Resend
--   phone_validity:
--     'unverified' — never sent (default for existing rows)
--     'delivered'  — Twilio confirmed delivery
--     'failed'     — generic Twilio failure (network, invalid number)
--     'opted_out'  — Twilio error 21610 (recipient texted STOP)
--   preferred_contact_channel:
--     'email' (default) | 'sms'
--
-- Apply via Supabase dashboard (NOT CLI).

ALTER TABLE business_profiles
  ADD COLUMN IF NOT EXISTS email_validity TEXT
    CHECK (email_validity IN ('unverified', 'delivered', 'bounced', 'complained'))
    DEFAULT 'unverified';

ALTER TABLE business_profiles
  ADD COLUMN IF NOT EXISTS phone_validity TEXT
    CHECK (phone_validity IN ('unverified', 'delivered', 'failed', 'opted_out'))
    DEFAULT 'unverified';

ALTER TABLE business_profiles
  ADD COLUMN IF NOT EXISTS preferred_contact_channel TEXT
    CHECK (preferred_contact_channel IN ('email', 'sms'))
    DEFAULT 'email';

-- Backfill: existing rows get 'unverified' / 'unverified' / 'email' via the
-- DEFAULTs above. No additional UPDATE needed.

-- Index for the bounce-flagging path: when a Resend webhook arrives, we look
-- up profiles by email + type='family' to flag email_validity. Existing index
-- on email may not exist; add a partial one scoped to family profiles which is
-- the only type the SBF creates.
CREATE INDEX IF NOT EXISTS idx_business_profiles_family_email
  ON business_profiles (email)
  WHERE type = 'family';
