-- Undo the provider task work done today.
--
-- Run 23a first and read what it lists. If any of them are archived and you
-- want them back, run 23c BEFORE this one -- it finds them by the outcome
-- that archived them, and this clears that outcome.
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
-- Run 23a first: it marks which records the keep rule is sparing.
--
-- One statement.

-- Records to spare, in two ways.
--
-- By hand: put an organization_name in the list below. Duplicated names are
-- all spared, which is the safe direction to be wrong in.
--
-- By note: put #keep anywhere in the note when you log a real advance. Any
-- provider with a task completed today carrying it is spared whole -- every
-- task on it, not just the one you wrote on -- because advancing a record
-- properly means the chain should stand.

with keep as (
  select o.id
  from student_outreach o
  where o.kind = 'provider'
    and (
      o.organization_name in (
        -- add names here, one per line, comma separated
        'Danville Support Services',
        'Arosa Salt Lake',
        'Compassionate Home Care'
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
, deleted as (
  delete from student_outreach_tasks t
  using student_outreach o
  where o.id = t.outreach_id
    and o.kind = 'provider'
    and not exists (select 1 from keep k where k.id = o.id)
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
    and not exists (select 1 from keep k where k.id = o.id)
    and t.status = 'completed'
    and t.completed_at >= current_date
    and t.created_at < current_date
  returning t.id
)
select
  (select count(*) from deleted) as tasks_deleted,
  (select count(*) from reopened) as tasks_reopened;
