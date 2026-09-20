-- Undo today's provider task work. Run 23a first and read what it lists.
--
-- The rule is about when a row was created, not what state it is in.
--
--   * A task created today exists only because of today. It goes, whether
--     it was completed or is still waiting.
--   * A task created before today but completed today is older work that
--     today advanced. It is reopened, and loses the notes, the outcome and
--     any typed fields, because all three were written today in the same
--     update that closed it.
--
-- Archived records stay archived. An earlier version put anything archived
-- and edited today back to researched, and that matched nine records
-- archived long before -- last_edited_at is stamped by any edit, so it does
-- not say when the archiving happened, and no column does. A record archived
-- today by pressing Not interested will have its task reopened and stay
-- archived; unarchive it from the record menu if you want it back.
--
-- The two task rules are deliberately disjoint, which is what makes this
-- safe to run twice: the first version reopened by completion date and then
-- deleted by creation date, so a second run ate the rows the first had just
-- put back.
--
-- One edge it does not cover: a provider added by hand today has no task
-- older than today, so it is left with none. Nothing added one, but 23a
-- would show it as a record with rows to delete and none to reopen.
--
-- Records go back to 'researched', which is what the board's own unarchive
-- does. If a record was something else before today, it will need setting by
-- hand; 23a names them so that is visible in advance.
--
-- One statement.

with deleted as (
  delete from student_outreach_tasks t
  using student_outreach o
  where o.id = t.outreach_id
    and o.kind = 'provider'
    and t.created_at >= current_date
  returning t.id
),
reopened as (
  update student_outreach_tasks t
  set status = 'pending',
      completed_at = null,
      completed_by = null,
      notes = null,
      payload = (t.payload - 'outcome') - 'fields'
  from student_outreach o
  where o.id = t.outreach_id
    and o.kind = 'provider'
    and t.status = 'completed'
    and t.completed_at >= current_date
    and t.created_at < current_date
  returning t.id
)
select
  (select count(*) from deleted) as tasks_deleted,
  (select count(*) from reopened) as tasks_reopened;
