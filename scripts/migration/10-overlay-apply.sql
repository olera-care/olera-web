-- ===========================================================================
-- Step 2c — write the spreadsheet history onto the board
-- ===========================================================================
-- WRITES. Ships in rehearsal mode: it does the whole thing, reports the
-- totals on the exception, and rolls back. One line commits.
--
-- Run 08 first (loads and matches), then 09 (shows the plan and the twenty
-- rows to check). Only run this once those twenty look right.
--
-- What it writes, and nothing else:
--
--   · one COMPLETED task per call in the sheet, carrying that calls real
--     date and its remark verbatim. This is the history an admin reads
--     before picking up the phone, and it is copied, never interpreted.
--   · a contact row where the sheet has a real email address and the
--     record has none
--   · the rung, but only where a structured field decided it: step 2 when
--     EMAIL SENT carries a date, step 0 otherwise
--   · an archive status for the sixteen rows whose remark says the number
--     is dead with no replacement named, and the seven that say wrong
--     department
--
-- What it deliberately does NOT do: read a remark and infer a status from
-- it. 317 distinct remark values, 296 of them appearing once, is not a
-- vocabulary — it is prose. Rows needing a judgement are flagged
-- migration_review instead, so a person makes it.
--
-- Where several sheet rows name one record they can disagree. Two shapes
-- occur. One row carrying an EMAIL SENT date while another does not is not
-- really a disagreement: the furthest point reached is the truth, and the
-- rung update only matches step 2 rows, so step 2 wins on its own. An
-- archive row alongside a review row is a real one, and review wins — see
-- the guard on the archive statement.
--
-- Everything is stamped research_data.migration_batch = sheet-overlay-v1,
-- and every task payload carries "migrated": true, so the whole overlay
-- can be found and removed without touching anything else.
-- ===========================================================================

DO $$
DECLARE
  v_apply   BOOLEAN := FALSE;        -- <<< the only line to change
  v_batch   TEXT    := 'sheet-overlay-v1';
  n_hist    INT := 0;
  n_contact INT := 0;
  n_rung    INT := 0;
  n_arch    INT := 0;
  n_review  INT := 0;
  n_rows    INT := 0;
