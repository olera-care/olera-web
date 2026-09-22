-- ===========================================================================
-- 32 — what actually landed on the advisor records (READ ONLY)
-- ===========================================================================
-- Until the fix in this branch, logging a task on an advisor, student org or
-- professor record updated the screen and reached nothing. The record itself
-- and any attachment saved, because those write on their own paths; the
-- logged outcome and the note did not.
--
-- This shows, per advisor record: what rung it is sitting on, whether any
-- task was ever recorded completed, and whether a note exists. Anything with
-- no completed row is work that has to be redone.
-- ===========================================================================

SELECT c.name                         AS campus,
       o.organization_name,
       t.payload->>'step'             AS rung,
       t.status,
       t.notes,
       t.completed_at AT TIME ZONE 'America/New_York' AS completed_et
FROM student_outreach o
JOIN student_outreach_campuses c ON c.id = o.campus_id
LEFT JOIN student_outreach_tasks t ON t.outreach_id = o.id
WHERE o.kind = 'advisor'
  AND o.status <> 'archived'
ORDER BY c.name, o.organization_name, (t.payload->>'step')::int NULLS FIRST;

-- Attachments on those records, which did save.
SELECT o.organization_name,
       a.file_name,
       a.created_at AT TIME ZONE 'America/New_York' AS uploaded_et
FROM medjobs_attachments a
JOIN student_outreach o ON o.id = a.record_id
WHERE o.kind = 'advisor'
ORDER BY a.created_at DESC;
