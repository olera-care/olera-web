-- ===========================================================================
-- Step 1 — create the six campuses and populate them from the catchment
-- ===========================================================================
-- WRITES. Read the rehearsal switch below before running.
--
-- What this does, in order:
--
--   1. Creates the six real campuses if they are not already there. The
--      slugs match lib/staffing-outreach/partner-universities.ts exactly,
--      because every catchment lookup in the app joins on them.
--   2. Creates the five activation channels (st3-st7) for each campus at
--      not_yet, so the dots on the board and the Health / 30-day funnel
--      readings have rows to read.
--   3. Creates one student_outreach row per non-medical provider within
--      40 miles of campus, skipping any provider already carried on that
--      campus so a re-run tops up rather than duplicates.
--   4. Gives each new record the opening task — rung one, "call to find
--      the right contact" — due today.
--
-- Why 40 miles and not the city list: the hand-written catchment lists in
-- partner-universities.ts are, by their own header, "best-guess". Measured
-- against coordinates they find 165 providers where 40 miles finds 289.
-- Utah was the worst: 14 listed against 73 real, with Millcreek and South
-- Salt Lake — both bordering Salt Lake City — absent from the list.
--
-- Every row this creates is stamped research_data.migration_batch, so the
-- whole run can be found, audited or removed:
--
--   SELECT count(*) FROM student_outreach
--    WHERE research_data->>migration_batch = catchment-40mi-v1;
--
-- Each record also carries its city and its distance from campus, so an
-- admin reviewing the board can see "Provo · 33 mi" and judge it. The
-- directorys coordinates and its city labels do not always agree, and
-- showing both is how a wrong one gets caught.
--
-- ── REHEARSAL ─────────────────────────────────────────────────────────
-- v_apply is FALSE below. As shipped this counts what it would create,
-- raises the totals as a notice, and rolls the whole thing back. Change
-- the one line to TRUE to commit.
-- ===========================================================================

DO $$
DECLARE
  v_apply    BOOLEAN := FALSE;        -- <<< the only line to change
  v_radius   NUMERIC := 40;           -- miles
  v_batch    TEXT    := 'catchment-40mi-v1';
  v_campus   RECORD;
  v_campuses INT := 0;
  v_channels INT := 0;
  v_records  INT := 0;
  v_tasks    INT := 0;
  v_skipped  INT := 0;
  v_added    INT;
