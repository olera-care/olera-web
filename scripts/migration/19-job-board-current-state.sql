-- ===========================================================================
-- Step 6 -- put every job board where it actually is. WRITES.
-- ===========================================================================
-- The job board ladder had no task rows at all, which is why the drawer
-- showed a list of what was still to come and nothing to do. This gives each
-- of the six boards the rungs it has really climbed, rather than starting
-- them all from nothing and asking somebody to re-tick work already done.
--
-- Where each one stands, as reported on 17 September:
--
--   Indiana Bloomington   researched, submitted, approved, students applying
--   Wisconsin-Madison     researched, submitted, approved, students applying
--   Utah                  researched, submitted, approved - nobody has applied
--   Florida State         researched, submitted, approved - nobody has applied
--   Arizona State         researched, submitted - waiting on approval
--   Florida               nothing yet
--
-- Indiana and Wisconsin have all three criteria, so their channel reads live
-- and the dot on the board goes green. Utah and Florida State hold two of
-- three, which is in progress, and their open rung is the one that asks
-- whether a student has come through. Arizona holds one.
--
-- All six boards are Handshake, so the way in is the same employer profile
-- for each. Florida is left without it: nobody has looked at that campus, and
-- filling in the answer to a rung nobody has worked would make Research a
-- formality rather than a check.
--
-- Two honest limits, so nothing here reads as more than it is:
--
--   The completed rungs are dated today, because when each one actually
--   happened was never written down. Each carries a note saying so.
--
--   Research is marked done on five boards without a note of who found what.
--   The link is the evidence, and it is on the record.
--
-- ONE statement, and no procedural block: see the note at the foot of
-- 17a-research-rung-rehearsal.sql for why. Safe to run twice -- a board it
-- has already set carries a stamp and is skipped.
-- ===========================================================================

WITH want (slug, done_through, board_url, posting_url, services_email, note) AS (
  VALUES
    ('indiana-bloomington', 4,
     'https://app.joinhandshake.com/profiles/sgqdtb',
     'https://app.joinhandshake.com/public/jobs/11411696',
     NULL::text, NULL::text),
    ('uw-madison', 4,
     'https://app.joinhandshake.com/profiles/sgqdtb',
     'https://app.joinhandshake.com/public/jobs/11428552',
     NULL, NULL),
    ('u-utah', 3,
     'https://app.joinhandshake.com/profiles/sgqdtb',
     'https://app.joinhandshake.com/public/jobs/11443313',
     NULL, NULL),
    ('florida-state', 3,
     'https://app.joinhandshake.com/profiles/sgqdtb',
     'https://app.joinhandshake.com/public/jobs/11428606',
     NULL, NULL),
    ('arizona-state', 2,
     'https://app.joinhandshake.com/profiles/sgqdtb',
     NULL,
     'employers.careerservices@asu.edu',
     'Waiting on approval. Employer Services emailed.'),
    ('u-florida', 0, NULL, NULL, NULL, NULL)
),

-- The boards this run covers. A stamped board is skipped, which is what
-- makes a second run do nothing.
chan AS (
  SELECT ch.id AS channel_id,
         ch.campus_id,
         ch.detail            AS detail_now,
         ch.first_activated_at,
         w.slug, w.done_through, w.board_url, w.posting_url, w.services_email, w.note
    FROM campus_channels ch
    JOIN student_outreach_campuses c ON c.id = ch.campus_id
    JOIN want w ON w.slug = c.slug
   WHERE ch.channel = 'st3'
     AND ch.detail->>'job_board_seeded' IS DISTINCT FROM 'v1'
),

-- Anything already queued against these boards, so a rung is not waiting
-- twice. Only pending rows are touched: a completed one is work somebody did.
wipe AS (
  DELETE FROM site_tasks t
   USING chan
   WHERE t.campus_id = chan.campus_id
     AND t.channel = 'st3'
     AND t.record_id IS NULL
     AND t.status = 'pending'
  RETURNING t.id
),

