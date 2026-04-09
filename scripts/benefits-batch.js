#!/usr/bin/env node

/**
 * Benefits Pipeline — Batch Runner
 *
 * Runs the benefits pipeline on multiple states concurrently.
 *
 * Usage:
 *   node scripts/benefits-batch.js                    # all 50 states + DC
 *   node scripts/benefits-batch.js FL CA NY TX         # specific states
 *   node scripts/benefits-batch.js --concurrency 5     # 5 states at once
 *   node scripts/benefits-batch.js --skip MI           # skip already-done states
 *
 * Skips states that already have drafts.json unless --force is passed.
 */

const { execSync, spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const ALL_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY", "DC",
];

// Parse args
const args = process.argv.slice(2);
let concurrency = 3;
let force = false;
const skipStates = new Set();
const requestedStates = [];

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--concurrency") { concurrency = parseInt(args[++i]) || 3; continue; }
  if (args[i] === "--force") { force = true; continue; }
  if (args[i] === "--skip") { skipStates.add(args[++i]?.toUpperCase()); continue; }
  if (/^[A-Z]{2}$/i.test(args[i])) { requestedStates.push(args[i].toUpperCase()); continue; }
}

const pipelineRoot = path.resolve(__dirname, "..", "data", "pipeline");
const pipelineScript = path.resolve(__dirname, "benefits-pipeline.js");

// Determine which states to run
let states = requestedStates.length > 0 ? requestedStates : ALL_STATES;
states = states.filter((s) => !skipStates.has(s));

// Skip states that already have drafts (unless --force)
if (!force) {
  const before = states.length;
  states = states.filter((s) => {
    const draftsPath = path.join(pipelineRoot, s, "drafts.json");
    return !fs.existsSync(draftsPath);
  });
  const skipped = before - states.length;
  if (skipped > 0) {
    console.log(`  Skipping ${skipped} states with existing drafts (use --force to override)`);
  }
}

if (!states.length) {
  console.log(`  No states to process. All have drafts or were skipped.`);
  process.exit(0);
}

console.log(`\n  Benefits Pipeline — Batch Runner`);
console.log(`  States: ${states.length} (${states.join(", ")})`);
console.log(`  Concurrency: ${concurrency} states at once`);
console.log(`  Force: ${force}`);
console.log();

// Track progress
const results = { success: [], failed: [], skipped: [] };
const startTime = Date.now();
let completed = 0;

function runState(stateCode) {
  return new Promise((resolve) => {
    const start = Date.now();
    const child = spawn("node", [pipelineScript, "--state", stateCode, "--run"], {
      stdio: ["ignore", "pipe", "pipe"],
      env: process.env,
    });

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => { stdout += d.toString(); });
    child.stderr.on("data", (d) => { stderr += d.toString(); });

    child.on("close", (code) => {
      completed++;
      const elapsed = ((Date.now() - start) / 1000).toFixed(0);
      const totalElapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);

      if (code === 0) {
        // Extract program count from stdout
        const match = stdout.match(/Total unique programs: (\d+)/);
        const programs = match ? match[1] : "?";
        console.log(`  ✓ ${stateCode} — ${programs} programs, ${elapsed}s [${completed}/${states.length}, ${totalElapsed}m elapsed]`);
        results.success.push(stateCode);
      } else {
        console.log(`  ✗ ${stateCode} — FAILED (exit ${code}), ${elapsed}s [${completed}/${states.length}]`);
        if (stderr) console.log(`    ${stderr.split("\n")[0].slice(0, 100)}`);
        results.failed.push(stateCode);
      }
      resolve();
    });
  });
}

async function main() {
  // Process states with concurrency limit
  let nextIndex = 0;
  async function worker() {
    while (nextIndex < states.length) {
      const i = nextIndex++;
      await runState(states[i]);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, states.length) }, () => worker());
  await Promise.all(workers);

  // Regenerate pipeline-drafts.ts with all results
  console.log(`\n  Regenerating pipeline-drafts.ts...`);
  try {
    // Run any state's pipeline in report-only mode to trigger the generator
    // (generatePipelineSummary + generatePipelineDrafts run at the end)
    if (results.success.length > 0) {
      execSync(`node ${pipelineScript} --state ${results.success[0]} --phase report --run`, {
        stdio: "ignore",
        env: process.env,
      });
    }
  } catch { /* silent */ }

  // Summary
  const totalElapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  console.log(`\n  ━━━ BATCH COMPLETE ━━━`);
  console.log(`  Total time: ${totalElapsed} minutes`);
  console.log(`  Success: ${results.success.length} states`);
  if (results.failed.length > 0) {
    console.log(`  Failed: ${results.failed.length} states (${results.failed.join(", ")})`);
    console.log(`  Retry failed: node scripts/benefits-batch.js ${results.failed.join(" ")}`);
  }
  console.log();
}

main().catch((err) => {
  console.error(`  Fatal: ${err.message}`);
  process.exit(1);
});
