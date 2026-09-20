-- What a reset of today would undo. Reads only. Run this first.
--
-- Three kinds of change were made to provider records today: tasks that were
-- completed, tasks those completions queued, and records that an outcome
-- archived. This lists all three, per record, so the scope is visible before
-- anything is undone.
--
-- Gracie's backfilled history is not in scope: those rows carry their real
-- completion dates in July and August, so filtering on today cannot reach
-- them. Field edits typed into a record are also not in scope -- nothing
-- distinguishes a phone number corrected today from one corrected last week.
--
-- One statement.

select
  o.organization_name,
  o.status as record_status,
  count(*) filter (where t.status = 'completed'
                     and t.completed_at >= current_date
                     and t.created_at < current_date) as would_reopen,
  count(*) filter (where t.created_at >= current_date) as would_delete,
  (o.status = 'archived' and o.last_edited_at >= current_date) as would_unarchive,
  string_agg(
    distinct (t.payload->>'step') || ' ' || coalesce(t.payload->>'outcome', 'pending'),
    ', ' order by (t.payload->>'step') || ' ' || coalesce(t.payload->>'outcome', 'pending')
  ) filter (where t.completed_at >= current_date or t.created_at >= current_date) as touched
from student_outreach o
join student_outreach_tasks t on t.outreach_id = o.id
where o.kind = 'provider'
  and (t.completed_at >= current_date or t.created_at >= current_date
       or (o.status = 'archived' and o.last_edited_at >= current_date))
group by o.id, o.organization_name, o.status, o.last_edited_at
order by o.organization_name;
