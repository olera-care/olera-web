-- Every archived provider, when it was archived, and whether the reset can
-- reach it. Reads only.
--
-- Run this if 23a lists no archived records and you expected some. There are
-- two ways to archive a provider and they leave different traces:
--
--   * Working a task through to Not interested completes that task, so the
--     record shows up in 23a as kept, reason archived.
--   * Archiving straight from the record completes nothing. The pending task
--     is cancelled where it sits, keeping its original creation date, so the
--     record has no activity inside the window and 23a never lists it.
--
-- Either way the reset leaves it alone, because the keep rule matches on the
-- record being archived and asks for no task evidence. The last two columns
-- say what the reset would have done had the record not been spared, so a
-- record archived by working a task shows a one there and a record archived
-- from the record shows zeroes. Both are spared regardless.
--
-- Times are Eastern. The window matches 23a and 23b.
--
-- One statement.

with window_days as (
  select timestamp '2026-09-20 00:00' at time zone 'America/New_York' as from_at,
         timestamp '2026-09-21 00:00' at time zone 'America/New_York' as to_at
)
select
  o.organization_name,
  ((o.research_data->>'archived_at')::timestamptz at time zone 'America/New_York') as archived_at_eastern,
  coalesce(o.research_data->>'archived_reason', 'no reason recorded') as archived_reason,
  count(t.id) filter (
    where t.status = 'completed'
      and t.completed_at >= w.from_at and t.completed_at < w.to_at
      and t.created_at < w.from_at) as reopenable_if_not_spared,
  count(t.id) filter (
    where t.created_at >= w.from_at and t.created_at < w.to_at) as deletable_if_not_spared
from student_outreach o
cross join window_days w
left join student_outreach_tasks t on t.outreach_id = o.id
where o.kind = 'provider'
  and o.status = 'archived'
group by o.id, o.organization_name, o.research_data, w.from_at, w.to_at
order by 2 desc nulls last;
