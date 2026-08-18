-- Stamp business_profiles.claimed_at whenever a profile becomes claimed.
--
-- WHY: claim conversion is the KPI for the whole Q&A surface — provider
-- questions exist to give a provider a reason to claim their page — and it was
-- unmeasurable. The claimed_at column already existed but was null on all 3,734
-- rows: the only code writing it (app/api/auth/claim-profiles/route.ts) covers a
-- family placeholder-merge path and never sets claim_state. provider_activity
-- has no claim event either. So there was no timestamp anywhere marking when a
-- provider claimed, and no way to attribute 789 claimed organizations to the
-- emails, outreach, or pages that produced them.
--
-- WHY A TRIGGER, not application code: claim_state is set to 'claimed' from at
-- least ten call sites (auth callback x3, create-profile, care-post
-- activate-matches, medjobs apply x2, medjobs magic-link, provider onboarding,
-- plus ad-hoc admin SQL). Instrumenting each one leaves the next new path
-- uninstrumented and silently reopens the same blind spot. One trigger cannot
-- be forgotten.
--
-- Idempotent: only fires on the transition INTO 'claimed', and never overwrites
-- a claimed_at that is already set. A profile that unclaims and re-claims keeps
-- its original claim date; that is deliberate — first claim is the conversion
-- event.

CREATE OR REPLACE FUNCTION set_business_profile_claimed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.claim_state = 'claimed' AND NEW.claimed_at IS NULL THEN
    -- On INSERT there is no OLD row, so any inserted-as-claimed profile stamps.
    -- On UPDATE only stamp the transition, not every write to an already
    -- claimed row.
    IF TG_OP = 'INSERT' OR OLD.claim_state IS DISTINCT FROM 'claimed' THEN
      NEW.claimed_at := now();
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_business_profiles_claimed_at ON business_profiles;

CREATE TRIGGER trg_business_profiles_claimed_at
  BEFORE INSERT OR UPDATE OF claim_state ON business_profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_business_profile_claimed_at();

COMMENT ON COLUMN business_profiles.claimed_at IS
  'When this profile was first claimed. Stamped by trg_business_profiles_claimed_at on the transition into claim_state=''claimed''. NULL on a claimed row means the claim predates this instrumentation (2026-08-17) and its date is unknown — exclude those rows from cohort timing, do not treat NULL as unclaimed.';

-- Backfill the only claim dates that actually exist in the system today:
-- provider_outreach_tracking recorded claimed_at for providers worked through
-- the outreach program (159 rows). The join key is verified —
-- tracking.provider_id maps to business_profiles.source_provider_id.
--
-- Everything else stays NULL on purpose. updated_at is NOT a usable proxy: it
-- moves on every profile edit, so backfilling from it would manufacture claim
-- dates that look precise and are wrong. A known-unknown beats a plausible lie.

UPDATE business_profiles bp
SET claimed_at = t.claimed_at
FROM provider_outreach_tracking t
WHERE t.provider_id = bp.source_provider_id
  AND t.claimed_at IS NOT NULL
  AND bp.claimed_at IS NULL
  AND bp.claim_state = 'claimed';

-- Cohort queries filter on claimed_at over a date range; the partial index
-- keeps that cheap without carrying the ~2,900 null rows.
CREATE INDEX IF NOT EXISTS idx_business_profiles_claimed_at
  ON business_profiles (claimed_at)
  WHERE claimed_at IS NOT NULL;
