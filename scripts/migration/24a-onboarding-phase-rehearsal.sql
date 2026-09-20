-- What the onboarding renumber would move. Reads only. Run this first.
--
-- The provider ladder gained a phase between the pack and the goal, so five
-- rungs moved. Every task row carries its rung as an integer, so a rung that
-- moves without this would silently re-label the rows pointing at it.
--
--   5  confirm they can receive a student  ->  5  chase the meeting
--   6  confirm they have signed up         ->  7  ready for their first student
--   7  seasonal check                      ->  8  seasonal check
--   8  something else                      ->  9  something else
--   9  schedule the meeting                ->  6  hold the meeting
--  10  log the meeting                     ->  6  hold the meeting
--
-- Steps 0 to 4 do not move. 5 keeps its number and changes meaning, from a
-- set-up check to the rung that chases the fifteen minutes; both are what
-- happens after the pack, so a stray row reads sensibly either way.
--
-- Anything it finds should be from testing today, not from real outreach:
-- nobody has reached these rungs, and migration 22 proved steps 4 and 5 were
-- empty this morning. Check the created date and the outcome label with 24c
-- before concluding otherwise. Test rows are cleared by re-running 23b.
--
-- There is no 24b. One was written to renumber old rows onto the new rungs,
-- and it turned out there were no old rows -- everything at step 5 and above
-- arrived today under the new numbering already. Renumbering it would have
-- broken it, so the script was deleted rather than left lying around.
--
-- One statement.

select
  (t.payload->>'step')::int as step,
  t.status,
  coalesce(t.payload->>'rung_map_24', 'no') as already_moved,
  count(*) as rows
from student_outreach_tasks t
join student_outreach o on o.id = t.outreach_id
where o.kind = 'provider'
  and t.payload ? 'step'
  and (t.payload->>'step')::int >= 5
group by 1, 2, 3
order by 1, 2;
