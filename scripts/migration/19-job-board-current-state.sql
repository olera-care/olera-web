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
--
-- It also uses nothing but SELECT, INSERT and UPDATE. The first version
-- cleared stale rows with a removal step inside a CTE, and the Supabase
-- editor cut the statement in half at that point, appended a terminator of
-- its own, and reported a syntax error against the text it had just written.
-- Its parser copes with the other two shapes inside a CTE and not with that
-- one, and it does not cope with a set-returning function either.
--
-- So a board that already holds job board tasks is skipped rather than
-- cleared, which is the better rule anyway: this run is for boards that have
-- none, and one that has some is work somebody did rather than something to
-- tidy away. The report names which were skipped.
--
-- Keep those two shapes out of this file, comments included. A parser naive
-- enough to cut a statement in half is naive enough to match a keyword in a
-- comment.
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

-- Every board, and whether this run touches it. A board is left alone if it
-- carries the stamp from a previous run, or if it already holds job board
-- tasks -- which would mean somebody has been working it and these rows are
-- not the truth about it any more.
board AS (
  SELECT ch.id AS channel_id,
         ch.campus_id,
         ch.detail             AS detail_now,
         ch.first_activated_at AS lit_at,
         w.slug, w.done_through, w.board_url, w.posting_url, w.services_email, w.note,
         (ch.detail->>'job_board_seeded' IS DISTINCT FROM 'v1'
          AND NOT EXISTS (SELECT 1 FROM site_tasks t
                           WHERE t.campus_id = ch.campus_id
                             AND t.channel = 'st3'
                             AND t.record_id IS NULL)) AS apply
    FROM campus_channels ch
    JOIN student_outreach_campuses c ON c.id = ch.campus_id
    JOIN want w ON w.slug = c.slug
   WHERE ch.channel = 'st3'
),

chan AS (SELECT * FROM board WHERE apply),

-- The rungs already climbed, one row each. A plain join against four
-- literal numbers, for the reason given at the top.
rungs (step) AS (VALUES (0), (1), (2), (3)),

history AS (
  INSERT INTO site_tasks
    (campus_id, channel, task_type, status, due_at, completed_at, payload, notes)
  SELECT chan.campus_id,
         'st3',
         'activation_job_board_check',
         'completed',
         date_trunc('day', now()),
         now(),
         jsonb_build_object('step', rungs.step, 'round', 0),
         'Recorded from the state of the board on 17 September, not logged at the time.'
    FROM chan
    JOIN rungs ON rungs.step < chan.done_through
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
           WHEN chan.done_through >= 4 THEN COALESCE(chan.lit_at, now())
           ELSE chan.lit_at
         END,
         detail = COALESCE(chan.detail_now, '{}'::jsonb)
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

SELECT board.slug                                       AS campus,
       board.apply                                      AS applied,
       board.done_through                               AS rungs_done,
       CASE
         WHEN board.done_through >= 4 THEN 'live'
         WHEN board.done_through >= 2 THEN 'in progress'
         ELSE 'not yet'
       END                                              AS channel_reads,
       CASE
         WHEN board.done_through = 0 THEN 'Research'
         WHEN board.done_through = 1 THEN 'Confirm it is submitted'
         WHEN board.done_through = 2 THEN 'Confirm it is approved'
         WHEN board.done_through = 3 THEN 'Confirm the first student has applied'
         ELSE 'Confirm the listing is still live'
       END                                              AS waiting_on,
       board.posting_url IS NOT NULL                    AS has_listing
  FROM board
 ORDER BY board.slug;
