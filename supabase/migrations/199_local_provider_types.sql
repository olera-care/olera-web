-- 199_local_provider_types.sql
--
-- Makes sbf_area_agencies able to answer the question families actually ask:
-- who do I call HERE, for THIS program.
--
-- The table holds 431 rows covering 1,940 of roughly 3,144 counties, and 332 of
-- them are Area Agencies on Aging. Only SIX are Community Action Agencies --
-- which are the LIHEAP and Weatherization intake point nationwide. So a family
-- asking about energy help gets routed to an aging office that does not run the
-- program, or to nothing.
--
-- That gap produced four wrong or useless referrals in two days:
--
--   * Georgia, home-delivered meals: sent to a national locator instead of Cobb
--     County Senior Services, who actually take the intake call.
--   * Nevada, home-delivered meals: the plan carried Washoe County's number for
--     the entire state. Nevada administers this county by county.
--   * Florida, LIHEAP: the program was in the library, the local provider
--     (Central Florida Community Action Agency) was not.
--   * Florida, home repair: no county housing office anywhere in the table.
--
-- Two columns rather than a new table. Everything here is already "a local
-- office with a phone number and a service area"; what was missing is which
-- KIND of office, so a caller can ask for the one that runs the program instead
-- of taking whatever the state fallback returns first alphabetically.
--
-- Apply via Supabase dashboard (NOT CLI).

ALTER TABLE sbf_area_agencies
  ADD COLUMN IF NOT EXISTS agency_type TEXT NOT NULL DEFAULT 'area_agency_on_aging';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sbf_area_agencies_type_check') THEN
    ALTER TABLE sbf_area_agencies
      ADD CONSTRAINT sbf_area_agencies_type_check
      CHECK (agency_type IN (
        'area_agency_on_aging',   -- Older Americans Act services, 60+
        'community_action',       -- LIHEAP, Weatherization. The missing one.
        'county_senior_services', -- county-run meals and in-home services
        'county_housing',         -- SHIP / rehabilitation / HVAC repair
        'information_referral',   -- 2-1-1, statewide ADRC and elder helplines
        'other'
      ));
  END IF;
END $$;

-- Which programs this office is the door for, by the library's own program ids
-- (e.g. 'home-delivered-meals', 'liheap'). Null means "general intake for its
-- type", which is the honest default for most rows: we know Cobb Senior
-- Services runs meals without having enumerated everything else they run.
ALTER TABLE sbf_area_agencies
  ADD COLUMN IF NOT EXISTS programs_served TEXT[];

-- Routing reads state + type together on every lookup.
CREATE INDEX IF NOT EXISTS idx_sbf_agencies_state_type
  ON sbf_area_agencies (state_code, agency_type)
  WHERE is_active = true;

COMMENT ON COLUMN sbf_area_agencies.agency_type IS
  'Which kind of local office this is. Routing filters on it so a LIHEAP question reaches a Community Action Agency rather than whichever Area Agency on Aging sorts first.';
COMMENT ON COLUMN sbf_area_agencies.programs_served IS
  'Library program ids this office takes intake for. NULL = general intake for its agency_type.';
COMMENT ON TABLE sbf_area_agencies IS
  'Local intake points: Area Agencies on Aging, Community Action Agencies, county senior services and housing offices, and information-and-referral lines. Keyed by counties_served. Despite the name this is no longer AAA-only.';
