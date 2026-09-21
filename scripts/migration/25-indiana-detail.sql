-- ===========================================================================
-- 25 — Indiana detail (READ ONLY — changes nothing)
-- ===========================================================================
-- The census showed one Indiana task closing today, at 13:04 ET. So the
-- server was accepting writes. This asks the narrower question: on which
-- Indiana providers did anything land, and on which did nothing.
--
-- created_at matters here. A campus opened today has every record stamped
-- today whether or not it was worked, so last_edited_at only means something
-- when it is later than created_at.
--
-- Times are Eastern.
-- ===========================================================================

-- ── 1. Every Indiana provider, and whether anything landed on it ──────────
SELECT o.organization_name,
       o.status,
       o.created_at     AT TIME ZONE 'America/New_York'   AS created_et,
       o.last_edited_at AT TIME ZONE 'America/New_York'   AS edited_et,
       (o.last_edited_at > o.created_at + INTERVAL '5 seconds')
                                                          AS written_since_creation,
       count(t.id) FILTER (WHERE t.status = 'pending')     AS pending,
       count(t.id) FILTER (WHERE t.status = 'completed')   AS completed,
       count(t.id) FILTER (WHERE t.status = 'cancelled')   AS cancelled,
       max(t.completed_at AT TIME ZONE 'America/New_York') AS last_completion_et
FROM student_outreach o
JOIN student_outreach_campuses c   ON c.id = o.campus_id
LEFT JOIN student_outreach_tasks t ON t.outreach_id = o.id
WHERE c.name ILIKE '%indiana%' OR c.slug ILIKE '%indiana%'
GROUP BY o.id, o.organization_name, o.status, o.created_at, o.last_edited_at
ORDER BY o.last_edited_at DESC;

-- ── 2. Every Indiana task, whatever its state, last 7 days ────────────────
-- Widened past today in case a sitting straddled midnight. Shows pending
-- rows too: a pending task at a late step is proof an earlier advance saved.
SELECT o.organization_name,
       t.status,
       t.task_type,
       t.payload->>'step'    AS step,
       t.payload->>'round'   AS round,
       t.payload->>'outcome' AS outcome,
       t.notes,
       t.created_at   AT TIME ZONE 'America/New_York' AS created_et,
       t.completed_at AT TIME ZONE 'America/New_York' AS completed_et
FROM student_outreach_tasks t
JOIN student_outreach o          ON o.id = t.outreach_id
JOIN student_outreach_campuses c ON c.id = o.campus_id
WHERE (c.name ILIKE '%indiana%' OR c.slug ILIKE '%indiana%')
  AND t.created_at >= now() - INTERVAL '7 days'
ORDER BY o.organization_name, t.created_at;

-- ── 3. Contact details saved on Indiana providers ─────────────────────────
-- Phone numbers and names typed into the record save through a different
-- path than an advance. If these are populated, that path was working.
SELECT o.organization_name,
       ct.is_primary,
       ct.name,
       ct.role,
       ct.phone,
       ct.email,
       ct.last_edited_at AT TIME ZONE 'America/New_York' AS edited_et
FROM student_outreach_contacts ct
JOIN student_outreach o          ON o.id = ct.outreach_id
JOIN student_outreach_campuses c ON c.id = o.campus_id
WHERE c.name ILIKE '%indiana%' OR c.slug ILIKE '%indiana%'
ORDER BY o.organization_name, ct.is_primary DESC;
