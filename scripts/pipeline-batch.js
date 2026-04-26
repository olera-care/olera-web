#!/usr/bin/env node
/**
 * Olera City Expansion Pipeline — Batch Processor
 *
 * Processes post-discovery pipeline steps for multiple cities:
 *   node pipeline-batch.js --batch expansion-dir/ --phase all
 *
 * Phases:
 *   clean   — Keyword filter, AI classify, category map, name check, IDs, dedup
 *   load    — Upload to Supabase, geocode, out-of-area cleanup
 *   enrich  — Descriptions, reviews, trust signals, images (parallel streams)
 *   finalize — Notion updates, final report
 *   all     — Run clean → load → enrich → finalize
 */

'use strict';

// ---------------------------------------------------------------------------
// Dependencies
// ---------------------------------------------------------------------------

// Ensure node_modules resolve from main olera-web repo (worktrees lack node_modules)
const MAIN_REPO = require('path').resolve(process.env.HOME, 'Desktop/olera-web');
module.paths.unshift(require('path').join(MAIN_REPO, 'node_modules'));

// Load .env.local — try repo root first, then main olera-web dir
const envPaths = [
  require('path').resolve(__dirname, '..', '.env.local'),
  require('path').resolve(MAIN_REPO, '.env.local'),
];
for (const p of envPaths) {
  if (require('fs').existsSync(p)) {
    require('dotenv').config({ path: p });
    break;
  }
}

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const csvParse = require('csv-parse/sync');

// ---------------------------------------------------------------------------
// CLI Parsing
// ---------------------------------------------------------------------------

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    batch: null,        // path to expansion dir or .md file
    phase: 'all',       // clean | load | enrich | finalize | all
    expansionDir: path.resolve(process.env.HOME, 'Desktop/TJ-hq/Olera/Provider Database/Expansion'),
    dedupCsv: null, // deprecated: now queries Supabase live instead of stale CSV
    resume: false,
    force: false,       // bypass providers_ready.json cache + "already in DB" skip guards (reprocess mode)
    citiesFilter: null, // explicit city allowlist for reprocess mode (e.g. "Bourne,MA;Nanuet,NY")
    dryRun: false,
    concurrency: 5,
    watch: false,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--batch':       opts.batch = args[++i]; break;
      case '--phase':       opts.phase = args[++i]; break;
      case '--expansion-dir': opts.expansionDir = args[++i]; break;
      case '--dedup-csv':   opts.dedupCsv = args[++i]; break;
      case '--resume':      opts.resume = true; break;
      case '--force':       opts.force = true; break;
      case '--cities':      opts.citiesFilter = args[++i]; break;
      case '--dry-run':     opts.dryRun = true; break;
      case '--concurrency': opts.concurrency = parseInt(args[++i]) || 5; break;
      case '--watch':       opts.watch = true; break;
      case '--help': case '-h': opts.help = true; break;
    }
  }

  return opts;
}

function printUsage() {
  console.log(`
Olera City Pipeline — Batch Processor

Usage:
  node pipeline-batch.js --batch <dir-or-md> [--phase <phase>] [options]

Required:
  --batch <path>        Expansion directory with per-city discovery CSVs,
                        OR a .md batch file (will look for CSVs in --expansion-dir)

Options:
  --phase <phase>       Phase to run: clean | load | enrich | finalize | all (default: all)
  --expansion-dir <dir> Base expansion directory (default: ~/Desktop/TJ-hq/.../Expansion)
  --dedup-csv <path>    Path to full provider export CSV for dedup
  --resume              Skip cities already marked Complete in Notion
  --force               Bypass providers_ready.json cache + "already in DB" skip guards.
                        Required for reprocess mode. Use with --cities to scope safely.
  --cities <list>       Explicit city allowlist, semicolon-delimited: "City1,ST;City2,ST".
                        Filters the --batch city list down to just these. Use with --force
                        for reprocess mode so you don't reprocess the entire Expansion dir.
  --dry-run             Print what would happen without executing
  --concurrency <n>     Max parallel API calls per service (default: 5)
  --watch               Stream clean phase: wait up to 90m for each city's discovery CSV to appear (overlaps discovery+clean)
  -h, --help            Show this help

Examples:
  # Run full pipeline on all cities in expansion dir:
  node pipeline-batch.js --batch ~/Desktop/TJ-hq/.../Expansion --phase all

  # Run only enrichment:
  node pipeline-batch.js --batch ~/Desktop/TJ-hq/.../Expansion --phase enrich

  # Resume after interruption:
  node pipeline-batch.js --batch ~/Desktop/TJ-hq/.../Expansion --phase all --resume
`);
}

// ---------------------------------------------------------------------------
// Configuration & Constants
// ---------------------------------------------------------------------------

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
// Notion token: set NOTION_TOKEN env var, or the script will skip Notion updates
// (Claude Code uses MCP for Notion, so this is only needed for standalone runs)
const NOTION_TOKEN = process.env.NOTION_API_KEY || process.env.NOTION_TOKEN;

const NOTION_DB_ID = '4cf471e5-0d7e-43a5-a793-a87410e2ae24';

const CATEGORY_MAP = {
  'assisted_living': 'Assisted Living',
  'memory_care': 'Memory Care',
  'nursing_home': 'Nursing Home',
  'home_health_care': 'Home Health Care',
  'home_care_non_medical': 'Home Care (Non-medical)',
  'independent_living': 'Independent Living',
  'home_care': 'Home Health Care',
};

const NON_CMS_CATEGORIES = ['Assisted Living', 'Memory Care', 'Home Care (Non-medical)', 'Independent Living'];

const KEYWORD_BLOCKLIST = [
  'pharmacy', 'hospital', 'pediatric', 'veterinary', 'dental', 'optometrist',
  'chiropractor', 'urgent care', 'physical therapy', 'dialysis', 'medical supply',
  'staffing agency', 'storage', 'plumbing', 'construction', 'insurance',
  'real estate', 'auto', 'restaurant', 'grocery', 'hardware',
];

const DESC_TEMPLATES = {
  'Assisted Living': { article: 'an', desc: 'assisted living community offering personal care support and daily living assistance' },
  'Memory Care': { article: 'a', desc: 'memory care community providing specialized support for individuals with Alzheimer\'s and dementia' },
  'Nursing Home': { article: 'a', desc: 'skilled nursing facility providing 24-hour medical care and rehabilitation services' },
  'Home Health Care': { article: 'a', desc: 'home health care agency delivering skilled nursing and therapeutic services in the comfort of home' },
  'Home Care (Non-medical)': { article: 'a', desc: 'non-medical home care provider offering companionship, personal care, and daily living support' },
  'Independent Living': { article: 'an', desc: 'independent living community designed for active seniors seeking a maintenance-free lifestyle' },
};

