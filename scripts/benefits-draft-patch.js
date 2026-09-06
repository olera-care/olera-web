#!/usr/bin/env node
/**
 * Patch pending navigator drafts in place after a fact-check round.
 *
 * Drafts are DATABASE rows (business_profiles.metadata.benefits_navigator), so
 * a data correction reaches them only if something rewrites the letter. This
 * is that something. It is driven by a JSON edits file so the find/replace
 * pairs are data, not code:
 *
 *   {
 *     "4c0be218": [
 *       ["body", "NC LIFTSS at 1-833-470-0597", "NC LIFTSS at 1-833-522-5429"],
 *       ["sms",  "old text", "new text"]
 *     ],
 *     "1976d629": []          // no prose change; refresh the pick snapshot only
 *   }
 *
 * Keys are profile-id prefixes (8 hex chars is plenty). Fields are subject,
 * body, sms; the edited_* variant is used automatically when TJ has edited the
 * draft in the drawer. Every edit must match exactly once or the row throws:
 * a half-patched letter is worse than an unpatched one.
 *
 * Every touched row also gets its frozen `pick` snapshot rebuilt from the
 * pipeline (same rules as toPick in benefits-cascade.server.ts) and a
 * `factcheck_patched_at` stamp, in the same write, after a fresh read.
 *
 * Usage (from any checkout; node_modules and .env.local are located for you):
 *   node scripts/benefits-draft-patch.js --edits=<file.json>            # dry run
 *   node scripts/benefits-draft-patch.js --edits=<file.json> --apply
 *   --pipeline=<dir>   pipeline to rebuild picks from (default: this checkout's)
 *   --allow-repatch    proceed on a draft that already carries factcheck_patched_at
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { loadEnv, requireDep, argFlag, has, readPending, rebuildPick, TEXT_FIELDS } = require('./lib/benefits-draft-db');

loadEnv(argFlag('env'));
const { createClient } = requireDep('@supabase/supabase-js');

const APPLY = has('apply');
const ALLOW_REPATCH = has('allow-repatch');
const EDITS_PATH = argFlag('edits');
if (!EDITS_PATH) {
  console.error('Pass --edits=<file.json>. See the header of this script for the shape.');
  process.exit(1);
}
const PIPELINE = path.resolve(argFlag('pipeline', path.resolve(__dirname, '..', 'data', 'pipeline')));
const EDITS = JSON.parse(fs.readFileSync(EDITS_PATH, 'utf8'));
const NOW = new Date().toISOString();

(async () => {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const all = await readPending(db);
  let written = 0;

  for (const [prefix, edits] of Object.entries(EDITS)) {
    const rows = all.filter((r) => r.id.startsWith(prefix));
    if (rows.length !== 1) throw new Error(`${prefix}: expected exactly 1 pending draft, found ${rows.length}`);
    const row = rows[0];
    const nav = row.metadata.benefits_navigator;
    if (nav.factcheck_patched_at && !ALLOW_REPATCH) {
      throw new Error(`${prefix}: already patched at ${nav.factcheck_patched_at} (pass --allow-repatch to patch again)`);
    }

    const next = { ...nav };
    for (const [field, oldS, newS] of edits) {
      if (!TEXT_FIELDS.includes(field)) throw new Error(`${prefix}: field must be one of ${TEXT_FIELDS.join(', ')}, got "${field}"`);
      const key = nav[`edited_${field}`] != null ? `edited_${field}` : field;
      const cur = next[key];
      if (typeof cur !== 'string') throw new Error(`${prefix}: ${key} is not a string`);
      const n = cur.split(oldS).length - 1;
      if (n !== 1) throw new Error(`${prefix}: "${oldS.slice(0, 70)}" found ${n} times in ${key}, need exactly 1`);
      next[key] = cur.replace(oldS, newS);
    }
    next.pick = rebuildPick(PIPELINE, nav.pick);
    next.factcheck_patched_at = NOW;

    const changed = Object.keys(next).filter((k) => JSON.stringify(next[k]) !== JSON.stringify(nav[k]));
    console.log(`\n## ${prefix} ${nav.pick.stateId}/${nav.pick.programId} changed: ${changed.join(', ')}`);
    if (changed.includes('pick')) {
      const p = next.pick;
      console.log(`  pick: ${p.contactLabel} | ${p.contactPhone} | ${p.contactHours} | ${JSON.stringify(p.documents)}`);
    }
    for (const k of TEXT_FIELDS.flatMap((f) => [f, `edited_${f}`])) {
      if (changed.includes(k)) console.log(`  ${k}:\n${next[k]}`);
    }

    if (APPLY) {
      const { data: fresh, error: e1 } = await db.from('business_profiles').select('metadata').eq('id', row.id).single();
      if (e1) throw e1;
      const freshNav = fresh.metadata.benefits_navigator;
      if (freshNav.status !== 'pending') throw new Error(`${prefix}: no longer pending, skipped`);
      const metadata = { ...fresh.metadata, benefits_navigator: { ...freshNav, ...next } };
      const { error: e2 } = await db.from('business_profiles').update({ metadata }).eq('id', row.id);
      if (e2) throw e2;
      written++;
      console.log('  WRITTEN');
    }
  }
  console.log(`\n${Object.keys(EDITS).length} drafts ${APPLY ? `patched (${written} written)` : 'dry-run OK. Re-run with --apply to write.'}`);
})().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
