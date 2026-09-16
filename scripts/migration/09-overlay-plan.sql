-- ===========================================================================
-- Step 2b — what the overlay would do, and twenty rows to check it by
-- ===========================================================================
-- READ-ONLY. One SELECT over the staging table and the directory. Nothing
-- is created, changed or deleted, not even a temp table.
--
-- Run this after 08. It answers two questions:
--
--   1 plan          how many rows land in each bucket, and at which rung
--   2 rung detail   what the board will actually look like afterwards
--   3 check twenty  twenty matched rows shown beside the record they would
--                   attach to — sheet name and phone against directory name
--                   and phone, the calls being migrated, and the rung
--
-- Block 3 is the one to read carefully. If two of the twenty look wrong,
-- stop and say so: the matcher is wrong and the other four hundred will be
-- wrong the same way. The sample is ordered by id so it is stable between
-- runs — you are checking the same twenty each time, not a new draw that
-- might hide a problem.
-- ===========================================================================

WITH plan AS (
  SELECT
    s.*,
    (CASE WHEN s.call1 IS NOT NULL THEN 1 ELSE 0 END
   + CASE WHEN s.call2 IS NOT NULL THEN 1 ELSE 0 END
   + CASE WHEN s.call3 IS NOT NULL THEN 1 ELSE 0 END
   + CASE WHEN s.call4 IS NOT NULL THEN 1 ELSE 0 END) AS calls
  FROM medjobs_migration_staging s
),

block1 AS (
  SELECT
    '1 plan'::text AS section,
    plan_action::text AS label,
    (coalesce(plan_reason, 'no record to attach to'))::text AS detail,
    count(*) AS n
  FROM plan GROUP BY plan_action, plan_reason
),

block2 AS (
  SELECT
    '2 rung detail'::text,
    (CASE WHEN plan_step IS NULL THEN 'not placed on a rung'
          WHEN plan_step = 0 THEN 'step 0 — call to get the right email'
          WHEN plan_step = 2 THEN 'step 2 — follow up 1'
          ELSE 'step ' || plan_step END)::text,
    (calls || ' prior call' || CASE WHEN calls = 1 THEN '' ELSE 's' END
      || ' migrated into history')::text,
    count(*)
  FROM plan
  WHERE outreach_id IS NOT NULL
  GROUP BY plan_step, calls
),

-- Twenty matched rows, side by side with what they would attach to.
block3 AS (
  SELECT
    '3 check twenty'::text,
    (left(p.sheet_name, 30) || '  ·  ' || p.phone)::text AS label,
    ('-> ' || left(coalesce(op.provider_name,'?'), 28)
      || '  ·  ' || coalesce(regexp_replace(op.phone, '\D', '', 'g'), '?')
      || '  ·  ' || coalesce(p.campus_slug,'?')
      || '  ·  ' || p.calls || ' calls'
      || '  ·  ' || coalesce(
           CASE WHEN p.plan_step = 0 THEN 'step 0' WHEN p.plan_step = 2 THEN 'step 2 r1'
                ELSE 'archived' END, '?'))::text AS detail,
    p.calls
  FROM plan p
  LEFT JOIN "olera-providers" op ON op.provider_id = p.matched_provider_id
  WHERE p.outreach_id IS NOT NULL
  ORDER BY p.id
  LIMIT 20
)

SELECT * FROM block1
UNION ALL SELECT * FROM block2
UNION ALL SELECT * FROM block3
ORDER BY 1, 4 DESC, 2;
