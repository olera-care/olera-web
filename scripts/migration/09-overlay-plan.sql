-- ===========================================================================
-- Step 2b — what the overlay would do, and twenty rows to check it by
-- ===========================================================================
-- READ-ONLY. One SELECT over the staging table and the directory. Nothing
-- is created, changed or deleted, not even a temp table.
--
-- Run this after 08. It answers two questions:
--
--   1 plan          how many rows land in each bucket, and why
--   2 rung detail   where the matched records end up, and how many prior
--                   calls each carries
--   3 check twenty  twenty rows that WILL be written, beside the record
--                   they attach to. An earlier version listed every row
--                   with a matched record, which included the ones the
--                   guards had already held back, so a caught row looked
--                   exactly like an accepted one.
--   4 held back     what the guards caught, so they can be judged too
--
-- Block 3 is the one to read carefully. If two of the twenty look wrong,
-- stop: the matcher is wrong and the other four hundred will be wrong the
-- same way. The sample is ordered by id, so it is the same twenty on every
-- run rather than a fresh draw that might hide a problem.
--
-- Written without a single empty-string literal anywhere, including in
-- these comments. An earlier version pluralised a label with a CASE that
-- returned an empty string; read as an escaped quote rather than as an
-- empty string, it threw the rest of the literal out of the string and
-- left Postgres looking for a table named history. A comment carrying the
-- same characters can trip a splitter that does not honour -- comments, so
-- the explanation avoids them too.
--
-- The directory phone is shown exactly as stored rather than stripped,
-- which removes the last one and makes a formatting mismatch visible while
-- you check the twenty.
-- ===========================================================================

WITH plan AS (
  SELECT
    s.id,
    s.sheet_name,
    s.phone,
    s.campus_slug,
    s.matched_provider_id,
    s.outreach_id,
    s.plan_action,
    s.plan_reason,
    s.plan_step,
    (CASE WHEN s.call1 IS NOT NULL THEN 1 ELSE 0 END
   + CASE WHEN s.call2 IS NOT NULL THEN 1 ELSE 0 END
   + CASE WHEN s.call3 IS NOT NULL THEN 1 ELSE 0 END
   + CASE WHEN s.call4 IS NOT NULL THEN 1 ELSE 0 END) AS calls
  FROM medjobs_migration_staging s
),

block1 AS (
  SELECT
    '1 plan'::text                                        AS section,
    plan_action::text                                     AS label,
    coalesce(plan_reason, 'no record to attach to')::text AS detail,
    count(*)                                              AS n
  FROM plan
  GROUP BY plan_action, plan_reason
),

block2 AS (
  SELECT
    '2 rung detail'::text,
    (CASE
       WHEN plan_step = 0 THEN 'step 0 - call to get the right email'
       WHEN plan_step = 2 THEN 'step 2 - follow up 1'
       ELSE 'archived, no open task'
     END)::text,
    ('prior calls on the record: ' || calls)::text,
    count(*)
  FROM plan
  WHERE outreach_id IS NOT NULL
  GROUP BY plan_step, calls
),

block3 AS (
  SELECT
    '3 check twenty - THESE WILL BE WRITTEN'::text,
    (left(p.sheet_name, 30) || ' / ' || p.phone)::text AS label,
    ('MATCHED: ' || left(coalesce(op.provider_name, 'unknown'), 26)
      || ' / ' || coalesce(op.phone, 'no phone')
      || ' / ' || coalesce(p.campus_slug, 'no campus')
      || ' / calls ' || p.calls
      || ' / ' || (CASE
                     WHEN p.plan_step = 2 THEN 'step 2 round 1'
                     ELSE 'step 0'
                   END))::text AS detail,
    p.calls
  FROM plan p
  LEFT JOIN "olera-providers" op ON op.provider_id = p.matched_provider_id
  WHERE p.plan_action LIKE 'overlay%'
  ORDER BY p.id
  LIMIT 20
),

-- What the guards caught. These are NOT written as overlays; they get
-- their history and a flag, and a person decides the rung. Shown so the
-- guards can be judged too — a guard that fires on good rows is as bad as
-- one that misses bad ones.
block4 AS (
  SELECT
    '4 held back for review'::text,
    (left(p.sheet_name, 30) || ' / ' || p.phone)::text,
    (left(p.plan_action, 46) || ' / ' || coalesce(p.campus_slug, 'no campus'))::text,
    p.calls
  FROM plan p
  WHERE p.plan_action LIKE 'review%'
  ORDER BY p.id
  LIMIT 15
)

SELECT * FROM block1
UNION ALL SELECT * FROM block2
UNION ALL SELECT * FROM block3
UNION ALL SELECT * FROM block4
ORDER BY 1, 4 DESC, 2;
