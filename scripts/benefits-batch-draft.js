#!/usr/bin/env node

/**
 * Benefits Pipeline — Batch Draft Runner
 *
 * Submits program draft generation for multiple states as ONE Anthropic Message
 * Batches API request. Gets 50% cost + dedicated throughput (no 529 overload issues)
 * + ~1–3 hour turnaround for ~700 drafts vs 5–12 hours serial.
 *
 * Uses prompt caching on the CONTENT_VOICE_PROMPT for an additional speedup.
 *
 * Reads each state's existing `dive.json` + `classify.json` (so explore/dive/compare/
 * classify must already have been run). Writes each state's `drafts.json` with
 * program results, then generates state overviews serially, then regenerates
 * `data/pipeline-drafts.ts` and `data/pipeline-summary.ts`.
 *
 * Usage:
 *   node scripts/benefits-batch-draft.js                   # all states with classify.json except TX
 *   node scripts/benefits-batch-draft.js CA FL NY          # specific states
 *   node scripts/benefits-batch-draft.js --include-tx      # include TX (default skipped, already v3)
 *   node scripts/benefits-batch-draft.js --resume MSG_BATCH_ID  # resume polling of an existing batch
 *   node scripts/benefits-batch-draft.js --dry-run         # show what would be submitted, don't submit
 */

'use strict';

// ---- Env loading: support worktree + main repo ----
const path = require('path');
const MAIN_REPO = path.resolve(process.env.HOME, 'Desktop/olera-web');
module.paths.unshift(path.join(MAIN_REPO, 'node_modules'));
const envPaths = [
  path.resolve(__dirname, '..', '.env.local'),
  path.resolve(MAIN_REPO, '.env.local'),
];
for (const p of envPaths) {
  if (require('fs').existsSync(p)) {
    require('dotenv').config({ path: p });
    break;
  }
}

const fs = require('fs');
const pipeline = require('./benefits-pipeline.js');

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = 'claude-sonnet-4-20250514';
const BATCH_URL = 'https://api.anthropic.com/v1/messages/batches';
const PIPELINE_ROOT = path.resolve(__dirname, '..', 'data', 'pipeline');

// ---- CLI ----

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    states: [],
    includeTx: false,
    resume: null,
    dryRun: false,
    pollInterval: 30000,
    help: false,
  };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--include-tx') { opts.includeTx = true; continue; }
    if (a === '--resume') { opts.resume = args[++i]; continue; }
    if (a === '--dry-run') { opts.dryRun = true; continue; }
    if (a === '--poll-interval') { opts.pollInterval = parseInt(args[++i]) * 1000; continue; }
    if (a === '--help' || a === '-h') { opts.help = true; continue; }
    if (/^[A-Z]{2}$/i.test(a)) { opts.states.push(a.toUpperCase()); continue; }
  }
  return opts;
}

function printUsage() {
  console.log(`
  Benefits Pipeline — Batch Draft Runner

  Submits program drafts to Anthropic Message Batches API (50% cost, dedicated
  throughput, 1–3h turnaround for ~700 drafts).

  Usage:
    node scripts/benefits-batch-draft.js                   # all states w/ classify.json (skips TX)
    node scripts/benefits-batch-draft.js CA FL NY          # specific states
    node scripts/benefits-batch-draft.js --include-tx
    node scripts/benefits-batch-draft.js --resume batches_01XYZ  # poll existing batch
    node scripts/benefits-batch-draft.js --dry-run         # show plan, don't submit

  Prerequisites: each target state must have data/pipeline/{STATE}/dive.json and
  classify.json. If missing, run the explore/dive/classify phases first.
  `);
}

// ---- State selection ----

function discoverStates(opts) {
  if (opts.states.length > 0) return opts.states;

  const dirs = fs.readdirSync(PIPELINE_ROOT).filter((d) => {
    if (!/^[A-Z]{2}$/.test(d)) return false;
    if (!opts.includeTx && d === 'TX') return false;
    return fs.existsSync(path.join(PIPELINE_ROOT, d, 'classify.json'));
  });
  return dirs.sort();
}

