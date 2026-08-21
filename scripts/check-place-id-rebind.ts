/**
 * Guards the address-agreement gate that lets a provider re-point their Google
 * Business Profile themselves instead of emailing support.
 *
 * The gate's job is narrow: stop a rebind from becoming a way to adopt another
 * business's rating. It errs strict — a false refusal sends the provider to
 * support, a false agreement hands them someone else's stars.
 *
 * Run: npm run check:place-id-rebind
 */
import assert from "node:assert/strict";
import { streetKey, addressesAgree } from "../lib/providers/address-match";

// ── Formatting noise must NOT read as a different location ──────────────────
// Profiles store a street line; Google returns a full postal string.
assert.equal(
  streetKey("1800 Teague Dr , Suite 404"),
  streetKey("1800 Teague Drive, Sherman, TX 75090, USA"),
  "suffix abbreviation + unit + postal tail are all noise",
);
assert.equal(
  streetKey("517 N Mountain Ave #214"),
  streetKey("517 North Mountain Avenue, Upland, CA 91786, USA"),
  "directional and suffix expansion both normalize",
);
assert.ok(
  addressesAgree("3236 Landmark Drive Suite 121", "3236 Landmark Dr Suite 121, North Charleston, SC, USA").agrees,
  "Drive/Dr with matching suites agrees",
);

// ── Real mismatches must be refused ─────────────────────────────────────────
// A-1 Home Care: profile in Whittier, bound Place in Pasadena. The case that
// started this work.
const a1 = addressesAgree(
  "15111 Whittier Blvd. Suite 360",
  "680 E Colorado Blvd Suite 180, Pasadena, CA 91101, USA",
);
assert.equal(a1.agrees, false, "A-1 Whittier profile must not bind to the Pasadena Place");
assert.equal(a1.agrees === false && a1.reason, "different-street");

// Therapy Partners of Texas: profile in Sherman, bound Place is a different
// company in McAllen.
assert.equal(
  addressesAgree("1800 Teague Dr , Suite 404", "2418 Buddy Owens Blvd, McAllen, TX 78504, USA").agrees,
  false,
  "different company at a different address must be refused",
);

// Same street number, different street.
assert.equal(
  addressesAgree("902 E Rosemonte Drive", "902 W Bell Rd, Phoenix, AZ, USA").agrees,
  false,
  "matching house number alone is not agreement",
);

// ── Fails closed on missing data ────────────────────────────────────────────
for (const [profileAddr, placeAddr, label] of [
  [null, "1800 Teague Dr, Sherman, TX", "no profile address"],
  ["1800 Teague Dr", null, "no Place address (e.g. no API key)"],
  ["", "", "both blank"],
] as const) {
  const result = addressesAgree(profileAddr, placeAddr);
  assert.equal(result.agrees, false, `must refuse when ${label}`);
  assert.equal(result.agrees === false && result.reason, "indeterminate", label);
}

// ── Strictness is deliberate ────────────────────────────────────────────────
// A bare trailing unit token ("3120 O St a") has no unit keyword to strip, so
// it reads as a different street and the provider is sent to support. That is
// the safe direction to be wrong in; documented here so it is a known cost of
// the gate rather than a surprise.
assert.equal(
  addressesAgree("3120 O Street, Ste A", "3120 O St a, Lincoln, NE 68510, USA").agrees,
  false,
  "bare trailing unit token refuses rather than guessing",
);

console.log("check-place-id-rebind: all assertions passed");
