-- Which rows are sitting on the rungs that moved, and who wrote them.
-- Reads only.
--
-- 24a found six where it expected none, so before anything renumbers them we
-- need to know which version of the ladder wrote them. The outcome label is
-- the giveaway: the labels all changed today, so a row saying Log the pack
-- sent came from the new ladder and one saying Signed up or Meeting booked
-- came from the old one. created_at says when, which settles it either way.
--
-- One statement.

select
  o.organization_name,
  (t.payload->>'step')::int as step,
  t.status,
  coalesce(t.payload->>'outcome', '(none recorded)') as outcome,
  t.created_at::date as created,
  t.completed_at::date as completed,
  t.task_type,
  left(coalesce(t.notes, ''), 60) as note_start
from student_outreach_tasks t
join student_outreach o on o.id = t.outreach_id
where o.kind = 'provider'
  and t.payload ? 'step'
  and (t.payload->>'step')::int >= 5
order by o.organization_name, step, t.created_at;
