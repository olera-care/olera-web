#!/usr/bin/env node
//
// scan-out-of-scope-signals.js
// ---------------------------------------------------------------------------
// Catches NAME-INNOCENT out-of-scope providers that the entity-verification LLM
// misses — the SIR House (sober-living) / SUNDRY HOUSE (tattoo studio) class.
// The signal lives in the website DOMAIN and the Google REVIEWS, not the name,
// so no name-regex (Tier 1) or LLM-name-check can catch them reliably.
//
// Born from data-sweep #2 (2026-06-03): addiction-treatment centers were
// landing as Nursing Home and a tattoo/event studio as Memory Care because the
// pipeline's Perplexity verify confabulated senior-care signals. This scan reads
// the enriched data (description + google_reviews_data + website) deterministically.
//
// Usage:
//   node scripts/scan-out-of-scope-signals.js                 # full active DB, report only
//   node scripts/scan-out-of-scope-signals.js --since 2026-04-27   # only providers created >= date
//   node scripts/scan-out-of-scope-signals.js --verify        # LLM-verify each hit (Perplexity, ~$0.008/hit)
//   node scripts/scan-out-of-scope-signals.js --verify --apply # soft-delete LLM-confirmed OUT_OF_SCOPE
//   node scripts/scan-out-of-scope-signals.js --out hits.json # write candidates to a file
//
// Default is a DRY-RUN report. --apply only deletes hits an individual
// (website-forced) LLM re-verify confirms OUT_OF_SCOPE — never on the regex alone.
// ---------------------------------------------------------------------------

// Resolve node_modules from the main olera-web repo (worktrees lack node_modules).
const MAIN_REPO = require('path').resolve(process.env.HOME, 'Desktop/olera-web');
module.paths.unshift(require('path').join(MAIN_REPO, 'node_modules'));

const envPaths = [
  require('path').resolve(__dirname, '..', '.env.local'),
  require('path').resolve(MAIN_REPO, '.env.local'),
];
for (const p of envPaths) {
  if (require('fs').existsSync(p)) { require('dotenv').config({ path: p }); break; }
}

const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- args ---
const argv = process.argv.slice(2);
const arg = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; };
const SINCE = arg('--since');
const DO_VERIFY = argv.includes('--verify');
const DO_APPLY = argv.includes('--apply');
const OUT_FILE = arg('--out');

// --- high-precision signals (validated in sweep #2; near-zero FP) ---
// Addiction / behavioral-health / recovery. Excludes names with "home care" /
// "home health" so legit brands like "Recovery Home Care" (FL Medicare HHA) survive.
const ADDICTION = /\b(sober living|sober house|sober home|recovery residence|halfway house|12[- ]step|substance (abuse|use) (disorder|treatment)|drug (and|&) alcohol (rehab|treatment|addiction)|alcohol (and|&) drug (rehab|treatment)|detox(ification)?|drug rehab|alcohol rehab|addiction (treatment|recovery|center)|intensive outpatient program|medication[- ]assisted treatment)\b/i;
// Wedding / event venue — domain or path is the strong tell.
const VENUE_DOMAIN = /(weddingestates|springsvenue|eventvenue|weddingvenue|\/venues?\/|banquethall|eventspace)/i;
// Tattoo / body-art (the SUNDRY class).
const TATTOO = /\b(tattoo|body piercing|aerial silk)\b/i;
const NAME_HOMECARE = /home (care|health)/i;

function scanProvider(p) {
  const reviews = p.google_reviews_data ? JSON.stringify(p.google_reviews_data) : '';
  const hay = `${p.provider_description || ''}\n${reviews}`;
  const web = p.website || '';
  const sigs = [];
  if (ADDICTION.test(hay) && !NAME_HOMECARE.test(p.provider_name || '')) {
    sigs.push(`addiction:"${hay.match(ADDICTION)[0]}"`);
  }
  if (VENUE_DOMAIN.test(web)) sigs.push(`venue:"${web.match(VENUE_DOMAIN)[0]}"`);
  if (TATTOO.test(hay)) sigs.push(`tattoo:"${hay.match(TATTOO)[0]}"`);
  return sigs;
}

