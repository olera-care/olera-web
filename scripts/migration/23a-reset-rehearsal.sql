-- What the reset would undo. Reads only. Run 23-which-days first, then this.
--
-- SET THE WINDOW. The two dates in the window CTE below are the only thing
-- to edit. from_day is inclusive, to_day is exclusive, so the defaults below
-- cover the 20th and the 21st and stop before the 22nd. Timestamps are UTC,
-- so an evening session can land on the next day; 23-which-days shows which
-- days actually carry activity.
--
-- An earlier version of this keyed off current_date, which quietly stopped
-- matching anything once the date rolled over. An explicit window says what
-- it will touch and keeps saying it tomorrow.
--
-- Two kinds of change: tasks completed in the window, and the tasks those
-- completions queued. This lists both, per record, so the scope is visible
-- before anything is undone.
--
-- Archived records are spared whole. Archiving one is a real decision, so
-- the record keeps its tasks, its notes and its outcomes, and stays
-- archived. They show as kept = yes, reason = archived.
--
-- The backfilled history from Gracie is not in scope: those rows carry their
-- real completion dates in July and August. Nor are field edits -- nothing
-- distinguishes a phone number corrected in the window from one corrected
-- last week.
--
-- Anything spared is listed with kept = yes and why, so the keep rule is
-- visible rather than silent. A spared record shows zero in both would
-- columns; the touched column still shows what happened to it.
--
-- One statement.

with window_days as (
  select date '2026-09-20' as from_day, date '2026-09-22' as to_day
),

-- Records to spare, in three ways.
--
-- Archived: any provider whose record is archived. Nothing on it is touched.
--
-- By hand: put an organization_name in the list below. Duplicated names are
-- all spared, which is the safe direction to be wrong in.
--
-- By note: put #keep anywhere in the note when you log a real advance. Any
-- provider with a task completed in the window carrying it is spared whole
-- -- every task on it, not just the one you wrote on -- because advancing a
-- record properly means the chain should stand.

keep as (
  select
    o.id,
    case
      when o.status = 'archived' then 'archived'
      when o.organization_name in (
        -- add names here, one per line, comma separated
        'Danville Support Services',
        'Arosa Salt Lake',
        'Compassionate Home Care',
        'Cornerstone Caregiving - Madison Home Care'
      ) then 'named'
      else 'noted'
    end as reason
  from student_outreach o
  where o.kind = 'provider'
    and (
      o.status = 'archived'
      or o.organization_name in (
        'Danville Support Services',
        'Arosa Salt Lake',
        'Compassionate Home Care',
        'Cornerstone Caregiving - Madison Home Care'
      )
      or exists (
        select 1
        from student_outreach_tasks t, window_days w
        where t.outreach_id = o.id
          and t.completed_at >= w.from_day
          and t.completed_at < w.to_day
          and t.notes ilike '%#keep%'
      )
    )
)
select
  o.organization_name,
  o.status as record_status,
  case when k.id is null then 'no' else 'yes' end as kept,
  coalesce(k.reason, 'not kept') as reason,
  count(*) filter (where k.id is null
                     and t.status = 'completed'
                     and t.completed_at >= w.from_day
                     and t.completed_at < w.to_day
                     and t.created_at < w.from_day) as would_reopen,
  count(*) filter (where k.id is null
                     and t.created_at >= w.from_day
                     and t.created_at < w.to_day) as would_delete,
  string_agg(
    distinct (t.payload->>'step') || ' ' || coalesce(t.payload->>'outcome', 'pending'),
    ', ' order by (t.payload->>'step') || ' ' || coalesce(t.payload->>'outcome', 'pending')
  ) as touched
from student_outreach o
join student_outreach_tasks t on t.outreach_id = o.id
cross join window_days w
left join keep k on k.id = o.id
where o.kind = 'provider'
  and (
    (t.completed_at >= w.from_day and t.completed_at < w.to_day)
    or (t.created_at >= w.from_day and t.created_at < w.to_day)
  )
group by o.id, o.organization_name, o.status, k.id, k.reason
order by o.organization_name;
