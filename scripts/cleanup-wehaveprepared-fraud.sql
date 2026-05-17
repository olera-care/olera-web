-- ============================================================================
-- Cleanup: @wehaveprepared.com dual-profile fraud
-- ============================================================================
-- Context: Slack thread (Esther / TJ, 2026-05-16). Accounts on the
-- @wehaveprepared.com domain created family profiles, then exploited the
-- pre-April-7 gap to also claim provider listings under the same login.
--
-- Goal (TJ-approved scope — "Unclaim only, Esther's plan"):
--   1. DELETE the fraudulent FAMILY profiles.
--   2. UNCLAIM the fraudulent PROVIDER profiles (sever the claim, reset to
--      unclaimed/unverified) so real owners can claim — WITHOUT deleting
--      anything in `olera-providers` (the directory is never touched here).
--
-- Scope predicate: any account whose auth.users.email ends in
--   @wehaveprepared.com.  This covers the 23 dual-profile accounts Esther
--   counted PLUS 5 single-profile accounts on the same fraud domain.
--
-- Safety:
--   * Runs inside a transaction. Run STEP 1 (dry run, ends in ROLLBACK)
--     first, read the row counts, then run STEP 2 (ends in COMMIT).
--   * `olera-providers` is never referenced. The scraped directory is safe.
--   * `accounts.active_profile_id` is ON DELETE SET NULL; connections /
--     seeker_activity / provider_activity FKs are ON DELETE CASCADE/SET NULL,
--     so the family-profile delete cascades cleanly. The transaction rolls
--     back atomically if any RESTRICT FK is unexpectedly hit.
--   * Unclaim mirrors the admin API exactly
--     (app/api/admin/verification/[id]/route.ts:122 "unclaim").
--
-- Reversibility: unclaim is reversible (re-claim). The family-profile DELETE
--   is NOT — but these are inactive fraud placeholders with no real data.
-- ============================================================================


-- ============================================================================
-- STEP 0 — PREVIEW (read-only, safe to run anytime)
-- ============================================================================
-- 0a. Every wehaveprepared.com account and what it holds
SELECT u.email                                   AS auth_email,
       a.id                                      AS account_id,
       bp.id                                     AS profile_id,
       bp.type,
       bp.display_name,
       bp.claim_state,
       bp.verification_state,
       bp.source,
       bp.source_provider_id,
       bp.is_active
FROM   auth.users u
JOIN   accounts a          ON a.user_id = u.id
LEFT   JOIN business_profiles bp ON bp.account_id = a.id
WHERE  u.email ILIKE '%@wehaveprepared.com'
ORDER  BY u.email, bp.type;

-- 0b. Counts that the cleanup will affect
SELECT
  count(*) FILTER (WHERE bp.type =  'family')                       AS family_to_delete,
  count(*) FILTER (WHERE bp.type <> 'family')                       AS providers_to_unclaim,
  count(*) FILTER (WHERE bp.type <> 'family'
                     AND bp.source_provider_id IS NOT NULL)          AS providers_linked_to_directory,
  count(*) FILTER (WHERE bp.type <> 'family'
                     AND bp.verification_state = 'verified')         AS verified_providers_flag
FROM   auth.users u
JOIN   accounts a          ON a.user_id = u.id
JOIN   business_profiles bp ON bp.account_id = a.id
WHERE  u.email ILIKE '%@wehaveprepared.com';

-- 0c. ANOMALY TO EYEBALL before running: a verified, self-service provider on
--     the fraud domain (BrightStar Care). Unclaim is reversible, but confirm
--     this is fraud and not a real provider who somehow got a fraud-domain
--     login. Decide whether to keep the optional exclusion in STEP 2.
SELECT u.email, bp.id, bp.display_name, bp.source, bp.claim_state, bp.verification_state
FROM   auth.users u
JOIN   accounts a          ON a.user_id = u.id
JOIN   business_profiles bp ON bp.account_id = a.id
WHERE  u.email ILIKE '%@wehaveprepared.com'
  AND  bp.type <> 'family'
  AND  bp.verification_state = 'verified';


-- ============================================================================
-- STEP 1 — DRY RUN (does NOT persist — ends in ROLLBACK)
-- ============================================================================
-- Run this whole block. Read the NOTICE row counts. Nothing is saved.
BEGIN;