BEGIN
  SELECT count(*) INTO n_rows FROM medjobs_migration_staging WHERE outreach_id IS NOT NULL;
  IF n_rows = 0 THEN
    RAISE EXCEPTION 'Nothing matched. Run 08-load-and-match.sql first.';
  END IF;

  -- ── 1. the call history, verbatim ──────────────────────────────────────
  INSERT INTO student_outreach_tasks
    (outreach_id, task_type, status, due_at, payload, notes, completed_at)
  SELECT
    s.outreach_id, 'outreach_contact', 'completed', c.call_at,
    jsonb_build_object('step', 0, 'round', 0, 'migrated', true,
                       'call', c.n, 'sheet_row', s.row_no, 'migration_batch', v_batch),
    c.remark,
    c.call_at
  FROM medjobs_migration_staging s
  CROSS JOIN LATERAL (VALUES
      (1, s.call1, s.remark1), (2, s.call2, s.remark2),
      (3, s.call3, s.remark3), (4, s.call4, s.remark4)
  ) AS c(n, call_at, remark)
  WHERE s.outreach_id IS NOT NULL
    AND c.call_at IS NOT NULL
    -- Re-runnable: never write the same sheet call twice.
    AND NOT EXISTS (
      SELECT 1 FROM student_outreach_tasks t
       WHERE t.outreach_id = s.outreach_id
         AND (t.payload->>'sheet_row')::int = s.row_no
         AND (t.payload->>'call')::int = c.n
    );
  GET DIAGNOSTICS n_hist = ROW_COUNT;

  -- ── 2. the contact, where the sheet actually has one ───────────────────
  INSERT INTO student_outreach_contacts (outreach_id, name, email)
  SELECT s.outreach_id, '', s.email
    FROM medjobs_migration_staging s
   WHERE s.outreach_id IS NOT NULL
     AND s.email IS NOT NULL AND s.email <> '' AND s.email LIKE '%@%'
     AND NOT EXISTS (
       SELECT 1 FROM student_outreach_contacts c WHERE c.outreach_id = s.outreach_id
     );
  GET DIAGNOSTICS n_contact = ROW_COUNT;

  -- ── 3. the rung, where EMAIL SENT decided it ───────────────────────────
  -- Step 0 records are already sitting at step 0 from the populate, so only
  -- the step 2 ones need their pending task moved.
  -- This task was created by the populate, not by the overlay. It is moved,
  -- not replaced, and it records where it came from — so undoing the
  -- overlay restores its old rung instead of deleting the records only
  -- open task. Deleting it would leave that record with nothing to do.
  UPDATE student_outreach_tasks t
     SET payload = t.payload
           || jsonb_build_object('step', 2, 'round', 1,
                                 'rung_moved_by', v_batch,
                                 'rung_was', jsonb_build_object(
                                    'step',  coalesce(t.payload->>'step','0'),
                                    'round', coalesce(t.payload->>'round','0')))
    FROM medjobs_migration_staging s
   WHERE t.outreach_id = s.outreach_id
     AND t.status = 'pending'
     AND s.plan_step = 2
     AND coalesce((t.payload->>'migrated')::boolean, false) = false
     AND NOT t.payload ? 'rung_moved_by';
  GET DIAGNOSTICS n_rung = ROW_COUNT;

  -- ── 4. archives, only the unambiguous ones ─────────────────────────────
  UPDATE student_outreach so
     SET status = CASE WHEN s.plan_action = 'archive — number dead'
                       THEN 'wrong_contact' ELSE 'not_interested' END,
         research_data = so.research_data
           || jsonb_build_object('migration_batch', v_batch,
                                 'migration_reason', s.plan_reason,
                                 'sheet_row', s.row_no)
    FROM medjobs_migration_staging s
   WHERE so.id = s.outreach_id
     AND s.plan_action LIKE 'archive —%'
     -- A record can be named by several sheet rows. If any one of them
     -- says a replacement number was found, the record is not a dead end
     -- and must not be archived — archiving would discard the lead the
     -- team went and found. The safe direction is always towards review.
     AND NOT EXISTS (
       SELECT 1 FROM medjobs_migration_staging s2
        WHERE s2.outreach_id = s.outreach_id
          AND s2.plan_action LIKE 'review%'
     );
  GET DIAGNOSTICS n_arch = ROW_COUNT;

  UPDATE student_outreach_tasks t
     SET status = 'cancelled'
    FROM medjobs_migration_staging s
   WHERE t.outreach_id = s.outreach_id
     AND t.status = 'pending'
     AND s.plan_action LIKE 'archive —%'
     -- A record can be named by several sheet rows. If any one of them
     -- says a replacement number was found, the record is not a dead end
     -- and must not be archived — archiving would discard the lead the
     -- team went and found. The safe direction is always towards review.
     AND NOT EXISTS (
       SELECT 1 FROM medjobs_migration_staging s2
        WHERE s2.outreach_id = s.outreach_id
          AND s2.plan_action LIKE 'review%'
     );

  -- ── 5. flag everything a person should look at ─────────────────────────
  UPDATE student_outreach so
     SET research_data = so.research_data
           || jsonb_build_object('migration_batch', v_batch,
                                 'migration_review', true,
                                 'migration_reason', s.plan_reason,
                                 'sheet_row', s.row_no)
    FROM medjobs_migration_staging s
   WHERE so.id = s.outreach_id
     AND s.plan_action LIKE 'review —%';
  GET DIAGNOSTICS n_review = ROW_COUNT;

  -- Everything else that got history is stamped too, so the batch is whole.
  UPDATE student_outreach so
     SET research_data = so.research_data
           || jsonb_build_object('migration_batch', v_batch, 'sheet_row', s.row_no)
    FROM medjobs_migration_staging s
   WHERE so.id = s.outreach_id
     AND s.plan_action LIKE 'overlay —%';

  IF NOT v_apply THEN
    RAISE EXCEPTION
      'REHEARSAL, nothing saved — matched rows % · history tasks written % · contacts added % · rungs moved to step 2 % · archived % · flagged for review %. Set v_apply := TRUE to commit.',
      n_rows, n_hist, n_contact, n_rung, n_arch, n_review;
  END IF;
END $$;

-- ── the board, after ─────────────────────────────────────────────────────
SELECT
  sc.slug,
  count(DISTINCT so.id)                                                    AS records,
  count(DISTINCT so.id) FILTER (WHERE so.research_data ? 'sheet_row')      AS with_history,
  count(DISTINCT so.id) FILTER (WHERE so.research_data ? 'migration_review') AS need_review,
  count(t.id) FILTER (WHERE (t.payload->>'migrated')::boolean)             AS migrated_calls
FROM student_outreach_campuses sc
JOIN student_outreach so ON so.campus_id = sc.id AND so.kind = 'provider'
LEFT JOIN student_outreach_tasks t ON t.outreach_id = so.id
GROUP BY sc.slug
ORDER BY with_history DESC;
