#!/usr/bin/env node
/**
 * Franchise detection for parentOrganization schema (Notion: "Franchise
 * detection to populate parentOrganization schema on provider pages").
 *
 * Layered verifier — spend API calls only where needed:
 *   1. Regex candidate match on provider_name (free)
 *   2. Website-domain auto-confirm: hostname matches the franchise domain (free,
 *      highest confidence)
 *   3. Perplexity Sonar web-search verify for the ambiguous remainder (paid) —
 *      reuses the city-pipeline's proven retry/backoff pattern
 *
 * READ-ONLY. Never writes to Supabase. Emits a results JSON + a human
 * spot-check sheet so the precision can be eyeballed on a small sample before
 * any production write.
 *
 * Run from ~/Desktop/olera-web (has node_modules + .env.local), e.g.:
 *   node scripts/franchise-classify.js --per-brand 8        # dry-run sample
 *   node scripts/franchise-classify.js --full               # verify every candidate
 *
 * Flags:
 *   --per-brand N   Max Perplexity verifications per brand (dry-run). Default 8.
 *   --full          Verify all non-domain-confirmed candidates (no per-brand cap).
 *   --out DIR       Output directory. Default /tmp/franchise.
 *
 * Commit (writes to Supabase — the ONE place this script is not read-only):
 *   --from FILE     Load a prior run's franchise-results.json (no re-classify,
 *                   no Perplexity spend) and act on it.
 *   --commit        With --from: write parent_organization for every confirmed
 *                   row. Without --commit, --from just prints what WOULD write.
 */

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------
const argv = process.argv.slice(2);
const FULL = argv.includes('--full');
const PER_BRAND = (() => {
  const i = argv.indexOf('--per-brand');
  return i >= 0 ? parseInt(argv[i + 1], 10) : 8;
})();
const OUT_DIR = (() => {
  const i = argv.indexOf('--out');
  return i >= 0 ? argv[i + 1] : '/tmp/franchise';
})();
const FROM = (() => {
  const i = argv.indexOf('--from');
  return i >= 0 ? argv[i + 1] : null;
})();
const COMMIT = argv.includes('--commit');

