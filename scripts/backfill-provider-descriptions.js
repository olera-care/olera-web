#!/usr/bin/env node
/**
 * Regenerate machine-templated provider descriptions into unique, factual prose.
 *
 * Project 6 (de-indexing recovery). As of 2026-05, 64% of the ~75K active
 * provider pages run on one of ~10 fill-in-the-blank description templates with
 * name/city/rating swapped in — Google reads thousands of near-duplicate pages
 * and parks the /provider/ directory in "Crawled — currently not indexed". The
 * worst offender ("Gen-1": "<Name> provides <category> services for senior
 * elders in the <City>, <ST> area. To find the right care for you loved one,
 * connect with one of our senior care experts.") is ~21K pages. This script
 * rewrites those via Perplexity Sonar, grounded in the data we already have
 * (category, location, Google rating, review snippets, verified entity summary,
 * tenure) plus light web verification — no invented amenities/awards/dates.
 *
 * Safety:
 *   - Dry-run by default (counts + cost estimate + N real before→after samples).
 *   - Backs up the existing description to provider_description_v1_backup BEFORE
 *     overwriting, but only if that column is currently NULL (never clobber an
 *     existing backup — some rows were already regenerated once and the column
 *     holds the true original).
 *   - No-overwrite-on-failure: a row is only updated if Perplexity returns a
 *     sane new description; failures are logged and left untouched.
 *   - Resumable: each run re-queries rows still matching a template signature;
 *     a successfully rewritten row no longer matches, so re-runs pick up where
 *     the last one stopped. No checkpoint file.
 *   - Rejects model output that echoes the template ("senior elders", CTA
 *     language) or is too short/long.
 *
 * Cost: ~$1 per 1,000 providers (Perplexity Sonar). Gen-1 only ≈ $21.
 * Time: ~21K / 8 workers ≈ 1.5–2.5 hours (network-bound).
 *
 * Usage:
 *   node scripts/backfill-provider-descriptions.js                  # dry-run: counts + 15 sample rewrites
 *   node scripts/backfill-provider-descriptions.js --sample 30      # dry-run with 30 samples
 *   node scripts/backfill-provider-descriptions.js --run            # execute (Gen-1 set, 8 workers)
 *   node scripts/backfill-provider-descriptions.js --run --concurrency 12
 *   node scripts/backfill-provider-descriptions.js --run --limit 500
 *   node scripts/backfill-provider-descriptions.js --run --category "Assisted Living"
 *   node scripts/backfill-provider-descriptions.js --run --gen2     # also include Gen-2 templated rows
 */

// Load .env.local if dotenv is available; otherwise rely on the ambient
// environment (e.g. `set -a && . ./.env.local && set +a && node ...`). The
// ENV_FILE env var overrides the path (worktrees don't carry untracked files).
try { require('dotenv').config({ path: process.env.ENV_FILE || '.env.local' }); } catch { /* dotenv not installed — using process.env */ }
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

// Generation backend. `perplexity` (Sonar) does web search but costs ~$8/1000
// requests; `claude` (Haiku 4.5, no web search) costs ~$1.25/1000 and is the
// model the rest of the repo uses. The prompt works for both — for `claude`,
// "publicly verifiable facts" just means the model's own knowledge of known
// chains/services, which is actually a touch safer (won't confidently echo a
// wrong scraped license number / survey date).
const CLAUDE_MODEL = 'claude-haiku-4-5-20251001';
const COST_PER_1K = { perplexity: 8.0, claude: 1.25 };

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// Some provider rows contain corrupted text (unpaired UTF-16 surrogates from a
// bad import, stray control chars). JSON.stringify emits those as \udXXX, which
// both the Anthropic and Perplexity request parsers reject ("no low surrogate
// in string"). Drop any surrogate code unit that isn't part of a valid pair.
function sanitizeText(s) {
  if (typeof s !== 'string') return s;
  let out = '';
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c >= 0xD800 && c <= 0xDBFF) {
      const n = s.charCodeAt(i + 1);
      if (n >= 0xDC00 && n <= 0xDFFF) { out += s[i] + s[i + 1]; i++; } // valid pair
      // else: lone high surrogate — drop
    } else if (c >= 0xDC00 && c <= 0xDFFF) {
      // lone low surrogate — drop
    } else {
      out += s[i];
    }
  }
  return out.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
}

