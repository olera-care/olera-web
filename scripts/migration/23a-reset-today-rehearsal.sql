-- What a reset of today would undo. Reads only. Run this first.
--
-- Two kinds of change: tasks completed today, and the tasks those
-- completions queued. This lists both, per record, so the scope is visible
-- before anything is undone.
--
-- Archived records are spared whole. Archiving one is a real decision, so
-- the record keeps its tasks, its notes and its outcomes, and stays
-- archived. They show as kept = yes, reason = archived.
--
-- The backfilled history from Gracie is not in scope either: those rows carry their
-- real completion dates in July and August, so filtering on today cannot
-- reach them. Nor are field edits -- nothing distinguishes a phone number
-- corrected today from one corrected last week.
--
-- Anything spared is listed with kept = yes and why, so the keep rule is
-- visible rather than silent. A spared record shows zero in both would
-- columns, because nothing on it would be undone; the touched column still
-- shows what happened to it today.
--
-- One statement.

-- Records to spare, in three ways.
--
-- Archived: any provider whose record is archived. Nothing on it is touched.
--
-- By hand: put an organization_name in the list below. Duplicated names are
-- all spared, which is the safe direction to be wrong in.
--
-- By note: put #keep anywhere in the note when you log a real advance. Any
-- provider with a task completed today carrying it is spared whole -- every
-- task on it, not just the one you wrote on -- because advancing a record
-- properly means the chain should stand.

with keep as (
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
        from student_outreach_tasks t
        where t.outreach_id = o.id
          and t.completed_at >= current_date
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
                     and t.completed_at >= current_date
                     and t.created_at < current_date) as would_reopen,
  count(*) filter (where k.id is null
                     and t.created_at >= current_date) as would_delete,
  string_agg(
    distinct (t.payload->>'step') || ' ' || coalesce(t.payload->>'outcome', 'pending'),
    ', ' order by (t.payload->>'step') || ' ' || coalesce(t.payload->>'outcome', 'pending')
  ) filter (where t.completed_at >= current_date or t.created_at >= current_date) as touched
from student_outreach o
join student_outreach_tasks t on t.outreach_id = o.id
left join keep k on k.id = o.id
where o.kind = 'provider'
  and (t.completed_at >= current_date or t.created_at >= current_date)
group by o.id, o.organization_name, o.status, k.id, k.reason
order by o.organization_name;
