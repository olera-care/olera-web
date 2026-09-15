-- ===========================================================================
-- MedJobs site purge — PREFLIGHT (read-only, changes nothing)
-- ===========================================================================
-- Run this FIRST in the Supabase SQL editor and keep the output.
--
-- It answers three questions the purge depends on:
--   1. What sites actually exist, and do the five keepers resolve by name?
--   2. How much data hangs off each site?
--   3. Does any KEPT site point at a row on a site we are about to delete?
--
-- Nothing here writes. Safe to run any number of times.
-- ===========================================================================

-- The five sites MedJobs is focusing on. Everything else is a purge target.
-- Matched case-insensitively on trimmed name.
WITH keep(name) AS (
  VALUES
    ('Arizona State University'),
    ('Florida State University'),
    ('Indiana University Bloomington'),
    ('University of Utah'),
    ('University of Wisconsin-Madison')
)

-- ── 1. Every site, flagged keep vs purge, with its data counts ───────────
SELECT
  c.name,
  c.slug,
  c.is_active,
  CASE WHEN EXISTS (
    SELECT 1 FROM keep k WHERE lower(btrim(k.name)) = lower(btrim(c.name))
  ) THEN 'KEEP' ELSE 'PURGE' END                                  AS disposition,
  (SELECT count(*) FROM student_outreach so
     WHERE so.campus_id = c.id AND so.kind = 'provider')           AS provider_partners,
  (SELECT count(*) FROM student_outreach so
     WHERE so.campus_id = c.id AND so.kind <> 'provider')          AS university_orgs,
  (SELECT count(*) FROM student_outreach_touchpoints tp
     JOIN student_outreach so ON so.id = tp.outreach_id
    WHERE so.campus_id = c.id)                                     AS touchpoints,
  (SELECT count(*) FROM student_outreach_tasks t
     JOIN student_outreach so ON so.id = t.outreach_id
    WHERE so.campus_id = c.id)                                     AS outreach_tasks,
  (SELECT count(*) FROM student_outreach_tasks t
     JOIN student_outreach so ON so.id = t.outreach_id
    WHERE so.campus_id = c.id AND t.status = 'pending')            AS tasks_pending,
  (SELECT count(*) FROM student_outreach_approvals a
     JOIN student_outreach so ON so.id = a.outreach_id
    WHERE so.campus_id = c.id)                                     AS approvals,
  (SELECT count(*) FROM student_outreach_contacts ct
     JOIN student_outreach so ON so.id = ct.outreach_id
    WHERE so.campus_id = c.id)                                     AS contacts,
  (SELECT count(*) FROM site_tasks st WHERE st.campus_id = c.id)   AS site_tasks,
  (SELECT count(*) FROM campus_channels ch WHERE ch.campus_id = c.id) AS channels,
  (SELECT count(*) FROM campus_channel_records r
     JOIN campus_channels ch ON ch.id = r.channel_id
    WHERE ch.campus_id = c.id)                                     AS channel_records
FROM student_outreach_campuses c
ORDER BY disposition, c.name;


-- ── 2. Keep-list resolution guard ────────────────────────────────────────
-- Every one of the five must resolve to exactly one campus. A 0 here means
-- the site is spelled differently in the DB (or does not exist) and the
-- purge would delete it. Fix the name in BOTH scripts before proceeding.
WITH keep(name) AS (
  VALUES
    ('Arizona State University'),
    ('Florida State University'),
    ('Indiana University Bloomington'),
    ('University of Utah'),
    ('University of Wisconsin-Madison')
)
SELECT
  k.name AS expected_name,
  count(c.id) AS matched_campuses,
  CASE WHEN count(c.id) = 1 THEN 'ok' ELSE '*** FIX BEFORE PURGE ***' END AS verdict,
  string_agg(c.slug, ', ') AS matched_slugs
FROM keep k
LEFT JOIN student_outreach_campuses c
  ON lower(btrim(c.name)) = lower(btrim(k.name))
GROUP BY k.name
ORDER BY k.name;


-- ── 3. Cross-site pointers that the purge would null out ─────────────────
-- student_outreach has three self-referencing FKs, all ON DELETE SET NULL:
-- permission_dependency_id, redirected_to_id, referred_from_id. If a row on
-- a KEPT site points at a row on a PURGED site, that pointer silently
-- becomes NULL. Rows listed here are the only keeper-side data the purge
-- changes. Empty result = the purge touches nothing on the five keepers.
WITH keep(name) AS (
  VALUES
    ('Arizona State University'),
    ('Florida State University'),
    ('Indiana University Bloomington'),
    ('University of Utah'),
    ('University of Wisconsin-Madison')
),
kept AS (
  SELECT c.id FROM student_outreach_campuses c
   WHERE EXISTS (SELECT 1 FROM keep k WHERE lower(btrim(k.name)) = lower(btrim(c.name)))
),
doomed AS (
  SELECT c.id FROM student_outreach_campuses c
   WHERE NOT EXISTS (SELECT 1 FROM keep k WHERE lower(btrim(k.name)) = lower(btrim(c.name)))
)
SELECT
  kc.name                AS kept_site,
  so.id                  AS kept_row_id,
  so.organization_name   AS kept_row,
  ref.label              AS pointer_column,
  dc.name                AS points_at_site
FROM student_outreach so
JOIN student_outreach_campuses kc ON kc.id = so.campus_id
CROSS JOIN LATERAL (VALUES
  ('permission_dependency_id', so.permission_dependency_id),
  ('redirected_to_id',         so.redirected_to_id),
  ('referred_from_id',         so.referred_from_id)
) AS ref(label, target_id)
JOIN student_outreach tgt ON tgt.id = ref.target_id
JOIN student_outreach_campuses dc ON dc.id = tgt.campus_id
WHERE so.campus_id IN (SELECT id FROM kept)
  AND tgt.campus_id IN (SELECT id FROM doomed)
ORDER BY kc.name, so.organization_name;


-- ── 4. Kept tasks that hang off a purged approval ────────────────────────
-- student_outreach_tasks.approval_id is ON DELETE CASCADE. If a task on a
-- KEPT site references an approval belonging to a PURGED site, deleting that
-- approval takes the kept task with it. This is a data anomaly rather than a
-- normal shape, so the expected result is empty — but check, because the
-- loss would be silent.
WITH keep(name) AS (
  VALUES
    ('Arizona State University'),
    ('Florida State University'),
    ('Indiana University Bloomington'),
    ('University of Utah'),
    ('University of Wisconsin-Madison')
),
kept AS (
  SELECT c.id FROM student_outreach_campuses c
   WHERE EXISTS (SELECT 1 FROM keep k WHERE lower(btrim(k.name)) = lower(btrim(c.name)))
)
SELECT kc.name AS kept_site, t.id AS kept_task_id, t.task_type, t.status,
       dc.name AS approval_on_purged_site
FROM student_outreach_tasks t
JOIN student_outreach so  ON so.id = t.outreach_id
JOIN student_outreach_campuses kc ON kc.id = so.campus_id
JOIN student_outreach_approvals a ON a.id = t.approval_id
JOIN student_outreach ao  ON ao.id = a.outreach_id
JOIN student_outreach_campuses dc ON dc.id = ao.campus_id
WHERE so.campus_id IN (SELECT id FROM kept)
  AND ao.campus_id NOT IN (SELECT id FROM kept);
