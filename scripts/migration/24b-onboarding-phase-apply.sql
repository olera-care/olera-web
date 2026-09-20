-- Renumber the provider rungs that moved when onboarding gained a phase.
-- Run 24a first; it should report nothing, and this then moves nothing.
--
--   6 -> 7, 7 -> 8, 8 -> 9, 9 -> 6, 10 -> 6
--
-- Steps 0 to 5 stay where they are. The mapping is a permutation with
-- overlaps -- 8 goes to 9 while 9 goes to 6 -- and that is safe here because
-- every new value is computed from the snapshot the statement started with,
-- not from rows it has already written.
--
-- Unlike migration 22, the new numbers land back inside the set being
-- matched -- 6 becomes 7 and 7 becomes 8, so a second run would permute the
-- ladder again. Running it twice on a fixture did exactly that. So each row
-- it moves is stamped, and a stamped row is skipped. That is what makes it
-- safe to run twice rather than merely unlikely to be.
--
-- One statement.

with moved as (
  update student_outreach_tasks t
  set payload = t.payload || jsonb_build_object(
        'step',
        case (t.payload->>'step')::int
          when 6 then 7
          when 7 then 8
          when 8 then 9
          when 9 then 6
          else 6
        end,
        'rung_map_24', true
      )
  from student_outreach o
  where o.id = t.outreach_id
    and o.kind = 'provider'
    and t.payload ? 'step'
    and not (t.payload ? 'rung_map_24')
    and (t.payload->>'step')::int in (6, 7, 8, 9, 10)
  returning (t.payload->>'step')::int as now_at
)
select
  count(*) as rows_moved,
  count(*) filter (where now_at = 6) as hold_the_meeting,
  count(*) filter (where now_at = 7) as ready,
  count(*) filter (where now_at = 8) as seasonal,
  count(*) filter (where now_at = 9) as something_else
from moved;
