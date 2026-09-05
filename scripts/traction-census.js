#!/usr/bin/env node

/**
 * Traction census: where does Olera already have marketplace liquidity?
 *
 * Answers three questions from data we already store, with no Google API
 * dependency (growth_page_metrics already carries the per-page Search Console
 * and GA4 evidence the Tuesday collector writes):
 *
 *   1. Top provider pages by search impressions / clicks / organic users
 *      over the trailing window (default 26 weeks).
 *   2. Top cities and states by page attention and by inquiries, joined
 *      through provider slugs, plus per-market provider counts.
 *   3. Concentration: what share of all provider-page attention the top
 *      pages hold, inquiry status mix, and which providers receive repeat
 *      inquiries. Pockets of liquidity, if they exist, show up here.
 *
 * Usage:
 *   node scripts/traction-census.js                  # trailing 26 weeks, top 100
 *   node scripts/traction-census.js --weeks 12       # shorter window
 *   node scripts/traction-census.js --top 200        # deeper page table
 *   node scripts/traction-census.js --json out.json  # also write full JSON
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in
 * .env.local (same as scripts/growth-pull.js). Read-only.
 */

require("dotenv").config({ path: ".env.local" });
const fs = require("fs");
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}
const db = createClient(SUPABASE_URL, SERVICE_KEY);

