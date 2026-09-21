-- ===========================================================================
-- Step 8 -- put the work Gracie already did onto the ladder. WRITES.
-- ===========================================================================
-- 110 live providers carry her calls, sitting as identical completed tasks
-- with no outcome. This reads her notes and puts each record where it is.
--
-- Her process was research, the confirming call, then send the programme, so
-- a record she reached counts all three as done and every later call is a
-- numbered follow-up. A note carrying an at sign means she got an address.
-- A refusal beats an address. A dead number is not a strike. Anything the
-- classifier cannot read keeps its note and is given no outcome.
--
-- Expected: 110 sorted, 71 to follow up, 10 archived, deepest round 4.
-- The full reasoning, and the counts it came from, are in the commit message.
--
-- ONE statement, nothing but SELECT, INSERT and UPDATE -- see the note at the
-- foot of 17a. Safe to run twice: a sorted record carries a stamp.
-- ===========================================================================

WITH call_log AS (
  SELECT so.id                                           AS outreach_id,
         c.call_at,
         row_number() OVER (PARTITION BY so.id ORDER BY c.call_at, s.row_no, c.n) AS seq,
         c.remark,
         (s.email IS NOT NULL OR s.email_sent IS NOT NULL)  AS row_has_email,
         (c.remark ILIKE '%@%')                             AS has_address,
         CASE
           WHEN c.remark IS NULL THEN 'no remark'
           WHEN c.remark ILIKE '%does not exist%' OR c.remark ILIKE '%no longer in service%'
             OR c.remark ILIKE '%not in service%' OR c.remark ILIKE '%disconnected%'
             OR c.remark ILIKE '%no longer exist%'                  THEN 'dead number'
           WHEN c.remark ILIKE '%not interested%' OR c.remark ILIKE '%wont be interested%'
             OR c.remark ILIKE '%not right for%'  OR c.remark ILIKE '%pass for now%'
             OR c.remark ILIKE '%have to pass%'   OR c.remark ILIKE '%said no%'
             OR c.remark ILIKE '%not want to participate%'           THEN 'not interested'
           WHEN c.remark ILIKE '%talked%'   OR c.remark ILIKE '%spoke%'
             OR c.remark ILIKE '%speak%'    OR c.remark ILIKE '%spoken%'
             OR c.remark ILIKE '%answered by%' OR c.remark ILIKE '%hangs up%'
             OR c.remark ILIKE '%hung up%'  OR c.remark ILIKE '%gave%'
             OR c.remark ILIKE '%provided%' OR c.remark ILIKE '%refuse%'  THEN 'reached'
           WHEN c.remark ILIKE '%voicemail%' OR c.remark ILIKE '%voice mail%'
             OR c.remark ILIKE '%vm%'        OR c.remark ILIKE '%left message%'
             OR c.remark ILIKE '%mailbox%'                           THEN 'voicemail'
           WHEN c.remark ILIKE '%no answer%' OR c.remark ILIKE '%no one answered%'
             OR c.remark ILIKE '%asnwer%'    OR c.remark ILIKE '%busy%'
             OR c.remark ILIKE '%ringing%'   OR c.remark ILIKE '%no one is available%'
             OR c.remark ILIKE '%could not go through%'              THEN 'no answer'
           ELSE 'unclassified'
         END                                                AS label
    FROM medjobs_migration_staging s
    JOIN student_outreach so ON so.id = s.outreach_id
    CROSS JOIN LATERAL (VALUES
        (1, s.call1, s.remark1), (2, s.call2, s.remark2),
        (3, s.call3, s.remark3), (4, s.call4, s.remark4)
    ) AS c(n, call_at, remark)
   WHERE so.kind = 'provider'
     AND so.status <> 'archived'
     AND so.research_data->>'gracie_history' IS DISTINCT FROM 'v1'
     AND c.call_at IS NOT NULL
),

prov AS (
  SELECT outreach_id,
         count(*)                                                      AS calls,
         min(call_at)                                                  AS first_call,
         (bool_or(has_address) OR bool_or(row_has_email))              AS got_address,
         bool_or(label = 'not interested')                             AS refused,
         min(seq) FILTER (WHERE has_address OR label = 'reached')      AS reached_seq,
         max(call_at) FILTER (WHERE has_address OR label = 'reached')  AS reached_at
    FROM call_log
   GROUP BY outreach_id
),

landing AS (
  SELECT p.*,
         LEAST(7, 1 + (SELECT count(*) FROM call_log l
                        WHERE l.outreach_id = p.outreach_id
                          AND p.reached_seq IS NOT NULL
                          AND l.seq > p.reached_seq))                  AS follow_up_round
    FROM prov p
),