// ---------------------------------------------------------------------------
// Brand dictionary
// `keyword` is the broad ILIKE substring; `pattern` is the precise (word-
// boundary) confirm. `domain` powers the free auto-confirm.
//
// `tier` drives the verifier when there's no domain match:
//   'distinctive' — multi-word trademarked name; a business named "<brand> of
//      X" is almost always a franchisee. Lenient prompt: attribute unless
//      positively disconfirmed. (Dry-run #1 showed these were over-rejected on
//      address-precision grounds — e.g. every "Caring Senior Service".)
//   'strict' — name shares a COMMON word with the brand, so collisions are
//      rife ("Five Star Home Care" ≠ Five Star Senior Living; "Brookdale
//      Heights" ≠ Brookdale). Require positive evidence the brand operates
//      this exact location, else reject.
//
// Five Star Senior Living was DROPPED after dry-run #1: 0 of 8 "Five Star"
// matches were the senior-living brand — all were unrelated home-care agencies.
// ---------------------------------------------------------------------------
const BRANDS = [
  // Distinctive trademarked names — lenient verify (name + no contradiction)
  { name: 'Visiting Angels', url: 'https://www.visitingangels.com', domain: 'visitingangels.com', keyword: 'visiting angels', pattern: /\bvisiting angels\b/i, tier: 'distinctive' },
  { name: 'Home Instead', url: 'https://www.homeinstead.com', domain: 'homeinstead.com', keyword: 'home instead', pattern: /\bhome instead\b/i, tier: 'distinctive' },
  { name: 'Comfort Keepers', url: 'https://www.comfortkeepers.com', domain: 'comfortkeepers.com', keyword: 'comfort keepers', pattern: /\bcomfort keepers\b/i, tier: 'distinctive' },
  { name: 'Senior Helpers', url: 'https://www.seniorhelpers.com', domain: 'seniorhelpers.com', keyword: 'senior helpers', pattern: /\bsenior helpers\b/i, tier: 'distinctive' },
  { name: 'BrightStar Care', url: 'https://www.brightstarcare.com', domain: 'brightstarcare.com', keyword: 'brightstar', pattern: /\bbrightstar\b/i, tier: 'distinctive' },
  { name: 'SYNERGY HomeCare', url: 'https://www.synergyhomecare.com', domain: 'synergyhomecare.com', keyword: 'synergy', pattern: /\bsynergy\s*home\s*care\b/i, tier: 'distinctive' },
  { name: 'Amada Senior Care', url: 'https://www.amadaseniorcare.com', domain: 'amadaseniorcare.com', keyword: 'amada', pattern: /\bamada\b/i, tier: 'distinctive' },
  { name: 'Griswold Home Care', url: 'https://www.griswoldcare.com', domain: 'griswoldhomecare.com', keyword: 'griswold', pattern: /\bgriswold\b/i, tier: 'distinctive' },
  { name: 'FirstLight Home Care', url: 'https://www.firstlighthomecare.com', domain: 'firstlighthomecare.com', keyword: 'firstlight', pattern: /\bfirstlight\b/i, tier: 'distinctive' },
  { name: 'Homewatch CareGivers', url: 'https://www.homewatchcaregivers.com', domain: 'homewatchcaregivers.com', keyword: 'homewatch', pattern: /\bhomewatch\b/i, tier: 'distinctive' },
  { name: 'Always Best Care', url: 'https://www.alwaysbestcare.com', domain: 'alwaysbestcare.com', keyword: 'always best care', pattern: /\balways best care\b/i, tier: 'distinctive' },
  { name: 'Caring Senior Service', url: 'https://www.caringseniorservice.com', domain: 'caringseniorservice.com', keyword: 'caring senior service', pattern: /\bcaring senior service\b/i, tier: 'distinctive' },
  // Common-word names — strict verify (require positive operator evidence)
  { name: 'Right at Home', url: 'https://www.rightathome.net', domain: 'rightathome.net', keyword: 'right at home', pattern: /\bright at home\b/i, tier: 'strict' },
  { name: 'Home Helpers Home Care', url: 'https://www.homehelpershomecare.com', domain: 'homehelpershomecare.com', keyword: 'home helpers', pattern: /\bhome helpers\b/i, tier: 'strict' },
  { name: 'Brookdale Senior Living', url: 'https://www.brookdale.com', domain: 'brookdale.com', keyword: 'brookdale', pattern: /\bbrookdale\b/i, tier: 'strict' },
  { name: 'Atria Senior Living', url: 'https://www.atriaseniorliving.com', domain: 'atriaseniorliving.com', keyword: 'atria', pattern: /\batria\b/i, tier: 'strict' },
  { name: 'Sunrise Senior Living', url: 'https://www.sunriseseniorliving.com', domain: 'sunriseseniorliving.com', keyword: 'sunrise', pattern: /\bsunrise (senior living|of)\b/i, tier: 'strict' },
  { name: 'Genesis HealthCare', url: 'https://www.genesishcc.com', domain: 'genesishcc.com', keyword: 'genesis health', pattern: /\bgenesis health\s?care\b/i, tier: 'strict' },
  { name: 'Life Care Centers of America', url: 'https://lcca.com', domain: 'lcca.com', keyword: 'life care center', pattern: /\blife care center\b/i, tier: 'strict' },
];

// ---------------------------------------------------------------------------
// Perplexity (self-contained copy of the city-pipeline helper)
// ---------------------------------------------------------------------------
let perplexityCalls = 0;
let lastPerplexityAt = 0;
async function rateLimit(minGapMs) {
  const now = Date.now();
  const wait = lastPerplexityAt + minGapMs - now;
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  lastPerplexityAt = Date.now();
}

async function perplexityChat(prompt, temperature = 0.1) {
  const MAX_ATTEMPTS = 5;
  let lastErr;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    await rateLimit(350);
    let resp;
    try {
      resp = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model: 'sonar', messages: [{ role: 'user', content: prompt }], temperature }),
      });
    } catch (err) {
      lastErr = err;
      if (attempt === MAX_ATTEMPTS) throw err;
      await new Promise(r => setTimeout(r, 2000 * 2 ** (attempt - 1)));
      continue;
    }
    if (resp.ok) {
      perplexityCalls++;
      const json = await resp.json();
      return json.choices?.[0]?.message?.content || '';
    }
    const shouldRetry = resp.status === 429 || (resp.status >= 500 && resp.status < 600);
    const text = await resp.text();
    lastErr = new Error(`Perplexity ${resp.status}: ${text.slice(0, 160)}`);
    if (!shouldRetry || attempt === MAX_ATTEMPTS) throw lastErr;
    await new Promise(r => setTimeout(r, 2000 * 2 ** (attempt - 1)));
  }
  throw lastErr;
}

