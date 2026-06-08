#!/usr/bin/env node
/**
 * Market-Diagnostic analysis layer.
 * Reads the raw snapshot, classifies every place with Claude Haiku (clean buckets +
 * referral-value score), then computes the consulting-grade diagnostic:
 *   - Competitor landscape (true competitors only, share-of-voice by review volume, leaders, gaps)
 *   - Referral graph (cleaned + prioritized BD target list — the channel a single agency can't map itself)
 *   - Channel prioritization (scored, with rationale + rough economics)
 *   - Demand (census + Olera captured)
 *
 * Usage: node scripts/market-diagnostic/analyze-diagnostic.mjs \
 *          --in data/market-diagnostic/college-station.json \
 *          --out data/market-diagnostic/college-station.analysis.json
 */
import { readFileSync, writeFileSync } from "node:fs";

function loadEnv() {
  try {
    const raw = readFileSync(new URL("../../.env.local", import.meta.url), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^([A-Z_]+)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {}
}
loadEnv();
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = "claude-haiku-4-5";

function arg(name, def) { const i = process.argv.indexOf(`--${name}`); return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : def; }
const IN = arg("in", "data/market-diagnostic/college-station.json");
const OUT = arg("out", IN.replace(/\.json$/, ".analysis.json"));
const CACHE = IN.replace(/\.json$/, ".classified.json"); // id -> {cat, referralValue}
const MAXMI = parseFloat(arg("maxmi", "25")); // local catchment cap (Places bias isn't a hard limit)
const inCatchment = (p) => p.distanceMiles == null || p.distanceMiles <= MAXMI;

const CATS = ["home_care","home_health","hospice","skilled_nursing","assisted_living","hospital","clinic","elder_law","financial","senior_resource","faith","other"];

const CLASSIFY_SYS = `You classify local businesses for a senior-care market analysis. For each place return its category and its value as a CLIENT-REFERRAL SOURCE for a NON-MEDICAL HOME CARE agency (an agency that sends caregivers to seniors' homes for hourly help).

Categories (pick ONE):
- home_care: non-medical / private-duty in-home care agency (caregivers, companion care). e.g. Visiting Angels, Home Instead, Comfort Keepers, Right at Home, SYNERGY HomeCare, BrightStar, Griswold, Senior Helpers, "At Your Side Home Care". THIS IS A COMPETITOR.
- home_health: Medicare-certified home HEALTH agency (skilled nursing/therapy at home). e.g. "X Home Health".
- hospice: hospice / palliative.
- skilled_nursing: skilled nursing facility, nursing & rehab, post-acute rehab.
- assisted_living: assisted living, memory care, senior living / retirement community, personal care home.
- hospital: a GENERAL / ACUTE-CARE hospital or medical center with inpatient beds — a real discharge source. A standalone urgent care, freestanding/independent ER, walk-in or "convenient care" clinic, or outpatient specialty practice is NOT a hospital → classify as "clinic".
- clinic: outpatient clinic, urgent care, freestanding ER, physical therapy, specialty practice, pharmacy, wellness/chiro/cryo. (low referral value)
- elder_law: ONLY attorneys whose practice is elder law, estate planning, wills/trusts, probate, guardianship, special-needs planning, or Medicaid planning. A criminal-defense, DUI/DWI, personal-injury, family/divorce, immigration, employment, or general-business attorney is NOT elder_law → classify as "other".
- financial: financial advisor, retirement planner, insurance for seniors.
- senior_resource: senior center, Area Agency on Aging, council on aging, independent-living center, support org.
- faith: church / faith community / ministry.
- other: anything not senior-relevant.

referralValue (value as a source of HOME CARE CLIENTS):
- high: hospital, skilled_nursing, hospice, assisted_living, elder_law, senior_resource
- med: home_health, financial, faith
- low: clinic
- none: home_care (it's a competitor), other

Return ONLY a JSON array, one object per input in the SAME order: [{"i":0,"cat":"...","referralValue":"..."}]. No prose.`;

async function classifyBatch(places) {
  const compact = places.map((p, i) => ({ i, name: p.name, primaryType: p.primaryType, types: (p.types || []).slice(0, 4) }));
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": ANTHROPIC_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: MODEL, max_tokens: 8000, system: CLASSIFY_SYS,
      messages: [{ role: "user", content: JSON.stringify(compact) }],
    }),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message);
  let text = json.content?.[0]?.text || "[]";
  text = text.replace(/^```json?\s*/i, "").replace(/```\s*$/, "").trim();
  const start = text.indexOf("["), end = text.lastIndexOf("]");
  return JSON.parse(text.slice(start, end + 1));
}

