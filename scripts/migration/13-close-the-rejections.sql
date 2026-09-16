-- ===========================================================================
-- Step 4 — close the records where somebody actually said no
-- ===========================================================================
-- WRITES. Rehearsal mode; one line commits. Run after 10 and 12.
--
-- Twenty-six rows in the spreadsheet record an explicit refusal, and most
-- of them name the person who gave it: "Was able to talk to Sally and she
-- said they're not interested", "BRENT NOT INTERESTED", "Spoke with Tina
-- and she confirmed that they're not interested". The migration queued
-- every one of them for another call.
--
-- That is the worst thing the migration could do. Ringing a voicemail
-- twice is a wasted minute; ringing somebody who already declined costs
-- the relationship, and these are employers and campus offices we will
-- want to go back to next year.
--
-- Unlike a rung, this is safe to read from the remark text. "Not
-- interested" is not a judgement call, and every match was read by hand
-- before this was written: all twenty-six are refusals, none are
-- ambiguous. The phrases are deliberately narrow — "hangs up" and
-- "refuse" are NOT included, because "did not speak a word then hangs up"
-- is a failed call, not a decision.
--
-- What it does: sets the status to not_interested, cancels the open task
-- so nobody rings them, and flags the record so the decision is visible
-- and reversible. The call history stays exactly as it is.
-- ===========================================================================

DO $$
DECLARE
  v_apply  BOOLEAN := FALSE;        -- <<< the only line to change
  n_found  INT := 0;
  n_closed INT := 0;
  n_tasks  INT := 0;
BEGIN
  CREATE TEMP TABLE _said_no ON COMMIT DROP AS
  SELECT DISTINCT so.id, so.organization_name, so.kind
    FROM student_outreach so
    JOIN student_outreach_tasks t ON t.outreach_id = so.id
   WHERE so.research_data->>'migration_batch' IN ('sheet-overlay-v1', 'sheet-create-v1')
     AND coalesce((t.payload->>'migrated')::boolean, false)
     AND t.notes ~* '(not interested|not into it|no thank you|declined|do not (call|contact) (us|them|again))'
     -- Somebody who declined and then had a later conversation that went
     -- somewhere is not closed on the strength of the earlier no.
     AND NOT EXISTS (
       SELECT 1 FROM student_outreach_tasks t2
        WHERE t2.outreach_id = so.id
          AND t2.completed_at > t.completed_at
          AND t2.notes ~* '(interested|will (call|reach|get) back|send (it|the)|good email|best email|forward)'
          AND t2.notes !~* 'not interested');

  SELECT count(*) INTO n_found FROM _said_no;

  UPDATE student_outreach so
     SET status = 'not_interested',
         research_data = so.research_data
           || jsonb_build_object('migration_review', true,
                                 'closed_reason', 'the sheet records an explicit refusal')
    FROM _said_no s
   WHERE so.id = s.id
     AND so.status <> 'not_interested';
  GET DIAGNOSTICS n_closed = ROW_COUNT;

  UPDATE student_outreach_tasks t
     SET status = 'cancelled'
    FROM _said_no s
   WHERE t.outreach_id = s.id
     AND t.status = 'pending';
  GET DIAGNOSTICS n_tasks = ROW_COUNT;

  IF NOT v_apply THEN
    RAISE EXCEPTION
      'REHEARSAL, nothing saved — records where somebody said no % · statuses changed % · open tasks cancelled %. Set v_apply := TRUE to commit.',
      n_found, n_closed, n_tasks;
  END IF;
END $$;

-- ── who was closed, and what they said ───────────────────────────────────
SELECT
  sc.slug,
  so.kind,
  left(so.organization_name, 34) AS name,
  left((SELECT t.notes FROM student_outreach_tasks t
         WHERE t.outreach_id = so.id
           AND t.notes ~* 'not interested|not into it'
         ORDER BY t.completed_at DESC LIMIT 1), 62) AS what_they_said
FROM student_outreach so
JOIN student_outreach_campuses sc ON sc.id = so.campus_id
WHERE so.research_data->>'closed_reason' IS NOT NULL
ORDER BY sc.slug, so.organization_name;
