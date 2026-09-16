-- ===========================================================================
-- What are the providers that matched the directory but no board? — read-only
-- ===========================================================================
-- Script 10 already did the thing worth doing for providers: it found the
-- records sitting in a campus catchment and put Gracie's calls on them.
-- That is finished.
--
-- What is left in the provider column is a smaller set: rows that match a
-- real directory listing which is NOT on any campus board. There are two
-- reasons a directory provider is missing from every board, and they call
-- for opposite answers:
--
--   too far     the provider is outside the 40 mile ring. It is not in
--               anybody's catchment and probably should not be worked.
--   wrong type  the provider is inside the ring but its category is not
--               "non-medical", so the populate skipped it. Gracie called
--               it anyway. These are the interesting ones: either the
--               category is wrong in the directory, or the agency does
--               both kinds of work.
--
-- Nothing is written.
-- ===========================================================================

WITH campus (slug, lat, lon) AS (
  VALUES
    ('u-utah', 40.7649, -111.8421), ('arizona-state', 33.4242, -111.9281),
    ('uw-madison', 43.0753, -89.4034), ('florida-state', 30.4419, -84.2985),
    ('indiana-bloomington', 39.1653, -86.5264), ('u-florida', 29.6483, -82.3494)
),
rows_left AS (
  SELECT s.id, s.sheet_name, s.dir_provider_id
    FROM medjobs_migration_staging s
   WHERE s.outreach_id IS NULL
     AND s.dir_provider_id IS NOT NULL
     AND s.plan_action NOT LIKE 'tie%'
),
detail AS (
  SELECT
    r.sheet_name,
    p.provider_category,
    (p.deleted IS NOT NULL AND p.deleted) AS is_deleted,
    near.slug,
    near.miles
  FROM rows_left r
  JOIN "olera-providers" p ON p.provider_id = r.dir_provider_id
  LEFT JOIN LATERAL (
    SELECT c.slug,
           3959 * acos(least(1,
             cos(radians(c.lat)) * cos(radians(p.lat)) *
             cos(radians(p.lon) - radians(c.lon)) +
             sin(radians(c.lat)) * sin(radians(p.lat)))) AS miles
      FROM campus c
     WHERE p.lat IS NOT NULL AND p.lon IS NOT NULL
     ORDER BY 2 LIMIT 1
  ) near ON true
)

SELECT
  '1 why it is not on a board'::text AS section,
  (CASE
     WHEN is_deleted                      THEN 'deleted from the directory'
     WHEN miles IS NULL                   THEN 'no coordinates'
     WHEN miles > 40                      THEN 'too far - outside every catchment'
     WHEN provider_category NOT ILIKE '%non-medical%'
                                          THEN 'INSIDE the ring but the category is not non-medical'
     ELSE 'inside the ring and non-medical - should already be on a board'
   END)::text AS label,
  coalesce(provider_category, 'no category')::text AS detail,
  count(*) AS n
FROM detail
GROUP BY 1, 2, 3

UNION ALL

SELECT
  '2 inside the ring, wrong category - named'::text,
  left(sheet_name, 40)::text,
  (coalesce(provider_category, 'no category') || ' - ' || round(miles) || ' miles from ' || slug)::text,
  round(miles)::int
FROM detail
WHERE NOT is_deleted AND miles IS NOT NULL AND miles <= 40
  AND provider_category NOT ILIKE '%non-medical%'

ORDER BY 1, 4 DESC, 2;
