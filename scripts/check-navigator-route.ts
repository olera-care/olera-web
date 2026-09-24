/**
 * Pure checks for routePacket (lib/benefits/navigator-packet.ts). No DB, no
 * model calls.
 *
 *   npx tsx scripts/check-navigator-route.ts
 *
 * Pins the caveat path (2026-09-24): a "questionable" read on the family's
 * ENTRY program, with an alternative both models agreed on, is rewritten once
 * with the condition stated (route recompose, caveat) instead of either
 * switching programs or sending bare. After the rewrite the same read falls
 * through to the normal holds.
 */
import {
  CAVEAT_HOLD_PREFIX,
  holdLabel,
  isCaveatPacket,
  rerouteStoredPacket,
  routePacket,
  type NavigatorPacket,
  type ClearanceRead,
  type FitRead,
  type RouteInput,
} from "../lib/benefits/navigator-packet";

let failures = 0;
function check(name: string, cond: boolean, detail?: unknown) {
  if (cond) console.log(`ok   ${name}`);
  else {
    failures++;
    console.log(`FAIL ${name}`, detail ?? "");
  }
}

const clean: ClearanceRead = {
  programId: "p",
  stateId: "oregon",
  lastVerifiedDate: "2026-09-01",
  ageDays: 20,
  highFindings: [],
  cleared: true,
};

const read = (verdict: FitRead["verdict"], better: string | null = "Oregon Project Independence"): FitRead => ({
  model: verdict + Math.random(),
  verdict,
  why: "Only serves seniors who are homeless or unstably housed.",
  better,
});

const base = (over: Partial<RouteInput>): RouteInput => ({
  facts: { directional: ["what they came for: paying for care"], screening: [], missing: [], enoughToPick: true },
  fit: [read("questionable"), read("questionable")],
  recomposeTarget: { name: "Oregon Project Independence", programId: "opi" },
  pickIsEntry: true,
  caveatApplied: false,
  rails: [],
  clearance: clean,
  lint: [],
  intakeAgeDays: 10,
  statesDollarFigure: false,
  ...over,
});

// 1. entry + questionable + target + no caveat yet → caveat recompose
{
  const r = routePacket(base({}));
  check("entry+questionable+target → recompose", r.route === "recompose", r);
  check("  marked caveat", r.caveat === true, r);
  check("  hold carries the caveat prefix", r.holds[0]?.startsWith(CAVEAT_HOLD_PREFIX), r.holds);
  check("  hold names the alternative", r.holds[0]?.includes("Oregon Project Independence"), r.holds);
  check(
    "  isCaveatPacket reads it",
    isCaveatPacket({ route: r.route, holds: r.holds, caveat: r.caveat }),
  );
  check("  holdLabel is readable", holdLabel(r.holds[0]) === "Kept their program, added the condition");
}

// 2. same, caveat already applied → falls through; clean otherwise → auto
{
  const r = routePacket(base({ caveatApplied: true }));
  check("caveat applied → auto when nothing else holds", r.route === "auto" && r.holds.length === 0, r);
  check("  not marked caveat", !r.caveat, r);
  const held = routePacket(base({ caveatApplied: true, statesDollarFigure: true }));
  check("caveat applied + dollar figure → review", held.route === "review", held);
}

// 3. non-entry questionable + target → switch recompose (unchanged)
{
  const r = routePacket(base({ pickIsEntry: false }));
  check("non-entry questionable+target → recompose", r.route === "recompose", r);
  check("  not a caveat", !r.caveat && !isCaveatPacket({ route: r.route, holds: r.holds }), r);
  check("  hold names the switch", r.holds[0]?.startsWith("both models would start with"), r.holds);
  const again = routePacket(base({ pickIsEntry: false, caveatApplied: true }));
  check("  caveatApplied does not change a non-entry switch", again.route === "recompose" && !again.caveat, again);
}

// 4. wrong → recompose (unchanged), entry or not, caveat or not
{
  for (const pickIsEntry of [true, false]) {
    for (const caveatApplied of [true, false]) {
      const r = routePacket(base({ fit: [read("wrong"), read("wrong")], pickIsEntry, caveatApplied }));
      check(
        `wrong (entry=${pickIsEntry}, caveatApplied=${caveatApplied}) → ruled-out recompose`,
        r.route === "recompose" && !r.caveat && r.holds[0]?.startsWith("pick ruled out"),
        r,
      );
    }
  }
}

// 5. entry + questionable, no agreed target → no caveat, bare questionable does not hold
{
  const r = routePacket(base({ recomposeTarget: null }));
  check("entry+questionable, no target → auto", r.route === "auto" && !r.caveat, r);
}

// 6. entry + good + target → no caveat
{
  const r = routePacket(base({ fit: [read("good"), read("good")] }));
  check("entry+good+target → auto (no caveat)", r.route === "auto" && !r.caveat, r);
}

// 7. A packet stored under the OLD rule (switch recompose on an entry pick)
//    re-routes to the caveat without a model call; once the caveat is
//    applied it re-routes to auto; a current packet comes back untouched.
{
  const input = base({});
  const stored: NavigatorPacket = {
    version: 1,
    builtAt: "2026-09-20T00:00:00Z",
    facts: input.facts,
    fit: input.fit,
    rails: [],
    clearance: clean,
    lint: [],
    intakeAgeDays: 10,
    statesDollarFigure: false,
    route: "recompose",
    recomposeTarget: input.recomposeTarget ?? null,
    holds: ["both models would start with Oregon Project Independence instead"],
    models: {},
  };
  const a = rerouteStoredPacket(stored, { pickIsEntry: true, caveatApplied: false });
  check("stored old switch verdict → caveat", a.route === "recompose" && a.caveat === true && isCaveatPacket(a), a);
  const b = rerouteStoredPacket(stored, { pickIsEntry: true, caveatApplied: true });
  check("stored verdict after caveat → auto", b.route === "auto" && !b.caveat && b.holds.length === 0, b);
  const c = rerouteStoredPacket(stored, { pickIsEntry: false, caveatApplied: false });
  check("non-entry stored switch verdict unchanged (same object)", c === stored, c);
}

if (failures > 0) {
  console.log(`\n${failures} failed`);
  process.exit(1);
}
console.log("\nall passed");
