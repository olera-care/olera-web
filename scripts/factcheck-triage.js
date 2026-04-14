#!/usr/bin/env node
/**
 * Factcheck triage aggregator.
 *
 * Reads every state's data/pipeline/{STATE}/factcheck.json and produces a
 * flat, sortable list of actionable flags (info-severity filtered out).
 * Groups by severity and includes source URLs for human review.
 *
 * Usage:
 *   node scripts/factcheck-triage.js                 # full report to stdout
 *   node scripts/factcheck-triage.js --markdown      # markdown format
 *   node scripts/factcheck-triage.js --high-only     # only high severity
 */

'use strict';

const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', 'data', 'pipeline');

const args = process.argv.slice(2);
const markdown = args.includes('--markdown');
const highOnly = args.includes('--high-only');

const states = fs.readdirSync(ROOT).filter((d) => /^[A-Z]{2}$/.test(d));

const allFlags = [];
let totals = { total: 0, actionable: 0, high: 0, medium: 0, info: 0 };

for (const stateCode of states) {
  const fp = path.join(ROOT, stateCode, 'factcheck.json');
  if (!fs.existsSync(fp)) continue;
  const fc = JSON.parse(fs.readFileSync(fp, 'utf-8'));
  for (const p of fc.programs || []) {
    for (const f of p.flags || []) {
      totals.total++;
      if (f.severity === 'info') { totals.info++; continue; }
      if (f.severity === 'high') totals.high++;
      if (f.severity === 'medium') totals.medium++;
      totals.actionable++;
      if (highOnly && f.severity !== 'high') continue;
      allFlags.push({
        state: stateCode,
        program: p.programName,
        programId: p.programId,
        field: f.field,
        severity: f.severity,
        drafted: f.draftValue,
        verified: f.verifiedValue,
        pctDiff: f.pctDiff,
        sources: p.verified?.sources || {},
        notes: p.verified?.notes || null,
      });
    }
  }
}

// Sort: high severity first, then by state
allFlags.sort((a, b) => {
  if (a.severity !== b.severity) return a.severity === 'high' ? -1 : 1;
  return a.state.localeCompare(b.state);
});

if (markdown) {
  console.log(`# Factcheck Triage Report\n`);
  console.log(`**Totals:** ${totals.total} flags — ${totals.actionable} actionable (${totals.high} high, ${totals.medium} medium), ${totals.info} auto-filtered false positives\n`);
  console.log(`## Actionable flags (${allFlags.length})\n`);
  console.log(`| State | Program | Field | Drafted | Verified | Δ | Severity | Source |`);
  console.log(`|---|---|---|---|---|---|---|---|`);
  for (const f of allFlags) {
    const d = typeof f.drafted === 'object' ? JSON.stringify(f.drafted).slice(0, 30) : f.drafted;
    const v = typeof f.verified === 'object' ? JSON.stringify(f.verified).slice(0, 30) : f.verified;
    const srcKey = f.field === 'age' ? 'age' : f.field.startsWith('income') ? 'income' : f.field.startsWith('assets') ? 'assets' : 'phone';
    const url = f.sources[srcKey] || '';
    console.log(`| ${f.state} | ${f.program.slice(0,40)} | ${f.field} | ${d} | ${v} | ${f.pctDiff || ''} | ${f.severity} | ${url.slice(0,60)} |`);
  }
} else {
  console.log(`\n=== FACTCHECK TRIAGE ===`);
  console.log(`Totals: ${totals.total} flags — ${totals.actionable} actionable (${totals.high} high, ${totals.medium} medium), ${totals.info} auto-filtered\n`);
  console.log(`Showing ${allFlags.length} flags:\n`);
  for (const f of allFlags) {
    const d = typeof f.drafted === 'object' ? JSON.stringify(f.drafted) : f.drafted;
    const v = typeof f.verified === 'object' ? JSON.stringify(f.verified) : f.verified;
    const srcKey = f.field === 'age' ? 'age' : f.field.startsWith('income') ? 'income' : f.field.startsWith('assets') ? 'assets' : 'phone';
    const url = f.sources[srcKey] || '(no source)';
    console.log(`[${f.severity.toUpperCase().padEnd(6)}] ${f.state} ${f.field.padEnd(18)} drafted=${String(d).padEnd(12)} verified=${String(v).padEnd(12)} ${f.pctDiff ? `(${f.pctDiff}%)` : ''}`);
    console.log(`         ${f.program}`);
    console.log(`         source: ${url.slice(0, 120)}`);
    if (f.notes) console.log(`         notes: ${f.notes.slice(0, 150)}`);
    console.log();
  }
}
