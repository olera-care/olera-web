-- ===========================================================================
-- Why is campus_row_exists zero? — read-only diagnostic
-- ===========================================================================
-- 01-count-catchments.sql returned providers for all six catchments but
-- campus_row_exists = 0 for every one. The city join works; the campus
-- join does not. This says why, and in the same pass checks whether 165
-- providers is the right total or whether the city list is too narrow.
--
-- Four blocks in one result grid, because the Supabase editor only shows
-- the last statement:
--
--   1 campuses that exist   every row in student_outreach_campuses
--   2 slug we need          the six, marked exists / MISSING
--   3 non-medical in state  how many eligible providers each state holds
--   4 top cities            biggest non-medical cities in those states,
--                           each marked in / not in catchment
--   5 strict vs trimmed     whether query 01 undercounted on padded data
--
-- Block 4 is the honest check on 165. If a big city sits in one of our
-- five states, is full of providers and reads "not in catchment", either
-- it is genuinely outside commuting range or the catchment list is short.
--
-- Nothing is inserted, updated or deleted.
-- ===========================================================================

WITH catchment (slug, campus_name, city, state) AS (
  VALUES
    ('u-utah', 'University of Utah', 'Salt Lake City', 'UT'),
    ('u-utah', 'University of Utah', 'West Valley City', 'UT'),
    ('u-utah', 'University of Utah', 'West Jordan', 'UT'),
    ('u-utah', 'University of Utah', 'Sandy', 'UT'),
    ('u-utah', 'University of Utah', 'South Jordan', 'UT'),
    ('u-utah', 'University of Utah', 'Murray', 'UT'),
    ('u-utah', 'University of Utah', 'Draper', 'UT'),
    ('u-utah', 'University of Utah', 'Holladay', 'UT'),
    ('u-utah', 'University of Utah', 'Cottonwood Heights', 'UT'),
    ('u-utah', 'University of Utah', 'Midvale', 'UT'),
    ('u-utah', 'University of Utah', 'Taylorsville', 'UT'),
    ('arizona-state', 'Arizona State University', 'Tempe', 'AZ'),
    ('arizona-state', 'Arizona State University', 'Phoenix', 'AZ'),
    ('arizona-state', 'Arizona State University', 'Mesa', 'AZ'),
    ('arizona-state', 'Arizona State University', 'Chandler', 'AZ'),
    ('arizona-state', 'Arizona State University', 'Scottsdale', 'AZ'),
    ('arizona-state', 'Arizona State University', 'Gilbert', 'AZ'),
    ('arizona-state', 'Arizona State University', 'Glendale', 'AZ'),
    ('arizona-state', 'Arizona State University', 'Peoria', 'AZ'),
    ('arizona-state', 'Arizona State University', 'Surprise', 'AZ'),
    ('arizona-state', 'Arizona State University', 'Avondale', 'AZ'),
    ('arizona-state', 'Arizona State University', 'Goodyear', 'AZ'),
    ('arizona-state', 'Arizona State University', 'Queen Creek', 'AZ'),
    ('uw-madison', 'University of Wisconsin-Madison', 'Madison', 'WI'),
    ('uw-madison', 'University of Wisconsin-Madison', 'Middleton', 'WI'),
    ('uw-madison', 'University of Wisconsin-Madison', 'Sun Prairie', 'WI'),
    ('uw-madison', 'University of Wisconsin-Madison', 'Verona', 'WI'),
    ('uw-madison', 'University of Wisconsin-Madison', 'Fitchburg', 'WI'),
    ('uw-madison', 'University of Wisconsin-Madison', 'Waunakee', 'WI'),
    ('uw-madison', 'University of Wisconsin-Madison', 'McFarland', 'WI'),
    ('uw-madison', 'University of Wisconsin-Madison', 'Stoughton', 'WI'),
    ('uw-madison', 'University of Wisconsin-Madison', 'Janesville', 'WI'),
    ('uw-madison', 'University of Wisconsin-Madison', 'Mount Horeb', 'WI'),
    ('florida-state', 'Florida State University', 'Tallahassee', 'FL'),
    ('florida-state', 'Florida State University', 'Crawfordville', 'FL'),
    ('florida-state', 'Florida State University', 'Quincy', 'FL'),
    ('florida-state', 'Florida State University', 'Monticello', 'FL'),
    ('florida-state', 'Florida State University', 'Havana', 'FL'),
    ('indiana-bloomington', 'Indiana University Bloomington', 'Bloomington', 'IN'),
    ('indiana-bloomington', 'Indiana University Bloomington', 'Ellettsville', 'IN'),
    ('indiana-bloomington', 'Indiana University Bloomington', 'Spencer', 'IN'),
    ('indiana-bloomington', 'Indiana University Bloomington', 'Bedford', 'IN'),
    ('indiana-bloomington', 'Indiana University Bloomington', 'Bloomfield', 'IN'),
    ('indiana-bloomington', 'Indiana University Bloomington', 'Mitchell', 'IN'),
    ('indiana-bloomington', 'Indiana University Bloomington', 'Nashville', 'IN'),
    ('indiana-bloomington', 'Indiana University Bloomington', 'Martinsville', 'IN'),
    ('u-florida', 'University of Florida', 'Gainesville', 'FL'),
    ('u-florida', 'University of Florida', 'Alachua', 'FL'),
    ('u-florida', 'University of Florida', 'Newberry', 'FL'),
    ('u-florida', 'University of Florida', 'High Springs', 'FL'),
    ('u-florida', 'University of Florida', 'Archer', 'FL'),
    ('u-florida', 'University of Florida', 'Hawthorne', 'FL'),
    ('u-florida', 'University of Florida', 'Williston', 'FL'),
    ('u-florida', 'University of Florida', 'Ocala', 'FL'),
    ('u-florida', 'University of Florida', 'Starke', 'FL'),
    ('u-florida', 'University of Florida', 'Lake City', 'FL')),

