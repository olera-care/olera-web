#!/usr/bin/env node
/**
 * Drift check: every cron in vercel.json must have a matching entry in
 * lib/crons/registry.ts (same path + same schedule), and vice versa.
 *
 * Run: node scripts/check-cron-registry.js   (or `npm run check:crons`)
 * Exits 1 with a report on any mismatch, 0 if clean.
 *
 * Substring-based — no TS parsing — so it's robust. It checks that the
 * registry file text contains `path: "<path>"` and `schedule: "<schedule>"`
 * for each vercel.json cron, and that every `path: "/api/cron/..."` literal in
 * the registry corresponds to a vercel.json cron path.
 */
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const vercelJson = JSON.parse(fs.readFileSync(path.join(root, "vercel.json"), "utf8"));
const registrySrc = fs.readFileSync(path.join(root, "lib/crons/registry.ts"), "utf8");

const crons = Array.isArray(vercelJson.crons) ? vercelJson.crons : [];
const problems = [];

// 1. Every vercel.json cron is represented in the registry, with a matching schedule.
for (const c of crons) {
  if (!registrySrc.includes(`path: "${c.path}"`)) {
    problems.push(`vercel.json cron "${c.path}" has no matching \`path: "${c.path}"\` in lib/crons/registry.ts`);
    continue;
  }
  if (!registrySrc.includes(`schedule: "${c.schedule}"`)) {
    problems.push(
      `cron "${c.path}" has schedule "${c.schedule}" in vercel.json but that schedule string is missing from lib/crons/registry.ts`,
    );
  }
}

// 2. Every registry path: "/api/cron/..." literal corresponds to a vercel.json cron.
const cronPaths = new Set(crons.map((c) => c.path));
const registryPaths = [...registrySrc.matchAll(/path:\s*"(\/api\/cron\/[^"]+)"/g)].map((m) => m[1]);
for (const p of registryPaths) {
  if (!cronPaths.has(p)) {
    problems.push(`lib/crons/registry.ts lists path "${p}" but there is no such cron in vercel.json`);
  }
}

if (problems.length > 0) {
  console.error("Cron registry drift detected:\n" + problems.map((p) => "  - " + p).join("\n"));
  console.error("\nFix: keep vercel.json crons and lib/crons/registry.ts entries in sync (same path + schedule).");
  process.exit(1);
}

console.log(`Cron registry OK — ${crons.length} crons, all matched between vercel.json and lib/crons/registry.ts.`);