// ---- Build batch requests ----

function buildRequests(stateCodes) {
  const requests = [];
  const metadata = {};
  const skipped = [];

  for (const stateCode of stateCodes) {
    const dirName = stateCode;
    const dive = pipeline.readJson(dirName, 'dive.json');
    const classify = pipeline.readJson(dirName, 'classify.json');

    if (!dive || !Array.isArray(dive.programs)) {
      skipped.push({ stateCode, reason: 'missing dive.json' });
      continue;
    }
    if (!classify || !Array.isArray(classify.programs)) {
      skipped.push({ stateCode, reason: 'missing classify.json' });
      continue;
    }

    const entity = {
      stateCode,
      name: pipeline.STATE_NAMES[stateCode],
      isState: true,
      dirName,
      slug: (pipeline.STATE_NAMES[stateCode] || stateCode).toLowerCase().replace(/\s+/g, '-'),
    };

    const divePrograms = dive.programs.filter((p) => !p._error && !p._parseError);
    const classifications = classify.programs;
    const draftedAt = new Date().toISOString().split('T')[0];

    divePrograms.forEach((prog, i) => {
      const classification = classifications.find((c) => c.name === prog.name) || {};
      const built = pipeline.buildProgramDraftPrompt(entity, prog, classification, draftedAt);

      const customId = `${stateCode}__${String(i).padStart(3, '0')}`;

      requests.push({
        custom_id: customId,
        params: {
          model: MODEL,
          max_tokens: built.tokenLimit,
          messages: [{ role: 'user', content: built.prompt }],
        },
      });

      metadata[customId] = {
        stateCode,
        index: i,
        prog,
        classification,
        draftedAt,
        tokenLimit: built.tokenLimit,
      };
    });
  }

  return { requests, metadata, skipped };
}

// ---- Anthropic batch API ----

async function postJson(url, body) {
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'message-batches-2024-09-24',
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const text = await resp.text();
  if (!resp.ok) throw new Error(`POST ${url} → ${resp.status}: ${text.slice(0, 400)}`);
  return JSON.parse(text);
}

async function getJson(url) {
  const resp = await fetch(url, {
    headers: {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'message-batches-2024-09-24',
    },
  });
  const text = await resp.text();
  if (!resp.ok) throw new Error(`GET ${url} → ${resp.status}: ${text.slice(0, 400)}`);
  return JSON.parse(text);
}