eligible AS (
  SELECT
    p.provider_id,
    lower(btrim(p.city)) AS city_key,
    btrim(p.state)       AS state_key
  FROM "olera-providers" p
  WHERE p.provider_category ILIKE '%non-medical%'
    AND (p.deleted IS NULL OR p.deleted = false)
    AND p.city IS NOT NULL
    AND p.state IS NOT NULL
),

-- 1. What is actually in the campuses table right now.
block1 AS (
  SELECT
    '1 campuses that exist'::text AS section,
    sc.slug::text                 AS label,
    sc.name::text                 AS detail,
    NULL::bigint                  AS n
  FROM student_outreach_campuses sc
),

-- 2. The six slugs the catchment joins on, and whether each is there.
block2 AS (
  SELECT
    '2 slug we need'::text,
    c.slug::text,
    (CASE
       WHEN EXISTS (SELECT 1 FROM student_outreach_campuses sc WHERE sc.slug = c.slug)
       THEN 'exists'
       ELSE 'MISSING — populate would do nothing'
     END)::text,
    NULL::bigint
  FROM (SELECT DISTINCT slug FROM catchment) c
),

-- 3. Eligible providers per state, catchment ignored. The ceiling.
block3 AS (
  SELECT
    '3 non-medical in state'::text,
    e.state_key::text,
    'whole state'::text,
    count(*)
  FROM eligible e
  WHERE e.state_key IN ('UT', 'AZ', 'WI', 'FL', 'IN')
  GROUP BY e.state_key
),

-- 4. Where those providers actually are, biggest first.
block4 AS (
  SELECT
    '4 top cities'::text,
    (e.state_key || ' / ' || e.city_key)::text,
    (CASE
       WHEN EXISTS (
         SELECT 1 FROM catchment ct
          WHERE lower(ct.city) = e.city_key AND ct.state = e.state_key
       )
       THEN 'in catchment'
       ELSE 'not in catchment'
     END)::text,
    count(*)
  FROM eligible e
  WHERE e.state_key IN ('UT', 'AZ', 'WI', 'FL', 'IN')
  GROUP BY e.state_key, e.city_key
  ORDER BY count(*) DESC
  LIMIT 40
),
-- 5. Did query 01 undercount? It matched city and state raw; this matches
--    them trimmed. A difference means the directory has padded values and
--    the real catchment is bigger than 165.
block5 AS (
  SELECT
    '5 strict vs trimmed'::text,
    c.slug::text,
    'trimmed match minus raw match'::text,
    (
      (SELECT count(DISTINCT p.provider_id)
         FROM "olera-providers" p
         JOIN catchment ct ON ct.slug = c.slug
        WHERE p.provider_category ILIKE '%non-medical%'
          AND (p.deleted IS NULL OR p.deleted = false)
          AND lower(btrim(p.city)) = lower(btrim(ct.city))
          AND upper(btrim(p.state)) = upper(btrim(ct.state)))
      -
      (SELECT count(DISTINCT p.provider_id)
         FROM "olera-providers" p
         JOIN catchment ct ON ct.slug = c.slug
        WHERE p.provider_category ILIKE '%non-medical%'
          AND (p.deleted IS NULL OR p.deleted = false)
          AND lower(p.city) = lower(ct.city)
          AND p.state = ct.state)
    )
  FROM (SELECT DISTINCT slug FROM catchment) c
)

SELECT * FROM block1
UNION ALL SELECT * FROM block2
UNION ALL SELECT * FROM block3
UNION ALL SELECT * FROM block4
UNION ALL SELECT * FROM block5
ORDER BY 1, 4 DESC NULLS LAST, 2;