// State bounding boxes [minLat, maxLat, minLon, maxLon]
const STATE_BOUNDS = {
  AL: [30.2, 35.0, -88.5, -84.9], AK: [51.2, 71.4, -179.1, -129.9],
  AZ: [31.3, 37.0, -114.8, -109.0], AR: [33.0, 36.5, -94.6, -89.6],
  CA: [32.5, 42.0, -124.4, -114.1], CO: [37.0, 41.0, -109.1, -102.0],
  CT: [41.0, 42.1, -73.7, -71.8], DE: [38.5, 39.8, -75.8, -75.0],
  FL: [24.5, 31.0, -87.6, -80.0], GA: [30.4, 35.0, -85.6, -80.8],
  HI: [18.9, 22.2, -160.2, -154.8], ID: [42.0, 49.0, -117.2, -111.0],
  IL: [37.0, 42.5, -91.5, -87.0], IN: [37.8, 41.8, -88.1, -84.8],
  IA: [40.4, 43.5, -96.6, -90.1], KS: [37.0, 40.0, -102.1, -94.6],
  KY: [36.5, 39.1, -89.6, -82.0], LA: [29.0, 33.0, -94.0, -89.0],
  ME: [43.1, 47.5, -71.1, -67.0], MD: [37.9, 39.7, -79.5, -75.0],
  MA: [41.2, 42.9, -73.5, -69.9], MI: [41.7, 48.3, -90.4, -82.4],
  MN: [43.5, 49.4, -97.2, -89.5], MS: [30.2, 35.0, -91.7, -88.1],
  MO: [36.0, 40.6, -95.8, -89.1], MT: [44.4, 49.0, -116.0, -104.0],
  NE: [40.0, 43.0, -104.1, -95.3], NV: [35.0, 42.0, -120.0, -114.0],
  NH: [42.7, 45.3, -72.6, -70.7], NJ: [38.9, 41.4, -75.6, -73.9],
  NM: [31.3, 37.0, -109.1, -103.0], NY: [40.5, 45.0, -79.8, -71.9],
  NC: [33.8, 36.6, -84.3, -75.5], ND: [45.9, 49.0, -104.0, -96.6],
  OH: [38.4, 42.0, -84.8, -80.5], OK: [33.6, 37.0, -103.0, -94.4],
  OR: [42.0, 46.3, -124.6, -116.5], PA: [39.7, 42.3, -80.5, -74.7],
  RI: [41.1, 42.0, -71.9, -71.1], SC: [32.0, 35.2, -83.4, -78.5],
  SD: [42.5, 45.9, -104.1, -96.4], TN: [35.0, 36.7, -90.3, -81.6],
  TX: [25.8, 36.5, -106.6, -93.5], UT: [37.0, 42.0, -114.1, -109.0],
  VT: [42.7, 45.0, -73.4, -71.5], VA: [36.5, 39.5, -83.7, -75.2],
  WA: [45.5, 49.0, -124.8, -116.9], WV: [37.2, 40.6, -82.6, -77.7],
  WI: [42.5, 47.1, -92.9, -86.8], WY: [41.0, 45.0, -111.1, -104.1],
  DC: [38.8, 39.0, -77.1, -76.9],
};

// Full state name lookup (for geocoding — use full name to avoid cross-state matches)
const STATE_NAMES = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
  HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
  KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi',
  MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire',
  NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York', NC: 'North Carolina',
  ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania',
  RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee',
  TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia', WA: 'Washington',
  WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming', DC: 'District of Columbia',
};

// ---------------------------------------------------------------------------
// Clients
// ---------------------------------------------------------------------------

let supabase;

function initClients() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('ERROR: Missing SUPABASE env vars. Run: cd ~/Desktop/olera-web && npx vercel env pull .env.local');
    process.exit(1);
  }
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
}

// ---------------------------------------------------------------------------
// Rate Limiter
// ---------------------------------------------------------------------------

class RateLimiter {
  constructor(minDelayMs = 200) {
    this.minDelay = minDelayMs;
    this.lastCall = 0;
  }

  async wait() {
    const now = Date.now();
    const elapsed = now - this.lastCall;
    if (elapsed < this.minDelay) {
      await new Promise(r => setTimeout(r, this.minDelay - elapsed));
    }
    this.lastCall = Date.now();
  }
}

const rateLimiters = {
  google: new RateLimiter(100),
  perplexity: new RateLimiter(300),
  notion: new RateLimiter(350),  // Notion rate limit: 3 req/sec
};

// ---------------------------------------------------------------------------
// Cost Tracker
// ---------------------------------------------------------------------------

class CostTracker {
  constructor() {
    this.google = 0;      // Google Places/Geocoding calls
    this.perplexity = 0;  // Perplexity calls
    this.startTime = Date.now();
  }

  addGoogle(n = 1) { this.google += n; }
  addPerplexity(n = 1) { this.perplexity += n; }

  get cost() {
    return (this.google * 32) / 1000 + this.perplexity * 0.005;
  }

  get elapsed() {
    return (Date.now() - this.startTime) / 1000;
  }

  summary() {
    return `$${this.cost.toFixed(2)} (${this.google} Google, ${this.perplexity} Perplexity, ${formatDuration(this.elapsed)})`;
  }
}

const cost = new CostTracker();

// ---------------------------------------------------------------------------
// Notion API Helper (direct REST, no MCP)
// ---------------------------------------------------------------------------

async function notionRequest(method, endpoint, body = null) {
  await rateLimiters.notion.wait();
  const url = `https://api.notion.com/v1${endpoint}`;
  const opts = {
    method,
    headers: {
      'Authorization': `Bearer ${NOTION_TOKEN}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28',
    },
  };
  if (body) opts.body = JSON.stringify(body);

  const resp = await fetch(url, opts);
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Notion ${method} ${endpoint}: ${resp.status} ${text.slice(0, 200)}`);
  }
  return resp.json();
}

async function notionQueryCities(filter) {
  return notionRequest('POST', `/databases/${NOTION_DB_ID}/query`, { filter, page_size: 100 });
}

async function notionCreatePage(title, state) {
  return notionRequest('POST', '/pages', {
    parent: { database_id: NOTION_DB_ID },
    properties: {
      'City Name': { title: [{ text: { content: title } }] },
      'State': { select: { name: state } },
      'City Status': { status: { name: 'Planning' } },
    },
  });
}

async function notionUpdatePage(pageId, properties) {
  return notionRequest('PATCH', `/pages/${pageId}`, { properties });
}

async function notionCompletePage(pageId) {
  const checkboxes = [
    'Done: Discovery', 'Done: Verify if Senior Care Business',
    'Done: Check Business Status (Open/Closed)', 'Done: Verify Category',
    'Done: Check Provider Category Spelling & Capitalization',
    'Done: Name Check (Remove "LLC" or "Inc" from provider names)',
    'Done: Add Provider ID', 'Done: Upload to Supabase',
    'Done: Rich Description', 'Done: Hydrate Google Reviews Data',
    'Done: Verify Trust Signals (Non-CMS)',
    'Done: Ensure Review Snippets Are Active',
    'Done: Fetch Unique Images', 'Done: Fetch Email & Contact Info',
    'Done: Add Score',
  ];
  const props = { 'City Status': { status: { name: 'Complete' } } };
  for (const cb of checkboxes) {
    props[cb] = { checkbox: true };
  }
  return notionUpdatePage(pageId, props);
}

// ---------------------------------------------------------------------------
// Perplexity API Helper
// ---------------------------------------------------------------------------

async function perplexityChat(prompt, temperature = 0.1) {
  // Retry with exponential backoff on 429 (rate limit) and 5xx (server overload, incl. 529).
  // Prior batch runs lost ~85% of providers to transient 429s with no retry — this is the
  // long-pole fragility at scale. Up to 5 attempts, backoff 2s → 4s → 8s → 16s → 32s.
  const MAX_ATTEMPTS = 5;
  let lastErr;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    await rateLimiters.perplexity.wait();

    let resp;
    try {
      resp = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'sonar',
          messages: [{ role: 'user', content: prompt }],
          temperature,
        }),
      });
    } catch (err) {
      lastErr = err;
      if (attempt === MAX_ATTEMPTS) throw err;
      const delay = 2000 * Math.pow(2, attempt - 1);
      console.log(`  [perplexity retry ${attempt}/${MAX_ATTEMPTS}] network error (${err.message}), waiting ${delay}ms...`);
      await new Promise(r => setTimeout(r, delay));
      continue;
    }

    if (resp.ok) {
      // Only charge cost on success so retries don't double-count.
      cost.addPerplexity();
      const json = await resp.json();
      return json.choices?.[0]?.message?.content || '';
    }

    // Retry on 429 (rate limit) and 5xx (server overload). Fail fast on 4xx client errors.
    const shouldRetry = resp.status === 429 || (resp.status >= 500 && resp.status < 600);
    const text = await resp.text();
    lastErr = new Error(`Perplexity: ${resp.status} ${text.slice(0, 200)}`);
    if (!shouldRetry || attempt === MAX_ATTEMPTS) throw lastErr;

    const delay = 2000 * Math.pow(2, attempt - 1);
    console.log(`  [perplexity retry ${attempt}/${MAX_ATTEMPTS}] ${resp.status} — waiting ${delay}ms...`);
    await new Promise(r => setTimeout(r, delay));
  }
  throw lastErr;
}

function extractJson(text) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try { return JSON.parse(match[0]); } catch { return null; }
}

// ---------------------------------------------------------------------------
// Google APIs Helper
// ---------------------------------------------------------------------------

