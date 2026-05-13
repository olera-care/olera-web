-- Migration: Close RLS gaps flagged by Supabase Security Advisor (2026-05-13)
--
-- Five tables in `public` had RLS disabled while still granting full
-- DELETE/INSERT/SELECT/UPDATE to the `anon` role. With the anon key shipping
-- in every browser, this meant any visitor could read or mutate these rows.
-- Plus, `connections_debug` was a SECURITY DEFINER view exposing every
-- connection (including emails via joined business_profiles) to anon.
--
-- Fix: enable RLS, add only the policies actually needed, revoke broad
-- anon/authenticated grants on service-role-only tables, and drop the
-- leaky debug view (no code references it).
--
-- Note: this was already applied directly to production on 2026-05-13 via
-- the Supabase SQL editor to close the leak immediately. This migration
-- records it in source control so local `supabase db reset` matches prod.
-- All statements are idempotent (IF EXISTS / DROP POLICY IF EXISTS pattern).
--
-- Roll back by restoring grants + `ALTER TABLE ... DISABLE ROW LEVEL SECURITY`.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. connections_debug — drop. SECURITY DEFINER view, anon-granted, leaks
--    every connection's emails. Zero code references.
-- ─────────────────────────────────────────────────────────────────────────────
DROP VIEW IF EXISTS public.connections_debug;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. claim_verification_codes — service-role only.
--    Holds in-flight verification codes for the provider-claim flow.
--    All five claim routes use SUPABASE_SERVICE_ROLE_KEY, which bypasses RLS.
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.claim_verification_codes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.claim_verification_codes FROM anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. draft_reviews — service-role only.
--    Pipeline-generated content drafts, admin route uses service-role key.
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.draft_reviews ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.draft_reviews FROM anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. olera_reviews — re-apply intent of migration 039.
--    Public reviews shown on provider pages. Anyone can read non-flagged
--    rows and submit a new review; flagging + moderation stays service-role.
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.olera_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read non-flagged olera reviews" ON public.olera_reviews;
CREATE POLICY "Public can read non-flagged olera reviews"
  ON public.olera_reviews FOR SELECT
  USING (flagged = false);

DROP POLICY IF EXISTS "Anyone can insert olera reviews" ON public.olera_reviews;
CREATE POLICY "Anyone can insert olera reviews"
  ON public.olera_reviews FOR INSERT
  WITH CHECK (true);

-- UPDATE/DELETE: no policy → only service-role can mutate (flagging path).

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. outreach_log — orphan log table (no code references anywhere).
--    Conservative: lock down with RLS. If you'd rather drop, swap this block
--    for `DROP TABLE IF EXISTS public.outreach_log;`.
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.outreach_log ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.outreach_log FROM anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. provider_cleansing_log — orphan log table (no code references anywhere).
--    Same treatment as outreach_log.
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.provider_cleansing_log ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.provider_cleansing_log FROM anon, authenticated;
