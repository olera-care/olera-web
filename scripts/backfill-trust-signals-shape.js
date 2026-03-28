#!/usr/bin/env node

/**
 * Backfill ai_trust_signals to canonical AiTrustSignals shape
 *
 * The city pipeline scripts (pipeline-batch.js, enrich-city.js) previously wrote
 * raw LLM output as flat objects like {"state_licensed": true, "accredited": false}
 * instead of the structured format expected by buildHighlights():
 *   { signals: [{signal: "state_licensed", status: "confirmed", ...}], summary_score: 3, ... }
 *
 * This script reads all providers with ai_trust_signals, detects the wrong shape,
 * and normalizes them in place. No API calls — just reshaping existing data.
 *
 * Usage:
 *   node scripts/backfill-trust-signals-shape.js          # Dry run (default)
 *   node scripts/backfill-trust-signals-shape.js --apply   # Apply changes
 */

'use strict';

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

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SERVICE_KEY in .env.local');
  process.exit(1);
}

const db = createClient(SUPABASE_URL, SERVICE_KEY);
const dryRun = !process.argv.includes('--apply');

const SIGNAL_NAMES = [
  'state_licensed', 'accredited', 'bbb_rated', 'years_in_operation',
  'regulatory_actions', 'active_website', 'google_business', 'community_presence',
];

const PAGE_SIZE = 500;

/**
 * Check if a trust signals record is already in the correct shape.
 */
function isCorrectShape(ts) {
  return ts
    && typeof ts === 'object'
    && Array.isArray(ts.signals)
    && ts.signals.length > 0
    && typeof ts.signals[0].signal === 'string'
    && typeof ts.signals[0].status === 'string';
}

/**
 * Normalize a malformed trust signals record into the canonical shape.
 * Preserves entity_reason, confidence, and verified_at if present.
 */
function normalize(provider, ts) {
  // The old format stored the flat signals object as the entire column value.
  // e.g. {"state_licensed": true, "accredited": false, "verified_at": "...", "confidence": "high"}
  // We need to extract the signal values and wrap them properly.

  let rawSignals = ts.signals || ts; // if ts has a .signals key use it, otherwise ts IS the signals

  // Flatten array-of-single-key-objects into a single object.
  // LLM sometimes returns [{"state_licensed": true}, {"bbb_rated": "No info"}] instead of a flat object.
  // Also handles numbered keys like "3_bbb_rated" or "1_state_licensed".
  if (Array.isArray(rawSignals) && rawSignals.length > 0 && !rawSignals[0]?.signal) {
    const flat = {};
    for (const item of rawSignals) {
      if (typeof item === 'object' && item !== null) {
        for (const [key, val] of Object.entries(item)) {
          // Strip leading number prefix: "3_bbb_rated" → "bbb_rated"
          const cleanKey = key.replace(/^\d+_/, '');
          flat[cleanKey] = val;
        }
      }
    }
    rawSignals = flat;
  }

  let signals;
  if (Array.isArray(rawSignals)) {
    // Proper array format [{signal: "state_licensed", status: "confirmed"}, ...]
    signals = SIGNAL_NAMES.map(name => {
      const existing = rawSignals.find(s => s.signal === name);
      if (existing) return { signal: name, status: existing.status || 'not_found', detail: existing.detail || null, source_url: existing.source_url || null };
      return { signal: name, status: 'not_found', detail: null, source_url: null };
    });
  } else if (rawSignals && typeof rawSignals === 'object') {
    signals = SIGNAL_NAMES.map(name => {
      const value = rawSignals[name];
      if (value === true || value === 'confirmed') return { signal: name, status: 'confirmed', detail: null, source_url: null };
      if (value === false || value === 'not_found' || value == null) return { signal: name, status: 'not_found', detail: null, source_url: null };
      if (typeof value === 'string') {
        // Distinguish "Yes, licensed by..." (confirmed with detail) from "No info found" / "unknown"
        const negative = /^(no|not found|unknown|unclear|n\/a|none|no info|no evidence|no mention)/i.test(value);
        return { signal: name, status: negative ? 'not_found' : 'confirmed', detail: negative ? null : value, source_url: null };
      }
      if (typeof value === 'object') return { signal: name, status: value.status === 'confirmed' || value.confirmed ? 'confirmed' : 'not_found', detail: value.detail || null, source_url: value.source_url || null };
      return { signal: name, status: 'not_found', detail: null, source_url: null };
    });
  } else {
    signals = SIGNAL_NAMES.map(name => ({ signal: name, status: 'not_found', detail: null, source_url: null }));
  }

  return {
    provider_name: ts.provider_name || provider.provider_name,
    state: ts.state || provider.state || '',
    category: ts.category || provider.provider_category || '',
    signals,
    summary_score: signals.filter(s => s.status === 'confirmed').length,
    last_verified: ts.last_verified || ts.verified_at || new Date().toISOString(),
    model: ts.model || 'sonar',
    confidence: ts.confidence || 'medium',
    entity_reason: ts.entity_reason || undefined,
  };
}

async function main() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  Backfill ai_trust_signals shape — ${dryRun ? 'DRY RUN' : 'APPLYING'}`);
  console.log(`${'='.repeat(60)}\n`);

  let totalScanned = 0;
  let alreadyCorrect = 0;
  let needsFix = 0;
  let updated = 0;
  let errors = 0;
  let page = 0;

  while (true) {
    const { data, error } = await db
      .from('olera-providers')
      .select('provider_id, provider_name, provider_category, state, ai_trust_signals')
      .not('ai_trust_signals', 'is', null)
      .or('deleted.is.null,deleted.eq.false')
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (error) {
      console.error('Query error:', error.message);
      break;
    }

    if (!data || data.length === 0) break;

    for (const provider of data) {
      totalScanned++;
      const ts = provider.ai_trust_signals;

      if (isCorrectShape(ts)) {
        alreadyCorrect++;
        continue;
      }

      needsFix++;
      const normalized = normalize(provider, ts);
      const confirmedCount = normalized.summary_score;

      if (dryRun) {
        if (needsFix <= 10) {
          console.log(`  [NEEDS FIX] ${provider.provider_id}`);
          console.log(`    Old shape: ${JSON.stringify(ts).slice(0, 120)}...`);
          console.log(`    New: ${confirmedCount} confirmed signals`);
        }
      } else {
        const { error: updateErr } = await db
          .from('olera-providers')
          .update({ ai_trust_signals: normalized })
          .eq('provider_id', provider.provider_id);

        if (updateErr) {
          console.error(`  Error updating ${provider.provider_id}: ${updateErr.message}`);
          errors++;
        } else {
          updated++;
        }
      }
    }

    process.stdout.write(`  Scanned: ${totalScanned} | Correct: ${alreadyCorrect} | Needs fix: ${needsFix}\r`);

    if (data.length < PAGE_SIZE) break;
    page++;
  }

  console.log('\n');
  console.log(`${'='.repeat(60)}`);
  console.log(`  Results`);
  console.log(`${'='.repeat(60)}`);
  console.log(`  Total scanned:    ${totalScanned}`);
  console.log(`  Already correct:  ${alreadyCorrect}`);
  console.log(`  Needs fix:        ${needsFix}`);
  if (!dryRun) {
    console.log(`  Updated:          ${updated}`);
    console.log(`  Errors:           ${errors}`);
  } else {
    console.log(`\n  Run with --apply to fix these records.`);
  }
  console.log('');
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
