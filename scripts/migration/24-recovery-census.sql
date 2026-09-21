-- ===========================================================================
-- 24 — recovery census (READ ONLY — changes nothing)
-- ===========================================================================
-- Answers one question: did the work done on the Indiana providers today
-- reach the database at all?
--
-- Every successful write in the board's action route stamps
-- student_outreach.last_edited_at, whatever else it does. So a record that
-- was worked on and saved carries today's timestamp; a record whose writes
-- were refused carries whatever it had before. Task rows carry the rest:
-- which outcome was pressed, the note typed, and when it was closed.
--
-- Times are Eastern.
-- ===========================================================================

-- ── 1. Which campus is Indiana, and when was it last touched ──────────────
SELECT c.id,
       c.slug,
       c.name,
       count(o.id)                                            AS records,
       max(o.last_edited_at AT TIME ZONE 'America/New_York')  AS last_write_et
FROM student_outreach_campuses c
LEFT JOIN student_outreach o ON o.campus_id = c.id
WHERE c.name ILIKE '%indiana%' OR c.slug ILIKE '%indiana%'
GROUP BY c.id, c.slug, c.name
ORDER BY c.name;

-- ── 2. Every write that landed today, across all campuses ─────────────────
-- If today's work saved, the Indiana providers appear here. If this comes
-- back empty, nothing reached the database today.
SELECT c.name                                              AS campus,
       o.organization_name,
       o.status,
       o.last_edited_at AT TIME ZONE 'America/New_York'     AS edited_et
FROM student_outreach o
JOIN student_outreach_campuses c ON c.id = o.campus_id
WHERE o.last_edited_at >= ((now() AT TIME ZONE 'America/New_York')::date AT TIME ZONE 'America/New_York')
ORDER BY o.last_edited_at DESC;

-- ── 3. Every task closed today, with the outcome and the note ─────────────
-- This is where the notes live. One row per completed task.
SELECT c.name                                              AS campus,
       o.organization_name,
       t.task_type,
       t.payload->>'step'    AS step,
       t.payload->>'round'   AS round,
       t.payload->>'outcome' AS outcome,
       t.notes,
       t.completed_at AT TIME ZONE 'America/New_York'       AS completed_et
FROM student_outreach_tasks t
JOIN student_outreach o           ON o.id = t.outreach_id
JOIN student_outreach_campuses c  ON c.id = o.campus_id
WHERE t.completed_at >= ((now() AT TIME ZONE 'America/New_York')::date AT TIME ZONE 'America/New_York')
ORDER BY t.completed_at DESC;

-- ── 4. Indiana providers as they stand right now ──────────────────────────
-- The full current picture: what the board would show on a fresh load.
SELECT o.organization_name,
       o.status,
       o.last_edited_at AT TIME ZONE 'America/New_York'     AS edited_et,
       count(t.id) FILTER (WHERE t.status = 'pending')      AS pending_tasks,
       count(t.id) FILTER (WHERE t.status = 'completed')    AS completed_tasks,
       max(t.completed_at AT TIME ZONE 'America/New_York')  AS last_completion_et
FROM student_outreach o
JOIN student_outreach_campuses c       ON c.id = o.campus_id
LEFT JOIN student_outreach_tasks t     ON t.outreach_id = o.id
WHERE (c.name ILIKE '%indiana%' OR c.slug ILIKE '%indiana%')
GROUP BY o.id, o.organization_name, o.status, o.last_edited_at
ORDER BY o.last_edited_at DESC NULLS LAST;

-- ── 5. Was anything deleted today ─────────────────────────────────────────
-- A delete writes an exclusion row holding the whole record, call history
-- included. If a provider vanished, its snapshot is here and can be rebuilt.
SELECT c.name AS campus,
       e.organization_name,
       e.reason,
       e.deleted_at AT TIME ZONE 'America/New_York' AS deleted_et,
       jsonb_pretty(e.snapshot)                     AS snapshot
FROM medjobs_excluded_records e
JOIN student_outreach_campuses c ON c.id = e.campus_id
WHERE e.deleted_at >= now() - INTERVAL '3 days'
ORDER BY e.deleted_at DESC;