async function fetchWithRetry(url, opts = {}, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fetch(url, opts);
    } catch (err) {
      if (i === retries - 1) throw err;
      const delay = 2000 * (i + 1);
      console.log(`  [retry ${i + 1}/${retries}] fetch failed (${err.cause?.code || err.message}), waiting ${delay}ms...`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

async function googleGeocode(address) {
  await rateLimiters.google.wait();
  cost.addGoogle();

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_API_KEY}`;
  const resp = await fetchWithRetry(url);
  const json = await resp.json();
  if (json.results?.[0]) {
    const loc = json.results[0].geometry.location;
    return { lat: loc.lat, lon: loc.lng };
  }
  return null;
}

async function googlePlacesField(placeId, fields) {
  await rateLimiters.google.wait();
  cost.addGoogle();

  const url = `https://places.googleapis.com/v1/places/${placeId}?fields=${fields}&key=${GOOGLE_API_KEY}`;
  const resp = await fetchWithRetry(url);
  if (!resp.ok) return null;
  return resp.json();
}

async function googlePhotoUri(photoName) {
  await rateLimiters.google.wait();
  cost.addGoogle();

  const url = `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=800&key=${GOOGLE_API_KEY}&skipHttpRedirect=true`;
  const resp = await fetchWithRetry(url);
  if (!resp.ok) return null;
  const json = await resp.json();
  return json.photoUri || null;
}

// ---------------------------------------------------------------------------
// Utility Functions
// ---------------------------------------------------------------------------

function formatDuration(seconds) {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${(seconds / 60).toFixed(1)}m`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h${m}m`;
}

function slug(name, city, state) {
  return (name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')
    + '-' + city.toLowerCase().replace(/\s+/g, '-')
    + '-' + state.toLowerCase()
  ).replace(/--+/g, '-');
}

function discoveryCsvForCity(expansionDir, city, state) {
  const slug = `${city}-${state}`.replace(/\s+/g, '-');
  // Try multiple folder name variants (spaces→hyphens, with/without periods)
  const variants = [slug, slug.replace(/\./g, '')];
  for (const v of variants) {
    const cityDir = path.join(expansionDir, v);
    if (!fs.existsSync(cityDir)) continue;
    const csvs = fs.readdirSync(cityDir).filter(f => f.startsWith('providers_discovered_') && f.endsWith('.csv'));
    if (csvs.length === 0) continue;
    csvs.sort();
    return path.join(cityDir, csvs[csvs.length - 1]); // latest
  }
  return null;
}

function readyCityList(expansionDir) {
  // Find all city dirs that have a discovery CSV
  if (!fs.existsSync(expansionDir)) return [];
  return fs.readdirSync(expansionDir)
    .filter(d => {
      const parts = d.split('-');
      return parts.length >= 2 && fs.statSync(path.join(expansionDir, d)).isDirectory();
    })
    .map(d => {
      const lastDash = d.lastIndexOf('-');
      const city = d.slice(0, lastDash);
      const state = d.slice(lastDash + 1);
      const csv = discoveryCsvForCity(expansionDir, city, state);
      return { city, state, dir: d, csvPath: csv };
    })
    .filter(c => c.csvPath);
}

function parseBatchMd(mdPath) {
  const content = fs.readFileSync(mdPath, 'utf-8');
  const match = content.match(/```(?:batch-cities)?\s*\n([\s\S]*?)```/);
  const mrIdx = content.indexOf('Machine-Readable');
  const block = match ? match[1] : mrIdx >= 0 ? content.slice(mrIdx) : content;
  return block.trim().split('\n')
    .filter(l => l.trim() && !l.startsWith('City') && !l.startsWith('#') && !l.startsWith('|'))
    .map(l => {
      const [city, state] = l.split(',').map(s => s.trim());
      return city && state ? { city, state: state.toUpperCase() } : null;
    })
    .filter(Boolean);
}

// ---------------------------------------------------------------------------
// Phase Stubs (implemented in subsequent tasks)
// ---------------------------------------------------------------------------

async function phaseClean(cities, opts) {
  console.log(`\n${'='.repeat(70)}`);
  console.log('PHASE 2: CLEAN & PREPARE');
  console.log(`${'='.repeat(70)}`);
  console.log(`  Cities: ${cities.length}`);

  // Step 1: Load dedup sets ONCE — live from Supabase (not stale CSV)
  console.log(`\n  Loading dedup data from Supabase (live)...`);
  const dedupNameSet = new Set();    // name|state for name-based dedup
  const dedupPlaceSet = new Set();   // place_id for exact-match dedup
  let offset = 0;
  const PAGE = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('olera-providers')
      .select('provider_name, state, place_id')
      .eq('deleted', false)
      .range(offset, offset + PAGE - 1);
    if (error || !data || data.length === 0) break;
    for (const row of data) {
      if (row.provider_name && row.state) {
        dedupNameSet.add(row.provider_name.trim().toLowerCase() + '|' + row.state.trim().toUpperCase());
      }
      if (row.place_id) {
        dedupPlaceSet.add(row.place_id);
      }
    }
    offset += data.length;
    if (data.length < PAGE) break;
  }
  console.log(`  Dedup sets loaded: ${dedupNameSet.size} names, ${dedupPlaceSet.size} place_ids (live from Supabase)`);

  // Step 2: Process cities
  // Pooled classify (non-watch mode) vs per-city streaming (watch mode)
  if (opts.watch) {
    // --- WATCH MODE: per-city streaming, old behavior, waits for CSVs to appear ---
    for (let i = 0; i < cities.length; i++) {
      const c = cities[i];
      let csvPath = c.csvPath || discoveryCsvForCity(opts.expansionDir, c.city, c.state);

      if (!csvPath) {
        // Wait up to 90 minutes for CSV to appear (poll every 5s)
        console.log(`  [${i + 1}/${cities.length}] ${c.city}, ${c.state} — waiting for discovery CSV (watch mode)...`);
        const maxWaitMs = 90 * 60 * 1000;
        const pollMs = 5000;
        const start = Date.now();
        while (Date.now() - start < maxWaitMs) {
          await new Promise(r => setTimeout(r, pollMs));
          csvPath = discoveryCsvForCity(opts.expansionDir, c.city, c.state);
          if (csvPath) break;
        }
        if (!csvPath) {
          console.log(`  [${i + 1}/${cities.length}] ${c.city}, ${c.state} — SKIP (no CSV after 90m watch)`);
          c._skippedInClean = true;
          continue;
        }
        c.csvPath = csvPath;
        console.log(`    CSV arrived: ${path.basename(csvPath)}`);
      }

      await cleanCityPerCity(c, i, cities.length, csvPath, opts, dedupNameSet, dedupPlaceSet);
    }
  } else {
    // --- POOLED MODE: global keyword filter → global AI classify → per-city finalize ---
    const cityData = []; // { c, i, csvPath, discovered, afterKeyword, afterAI, providers }

    // Pass 1: per-city keyword filter; collect into global pool
    console.log(`\n  Pass 1/3: keyword filter (per city)...`);
    for (let i = 0; i < cities.length; i++) {
      const c = cities[i];
      const csvPath = c.csvPath || discoveryCsvForCity(opts.expansionDir, c.city, c.state);
      if (!csvPath) {
        console.log(`  [${i + 1}/${cities.length}] ${c.city}, ${c.state} — SKIP (no discovery CSV)`);
        continue;
      }
      const readyPath = path.join(opts.expansionDir, `${c.city}-${c.state}`, 'providers_ready.json');
      if (fs.existsSync(readyPath) && !opts.force) {
        const existing = JSON.parse(fs.readFileSync(readyPath, 'utf-8'));
        console.log(`  [${i + 1}/${cities.length}] ${c.city}, ${c.state} — SKIP (already cleaned: ${existing.length} providers)`);
        continue;
      }
      const raw = fs.readFileSync(csvPath);
      let providers = csvParse.parse(raw, { columns: true, relax_column_count: true, relax_quotes: true });
      const discovered = providers.length;
      providers = providers.filter(row => {
        const name = (row.provider_name || '').toLowerCase();
        const cat = (row.provider_category || '').toLowerCase();
        const types = (row.types || '').toLowerCase();
        const combined = name + ' ' + cat + ' ' + types;
        if (KEYWORD_BLOCKLIST.some(kw => combined.includes(kw))) return false;
        if ((row.business_status || '').includes('CLOSED')) return false;
        return true;
      });
      const afterKeyword = providers.length;
      console.log(`  [${i + 1}/${cities.length}] ${c.city}, ${c.state} — discovered:${discovered} → kw:${afterKeyword}`);
      cityData.push({ c, i, csvPath, discovered, afterKeyword, afterAI: afterKeyword, providers });
    }

    // Pass 2: global AI classify in batches of 80
    const globalPool = [];
    for (const cd of cityData) {
      for (const p of cd.providers) globalPool.push({ p, cd });
    }
    console.log(`\n  Pass 2/3: global AI classify (${globalPool.length} providers, batches of 80)...`);

    if (PERPLEXITY_API_KEY && globalPool.length > 0) {
      const BATCH = 80;
      const keepSet = new WeakSet(); // providers to keep

      for (let b = 0; b < globalPool.length; b += BATCH) {
        const batch = globalPool.slice(b, b + BATCH);
        const list = batch.map((entry, j) =>
          `${j + 1}. "${entry.p.provider_name}" — category: ${entry.p.provider_category}, address: ${entry.p.address || 'unknown'} (${entry.cd.c.city}, ${entry.cd.c.state})`
        ).join('\n');

        const prompt = `For each business below, determine if its PRIMARY BUSINESS is providing senior care.

Answer YES only if the entity is one of these:
- Residential senior living facility (assisted living, memory care, nursing home, independent living)
- In-home care agency (home health, non-medical home care, hospice)
- Dedicated senior care program (adult day care, geriatric care management)

Answer NO if the entity is:
- A place seniors might USE but that is not a care provider (community centers, recreation facilities, YMCAs)
- General medical (family medicine, urgent care, VA clinics, hospitals, rehab clinics)
- Mental health / therapy only (counselors, psychologists, behavioral health)
- A DME supplier, medical supply store, or equipment rental company
- Retail, food service, construction, IT, storage, or any non-care business
- Nonprofit / community service that serves the general public
- Funeral homes, universities, churches, government agencies
- Wedding venues, event spaces, banquet halls
- General apartment complexes (not senior-specific independent living)

Businesses:
${list}

Return JSON: {"results": [{"num": 1, "is_senior_care": true, "reason": "brief reason"}]}`;

        try {
          const content = await perplexityChat(prompt);
          const match = content.match(/\{[\s\S]*"results"[\s\S]*\}/);
          if (match) {
            const parsed = JSON.parse(match[0]);
            const results = parsed.results || [];
            const resultNums = new Set();
            for (const r of results) {
              const idx = (r.num || 0) - 1;
              if (idx >= 0 && idx < batch.length) {
                resultNums.add(r.num);
                if (r.is_senior_care) keepSet.add(batch[idx].p);
              }
            }
            // Unreturned entries: keep to be safe
            for (let j = 0; j < batch.length; j++) {
              if (!resultNums.has(j + 1)) keepSet.add(batch[j].p);
            }
          } else {
            for (const entry of batch) keepSet.add(entry.p);
          }
        } catch (e) {
          console.log(`    AI batch error: ${e.message} — keeping batch`);
          for (const entry of batch) keepSet.add(entry.p);
        }
        process.stdout.write(`    Classified ${Math.min(b + BATCH, globalPool.length)}/${globalPool.length}\r`);
      }
      console.log('');

      // Split classification back per-city
      for (const cd of cityData) {
        cd.providers = cd.providers.filter(p => keepSet.has(p));
        cd.afterAI = cd.providers.length;
      }
    }

    // Pass 3: per-city finalize (category map + name clean + dedup + IDs + write JSON)
    console.log(`\n  Pass 3/3: per-city finalize...`);
    for (const cd of cityData) {
      await finalizeCityClean(cd, opts, dedupNameSet, dedupPlaceSet);
    }
  }

  console.log(`\n  Clean phase complete. Cost so far: ${cost.summary()}`);
}

