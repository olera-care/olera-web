-- ===========================================================================
-- 28 — remove the DuBose University of Olera demo (DESTRUCTIVE)
-- ===========================================================================
-- The demo campus was built to teach people the board. It has served that,
-- and a fake university sitting in the list is now one more thing to explain.
--
-- Run the rehearsal first and look at the counts. Everything the second half
-- touches is demo data — the campus row itself carries is_demo — but a
-- delete that cannot be undone deserves a look before it runs.
--
-- The is_demo column stays. It costs one line in the board and one in the
-- funnel metrics, and dropping a column from a live table to save that is
-- not a trade worth making.
-- ===========================================================================

-- ── REHEARSAL: what would go ───────────────────────────────────────────────
SELECT c.name,
       c.slug,
       (SELECT count(*) FROM student_outreach o WHERE o.campus_id = c.id)      AS records,
       (SELECT count(*) FROM student_outreach_tasks t
          JOIN student_outreach o ON o.id = t.outreach_id
         WHERE o.campus_id = c.id)                                             AS tasks,
       (SELECT count(*) FROM site_tasks s WHERE s.campus_id = c.id)            AS site_tasks,
       (SELECT count(*) FROM campus_channels ch WHERE ch.campus_id = c.id)     AS channels,
       (SELECT count(*) FROM medjobs_attachments a WHERE a.campus_id = c.id)   AS files
FROM student_outreach_campuses c
WHERE c.is_demo;

-- Files first: storage objects do not cascade, so anything here has to be
-- removed from the bucket by hand afterwards. Expect zero.
SELECT a.path
FROM medjobs_attachments a
JOIN student_outreach_campuses c ON c.id = a.campus_id
WHERE c.is_demo;

-- ── APPLY: uncomment the four statements and run ───────────────────────────
-- Touchpoints are append-only and their trigger fires on a cascade, so they
-- go first, through the same function the board's delete uses. Each statement
-- is on one line so uncommenting cannot leave half of one behind.

-- SELECT medjobs_purge_touchpoints(o.id) FROM student_outreach o JOIN student_outreach_campuses c ON c.id = o.campus_id WHERE c.is_demo;

-- DELETE FROM student_outreach o USING student_outreach_campuses c WHERE c.id = o.campus_id AND c.is_demo;

-- DELETE FROM medjobs_universities u USING student_outreach_campuses c WHERE c.slug = u.slug AND c.is_demo;

-- DELETE FROM student_outreach_campuses WHERE is_demo;

-- ── CONFIRM ────────────────────────────────────────────────────────────────
-- SELECT count(*) AS demo_campuses_left FROM student_outreach_campuses WHERE is_demo;
