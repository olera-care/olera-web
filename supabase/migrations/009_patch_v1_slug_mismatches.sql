-- Patch v1.0 Slug Mismatches (Top 500 GSC pages)
-- Each UPDATE wrapped in its own DO block so failures don't rollback others.
-- Skips any update that would create a duplicate slug.

DO $$ BEGIN
  UPDATE "olera-providers" SET slug = 'arden-wood'
  WHERE lower(provider_name) LIKE '%arden wood%'
    AND (deleted IS NULL OR deleted = false);
EXCEPTION WHEN unique_violation THEN NULL;
END $$;

DO $$ BEGIN
  UPDATE "olera-providers" SET slug = 'caraday-of-corpus-christi-assisted-living'
  WHERE lower(provider_name) LIKE '%avir%' AND lower(provider_name) LIKE '%corpus christi%'
    AND (deleted IS NULL OR deleted = false);
EXCEPTION WHEN unique_violation THEN NULL;
END $$;

DO $$ BEGIN
  UPDATE "olera-providers" SET slug = 'garland-nursing-rehabilitation-center'
  WHERE lower(provider_name) LIKE '%avir%' AND lower(provider_name) LIKE '%garland%'
    AND (deleted IS NULL OR deleted = false);
EXCEPTION WHEN unique_violation THEN NULL;
END $$;

DO $$ BEGIN
  UPDATE "olera-providers" SET slug = 'the-cottages-at-shawnee-ks'
  WHERE lower(provider_name) = 'the cottages at shawnee' AND state = 'KS'
    AND (deleted IS NULL OR deleted = false);
EXCEPTION WHEN unique_violation THEN NULL;
END $$;

DO $$ BEGIN
  UPDATE "olera-providers" SET slug = 'burt-farms-i-ny'
  WHERE lower(provider_name) = 'burt farms i' AND state = 'NY'
    AND (deleted IS NULL OR deleted = false);
EXCEPTION WHEN unique_violation THEN NULL;
END $$;

DO $$ BEGIN
  UPDATE "olera-providers" SET slug = 'legacy-kettering-oh'
  WHERE lower(provider_name) = 'legacy kettering' AND state = 'OH'
    AND (deleted IS NULL OR deleted = false);
EXCEPTION WHEN unique_violation THEN NULL;
END $$;

DO $$ BEGIN
  UPDATE "olera-providers" SET slug = 'the-forest-at-duke-nc'
  WHERE lower(provider_name) = 'the forest at duke' AND state = 'NC'
    AND (deleted IS NULL OR deleted = false);
EXCEPTION WHEN unique_violation THEN NULL;
END $$;

DO $$ BEGIN
  UPDATE "olera-providers" SET slug = 'baldwin-park-congregate-home-ca'
  WHERE lower(provider_name) = 'baldwin park congregate home' AND state = 'CA'
    AND (deleted IS NULL OR deleted = false);
EXCEPTION WHEN unique_violation THEN NULL;
END $$;

DO $$ BEGIN
  UPDATE "olera-providers" SET slug = 'amity-house-residential-care-and-group-homes-tx'
  WHERE lower(provider_name) = 'amity house residential care and group homes' AND state = 'TX'
    AND (deleted IS NULL OR deleted = false);
EXCEPTION WHEN unique_violation THEN NULL;
END $$;

DO $$ BEGIN
  UPDATE "olera-providers" SET slug = 'advocate-group-care-nj'
  WHERE lower(provider_name) = 'advocate group care' AND state = 'NJ'
    AND (deleted IS NULL OR deleted = false);
EXCEPTION WHEN unique_violation THEN NULL;
END $$;

DO $$ BEGIN
  UPDATE "olera-providers" SET slug = 'creekside-apartments-ny'
  WHERE lower(provider_name) = 'creekside apartments' AND state = 'NY'
    AND (deleted IS NULL OR deleted = false);
EXCEPTION WHEN unique_violation THEN NULL;
END $$;

DO $$ BEGIN
  UPDATE "olera-providers" SET slug = 'star-living-ks'
  WHERE lower(provider_name) = 'star living' AND state = 'KS'
    AND (deleted IS NULL OR deleted = false);
EXCEPTION WHEN unique_violation THEN NULL;
END $$;

