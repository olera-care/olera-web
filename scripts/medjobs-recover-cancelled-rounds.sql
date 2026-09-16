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
-- Run this once the list above looks right.
--
-- ONE statement on purpose, for two reasons. The Supabase SQL editor does not
-- hold a transaction across statements, so a BEGIN/COMMIT wrapper there is
-- fake safety; and a single statement is atomic on its own. It also RETURNS
-- what it restored, so the editor shows you the result instead of a bare
-- "UPDATE 2".
--
-- Only restores rounds still in the future, or overdue by less than a week.
-- A round whose date passed months ago should not reappear as work today.
-- Records that already have pending work were superseded on purpose, not
-- damaged, so they are left alone.
--
-- Verified against Postgres 16: restores the future rounds on a damaged
-- record, leaves a long-overdue one cancelled, and does not touch a record
-- that still has pending work.

WITH restored AS (
  UPDATE student_outreach_tasks t
     SET status = 'pending'
   WHERE t.status = 'cancelled'
     AND t.task_type IN ('outreach_contact','outreach_email_send','outreach_followup_call')
     AND t.due_at > NOW() - INTERVAL '7 days'
     AND NOT EXISTS (
       SELECT 1 FROM student_outreach_tasks p
        WHERE p.outreach_id = t.outreach_id
          AND p.status = 'pending'
          AND p.task_type IN ('outreach_contact','outreach_email_send','outreach_followup_call'))
  RETURNING t.outreach_id, t.task_type, t.due_at
)
SELECT c.name AS university, so.organization_name, r.task_type, r.due_at::date AS due
FROM restored r
JOIN student_outreach so ON so.id = r.outreach_id
JOIN student_outreach_campuses c ON c.id = so.campus_id
ORDER BY c.name, so.organization_name, r.due_at;