// Helper: run the full per-city clean pipeline for a single city (watch mode path).
async function cleanCityPerCity(c, i, total, csvPath, opts, dedupNameSet, dedupPlaceSet) {
  const readyPath = path.join(opts.expansionDir, `${c.city}-${c.state}`, 'providers_ready.json');
  if (fs.existsSync(readyPath) && !opts.force) {
    const existing = JSON.parse(fs.readFileSync(readyPath, 'utf-8'));
    console.log(`  [${i + 1}/${total}] ${c.city}, ${c.state} — SKIP (already cleaned: ${existing.length} providers)`);
    return;
  }

  console.log(`  [${i + 1}/${total}] ${c.city}, ${c.state}...`);

  const raw = fs.readFileSync(csvPath);
  let providers = csvParse.parse(raw, { columns: true, relax_column_count: true, relax_quotes: true });
  const discovered = providers.length;

  providers = providers.filter(row => {
    const name = (row.provider_name || '').toLowerCase();
    const cat = (row.provider_category || '').toLowerCase();
    const types = (row.types || '').toLowerCase();
    const combined = name + ' ' + cat + ' ' + types;
    if (KEYWORD_BLOCKLIST.some(kw => combined.includes(kw))) return false;
    if ((row.business_status || '').includes('CLOSED')) return false;
    return true;
  });
  const afterKeyword = providers.length;

  let afterAI = providers.length;
  if (PERPLEXITY_API_KEY && providers.length > 0) {
    const kept = [];
    const BATCH = 50;
    for (let b = 0; b < providers.length; b += BATCH) {
      const batch = providers.slice(b, b + BATCH);
      const list = batch.map((p, j) => `${j + 1}. "${p.provider_name}" — category: ${p.provider_category}, address: ${p.address || 'unknown'}`).join('\n');
      const prompt = `For each business below, determine if its PRIMARY BUSINESS is providing senior care.

Answer YES only if the entity is one of these:
- Residential senior living facility (assisted living, memory care, nursing home, independent living)
- In-home care agency (home health, non-medical home care, hospice)
- Dedicated senior care program (adult day care, geriatric care management)

Answer NO if the entity is:
- A place seniors might USE but that is not a care provider (community centers, recreation facilities, YMCAs)
- General medical (family medicine, urgent care, VA clinics, hospitals, rehab clinics)
- Mental health / therapy only (counselors, psychologists, behavioral health)
- A DME supplier, medical supply store, or equipment rental company
- Retail, food service, construction, IT, storage, or any non-care business
- Nonprofit / community service that serves the general public
- Funeral homes, universities, churches, government agencies
- Wedding venues, event spaces, banquet halls
- General apartment complexes (not senior-specific independent living)

Businesses:
${list}

Return JSON: {"results": [{"num": 1, "is_senior_care": true, "reason": "brief reason"}]}`;
      try {
        const content = await perplexityChat(prompt);
        const match = content.match(/\{[\s\S]*"results"[\s\S]*\}/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          const results = parsed.results || [];
          for (const r of results) {
            const idx = (r.num || 0) - 1;
            if (idx >= 0 && idx < batch.length && r.is_senior_care) kept.push(batch[idx]);
          }
          const resultNums = new Set(results.map(r => r.num));
          for (let j = 0; j < batch.length; j++) {
            if (!resultNums.has(j + 1)) kept.push(batch[j]);
          }
        } else {
          kept.push(...batch);
        }
      } catch (e) {
        console.log(`    AI batch error: ${e.message} — keeping batch`);
        kept.push(...batch);
      }
    }
    providers = kept;
    afterAI = providers.length;
  }

  await finalizeCityClean(
    { c, providers, discovered, afterKeyword, afterAI },
    opts, dedupNameSet, dedupPlaceSet
  );
}

