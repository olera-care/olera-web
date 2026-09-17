-- ===========================================================================
-- What has the review actually saved? — read-only
-- ===========================================================================
-- Confirms that work done in the Tasks UI reached the database, and shows
-- exactly which records were touched. Nothing here depends on which branch
-- is deployed: the preview, staging and production sites all talk to this
-- same database, so merging changes the code and not the data.
-- ===========================================================================

WITH az AS (
  SELECT so.*
  FROM student_outreach so
  JOIN student_outreach_campuses sc ON sc.id = so.campus_id
  WHERE sc.slug = 'arizona-state'
)

SELECT
  '1 arizona state, by state'::text AS section,
  (CASE
     WHEN status = 'archived'       THEN 'archived during the review'
     WHEN status = 'not_interested' THEN 'closed, they declined'
     ELSE 'still on the board'
   END)::text AS label,
  (count(*) FILTER (WHERE research_data ? 'website')  || ' website edits · '
   || count(*) FILTER (WHERE research_data ? 'address')       || ' address edits · '
   || count(*) FILTER (WHERE research_data ? 'original_name') || ' renamed')::text AS detail,
  count(*) AS n
FROM az
GROUP BY 1, 2

UNION ALL

-- Contact details are a different table, so counted separately.
SELECT
  '2 contacts saved'::text,
  (CASE WHEN c.is_primary THEN 'primary contact' ELSE 'second contact' END)::text,
  (count(*) FILTER (WHERE coalesce(c.email, '') <> '') || ' with an email · '
   || count(*) FILTER (WHERE coalesce(c.phone, '') <> '') || ' with a phone')::text,
  count(*)
FROM student_outreach_contacts c
JOIN az ON az.id = c.outreach_id
GROUP BY c.is_primary

UNION ALL

-- The last twenty records touched, so the most recent work is visible.
SELECT
  '3 most recently edited'::text,
  left(organization_name, 38)::text,
  (coalesce(research_data->>'archived_at', to_char(updated_at, 'Mon DD HH24:MI'))
    || CASE WHEN status = 'archived' THEN '  (archived)' ELSE '' END)::text,
  0
FROM az
ORDER BY 1, 4 DESC, 2;
