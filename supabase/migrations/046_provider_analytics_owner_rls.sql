-- Migration: Provider Analytics Phase 1A — provider-owner RLS on aggregation tables
--
-- Strategy doc: https://www.notion.so/34a5903a0ffe81f7ad56d6d85514d52f
-- Plan: plans/provider-analytics-phase-1-surfaces-plan.md task 2
--
-- Phase 0 shipped the aggregation tables RLS-enabled with NO policies, so
-- only service_role could read them. The Phase 1A endpoint still uses
-- service_role (so the API works today without this migration), but we want
-- defense-in-depth: if anyone writes a direct-from-browser query later, the
-- policy below ensures a signed-in provider can only read rows for their
-- OWN slug — never another provider's.
--
-- Ownership chain: auth.uid() -> accounts.user_id -> business_profiles.account_id -> business_profiles.slug
--
-- Legacy fallback: if the row's provider_id matches the profile's
-- source_provider_id (URL used legacy alphanumeric ID), also allow.
--
-- Additive and safe per CLAUDE.md. Apply via Supabase dashboard.

CREATE POLICY "provider_owner_select"
  ON provider_page_view_stats
  FOR SELECT
  TO authenticated
  USING (
    provider_id IN (
      SELECT bp.slug
      FROM business_profiles bp
      JOIN accounts a ON a.id = bp.account_id
      WHERE a.user_id = auth.uid()
    )
    OR provider_id IN (
      SELECT bp.source_provider_id
      FROM business_profiles bp
      JOIN accounts a ON a.id = bp.account_id
      WHERE a.user_id = auth.uid()
        AND bp.source_provider_id IS NOT NULL
    )
  );

-- city_category_view_benchmarks stays service-role only for now. Peer
-- aggregates don't need per-owner gating (they're already anonymized by
-- cohort), and the endpoint reads them via service_role. If a Phase 1+
-- feature wants direct-from-browser benchmark reads, add a broad
-- authenticated SELECT policy then.