// Helper: category map + name clean + dedup + IDs + write JSON + log (shared by both modes).
async function finalizeCityClean(cd, opts, dedupNameSet, dedupPlaceSet) {
  const { c, discovered, afterKeyword, afterAI } = cd;
  let providers = cd.providers;

  // Category mapping
  for (const p of providers) {
    const mapped = CATEGORY_MAP[p.provider_category];
    if (mapped) p.provider_category = mapped;
  }

  // Name cleaning
  let namesCleaned = 0;
  for (const p of providers) {
    const orig = p.provider_name;
    p.provider_name = p.provider_name
      .replace(/,?\s*(LLC|Inc\.?|Corp\.?|Ltd\.?|L\.?L\.?C\.?|Incorporated|Corporation|Limited|Co\.?)\.?\s*$/i, '')
      .trim();
    if (p.provider_name !== orig) namesCleaned++;
  }

  // Dedup
  const beforeDedup = providers.length;
  providers = providers.filter(p => {
    if (p.place_id && dedupPlaceSet.has(p.place_id)) return false;
    const key = p.provider_name.trim().toLowerCase() + '|' + (p.state || c.state).trim().toUpperCase();
    return !dedupNameSet.has(key);
  });
  const dupes = beforeDedup - providers.length;

  // IDs + slugs
  const citySlug = c.city.toLowerCase().replace(/\s+/g, '-');
  const stateSlug = c.state.toLowerCase();
  for (let j = 0; j < providers.length; j++) {
    providers[j].provider_id = `${citySlug}-${stateSlug}-${String(j + 1).padStart(4, '0')}`;
    providers[j].slug = slug(providers[j].provider_name, c.city, c.state);
    if (!providers[j].city) providers[j].city = c.city;
    if (!providers[j].state) providers[j].state = c.state;
  }

  const cityDir = path.join(opts.expansionDir, `${c.city}-${c.state}`);
  fs.mkdirSync(cityDir, { recursive: true });
  const readyPath = path.join(cityDir, 'providers_ready.json');
  fs.writeFileSync(readyPath, JSON.stringify(providers, null, 2));

  const cats = {};
  for (const p of providers) cats[p.provider_category] = (cats[p.provider_category] || 0) + 1;
  const catStr = Object.entries(cats).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}: ${v}`).join(', ');

  console.log(`    ${c.city}, ${c.state}: ${discovered} → kw:${afterKeyword} → ai:${afterAI} → dedup:-${dupes} → ready:${providers.length}`);
  console.log(`    ${catStr}${namesCleaned > 0 ? ` | ${namesCleaned} names cleaned` : ''}`);

  for (const p of providers) {
    dedupNameSet.add(p.provider_name.trim().toLowerCase() + '|' + (p.state || c.state).trim().toUpperCase());
    if (p.place_id) dedupPlaceSet.add(p.place_id);
  }
}

async function phaseLoad(cities, opts) {
  console.log(`\n${'='.repeat(70)}`);
  console.log('PHASE 3: UPLOAD & GEOCODE');
  console.log(`${'='.repeat(70)}`);
  console.log(`  Cities: ${cities.length}`);

  // Get all existing slugs for collision detection (paginated — PostgREST caps
  // unpaginated queries at 10K rows, which means the unpaginated version only sees
  // ~11% of an 86K-row database and misses real slug collisions at upsert time).
  console.log('  Loading existing slugs...');
  const slugSet = new Set();
  {
    let slugOffset = 0;
    const SLUG_PAGE = 1000;
    while (true) {
      const { data, error } = await supabase
        .from('olera-providers')
        .select('slug')
        .range(slugOffset, slugOffset + SLUG_PAGE - 1);
      if (error || !data || data.length === 0) break;
      for (const row of data) if (row.slug) slugSet.add(row.slug);
      slugOffset += data.length;
      if (data.length < SLUG_PAGE) break;
    }
  }
  console.log(`  Loaded ${slugSet.size} existing slugs for collision detection`);

  for (let i = 0; i < cities.length; i++) {
    const c = cities[i];
    const readyPath = path.join(opts.expansionDir, `${c.city}-${c.state}`, 'providers_ready.json');
    if (!fs.existsSync(readyPath)) {
      console.log(`  [${i + 1}/${cities.length}] ${c.city}, ${c.state} — SKIP (no providers_ready.json)`);
      continue;
    }

    // Check if already uploaded
    const citySlug = c.city.toLowerCase().replace(/\s+/g, '-');
    const stateSlug = c.state.toLowerCase();
    const idPrefix = `${citySlug}-${stateSlug}-`;
    const { count: existingCount } = await supabase
      .from('olera-providers')
      .select('*', { count: 'exact', head: true })
      .like('provider_id', `${idPrefix}%`)
      .eq('deleted', false);

    if (existingCount > 0 && !opts.force) {
      console.log(`  [${i + 1}/${cities.length}] ${c.city}, ${c.state} — SKIP (${existingCount} already in DB)`);
      continue;
    }

    const providers = JSON.parse(fs.readFileSync(readyPath, 'utf-8'));
    console.log(`  [${i + 1}/${cities.length}] ${c.city}, ${c.state} — uploading ${providers.length}...`);

    // Upload in batches with slug collision handling
    let uploaded = 0;
    let slugCollisions = 0;
    const BATCH = 50;

    for (let b = 0; b < providers.length; b += BATCH) {
      const batch = providers.slice(b, b + BATCH).map(row => {
        // Handle slug collisions
        let s = row.slug;
        if (slugSet.has(s)) {
          const catSuffix = (row.provider_category || '').toLowerCase().replace(/[^a-z]/g, '-').replace(/--+/g, '-');
          s = s + '-' + catSuffix;
          let counter = 2;
          while (slugSet.has(s)) { s = s.replace(/-\d+$/, '') + '-' + counter; counter++; }
          slugCollisions++;
        }
        slugSet.add(s);

        return {
          provider_id: row.provider_id,
          provider_name: row.provider_name,
          provider_category: row.provider_category,
          address: row.address || null,
          city: row.city || c.city,
          state: row.state || c.state,
          zipcode: row.zipcode || null,
          phone: row.phone || null,
          website: row.website || null,
          lat: row.lat ? parseFloat(row.lat) : null,
          lon: row.lon ? parseFloat(row.lon) : null,
          google_rating: row.google_rating ? parseFloat(row.google_rating) : null,
          place_id: row.place_id || null,
          slug: s,
          deleted: false,
        };
      });

      const { error } = await supabase.from('olera-providers').upsert(batch, { onConflict: 'provider_id' });
      if (error) {
        // Try one by one on batch failure
        for (const item of batch) {
          const { error: e2 } = await supabase.from('olera-providers').upsert([item], { onConflict: 'provider_id' });
          if (e2) console.log(`    WARN: Failed ${item.provider_name}: ${e2.message}`);
          else uploaded++;
        }
      } else {
        uploaded += batch.length;
      }
    }

    console.log(`    Uploaded: ${uploaded}${slugCollisions > 0 ? ` (${slugCollisions} slug collisions resolved)` : ''}`);

    // Smart Geocode — only re-geocode providers with missing/suspicious coordinates
    const { data: toGeocode } = await supabase
      .from('olera-providers')
      .select('provider_id, provider_name, address, city, state, lat, lon')
      .like('provider_id', `${idPrefix}%`)
      .eq('deleted', false);

    let corrections = 0;
    let outOfArea = 0;
    let skippedGeocode = 0;
    const stateName = STATE_NAMES[c.state] || c.state;
    const bounds = STATE_BOUNDS[c.state];

    // Get city center (1 API call per city, not per provider)
    let cityLat = null, cityLon = null;
    const centerResult = await googleGeocode(`${c.city}, ${stateName}`);
    if (centerResult) { cityLat = centerResult.lat; cityLon = centerResult.lon; }

    for (let g = 0; g < (toGeocode || []).length; g++) {
      const p = toGeocode[g];

      // Smart skip: if discovery coordinates are within state bounds AND near city center, trust them
      const hasCoords = p.lat && p.lon && p.lat !== 0 && p.lon !== 0;
      let coordsLookGood = false;
      if (hasCoords && bounds) {
        const inState = p.lat >= bounds[0] && p.lat <= bounds[1] && p.lon >= bounds[2] && p.lon <= bounds[3];
        const nearCity = cityLat && cityLon &&
          Math.abs(p.lat - cityLat) <= 0.5 && Math.abs(p.lon - cityLon) <= 0.5;
        coordsLookGood = inState && nearCity;
      }

      if (coordsLookGood) {
        skippedGeocode++;
        continue; // Discovery coordinates are trustworthy — skip the API call
      }

      // Coordinates missing, zero, out of state, or far from city — re-geocode
      const fullAddr = [p.address, p.city, stateName].filter(Boolean).join(', ');
      const result = await googleGeocode(fullAddr);
      if (!result) continue;

      const diff = Math.abs((p.lat || 0) - result.lat) + Math.abs((p.lon || 0) - result.lon);
      if (diff > 0.01) corrections++;

      // Validate geocoded result
      let isOutOfArea = false;
      if (bounds) {
        if (result.lat < bounds[0] || result.lat > bounds[1] || result.lon < bounds[2] || result.lon > bounds[3]) {
          isOutOfArea = true;
        }
      }
      if (!isOutOfArea && cityLat && cityLon) {
        if (Math.abs(result.lat - cityLat) > 0.5 || Math.abs(result.lon - cityLon) > 0.5) {
          isOutOfArea = true;
        }
      }

      if (isOutOfArea) {
        await supabase.from('olera-providers')
          .update({ lat: result.lat, lon: result.lon, deleted: true, deleted_at: new Date().toISOString() })
          .eq('provider_id', p.provider_id);
        outOfArea++;
      } else {
        await supabase.from('olera-providers')
          .update({ lat: result.lat, lon: result.lon })
          .eq('provider_id', p.provider_id);
      }

      if ((g + 1) % 50 === 0) process.stdout.write(`    Geocoded ${g + 1}/${toGeocode.length}\r`);
    }

    const { count: activeCount } = await supabase
      .from('olera-providers')
      .select('*', { count: 'exact', head: true })
      .like('provider_id', `${idPrefix}%`)
      .eq('deleted', false);

    const geocoded = (toGeocode || []).length - skippedGeocode;
    console.log(`    Geocode: ${skippedGeocode} skipped (coords OK), ${geocoded} checked, ${corrections} corrected, ${outOfArea} out-of-area → ${activeCount} active`);

    // Notion status updates are handled outside this script by Claude subagents
    // using the mcp__notion__* integration. The in-script NOTION_TOKEN path has
    // a history of silent failures, so we don't rely on it. See
    // .claude/commands/city-pipeline.md → "Parallel subagent work during long phases".

    // Track loaded provider count for live site verification
    c._loadedActive = activeCount || 0;
  }

  console.log(`\n  Load phase complete. Cost so far: ${cost.summary()}`);

  // Fire-and-forget live site verification (skip on dry-run)
  if (!opts.dryRun) {
    opts._liveSiteCheckPromise = runLiveSiteCheck(cities);
  }
}

// Live site verification hook — picks 5 random cities with >= 3 loaded providers
async function runLiveSiteCheck(cities) {
  try {
    const eligible = cities.filter(c => (c._loadedActive || 0) >= 3);
    if (eligible.length === 0) return [];
    // Random sample up to 5
    const shuffled = eligible.slice().sort(() => Math.random() - 0.5);
    const picks = shuffled.slice(0, 5);
    const results = [];
    for (const c of picks) {
      const stateSlug = (STATE_NAMES[c.state] || c.state).toLowerCase().replace(/\s+/g, '-');
      const citySlug = c.city.toLowerCase().replace(/\s+/g, '-');
      const url = `https://olera.com/assisted-living/${stateSlug}/${citySlug}`;
      try {
        const resp = await fetchWithRetry(url, { redirect: 'follow' });
        const body = await resp.text();
        const hasCards = body.includes('provider-card');
        results.push({ city: c.city, state: c.state, url, status: resp.status, hasCards, ok: resp.ok && hasCards });
      } catch (err) {
        results.push({ city: c.city, state: c.state, url, status: 0, hasCards: false, ok: false, error: err.message });
      }
    }
    return results;
  } catch (err) {
    return [{ error: err.message }];
  }
}

