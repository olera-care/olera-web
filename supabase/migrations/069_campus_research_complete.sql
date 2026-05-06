-- ─────────────────────────────────────────────────────────────────────────
-- Migration 069 — Per-campus research-complete flag.
--
-- Drives the "Campuses in research" section at the top of the Research
-- tab. While `research_complete` is false, the campus surfaces as an
-- entry-point card for bulk stakeholder input. Admin can flip the flag
-- explicitly via the card's overflow menu when they're done finding
-- stakeholders for that campus.
--
-- This is purely a UI dismiss flag; it does NOT advance any individual
-- stakeholder out of prospect/researched. Per-stakeholder advance stays
-- driven by the existing drawer flow.
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE student_outreach_campuses
  ADD COLUMN IF NOT EXISTS research_complete BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN student_outreach_campuses.research_complete IS
  'When false, surface this campus as a research entry-point card on the Research tab. Toggle via mark_campus_research_complete / reopen_campus_research actions.';
