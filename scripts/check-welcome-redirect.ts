/**
 * One rule for who skips the /welcome interstitial.
 *
 * /welcome is the care-seeker questionnaire. Putting it in front of somebody
 * who is not a care seeker — a provider, or a student following a link to
 * finish their application — reads to them as the link being broken.
 *
 * That rule was written out three separate times, each with a different idea
 * of what counted, and fixing one left the other two still doing it. This
 * fails the build if a file sends somebody to /welcome without consulting the
 * shared rule, and checks the rule itself still answers correctly.
 *
 * Proven non-vacuous by deliberately writing a fourth copy and by breaking
 * the predicate.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { skipsWelcome, WELCOME_SKIP_PREFIXES } from "../lib/auth/welcome-redirect";

const ROOT = process.cwd();
const SEARCH = ["app", "components", "lib"];
const HELPER = "lib/auth/welcome-redirect.ts";

/** Sending somebody to the interstitial, in any of the ways it is written. */
const SENDS_TO_WELCOME = /["'`]\/welcome\?next=/;
const IMPORTS_RULE = /from\s+["'](@\/lib\/auth\/welcome-redirect|\.\.?\/[^"']*welcome-redirect)["']/;

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === ".next" || entry.startsWith(".")) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.tsx?$/.test(full)) out.push(full);
  }
  return out;
}

const problems: string[] = [];

// ── every caller consults the rule ───────────────────────────────────────
for (const dir of SEARCH) {
  for (const file of walk(join(ROOT, dir))) {
    const rel = relative(ROOT, file);
    if (rel === HELPER) continue;
    const src = readFileSync(file, "utf8");
    if (!SENDS_TO_WELCOME.test(src)) continue;
    if (!IMPORTS_RULE.test(src)) {
      problems.push(
        `${rel} sends somebody to /welcome without importing skipsWelcome from ${HELPER}.\n` +
          `    Every sign-in path has to agree on who skips it, or fixing one leaves the rest.`,
      );
    }
  }
}

// ── the rule itself still answers correctly ──────────────────────────────
const cases: Array<[string | null, boolean]> = [
  ["/portal/medjobs", true],
  ["/portal/medjobs/jobs", true],
  ["/portal/medjobs?from=email", true],
  ["/provider", true],
  ["/provider/acme/onboard", true],
  // Near misses that must NOT skip.
  ["/portal", false],
  ["/portal/profile", false],
  ["/portal/medjobsomething", false],
  ["/providers-are-great", false],
  ["/browse", false],
  // Not a path of ours.
  ["//evil.example/portal/medjobs", false],
  ["https://evil.example/portal/medjobs", false],
  ["", false],
  [null, false],
];
for (const [input, want] of cases) {
  const got = skipsWelcome(input);
  if (got !== want) {
    problems.push(`skipsWelcome(${JSON.stringify(input)}) is ${got}, should be ${want}`);
  }
}

if (WELCOME_SKIP_PREFIXES.length === 0) {
  problems.push("WELCOME_SKIP_PREFIXES is empty — nobody would skip the interstitial.");
}

if (problems.length > 0) {
  console.error("✗ /welcome redirect\n");
  for (const p of problems) console.error(`  ${p}`);
  console.error("");
  process.exit(1);
}

console.log(
  `✓ /welcome redirect — one rule, ${WELCOME_SKIP_PREFIXES.length} exempt prefixes, ` +
    `every caller consults it`,
);