async function phaseEnrich(cities, opts) {
  console.log(`\n${'='.repeat(70)}`);
  console.log('PHASE 4: ENRICHMENT');
  console.log(`${'='.repeat(70)}`);

  // Collect ALL active providers across ALL cities
  const allProviders = [];
  for (const c of cities) {
    const citySlug = c.city.toLowerCase().replace(/\s+/g, '-');
    const stateSlug = c.state.toLowerCase();
    const idPrefix = `${citySlug}-${stateSlug}-`;
    const { data } = await supabase
      .from('olera-providers')
      .select('provider_id, provider_name, provider_category, address, city, state, website, google_rating, place_id, provider_description, google_reviews_data, ai_trust_signals, provider_images')
      .like('provider_id', `${idPrefix}%`)
      .eq('deleted', false);
    if (data) allProviders.push(...data);
  }
  console.log(`  Total active providers across ${cities.length} cities: ${allProviders.length}`);

  // Load discovery CSV data for review_count (needed for hydration)
  const csvReviewMap = {};
  for (const c of cities) {
    const csvPath = c.csvPath || discoveryCsvForCity(opts.expansionDir, c.city, c.state);
    if (csvPath && fs.existsSync(csvPath)) {
      const rows = csvParse.parse(fs.readFileSync(csvPath), { columns: true, relax_column_count: true, relax_quotes: true });
      for (const row of rows) {
        if (row.place_id) csvReviewMap[row.place_id] = row;
      }
    }
  }

  // --- Stream D: Descriptions + initial hydration (no API, instant) ---
  console.log('\n  Stream D: Descriptions + Reviews hydration (no API)...');
  let descCount = 0, hydrateCount = 0;
  for (const p of allProviders) {
    // Descriptions
    if (!p.provider_description) {
      const tmpl = DESC_TEMPLATES[p.provider_category];
      if (tmpl) {
        let desc = `${p.provider_name} is ${tmpl.article} ${tmpl.desc} located in ${p.city || 'unknown'}, ${p.state || 'unknown'}.`;
        if (p.google_rating && parseFloat(p.google_rating) >= 3.0) {
          desc += ` The community is rated ${p.google_rating} out of 5 stars on Google.`;
        }
        await supabase.from('olera-providers').update({ provider_description: desc }).eq('provider_id', p.provider_id);
        descCount++;
      }
    }

    // Hydrate google_reviews_data (rating + review_count from discovery CSV)
    if (p.google_rating && (!p.google_reviews_data || !p.google_reviews_data.rating)) {
      const csvRow = csvReviewMap[p.place_id] || {};
      const reviewData = {
        rating: parseFloat(p.google_rating),
        review_count: parseInt(csvRow.review_count) || 0,
        reviews: p.google_reviews_data?.reviews || [],
        last_synced: new Date().toISOString(),
      };
      await supabase.from('olera-providers').update({ google_reviews_data: reviewData }).eq('provider_id', p.provider_id);
      p.google_reviews_data = reviewData; // sync in-memory so Stream B doesn't clobber rating/review_count
      hydrateCount++;
    }
  }
  console.log(`    Descriptions: ${descCount} written | Reviews hydrated: ${hydrateCount}`);

  // --- Parallel streams A + B (trust signals || combined reviews+photos) ---
  const streamA = enrichTrustSignals(allProviders);
  const streamB = enrichReviewsAndImages(allProviders);

  console.log('\n  Streams A/B running in parallel...');
  const [trustResult, placesResult] = await Promise.all([streamA, streamB]);

  console.log(`    Stream A (Trust signals): ${trustResult.confirmed} confirmed, ${trustResult.deleted} deleted`);
  console.log(`    Stream B (Reviews+Images): ${placesResult.snippetsFetched} snippets, ${placesResult.imagesFetched} images, ${placesResult.noData} no data (${placesResult.apiCalls} API calls — was ${placesResult.savedCalls} separate calls before merge)`);

  // Post-streams re-hydration removed — Stream D already hydrates rating + review_count,
  // and Stream B already merges review snippets into google_reviews_data JSONB.
  // The old loop re-queried all 700 cities and did 22K+ sequential updates for no reason,
  // causing the pipeline to hang for hours.

  console.log(`\n  Enrich phase complete. Cost so far: ${cost.summary()}`);
}

// --- Enrichment stream helpers ---

