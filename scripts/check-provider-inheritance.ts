/**
 * Claimed providers must inherit the directory row's external Google/CMS/trust
 * data. Regression guard for `e8bce717a`, which introduced "prefer the claimed
 * record" and silently blanked the star rating of every provider who claimed a
 * listing (267 live profiles at the time of the fix).
 *
 * Run: npm run check:provider-inheritance
 */
import assert from "node:assert/strict";
import { accountRowToProvider, directoryRowToProvider } from "../lib/providers/adapters";
import type { Provider as IOSProvider } from "../lib/types/provider";
import type { Profile } from "../lib/types";

const dirRow = {
  provider_id: "abc123",
  provider_name: "Elderlink Home Care",
  provider_category: "Home Care (Non-medical)",
  place_id: "PLACE_DIRECTORY",
  google_reviews_data: { rating: 4.9, review_count: 72, reviews: [] },
  cms_data: { overall_rating: 5 },
  ai_trust_signals: { summary_score: 80 },
  parent_organization: { name: "Elderlink Inc" },
} as unknown as IOSProvider;

const bareProfile = {
  id: "profile-1",
  category: "home_care_agency",
  metadata: {},
} as unknown as Profile;

// 1. The regression itself: a claimed profile with no Google data of its own
//    must show the directory's rating, not a blank page.
const inherited = accountRowToProvider(bareProfile, dirRow);
assert.equal(inherited.googleReviewsData?.rating, 4.9, "must inherit directory rating");
assert.equal(inherited.googleReviewsData?.review_count, 72, "must inherit review count");
assert.equal(inherited.placeId, "PLACE_DIRECTORY", "must inherit directory place_id");
assert.equal(inherited.cmsData?.overall_rating, 5, "must inherit CMS quality");
assert.equal(inherited.aiTrustSignals?.summary_score, 80, "must inherit trust signals");
assert.equal(inherited.parentOrganization?.name, "Elderlink Inc", "must inherit franchise parent");
assert.equal(inherited.source, "account", "still resolves as an account row");
assert.equal(inherited.rawProviderId, "profile-1", "raw id stays the profile id");

// 2. The account row still wins where it has its own value — a provider who
//    connected their own Google Business Profile keeps it.
const ownGoogle = accountRowToProvider(
  {
    ...bareProfile,
    metadata: {
      google_metadata: { place_id: "PLACE_OWN" },
      google_reviews_data: { rating: 3.1, review_count: 9, reviews: [] },
    },
  } as unknown as Profile,
  dirRow,
);
assert.equal(ownGoogle.placeId, "PLACE_OWN", "own place_id beats directory");
assert.equal(ownGoogle.googleReviewsData?.rating, 3.1, "own reviews beat directory");

// 3. Partial: own place_id but no cached reviews yet still inherits reviews
//    rather than rendering blank while the backfill catches up.
const partial = accountRowToProvider(
  { ...bareProfile, metadata: { google_metadata: { place_id: "PLACE_OWN" } } } as unknown as Profile,
  dirRow,
);
assert.equal(partial.placeId, "PLACE_OWN");
assert.equal(partial.googleReviewsData?.rating, 4.9, "reviews fall back independently of place_id");

// 4. Native account profiles (never claimed a listing) have no directory row
//    and must not gain phantom data.
const native = accountRowToProvider(bareProfile, null);
assert.equal(native.googleReviewsData, null, "no directory row -> no reviews");
assert.equal(native.placeId, null, "no directory row -> no place_id");
assert.equal(native.cmsData, null);
assert.equal(native.aiTrustSignals, null);
assert.equal(native.parentOrganization, null);

// 5. Category inheritance (the adapter's original job) still works when the
//    account row predates category syncing.
const noCategory = accountRowToProvider(
  { ...bareProfile, category: null } as unknown as Profile,
  dirRow,
);
assert.equal(
  noCategory.profile.category,
  "home_care_agency",
  "category still inherited from the directory row",
);

// 6. Unclaimed directory rows are untouched by this change.
const direct = directoryRowToProvider(dirRow);
assert.equal(direct.source, "directory");
assert.equal(direct.googleReviewsData?.rating, 4.9);
assert.equal(direct.rawProviderId, "abc123");

console.log("check-provider-inheritance: all assertions passed (6 groups)");