// ── CLI ──────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const DRY_RUN = !args.includes('--run');
const INCLUDE_GEN2 = args.includes('--gen2');
const numArg = (flag, def) => {
  const i = args.indexOf(flag);
  return i !== -1 && args[i + 1] ? parseInt(args[i + 1], 10) : def;
};
const strArg = (flag) => {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : null;
};
const ENGINE = (strArg('--engine') || 'perplexity').toLowerCase(); // 'perplexity' | 'claude'
if (!['perplexity', 'claude'].includes(ENGINE)) { console.error(`Unknown --engine "${ENGINE}" (use perplexity|claude)`); process.exit(1); }
const CONCURRENCY = numArg('--concurrency', ENGINE === 'claude' ? 5 : 8);
const LIMIT = numArg('--limit', null);
const SAMPLE_N = numArg('--sample', 15);
const CATEGORY_FILTER = strArg('--category');
// Comma-separated provider_ids — dry-run only, for spot-checking specific rows.
const ID_FILTER = (strArg('--ids') || '').split(',').map(s => s.trim()).filter(Boolean);

// ── Template signatures ──────────────────────────────────────────────────────
// Gen-1: the original fill-in-the-blank ("...for senior elders in the <City>...
// To find the right care for you loved one, connect with...") + the "Gen-1.5"
// rewrite that kept the CTA. Gen-2 (opt-in): "<Name> is a <category descriptor>
// located in <City>. The community is rated N out of 5 stars on Google."
// PostgREST `or=` filter strings use `*` as the LIKE wildcard (not `%`).
const GEN1_SIGNATURE = '*for senior elders in the*';
const GEN1_CTA_SIGNATURE = '*To find the right care*';
const GEN2_RATED_SIGNATURE = '*The community is rated*';
const GEN2_STARS_SIGNATURE = '*out of 5 stars on Google*';

// Phrases that, if present in the *new* description, mean the model echoed the
// template — reject and skip (row gets retried on the next run).
const BAD_PHRASES = [
  'senior elders',
  'connect with one of our senior care experts',
  'to find the right care',
  'olera',
  'http://',
  'https://',
  'www.',
];

function matchesTemplate(desc) {
  if (!desc) return false;
  const d = desc.toLowerCase();
  if (d.includes('for senior elders in the')) return true;
  if (d.includes('to find the right care')) return true;
  if (INCLUDE_GEN2) {
    if (d.includes('the community is rated')) return true;
    if (d.includes('out of 5 stars on google')) return true;
  }
  return false;
}

const SELECT_COLS =
  'provider_id, provider_name, provider_category, city, state, address, website, ' +
  'google_rating, google_reviews_data, ai_trust_signals, provider_description, provider_description_v1_backup';