async function enrichTrustSignals(allProviders) {
  const nonCms = allProviders.filter(p => NON_CMS_CATEGORIES.includes(p.provider_category) && !p.ai_trust_signals);
  if (!PERPLEXITY_API_KEY || nonCms.length === 0) return { confirmed: 0, deleted: 0, failed: 0 };

  let confirmed = 0, deleted = 0, failed = 0;
  const BATCH = 3; // 3 providers per Perplexity call

  for (let i = 0; i < nonCms.length; i += BATCH) {
    const batch = nonCms.slice(i, i + BATCH);
    const providerList = batch.map((p, j) => `
Provider ${j + 1}:
  Name: ${p.provider_name}
  Location: ${p.address || ''}, ${p.city}, ${p.state}
  Category: ${p.provider_category}
  Website: ${p.website || 'unknown'}
`).join('\n');

    const prompt = `Search the web for each business below and answer two questions for EACH.

${providerList}

For EACH provider:

QUESTION 1 — ENTITY VERIFICATION
Is its PRIMARY BUSINESS senior care (residential senior living, in-home senior care, or dedicated senior programs)?
Mark is_senior_care = false if it's: a wedding venue, community center, general medical, DME supplier, retail, nonprofit, general apartments, or in a different location than listed.

QUESTION 2 — TRUST SIGNALS (only if is_senior_care = true)
Verify: state_licensed, accredited, bbb_rated, years_in_operation, regulatory_actions, active_website, google_business, community_presence.

Return ONLY this JSON:
{"providers": [
  {"num": 1, "is_senior_care": true/false, "entity_reason": "...", "signals": {...}, "confidence": "high/medium/low"},
  {"num": 2, ...},
  {"num": 3, ...}
]}`;

    try {
      const content = await perplexityChat(prompt);
      const parsed = extractJson(content);
      const results = parsed?.providers || parsed?.results || [];

      for (const r of results) {
        const idx = (r.num || 0) - 1;
        if (idx < 0 || idx >= batch.length) continue;
        const p = batch[idx];

        if (!r.is_senior_care) {
          await supabase.from('olera-providers')
            .update({ deleted: true, deleted_at: new Date().toISOString() })
            .eq('provider_id', p.provider_id);
          deleted++;
        } else {
          const signals = r.signals || {};
          signals.verified_at = new Date().toISOString();
          signals.confidence = r.confidence;
          await supabase.from('olera-providers')
            .update({ ai_trust_signals: signals })
            .eq('provider_id', p.provider_id);
          confirmed++;
        }
      }
    } catch (e) {
      failed += batch.length;
    }

    if ((i + BATCH) % 30 === 0) {
      process.stdout.write(`    Trust: ${i + BATCH}/${nonCms.length}\r`);
    }
  }

  return { confirmed, deleted, failed };
}

async function enrichReviewsAndImages(allProviders) {
  // Combined stream: one Google Places call fetches reviews+photos together
  // Before: 2 separate calls per provider (reviews + photos) = 2N API calls
  // After:  1 combined call + 1 photo URI resolution = at most 2 calls, often 1
  const needReviews = new Set(
    allProviders.filter(p =>
      p.place_id && p.google_rating &&
      (!p.google_reviews_data?.reviews || p.google_reviews_data.reviews.length === 0)
    ).map(p => p.provider_id)
  );
  const needImages = new Set(
    allProviders.filter(p => p.place_id && !p.provider_images).map(p => p.provider_id)
  );

  // Union: providers that need either reviews or images (or both)
  const needEither = allProviders.filter(p =>
    p.place_id && (needReviews.has(p.provider_id) || needImages.has(p.provider_id))
  );

  if (!GOOGLE_API_KEY || needEither.length === 0) {
    return { snippetsFetched: 0, imagesFetched: 0, noData: 0, apiCalls: 0, savedCalls: 0 };
  }

  let snippetsFetched = 0, imagesFetched = 0, noData = 0, apiCalls = 0;
  const wouldHaveBeen = needReviews.size + needImages.size; // old separate call count

  for (let i = 0; i < needEither.length; i++) {
    const p = needEither[i];
    const wantReviews = needReviews.has(p.provider_id);
    const wantImages = needImages.has(p.provider_id);

    // Build fields list — one call for both
    const fields = [];
    if (wantReviews) fields.push('reviews');
    if (wantImages) fields.push('photos');

    try {
      const data = await googlePlacesField(p.place_id, fields.join(','));
      apiCalls++;
      const updates = {};

      // Reviews
      if (wantReviews && data?.reviews?.length > 0) {
        const reviews = data.reviews.slice(0, 5).map(r => ({
          text: r.text?.text || '',
          rating: r.rating,
          author_name: r.authorAttribution?.displayName || '',
          time: r.publishTime || '',
          relative_time: r.relativePublishTimeDescription || '',
        }));
        const existing = p.google_reviews_data || {};
        existing.reviews = reviews;
        existing.last_synced = new Date().toISOString();
        updates.google_reviews_data = existing;
        snippetsFetched++;
      }

      // Images
      if (wantImages && data?.photos?.length > 0) {
        const photoName = data.photos[0].name;
        const uri = await googlePhotoUri(photoName);
        apiCalls++; // photo URI resolution is a separate call (unavoidable)
        if (uri) {
          updates.provider_images = uri;
          imagesFetched++;
        }
      }

      if (Object.keys(updates).length > 0) {
        await supabase.from('olera-providers').update(updates).eq('provider_id', p.provider_id);
      } else {
        noData++;
      }
    } catch (e) {
      noData++;
    }

    if ((i + 1) % 50 === 0) process.stdout.write(`    Places: ${i + 1}/${needEither.length}\r`);
  }

  return { snippetsFetched, imagesFetched, noData, apiCalls, savedCalls: wouldHaveBeen };
}

