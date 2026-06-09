-- Migration 101: parent_organization column on olera-providers
--
-- Adds a structured parent_organization to "olera-providers" so the public
-- provider page (app/provider/[slug]/page.tsx) can emit schema.org
-- `parentOrganization` LocalBusiness JSON-LD for franchise-affiliated
-- locations (Visiting Angels, Brookdale, Home Instead, etc.). This lets Google
-- associate a specific facility page with the broader trusted brand —
-- brand-authority inheritance + cross-branded query matching.
--
-- Shape (NULL for non-franchise providers):
--   { "name": "Visiting Angels", "url": "https://www.visitingangels.com" }
--
-- Populated by scripts/franchise-classify.js --commit, which classifies the
-- directory against a curated 19-brand dictionary using a layered verifier:
--   1. regex name match (free)
--   2. website-domain auto-confirm (free, ~3.7K of ~4K matches)
--   3. Perplexity Sonar web-search verify for the ambiguous remainder, with a
--      lenient prompt for distinctive trademarked names and a strict
--      positive-evidence prompt for common-word brands (Brookdale, Atria, …)
-- ~4,026 providers tagged on the first run, ~0 mis-attributions on review.
--
-- Apply via Supabase dashboard (NOT CLI).

ALTER TABLE "olera-providers"
  ADD COLUMN IF NOT EXISTS parent_organization JSONB;

COMMENT ON COLUMN "olera-providers".parent_organization IS
  'Franchise parent brand for schema.org parentOrganization JSON-LD on the provider page. Shape: {"name": "...", "url": "..."}. NULL for independent providers. Populated by scripts/franchise-classify.js --commit.';

-- Partial index for "show all locations of brand X" admin queries. The public
-- page reads parent_organization as a column by slug/provider_id, so no index
-- is needed for that path.
CREATE INDEX IF NOT EXISTS idx_olera_providers_parent_org
  ON "olera-providers" ((parent_organization->>'name'))
  WHERE parent_organization IS NOT NULL;
