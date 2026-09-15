-- ===========================================================================
-- MedJobs site purge — PREFLIGHT (read-only, changes nothing)
-- ===========================================================================
-- Run this FIRST. It is one query on purpose: the Supabase SQL editor shows
-- only a single result set, so everything worth reading is in one table.
--
-- Read it in three sections:
--   1  SITE        every university, marked KEEP or PURGE, with its counts.
--                  The PURGE rows are exactly what the purge will empty.
--   2  NAME CHECK  one row per focus site that FAILED to resolve. No rows
--                  here is the good outcome.
--   3  WARNING     the only two ways the purge can touch a KEPT site.
--                  No rows here is the good outcome.
-- ===========================================================================

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

-- ── 1. Every site, marked KEEP or PURGE, with its data counts ────────────
SELECT
  1                                                                AS section,
  CASE WHEN c.id IN (SELECT id FROM kept) THEN 'KEEP' ELSE 'PURGE' END AS status,
  c.name                                                           AS site,
  c.slug                                                           AS slug,
  (SELECT count(*) FROM student_outreach so
    WHERE so.campus_id = c.id AND so.kind = 'provider')            AS provider_partners,
  (SELECT count(*) FROM student_outreach so
    WHERE so.campus_id = c.id AND so.kind <> 'provider')           AS university_orgs,
  (SELECT count(*) FROM student_outreach_touchpoints tp
     JOIN student_outreach so ON so.id = tp.outreach_id
    WHERE so.campus_id = c.id)                                     AS calls_emails_meetings,
  (SELECT count(*) FROM student_outreach_tasks t
     JOIN student_outreach so ON so.id = t.outreach_id
    WHERE so.campus_id = c.id AND t.status = 'pending')            AS tasks_pending,
  -- The purge removes tasks of every status, not just pending, so this is
  -- the number its report will echo back.
  (SELECT count(*) FROM student_outreach_tasks t
     JOIN student_outreach so ON so.id = t.outreach_id
    WHERE so.campus_id = c.id)                                     AS tasks_all,
  (SELECT count(*) FROM student_outreach_approvals a
     JOIN student_outreach so ON so.id = a.outreach_id
    WHERE so.campus_id = c.id)                                     AS approvals,
  (SELECT count(*) FROM student_outreach_contacts ct
     JOIN student_outreach so ON so.id = ct.outreach_id
    WHERE so.campus_id = c.id)                                     AS contacts,
  (SELECT count(*) FROM site_tasks st WHERE st.campus_id = c.id)   AS site_todos,
  (SELECT count(*) FROM campus_channel_records r
     JOIN campus_channels ch ON ch.id = r.channel_id
    WHERE ch.campus_id = c.id)                                     AS channel_records,
  NULL::TEXT                                                       AS note
FROM student_outreach_campuses c

UNION ALL

-- ── 2. Focus sites that do NOT resolve. Empty = good. ────────────────────
SELECT 2, 'NAME CHECK', k.name, NULL, NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,
  'This focus site matches no university. The purge will ABORT until the spelling is fixed in both scripts.'
FROM keep k
WHERE NOT EXISTS (
  SELECT 1 FROM student_outreach_campuses c
   WHERE lower(btrim(c.name)) = lower(btrim(k.name)))

UNION ALL

-- ── 3a. Kept rows pointing at a purged row (FK goes NULL). Empty = good. ─
SELECT 3, 'WARNING', kc.name, NULL, NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,
  format('"%s" has %s pointing at a row on "%s"; the purge sets that link to null.',
         so.organization_name, ref.label, dc.name)
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
  AND tgt.campus_id NOT IN (SELECT id FROM kept)

UNION ALL

-- ── 3b. Kept tasks hanging off a purged approval (cascade). Empty = good. ─
SELECT 3, 'WARNING', kc.name, NULL, NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,
  format('Task %s (%s) belongs to a kept site but hangs off an approval on "%s"; deleting that approval removes this task too.',
         t.id, t.task_type, dc.name)
FROM student_outreach_tasks t
JOIN student_outreach so ON so.id = t.outreach_id
JOIN student_outreach_campuses kc ON kc.id = so.campus_id
JOIN student_outreach_approvals a ON a.id = t.approval_id
JOIN student_outreach ao ON ao.id = a.outreach_id
JOIN student_outreach_campuses dc ON dc.id = ao.campus_id
WHERE so.campus_id IN (SELECT id FROM kept)
  AND ao.campus_id NOT IN (SELECT id FROM kept)

ORDER BY section, status, site;
