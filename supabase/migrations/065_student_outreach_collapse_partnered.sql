-- Migration: Collapse student-outreach `agreed` and `distributed` stages
-- into a single `active_partner` win state.
--
-- The product decision: "less is more" — one Partnered state, with
-- evidence captured on the row and as a touchpoint. Sub-statuses for
-- partnership health can layer on later without another schema change.
--
-- The CHECK constraint on student_outreach.status already permits
-- 'active_partner', so no schema change is required. Older values
-- ('agreed', 'distributed') remain valid in the constraint but become
-- unused going forward — safer than dropping them and risking inserts
-- from any in-flight code paths.

UPDATE student_outreach
   SET status = 'active_partner',
       last_edited_at = NOW()
 WHERE status IN ('agreed', 'distributed');