async function getText(url) {
  const resp = await fetch(url, {
    headers: {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
  });
  if (!resp.ok) throw new Error(`GET ${url} → ${resp.status}: ${(await resp.text()).slice(0, 400)}`);
  return await resp.text();
}

async function submitBatch(requests) {
  console.log(`  Submitting ${requests.length} requests to Anthropic Message Batches API...`);
  const data = await postJson(BATCH_URL, { requests });
  console.log(`  Batch ID: ${data.id}`);
  console.log(`  Status:   ${data.processing_status}`);
  console.log(`  Expires:  ${data.expires_at}`);
  return data;
}

async function pollBatch(batchId, intervalMs) {
  const url = `${BATCH_URL}/${batchId}`;
  let lastLog = 0;
  while (true) {
    const data = await getJson(url);
    const c = data.request_counts;
    const total = c.processing + c.succeeded + c.errored + c.canceled + c.expired;
    const done = total - c.processing;
    const now = Date.now();
    if (now - lastLog > 15000 || data.processing_status === 'ended') {
      console.log(`  [${new Date().toLocaleTimeString()}] ${data.processing_status}  ${done}/${total} done  (succeeded=${c.succeeded}, errored=${c.errored}, processing=${c.processing})`);
      lastLog = now;
    }
    if (data.processing_status === 'ended') return data;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}

async function downloadResults(resultsUrl) {
  const text = await getText(resultsUrl);
  const lines = text.trim().split('\n').filter(Boolean);
  return lines.map((l) => JSON.parse(l));
}

// ---- Ingest results ----

function ingestResults(results, metadata) {
  const byState = {};

  for (const r of results) {
    const meta = metadata[r.custom_id];
    if (!meta) {
      console.log(`  WARN: no metadata for custom_id ${r.custom_id}`);
      continue;
    }

    if (!byState[meta.stateCode]) {
      byState[meta.stateCode] = { programs: [], programCount: 0 };
    }
    const bucket = byState[meta.stateCode];
    bucket.programCount = Math.max(bucket.programCount, meta.index + 1);

    if (r.result && r.result.type === 'succeeded') {
      const content = r.result.message.content?.[0]?.text || '';
      const finalized = pipeline.finalizeProgramDraft(content, meta.prog, meta.classification, meta.draftedAt);
      bucket.programs[meta.index] = finalized;
    } else {
      const errMsg = (r.result && (r.result.error?.message || r.result.type)) || 'unknown batch error';
      bucket.programs[meta.index] = { name: meta.prog.name, _error: `batch: ${errMsg}` };
    }
  }

  // Fill any holes (should not happen but be defensive)
  for (const bucket of Object.values(byState)) {
    for (let i = 0; i < bucket.programCount; i++) {
      if (!bucket.programs[i]) bucket.programs[i] = { name: `Program ${i + 1}`, _error: 'missing from batch results' };
    }
  }

  return byState;
}

// ---- State overview generation (serial, post-batch) ----

async function generateStateOverviewsSerial(byState) {
  // We need claudeChat for this but it's not exported. Import a fresh one using the
  // Anthropic API directly, sharing the same prompt builder from the pipeline module.
  console.log(`\n  Generating state overviews for ${Object.keys(byState).length} states...`);

  for (const [stateCode, bucket] of Object.entries(byState)) {
    const successful = bucket.programs.filter((p) => !p._parseError && !p._error);
    if (!successful.length) {
      console.log(`  ${stateCode}: 0 successful programs, skipping overview`);
      bucket.stateOverview = null;
      continue;
    }

    const entity = { stateCode, name: pipeline.STATE_NAMES[stateCode] };
    const prompt = pipeline.buildStateOverviewPrompt(entity, successful);

    try {
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 4096,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      if (!resp.ok) {
        const t = await resp.text();
        console.log(`  ${stateCode}: overview failed (${resp.status}): ${t.slice(0, 150)}`);
        bucket.stateOverview = null;
        continue;
      }
      const json = await resp.json();
      const text = json.content?.[0]?.text || '';
      const overview = pipeline.finalizeStateOverview(text);
      bucket.stateOverview = overview;
      console.log(`  ${stateCode}: overview ✓ (startHere=${overview?.startHere?.length || 0}, byNeed=${overview?.byNeed?.length || 0})`);
    } catch (err) {
      console.log(`  ${stateCode}: overview error ${err.message}`);
      bucket.stateOverview = null;
    }
  }
}

// ---- Write drafts.json per state ----

function writeDraftFiles(byState) {
  for (const [stateCode, bucket] of Object.entries(byState)) {
    const successful = bucket.programs.filter((p) => !p._parseError && !p._error);
    const total = bucket.programs.length;
    const successRate = total > 0 ? successful.length / total : 0;
    const payload = {
      state: stateCode,
      stateName: pipeline.STATE_NAMES[stateCode],
      draftedAt: new Date().toISOString(),
      total,
      successful: successful.length,
      programs: bucket.programs,
      stateOverview: bucket.stateOverview || null,
    };

    // Safety guard (see CA/FL incident 2026-04-13): don't overwrite a good
    // drafts.json with a failed or mostly-failed batch run.
    let targetName = 'drafts.json';
    if (successful.length === 0) {
      targetName = 'drafts.failed.json';
      console.log(`  ⚠ ${stateCode}: 0/${total} succeeded — writing to drafts.failed.json (NOT overwriting drafts.json)`);
    } else if (successRate < 0.5) {
      targetName = 'drafts.partial.json';
      console.log(`  ⚠ ${stateCode}: only ${successful.length}/${total} succeeded — writing to drafts.partial.json`);
    }

    const outPath = path.join(PIPELINE_ROOT, stateCode, targetName);
    fs.writeFileSync(outPath, JSON.stringify(payload, null, 2));
    if (targetName === 'drafts.json') {
      console.log(`  ✓ ${stateCode}: ${successful.length}/${total} programs → ${path.relative(process.cwd(), outPath)}`);
    }
  }
}

// ---- Main ----

async function main() {
  const opts = parseArgs();
  if (opts.help) { printUsage(); process.exit(0); }
  if (!ANTHROPIC_API_KEY) {
    console.error('  ERROR: ANTHROPIC_API_KEY not in .env.local');
    process.exit(1);
  }

  console.log(`\n  Benefits Pipeline — Batch Draft Runner\n`);

  // Resume mode: poll existing batch, download, ingest, write
  if (opts.resume) {
    console.log(`  Resuming batch ${opts.resume}...`);
    // We need the metadata to ingest. Without it, we can only dump raw results.
    // For now, require running the full flow (not resume) for clean ingestion.
    console.log(`  Note: resume mode only polls + prints status. Re-run without --resume to ingest.`);
    const data = await pollBatch(opts.resume, opts.pollInterval);
    console.log(`\n  Batch ended. ${data.request_counts.succeeded} succeeded, ${data.request_counts.errored} errored.`);
    console.log(`  Results URL: ${data.results_url}`);
    return;
  }

  const states = discoverStates(opts);
  console.log(`  Target states: ${states.length} (${states.join(', ')})`);

  const { requests, metadata, skipped } = buildRequests(states);
  console.log(`  Built ${requests.length} draft requests across ${Object.keys(new Set(requests.map(r => r.custom_id.split('__')[0]))).size} states`);
  if (skipped.length) {
    console.log(`  Skipped: ${skipped.map(s => `${s.stateCode} (${s.reason})`).join(', ')}`);
  }

  if (opts.dryRun) {
    console.log(`\n  DRY RUN. Would submit ${requests.length} requests.`);
    const byStateCount = {};
    for (const r of requests) {
      const s = r.custom_id.split('__')[0];
      byStateCount[s] = (byStateCount[s] || 0) + 1;
    }
    console.log(`  Per-state breakdown:`);
    for (const [s, n] of Object.entries(byStateCount).sort()) console.log(`    ${s}: ${n}`);
    process.exit(0);
  }

  if (!requests.length) {
    console.log(`\n  No requests to submit.`);
    process.exit(0);
  }

  // Submit
  const batch = await submitBatch(requests);

  // Poll
  console.log(`\n  Polling every ${opts.pollInterval / 1000}s (ctrl-c safe — you can re-run with --resume ${batch.id})...`);
  const final = await pollBatch(batch.id, opts.pollInterval);

  // Download + ingest
  console.log(`\n  Downloading results from ${final.results_url}`);
  const results = await downloadResults(final.results_url);
  console.log(`  Downloaded ${results.length} results`);

  const byState = ingestResults(results, metadata);
  const totalSuccess = Object.values(byState).reduce((n, b) => n + b.programs.filter(p => !p._error && !p._parseError).length, 0);
  const totalPrograms = Object.values(byState).reduce((n, b) => n + b.programs.length, 0);
  console.log(`\n  Ingest: ${totalSuccess}/${totalPrograms} programs succeeded across ${Object.keys(byState).length} states`);

  // State overviews (serial, fast)
  await generateStateOverviewsSerial(byState);

  // Write files
  console.log(`\n  Writing drafts.json files:`);
  writeDraftFiles(byState);

  // Regenerate summary + drafts TS
  console.log(`\n  Regenerating pipeline-summary.ts + pipeline-drafts.ts...`);
  pipeline.generatePipelineSummary();
  pipeline.generatePipelineDrafts();

  console.log(`\n  Done.`);
}

main().catch((err) => {
  console.error(`\n  Fatal: ${err.message}`);
  console.error(err.stack);
  process.exit(1);
});