function extractJson(text) {
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch { return null; }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function hostnameOf(website) {
  if (!website) return null;
  try {
    const u = new URL(website.includes('://') ? website : `https://${website}`);
    return u.hostname.toLowerCase().replace(/^www\./, '');
  } catch { return null; }
}

function domainMatches(website, brandDomain) {
  const host = hostnameOf(website);
  if (!host) return false;
  return host === brandDomain || host.endsWith(`.${brandDomain}`);
}

function verifyPrompt(p, brand) {
  const header = `Business: ${p.provider_name}
Address: ${p.address || 'unknown'}, ${p.city || ''}, ${p.state || ''}
Website: ${p.website || 'unknown'}
Brand: ${brand.name} (${brand.url})`;

  if (brand.tier === 'strict') {
    // Common-word brand → demand positive operator evidence.
    return `A business shares a word with the national senior-care brand "${brand.name}", but that word is common, so verify carefully.

${header}

Answer is_franchise = TRUE only if you find POSITIVE web evidence that this exact business/community is operated by ${brand.name}: it appears on ${brand.name}'s official website or location finder, or directory/licensing records name ${brand.name} (or its parent company) as the operator of this location.

Answer is_franchise = FALSE if it is a different company that merely shares the word — e.g. "Five Star Home Care" is not "Five Star Senior Living"; "Brookdale Heights Apartments" is not Brookdale Senior Living; "River of Life Care Center" is not Life Care Centers of America; an agency that was sold to a different operator.

Return ONLY JSON: {"is_franchise": true/false, "reason": "brief, cite the evidence", "confidence": "high/medium/low"}`;
  }

  // Distinctive trademarked brand → attribute unless positively disconfirmed.
  return `Decide whether a business is a franchisee of the national senior-care brand "${brand.name}".

${header}

"${brand.name}" is a trademarked franchise brand — it legally controls its name, so a business whose name is a form of "${brand.name}" (e.g. "${brand.name} of ${p.city || 'Town'}", "${brand.name} Senior Home Care") is almost always an official franchisee.

Answer is_franchise = TRUE if the business name is a form of "${brand.name}" AND you find no evidence it is actually a different, unrelated company. You do NOT need to confirm the exact street address — the trademarked name plus the absence of contradicting evidence is sufficient.

Answer is_franchise = FALSE only if you find positive evidence this is a DIFFERENT business that merely shares words with the brand — e.g. a different operator/brand name at this address, or the words recombined into an unrelated business ("The Angels of Memory Care" is not Visiting Angels; "Home Instead REHAB Services" is a rehab clinic, not the Home Instead franchise; "Leading Choice Home Helpers" is its own agency).

Return ONLY JSON: {"is_franchise": true/false, "reason": "brief, cite the evidence", "confidence": "high/medium/low"}`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Commit: write parent_organization for confirmed rows from a prior results
// file. Grouped by brand so it's ~19 bulk UPDATEs, not 4K. Idempotent — only
// sets the parent_organization column. Domain-confirmed AND ppl-confirmed both
// count (verdict === 'confirmed').
// ---------------------------------------------------------------------------
async function commitFrom(file) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) { console.error('Missing SUPABASE_SERVICE_ROLE_KEY'); process.exit(1); }
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const confirmed = (data.results || []).filter(r => r.verdict === 'confirmed' && r.provider_id && r.brand);

  // brand -> { parentOrg: {name,url}, ids: [] }
  const byBrand = new Map();
  for (const r of confirmed) {
    if (!byBrand.has(r.brand)) byBrand.set(r.brand, { parentOrg: { name: r.brand, ...(r.brand_url ? { url: r.brand_url } : {}) }, ids: [] });
    byBrand.get(r.brand).ids.push(r.provider_id);
  }

  console.log(`Loaded ${file}`);
  console.log(`Confirmed rows: ${confirmed.length} across ${byBrand.size} brands`);
  console.log(`Mode: ${COMMIT ? 'COMMIT (writing parent_organization)' : 'DRY (no writes — pass --commit to write)'}\n`);

  let written = 0, failed = 0;
  for (const [brand, { parentOrg, ids }] of byBrand) {
    if (!COMMIT) { console.log(`  ${String(ids.length).padStart(4)}  ${brand}`); continue; }
    // Chunk ids for the .in() filter.
    for (let i = 0; i < ids.length; i += 400) {
      const chunk = ids.slice(i, i + 400);
      const { error } = await supabase
        .from('olera-providers')
        .update({ parent_organization: parentOrg })
        .in('provider_id', chunk);
      if (error) { console.error(`  ERROR ${brand} [${i}-${i + chunk.length}]: ${error.message}`); failed += chunk.length; }
      else written += chunk.length;
    }
    console.log(`  wrote ${String(ids.length).padStart(4)}  ${brand}`);
  }

  if (COMMIT) console.log(`\nDone. parent_organization written: ${written}, failed: ${failed}`);
  else console.log(`\nWould write ${confirmed.length} rows. Re-run with --commit to apply.`);
}