async function perplexity(prompt) {
  for (let a = 0; a < 5; a++) {
    try {
      const r = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${PERPLEXITY_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'sonar', temperature: 0.1, messages: [{ role: 'user', content: prompt }] }),
      });
      if (r.status === 429 || r.status === 529) { await new Promise(s => setTimeout(s, 2000 * Math.pow(2, a))); continue; }
      const j = await r.json();
      return j.choices?.[0]?.message?.content || '';
    } catch (e) { await new Promise(s => setTimeout(s, 1500 * (a + 1))); }
  }
  return '';
}
function extractJson(t) { const m = t && t.match(/\{[\s\S]*\}/); if (!m) return null; try { return JSON.parse(m[0]); } catch { return null; } }

async function verifyHit(p) {
  const prompt = `Search the web and identify the PRIMARY business of "${p.provider_name}", ${p.city}, ${p.state}. Website: ${p.website || '(search by name+location)'}.
Olera lists ONLY: Home Care (Non-medical), Home Health Care, Assisted Living, Independent Living, Memory Care, Nursing Home (SNF).
OUT OF SCOPE: drug/alcohol/addiction rehab, sober living, detox, behavioral/mental health, hospice-only, adult day, wedding/event venue, tattoo studio, retail, apartments without senior services.
Cite the actual website. Return ONLY JSON: {"verdict":"IN_SCOPE|OUT_OF_SCOPE|INSUFFICIENT_EVIDENCE","what_it_is":"<short>","reason":"<one line>"}`;
  return extractJson(await perplexity(prompt)) || { verdict: 'PARSE_FAIL' };
}

(async () => {
  let from = 0; const PAGE = 1000; const hits = [];
  let scanned = 0;
  while (true) {
    let q = supabase.from('olera-providers')
      .select('provider_id, provider_name, provider_category, city, state, website, provider_description, google_reviews_data, created_at')
      .eq('deleted', false).order('provider_id').range(from, from + PAGE - 1);
    if (SINCE) q = q.gte('created_at', SINCE);
    const { data, error } = await q;
    if (error) { console.error(error); break; }
    if (!data || !data.length) break;
    for (const p of data) { scanned++; const s = scanProvider(p); if (s.length) hits.push({ ...p, signals: s.join(' | ') }); }
    if (data.length < PAGE) break; from += PAGE;
  }
  console.log(`Scanned ${scanned} active providers${SINCE ? ` (created >= ${SINCE})` : ''}. ${hits.length} signal hits.`);
  for (const h of hits) console.log(`  ${h.provider_id} | ${h.provider_name} | ${h.provider_category} | ${h.city}, ${h.state} | ${h.website || ''}\n     ${h.signals}`);

  if (OUT_FILE) { fs.writeFileSync(OUT_FILE, JSON.stringify(hits.map(({ google_reviews_data, provider_description, ...r }) => r), null, 1)); console.log(`\nWrote ${hits.length} hits to ${OUT_FILE}`); }

  if (!DO_VERIFY) { console.log(`\n(dry run — pass --verify to LLM-check, --verify --apply to soft-delete confirmed OUT)`); return; }
  if (!PERPLEXITY_API_KEY) { console.error('PERPLEXITY_API_KEY not set; cannot --verify'); process.exit(1); }

  console.log(`\nVerifying ${hits.length} hits individually...`);
  const confirmed = [];
  const CONC = 10; let idx = 0;
  async function worker() {
    while (idx < hits.length) {
      const h = hits[idx++];
      const v = await verifyHit(h);
      h.verify = v;
      if (v.verdict === 'OUT_OF_SCOPE') confirmed.push(h);
      console.log(`  [${v.verdict}] ${h.provider_id} ${h.provider_name} — ${v.what_it_is || ''}`);
    }
  }
  await Promise.all(Array.from({ length: CONC }, () => worker()));
  console.log(`\nConfirmed OUT_OF_SCOPE: ${confirmed.length} / ${hits.length}`);

  if (!DO_APPLY) { console.log(`(pass --apply to soft-delete the ${confirmed.length} confirmed)`); return; }
  const now = new Date().toISOString();
  let del = 0;
  for (const h of confirmed) {
    const { error } = await supabase.from('olera-providers')
      .update({ deleted: true, deleted_at: now, deletion_reason: 'data_sweep' })
      .eq('provider_id', h.provider_id);
    if (!error) del++; else console.error(`  FAIL ${h.provider_id}: ${error.message}`);
  }
  console.log(`Soft-deleted ${del}/${confirmed.length} confirmed out-of-scope providers.`);
})();
