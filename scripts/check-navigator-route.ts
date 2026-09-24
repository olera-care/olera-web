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
 *
 * Only a reason that names a real eligibility gate opens the caveat path;
 * a fit-only reason falls straight through (namesEligibilityGate). And a care
 * need inferred from the program page stays a directional fact (no new "ask")
 * but is worded as the page they came through, not as their words.
 */
import {
  CAVEAT_HOLD_PREFIX,
  claimsStatedNeed,
  eligibilityGateReasons,
  holdLabel,
  namesEligibilityGate,
  readFacts,
  recomposeKeepsProgram,
  isCaveatPacket,
  isRewritePacket,
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

// 8. The eligibility-gate classifier, on real fit reasons from the live queue.
const GATE_REASONS = [
  "ERA is narrowly for elderly people who are homeless or unstably housed and pays rent",
  "At 60 with no stated disability or nursing-facility level of care, SMMC-LTC's age/LOC gates make it a long shot",
  "It could help, but it hinges on a homebound status they never claimed",
  "It is real money, but it carries narrow restrictions (all-household 65+, no earned income)",
];
const FIT_ONLY_REASONS = [
  "LIHEAP offers real, fast utility money but doesn't address their stated need to pay for care",
  "SNAP delivers real money quickly but addresses groceries rather than the care costs the family actually asked about",
  "Medicare Savings Programs cut Medicare premiums and cost-sharing but do not pay for the ongoing care services",
  "It helps, but it is not the strongest first call for this family",
  "Real money quickly, though a waiver would answer them more directly",
  // A program NAME with a gate word, and a fact about the family, are not gates.
  "AESAP provides real food assistance quickly but doesn't address the family's stated need to pay for care, which the Elderly & Disabled Waiver directly targets",
  "LIHEAP does not directly pay for long-term care and Community Choices is the more appropriate first call for a Medicaid-enrolled older adult seeking care funding",
  "LIHEAP is real money they likely qualify for at 60 with under-$1,500 income, but it pays utility bills",
];
for (const why of GATE_REASONS) check(`gate: ${why.slice(0, 60)}`, namesEligibilityGate(why));
for (const why of FIT_ONLY_REASONS) check(`fit only: ${why.slice(0, 60)}`, !namesEligibilityGate(why));

const withWhy = (why: string, verdict: FitRead["verdict"] = "questionable"): FitRead => ({
  model: why.slice(0, 8) + Math.random(),
  verdict,
  why,
  better: "Oregon Project Independence",
});

// 9. entry + questionable + target, reasons all about fit → no caveat, auto
{
  const fitOnly = [withWhy(FIT_ONLY_REASONS[0]), withWhy(FIT_ONLY_REASONS[1])];
  const r = routePacket(base({ fit: fitOnly }));
  check("fit-only questionable on entry → auto (no caveat)", r.route === "auto" && !r.caveat && r.holds.length === 0, r);
  const held = routePacket(base({ fit: fitOnly, clearance: null }));
  check("  still takes its other holds (no clearance → review)", held.route === "review" && !held.caveat, held);
  const nonEntry = routePacket(base({ pickIsEntry: false, fit: fitOnly }));
  check("  non-entry fit-only still switches", nonEntry.route === "recompose" && !nonEntry.caveat, nonEntry);
}

// 10. one gate reason + one fit reason → caveat; only the gate reason is a condition
{
  const fit = [withWhy(GATE_REASONS[0]), withWhy(FIT_ONLY_REASONS[0])];
  const r = routePacket(base({ fit }));
  check("gate + fit reasons → caveat", r.route === "recompose" && r.caveat === true, r);
  const conds = eligibilityGateReasons(fit);
  check("  only the gate reason is passed on", conds.length === 1 && conds[0] === GATE_REASONS[0], conds);
  check(
    "  a good read's reason is never a condition",
    eligibilityGateReasons([withWhy(GATE_REASONS[1], "good")]).length === 0,
  );
}

// 11. A packet stored as a caveat under the first rule, with fit-only
//     reasons, re-routes to fall through (auto here) with no model call.
{
  const input = base({ fit: [withWhy(FIT_ONLY_REASONS[0]), withWhy(FIT_ONLY_REASONS[2])] });
  const stored: NavigatorPacket = {
    version: 1,
    builtAt: "2026-09-24T00:00:00Z",
    facts: input.facts,
    fit: input.fit,
    rails: [],
    clearance: clean,
    lint: [],
    intakeAgeDays: 10,
    statesDollarFigure: false,
    route: "recompose",
    caveat: true,
    recomposeTarget: input.recomposeTarget ?? null,
    holds: [`${CAVEAT_HOLD_PREFIX} keep their program, state the condition, offer Oregon Project Independence`],
    models: {},
  };
  const a = rerouteStoredPacket(stored, { pickIsEntry: true, caveatApplied: false });
  check("stored fit-only caveat verdict → auto", a.route === "auto" && !a.caveat && !isCaveatPacket(a), a);
}

// 12. Care need provenance in the facts gate.
{
  const common = {
    careTypes: [],
    age: null,
    incomeBand: null,
    medicaidStatus: null,
    veteranStatus: null,
    situation: null,
  };
  const stated = readFacts({ ...common, careNeed: "payingForCare", careNeedSource: "stated" });
  check("stated need → directional 'paying for care'", stated.directional[0] === "what they came for: paying for care", stated);
  const legacy = readFacts({ ...common, careNeed: "payingForCare" });
  check("no source reads as stated", legacy.directional[0] === "what they came for: paying for care", legacy);
  const inferred = readFacts({
    ...common,
    careNeed: "payingForCare",
    careNeedSource: "inferred_from_page",
    entryProgram: "LIHEAP",
  });
  check("inferred need keeps enoughToPick (no new ask)", inferred.enoughToPick, inferred);
  check(
    "  worded as the page, not their need",
    !!inferred.directional[0]?.includes("LIHEAP program page") && !inferred.directional[0]?.includes("paying for care"),
    inferred.directional,
  );
  check("  need listed as missing", inferred.missing.includes("what kind of care or help they need"), inferred.missing);
  const r = routePacket(base({ facts: inferred }));
  check("  inferred-need family routes like before (not ask)", r.route !== "ask", r);
  const noEntry = readFacts({ ...common, careNeed: "payingForCare", careNeedSource: "inferred_from_page" });
  check(
    "inferred need without entry name still directional",
    noEntry.enoughToPick && /not stated/.test(noEntry.directional[0] ?? ""),
    noEntry,
  );
}

// 13. A letter that claims a need the family never stated is rewritten on the
//     same program, whatever else would have happened to it short of a
//     program change.
{
  const CLAIMS = [
    "Hi, it's TJ with Olera. You said you need help paying for care.",
    "You also told us you need help paying for care.",
    "You are looking for help paying for care.",
    "You told us you need help staying at home.",
  ];
  const NO_CLAIM = [
    "You were looking at LIHEAP on Olera. That is worth applying for.",
    "SNAP will not pay for care itself. It frees up money each month.",
    "This program will not pay for care itself.",
  ];
  for (const t of CLAIMS) check(`claims a stated need: ${t.slice(0, 50)}`, claimsStatedNeed(t));
  for (const t of NO_CLAIM) check(`no claim: ${t.slice(0, 50)}`, !claimsStatedNeed(t));

  const fitOnly = [withWhy(FIT_ONLY_REASONS[0]), withWhy(FIT_ONLY_REASONS[1])];
  const r = routePacket(base({ fit: fitOnly, claimsUnstatedNeed: true }));
  check("fit-only entry + false need claim → rewrite", r.route === "recompose" && r.rewrite === true && !r.caveat, r);
  check("  isRewritePacket reads it", isRewritePacket({ route: r.route, holds: r.holds, rewrite: r.rewrite }));
  check("  keeps the program", recomposeKeepsProgram({ route: r.route, holds: r.holds, rewrite: r.rewrite }));
  const caveatFirst = routePacket(base({ claimsUnstatedNeed: true }));
  check("gate reason still takes the caveat (it rewrites too)", caveatFirst.caveat === true && !caveatFirst.rewrite, caveatFirst);
  const switched = routePacket(base({ pickIsEntry: false, fit: fitOnly, claimsUnstatedNeed: true }));
  check("non-entry switch still switches", switched.route === "recompose" && !switched.rewrite, switched);

  const stored: NavigatorPacket = {
    version: 1,
    builtAt: "2026-09-20T00:00:00Z",
    facts: base({}).facts,
    fit: fitOnly,
    rails: [],
    clearance: clean,
    lint: [],
    intakeAgeDays: 10,
    statesDollarFigure: true,
    route: "review",
    recomposeTarget: null,
    holds: ["letter states a dollar figure"],
    models: {},
  };
  const a = rerouteStoredPacket(stored, { pickIsEntry: true, caveatApplied: false, claimsUnstatedNeed: true });
  check("stored review + false need claim → rewrite", a.route === "recompose" && a.rewrite === true, a);
  const b = rerouteStoredPacket(stored, { pickIsEntry: true, caveatApplied: false });
  check("stored review, no claim → unchanged", b === stored, b);
}

// 14. A fit read made under the invented need cannot move the program: a
//     switch or a "wrong" becomes a same-program rewrite; a gate caveat stays.
{
  const fitOnly = [withWhy(FIT_ONLY_REASONS[0]), withWhy(FIT_ONLY_REASONS[1])];
  const sw = routePacket(base({ pickIsEntry: false, fit: fitOnly, fitReadOnInventedNeed: true }));
  check("stale-fit switch → rewrite", sw.route === "recompose" && sw.rewrite === true, sw);
  const wr = routePacket(base({ fit: [read("wrong"), read("wrong")], fitReadOnInventedNeed: true }));
  check("stale-fit wrong → rewrite", wr.route === "recompose" && wr.rewrite === true, wr);
  const cv = routePacket(base({ fitReadOnInventedNeed: true }));
  check("stale-fit gate caveat stays a caveat", cv.caveat === true && !cv.rewrite, cv);
  const ok = routePacket(base({ fit: fitOnly, fitReadOnInventedNeed: true }));
  check("stale-fit, nothing to move, no claim → auto", ok.route === "auto", ok);
}

if (failures > 0) {
  console.log(`\n${failures} failed`);
  process.exit(1);
}
console.log("\nall passed");
