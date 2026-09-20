-- Put back the providers that today archived. RUN THIS BEFORE 23b.
--
-- Order matters. 23b clears the outcome off every task it reopens, and the
-- outcome is how this finds them, so running 23b first leaves nothing to
-- match on.
--
-- An earlier version of the reset offered to un-archive anything archived
-- and edited today, which matched nine records archived long before:
-- last_edited_at is stamped by any edit at all. This matches on the act
-- instead. A provider is put back only when it is archived now and has a
-- task completed today carrying an outcome that archives -- a refusal, or a
-- stop reason. That is evidence of the archiving, not of an edit.
--
-- Records go back to researched, which is what the board does when you
-- unarchive one by hand.
--
-- Safe on an empty result. Running it twice finds nothing the second time,
-- because the first run left nothing archived that matches.
--
-- One statement.

with revived as (
  update student_outreach o
  set status = 'researched'
  where o.kind = 'provider'
    and o.status = 'archived'
    and exists (
      select 1
      from student_outreach_tasks t
      where t.outreach_id = o.id
        and t.completed_at >= current_date
        and (
          t.payload->>'outcome' = 'Not interested'
          or t.payload->>'outcome' like 'Can%'
        )
    )
  returning o.organization_name
)
select count(*) as records_unarchived, string_agg(organization_name, ', ') as which
from revived;