BEGIN

  -- ── the six, with the coordinates distance is measured from ──────────
  CREATE TEMP TABLE _campus (slug TEXT, name TEXT, city TEXT, state TEXT,
                             lat NUMERIC, lon NUMERIC) ON COMMIT DROP;
  INSERT INTO _campus VALUES
    ('u-utah',              'University of Utah',              'Salt Lake City', 'UT', 40.7649, -111.8421),
    ('arizona-state',       'Arizona State University',        'Tempe',          'AZ', 33.4242, -111.9281),
    ('uw-madison',          'University of Wisconsin-Madison', 'Madison',        'WI', 43.0753,  -89.4034),
    ('florida-state',       'Florida State University',        'Tallahassee',    'FL', 30.4419,  -84.2985),
    ('indiana-bloomington', 'Indiana University Bloomington',  'Bloomington',    'IN', 39.1653,  -86.5264),
    ('u-florida',           'University of Florida',           'Gainesville',    'FL', 29.6483,  -82.3494);

  -- ── 1. campuses ──────────────────────────────────────────────────────
  INSERT INTO student_outreach_campuses (slug, name, city, state)
  SELECT c.slug, c.name, c.city, c.state
    FROM _campus c
   WHERE NOT EXISTS (SELECT 1 FROM student_outreach_campuses sc WHERE sc.slug = c.slug);
  GET DIAGNOSTICS v_campuses = ROW_COUNT;

  -- ── 2. the five activation channels per campus ───────────────────────
  INSERT INTO campus_channels (campus_id, channel, status, criteria)
  SELECT sc.id, ch.channel, 'not_yet', '{}'::jsonb
    FROM student_outreach_campuses sc
    JOIN _campus c ON c.slug = sc.slug
   CROSS JOIN (VALUES ('st3'),('st4'),('st5'),('st6'),('st7')) AS ch(channel)
   WHERE NOT EXISTS (
     SELECT 1 FROM campus_channels cc
      WHERE cc.campus_id = sc.id AND cc.channel = ch.channel
   );
  GET DIAGNOSTICS v_channels = ROW_COUNT;

  -- ── 3 + 4. providers inside the radius, one campus at a time ─────────
  FOR v_campus IN
    SELECT sc.id AS campus_id, sc.name, c.slug, c.lat, c.lon
      FROM _campus c
      JOIN student_outreach_campuses sc ON sc.slug = c.slug
     ORDER BY c.slug
  LOOP
    CREATE TEMP TABLE _new ON COMMIT DROP AS
      SELECT
        p.provider_id,
        p.provider_name,
        p.city,
        p.state,
        round(3959 * acos(least(1,
          cos(radians(v_campus.lat)) * cos(radians(p.lat)) *
          cos(radians(p.lon) - radians(v_campus.lon)) +
          sin(radians(v_campus.lat)) * sin(radians(p.lat))
        ))) AS miles
      FROM "olera-providers" p
     WHERE p.provider_category ILIKE '%non-medical%'
       AND (p.deleted IS NULL OR p.deleted = false)
       AND p.lat IS NOT NULL AND p.lon IS NOT NULL
       AND 3959 * acos(least(1,
             cos(radians(v_campus.lat)) * cos(radians(p.lat)) *
             cos(radians(p.lon) - radians(v_campus.lon)) +
             sin(radians(v_campus.lat)) * sin(radians(p.lat))
           )) <= v_radius
       -- Already on this campus? Leave it exactly as it is. This is what
       -- makes a re-run a top-up and not a duplicate, and it is also what
       -- protects any record the spreadsheet overlay has already touched.
       AND NOT EXISTS (
         SELECT 1 FROM student_outreach so
          WHERE so.campus_id = v_campus.campus_id
            AND so.research_data->>'olera_provider_id' = p.provider_id
       )
       -- An admin deleted this one from this campus. Archiving needs no
       -- entry here because an archived record still exists and is caught
       -- by the check above; a deleted one leaves nothing behind, so
       -- without this the next run brings it straight back.
       AND NOT EXISTS (
         SELECT 1 FROM medjobs_excluded_records x
          WHERE x.campus_id = v_campus.campus_id
            AND x.olera_provider_id = p.provider_id
       );

    INSERT INTO student_outreach
      (campus_id, kind, stakeholder_type, organization_name, status, cadence_day, research_data)
    SELECT
      v_campus.campus_id,
      'provider',
      NULL,
      n.provider_name,
      'researched',
      0,
      jsonb_build_object(
        'olera_provider_id', n.provider_id,
        'migration_batch',   v_batch,
        'source',            'catchment_radius',
        'radius_miles',      v_radius,
        'distance_miles',    n.miles,
        'directory_city',    n.city,
        'directory_state',   n.state
      )
      FROM _new n;
    GET DIAGNOSTICS v_added = ROW_COUNT;
    v_records := v_records + v_added;

    SELECT count(*) INTO v_added
      FROM "olera-providers" p
     WHERE p.provider_category ILIKE '%non-medical%'
       AND (p.deleted IS NULL OR p.deleted = false)
       AND p.lat IS NOT NULL AND p.lon IS NOT NULL
       AND 3959 * acos(least(1,
             cos(radians(v_campus.lat)) * cos(radians(p.lat)) *
             cos(radians(p.lon) - radians(v_campus.lon)) +
             sin(radians(v_campus.lat)) * sin(radians(p.lat))
           )) <= v_radius
       AND EXISTS (
         SELECT 1 FROM student_outreach so
          WHERE so.campus_id = v_campus.campus_id
            AND so.research_data->>'olera_provider_id' = p.provider_id
            AND so.research_data->>'migration_batch' IS DISTINCT FROM v_batch
       );
    v_skipped := v_skipped + v_added;

    -- The opening rung: call to find who actually does the hiring.
    INSERT INTO student_outreach_tasks
      (outreach_id, task_type, status, due_at, payload, notes, completed_at)
    SELECT so.id, 'outreach_contact', 'pending', CURRENT_DATE,
           '{"step":0,"round":0}'::jsonb, NULL, NULL
      FROM student_outreach so
     WHERE so.campus_id = v_campus.campus_id
       AND so.research_data->>'migration_batch' = v_batch
       AND NOT EXISTS (
         SELECT 1 FROM student_outreach_tasks t WHERE t.outreach_id = so.id
       );
    GET DIAGNOSTICS v_added = ROW_COUNT;
    v_tasks := v_tasks + v_added;

    DROP TABLE _new;
  END LOOP;

  -- The Supabase SQL editor does not display RAISE NOTICE. In rehearsal
  -- the totals therefore ride on the exception itself, which it does
  -- display; after a real run the SELECT below reports the same thing
  -- from the database.
  IF NOT v_apply THEN
    RAISE EXCEPTION
      'REHEARSAL, nothing saved — campuses % · channels % · records % · tasks % · left alone %. Set v_apply := TRUE to commit.',
      v_campuses, v_channels, v_records, v_tasks, v_skipped;
  END IF;

  RAISE NOTICE 'applied — campuses % channels % records % tasks %',
    v_campuses, v_channels, v_records, v_tasks;
END $$;

-- ── what is actually there now ───────────────────────────────────────────
-- Runs only after a committed run; a rehearsal stops at the exception above.
SELECT
  sc.slug,
  sc.name,
  count(DISTINCT so.id)                                        AS provider_records,
  count(DISTINCT t.id) FILTER (WHERE t.status = 'pending')     AS open_tasks,
  min((so.research_data->>'distance_miles')::numeric)          AS nearest_mi,
  max((so.research_data->>'distance_miles')::numeric)          AS furthest_mi,
  (SELECT count(*) FROM campus_channels cc WHERE cc.campus_id = sc.id) AS channels
FROM student_outreach_campuses sc
LEFT JOIN student_outreach so
       ON so.campus_id = sc.id AND so.kind = 'provider'
LEFT JOIN student_outreach_tasks t ON t.outreach_id = so.id
WHERE sc.slug IN ('u-utah','arizona-state','uw-madison',
                  'florida-state','indiana-bloomington','u-florida')
GROUP BY sc.id, sc.slug, sc.name
ORDER BY provider_records DESC;
