/**
 * Category-aware section order on the provider page (docs/providers/CATEGORY-PAGES.md).
 * Guards three things: every order lists every section exactly once (a missing
 * key silently drops a section from the page), categories without a plan keep
 * the original order, and the Facebook URL guard rejects anything but a page.
 *
 * Run: npm run check:provider-section-order
 */
import assert from "node:assert/strict";
import { DEFAULT_SECTION_ORDER, getSectionOrder, safeFacebookUrl } from "../lib/provider-section-order";
import type { ProfileCategory } from "../lib/types";

const CATEGORIES: ProfileCategory[] = [
  "home_care_agency",
  "home_health_agency",
  "hospice_agency",
  "independent_living",
  "assisted_living",
  "memory_care",
  "nursing_home",
];
const ALL = [...DEFAULT_SECTION_ORDER].sort();

for (const c of CATEGORIES) {
  const order = getSectionOrder(c);
  assert.deepEqual([...order].sort(), ALL, `${c}: every section exactly once`);
}

// The two categories with a plan lead with what families ask about first.
assert.equal(getSectionOrder("home_care_agency")[0], "services");
assert.equal(getSectionOrder("home_care_agency")[1], "screening");
assert.equal(getSectionOrder("nursing_home")[0], "quality");

// Everything else is the page as it was.
for (const c of ["assisted_living", "memory_care", "home_health_agency", "independent_living", "hospice_agency"] as ProfileCategory[]) {
  assert.deepEqual(getSectionOrder(c), DEFAULT_SECTION_ORDER, `${c}: unchanged`);
}
assert.deepEqual(getSectionOrder(null), DEFAULT_SECTION_ORDER);

assert.equal(safeFacebookUrl("https://www.facebook.com/elderlinkhomecare"), "https://www.facebook.com/elderlinkhomecare");
assert.equal(safeFacebookUrl("https://facebook.com/pages/Some-Place/123"), "https://facebook.com/pages/Some-Place/123");
assert.equal(safeFacebookUrl("javascript:alert(1)"), null);
assert.equal(safeFacebookUrl("https://www.facebook.com.evil.example/x"), null);
assert.equal(safeFacebookUrl("http://www.facebook.com/x"), null);
assert.equal(safeFacebookUrl(null), null);
// Junk the sweep wrote (counts in docs/providers/CATEGORY-PAGES.md)
assert.equal(safeFacebookUrl("https://www.facebook.com/2008/fbml"), null);
assert.equal(safeFacebookUrl("https://www.facebook.com/profile.php"), null);
assert.equal(safeFacebookUrl("https://www.facebook.com/wix"), null);
assert.equal(safeFacebookUrl("https://www.facebook.com/share/abc"), null);
assert.equal(safeFacebookUrl("https://www.facebook.com/people/Some-Agency/100064"), "https://www.facebook.com/people/Some-Agency/100064");
assert.equal(safeFacebookUrl("https://www.facebook.com/p/Some-Agency-100064"), "https://www.facebook.com/p/Some-Agency-100064");

console.log("check-provider-section-order: all assertions passed");