const median = (arr) => { if (!arr.length) return null; const s = [...arr].sort((a, b) => a - b); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

(async () => {
  const snap = JSON.parse(readFileSync(IN, "utf8"));
  // Build a single deduped universe of all places (competitors + referralGraph)
  const byId = new Map();
  for (const p of [...snap.competitors, ...snap.referralGraph]) if (p.id && !byId.has(p.id)) byId.set(p.id, p);
  const universe = [...byId.values()];

  // Load classification cache; only classify what we haven't seen
  let cache = {};
  try { cache = JSON.parse(readFileSync(CACHE, "utf8")); } catch {}
  const todo = universe.filter((p) => !cache[p.id]);
  console.log(`${universe.length} places — ${Object.keys(cache).length} cached, classifying ${todo.length} with ${MODEL}…`);
  for (let i = 0; i < todo.length; i += 50) {
    const batch = todo.slice(i, i + 50);
    let labels;
    for (let a = 0; a < 3; a++) {
      try { labels = await classifyBatch(batch); break; }
      catch (e) { console.error(`  batch ${i} attempt ${a}: ${e.message}`); if (a === 2) labels = batch.map((_, j) => ({ i: j, cat: "other", referralValue: "none" })); else await new Promise((r) => setTimeout(r, 2000)); }
    }
    for (const l of labels) { const p = batch[l.i]; if (p) cache[p.id] = { cat: l.cat, referralValue: l.referralValue }; }
    console.log(`  ${Math.min(i + 50, todo.length)}/${todo.length}`);
  }
  if (todo.length) writeFileSync(CACHE, JSON.stringify(cache, null, 2));
  const classified = universe.map((p) => ({ ...p, ...(cache[p.id] || { cat: "other", referralValue: "none" }) }));
  // Deterministic name-guards for the common LLM confusions (high precision, override the model)
  const NAME_RULES = [
    [/\bhospice\b/i, "hospice", "high"],
    [/\bhome health\b/i, "home_health", "med"],
    [/(senior living|assisted living|retirement (community|home)|memory care|personal care home)/i, "assisted_living", "high"],
    // Recover self-identifying estate/elder-law firms that the strict LLM prompt dumped to "other"
    [/(estate planning|elder law|elder-law|wills (and|&) trusts|\bprobate\b|trusts? (and|&) estates?)/i, "elder_law", "high"],
    [/(criminal defense|\bdui\b|\bdwi\b|personal injury|divorce|family law|immigration attorney)/i, "other", "none"],
  ];
  for (const p of classified) for (const [re, cat, rv] of NAME_RULES) if (re.test(p.name || "")) { p.cat = cat; p.referralValue = rv; break; }

  // ---- Competitor landscape (true home_care, local catchment only) ----
  const competitors = classified.filter((p) => p.cat === "home_care" && inCatchment(p)).sort((a, b) => (b.reviews || 0) - (a.reviews || 0));
  const totalReviews = competitors.reduce((s, c) => s + (c.reviews || 0), 0);
  const withReviews = competitors.filter((c) => c.reviews > 0);
  // `ranked` = full ordered competitor list carrying Google's place `id` (the join key for
  // per-provider "You — #N of M" self-overlay at any rank); `leaders` = its first 10. Kept in
  // parity with lib/market-diagnostic/analyze.ts so regenerating a committed snapshot matches
  // the runtime cache shape.
  const ranked = competitors.map((c) => ({
    id: c.id, name: c.name, reviews: c.reviews, rating: c.rating, distanceMiles: c.distanceMiles,
    website: !!c.website, shareOfVoicePct: totalReviews ? +(((c.reviews || 0) / totalReviews) * 100).toFixed(1) : 0,
  }));
  const competitorLandscape = {
    count: competitors.length,
    totalReviewsInMarket: totalReviews,
    medianReviews: median(withReviews.map((c) => c.reviews)),
    medianRating: median(withReviews.map((c) => c.rating).filter(Boolean)),
    withWebsitePct: competitors.length ? Math.round((competitors.filter((c) => c.website).length / competitors.length) * 100) : 0,
    leaders: ranked.slice(0, 10),
    ranked,
  };

  // ---- Referral graph (cleaned + prioritized, local catchment only) ----
  // Role value = strength as a HOME-CARE client referral source (discharge + care-mgmt ecosystem first)
  const ROLE_VALUE = { hospital: 7, skilled_nursing: 6, hospice: 5, assisted_living: 4, elder_law: 3, senior_resource: 3, home_health: 2, financial: 1, faith: 1 };
  let refSources = classified.filter((p) => (p.referralValue === "high" || p.referralValue === "med") && inCatchment(p));
  // Dedup near-duplicate listings (e.g. an ER listed twice) by normalized name prefix
  const seenName = new Set();
  refSources = refSources.filter((r) => { const k = (r.name || "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 22); if (!k || seenName.has(k)) return false; seenName.add(k); return true; });
  const byRole = {};
  for (const r of refSources) (byRole[r.cat] ||= []).push(r);
  // Surface high-value buckets first (not raw count — financial/faith are large but weak)
  const roleSummary = Object.entries(byRole).map(([cat, arr]) => ({ cat, count: arr.length }))
    .sort((a, b) => (ROLE_VALUE[b.cat] || 0) - (ROLE_VALUE[a.cat] || 0) || b.count - a.count);
  // "Start here" list = a DIVERSE call sheet across true discharge / care-mgmt / legal sources.
  // Pick the best few from each category (quality = reviews + proximity), then interleave so the
  // top of the list shows variety — not 12 hospitals. Drop system-only / 0-signal listings.
  const BD_CATS = ["hospital", "skilled_nursing", "hospice", "assisted_living", "elder_law", "senior_resource"];
  const PER_CAT = { hospital: 4, skilled_nursing: 3, hospice: 3, assisted_living: 4, elder_law: 4, senior_resource: 2 };
  const isReal = (r) => (r.reviews > 0 || r.phone) && !/meditech|\(system\)/i.test(r.name || "");
  const picks = BD_CATS.map((cat) => (byRole[cat] || []).filter(isReal)
    .map((r) => ({ ...r, q: Math.min((r.reviews || 0) / 100, 2) - (r.distanceMiles || 30) * 0.05 }))
    .sort((a, b) => b.q - a.q).slice(0, PER_CAT[cat] || 3));
  const bdTargets = [];
  for (let i = 0, more = true; more; i++) { more = false; for (const col of picks) if (col[i]) { bdTargets.push(col[i]); more = true; } }
  const bdTargetsOut = bdTargets.slice(0, 18)
    .map((r) => ({ id: r.id, name: r.name, cat: r.cat, referralValue: r.referralValue, distanceMiles: r.distanceMiles, reviews: r.reviews, rating: r.rating, phone: r.phone, website: r.website, address: r.address, lat: r.lat, lng: r.lng }));

  // ---- Channel prioritization ----
  const channels = [
    { channel: "Reviews / reputation engine", priority: 1, key: "reviews",
      rationale: `The fastest win you control. Market median is ${competitorLandscape.medianReviews} reviews — more reviews means higher Google rank and more trust, starting now.`,
      oleraTool: "Request reviews from your clients" },
    { channel: "Referral relationship development", priority: 2, key: "callsheet",
      rationale: `The biggest lever: half your clients can come from here, and it's the one channel a single agency can't map alone. Your sources are mapped above.`,
      oleraTool: "Your prioritized call sheet" },
    { channel: "Local community + Facebook groups", priority: 3, key: "community",
      rationale: `Families ask for recommendations in local Facebook groups. Most of your competitors aren't there.`,
      oleraTool: "Get the community playbook from Olera" },
    { channel: "Google LSA / SEO / targeted PPC", priority: 4, key: "ads",
      rationale: `Real, but volume-capped in a senior-thin college town. The smart play is Local Services Ads + tight geo — not broad spend.`,
      oleraTool: "Contact the Olera team for ads guidance" },
  ];

  const analysis = {
    meta: snap.meta,
    demand: {
      demographics: snap.demographics?.totals?.population ? snap.demographics : { note: "pending free Census API key (CENSUS_API_KEY) — set it and re-run fetch to populate 65+ population, senior share, median income by ZCTA" },
      olera: snap.oleraDemand,
    },
    competitorLandscape,
    referralGraph: { totalViableSources: refSources.length, byRole: roleSummary, prioritizedTargets: bdTargetsOut },
    channels,
    classificationCounts: CATS.map((c) => ({ cat: c, n: classified.filter((p) => p.cat === c).length })).filter((x) => x.n),
  };
  writeFileSync(OUT, JSON.stringify(analysis, null, 2));

  // ---- readable report ----
  console.log(`\n${"═".repeat(64)}`);
  console.log(`  CLIENT-ACQUISITION DIAGNOSTIC — ${snap.meta.city}, ${snap.meta.state}  (${snap.meta.careType})`);
  console.log("═".repeat(64));
  console.log(`\nDEMAND`);
  const dem = snap.demographics?.totals?.population;
  console.log(`  65+ population (catchment): ${dem ? snap.demographics.totals.seniors65plus.toLocaleString() + ` (${snap.demographics.seniorSharePct}% of ${snap.demographics.totals.population.toLocaleString()})` : "— pending Census key —"}`);
  console.log(`  Olera registered families in city: ${snap.oleraDemand.familiesInCity}   |  providers we list: ${snap.oleraDemand.providersListed}`);
  console.log(`\nCOMPETITORS (home care): ${competitorLandscape.count}   median ${competitorLandscape.medianReviews} reviews / ${competitorLandscape.medianRating}★   ${competitorLandscape.withWebsitePct}% have a website`);
  for (const l of competitorLandscape.leaders) console.log(`  ${String(l.shareOfVoicePct).padStart(4)}% SoV  ${String(l.reviews).padStart(4)} rev  ${String(l.rating ?? "-").padStart(3)}★  ${String(l.distanceMiles ?? "-").padStart(4)}mi  ${l.name}`);
  console.log(`\nREFERRAL GRAPH: ${refSources.length} viable sources`);
  for (const r of roleSummary) console.log(`  ${String(r.count).padStart(3)}  ${r.cat}`);
  console.log(`\nTOP BD TARGETS (prioritized):`);
  for (const t of bdTargets.slice(0, 12)) console.log(`  ${String(t.distanceMiles ?? "-").padStart(4)}mi  ${t.cat.padEnd(16)} ${String(t.reviews).padStart(4)}rev  ${t.name}`);
  console.log(`\nCHANNELS (priority order): ${channels.map((c) => c.channel).join("  ›  ")}`);
  console.log(`\n✓ wrote ${OUT}\n`);
})();
