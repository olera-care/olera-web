-- ===========================================================================
-- Do any two sheet rows disagree about the same record? — read-only
-- ===========================================================================
-- The rehearsal archived 5 where the plan counted 8, and flagged 25 where
-- the plan counted 32. Both gaps mean several sheet rows resolve to one
-- record: the history from all of them is written, but a status update
-- lands once.
--
-- That is harmless when the rows agree. It is not harmless when they
-- disagree — one row saying archive and another saying overlay would leave
-- the record archived or not depending on the order the statements ran,
-- which is not a decision anyone made.
--
-- Block 1 counts records by how many sheet rows point at them.
-- Block 2 names every record where those rows disagree. Block 2 should be
-- empty. If it is not, those records need deciding by hand before the
-- apply runs.
-- ===========================================================================

WITH grouped AS (
  SELECT
    outreach_id,
    count(*)                          AS sheet_rows,
    count(DISTINCT plan_action)       AS distinct_plans,
    min(sheet_name)                   AS a_name,
    string_agg(DISTINCT left(plan_action, 38), ' + ' ORDER BY left(plan_action, 38)) AS plans
  FROM medjobs_migration_staging
  WHERE outreach_id IS NOT NULL
  GROUP BY outreach_id
)

SELECT
  '1 rows per record'::text AS section,
  (CASE WHEN sheet_rows = 1 THEN 'one sheet row'
        WHEN sheet_rows = 2 THEN 'two sheet rows'
        ELSE 'three or more sheet rows' END)::text AS label,
  (CASE WHEN distinct_plans = 1 THEN 'they agree'
        ELSE 'THEY DISAGREE' END)::text AS detail,
  count(*) AS n
FROM grouped
GROUP BY 1, 2, 3

UNION ALL

SELECT
  '2 records where the rows disagree'::text,
  left(a_name, 40)::text,
  plans::text,
  sheet_rows
FROM grouped
WHERE distinct_plans > 1

ORDER BY 1, 4 DESC, 2;
