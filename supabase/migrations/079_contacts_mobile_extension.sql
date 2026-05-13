-- v9 Phase 9 step 1: mobile + extension on outreach contacts.
--
-- Per-contact phone metadata expansion. The existing phone column
-- continues to hold the primary callable line (general office,
-- direct line, etc.). Two optional fields stack on top:
--
--   mobile     direct mobile / cell number when known
--   extension  PBX extension to dial after the main number connects
--
-- Use case: admin discovers a hiring manager has both an office
-- direct line (phone = '555-1234') and a cell (mobile = '555-9876').
-- Both are callable; the call cadence generates one task using
-- the primary phone; admin can manually dial mobile from the
-- contact card if the primary doesn't answer.
--
-- Extension stays separate because it's dialing metadata, not a
-- channel — "555-1000 ext 405" is one call attempt, not two.
--
-- Both nullable; legacy rows unaffected.

ALTER TABLE student_outreach_contacts
  ADD COLUMN IF NOT EXISTS mobile TEXT,
  ADD COLUMN IF NOT EXISTS extension TEXT;