// ── Fetch the full working set up front (read-only; before any writes) ───────
async function fetchTargetRows() {
  const orParts = [
    `provider_description.ilike.${GEN1_SIGNATURE}`,
    `provider_description.ilike.${GEN1_CTA_SIGNATURE}`,
  ];
  if (INCLUDE_GEN2) {
    orParts.push(`provider_description.ilike.${GEN2_RATED_SIGNATURE}`);
    orParts.push(`provider_description.ilike.${GEN2_STARS_SIGNATURE}`);
  }
  const orFilter = orParts.join(','); // supabase-js wraps this in or=(...) itself

  const PAGE = 1000;
  let all = [];
  let from = 0;
  while (true) {
    let q = supabase
      .from('olera-providers')
      .select(SELECT_COLS)
      .eq('deleted', false)
      .or(orFilter)
      .order('provider_id', { ascending: true })
      .range(from, from + PAGE - 1);
    if (CATEGORY_FILTER) q = q.eq('provider_category', CATEGORY_FILTER);

    const { data, error } = await q;
    if (error) {
      console.error(`Query error (offset ${from}):`, error.message);
      break;
    }
    if (!data || data.length === 0) break;
    all = all.concat(data);
    process.stdout.write(`  [query] fetched ${all.length}...\r`);
    if (data.length < PAGE) break;
    from += PAGE;
    if (LIMIT && all.length >= LIMIT) break;
  }
  process.stdout.write('\n');

  // Defensive: drop any row whose current description no longer matches (race /
  // stale page) and apply LIMIT.
  all = all.filter(r => matchesTemplate(r.provider_description));
  if (ID_FILTER.length) {
    const want = new Set(ID_FILTER);
    all = all.filter(r => want.has(r.provider_id));
  }
  if (LIMIT) all = all.slice(0, LIMIT);
  return all;
}

// ── Prompt builder ───────────────────────────────────────────────────────────
function reviewSnippets(grd) {
  const reviews = (grd && Array.isArray(grd.reviews)) ? grd.reviews : [];
  return reviews
    .map(r => (r && typeof r.text === 'string' ? r.text.trim() : ''))
    .filter(t => t.length >= 25)
    .slice(0, 3)
    .map(t => (t.length > 320 ? t.slice(0, 320) + '…' : t));
}

function trustDetail(ts, signalName) {
  if (!ts || !Array.isArray(ts.signals)) return null;
  const s = ts.signals.find(x => x.signal === signalName);
  return s && s.status === 'confirmed' && s.detail ? String(s.detail) : null;
}

function buildPrompt(p) {
  const grd = p.google_reviews_data || null;
  const rating = grd && typeof grd.rating === 'number' ? grd.rating : (p.google_rating ? parseFloat(p.google_rating) : null);
  const reviewCount = grd && typeof grd.review_count === 'number' ? grd.review_count : 0;
  const snippets = reviewSnippets(grd);
  const ts = p.ai_trust_signals || null;
  const entityReason = ts && ts.entity_reason ? String(ts.entity_reason) : null;
  const yearsDetail = trustDetail(ts, 'years_in_operation');
  const licenseDetail = trustDetail(ts, 'state_licensed') || trustDetail(ts, 'accredited');

  const facts = [
    `- Name: ${p.provider_name}`,
    `- Type: ${p.provider_category}`,
    `- Location: ${p.city}, ${p.state}${p.address ? ` (${p.address})` : ''}`,
    `- Website: ${p.website || 'not listed'}`,
    rating ? `- Google rating: ${rating}/5${reviewCount ? ` from ${reviewCount} review${reviewCount === 1 ? '' : 's'}` : ''}` : `- Google rating: not available`,
  ];
  if (entityReason) facts.push(`- What it is (already verified): ${entityReason}`);
  if (yearsDetail) facts.push(`- Years in operation: ${yearsDetail}`);
  if (licenseDetail) facts.push(`- Licensing/accreditation: ${licenseDetail}`);
  // House style (matches the provider-highlights waterfall): only feature a
  // Google rating that's actually good and backed by a few reviews. Below the
  // bar we skip it — a unique description without the rating still beats the
  // template, and we don't put "3.0/5" on a provider's own page.
  const showRating = rating != null && rating >= 4.0 && reviewCount >= 5;
  if (snippets.length) facts.push(`- Sample of what reviewers say:\n${snippets.map(s => `  • "${s}"`).join('\n')}`);

  return `You are writing a short, factual directory description for a senior care provider's profile page. It must read naturally, be specific to THIS provider, and contain zero marketing fluff or calls-to-action.

PROVIDER FACTS (use these; never contradict them):
${facts.join('\n')}

TASK: Write a 2 to 4 sentence description of this specific provider.
- Open with the provider name and what kind of care it provides, in ${p.city}, ${p.state}.
- Build the description from: the care types it offers, the kinds of support/services provided, who it serves, and (if given in the facts above) its tenure${showRating ? `, plus the Google rating of ${rating}/5` : ''}.
- You may add publicly verifiable facts about what kinds of services this business offers and whether it is part of a known chain. But do NOT include, even if web search surfaces them: the street address, any license/registration/facility ID number, survey or inspection dates, founding or opening dates, exact resident-age cutoffs, bed/unit/room counts, prices, awards, Medicaid/Medicare certification status, website URLs, or phone numbers — unless that exact detail already appears in the PROVIDER FACTS list above. When in doubt, leave it out: a shorter accurate description beats a padded or speculative one.
- Use the city and state for location. Do NOT write out the full street address.
- You may say a provider is "state-licensed" if the facts above confirm it, but do NOT include the license number.
- Reviews: you may note GENERAL POSITIVE themes that recur across the review snippets above (e.g. "families describe attentive, compassionate staff"). Do NOT name individual staff members or reviewers. Do NOT quote, paraphrase, or allude to negative, critical, or complaint reviews, and do NOT mention employee or workplace complaints — if the reviews are mixed or mostly critical, omit the review-theme sentence entirely.${showRating ? '' : ' Do NOT state the Google rating or the number of reviews.'}
- Do NOT include any call-to-action ("contact", "connect with", "call today", "schedule a tour", "find the right care", "visit ..."). Do NOT include any URL or web address. Do NOT use the phrase "senior elders". Do NOT mention Olera. Do NOT start the description with "Located in".
- Plain, warm, professional prose. One paragraph. No bullet points, no headers, no markdown.

Return ONLY this JSON object and nothing else: {"description": "your 2-4 sentence description here"}`;
}

