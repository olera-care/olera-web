-- ===========================================================================
-- What is actually within driving distance? — read-only
-- ===========================================================================
-- The catchment city lists are hand-written, and the header of
-- lib/staffing-outreach/partner-universities.ts says so outright: "City
-- spellings are best-guess." Utah proved the cost — eleven listed cities
-- returned 14 providers while eight unlisted Salt Lake Valley cities,
-- several of them bordering Salt Lake City, held 25 more.
--
-- olera-providers carries lat/lon, so distance can replace the guess.
-- This measures, for each of the six campuses, how many non-medical
-- providers sit within 25, 40 and 60 miles, and names the cities the
-- hand-written list is missing.
--
--   A coordinate coverage   can distance be trusted, or are lat/lon sparse?
--   B radius vs city list   what the list finds against what is really there
--   C missing cities        inside 40 miles, absent from the list
--   D overreach             on the list, beyond 60 miles
--
-- 3959 = Earths radius in miles. least(1, ...) guards acos against
-- floating-point drift just past 1.0.
--
-- Nothing is inserted, updated or deleted.
-- ===========================================================================

WITH campus (slug, campus_name, lat, lon) AS (
  VALUES
    ('u-utah',              'University of Utah',              40.7649, -111.8421),
    ('arizona-state',       'Arizona State University',        33.4242, -111.9281),
    ('uw-madison',          'University of Wisconsin-Madison', 43.0753,  -89.4034),
    ('florida-state',       'Florida State University',        30.4419,  -84.2985),
    ('indiana-bloomington', 'Indiana University Bloomington',  39.1653,  -86.5264),
    ('u-florida',           'University of Florida',           29.6483,  -82.3494)
),

catchment (slug, campus_name, city, state) AS (
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
    btrim(p.state)       AS state_key,
    p.lat,
    p.lon
  FROM "olera-providers" p
  WHERE p.provider_category ILIKE '%non-medical%'
    AND (p.deleted IS NULL OR p.deleted = false)
),

-- Distance from every campus to every provider that has coordinates.
dist AS (
  SELECT
    cm.slug,
    e.provider_id,
    e.city_key,
    e.state_key,
    3959 * acos(least(1,
      cos(radians(cm.lat)) * cos(radians(e.lat)) *
      cos(radians(e.lon) - radians(cm.lon)) +
      sin(radians(cm.lat)) * sin(radians(e.lat))
    )) AS miles
  FROM campus cm
  JOIN eligible e
    ON e.lat IS NOT NULL AND e.lon IS NOT NULL
),

-- A. If lat/lon are sparse, every number below is an undercount.
blocka AS (
  SELECT
    'A coordinate coverage'::text AS section,
    coalesce(e.state_key, '(no state)')::text AS label,
    (count(*) FILTER (WHERE e.lat IS NOT NULL AND e.lon IS NOT NULL)
      || ' of ' || count(*) || ' have lat/lon')::text AS detail,
    count(*) FILTER (WHERE e.lat IS NULL OR e.lon IS NULL) AS n
  FROM eligible e
  WHERE e.state_key IN ('UT', 'AZ', 'WI', 'FL', 'IN')
  GROUP BY e.state_key
),

-- B. The hand-written list against three honest radii.
blockb AS (
  SELECT
    'B radius vs city list'::text,
    cm.slug::text,
    ('city list ' || (
       SELECT count(DISTINCT e.provider_id)
         FROM eligible e JOIN catchment ct ON ct.slug = cm.slug
        WHERE e.city_key = lower(ct.city) AND e.state_key = ct.state
     )
     || '  ·  25mi ' || (SELECT count(*) FROM dist d WHERE d.slug = cm.slug AND d.miles <= 25)
     || '  ·  40mi ' || (SELECT count(*) FROM dist d WHERE d.slug = cm.slug AND d.miles <= 40)
     || '  ·  60mi ' || (SELECT count(*) FROM dist d WHERE d.slug = cm.slug AND d.miles <= 60)
    )::text,
    (SELECT count(*) FROM dist d WHERE d.slug = cm.slug AND d.miles <= 40)
  FROM campus cm
),

-- C. Inside 40 miles and not on the list. This is what we would lose.
blockc AS (
  SELECT
    'C missing city'::text,
    (d.slug || ' · ' || d.state_key || ' / ' || d.city_key)::text,
    ('nearest ' || round(min(d.miles))::text || ' mi')::text,
    count(*)
  FROM dist d
  WHERE d.miles <= 40
    AND NOT EXISTS (
      SELECT 1 FROM catchment ct
       WHERE ct.slug = d.slug
         AND lower(ct.city) = d.city_key
         AND ct.state = d.state_key
    )
  GROUP BY d.slug, d.state_key, d.city_key
),

-- D. On the list but too far to drive. The opposite mistake.
blockd AS (
  SELECT
    'D overreach'::text,
    (ct.slug || ' · ' || ct.city)::text,
    ('nearest provider ' || round(min(d.miles))::text || ' mi away')::text,
    count(*)
  FROM catchment ct
  JOIN dist d
    ON d.slug = ct.slug
   AND d.city_key = lower(ct.city)
   AND d.state_key = ct.state
  GROUP BY ct.slug, ct.city
  HAVING min(d.miles) > 60
)

SELECT * FROM blocka
UNION ALL SELECT * FROM blockb
UNION ALL SELECT * FROM blockc
UNION ALL SELECT * FROM blockd
ORDER BY 1, 4 DESC, 2;
