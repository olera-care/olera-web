-- Reaching the providers goal becomes a fact the database holds.
--
-- Until now "They are ready" queued nothing and changed nothing. The record
-- kept whatever status it had, usually researched, and had no open task. On
-- the board that is indistinguishable from a provider nobody has started:
-- both read step 0 with no state. The goal only existed in the browser, and
-- a refresh lost it.
--
-- So the board could not count providers who are ready for students, which
-- is the one number the provider funnel exists to produce.
--
-- Two parts: allow the status, then give it to the providers who already
-- earned it.

ALTER TABLE student_outreach
  DROP CONSTRAINT IF EXISTS student_outreach_status_check;

ALTER TABLE student_outreach
  ADD CONSTRAINT student_outreach_status_check CHECK (status IN (
    'prospect',
    'researched',
    'outreach_sent',
    'engaged',
    'meeting_scheduled',
    'agreed',
    'distributed',
    'active_partner',
    'ready_for_students',
    'not_interested',
    'no_response_closed',
    'do_not_contact',
    'wrong_contact',
    'redirected',
    'archived'
  ));

-- The backfill. A provider is already at the goal if it recorded the goal
-- outcome and has nothing open.
--
-- "They are ready" is the label of both goal actions on the providers
-- ladder, and the completion writes the label into payload.outcome. Matching
-- the label rather than a step number means a renumbered ladder cannot make
-- this wrong, which a step number would.
--
-- Records already closed are left alone. A provider who said they were ready
-- and was later archived is archived; the archiving is the newer fact.

UPDATE student_outreach o
SET status = 'ready_for_students',
    last_edited_at = now()
WHERE o.kind = 'provider'
  AND o.status NOT IN (
    'active_partner',
    'not_interested',
    'no_response_closed',
    'do_not_contact',
    'wrong_contact',
    'archived',
    'ready_for_students'
  )
  AND EXISTS (
    SELECT 1 FROM student_outreach_tasks t
    WHERE t.outreach_id = o.id
      AND t.status = 'completed'
      AND t.payload->>'outcome' = 'They are ready'
  )
  AND NOT EXISTS (
    SELECT 1 FROM student_outreach_tasks t
    WHERE t.outreach_id = o.id
      AND t.status = 'pending'
  );
