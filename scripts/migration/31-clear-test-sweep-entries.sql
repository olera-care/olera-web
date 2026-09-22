-- Clear the test entries sitting on Indiana's advisor sweep.
--
-- Those two rows ("Test office." and "Test") were typed to exercise the form
-- while the sweep still held everything in a JSON blob. Now that an entry
-- becomes a record the moment it is added, the next save or the finish button
-- would turn them into two real advising offices. This empties the blob so the
-- sweep starts clean.
--
-- Safe: it touches one pending site_tasks row and creates nothing. Run it
-- before using the sweep again.

-- What is there now.
select
  c.name                                as campus,
  t.status,
  jsonb_array_length(coalesce(t.payload->'found', '[]'::jsonb)) as entries,
  t.payload->'found'                    as entries_json
from site_tasks t
join campuses c on c.id = t.campus_id
where t.task_type = 'advisor_sweep'
  and t.status = 'pending';

-- Empty it.
update site_tasks t
set payload = jsonb_set(coalesce(t.payload, '{}'::jsonb), '{found}', '[]'::jsonb)
from campuses c
where c.id = t.campus_id
  and t.task_type = 'advisor_sweep'
  and t.status = 'pending'
  and c.name = 'Indiana University Bloomington';

-- Confirm.
select
  c.name  as campus,
  t.status,
  jsonb_array_length(coalesce(t.payload->'found', '[]'::jsonb)) as entries
from site_tasks t
join campuses c on c.id = t.campus_id
where t.task_type = 'advisor_sweep';