(async () => {
  if (FROM) { await commitFrom(FROM); return; }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) { console.error('Missing SUPABASE_SERVICE_ROLE_KEY'); process.exit(1); }
  if (!PERPLEXITY_API_KEY) { console.error('Missing PERPLEXITY_API_KEY'); process.exit(1); }
  fs.mkdirSync(OUT_DIR, { recursive: true });

  console.log(`Mode: ${FULL ? 'FULL (verify all)' : `DRY-RUN (≤${PER_BRAND} Perplexity/brand)`}\n`);

  // 1. Gather candidates (free) ---------------------------------------------
  // provider_id -> { provider, brands: Set }
  const byProvider = new Map();
  const brandCandidateCounts = {};
  for (const brand of BRANDS) {
    const { data, error } = await supabase
      .from('olera-providers')
      .select('provider_id, provider_name, address, city, state, website, provider_category, slug')
      .ilike('provider_name', `%${brand.keyword}%`)
      .eq('deleted', false)
      .limit(2000);
    if (error) { console.error(`  query failed for ${brand.name}: ${error.message}`); continue; }
    const matched = (data || []).filter(p => brand.pattern.test(p.provider_name || ''));
    brandCandidateCounts[brand.name] = matched.length;
    for (const p of matched) {
      if (!byProvider.has(p.provider_id)) byProvider.set(p.provider_id, { p, brands: [] });
      byProvider.get(p.provider_id).brands.push(brand);
    }
  }

  console.log('Candidate counts (regex-confirmed name match):');
  for (const b of BRANDS) console.log(`  ${String(brandCandidateCounts[b.name] ?? 0).padStart(4)}  ${b.name}`);
  console.log(`  ----`);
  console.log(`  ${String(byProvider.size).padStart(4)}  distinct providers\n`);

  // Classify each candidate --------------------------------------------------
  const results = [];     // every candidate decision
  const ambiguous = [];   // matched >1 brand — skip auto, flag for review
  const toVerify = [];    // {provider, brand} queued for Perplexity

  for (const { p, brands } of byProvider.values()) {
    if (brands.length > 1) {
      ambiguous.push({ provider_id: p.provider_id, provider_name: p.provider_name, city: p.city, state: p.state, brands: brands.map(b => b.name) });
      continue;
    }
    const brand = brands[0];
    if (domainMatches(p.website, brand.domain)) {
      results.push({ provider_id: p.provider_id, provider_name: p.provider_name, city: p.city, state: p.state, website: p.website, brand: brand.name, brand_url: brand.url, source: 'domain', verdict: 'confirmed', confidence: 'high', reason: `website host matches ${brand.domain}` });
    } else {
      toVerify.push({ p, brand });
    }
  }

  const domainConfirmed = results.length;
  console.log(`Domain auto-confirmed (free): ${domainConfirmed}`);
  console.log(`Ambiguous (multi-brand, skipped): ${ambiguous.length}`);
  console.log(`Needing Perplexity verification: ${toVerify.length}\n`);

  // 2. Select the Perplexity batch ------------------------------------------
  let batch = toVerify;
  if (!FULL) {
    // Stratified dry-run: up to PER_BRAND per brand.
    const perBrand = {};
    batch = [];
    for (const item of toVerify) {
      const k = item.brand.name;
      perBrand[k] = perBrand[k] || 0;
      if (perBrand[k] < PER_BRAND) { perBrand[k]++; batch.push(item); }
    }
  }
  const estCost = (batch.length * 8 / 1000).toFixed(2);
  console.log(`Verifying ${batch.length} via Perplexity (est ~$${estCost} @ $8/1k)...\n`);

  // 3. Verify ----------------------------------------------------------------
  let done = 0;
  for (const { p, brand } of batch) {
    let verdict = 'unverified', reason = '', confidence = 'low';
    try {
      const raw = await perplexityChat(verifyPrompt(p, brand));
      const j = extractJson(raw);
      if (j && typeof j.is_franchise === 'boolean') {
        verdict = j.is_franchise ? 'confirmed' : 'rejected';
        reason = (j.reason || '').slice(0, 300);
        confidence = j.confidence || 'low';
      } else {
        reason = `unparseable: ${raw.slice(0, 120)}`;
      }
    } catch (err) {
      reason = `error: ${err.message}`;
    }
    results.push({ provider_id: p.provider_id, provider_name: p.provider_name, city: p.city, state: p.state, website: p.website || '', brand: brand.name, brand_url: brand.url, brand_tier: brand.tier, source: 'perplexity', verdict, confidence, reason });
    done++;
    if (done % 10 === 0 || done === batch.length) process.stdout.write(`\r  verified ${done}/${batch.length}`);
  }
  console.log('\n');

  // 4. Output ----------------------------------------------------------------
  const ppl = results.filter(r => r.source === 'perplexity');
  const confirmed = results.filter(r => r.verdict === 'confirmed');
  const pplConfirmed = ppl.filter(r => r.verdict === 'confirmed').length;
  const pplRejected = ppl.filter(r => r.verdict === 'rejected').length;
  const pplUnver = ppl.filter(r => r.verdict === 'unverified').length;

  fs.writeFileSync(path.join(OUT_DIR, 'franchise-results.json'),
    JSON.stringify({ generatedFrom: 'franchise-classify.js', mode: FULL ? 'full' : `dry-run/${PER_BRAND}`, brandCandidateCounts, distinctCandidates: byProvider.size, domainConfirmed, ambiguousCount: ambiguous.length, perplexityVerified: ppl.length, results, ambiguous }, null, 2));

  // Human spot-check sheet
  const lines = [];
  lines.push(`# Franchise verification — spot check\n`);
  lines.push(`Mode: ${FULL ? 'FULL' : `dry-run (≤${PER_BRAND}/brand)`} · Perplexity calls: ${perplexityCalls} (~$${(perplexityCalls * 8 / 1000).toFixed(2)})\n`);
  lines.push(`Distinct candidates: ${byProvider.size} · domain-confirmed (free): ${domainConfirmed} · ambiguous: ${ambiguous.length}\n`);
  lines.push(`Perplexity sample: ${ppl.length} → confirmed ${pplConfirmed}, rejected ${pplRejected}, unverified ${pplUnver}\n`);
  lines.push(`\n## Perplexity verdicts (review these for precision)\n`);
  lines.push(`| ✓? | Provider | City, ST | Brand | tier | conf | Reason |`);
  lines.push(`|----|----------|----------|-------|------|------|--------|`);
  for (const r of ppl.sort((a, b) => a.brand.localeCompare(b.brand))) {
    const mark = r.verdict === 'confirmed' ? '✅' : r.verdict === 'rejected' ? '❌' : '⚠️';
    lines.push(`| ${mark} | ${r.provider_name} | ${r.city || ''}, ${r.state || ''} | ${r.brand} | ${r.brand_tier} | ${r.confidence} | ${(r.reason || '').replace(/\|/g, '/')} |`);
  }
  lines.push(`\n## Domain auto-confirmed sample (free, high confidence — spot check a few)\n`);
  lines.push(`| Provider | City, ST | Brand | Website |`);
  lines.push(`|----------|----------|-------|---------|`);
  for (const r of results.filter(r => r.source === 'domain').slice(0, 20)) {
    lines.push(`| ${r.provider_name} | ${r.city || ''}, ${r.state || ''} | ${r.brand} | ${r.website} |`);
  }
  if (ambiguous.length) {
    lines.push(`\n## Ambiguous (matched >1 brand — excluded, needs a rule)\n`);
    for (const a of ambiguous.slice(0, 20)) lines.push(`- ${a.provider_name} (${a.city}, ${a.state}) → ${a.brands.join(' + ')}`);
  }
  fs.writeFileSync(path.join(OUT_DIR, 'franchise-spotcheck.md'), lines.join('\n'));

  console.log(`Perplexity precision on sample: ${pplConfirmed}/${ppl.length} confirmed, ${pplRejected} rejected, ${pplUnver} unverified`);
  console.log(`Total would-be tagged (domain + ppl-confirmed): ${confirmed.length}`);
  console.log(`\nOutputs:`);
  console.log(`  ${path.join(OUT_DIR, 'franchise-spotcheck.md')}`);
  console.log(`  ${path.join(OUT_DIR, 'franchise-results.json')}`);
})();
