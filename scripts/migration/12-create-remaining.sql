-- ===========================================================================
-- Step 3 — create records for the sheet rows that had nothing to attach to
-- ===========================================================================
-- WRITES. Rehearsal mode; one line commits.
--
-- Script 10 overlaid the 214 rows that matched a record on the board. This
-- handles what was left, so the team's work is on the board rather than
-- only in a staging table.
--
--   no match                 create a provider record from the sheet row
--   in directory, off board  create a provider record linked to the real
--                            directory row, on the nearest campus
--   stakeholder              create an advisor record, not a provider
--   tie                      left alone. Ten rows where the number is
--                            shared; a person picks the branch.
--
-- Campus comes from the area code, because the ADDRESS column is empty in
-- all 432 rows and there is nothing else to place a row by. A row whose
-- area code is not one of the six campuses is skipped and counted, not
-- guessed at — that is the Virginia and Illinois work, which belongs to
-- universities we are not running.
--
-- Rows on the providers tab that are a person's name are held back, since
-- professors are not being worked yet. Rows whose name is plainly academic — "Academic
-- Advising (Dean's Office)", "The Career Center" — are created as advisors
-- rather than providers, and flagged. The tab they arrived on is not
-- reliable; 66 rows on the providers tab are campus offices.
--
-- Everything created here is stamped migration_batch = 'sheet-create-v1'
-- and carries its sheet row, so it can be found or removed on its own,
-- separately from the overlay.
-- ===========================================================================

DO $$
DECLARE
  v_apply  BOOLEAN := FALSE;        -- <<< the only line to change
  v_batch  TEXT    := 'sheet-create-v1';
  n_prov   INT := 0;
  n_dir    INT := 0;
  n_adv    INT := 0;
  n_person INT := 0;
  n_task   INT := 0;
  n_hist   INT := 0;
  n_skip   INT := 0;
  n_tie    INT := 0;
BEGIN
  -- Area code to campus. Deliberately tight: 520 (Tucson) and 386 outside
  -- the Gainesville ring are left out rather than stretched to fit.
  CREATE TEMP TABLE _area (area TEXT PRIMARY KEY, slug TEXT) ON COMMIT DROP;
  INSERT INTO _area VALUES
    ('801','u-utah'), ('385','u-utah'), ('435','u-utah'),
    ('480','arizona-state'), ('602','arizona-state'), ('623','arizona-state'), ('928','arizona-state'),
    ('608','uw-madison'),
    ('850','florida-state'),
    ('352','u-florida'), ('386','u-florida'),
    ('812','indiana-bloomington'), ('930','indiana-bloomington');

  -- Every row still to place, with the campus it belongs to and whether it
  -- reads as a campus office rather than an employer.
  CREATE TEMP TABLE _todo ON COMMIT DROP AS
  SELECT
    s.id,
    s.tab,
    s.row_no,
    (s.tab || ':' || s.row_no)          AS sheet_key,
    s.sheet_name,
    s.phone,
    s.email,
    s.matched_provider_id,
    s.plan_action,
    s.call1, s.remark1, s.call2, s.remark2,
    s.call3, s.remark3, s.call4, s.remark4,
    a.slug AS campus_slug,
    -- A person's name and nothing else. Two or three capitalised words
    -- with no word from the care-business vocabulary in them. The second
    -- half matters: without it "Village Caregiving" reads as a person.
    (
      -- A credential after the name settles it outright.
      s.sheet_name ~* '\m(PhD|Ph\.D|MD|M\.D|RN|DNP|MSN|EdD|DO)\M'
      OR (
        -- Otherwise: two or three capitalised words and nothing from the
        -- care-business vocabulary. The second half matters — without it
        -- "Village Caregiving" reads as a person. The character classes
        -- allow accents and brackets, which is how MarChé Daughtry and
        -- Mildred (Maldonado-Molina) Schreiner were missed the first time.
        s.sheet_name ~ '^[[:upper:]][[:alpha:]''.()-]+([ -][[:upper:]][[:alpha:]''.()-]*)? [[:upper:]][[:alpha:]''.()-]+$'
        AND s.sheet_name !~* '(care|home|health|senior|service|agency|angel|assist|nurs|staff|llc|inc|corp|group|solution|living|comfort|support|companion|helper|hospice|therapy|medical|cent|hand|heart|famil|life|plus|villa|manor|house|place|arosa|nannies)'
      )
    ) AS is_person,
    (s.tab = 'partner'
      OR s.sheet_name ~* '(advising|advisor|career|dean|department|college|university|pre-?health|pre-?nursing|pre-?med|student|academic|faculty|professor|enrollment|council|scholars|mentoring|leadership|society|association|fraternit|sororit|alumni)'
    ) AS is_stakeholder
  FROM medjobs_migration_staging s
  LEFT JOIN _area a ON a.area = left(s.phone, 3)
  WHERE s.outreach_id IS NULL
    AND s.plan_action NOT LIKE 'tie%';

  SELECT count(*) INTO n_tie  FROM medjobs_migration_staging WHERE plan_action LIKE 'tie%';
  SELECT count(*) INTO n_skip FROM _todo WHERE campus_slug IS NULL;

  -- ── providers ──────────────────────────────────────────────────────────
  -- A row with no directory match still needs an olera_provider_id to
  -- satisfy the kind_provider_link check, so it carries a synthetic one
  -- naming the sheet row it came from.
  INSERT INTO student_outreach
    (campus_id, kind, stakeholder_type, organization_name, status, cadence_day, research_data)
  SELECT
    sc.id, 'provider', NULL, t.sheet_name, 'researched', 0,
    jsonb_build_object(
      'olera_provider_id', coalesce(t.matched_provider_id, 'sheet:' || t.sheet_key),
      'migration_batch',   v_batch,
      'source',            CASE WHEN t.matched_provider_id IS NOT NULL
                                THEN 'sheet_row_matched_directory_only'
                                ELSE 'sheet_row_no_directory_match' END,
      'sheet_row',         t.row_no,
      'sheet_key',         t.sheet_key,
      'sheet_phone',       t.phone,
      'placed_by',         'area code ' || left(t.phone, 3),
      'migration_review',  true)
  FROM _todo t
  JOIN student_outreach_campuses sc ON sc.slug = t.campus_slug
  WHERE NOT t.is_stakeholder AND NOT t.is_person
    AND NOT EXISTS (
      SELECT 1 FROM student_outreach so
       WHERE so.research_data->>'sheet_key' = t.sheet_key
         AND so.research_data->>'migration_batch' = v_batch);
  GET DIAGNOSTICS n_prov = ROW_COUNT;

  SELECT count(*) INTO n_dir
    FROM _todo WHERE NOT is_stakeholder AND campus_slug IS NOT NULL
      AND matched_provider_id IS NOT NULL;

  -- ── advisors ───────────────────────────────────────────────────────────
  INSERT INTO student_outreach
    (campus_id, kind, stakeholder_type, organization_name, status, cadence_day, research_data)
  SELECT
    sc.id, 'advisor', 'advisor', t.sheet_name, 'researched', 0,
    jsonb_build_object(
      'migration_batch',  v_batch,
      'source',           CASE WHEN t.tab = 'partner'
                               THEN 'partners_tab'
                               ELSE 'providers_tab_but_reads_as_a_campus_office' END,
      'sheet_row',        t.row_no,
      'sheet_key',        t.sheet_key,
      'sheet_phone',      t.phone,
      'placed_by',        'area code ' || left(t.phone, 3),
      'migration_review', true)
  FROM _todo t
  JOIN student_outreach_campuses sc ON sc.slug = t.campus_slug
  WHERE t.is_stakeholder AND NOT t.is_person
    AND NOT EXISTS (
      SELECT 1 FROM student_outreach so
       WHERE so.research_data->>'sheet_key' = t.sheet_key
         AND so.research_data->>'migration_batch' = v_batch);
  GET DIAGNOSTICS n_adv = ROW_COUNT;

  -- ── people: held back, not created ────────────────────────────────────
  -- Twenty-eight rows on the providers tab are somebody's name — Dietmar W
  -- Siemann, David C Bloom, Anthony Lanman. They are campus faculty, not
  -- employers. We are not doing professors yet, so they are counted and
  -- left in staging rather than created anywhere.
  SELECT count(*) INTO n_person FROM _todo WHERE is_person AND campus_slug IS NOT NULL;

  -- ── the contact, where the sheet has a real address ────────────────────
  INSERT INTO student_outreach_contacts (outreach_id, name, email, phone)
  SELECT so.id, '', t.email, t.phone
    FROM _todo t
    JOIN student_outreach so ON so.research_data->>'sheet_key' = t.sheet_key
                            AND so.research_data->>'migration_batch' = v_batch
   -- Parenthesised deliberately: AND binds tighter than OR, so without the
   -- outer brackets a row with an email would skip the duplicate check and
   -- a re-run would add a second contact to it.
   WHERE ((t.email IS NOT NULL AND t.email LIKE '%@%') OR t.phone <> '')
     AND NOT EXISTS (SELECT 1 FROM student_outreach_contacts c WHERE c.outreach_id = so.id);

  -- ── the call history, verbatim, same as the overlay ────────────────────
  INSERT INTO student_outreach_tasks
    (outreach_id, task_type, status, due_at, payload, notes, completed_at)
  SELECT
    so.id, 'outreach_contact', 'completed', c.call_at,
    jsonb_build_object('step', 0, 'round', 0, 'migrated', true,
                       'call', c.n, 'sheet_row', t.row_no, 'migration_batch', v_batch),
    c.remark, c.call_at
  FROM _todo t
  JOIN student_outreach so ON so.research_data->>'sheet_key' = t.sheet_key
                          AND so.research_data->>'migration_batch' = v_batch
  CROSS JOIN LATERAL (VALUES
      (1, t.call1, t.remark1), (2, t.call2, t.remark2),
      (3, t.call3, t.remark3), (4, t.call4, t.remark4)
  ) AS c(n, call_at, remark)
  WHERE c.call_at IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM student_outreach_tasks x
       WHERE x.outreach_id = so.id AND (x.payload->>'call')::int = c.n);
  GET DIAGNOSTICS n_hist = ROW_COUNT;

  -- ── the open task, so the record is workable ───────────────────────────
  INSERT INTO student_outreach_tasks
    (outreach_id, task_type, status, due_at, payload, notes, completed_at)
  SELECT so.id, 'outreach_contact', 'pending', CURRENT_DATE,
         jsonb_build_object('step', 0, 'round', 0, 'migration_batch', v_batch),
         NULL, NULL
    FROM student_outreach so
   WHERE so.research_data->>'migration_batch' = v_batch
     AND NOT EXISTS (
       SELECT 1 FROM student_outreach_tasks x
        WHERE x.outreach_id = so.id AND x.status = 'pending');
  GET DIAGNOSTICS n_task = ROW_COUNT;

  IF NOT v_apply THEN
    RAISE EXCEPTION
      'REHEARSAL, nothing saved — provider records % (of which % were in the directory) · advisor records % · people held back for later % · history tasks % · open tasks % · skipped, area code is not one of the six % · ties left for a person %. Set v_apply := TRUE to commit.',
      n_prov, n_dir, n_adv, n_person, n_hist, n_task, n_skip, n_tie;
  END IF;
END $$;

-- ── the board, after ─────────────────────────────────────────────────────
SELECT
  sc.slug,
  count(*) FILTER (WHERE so.kind = 'provider')                        AS providers,
  count(*) FILTER (WHERE so.kind = 'advisor')                         AS advisors,
  count(*) FILTER (WHERE so.research_data ? 'sheet_row')              AS from_the_sheet,
  count(*) FILTER (WHERE so.research_data ? 'migration_review')       AS need_review
FROM student_outreach_campuses sc
JOIN student_outreach so ON so.campus_id = sc.id
GROUP BY sc.slug
ORDER BY providers DESC;