// ── Perplexity call (retry on 429/5xx, exp backoff) ──────────────────────────
async function perplexityChat(prompt, temperature = 0.2) {
  const MAX_ATTEMPTS = 5;
  let lastErr;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let resp;
    try {
      resp = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${PERPLEXITY_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'sonar', messages: [{ role: 'user', content: prompt }], temperature }),
      });
    } catch (err) {
      lastErr = err;
      if (attempt === MAX_ATTEMPTS) throw err;
      await sleep(2000 * Math.pow(2, attempt - 1));
      continue;
    }
    if (resp.ok) {
      const json = await resp.json();
      return json.choices?.[0]?.message?.content || '';
    }
    const shouldRetry = resp.status === 429 || (resp.status >= 500 && resp.status < 600);
    const text = await resp.text().catch(() => '');
    lastErr = new Error(`Perplexity ${resp.status}: ${text.slice(0, 180)}`);
    if (!shouldRetry || attempt === MAX_ATTEMPTS) throw lastErr;
    await sleep(2000 * Math.pow(2, attempt - 1));
  }
  throw lastErr;
}

// ── Anthropic call (Haiku 4.5, no web search; SDK handles 429/overload retries) ──
let _anthropic = null;
function getAnthropic() {
  if (_anthropic) return _anthropic;
  if (!ANTHROPIC_API_KEY) throw new Error('Missing ANTHROPIC_API_KEY in .env.local');
  const Anthropic = require('@anthropic-ai/sdk');
  _anthropic = new (Anthropic.default || Anthropic)({ apiKey: ANTHROPIC_API_KEY, maxRetries: 6 });
  return _anthropic;
}
async function anthropicChat(prompt, temperature = 0.4) {
  const resp = await getAnthropic().messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 400,
    temperature,
    messages: [{ role: 'user', content: prompt }],
  });
  const block = (resp.content || []).find(b => b.type === 'text');
  return block ? block.text : '';
}

// Dispatch to the selected backend (sanitizing the prompt so corrupted text in
// a provider row can't produce a request body the API rejects as invalid JSON).
async function generate(prompt) {
  const p = sanitizeText(prompt);
  return ENGINE === 'claude' ? anthropicChat(p) : perplexityChat(p);
}

