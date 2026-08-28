-- 193_fix_home_care_monthly_rate_type.sql
--
-- WHAT
-- Three home-care providers carry `rateType: "per month"` inside
-- metadata.pricing_details. lib/pricing-config.ts declares
-- `unit: "hour"` for "Home Care (Non-medical)", so these rows contradict
-- the platform's own category definition.
--
-- Only Graceful Homecare has real values behind the wrong unit
-- ($30/$30/$34/$34), which render publicly as "$30/month" for respite and
-- companion care. The other two carry empty rates with a stray rateType, so
-- nothing renders today -- but the bad unit would surface the moment anyone
-- fills in a price.
--
-- WHY a migration rather than an admin edit: the admin directory editor
-- writes lower_price/upper_price on `olera-providers`, not the
-- pricing_details array on `business_profiles`, so there is no UI path to
-- this field.
--
-- SAFETY
--   * Scoped to three stable UUIDs. No category-wide sweep.
--   * Rewrites ONLY elements whose rateType is exactly 'per month'.
--     Every other element is passed through untouched, so legitimate
--     'per day', 'per visit' and 'flat rate' entries are preserved.
--   * jsonb_set on the {pricing_details} path only -- all other metadata
--     keys (images, google_reviews_data, accepts_medicaid, ...) are
--     untouched.
--   * Array order preserved via WITH ORDINALITY.
--   * Idempotent: the guard matches nothing on a second run.

DO $$
DECLARE
  target_ids uuid[] := ARRAY[
    'a532ce55-c006-40a0-948f-0eb90585404d',  -- graceful-homecare (NC)
    '73e20465-7bbe-4955-94c4-954a2d1a176e',  -- assisting-hands-home-care-dallas (TX)
    '835b3da2-4ce0-4107-872c-afb93a2f9962'   -- real-life-living-services (MI)
  ]::uuid[];
  rec            record;
  rows_changed   int := 0;
  remaining      int;
BEGIN
  -- ---------- BEFORE ----------
  RAISE NOTICE '--- 193 BEFORE ---';
  FOR rec IN
    SELECT bp.slug,
           bp.category,
           elem->>'service'  AS service,
           elem->>'rate'     AS rate,
           elem->>'rateType' AS rate_type
    FROM business_profiles bp,
         jsonb_array_elements(bp.metadata->'pricing_details') AS elem
    WHERE bp.id = ANY(target_ids)
    ORDER BY bp.slug
  LOOP
    RAISE NOTICE '  % [%] service=% rate=% rateType=%',
      rec.slug, rec.category, rec.service,
      COALESCE(NULLIF(rec.rate, ''), '(empty)'), rec.rate_type;
  END LOOP;

  -- ---------- ASSERT ----------
  -- Every element we are about to rewrite must currently read 'per month'.
  -- Anything else is left alone by the CASE below; this check simply refuses
  -- to run against an unexpected shape (e.g. pricing_details not an array).
  IF EXISTS (
    SELECT 1 FROM business_profiles
    WHERE id = ANY(target_ids)
      AND metadata ? 'pricing_details'
      AND jsonb_typeof(metadata->'pricing_details') <> 'array'
  ) THEN
    RAISE EXCEPTION '193: pricing_details is not an array on at least one target row; aborting';
  END IF;

  -- ---------- UPDATE ----------
  WITH rewritten AS (
    SELECT bp.id,
           jsonb_set(
             bp.metadata,
             '{pricing_details}',
             (
               SELECT jsonb_agg(
                        CASE
                          WHEN elem->>'rateType' = 'per month'
                            THEN jsonb_set(elem, '{rateType}', '"per hour"'::jsonb)
                          ELSE elem
                        END
                        ORDER BY ord
                      )
               FROM jsonb_array_elements(bp.metadata->'pricing_details')
                    WITH ORDINALITY AS t(elem, ord)
             )
           ) AS new_metadata
    FROM business_profiles bp
    WHERE bp.id = ANY(target_ids)
      -- guard + idempotency: only rows that still hold a 'per month' element
      AND bp.metadata->'pricing_details' @> '[{"rateType": "per month"}]'::jsonb
  )
  UPDATE business_profiles bp
  SET metadata = r.new_metadata
  FROM rewritten r
  WHERE bp.id = r.id;

  GET DIAGNOSTICS rows_changed = ROW_COUNT;
  RAISE NOTICE '--- 193 rows changed: % ---', rows_changed;

  -- ---------- AFTER ----------
  RAISE NOTICE '--- 193 AFTER ---';
  FOR rec IN
    SELECT bp.slug,
           elem->>'service'  AS service,
           elem->>'rate'     AS rate,
           elem->>'rateType' AS rate_type
    FROM business_profiles bp,
         jsonb_array_elements(bp.metadata->'pricing_details') AS elem
    WHERE bp.id = ANY(target_ids)
    ORDER BY bp.slug
  LOOP
    RAISE NOTICE '  % service=% rate=% rateType=%',
      rec.slug, rec.service,
      COALESCE(NULLIF(rec.rate, ''), '(empty)'), rec.rate_type;
  END LOOP;

  -- ---------- VERIFY ----------
  SELECT count(*) INTO remaining
  FROM business_profiles
  WHERE id = ANY(target_ids)
    AND metadata->'pricing_details' @> '[{"rateType": "per month"}]'::jsonb;

  IF remaining > 0 THEN
    RAISE EXCEPTION '193: % target row(s) still carry rateType=per month', remaining;
  END IF;

  RAISE NOTICE '--- 193 verified: no per-month rateType remains on target rows ---';
END $$;
