#!/usr/bin/env node
/**
 * Does the number we publish appear on the operator's own page?
 *
 * Built 2026-08-18 after the ND Assistive Senior Safety Program was found
 * publishing (800) 735-5400 — a number that appears on ndassistive.org nowhere,
 * on hhs.nd.gov nowhere, and whose only attribution on the open web was
 * olera.care itself. We were the sole source for a number we had invented, and
 * because our pages rank, checking it looked like confirmation.
 *
 * That failure has a mechanical signature: the phone is absent from the
 * program's own sourceUrl. This script tests exactly that, over the whole
 * corpus, with no human in the loop.
 *
 * WHAT IT DOES NOT DO: prove a number is correct. A number can appear on the
 * operator's site and still be the wrong door — that is the SoonerCare case, a
 * real staffed line that could not take the caller's application. This finds
 * numbers with no provenance, which is a different and more basic failure.
 *
 * Usage:
 *   node scripts/benefits-phone-provenance.js --state=ND,AL
 *   node scripts/benefits-phone-provenance.js --limit=50 --json
 *   node scripts/benefits-phone-provenance.js --only-missing
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', 'data', 'pipeline');
const arg = (n, d) => {
  const m = process.argv.find((a) => a.startsWith(`--${n}=`));
  return m ? m.slice(n.length + 3) : d;
};
const ONLY = (arg('state', '') || '').split(',').filter(Boolean).map((s) => s.toUpperCase());
const LIMIT = parseInt(arg('limit', '0'), 10) || 0;
const JSON_OUT = process.argv.includes('--json');
const ONLY_MISSING = process.argv.includes('--only-missing');
const CONCURRENCY = 4;
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36';

const digits = (s) => String(s || '').replace(/\D/g, '').replace(/^1(?=\d{10}$)/, '');

/** Every way a 10-digit number is plausibly written on a page. */
function variants(d) {
  if (d.length !== 10) return [d];
  const [a, b, c] = [d.slice(0, 3), d.slice(3, 6), d.slice(6)];
  return [d, `${a}-${b}-${c}`, `(${a}) ${b}-${c}`, `(${a})${b}-${c}`, `${a}.${b}.${c}`,
    `${a} ${b} ${c}`, `1-${a}-${b}-${c}`, `1 (${a}) ${b}-${c}`, `+1${d}`, `1${d}`];
}

async function tryFetch(url, timeoutMs = 20000) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'text/html,*/*' }, signal: ac.signal, redirect: 'follow' });
    if (!r.ok) return { ok: false, status: r.status };
    return { ok: true, text: await r.text() };
  } catch (e) {
    return { ok: false, status: e.name === 'AbortError' ? 'timeout' : 'error' };
  } finally { clearTimeout(t); }
}

/** Direct, then the text proxy that got past Florida's WAF, then Wayback. */
async function fetchWithFallbacks(url) {
  let r = await tryFetch(url);
  if (r.ok) return { ...r, via: 'direct' };
  const bare = url.replace(/^https?:\/\//, '');
  r = await tryFetch(`https://r.jina.ai/${url}`, 25000);
  if (r.ok) return { ...r, via: 'jina' };
  r = await tryFetch(`https://web.archive.org/web/2026/${url}`, 30000);
  if (r.ok) return { ...r, via: 'wayback' };
  return { ok: false, status: r.status, via: 'none' };
}

function candidateUrls(p) {
  const out = [];
  if (p.sourceUrl) out.push(p.sourceUrl);
  for (const u of p.applicationGuide?.urls || []) if (u?.url) out.push(u.url);
  // dedupe, keep order, http(s) only
  return [...new Set(out)].filter((u) => /^https?:\/\//.test(u));
}

function loadPrograms() {
  const rows = [];
  for (const st of fs.readdirSync(ROOT).filter((d) => /^[A-Z]{2}$/.test(d))) {
    if (ONLY.length && !ONLY.includes(st)) continue;
    const fp = path.join(ROOT, st, 'drafts.json');
    if (!fs.existsSync(fp)) continue;
    for (const p of JSON.parse(fs.readFileSync(fp, 'utf8')).programs || []) {
      const cs = p.contacts || [];
      const lead = cs.find((c) => /start here/i.test(c.label || '') && c.phone) || cs.find((c) => c.phone);
      if (!lead?.phone) continue;
      const d = digits(lead.phone);
      if (d.length !== 10) continue; // 2-1-1 and short codes have no provenance to check
      rows.push({ state: st, programId: p.id, program: p.name, label: lead.label,
        phone: lead.phone, digits: d, urls: candidateUrls(p),
        lastVerifiedDate: p.lastVerifiedDate || null });
    }
  }
  return LIMIT ? rows.slice(0, LIMIT) : rows;
}

async function check(row) {
  if (!row.urls.length) return { ...row, verdict: 'NO_SOURCE_URL', foundOn: null, via: null };
  const vs = variants(row.digits);
  const tried = [];
  for (const url of row.urls) {
    const r = await fetchWithFallbacks(url);
    if (!r.ok) { tried.push(`${url} [${r.status}]`); continue; }
    const hay = r.text.replace(/&nbsp;/g, ' ');
    if (vs.some((v) => hay.includes(v))) return { ...row, verdict: 'CONFIRMED', foundOn: url, via: r.via };
    tried.push(`${url} [fetched via ${r.via}, number absent]`);
  }
  const reachable = tried.some((t) => /number absent/.test(t));
  return { ...row, verdict: reachable ? 'NOT_ON_OPERATOR_PAGE' : 'UNREACHABLE', foundOn: null, via: null, tried };
}

(async () => {
  const rows = loadPrograms();
  process.stderr.write(`Checking ${rows.length} lead phone numbers against their own sourceUrl...\n`);
  const out = [];
  let i = 0, done = 0;
  await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
    while (i < rows.length) {
      const row = rows[i++];
      out.push(await check(row));
      if (++done % 25 === 0) process.stderr.write(`  ${done}/${rows.length}\n`);
    }
  }));
  const order = { NOT_ON_OPERATOR_PAGE: 0, NO_SOURCE_URL: 1, UNREACHABLE: 2, CONFIRMED: 3 };
  out.sort((a, b) => order[a.verdict] - order[b.verdict] || a.state.localeCompare(b.state));
  const shown = ONLY_MISSING ? out.filter((r) => r.verdict === 'NOT_ON_OPERATOR_PAGE') : out;

  if (JSON_OUT) { console.log(JSON.stringify({ checked: out.length, findings: shown }, null, 2)); return; }
  const tally = out.reduce((a, r) => ((a[r.verdict] = (a[r.verdict] || 0) + 1), a), {});
  console.log(`\nChecked ${out.length} numbers.`);
  for (const [k, v] of Object.entries(tally)) console.log(`  ${String(v).padStart(4)}  ${k}`);
  console.log('\nNOT_ON_OPERATOR_PAGE is the North Dakota signature: the page loaded and the');
  console.log('number was not on it. Those want a human before anything else.\n');
  for (const r of shown.filter((x) => x.verdict !== 'CONFIRMED')) {
    console.log(`[${r.verdict}] ${r.state}/${r.programId}`);
    console.log(`   ${r.program}`);
    console.log(`   publishes: ${r.label} — ${r.phone}${r.lastVerifiedDate ? ` (verified ${r.lastVerifiedDate})` : ' (never verified)'}`);
    (r.tried || []).forEach((t) => console.log(`   tried: ${t}`));
    console.log('');
  }
})();
