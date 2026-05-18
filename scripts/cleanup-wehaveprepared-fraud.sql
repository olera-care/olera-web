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


-- ============================================================================
-- STEP 4 — HIDE THE FABRICATED LISTINGS (run AFTER STEP 2/3)
-- ============================================================================
-- Why: STEP 2 severed the claims but the ~32 *fabricated* provider profiles
-- the ring invented (source='user_created'/'self_service', no
-- source_provider_id) are still is_active=true, so they still render as live
-- directory pages competing with the REAL providers' real listings. This
-- soft-hides only those fabricated rows.
--
-- NOT destructive: is_active is a single boolean; flip back to restore.
-- NOT a listing delete: `olera-providers` is never referenced; the one real
-- directory-linked row (77904ee7 / mKQD35X "HomeWell Care Services") is
-- explicitly EXCLUDED and stays active + claimable.
--
-- Scope = the explicit 32 fabricated profile IDs from the audit, with a
-- belt-and-suspenders `source_provider_id IS NULL` guard so a directory-
-- linked listing can never be hidden even if an ID were mistyped.
-- ============================================================================

-- 4a. PREVIEW (read-only) — exactly what STEP 4 will hide
SELECT id, display_name, source, claim_state, is_active, source_provider_id
FROM   business_profiles
WHERE  source_provider_id IS NULL
  AND  id IN (
    '04b35693-77c9-453b-97ab-5cb7177ad182','670affe9-df50-48ce-ba3f-9899bb4c2d6c',
    '72b6f7f3-1eb8-480f-9948-a240a2fa8fb3','60796d10-9b31-4f54-85ca-0e8b02157b60',
    '364adede-b39e-4c3b-9ee6-814c4f9d869e','c429cc51-d6af-4076-864d-2004312ef2ec',
    '539bb5aa-910a-4708-a144-8b684711f7fb','b5d901f7-5eca-478c-8547-547a48ad22b0',
    '4a2b87fb-bbb9-4a00-ac9d-eb9a21e9a96e','e393afd4-d1fb-4a7c-a4b2-35687ba7becc',
    '4d631071-72ad-4537-b3da-3bb256cbdba4','05687c6d-cfee-41cb-8496-42dca563e1ae',
    '59ac7537-1cf1-4ecb-b770-3a133f0a507e','9b6715b9-7f9e-4482-b69c-6bcb35b5b965',
    '90213c05-d542-4ec8-b773-59e159efb583','4bcc2445-6241-4cf7-b56a-95dee68cd00a',
    '6b5b5344-d41e-4cec-83c3-ecffee1e5624','8765fc44-5e16-4b26-a95e-ab6586832da3',
    '3013f5df-9615-4f85-b356-f4a45e66eff4','5ff38c8b-5db5-4e62-b660-8c3dd3fbbfed',
    'b4bde960-fc69-40e7-8c86-5e446a681d5d','215eb2c5-fd4d-4f78-aaa5-034eb1f7ae73',
    '2a2ea9c5-0157-4567-8234-a8f800d213dd','cf12f4a0-db19-49ee-bcc2-b8650cf37436',
    '7d6dcc26-e54c-41f7-b079-f7e5e2660035','27c85cc1-0aeb-4db5-8612-fbe19a6e0692',
    '4208cf27-c7ea-4d1d-aabf-0fe79add79d2','59c84555-8c8b-49ac-bc2d-fa1088631608',
    '59d4bd12-2bcb-4a1e-8ebc-6f11466abc4a','71a7705a-a886-4631-bc92-69a6bf6b1348',
    'f57cf64a-68e8-4f16-9e69-05ac78a029ab','612f3e48-7b05-4f44-a8f8-89c823abca83'
  )
ORDER BY display_name;

-- 4b. DRY RUN (ends in ROLLBACK — nothing saved)
BEGIN;
WITH hidden AS (
  UPDATE business_profiles
  SET    is_active = false, updated_at = now()
  WHERE  source_provider_id IS NULL
    AND  is_active = true
    AND  id IN (
      '04b35693-77c9-453b-97ab-5cb7177ad182','670affe9-df50-48ce-ba3f-9899bb4c2d6c',
      '72b6f7f3-1eb8-480f-9948-a240a2fa8fb3','60796d10-9b31-4f54-85ca-0e8b02157b60',
      '364adede-b39e-4c3b-9ee6-814c4f9d869e','c429cc51-d6af-4076-864d-2004312ef2ec',
      '539bb5aa-910a-4708-a144-8b684711f7fb','b5d901f7-5eca-478c-8547-547a48ad22b0',
      '4a2b87fb-bbb9-4a00-ac9d-eb9a21e9a96e','e393afd4-d1fb-4a7c-a4b2-35687ba7becc',
      '4d631071-72ad-4537-b3da-3bb256cbdba4','05687c6d-cfee-41cb-8496-42dca563e1ae',
      '59ac7537-1cf1-4ecb-b770-3a133f0a507e','9b6715b9-7f9e-4482-b69c-6bcb35b5b965',
      '90213c05-d542-4ec8-b773-59e159efb583','4bcc2445-6241-4cf7-b56a-95dee68cd00a',
      '6b5b5344-d41e-4cec-83c3-ecffee1e5624','8765fc44-5e16-4b26-a95e-ab6586832da3',
      '3013f5df-9615-4f85-b356-f4a45e66eff4','5ff38c8b-5db5-4e62-b660-8c3dd3fbbfed',
      'b4bde960-fc69-40e7-8c86-5e446a681d5d','215eb2c5-fd4d-4f78-aaa5-034eb1f7ae73',
      '2a2ea9c5-0157-4567-8234-a8f800d213dd','cf12f4a0-db19-49ee-bcc2-b8650cf37436',
      '7d6dcc26-e54c-41f7-b079-f7e5e2660035','27c85cc1-0aeb-4db5-8612-fbe19a6e0692',
      '4208cf27-c7ea-4d1d-aabf-0fe79add79d2','59c84555-8c8b-49ac-bc2d-fa1088631608',
      '59d4bd12-2bcb-4a1e-8ebc-6f11466abc4a','71a7705a-a886-4631-bc92-69a6bf6b1348',
      'f57cf64a-68e8-4f16-9e69-05ac78a029ab','612f3e48-7b05-4f44-a8f8-89c823abca83'
    )
  RETURNING id
)
SELECT count(*) AS rows_hidden FROM hidden;   -- expect ~32
ROLLBACK;

-- 4c. APPLY (ends in COMMIT — same UPDATE; persists). Run only if 4b count
--     looks right. Copy the BEGIN…UPDATE…RETURNING block from 4b, change the
--     final ROLLBACK to COMMIT.

-- 4d. POST-VERIFY — the real directory listing must still be active:
SELECT id, display_name, is_active, claim_state, source_provider_id
FROM   business_profiles
WHERE  source_provider_id = 'mKQD35X';   -- is_active should still be true