-- The rungs already climbed, one row each.
history AS (
  INSERT INTO site_tasks
    (campus_id, channel, task_type, status, due_at, completed_at, payload, notes)
  SELECT chan.campus_id,
         'st3',
         'activation_job_board_check',
         'completed',
         date_trunc('day', now()),
         now(),
         jsonb_build_object('step', s.step, 'round', 0),
         'Recorded from the state of the board on 17 September, not logged at the time.'
    FROM chan, generate_series(0, chan.done_through - 1) AS s(step)
  RETURNING campus_id
),

-- The rung each board is on now. A board that has finished the ladder is
-- waiting on its seasonal look instead, roughly a term out.
open_rung AS (
  INSERT INTO site_tasks
    (campus_id, channel, task_type, status, due_at, payload, notes)
  SELECT chan.campus_id,
         'st3',
         'activation_job_board_check',
         'pending',
         CASE WHEN chan.done_through >= 4
              THEN date_trunc('day', now()) + interval '120 days'
              ELSE date_trunc('day', now()) END,
         jsonb_build_object('step', chan.done_through, 'round', 0),
         chan.note
    FROM chan
  RETURNING campus_id
),

-- What the channel itself holds: the criteria the green dot reads, the two
-- links, and the stamp that makes this re-runnable.
lit AS (
  UPDATE campus_channels ch
     SET criteria = CASE
           WHEN chan.done_through >= 4
             THEN jsonb_build_object('submitted', now(), 'approved', now(), 'visible', now())
           WHEN chan.done_through = 3
             THEN jsonb_build_object('submitted', now(), 'approved', now())
           WHEN chan.done_through = 2
             THEN jsonb_build_object('submitted', now())
           ELSE '{}'::jsonb
         END,
         status = CASE
           WHEN chan.done_through >= 4 THEN 'live'
           WHEN chan.done_through >= 2 THEN 'in_progress'
           ELSE 'not_yet'
         END,
         -- Set once and never cleared: the channel did activate, and that
         -- does not stop being true if the posting later lapses.
         first_activated_at = CASE
           WHEN chan.done_through >= 4 THEN COALESCE(ch.first_activated_at, now())
           ELSE ch.first_activated_at
         END,
         detail = COALESCE(ch.detail, '{}'::jsonb)
           || jsonb_build_object('job_board_seeded', 'v1')
           || CASE WHEN chan.board_url IS NULL THEN '{}'::jsonb
                   ELSE jsonb_build_object('board_url', chan.board_url) END
           || CASE WHEN chan.posting_url IS NULL THEN '{}'::jsonb
                   ELSE jsonb_build_object('posting_url', chan.posting_url) END
           || CASE WHEN chan.services_email IS NULL THEN '{}'::jsonb
                   ELSE jsonb_build_object('services_email', chan.services_email) END,
         updated_at = now()
    FROM chan
   WHERE ch.id = chan.channel_id
  RETURNING ch.id
)

SELECT chan.slug                                        AS campus,
       chan.done_through                                AS rungs_done,
       CASE
         WHEN chan.done_through >= 4 THEN 'live'
         WHEN chan.done_through >= 2 THEN 'in progress'
         ELSE 'not yet'
       END                                              AS channel_reads,
       CASE
         WHEN chan.done_through = 0 THEN 'Research'
         WHEN chan.done_through = 1 THEN 'Confirm it is submitted'
         WHEN chan.done_through = 2 THEN 'Confirm it is approved'
         WHEN chan.done_through = 3 THEN 'Confirm the first student has applied'
         ELSE 'Confirm the listing is still live'
       END                                              AS waiting_on,
       chan.posting_url IS NOT NULL                     AS has_listing,
       (SELECT count(*) FROM wipe)                      AS stale_rows_cleared_in_all
  FROM chan
 ORDER BY chan.slug;
