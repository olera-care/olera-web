-- Undo the provider task work done in the window.
--
-- Run 23-which-days, then 23a, and read what 23a lists. It marks which
-- records the keep rule is sparing and why.
--
-- SET THE WINDOW. The two dates in the window CTE below must match the ones
-- in 23a, or this undoes something other than what you reviewed. They are
-- read in Eastern Time; from_at is inclusive, to_at is exclusive.
--
-- The rule is about when a row was created, not what state it is in.
--
--   * A task created inside the window exists only because of that work. It
--     goes, whether it was completed or is still waiting.
--   * A task created before the window but completed inside it is older work
--     that the window advanced. It is reopened, and loses the notes, the
--     outcome and any typed fields, because all three were written in the
--     same update that closed it.
--
-- Archived records are out of scope entirely. Archiving a provider is a real
-- decision, so the record stays archived and keeps its tasks, its notes and
-- its outcomes. Unarchive one from the record menu if you change your mind.
--
-- The two task rules are deliberately disjoint, which is what makes this safe
-- to run twice: an earlier version reopened by completion date and then
-- deleted by creation date, so a second run ate the rows the first put back.
--
-- One edge it does not cover: a provider added by hand inside the window has
-- no task older than the window, so it is left with none. Nothing added one,
-- but 23a would show it as a record with rows to delete and none to reopen.
--
-- One statement.

with window_days as (
  select timestamp '2026-09-20 00:00' at time zone 'America/New_York' as from_at,
         timestamp '2026-09-21 00:00' at time zone 'America/New_York' as to_at
),

-- Records to spare, in three ways: archived, named below, or carrying #keep
-- in a note written inside the window. Keep this list identical to 23a.

keep as (
  select o.id
  from student_outreach o
  where o.kind = 'provider'
    and (
      o.status = 'archived'
      or o.organization_name in (
        -- add names here, one per line, comma separated
        'Danville Support Services',
        'Arosa Salt Lake',
        'Compassionate Home Care',
        'Cornerstone Caregiving - Madison Home Care',
        'Comfort Keepers of Tallahassee, FL'
      )
      or exists (
        select 1
        from student_outreach_tasks t, window_days w
        where t.outreach_id = o.id
          and t.completed_at >= w.from_at
          and t.completed_at < w.to_at
          and t.notes ilike '%#keep%'
      )
    )
),
deleted as (
  delete from student_outreach_tasks t
  using student_outreach o, window_days w
  where o.id = t.outreach_id
    and o.kind = 'provider'
    and not exists (select 1 from keep k where k.id = o.id)
    and t.created_at >= w.from_at
    and t.created_at < w.to_at
  returning t.id
),
reopened as (
  update student_outreach_tasks t
  set status = 'pending',
      completed_at = null,
      completed_by = null,
      notes = null,
      payload = (t.payload - 'outcome') - 'fields'
  from student_outreach o, window_days w
  where o.id = t.outreach_id
    and o.kind = 'provider'
    and not exists (select 1 from keep k where k.id = o.id)
    and t.status = 'completed'
    and t.completed_at >= w.from_at
    and t.completed_at < w.to_at
    and t.created_at < w.from_at
  returning t.id
)
select
  (select count(*) from deleted) as tasks_deleted,
  (select count(*) from reopened) as tasks_reopened;
