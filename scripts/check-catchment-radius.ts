/**
 * Catchment radius checks — npx tsx scripts/check-catchment-radius.ts
 *
 * The catchment moved from hand-written city lists to a measured radius.
 * These are the cases that decide whether that was safe:
 *
 *   · a real provider the list never had (Millcreek, 5 mi from Utah)
 *   · one the radius must still exclude (St. George, 250 mi)
 *   · the fallback, so a row with no coordinates keeps the catchment it
 *     has always had
 *   · a university with no coordinates, which must behave exactly as
 *     before
 *   · a cross-border provider, because Florida State sits twenty miles
 *     from Georgia and a state-filtered query cannot see it
 *   · the bounding box, which must enclose the circle or the query drops
 *     providers before the predicate ever runs
 */
import { milesBetween, matchesCatchment, catchmentBounds, DEFAULT_RADIUS_MILES, getPartnerUniversity } from "@/lib/medjobs/catchment";

const uu = getPartnerUniversity("u-utah")!;
const fsu = getPartnerUniversity("florida-state")!;
const austin = getPartnerUniversity("ut-austin")!;
let fail = 0;
const ok = (name: string, got: unknown, want: unknown) => {
  const good = JSON.stringify(got) === JSON.stringify(want);
  if (!good) fail++;
  console.log(`${good ? "PASS" : "FAIL"}  ${name}  got=${JSON.stringify(got)} want=${JSON.stringify(want)}`);
};

// known distance: U of U -> Provo is ~38 mi straight line
const d = milesBetween(uu.lat!, uu.lon!, 40.2338, -111.6585);
ok("U of U to Provo ~38mi", Math.round(d), 38);
ok("zero distance", Math.round(milesBetween(40, -111, 40, -111)), 0);

// Millcreek: never on the city list, 5mi away -> must now match
ok("Millcreek by radius", matchesCatchment(uu, { city: "Millcreek", state: "UT", lat: 40.6869, lon: -111.8291 }), true);
// St George: 250mi, not on list -> must not match
ok("St George excluded", matchesCatchment(uu, { city: "St. George", state: "UT", lat: 37.0965, lon: -113.5684 }), false);
// on the city list but no coordinates -> must still match (the safety net)
ok("city-list fallback, no coords", matchesCatchment(uu, { city: "Sandy", state: "UT", lat: null, lon: null }), true);
// neither list nor radius
ok("neither", matchesCatchment(uu, { city: "Tooele", state: "UT", lat: null, lon: null }), false);
// a university with no coordinates falls back to the list only
ok("no-coord uni uses list", matchesCatchment(austin, { city: "Round Rock", state: "TX", lat: null, lon: null }), true);
ok("no-coord uni rejects other", matchesCatchment(austin, { city: "Dallas", state: "TX", lat: 32.7767, lon: -96.797 }), false);

// cross-border: Thomasville GA is ~35mi from FSU
ok("Thomasville GA in FSU radius", matchesCatchment(fsu, { city: "Thomasville", state: "GA", lat: 30.8366, lon: -83.9788 }), true);

// bounds must contain the radius
const b = catchmentBounds(uu)!;
const corner = milesBetween(uu.lat!, uu.lon!, b.latMax, uu.lon!);
ok("box reaches past radius (lat)", corner > DEFAULT_RADIUS_MILES, true);
const corner2 = milesBetween(uu.lat!, uu.lon!, uu.lat!, b.lonMax);
ok("box reaches past radius (lon)", corner2 > DEFAULT_RADIUS_MILES, true);
ok("no bounds without coords", catchmentBounds(austin), null);

console.log(fail === 0 ? "\nALL PASS" : `\n${fail} FAILED`);
process.exit(fail === 0 ? 0 : 1);
