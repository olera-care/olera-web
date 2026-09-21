-- ===========================================================================
-- How many board providers have a website on file? — read-only
-- ===========================================================================
-- The record header is about to carry a website link. If the directory
-- rarely has one, that line is blank most of the time and the review pass
-- it is meant to speed up does not get faster.
--
-- Counts only the providers actually on a campus board, not the whole
-- directory, because those are the ones being reviewed.
-- ===========================================================================

WITH board AS (
  SELECT
    sc.slug,
    so.id,
    so.organization_name,
    p.website,
    p.provider_id
  FROM student_outreach so
  JOIN student_outreach_campuses sc ON sc.id = so.campus_id
  LEFT JOIN "olera-providers" p
    ON p.provider_id = so.research_data->>'olera_provider_id'
  WHERE so.kind = 'provider'
    AND so.status <> 'archived'
)

SELECT
  '1 coverage by campus'::text AS section,
  slug::text                   AS label,
  (count(*) FILTER (WHERE website IS NOT NULL AND btrim(website) <> '')
    || ' of ' || count(*) || ' have a website')::text AS detail,
  count(*) FILTER (WHERE website IS NOT NULL AND btrim(website) <> '') AS n
FROM board
GROUP BY slug

UNION ALL

SELECT
  '2 why a website is missing'::text,
  (CASE
     WHEN provider_id IS NULL THEN 'no directory row behind the record'
     WHEN website IS NULL OR btrim(website) = '' THEN 'directory row has no website'
     ELSE 'has one'
   END)::text,
  'all six campuses'::text,
  count(*)
FROM board
GROUP BY 2

ORDER BY 1, 4 DESC, 2;
