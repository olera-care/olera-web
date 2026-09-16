-- ===========================================================================
-- Is 165 the real ceiling? — read-only
-- ===========================================================================
-- 02 answered the blocker: only demo campuses exist, so the six real ones
-- must be created. It also raised two questions that decide how many
-- providers the populate should be creating.
--
--   Utah. The eleven Salt Lake metro cities hold ~75% of the state's
--   population but only 17% of its non-medical rows (14 of 83). Every
--   other state's share tracks its geography. Either the catchment list is
--   short, a city name does not match, or Utah's rows really are elsewhere.
--
--   The cap. No city in block 4 exceeded 18, and Scottsdale (16) outranked
--   Phoenix (11). A real market does not look like that. If the directory
--   was built by a per-city scrape with a result limit, then "every
--   provider in the catchment" means every provider the scrape found, and
--   the populate's totals are a floor, not a census.
--
-- Blocks:
--   A all 56 catchment cities   exact count each, zeros included
--   B every Utah city           where Utah's rows actually are
--   C busiest cities nationally is there a per-city ceiling?
--   D near-miss names           catchment city vs a similar directory city
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

-- A. Every catchment city, including the ones that contribute nothing.
blocka AS (
  SELECT
    'A catchment city'::text                       AS section,
    (ct.slug || ' · ' || ct.city)::text            AS label,
    (CASE WHEN n.c IS NULL OR n.c = 0
          THEN 'EMPTY — no providers here'
          ELSE 'ok' END)::text                     AS detail,
    coalesce(n.c, 0)                               AS n
  FROM catchment ct
  LEFT JOIN LATERAL (
    SELECT count(*) AS c FROM eligible e
     WHERE e.city_key = lower(ct.city) AND e.state_key = ct.state
  ) n ON true
),

-- B. Utah, every city. Where the other 69 rows live.
blockb AS (
  SELECT
    'B utah cities'::text,
    e.city_key::text,
    (CASE WHEN EXISTS (
       SELECT 1 FROM catchment ct
        WHERE lower(ct.city) = e.city_key AND ct.state = 'UT')
     THEN 'in catchment' ELSE 'not in catchment' END)::text,
    count(*)
  FROM eligible e
  WHERE e.state_key = 'UT'
  GROUP BY e.city_key
),

-- C. The busiest non-medical cities anywhere. A flat ceiling across
--    unrelated metros is the signature of a capped scrape.
blockc AS (
  SELECT
    'C busiest nationally'::text,
    (e.state_key || ' / ' || e.city_key)::text,
    'any state'::text,
    count(*)
  FROM eligible e
  GROUP BY e.state_key, e.city_key
  ORDER BY count(*) DESC
  LIMIT 15
),

-- D. A catchment city and a directory city in the same state where one
--    name contains the other but they are not equal — "Saint" vs "St.",
--    "Mount Horeb" vs "Mt Horeb", a stray suffix.
blockd AS (
  SELECT DISTINCT
    'D near-miss name'::text,
    (ct.state || ' · want "' || lower(ct.city) || '"')::text,
    ('directory has "' || e.city_key || '"')::text,
    count(*) OVER (PARTITION BY e.state_key, e.city_key)
  FROM catchment ct
  JOIN eligible e
    ON e.state_key = ct.state
   AND e.city_key <> lower(ct.city)
   AND (e.city_key LIKE '%' || lower(ct.city) || '%'
     OR lower(ct.city) LIKE '%' || e.city_key || '%')
)

SELECT * FROM blocka
UNION ALL SELECT * FROM blockb
UNION ALL SELECT * FROM blockc
UNION ALL SELECT * FROM blockd
ORDER BY 1, 4 DESC, 2;
