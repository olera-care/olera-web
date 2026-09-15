-- ===========================================================================
-- Recover rounds cancelled by a failed "Another set of rounds"
-- ===========================================================================
-- launch_next_set used to cancel a row's pending tasks BEFORE inserting the
-- new set. When the insert failed — which it did for every attempt made before
-- migration 233 was applied, because `outreach_contact` was not yet a valid
-- task_type — the row was left live with its remaining rounds cancelled and
-- nothing queued in their place.
--
-- This finds rows in exactly that state and puts the cancelled tasks back.
--
-- Run section 1 on its own first. If it returns no rows, nothing was damaged
-- and there is nothing to do.
-- ===========================================================================

-- ── 1. What was damaged (read-only) ─────────────────────────────────────
-- Rows with tasks cancelled in the last 7 days and NOTHING pending since.
SELECT
  so.id                       AS outreach_id,
  so.organization_name,
  c.name                      AS university,
  count(*)                    AS cancelled_tasks,
  min(t.due_at)               AS earliest_due,
  max(t.due_at)               AS latest_due
FROM student_outreach_tasks t
JOIN student_outreach so ON so.id = t.outreach_id
JOIN student_outreach_campuses c ON c.id = so.campus_id
WHERE t.status = 'cancelled'
  AND t.task_type IN ('outreach_contact', 'outreach_email_send', 'outreach_followup_call')
  AND t.created_at > NOW() - INTERVAL '90 days'
  -- Only rows left with nothing queued. A row that has pending work was
  -- superseded on purpose, not damaged.
  AND NOT EXISTS (
    SELECT 1 FROM student_outreach_tasks p
     WHERE p.outreach_id = so.id
       AND p.status = 'pending'
       AND p.task_type IN ('outreach_contact', 'outreach_email_send', 'outreach_followup_call')
  )
GROUP BY so.id, so.organization_name, c.name
ORDER BY c.name, so.organization_name;


-- ── 2. Put them back ────────────────────────────────────────────────────
-- Uncomment and run once the list above looks right.
--
-- Only restores tasks still in the future, or overdue by less than a week —
-- a round whose date passed long ago should not suddenly reappear as work.
--
-- BEGIN;
--
-- UPDATE student_outreach_tasks t
--    SET status = 'pending'
--  WHERE t.status = 'cancelled'
--    AND t.task_type IN ('outreach_contact', 'outreach_email_send', 'outreach_followup_call')
--    AND t.due_at > NOW() - INTERVAL '7 days'
--    AND NOT EXISTS (
--      SELECT 1 FROM student_outreach_tasks p
--       WHERE p.outreach_id = t.outreach_id
--         AND p.status = 'pending'
--         AND p.task_type IN ('outreach_contact', 'outreach_email_send', 'outreach_followup_call')
--    );
--
-- -- Check before committing: every affected row should have work again.
-- SELECT so.organization_name, count(*) FILTER (WHERE t.status = 'pending') AS pending_now
--   FROM student_outreach so
--   JOIN student_outreach_tasks t ON t.outreach_id = so.id
--  GROUP BY so.organization_name
--  HAVING count(*) FILTER (WHERE t.status = 'pending') > 0
--  ORDER BY so.organization_name;
--
-- COMMIT;
