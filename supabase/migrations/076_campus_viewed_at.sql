-- v9.0 Phase 7 Commit O: viewed_at on student_outreach_campuses.
--
-- Brings sites in line with student_outreach (which already has its
-- own viewed_at). Powers the unified unread model:
--
--   An entity is "unread" if it has any pending operational signal
--   (task / touchpoint / state change) that postdates the entity's
--   last viewed_at.
--
-- Stakeholders: student_outreach.viewed_at (existed since migration 074).
-- Sites:        student_outreach_campuses.viewed_at (this migration).
-- Clients/
-- Candidates:   business_profiles.metadata.admin_viewed_at
--               (no schema change — JSONB, written by the unified
--                mark-entity-read endpoint).
--
-- The asymmetric storage is deliberate: business_profiles is a shared
-- table used by the public site, provider portal, and admin. Adding
-- admin-only columns there grows surface area for everyone.
-- student_outreach_campuses is admin-only, so a column is fine.
-- Both reach the same logical concept (last_viewed_at) — the
-- mark-entity-read endpoint hides the storage difference from
-- callers.

ALTER TABLE student_outreach_campuses
  ADD COLUMN IF NOT EXISTS viewed_at TIMESTAMPTZ;
