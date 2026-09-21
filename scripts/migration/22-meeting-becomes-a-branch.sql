-- Renumber the two provider rungs that moved when the meeting stopped
-- being a gate.
--
-- The providers ladder used to run: follow ups, schedule the meeting (4),
-- log the meeting (5), confirm they signed up (6). It now runs: follow ups,
-- send the onboarding pack (4), confirm they can receive a student (5),
-- confirm they signed up (6) -- with the two meeting rungs moved to the end
-- of the ladder as branches, at 9 and 10, reached only when a provider asks
-- for a meeting.
--
-- Steps 6, 7 and 8 keep their positions, so only 4 and 5 have to move. Every
-- task row carries its rung as an integer in payload.step, so without this
-- a row that meant schedule the meeting would start meaning send the pack.
--
-- Safe on an empty result: if no provider has reached a meeting rung, this
-- updates nothing and reports 0. Idempotent: after it runs the rows say 9
-- and 10, which the filter no longer matches.
--
-- One statement. Run it once, in the Supabase SQL editor.

with moved as (
  update student_outreach_tasks t
  set payload = jsonb_set(
        t.payload,
        '{step}',
        to_jsonb(case (t.payload->>'step')::int when 4 then 9 else 10 end)
      )
  from student_outreach o
  where o.id = t.outreach_id
    and o.kind = 'provider'
    and t.payload ? 'step'
    and (t.payload->>'step')::int in (4, 5)
  returning (t.payload->>'step')::int as now_at
)
select
  count(*) as rows_moved,
  count(*) filter (where now_at = 9) as schedule_the_meeting,
  count(*) filter (where now_at = 10) as log_the_meeting
from moved;