async function phaseFinalize(cities, opts) {
  console.log(`\n${'='.repeat(70)}`);
  console.log('PHASE 5: FINALIZE');
  console.log(`${'='.repeat(70)}`);

  const results = [];

  for (let i = 0; i < cities.length; i++) {
    const c = cities[i];
    const citySlug = c.city.toLowerCase().replace(/\s+/g, '-');
    const stateSlug = c.state.toLowerCase();
    const idPrefix = `${citySlug}-${stateSlug}-`;

    // Get final stats
    const { data: providers } = await supabase
      .from('olera-providers')
      .select('provider_category, provider_description, google_reviews_data, ai_trust_signals, provider_images')
      .like('provider_id', `${idPrefix}%`)
      .eq('deleted', false);

    if (!providers || providers.length === 0) {
      results.push({ city: c.city, state: c.state, count: 0, status: 'empty' });
      continue;
    }

    const cats = {};
    let hasDesc = 0, hasReviews = 0, hasTrust = 0, hasImages = 0;
    for (const p of providers) {
      cats[p.provider_category] = (cats[p.provider_category] || 0) + 1;
      if (p.provider_description) hasDesc++;
      if (p.google_reviews_data?.rating) hasReviews++;
      if (p.ai_trust_signals) hasTrust++;
      if (p.provider_images) hasImages++;
    }

    results.push({
      city: c.city, state: c.state, count: providers.length, status: 'complete',
      cats, hasDesc, hasReviews, hasTrust, hasImages,
    });

    // Notion is handled outside this script via Claude subagents — see phaseLoad comment.
  }

  // Print final batch summary table
  console.log('\n  BATCH RESULTS');
  console.log('  ' + '-'.repeat(85));
  console.log('  ' + 'City'.padEnd(25) + 'Providers'.padEnd(12) + 'Desc'.padEnd(8) + 'Reviews'.padEnd(10) + 'Trust'.padEnd(8) + 'Images'.padEnd(8) + 'Status');
  console.log('  ' + '-'.repeat(85));

  let totalProviders = 0;
  for (const r of results) {
    totalProviders += r.count;
    const pct = (n, total) => total > 0 ? `${Math.round(n / total * 100)}%` : '-';
    console.log('  ' +
      `${r.city}, ${r.state}`.padEnd(25) +
      String(r.count).padEnd(12) +
      (r.hasDesc !== undefined ? pct(r.hasDesc, r.count) : '-').padEnd(8) +
      (r.hasReviews !== undefined ? pct(r.hasReviews, r.count) : '-').padEnd(10) +
      (r.hasTrust !== undefined ? pct(r.hasTrust, r.count) : '-').padEnd(8) +
      (r.hasImages !== undefined ? pct(r.hasImages, r.count) : '-').padEnd(8) +
      r.status
    );
  }

  console.log('  ' + '-'.repeat(85));
  console.log(`  Total: ${totalProviders} providers across ${results.filter(r => r.status === 'complete').length} cities`);
  console.log(`  Cost: ${cost.summary()}`);

  // Await + print live site verification results
  if (opts._liveSiteCheckPromise) {
    console.log('\n  LIVE SITE CHECK');
    console.log('  ' + '-'.repeat(85));
    try {
      const liveResults = await opts._liveSiteCheckPromise;
      if (!liveResults || liveResults.length === 0) {
        console.log('  (no eligible cities to check)');
      } else {
        for (const r of liveResults) {
          if (r.error && !r.city) {
            console.log(`  ERROR: ${r.error}`);
            continue;
          }
          const mark = r.ok ? 'PASS' : 'FAIL';
          const cards = r.hasCards ? 'has provider-card' : 'no provider-card';
          console.log(`  [${mark}] ${r.city}, ${r.state} — HTTP ${r.status} — ${cards}${r.error ? ` (${r.error})` : ''}`);
        }
      }
    } catch (e) {
      console.log(`  Live site check error: ${e.message}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Notion Pre-Flight
// ---------------------------------------------------------------------------

async function notionPreflight(cities) {
  if (!NOTION_TOKEN) {
    console.log('  WARN: No NOTION_TOKEN — skipping Notion pre-flight');
    return {};
  }

  console.log('\nNotion pre-flight: checking existing pages...');

  // Query all city pages
  const existing = {};
  let hasMore = true;
  let cursor = undefined;

  while (hasMore) {
    const body = { page_size: 100 };
    if (cursor) body.start_cursor = cursor;
    const result = await notionRequest('POST', `/databases/${NOTION_DB_ID}/query`, body);

    for (const page of result.results) {
      const title = page.properties['City Name']?.title?.[0]?.plain_text || '';
      const state = page.properties['State']?.select?.name || '';
      const status = page.properties['City Status']?.status?.name || '';
      const key = `${title}-${state}`;
      existing[key] = { pageId: page.id, status, title, state };
    }

    hasMore = result.has_more;
    cursor = result.next_cursor;
  }

  let created = 0, alreadyComplete = 0, alreadyExists = 0;

  for (const c of cities) {
    const key = `${c.city}-${c.state}`;
    if (existing[key]) {
      if (existing[key].status === 'Complete') alreadyComplete++;
      else alreadyExists++;
    } else {
      try {
        const page = await notionCreatePage(c.city, c.state);
        existing[key] = { pageId: page.id, status: 'Planning', title: c.city, state: c.state };
        created++;
      } catch (e) {
        console.error(`  Failed to create Notion page for ${c.city}, ${c.state}: ${e.message}`);
      }
    }
  }

  console.log(`  Created: ${created} | Already existed: ${alreadyExists} | Already complete: ${alreadyComplete}`);
  return existing;
}

// ---------------------------------------------------------------------------
// Main Entry
// ---------------------------------------------------------------------------

async function main() {
  const opts = parseArgs();

  if (opts.help || !opts.batch) {
    printUsage();
    process.exit(opts.help ? 0 : 1);
  }

  initClients();

  // Determine city list
  let cities;
  if (opts.batch.endsWith('.md')) {
    cities = parseBatchMd(opts.batch);
  } else if (fs.statSync(opts.batch).isDirectory()) {
    cities = readyCityList(opts.batch);
    opts.expansionDir = opts.batch;
  } else {
    // Assume CSV
    cities = parseBatchMd(opts.batch); // same parser works for simple CSVs
  }

  if (!cities || cities.length === 0) {
    console.error('ERROR: No cities found. Check --batch path.');
    process.exit(1);
  }

  // --cities filter: narrow the list to an explicit allowlist (reprocess mode).
  // Format: "City1,ST;City2,ST" — matches by (city, state) case-insensitively.
  if (opts.citiesFilter) {
    const keyOf = c => `${c.city.toLowerCase()}|${c.state.toUpperCase()}`;
    const allowlist = new Set(
      opts.citiesFilter.split(';').map(pair => {
        const [city, state] = pair.split(',').map(s => (s || '').trim());
        if (!city || !state) return null;
        return `${city.toLowerCase()}|${state.toUpperCase()}`;
      }).filter(Boolean)
    );
    const originalCount = cities.length;
    const originalSample = cities.slice(0, 10).map(c => `${c.city},${c.state}`).join('; ');
    cities = cities.filter(c => allowlist.has(keyOf(c)));
    console.log(`  --cities filter: ${originalCount} → ${cities.length} cities`);
    if (cities.length === 0) {
      console.error(`ERROR: --cities filter matched 0 cities. Allowlist: ${[...allowlist].join(', ')}`);
      console.error(`  Available city keys (first 10 from --batch): ${originalSample}`);
      process.exit(1);
    }
    const matched = new Set(cities.map(keyOf));
    const missing = [...allowlist].filter(key => !matched.has(key));
    if (missing.length) {
      console.warn(`  WARN: --cities requested but not found in --batch: ${missing.join(', ')}`);
    }
  }

  if (opts.force) {
    console.log(`  --force mode: providers_ready.json cache and "already in DB" skip guards are BYPASSED.`);
    if (!opts.citiesFilter) {
      console.warn(`  WARN: --force without --cities will reprocess EVERY city in --batch. This is usually wrong.`);
      console.warn(`        Pass --cities "City1,ST;City2,ST" to scope the reprocess.`);
    }
  }

  // Cost/time estimates
  const estCost = cities.length * 6;
  const estTimeMin = cities.length * 3 + 35; // ~3 min/city for load, +35 min enrichment
  console.log(`\n${'='.repeat(70)}`);
  console.log('OLERA CITY PIPELINE — BATCH PROCESSOR');
  console.log(`${'='.repeat(70)}`);
  console.log(`  Cities:       ${cities.length}`);
  console.log(`  Phase:        ${opts.phase}`);
  console.log(`  Expansion:    ${opts.expansionDir}`);
  console.log(`  Resume:       ${opts.resume}`);
  console.log(`  Est. cost:    ~$${estCost} (post-discovery)`);
  console.log(`  Est. time:    ~${formatDuration(estTimeMin * 60)}`);
  console.log(`  Watch mode:   ${opts.watch}`);
  if (estTimeMin > 60) {
    console.log(`  NOTE: This will take ${formatDuration(estTimeMin * 60)}. Consider running in background.`);
  }

  // Notion pre-flight
  const notionPages = await notionPreflight(cities);

  // Filter out complete cities if --resume
  if (opts.resume) {
    const before = cities.length;
    cities = cities.filter(c => {
      const key = `${c.city}-${c.state}`;
      return notionPages[key]?.status !== 'Complete';
    });
    const skipped = before - cities.length;
    if (skipped > 0) console.log(`  Resuming: skipped ${skipped} already-complete cities`);
  }

  if (cities.length === 0) {
    console.log('\nAll cities already complete. Nothing to do.');
    process.exit(0);
  }

  // Attach Notion page IDs to cities
  cities.forEach(c => {
    const key = `${c.city}-${c.state}`;
    c.notionPageId = notionPages[key]?.pageId || null;
  });

  // Run phases
  const phases = opts.phase === 'all'
    ? ['clean', 'load', 'enrich', 'finalize']
    : [opts.phase];

  for (const phase of phases) {
    switch (phase) {
      case 'clean':    await phaseClean(cities, opts); break;
      case 'load':     await phaseLoad(cities, opts); break;
      case 'enrich':   await phaseEnrich(cities, opts); break;
      case 'finalize': await phaseFinalize(cities, opts); break;
      default:
        console.error(`Unknown phase: ${phase}`);
        process.exit(1);
    }
  }

  console.log(`\n${'='.repeat(70)}`);
  console.log('PIPELINE COMPLETE');
  console.log(`${'='.repeat(70)}`);
  console.log(`  ${cost.summary()}`);
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
