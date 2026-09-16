-- ===========================================================================
-- How big is each catchment? — read-only, run before anything is written
-- ===========================================================================
-- Answers the two questions that decide whether the populate is safe to run:
--
--   1. How many non-medical providers sit in each of the six catchments?
--      Every one becomes a record with a "Call to get the right email"
--      task, so this number is what the Tasks column will read.
--
--   2. Does each campus already exist with the slug the catchment joins on?
--      The join is slug-keyed, so a slug that is off by a character
--      populates zero providers with no error at all. A zero in
--      `campus_row_exists` is the loud version of that failure.
--
-- Nothing is inserted, updated or deleted. Safe to run any time.
--
-- The city lists are inlined from lib/staffing-outreach/partner-universities.ts
-- so this query needs no application deploy to be accurate. If that file
-- changes, regenerate this one.
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
    ('u-florida', 'University of Florida', 'Lake City', 'FL')
),

-- The same filter lib/medjobs/catchment.ts uses: non-medical home care,
-- not soft-deleted.
eligible AS (
  SELECT
    p.provider_id,
    p.provider_name,
    lower(p.city) AS city_key,
    p.state
  FROM "olera-providers" p
  WHERE p.provider_category ILIKE '%non-medical%'
    AND (p.deleted IS NULL OR p.deleted = false)
),

matched AS (
  SELECT
    c.slug,
    c.campus_name,
    e.provider_id
  FROM catchment c
  JOIN eligible e
    ON e.city_key = lower(c.city)
   AND e.state    = c.state
)

SELECT
  c.slug,
  c.campus_name,
  -- Zero here means the slug does not match a campus row, and the populate
  -- would silently do nothing for this university.
  (SELECT count(*) FROM student_outreach_campuses sc WHERE sc.slug = c.slug)
    AS campus_row_exists,
  count(DISTINCT c2.city || '%' || c2.state) AS cities_in_catchment,
  count(DISTINCT m.provider_id)               AS providers_in_catchment,
  -- What already exists, so the populate's "would add" is honest.
  (SELECT count(*)
     FROM student_outreach so
     JOIN student_outreach_campuses sc2 ON sc2.id = so.campus_id
    WHERE sc2.slug = c.slug AND so.kind = 'provider')
    AS provider_records_today
FROM (SELECT DISTINCT slug, campus_name FROM catchment) c
LEFT JOIN catchment c2 ON c2.slug = c.slug
LEFT JOIN matched   m  ON m.slug  = c.slug
GROUP BY c.slug, c.campus_name
ORDER BY providers_in_catchment DESC;