DO $$ BEGIN
  UPDATE "olera-providers" SET slug = 'caroldale-home-board-and-care-ca'
  WHERE lower(provider_name) LIKE '%caroldale%' AND state = 'CA'
    AND (deleted IS NULL OR deleted = false);
EXCEPTION WHEN unique_violation THEN NULL;
END $$;

DO $$ BEGIN
  UPDATE "olera-providers" SET slug = 'midwest-home-health-care-wi'
  WHERE lower(provider_name) = 'midwest home health care' AND state = 'WI'
    AND (deleted IS NULL OR deleted = false);
EXCEPTION WHEN unique_violation THEN NULL;
END $$;

DO $$ BEGIN
  UPDATE "olera-providers" SET slug = 'serenity-home-ma'
  WHERE lower(provider_name) = 'serenity home' AND state = 'MA'
    AND (deleted IS NULL OR deleted = false);
EXCEPTION WHEN unique_violation THEN NULL;
END $$;

DO $$ BEGIN
  UPDATE "olera-providers" SET slug = 'helping-hands-assisted-living-md-suitland'
  WHERE lower(provider_name) = 'helping hands assisted living' AND state = 'MD'
    AND lower(city) = 'suitland' AND (deleted IS NULL OR deleted = false);
EXCEPTION WHEN unique_violation THEN NULL;
END $$;

DO $$ BEGIN
  UPDATE "olera-providers" SET slug = 'rose-s-faith-adult-home-oh'
  WHERE (lower(provider_name) LIKE '%rose''s faith%')
    AND state = 'OH' AND (deleted IS NULL OR deleted = false);
EXCEPTION WHEN unique_violation THEN NULL;
END $$;

DO $$ BEGIN
  UPDATE "olera-providers" SET slug = 'o-hara-senior-care-services-ri'
  WHERE (lower(provider_name) LIKE '%o''hara senior care%')
    AND state = 'RI' AND (deleted IS NULL OR deleted = false);
EXCEPTION WHEN unique_violation THEN NULL;
END $$;

DO $$ BEGIN
  UPDATE "olera-providers" SET slug = 'm-s-grace-manor-adult-family-home-wa'
  WHERE (lower(provider_name) LIKE '%m&s grace%' OR lower(provider_name) LIKE '%m s grace%')
    AND state = 'WA' AND (deleted IS NULL OR deleted = false);
EXCEPTION WHEN unique_violation THEN NULL;
END $$;

DO $$ BEGIN
  UPDATE "olera-providers" SET slug = 'nuru-home-healthcare-llc'
  WHERE lower(provider_name) LIKE '%nuru home healthcare%'
    AND (deleted IS NULL OR deleted = false);
EXCEPTION WHEN unique_violation THEN NULL;
END $$;

DO $$ BEGIN
  UPDATE "olera-providers" SET slug = 'blue-star-home-care-llc'
  WHERE lower(provider_name) LIKE '%blue star home care%'
    AND (deleted IS NULL OR deleted = false);
EXCEPTION WHEN unique_violation THEN NULL;
END $$;

DO $$ BEGIN
  UPDATE "olera-providers" SET slug = 'friendly-care'
  WHERE lower(provider_name) = 'friendly care' AND state = 'MA'
    AND lower(city) = 'boston' AND (deleted IS NULL OR deleted = false);
EXCEPTION WHEN unique_violation THEN NULL;
END $$;

DO $$ BEGIN
  UPDATE "olera-providers" SET slug = 'essential-home-health-care'
  WHERE lower(provider_name) = 'essential home health care' AND state = 'MN'
    AND lower(city) = 'faribault' AND (deleted IS NULL OR deleted = false);
EXCEPTION WHEN unique_violation THEN NULL;
END $$;

DO $$ BEGIN
  UPDATE "olera-providers" SET slug = 'grace-house'
  WHERE lower(provider_name) = 'grace house' AND state = 'TN'
    AND lower(city) = 'murfreesboro' AND (deleted IS NULL OR deleted = false);
EXCEPTION WHEN unique_violation THEN NULL;
END $$;

DO $$ BEGIN
  UPDATE "olera-providers" SET slug = 'family-home-care'
  WHERE lower(provider_name) = 'family home care' AND state = 'CT'
    AND lower(city) = 'hartford' AND (deleted IS NULL OR deleted = false);
EXCEPTION WHEN unique_violation THEN NULL;
END $$;

