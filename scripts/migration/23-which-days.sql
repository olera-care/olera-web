-- Which days hold provider task activity. Reads only. Run this first.
--
-- The reset scripts used to key off current_date, which only worked on the
-- day of the testing. This shows the actual days instead, so the reset
-- window can be set from evidence rather than assumed.
--
-- Days are Eastern Time, matching the clock you were working by, not the
-- UTC the database stores. An evening click therefore stays on the evening
-- you made it.
--
-- Read the two right-hand columns: created is the day a task row was made,
-- completed is the day one was closed. The days your testing touched are the
-- ones with numbers on them.
--
-- One statement.

with created as (
  select date(t.created_at at time zone 'America/New_York') as day, count(*) as n
  from student_outreach_tasks t
  join student_outreach o on o.id = t.outreach_id
  where o.kind = 'provider'
    and t.created_at >= current_date - 30
  group by 1
),
completed as (
  select date(t.completed_at at time zone 'America/New_York') as day, count(*) as n
  from student_outreach_tasks t
  join student_outreach o on o.id = t.outreach_id
  where o.kind = 'provider'
    and t.completed_at >= current_date - 30
  group by 1
),
days as (
  select day from created
  union
  select day from completed
)
select
  d.day,
  to_char(d.day, 'Dy') as weekday,
  coalesce(c.n, 0) as tasks_created,
  coalesce(x.n, 0) as tasks_completed
from days d
left join created c on c.day = d.day
left join completed x on x.day = d.day
order by d.day desc;