WITH fraud_accounts AS (
  SELECT a.id
  FROM   auth.users u
  JOIN   accounts a ON a.user_id = u.id
  WHERE  u.email ILIKE '%@wehaveprepared.com'
)
-- 1a. Delete family profiles
, deleted_family AS (
  DELETE FROM business_profiles bp
  USING  fraud_accounts fa
  WHERE  bp.account_id = fa.id
    AND  bp.type = 'family'
  RETURNING bp.id
)
-- 1b. Unclaim provider profiles
--     (Optional exclusion: keep the AND bp.verification_state <> 'verified'
--      line to spare the verified BrightStar row pending TJ's call. Remove
--      the line to unclaim it too.)
, unclaimed_providers AS (
  UPDATE business_profiles bp
  SET    account_id         = NULL,
         claim_state         = 'unclaimed',
         verification_state  = 'unverified',
         claim_trust_level   = NULL,
         claim_trust_reason  = NULL,
         metadata            = (COALESCE(bp.metadata, '{}'::jsonb)
                                  - 'verification_submission'
                                  - 'verification_attempts'
                                  - 'email_otp_attempt'
                                  - 'badge_approved'
                                  - 'badge_rejected'
                                  - 'verified_at'
                                  - 'verification_method'
                                  - 'auto_verified'
                                  - 'outreach_state'),
         updated_at          = now()
  FROM   fraud_accounts fa
  WHERE  bp.account_id = fa.id
    AND  bp.type <> 'family'
    -- AND  bp.verification_state <> 'verified'   -- <-- optional: spare BrightStar
  RETURNING bp.id
)
SELECT
  (SELECT count(*) FROM deleted_family)      AS family_deleted,
  (SELECT count(*) FROM unclaimed_providers) AS providers_unclaimed;

-- Belt-and-suspenders: clear any active_profile_id still pointing at a
-- fraud account's (now deleted/unclaimed) profile.
UPDATE accounts a
SET    active_profile_id = NULL
FROM   auth.users u
WHERE  a.user_id = u.id
  AND  u.email ILIKE '%@wehaveprepared.com';

ROLLBACK;   -- <<< DRY RUN: nothing is saved. Review the counts above.


-- ============================================================================
-- STEP 2 — APPLY (persists — ends in COMMIT)
-- ============================================================================
-- Only run this after STEP 1 counts look right. Identical to STEP 1 except
-- the final statement is COMMIT instead of ROLLBACK.
BEGIN;

WITH fraud_accounts AS (
  SELECT a.id
  FROM   auth.users u
  JOIN   accounts a ON a.user_id = u.id
  WHERE  u.email ILIKE '%@wehaveprepared.com'
)
, deleted_family AS (
  DELETE FROM business_profiles bp
  USING  fraud_accounts fa
  WHERE  bp.account_id = fa.id
    AND  bp.type = 'family'
  RETURNING bp.id
)
, unclaimed_providers AS (
  UPDATE business_profiles bp
  SET    account_id         = NULL,
         claim_state         = 'unclaimed',
         verification_state  = 'unverified',
         claim_trust_level   = NULL,
         claim_trust_reason  = NULL,
         metadata            = (COALESCE(bp.metadata, '{}'::jsonb)
                                  - 'verification_submission'
                                  - 'verification_attempts'
                                  - 'email_otp_attempt'
                                  - 'badge_approved'
                                  - 'badge_rejected'
                                  - 'verified_at'
                                  - 'verification_method'
                                  - 'auto_verified'
                                  - 'outreach_state'),
         updated_at          = now()
  FROM   fraud_accounts fa
  WHERE  bp.account_id = fa.id
    AND  bp.type <> 'family'
    -- AND  bp.verification_state <> 'verified'   -- <-- optional: spare BrightStar
  RETURNING bp.id
)
SELECT
  (SELECT count(*) FROM deleted_family)      AS family_deleted,
  (SELECT count(*) FROM unclaimed_providers) AS providers_unclaimed;

UPDATE accounts a
SET    active_profile_id = NULL
FROM   auth.users u
WHERE  a.user_id = u.id
  AND  u.email ILIKE '%@wehaveprepared.com';

COMMIT;


-- ============================================================================
-- STEP 3 — POST-VERIFICATION (read-only, run after STEP 2)
-- ============================================================================
-- Expect: zero family rows, all provider rows account_id=NULL / unclaimed.
SELECT bp.type,
       bp.claim_state,
       bp.verification_state,
       count(*) AS n,
       count(*) FILTER (WHERE bp.account_id IS NOT NULL) AS still_linked
FROM   business_profiles bp
WHERE  bp.email ILIKE '%@wehaveprepared.com'
   OR  bp.id IN (
         -- the unclaimed provider rows no longer join via account; check by
         -- the directory listing that was freed
         SELECT id FROM business_profiles
         WHERE  source_provider_id IS NOT NULL
       )
GROUP  BY bp.type, bp.claim_state, bp.verification_state
ORDER  BY bp.type;

-- The one real directory listing that was freed for its true owner:
--   olera-providers.provider_id = 'mKQD35X'  ("HomeWell Care Services")
-- Confirm it is untouched and now claimable (claim_state should be 'unclaimed'):
SELECT id, display_name, claim_state, verification_state, account_id, source_provider_id
FROM   business_profiles
WHERE  source_provider_id = 'mKQD35X';