relabelled AS (
  UPDATE student_outreach_tasks t
     SET payload = t.payload
           || jsonb_build_object(
                'gracie_history', 'v1',
                'outcome', CASE
                  WHEN l.label = 'voicemail'      THEN 'Voicemail'
                  WHEN l.label = 'no answer'      THEN 'No answer'
                  WHEN l.label = 'not interested' THEN 'Not interested'
                  WHEN l.label = 'reached' AND d.got_address THEN 'Confirmed contact'
                  ELSE NULL
                END)
           || CASE
                WHEN d.reached_seq IS NOT NULL AND l.seq > d.reached_seq
                  THEN jsonb_build_object(
                         'step', 3,
                         'round', LEAST(7, l.seq - d.reached_seq))
                ELSE '{}'::jsonb
              END
    FROM call_log l
    JOIN landing d ON d.outreach_id = l.outreach_id
   WHERE t.outreach_id = l.outreach_id
     AND t.status = 'completed'
     AND (t.payload->>'call')::INT IS NOT NULL
     AND t.completed_at::date = l.call_at
     AND NOT t.payload ? 'gracie_history'
  RETURNING t.id
),

researched AS (
  INSERT INTO student_outreach_tasks
    (outreach_id, task_type, status, due_at, completed_at, payload, notes)
  SELECT d.outreach_id, 'research_initial', 'completed',
         d.first_call, d.first_call::timestamptz,
         jsonb_build_object('step', 0, 'round', 0, 'gracie_history', 'v1'),
         'Researched before calling, in the outreach sheet.'
    FROM landing d
   WHERE NOT EXISTS (
     SELECT 1 FROM student_outreach_tasks t
      WHERE t.outreach_id = d.outreach_id
        AND COALESCE((t.payload->>'step')::INT, 0) = 0)
  RETURNING outreach_id
),

sent AS (
  INSERT INTO student_outreach_tasks
    (outreach_id, task_type, status, due_at, completed_at, payload, notes)
  SELECT d.outreach_id, 'outreach_contact', 'completed',
         COALESCE(d.reached_at, d.first_call),
         COALESCE(d.reached_at, d.first_call)::timestamptz,
         jsonb_build_object('step', 2, 'round', 0, 'gracie_history', 'v1',
                            'outcome', 'Log email sent'),
         'Programme sent after the confirming call, from the outreach sheet.'
    FROM landing d
   WHERE d.got_address
     AND NOT d.refused
     AND NOT EXISTS (
       SELECT 1 FROM student_outreach_tasks t
        WHERE t.outreach_id = d.outreach_id
          AND COALESCE((t.payload->>'step')::INT, 0) = 2)
  RETURNING outreach_id
),

moved AS (
  UPDATE student_outreach_tasks t
     SET payload = t.payload || jsonb_build_object(
           'gracie_history', 'v1',
           'step',  CASE WHEN d.got_address AND NOT d.refused THEN 3 ELSE 1 END,
           'round', CASE WHEN d.got_address AND NOT d.refused THEN d.follow_up_round ELSE 0 END),
         due_at = CURRENT_DATE,
         status = CASE WHEN d.refused THEN 'cancelled' ELSE t.status END
    FROM landing d
   WHERE t.outreach_id = d.outreach_id
     AND t.status = 'pending'
     AND NOT t.payload ? 'gracie_history'
  RETURNING t.id
),

stamped AS (
  UPDATE student_outreach so
     SET status = CASE WHEN d.refused THEN 'archived' ELSE so.status END,
         research_data = COALESCE(so.research_data, '{}'::jsonb)
           || jsonb_build_object('gracie_history', 'v1')
           || CASE WHEN d.refused
                   THEN jsonb_build_object(
                          'archived_reason', 'Not interested',
                          'archived_at', now(),
                          'archived_from', 'the outreach sheet')
                   ELSE '{}'::jsonb END
    FROM landing d
   WHERE so.id = d.outreach_id
  RETURNING so.id, d.refused AS was_refused
)

SELECT (SELECT count(*) FROM landing)                                  AS providers_sorted,
       (SELECT count(*) FROM landing WHERE got_address AND NOT refused) AS to_follow_up,
       (SELECT max(follow_up_round) FROM landing WHERE got_address AND NOT refused) AS deepest_round,
       (SELECT count(*) FROM stamped WHERE was_refused)                AS archived_refused,
       (SELECT count(*) FROM relabelled)                               AS calls_relabelled,
       (SELECT count(*) FROM researched)                               AS research_written,
       (SELECT count(*) FROM sent)                                     AS programme_written,
       (SELECT count(*) FROM moved)                                    AS open_tasks_moved;