DO $$ BEGIN
  UPDATE "olera-providers" SET slug = 'community-home-health-care'
  WHERE lower(provider_name) = 'community home health care' AND state = 'NY'
    AND lower(city) = 'hempstead' AND (deleted IS NULL OR deleted = false);
EXCEPTION WHEN unique_violation THEN NULL;
END $$;

DO $$ BEGIN
  UPDATE "olera-providers" SET slug = 'hillcrest-manor'
  WHERE lower(provider_name) = 'hillcrest manor' AND state = 'TX'
    AND lower(city) = 'midland' AND (deleted IS NULL OR deleted = false);
EXCEPTION WHEN unique_violation THEN NULL;
END $$;

DO $$ BEGIN
  UPDATE "olera-providers" SET slug = 'always-home-care'
  WHERE lower(provider_name) = 'always home care' AND state = 'NJ'
    AND lower(city) = 'paterson' AND (deleted IS NULL OR deleted = false);
EXCEPTION WHEN unique_violation THEN NULL;
END $$;

DO $$ BEGIN
  UPDATE "olera-providers" SET slug = 'the-mather'
  WHERE lower(provider_name) = 'the mather' AND state = 'IL'
    AND lower(city) = 'evanston' AND (deleted IS NULL OR deleted = false);
EXCEPTION WHEN unique_violation THEN NULL;
END $$;

DO $$ BEGIN
  UPDATE "olera-providers" SET slug = 'helping-hands-homecare'
  WHERE lower(provider_name) = 'helping hands homecare' AND state = 'AR'
    AND lower(city) = 'fayetteville' AND (deleted IS NULL OR deleted = false);
EXCEPTION WHEN unique_violation THEN NULL;
END $$;

DO $$ BEGIN
  UPDATE "olera-providers" SET slug = 'total-home-health'
  WHERE lower(provider_name) = 'total home health' AND state = 'IL'
    AND lower(city) = 'naperville' AND (deleted IS NULL OR deleted = false);
EXCEPTION WHEN unique_violation THEN NULL;
END $$;

DO $$ BEGIN
  UPDATE "olera-providers" SET slug = 'cottage-senior-living'
  WHERE lower(provider_name) = 'cottage senior living' AND state = 'AL'
    AND lower(city) = 'huntsville' AND (deleted IS NULL OR deleted = false);
EXCEPTION WHEN unique_violation THEN NULL;
END $$;

DO $$ BEGIN
  UPDATE "olera-providers" SET slug = 'best-choice-home-health-care'
  WHERE lower(provider_name) = 'best choice home health care' AND state = 'NY'
    AND lower(city) = 'bronx' AND (deleted IS NULL OR deleted = false);
EXCEPTION WHEN unique_violation THEN NULL;
END $$;

DO $$ BEGIN
  UPDATE "olera-providers" SET slug = 'new-life-home-health-services'
  WHERE lower(provider_name) = 'new life home health services' AND state = 'CA'
    AND (deleted IS NULL OR deleted = false);
EXCEPTION WHEN unique_violation THEN NULL;
END $$;

DO $$ BEGIN
  UPDATE "olera-providers" SET slug = 'bee-first-primary-home-care'
  WHERE lower(provider_name) = 'bee first primary home care' AND state = 'TX'
    AND lower(city) = 'laredo' AND (deleted IS NULL OR deleted = false);
EXCEPTION WHEN unique_violation THEN NULL;
END $$;

DO $$ BEGIN
  UPDATE "olera-providers" SET slug = 'home-health-care-solutions'
  WHERE lower(provider_name) = 'home health care solutions' AND state = 'CA'
    AND (deleted IS NULL OR deleted = false);
EXCEPTION WHEN unique_violation THEN NULL;
END $$;

DO $$ BEGIN
  UPDATE "olera-providers" SET slug = 'mountain-shadows-home-care'
  WHERE lower(provider_name) = 'mountain shadows home care' AND state = 'NM'
    AND (deleted IS NULL OR deleted = false);
EXCEPTION WHEN unique_violation THEN NULL;
END $$;

DO $$ BEGIN
  UPDATE "olera-providers" SET slug = 'yaying-house-adult-residential-care-home'
  WHERE lower(provider_name) = 'yaying house adult residential care home' AND state = 'HI'
    AND (deleted IS NULL OR deleted = false);
EXCEPTION WHEN unique_violation THEN NULL;
END $$;
