-- ===========================================================================
-- 27 — did it save? (READ ONLY — changes nothing)
-- ===========================================================================
-- Run this straight after advancing a task. It reads the database directly,
-- so it answers without trusting the screen. If your advance is the top row,
-- it is stored; if it is not there, it never arrived.
--
-- Times are Eastern.
-- ===========================================================================

-- ── 1. The last 20 task writes, newest first ──────────────────────────────
SELECT c.name AS campus,
       o.organization_name,
       t.status,
       t.payload->>'outcome' AS outcome,
       t.notes,
       t.completed_at AT TIME ZONE 'America/New_York' AS completed_et,
       round(extract(epoch FROM (now() - t.completed_at)))  AS seconds_ago
FROM student_outreach_tasks t
JOIN student_outreach o          ON o.id = t.outreach_id
JOIN student_outreach_campuses c ON c.id = o.campus_id
WHERE t.completed_at IS NOT NULL
ORDER BY t.completed_at DESC
LIMIT 20;

-- ── 2. Is migration 237 applied? ──────────────────────────────────────────
-- Looks for provider_map_sweep in the site_tasks task_type CHECK. One row
-- back with 'yes' means 237 is in. No row, or 'no', means it is not.
SELECT CASE WHEN pg_get_constraintdef(oid) LIKE '%provider_map_sweep%'
            THEN 'yes — 237 is applied'
            ELSE 'no  — 237 still needs running'
       END AS migration_237,
       pg_get_constraintdef(oid) AS constraint_now
FROM pg_constraint
WHERE conrelid = 'site_tasks'::regclass
  AND conname  = 'site_tasks_task_type_check';

-- ── 3. Is the unique index from 237 there too? ────────────────────────────
SELECT indexname
FROM pg_indexes
WHERE tablename = 'site_tasks'
  AND indexname = 'uq_site_tasks_provider_map_sweep';