function arg(name, fallback) {
  const idx = process.argv.findIndex((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  if (idx === -1) return fallback;
  const raw = process.argv[idx].includes("=") ? process.argv[idx].split("=")[1] : process.argv[idx + 1];
  return raw ?? fallback;
}
const WEEKS = parseInt(arg("weeks", "26"), 10);
const TOP = parseInt(arg("top", "100"), 10);
const JSON_OUT = arg("json", null);

async function pageAll(query, pageSize = 1000) {
  const rows = [];
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await query.range(offset, offset + pageSize - 1);
    if (error) throw new Error(error.message);
    rows.push(...(data || []));
    if (!data || data.length < pageSize) return rows;
  }
}

function slugFromPath(path) {
  const m = /^\/provider\/([^/?#]+)/.exec(path || "");
  return m ? decodeURIComponent(m[1]) : null;
}

const GEO_CANDIDATES = ["city", "state", "county", "zip", "zip_code", "address_city", "address_state", "provider_city", "provider_state", "location_city", "location_state"];

async function detectColumns(table) {
  const { data, error } = await db.from(table).select("*").limit(1);
  if (error) throw new Error(`${table}: ${error.message}`);
  return data && data[0] ? Object.keys(data[0]) : [];
}

function pick(row, names) {
  for (const n of names) if (row[n] != null && row[n] !== "") return row[n];
  return null;
}

async function main() {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - WEEKS * 7);
  const sinceIso = since.toISOString().slice(0, 10);

  // ---- 1. Provider-page metrics over the window --------------------------
  const pageRows = await pageAll(
    db
      .from("growth_page_metrics")
      .select("week_start, page_path, page_category, organic_users, search_clicks, search_impressions, search_position")
      .eq("page_category", "provider")
      .gte("week_start", sinceIso)
      .order("week_start", { ascending: true })
      .order("page_path", { ascending: true }),
  );

  const byPage = new Map();
  for (const r of pageRows) {
    const key = r.page_path;
    const agg = byPage.get(key) || { page_path: key, slug: slugFromPath(key), impressions: 0, clicks: 0, organic_users: 0, weeks: 0, positions: [] };
    agg.impressions += Number(r.search_impressions) || 0;
    agg.clicks += Number(r.search_clicks) || 0;
    agg.organic_users += Number(r.organic_users) || 0;
    agg.weeks += 1;
    if (r.search_position != null) agg.positions.push(Number(r.search_position));
    byPage.set(key, agg);
  }
  const pages = [...byPage.values()].map((p) => ({
    ...p,
    avg_position: p.positions.length ? +(p.positions.reduce((a, b) => a + b, 0) / p.positions.length).toFixed(1) : null,
    positions: undefined,
  }));
  pages.sort((a, b) => b.impressions - a.impressions || b.clicks - a.clicks);
  const topPages = pages.slice(0, TOP);

  // ---- 2. Geography join via slugs ---------------------------------------
  const opCols = await detectColumns("olera-providers");
  const bpCols = await detectColumns("business_profiles");
  const opGeo = GEO_CANDIDATES.filter((c) => opCols.includes(c));
  const bpGeo = GEO_CANDIDATES.filter((c) => bpCols.includes(c));

  const slugSet = [...new Set(pages.map((p) => p.slug).filter(Boolean))];
  const slugGeo = new Map();
  const chunk = 200;
  for (let i = 0; i < slugSet.length; i += chunk) {
    const slice = slugSet.slice(i, i + chunk);
    if (opCols.includes("slug")) {
      const { data } = await db.from("olera-providers").select(["slug", "provider_name", "name", ...opGeo].filter((c) => opCols.includes(c)).join(",")).in("slug", slice);
      for (const row of data || []) slugGeo.set(row.slug, { name: pick(row, ["provider_name", "name"]), city: pick(row, ["city", "address_city", "provider_city", "location_city"]), state: pick(row, ["state", "address_state", "provider_state", "location_state"]), county: pick(row, ["county"]) });
    }
    if (bpCols.includes("slug")) {
      const { data } = await db.from("business_profiles").select(["slug", "display_name", ...bpGeo].filter((c) => bpCols.includes(c)).join(",")).in("slug", slice);
      for (const row of data || []) if (!slugGeo.has(row.slug)) slugGeo.set(row.slug, { name: row.display_name, city: pick(row, ["city", "address_city", "location_city"]), state: pick(row, ["state", "address_state", "location_state"]), county: pick(row, ["county"]) });
    }
  }
  for (const p of topPages) Object.assign(p, slugGeo.get(p.slug) || {});

  const byMarket = new Map();
  for (const p of pages) {
    const geo = slugGeo.get(p.slug);
    if (!geo || !geo.city) continue;
    const key = `${geo.city}, ${geo.state || "?"}`;
    const m = byMarket.get(key) || { market: key, impressions: 0, clicks: 0, organic_users: 0, pages: 0 };
    m.impressions += p.impressions; m.clicks += p.clicks; m.organic_users += p.organic_users; m.pages += 1;
    byMarket.set(key, m);
  }

  // ---- 3. Inquiries over trailing 180 days --------------------------------
  const inqSince = new Date(); inqSince.setUTCDate(inqSince.getUTCDate() - 180);
  const inquiries = await pageAll(
    db
      .from("connections")
      .select("id, to_profile_id, status, created_at")
      .eq("type", "inquiry")
      .gte("created_at", inqSince.toISOString())
      .order("created_at", { ascending: true }),
  );
  const byProvider = new Map();
  const byStatus = new Map();
  for (const q of inquiries) {
    byProvider.set(q.to_profile_id, (byProvider.get(q.to_profile_id) || 0) + 1);
    byStatus.set(q.status || "null", (byStatus.get(q.status || "null") || 0) + 1);
  }
  const topInquiryProviders = [...byProvider.entries()].sort((a, b) => b[1] - a[1]).slice(0, 40);
  const bpIds = topInquiryProviders.map(([id]) => id);
  const inquiryProviderInfo = new Map();
  for (let i = 0; i < bpIds.length; i += chunk) {
    const { data } = await db.from("business_profiles").select(["id", "display_name", "slug", ...bpGeo].filter((c) => ["id", "display_name", "slug"].includes(c) || bpCols.includes(c)).join(",")).in("id", bpIds.slice(i, i + chunk));
    for (const row of data || []) inquiryProviderInfo.set(row.id, row);
  }
  const inquiryMarkets = new Map();
  for (const [id, n] of byProvider.entries()) {
    const info = inquiryProviderInfo.get(id);
    const city = info ? pick(info, ["city", "address_city", "location_city"]) : null;
    if (!city) continue;
    const key = `${city}, ${pick(info, ["state", "address_state", "location_state"]) || "?"}`;
    inquiryMarkets.set(key, (inquiryMarkets.get(key) || 0) + n);
  }

  // ---- 4. Concentration statistics ----------------------------------------
  const totImp = pages.reduce((a, p) => a + p.impressions, 0);
  const totClicks = pages.reduce((a, p) => a + p.clicks, 0);
  const share = (k) => totImp ? +(pages.slice(0, k).reduce((a, p) => a + p.impressions, 0) / totImp * 100).toFixed(1) : 0;
  const repeat = [...byProvider.values()];
  const summary = {
    window_weeks: WEEKS,
    provider_pages_with_material_traffic: pages.length,
    total_provider_impressions: totImp,
    total_provider_clicks: totClicks,
    impressions_share_top10_pages_pct: share(10),
    impressions_share_top50_pages_pct: share(50),
    impressions_share_top100_pages_pct: share(100),
    inquiries_180d: inquiries.length,
    inquiry_status_mix: Object.fromEntries(byStatus),
    providers_with_any_inquiry_180d: byProvider.size,
    providers_with_3plus_inquiries_180d: repeat.filter((n) => n >= 3).length,
    geo_columns_detected: { "olera-providers": opGeo, business_profiles: bpGeo },
  };

  const out = {
    summary,
    top_pages: topPages,
    top_markets_by_attention: [...byMarket.values()].sort((a, b) => b.impressions - a.impressions).slice(0, 25),
    top_markets_by_inquiries: [...inquiryMarkets.entries()].map(([market, inquiries]) => ({ market, inquiries })).sort((a, b) => b.inquiries - a.inquiries).slice(0, 25),
    top_providers_by_inquiries: topInquiryProviders.map(([id, n]) => ({ id, inquiries_180d: n, name: inquiryProviderInfo.get(id)?.display_name || null, city: inquiryProviderInfo.get(id) ? pick(inquiryProviderInfo.get(id), ["city", "address_city", "location_city"]) : null })),
  };

  console.log("\n=== TRACTION CENSUS SUMMARY ===");
  console.table([summary]);
  console.log(`\n=== TOP ${Math.min(25, topPages.length)} PROVIDER PAGES (of top ${TOP} computed) ===`);
  console.table(topPages.slice(0, 25).map((p) => ({ page: p.slug, name: p.name || "?", market: p.city ? `${p.city}, ${p.state || "?"}` : "?", impressions: p.impressions, clicks: p.clicks, users: p.organic_users, pos: p.avg_position })));
  console.log("\n=== TOP MARKETS BY PAGE ATTENTION ===");
  console.table(out.top_markets_by_attention.slice(0, 10));
  console.log("\n=== TOP MARKETS BY INQUIRIES (180d) ===");
  console.table(out.top_markets_by_inquiries.slice(0, 10));

  if (JSON_OUT) {
    fs.writeFileSync(JSON_OUT, JSON.stringify(out, null, 2));
    console.log(`\nFull census written to ${JSON_OUT}`);
  }
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