function extractDescription(content) {
  if (!content) return null;
  // Prefer the JSON object; fall back to raw text if the model skipped the wrapper.
  const m = content.match(/\{[\s\S]*\}/);
  let desc = null;
  if (m) {
    try {
      const parsed = JSON.parse(m[0]);
      if (parsed && typeof parsed.description === 'string') desc = parsed.description;
    } catch { /* fall through */ }
  }
  if (!desc) {
    // Strip code fences / leading "Description:" labels.
    desc = content.replace(/```[a-z]*|```/gi, '').replace(/^\s*description\s*[:\-]\s*/i, '').trim();
    // If it still looks like JSON we failed to parse, bail.
    if (desc.startsWith('{') || desc.startsWith('[')) return null;
  }
  desc = (desc || '').replace(/\s+/g, ' ').trim();
  // Strip bracketed citation markers Perplexity sometimes leaves, e.g. "[1]".
  desc = desc.replace(/\s*\[\d+\]/g, '').trim();
  return desc || null;
}

function isSane(desc) {
  if (!desc) return false;
  if (desc.length < 60 || desc.length > 1400) return false;
  const lower = desc.toLowerCase();
  if (BAD_PHRASES.some(b => lower.includes(b))) return false;
  if (lower.startsWith('located in')) return false;
  // Must contain at least one sentence-ending period.
  if (!/[.!?]/.test(desc)) return false;
  return true;
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('=== Backfill Provider Descriptions (Project 6) ===');
  console.log(`Mode:        ${DRY_RUN ? 'DRY RUN (add --run to execute)' : 'LIVE — writing to DB'}`);
  console.log(`Engine:      ${ENGINE === 'claude' ? `claude (${CLAUDE_MODEL}, no web search)` : 'perplexity (sonar, web search)'}`);
  console.log(`Scope:       ${INCLUDE_GEN2 ? 'Gen-1 + Gen-2 templated' : 'Gen-1 templated only'}${CATEGORY_FILTER ? ` | category="${CATEGORY_FILTER}"` : ''}${LIMIT ? ` | limit=${LIMIT}` : ''}`);
  console.log(`Concurrency: ${CONCURRENCY}`);
  if (ENGINE === 'claude' && !ANTHROPIC_API_KEY) { console.error('Missing ANTHROPIC_API_KEY in .env.local'); process.exit(1); }
  if (ENGINE === 'perplexity' && !PERPLEXITY_API_KEY) { console.error('Missing PERPLEXITY_API_KEY in .env.local'); process.exit(1); }

  console.log('\nFetching target rows...');
  const rows = await fetchTargetRows();
  console.log(`Matched ${rows.length} provider(s) with a templated description.`);
  if (rows.length === 0) { console.log('Nothing to do.'); return; }

  const byCat = {};
  for (const r of rows) byCat[r.provider_category] = (byCat[r.provider_category] || 0) + 1;
  console.log('By category:');
  for (const [k, v] of Object.entries(byCat).sort((a, b) => b[1] - a[1])) console.log(`  ${String(v).padStart(6)}  ${k}`);
  console.log(`\nEstimated cost: ~$${(rows.length / 1000 * COST_PER_1K[ENGINE]).toFixed(2)} (${ENGINE}, ~$${COST_PER_1K[ENGINE]}/1000 calls)`);
  console.log(`Estimated time: ~${Math.round((rows.length / CONCURRENCY) * (ENGINE === 'claude' ? 2.0 : 1.2) / 60)} min @ ${CONCURRENCY} workers`);

  // ── Dry run: generate a handful of real rewrites and show before→after ──
  if (DRY_RUN) {
    const n = Math.min(SAMPLE_N, rows.length);
    console.log(`\n--- Generating ${n} sample rewrite(s) (no writes) ---\n`);
    // Sample across the set, not just the head.
    const step = Math.max(1, Math.floor(rows.length / n));
    const picks = [];
    for (let i = 0; i < rows.length && picks.length < n; i += step) picks.push(rows[i]);
    for (const p of picks) {
      try {
        const content = await generate(buildPrompt(p));
        const desc = extractDescription(content);
        const ok = isSane(desc);
        console.log(`● ${p.provider_name} — ${p.provider_category} — ${p.city}, ${p.state}  [${p.provider_id}]`);
        console.log(`  BEFORE: ${p.provider_description}`);
        console.log(`  AFTER:  ${desc || '(parse failed)'}${ok ? '' : '   ⚠ REJECTED by sanity check'}`);
        console.log('');
      } catch (err) {
        console.log(`● ${p.provider_name} [${p.provider_id}] — ERROR: ${err.message}\n`);
      }
      await sleep(150);
    }
    console.log('Dry run complete. Review the AFTER lines, then re-run with --run.');
    return;
  }

  // ── Live run: worker pool ──
  let processed = 0, updated = 0, rejected = 0, errored = 0, backedUp = 0;
  const startTime = Date.now();
  let cursor = 0;

  async function processOne(p) {
    let content;
    try {
      content = await generate(buildPrompt(p));
    } catch (err) {
      errored++;
      if (errored <= 20) console.log(`  [err] ${p.provider_id} ${p.provider_name}: ${err.message}`);
      return;
    }
    const desc = extractDescription(content);
    if (!isSane(desc)) {
      rejected++;
      if (rejected <= 20) console.log(`  [reject] ${p.provider_id} ${p.provider_name}: ${desc ? desc.slice(0, 120) : '(parse failed)'}`);
      return;
    }
    // Re-check the row still matches (skip if another worker/run already did it).
    if (!matchesTemplate(p.provider_description)) return;

    // description_updated_at feeds the sitemaps' <lastmod> (migration 082).
    const update = { provider_description: desc, description_updated_at: new Date().toISOString() };
    // Back up the original ONLY if no backup exists yet — never clobber.
    if (p.provider_description_v1_backup == null) {
      update.provider_description_v1_backup = p.provider_description;
      backedUp++;
    }
    const { error } = await supabase.from('olera-providers').update(update).eq('provider_id', p.provider_id);
    if (error) {
      errored++;
      if (errored <= 20) console.log(`  [db-err] ${p.provider_id}: ${error.message}`);
      return;
    }
    updated++;
  }

  async function worker() {
    while (true) {
      const idx = cursor++;
      if (idx >= rows.length) break;
      await processOne(rows[idx]);
      processed++;
      if (processed % 25 === 0) {
        const elapsedM = (Date.now() - startTime) / 60000;
        const rate = processed / Math.max(elapsedM, 0.01);
        const etaM = (rows.length - processed) / Math.max(rate, 0.01);
        process.stdout.write(
          `[${processed}/${rows.length}] ✓${updated} ⊘${rejected} ⚠${errored} | ${rate.toFixed(0)}/min | ${elapsedM.toFixed(1)}m elapsed, ~${etaM.toFixed(0)}m left\r`
        );
      }
      await sleep(60);
    }
  }

  console.log(`\nRunning ${CONCURRENCY} workers...\n`);
  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  console.log(`\n\n=== Done ===`);
  console.log(`Processed:  ${processed}`);
  console.log(`Updated:    ${updated}  (backups written: ${backedUp})`);
  console.log(`Rejected:   ${rejected}  (model echoed template / unparseable — left untouched, retry next run)`);
  console.log(`Errored:    ${errored}  (API/DB errors — left untouched, retry next run)`);
  console.log(`Cost:       ~$${((processed) / 1000).toFixed(2)}`);
  console.log(`Wall time:  ${((Date.now() - startTime) / 60000).toFixed(1)} min`);
  if (rejected + errored > 0) console.log(`\nRe-run the same command to retry the ${rejected + errored} unfinished row(s).`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
