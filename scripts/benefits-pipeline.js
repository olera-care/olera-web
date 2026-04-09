#!/usr/bin/env node

/**
 * Senior Benefits Pipeline — Content Production System
 *
 * Full lifecycle: discovers programs, researches them deeply, classifies
 * their type and complexity, generates page content drafts, and produces
 * human-readable reports. The taxonomy emerges from exploration.
 *
 * Usage:
 *   node scripts/benefits-pipeline.js --state TX                  # dry-run
 *   node scripts/benefits-pipeline.js --state MI --run             # full pipeline
 *   node scripts/benefits-pipeline.js --state MI --phase explore   # explore only
 *   node scripts/benefits-pipeline.js --state MI --phase draft --run # draft only
 *
 * Phases:
 *   explore   — Survey the landscape: what programs exist?
 *   dive      — Deep dive each program: what data matters?
 *   compare   — Cross-reference with our existing data, surface diffs
 *   classify  — Determine program type, geographic scope, complexity
 *   draft     — Generate structured page content (requires ANTHROPIC_API_KEY)
 *   report    — Generate human-readable markdown report
 */

const fs = require("fs");
const path = require("path");

// ─── Worktree-compatible env loading ────────────────────────────────────────

const MAIN_REPO = path.resolve(process.env.HOME, "Desktop/olera-web");
module.paths.unshift(path.join(MAIN_REPO, "node_modules"));

const envPaths = [
  path.resolve(__dirname, "..", ".env.local"),
  path.resolve(MAIN_REPO, ".env.local"),
];
for (const p of envPaths) {
  if (fs.existsSync(p)) {
    require("dotenv").config({ path: p });
    break;
  }
}

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

// ─── CLI Parsing ────────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { state: null, region: null, parentState: null, phase: "all", run: false };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--state": opts.state = args[++i]?.toUpperCase(); break;
      case "--region": opts.region = args[++i]; break;
      case "--parent-state": opts.parentState = args[++i]?.toUpperCase(); break;
      case "--phase": opts.phase = args[++i]; break;
      case "--run":   opts.run = true; break;
      case "--help": case "-h": printUsage(); process.exit(0);
      default:
        if (!args[i].startsWith("-")) opts.state = opts.state || args[i].toUpperCase();
    }
  }
  return opts;
}

/**
 * Slugify a region name for directory/URL use.
 * "Miami-Dade County, FL" → "miami-dade-county-fl"
 * "Greater Houston" → "greater-houston"
 */
function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Resolve --state or --region into a unified entity object.
 * Everything downstream uses entity.name, entity.slug, entity.parentState.
 */
function resolveEntity(opts) {
  if (opts.region) {
    // Freeform region
    const slug = slugify(opts.region);
    const parentState = opts.parentState || null;
    const parentStateName = parentState ? STATE_NAMES[parentState] : null;
    return {
      name: opts.region,
      slug,
      dirName: slug,
      isState: false,
      stateCode: parentState,
      parentStateName,
      parentState,
    };
  }
  if (opts.state && STATE_NAMES[opts.state]) {
    // State shorthand: --state MI → entity for "Michigan"
    return {
      name: STATE_NAMES[opts.state],
      slug: STATE_NAMES[opts.state].toLowerCase().replace(/\s+/g, "-"),
      dirName: opts.state, // keep 2-letter code for backwards compat
      isState: true,
      stateCode: opts.state,
      parentStateName: null,
      parentState: null,
    };
  }
  return null;
}

function printUsage() {
  console.log(`
  Senior Benefits Pipeline — Content Production System

  Usage:
    node scripts/benefits-pipeline.js --state MI              # dry-run (state)
    node scripts/benefits-pipeline.js --state MI --run        # full pipeline (state)
    node scripts/benefits-pipeline.js --state MI --phase dive --run

    node scripts/benefits-pipeline.js --region "Miami-Dade County, FL" --parent-state FL --run
    node scripts/benefits-pipeline.js --region "Greater Houston" --parent-state TX --run
    node scripts/benefits-pipeline.js --region "DMV" --run

  Phases:
    explore   Survey the landscape: what programs exist?
    dive      Deep dive: what data matters for each program?
    compare   Cross-reference with our existing data
    classify  Determine program type, geographic scope, complexity
    draft     Generate structured page content (needs ANTHROPIC_API_KEY)
    report    Generate human-readable markdown report

  Options:
    --state XX           US state code (shorthand for --region "State Name")
    --region "Name"      Any geographic entity (county, metro, region, city)
    --parent-state XX    Parent state for comparison data (optional)
    --phase <name>       Run a single phase
    --run                Execute (without this, dry-run only)

  Environment:
    PERPLEXITY_API_KEY   Required for explore + dive phases
    ANTHROPIC_API_KEY    Required for draft phase (content generation)
  `);
}

// ─── State Data ─────────────────────────────────────────────────────────────

const STATE_NAMES = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi",
  MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire",
  NJ: "New Jersey", NM: "New Mexico", NY: "New York", NC: "North Carolina",
  ND: "North Dakota", OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania",
  RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota", TN: "Tennessee",
  TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia", WA: "Washington",
  WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming", DC: "District of Columbia",
};

// ─── Infrastructure ─────────────────────────────────────────────────────────

class CostTracker {
  constructor() {
    this.perplexity = 0;
    this.startTime = Date.now();
  }
  addPerplexity(n = 1) { this.perplexity += n; }
  get cost() { return this.perplexity * 0.005; }
  get elapsed() { return (Date.now() - this.startTime) / 1000; }
  summary() {
    const s = this.elapsed;
    const t = s < 60 ? `${Math.round(s)}s` : `${(s / 60).toFixed(1)}m`;
    return `$${this.cost.toFixed(3)} (${this.perplexity} calls, ${t})`;
  }
}

const cost = new CostTracker();

class RateLimiter {
  constructor(ms = 300) { this.min = ms; this.last = 0; }
  async wait() {
    const gap = Date.now() - this.last;
    if (gap < this.min) await new Promise((r) => setTimeout(r, this.min - gap));
    this.last = Date.now();
  }
}

const rateLimiter = new RateLimiter(300);

async function fetchWithRetry(url, opts = {}, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fetch(url, opts);
    } catch (err) {
      if (i === retries - 1) throw err;
      console.log(`  [retry ${i + 1}] ${err.message}`);
      await new Promise((r) => setTimeout(r, 2000 * (i + 1)));
    }
  }
}

async function perplexityChat(prompt, temperature = 0.1) {
  await rateLimiter.wait();
  cost.addPerplexity();

  const resp = await fetchWithRetry("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "sonar",
      messages: [{ role: "user", content: prompt }],
      temperature,
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Perplexity ${resp.status}: ${text.slice(0, 200)}`);
  }

  const json = await resp.json();
  return json.choices?.[0]?.message?.content || "";
}

function extractJson(text) {
  const arrayMatch = text.match(/\[[\s\S]*\]/);
  if (arrayMatch) { try { return JSON.parse(arrayMatch[0]); } catch { /* fall through */ } }
  const objMatch = text.match(/\{[\s\S]*\}/);
  if (objMatch) { try { return JSON.parse(objMatch[0]); } catch { return null; } }
  return null;
}

// ─── Name Normalization & Dedup ──────────────────────────────────────────────

/**
 * Normalize a program name for comparison.
 * Strips state name, common prefixes/suffixes, parentheticals, and whitespace
 * so "MI Choice Medicaid Waiver", "Michigan's Choice Waiver Program", and
 * "MI Choice Program" all become something like "choice waiver".
 */
function normalizeForMatch(name, stateName = "") {
  let n = (name || "").toLowerCase();

  // Remove state name, possessive forms, and abbreviation
  const stateAbbr = Object.entries(STATE_NAMES).find(([, v]) => v === stateName)?.[0]?.toLowerCase() || "";
  const stateLower = (stateName || "").toLowerCase();
  if (stateLower) {
    n = n.replace(new RegExp(`${stateLower}'?s?`, "g"), "");
  }
  if (stateAbbr) n = n.replace(new RegExp(`\\b${stateAbbr}\\b`, "g"), "");

  // Expand common acronyms before stripping
  const acronyms = {
    pace: "all inclusive care elderly",
    snap: "food nutrition",
    liheap: "energy heating",
    scsep: "senior employment",
    ship: "health insurance counseling",
    hcbs: "home community based",
    mmap: "medicare counseling",
  };
  for (const [acr, expansion] of Object.entries(acronyms)) {
    if (n.match(new RegExp(`\\b${acr}\\b`))) {
      n += ` ${expansion}`;
    }
  }

  // Remove common filler words
  const fillers = ["program", "programs", "the", "for", "of", "and", "in", "a", "an", "state", "federal", "services", "service", "assistance"];
  for (const f of fillers) {
    n = n.replace(new RegExp(`\\b${f}\\b`, "g"), "");
  }

  // Remove parenthetical content
  n = n.replace(/\([^)]*\)/g, "");

  // Remove special chars and collapse whitespace
  n = n.replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();

  return n;
}

function deduplicatePrograms(programs, stateName) {
  const result = [];
  const seenNormalized = new Map(); // normalized → index in result

  for (const p of programs) {
    const norm = normalizeForMatch(p.name, stateName);
    if (!norm) continue;

    // Check if any existing normalized name is a subset or superset
    let isDupe = false;
    for (const [existingNorm, existingIdx] of seenNormalized.entries()) {
      if (
        existingNorm === norm ||
        existingNorm.includes(norm) ||
        norm.includes(existingNorm)
      ) {
        // Keep the one with the longer original name (likely more specific)
        if ((p.name || "").length > (result[existingIdx].name || "").length) {
          result[existingIdx] = p;
        }
        isDupe = true;
        break;
      }
    }

    if (!isDupe) {
      seenNormalized.set(norm, result.length);
      result.push(p);
    }
  }

  return result;
}

// ─── File I/O ───────────────────────────────────────────────────────────────

function pipelineDir(dirName) {
  const dir = path.resolve(__dirname, "..", "data", "pipeline", dirName);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function writeFile(dirName, filename, content) {
  const filepath = path.join(pipelineDir(dirName), filename);
  fs.writeFileSync(filepath, typeof content === "string" ? content : JSON.stringify(content, null, 2));
  console.log(`  → ${filepath}`);
}

function readJson(dirName, filename) {
  const filepath = path.join(pipelineDir(dirName), filename);
  if (!fs.existsSync(filepath)) return null;
  return JSON.parse(fs.readFileSync(filepath, "utf-8"));
}

// ─── Load Existing Programs ─────────────────────────────────────────────────

function loadExistingPrograms(stateCode) {
  try {
    const waiverPath = path.resolve(__dirname, "..", "data", "waiver-library.ts");
    const content = fs.readFileSync(waiverPath, "utf-8");
    const stateName = STATE_NAMES[stateCode];
    if (!stateName) return [];

    const stateSection = getStateSection(content, stateCode);
    if (!stateSection) return [];

    const programs = [];
    const blockRegex = /\{\s*\n\s{4}id:\s*"([^"]+)",\s*\n\s{4}name:\s*"([^"]+)",/g;
    let match;
    while ((match = blockRegex.exec(stateSection)) !== null) {
      const blockStart = match.index;
      const blockEnd = stateSection.indexOf("\n  },", blockStart);
      const block = stateSection.slice(blockStart, blockEnd > 0 ? blockEnd : blockStart + 3000);

      const get = (field) => {
        const m = block.match(new RegExp(`${field}:\\s*"([^"]*)"`));
        return m?.[1] || null;
      };

      const getArray = (field) => {
        const m = block.match(new RegExp(`${field}:\\s*\\[([^\\]]*)\\]`, "s"));
        if (!m) return [];
        return [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]);
      };

      programs.push({
        id: match[1],
        name: match[2],
        shortName: get("shortName"),
        savingsRange: get("savingsRange"),
        description: get("description"),
        sourceUrl: get("sourceUrl"),
        lastVerifiedDate: get("lastVerifiedDate"),
        verifiedBy: get("verifiedBy"),
        savingsSource: get("savingsSource"),
        phone: get("phone"),
        eligibilityHighlights: getArray("eligibilityHighlights"),
      });
    }
    return programs;
  } catch (err) {
    console.log(`  Error loading existing programs: ${err.message}`);
    return [];
  }
}

function getStateSection(content, stateCode) {
  const stateName = STATE_NAMES[stateCode];
  if (!stateName) return null;
  const headerRegex = new RegExp(`// ─── ${stateName} ─+\\n\\n`, "i");
  const headerMatch = content.match(headerRegex);
  if (!headerMatch) return null;
  const startIdx = headerMatch.index;
  const nextHeaderRegex = /\n\/\/ ─── [A-Z][a-z]+ ─+/g;
  nextHeaderRegex.lastIndex = startIdx + headerMatch[0].length;
  const nextMatch = nextHeaderRegex.exec(content);
  return content.slice(startIdx, nextMatch ? nextMatch.index : content.length);
}

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 1: EXPLORE — Survey the landscape
// ═══════════════════════════════════════════════════════════════════════════

async function phaseExplore(entity) {
  console.log(`\n  ━━━ EXPLORE: What programs exist in ${entity.name}? ━━━\n`);

  let federalPrompt, localPrompt;

  if (entity.isState) {
    // State-level: original two-query approach
    federalPrompt = `What are the major federal senior benefit programs as they are administered in ${entity.name} (${entity.stateCode})? I need the ${entity.name}-specific name for each.

Cover these categories:
- Medicaid for seniors/disabled
- Home and community-based services waiver
- PACE
- Medicare Savings (QMB, SLMB, QI)
- SNAP/food assistance
- LIHEAP/energy assistance
- Weatherization
- Medicare counseling (SHIP)
- Meals on Wheels
- Caregiver/respite support
- Senior employment (SCSEP)
- Legal aid for seniors
- Long-term care ombudsman

For each, give: name (as used in ${entity.name}), what_it_does (2 sentences), who_its_for, official_url, benefit_value.

Return as a JSON array: [{"name":"...","what_it_does":"...","who_its_for":"...","official_url":"...","benefit_value":"..."}]`;

    localPrompt = `What senior benefit programs are unique to ${entity.name} (${entity.stateCode}) — programs that only exist in this state, or state-funded programs beyond the standard federal ones?

Think about: property tax relief, state pharmaceutical assistance, state-funded home care, state energy credits, veteran supplements, senior housing programs, transportation programs, companion programs, anything ${entity.name} offers that not every state has.

For each, give: name, what_it_does (2 sentences), who_its_for, whats_unique, official_url, benefit_value.

Return as a JSON array: [{"name":"...","what_it_does":"...","who_its_for":"...","whats_unique":"...","official_url":"...","benefit_value":"..."}]`;
  } else {
    // Region-level: adapted queries for any geographic entity
    const parentContext = entity.parentStateName
      ? ` (in ${entity.parentStateName})`
      : "";

    federalPrompt = `What senior benefit programs serve people in ${entity.name}${parentContext}? Include:
- Federal programs available in this area (Medicaid, Medicare Savings, SNAP, LIHEAP, PACE, etc.) — use the local name if the program has one
- State-level programs that serve this area
- Any programs with specific offices, providers, or service areas in ${entity.name}

For each, give: name (as used locally), what_it_does (2 sentences), who_its_for, official_url, benefit_value, geographic_notes (any specifics about how this program operates in ${entity.name}).

Return as a JSON array: [{"name":"...","what_it_does":"...","who_its_for":"...","official_url":"...","benefit_value":"...","geographic_notes":"..."}]`;

    localPrompt = `What senior benefit programs are specific to ${entity.name}${parentContext}? I'm looking for:
- County-specific programs or services
- Local Area Agency on Aging programs
- City or municipal senior services
- Regional nonprofits serving seniors
- Local transportation programs for seniors
- Community-based programs unique to ${entity.name}

NOT state-wide programs unless they have a ${entity.name}-specific version or office.

For each, give: name, what_it_does (2 sentences), who_its_for, whats_unique, official_url, benefit_value.

Return as a JSON array: [{"name":"...","what_it_does":"...","who_its_for":"...","whats_unique":"...","official_url":"...","benefit_value":"..."}]`;
  }

  console.log(`  Query 1: ${entity.isState ? "Federal" : "General"} programs in ${entity.name}...`);
  const fedResponse = await perplexityChat(federalPrompt, 0.2);
  const fedPrograms = extractJson(fedResponse) || [];
  console.log(`  Found ${fedPrograms.length} programs`);

  console.log(`  Query 2: ${entity.isState ? entity.name + "-unique" : "Local"} programs...`);
  const localResponse = await perplexityChat(localPrompt, 0.2);
  const localPrograms = extractJson(localResponse) || [];
  console.log(`  Found ${localPrograms.length} local programs`);

  // Merge and deduplicate with semantic normalization
  const allDiscovered = [...fedPrograms, ...localPrograms];
  const programs = deduplicatePrograms(allDiscovered, entity.name);

  if (!programs.length) {
    console.log(`  ERROR: No programs found. Raw response: ${fedResponse.slice(0, 300)}`);
    return { programs: [], raw: fedResponse };
  }

  console.log(`\n  Total unique programs: ${programs.length}\n`);
  for (const p of programs) {
    console.log(`  • ${(p.name || "?").slice(0, 60)}`);
    console.log(`    ${(p.what_it_does || "").slice(0, 100)}`);
    console.log();
  }

  return {
    entity: entity.name,
    entitySlug: entity.slug,
    state: entity.stateCode,
    stateName: entity.isState ? entity.name : entity.parentStateName,
    isRegion: !entity.isState,
    exploredAt: new Date().toISOString(),
    programCount: programs.length,
    programs,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 2: DEEP DIVE — What data matters for each program?
// ═══════════════════════════════════════════════════════════════════════════

async function phaseDive(entity, exploreData) {
  const stateName = entity.name; // used throughout prompts
  console.log(`\n  ━━━ DEEP DIVE: What matters for each program? ━━━\n`);

  const programs = exploreData?.programs || [];
  if (!programs.length) {
    console.log(`  No programs to dive into. Run explore first.`);
    return null;
  }

  console.log(`  Diving into ${programs.length} programs...\n`);
  const results = [];

  for (let i = 0; i < programs.length; i++) {
    const prog = programs[i];
    const name = prog.name || `Program ${i + 1}`;

    process.stdout.write(`  [${i + 1}/${programs.length}] ${name.slice(0, 50).padEnd(50)} ${cost.summary()}\r`);

    const prompt = `I'm building a comprehensive guide to "${name}" in ${stateName} for families trying to determine if their elderly loved one qualifies and how to apply.

Tell me everything a family needs to know. Don't use a generic template — tell me what's SPECIFIC to this program:

1. ELIGIBILITY: What are the exact requirements? If there are income limits, give the actual dollar amounts. If they vary by household size, give the full table. If there are asset limits, explain what counts and what's exempt. If there's an age requirement, state it.

2. WHAT YOU GET: What does this program actually provide? Be specific — not "healthcare services" but the actual services. If there's a dollar amount or hours per week, state it. If it varies by tier or priority level, explain how.

3. HOW TO APPLY: Step by step. Include the actual phone number to call, the actual website URL to visit, the actual form name/number if there is one. Include multiple application routes if they exist (online, phone, mail, in-person).

4. HOW LONG IT TAKES: Processing time, waitlist, any regional variation in wait times.

5. DOCUMENTS NEEDED: What should someone bring or prepare?

6. REGIONAL VARIATIONS: Does this program work differently in different parts of ${stateName}? Different providers, different offices, different wait times by region?

7. WHAT MAKES THIS DIFFERENT: If someone is comparing this to similar programs, what would they need to know? What's the gotcha or the thing people miss?

Return as JSON:
{
  "name": "${name}",
  "eligibility": {
    "age": <number or null>,
    "income_limits": <describe the full picture — single, couple, household table if applicable>,
    "asset_limits": <describe if applicable, including what counts and what's exempt>,
    "other_requirements": [<list any other requirements>]
  },
  "benefits": {
    "type": "<financial|service|in_kind|advocacy|employment>",
    "value": "<specific dollar amounts, hours, or services>",
    "varies_by": "<household_size|priority_tier|region|fixed|not_applicable>"
  },
  "application": {
    "methods": [<list: online URL, phone number, mail address, in-person office>],
    "processing_time": "<specific timeline>",
    "waitlist": "<description or null>",
    "forms": [<specific form names/numbers>],
    "documents": [<what to bring>]
  },
  "geography": {
    "statewide": <true|false>,
    "restrictions": "<county/region restrictions if any>",
    "regional_variations": "<how it differs by region, or null>",
    "offices_or_providers": [<specific locations if limited>]
  },
  "official_source": "<primary .gov URL>",
  "gotchas": [<things people miss, common mistakes, important caveats>],
  "data_shape_notes": "<what makes this program's data structure unique — e.g., 'benefits scale by household size', 'only available at 3 centers', 'no income test', 'county-restricted'>"
}`;

    try {
      const response = await perplexityChat(prompt);
      const parsed = extractJson(response);

      if (parsed) {
        parsed._raw = response;
        results.push(parsed);
      } else {
        results.push({
          name,
          _parseError: true,
          _raw: response,
        });
        console.log(`\n  WARN: Could not parse response for "${name}"`);
      }
    } catch (err) {
      results.push({
        name,
        _error: err.message,
      });
      console.log(`\n  ERROR: "${name}": ${err.message}`);
    }
  }

  console.log(`\n\n  Completed deep dive on ${results.length} programs`);
  console.log(`  Parsed: ${results.filter((r) => !r._parseError && !r._error).length}`);
  console.log(`  Parse errors: ${results.filter((r) => r._parseError).length}`);
  console.log(`  Errors: ${results.filter((r) => r._error).length}`);

  return {
    state: stateCode,
    stateName,
    diveAt: new Date().toISOString(),
    total: results.length,
    parsed: results.filter((r) => !r._parseError && !r._error).length,
    programs: results,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 3: COMPARE — Cross-reference with existing data
// ═══════════════════════════════════════════════════════════════════════════

function phaseCompare(entity, diveData, existingPrograms) {
  const stateCode = entity.stateCode;
  const stateName = entity.name;
  console.log(`\n  ━━━ COMPARE: What's different from our data? ━━━\n`);

  const divePrograms = diveData?.programs?.filter((p) => !p._error && !p._parseError) || [];
  if (!divePrograms.length) {
    console.log(`  No dive data to compare.`);
    return null;
  }

  console.log(`  Comparing ${divePrograms.length} explored programs against ${existingPrograms.length} existing...\n`);

  const comparisons = [];

  for (const explored of divePrograms) {
    const name = explored.name || "Unknown";
    const nameLower = name.toLowerCase();

    // Find matching existing program using normalized names
    const normExplored = normalizeForMatch(name, stateName);
    const existing = existingPrograms.find((e) => {
      const normExisting = normalizeForMatch(e.name, stateName);
      return normExisting === normExplored ||
        normExisting.includes(normExplored) ||
        normExplored.includes(normExisting) ||
        // Also check direct substring on original names
        e.name.toLowerCase().includes(nameLower.slice(0, 20)) ||
        nameLower.includes(e.name.toLowerCase().slice(0, 20));
    });

    const diffs = [];
    const novelFields = [];

    if (existing) {
      // Compare eligibility
      const exploredAge = explored.eligibility?.age;
      const existingAge = existing.eligibilityHighlights
        ?.find((h) => /\d{2}/.test(h))
        ?.match(/(\d{2,3})/)?.[1];

      if (exploredAge && existingAge && String(exploredAge) !== existingAge) {
        diffs.push({
          field: "min_age",
          ours: existingAge,
          found: String(exploredAge),
          source: explored.official_source,
        });
      }

      // Compare income limits
      const exploredIncome = explored.eligibility?.income_limits;
      if (exploredIncome && typeof exploredIncome === "string" && exploredIncome.includes("$")) {
        const existingIncome = existing.eligibilityHighlights
          ?.find((h) => h.includes("$"))
          ?.match(/\$([\d,]+)/)?.[1];
        const foundIncome = exploredIncome.match(/\$([\d,]+)/)?.[1];

        if (existingIncome && foundIncome && existingIncome !== foundIncome) {
          diffs.push({
            field: "income_limit",
            ours: `$${existingIncome}`,
            found: `$${foundIncome}`,
            source: explored.official_source,
          });
        }
      }

      // Compare savings/benefit value
      if (explored.benefits?.value && existing.savingsRange) {
        if (explored.benefits.value !== existing.savingsRange) {
          diffs.push({
            field: "benefit_value",
            ours: existing.savingsRange,
            found: explored.benefits.value,
            source: explored.official_source,
          });
        }
      }

      // Note source URL status
      if (!existing.sourceUrl && explored.official_source) {
        diffs.push({
          field: "source_url",
          ours: "MISSING",
          found: explored.official_source,
        });
      }

      // Check for data our model doesn't capture
      if (explored.eligibility?.asset_limits) {
        novelFields.push({
          field: "asset_limits",
          value: explored.eligibility.asset_limits,
          note: "Our model has no asset limit fields",
        });
      }

      if (explored.benefits?.varies_by === "household_size") {
        novelFields.push({
          field: "household_size_table",
          value: explored.eligibility?.income_limits,
          note: "Benefits/eligibility vary by household size — we store a single number",
        });
      }

      if (explored.geography?.regional_variations) {
        novelFields.push({
          field: "regional_variations",
          value: explored.geography.regional_variations,
          note: "Program varies by region — our model doesn't capture this",
        });
      }

      if (explored.application?.waitlist) {
        novelFields.push({
          field: "waitlist",
          value: explored.application.waitlist,
          note: "Has waitlist info — our model has no wait time field",
        });
      }

      if (explored.application?.documents?.length > 0) {
        novelFields.push({
          field: "documents_required",
          value: explored.application.documents,
          note: "Has document checklist — our model doesn't store per-program documents",
        });
      }
    }

    comparisons.push({
      name,
      isNew: !existing,
      existingId: existing?.id || null,
      existingVerified: existing?.lastVerifiedDate || null,
      diffsFound: diffs.length,
      diffs,
      novelFields,
      dataShapeNotes: explored.data_shape_notes || null,
      gotchas: explored.gotchas || [],
      benefitType: explored.benefits?.type || "unknown",
      benefitVariesBy: explored.benefits?.varies_by || null,
      officialSource: explored.official_source || null,
    });
  }

  // Summary
  const newPrograms = comparisons.filter((c) => c.isNew);
  const withDiffs = comparisons.filter((c) => c.diffsFound > 0);
  const withNovelFields = comparisons.filter((c) => c.novelFields.length > 0);

  console.log(`  New programs not in our data: ${newPrograms.length}`);
  console.log(`  Programs with data discrepancies: ${withDiffs.length}`);
  console.log(`  Programs with data our model can't capture: ${withNovelFields.length}`);

  if (withDiffs.length > 0) {
    console.log(`\n  Data discrepancies:`);
    for (const c of withDiffs) {
      for (const d of c.diffs) {
        console.log(`    ${c.name}: ${d.field} — ours: ${d.ours} → found: ${d.found}`);
      }
    }
  }

  // Collect all novel field types across programs
  const novelFieldSummary = {};
  for (const c of comparisons) {
    for (const nf of c.novelFields) {
      if (!novelFieldSummary[nf.field]) {
        novelFieldSummary[nf.field] = { count: 0, programs: [], note: nf.note };
      }
      novelFieldSummary[nf.field].count++;
      novelFieldSummary[nf.field].programs.push(c.name);
    }
  }

  if (Object.keys(novelFieldSummary).length > 0) {
    console.log(`\n  Data fields our model doesn't capture:`);
    for (const [field, info] of Object.entries(novelFieldSummary)) {
      console.log(`    ${field} (${info.count} programs): ${info.note}`);
    }
  }

  // Collect benefit types and variation patterns
  const benefitTypes = {};
  const variationPatterns = {};
  for (const c of comparisons) {
    benefitTypes[c.benefitType] = (benefitTypes[c.benefitType] || 0) + 1;
    if (c.benefitVariesBy) {
      variationPatterns[c.benefitVariesBy] = (variationPatterns[c.benefitVariesBy] || 0) + 1;
    }
  }

  console.log(`\n  Benefit types found: ${JSON.stringify(benefitTypes)}`);
  console.log(`  Variation patterns: ${JSON.stringify(variationPatterns)}`);

  return {
    state: stateCode,
    stateName,
    comparedAt: new Date().toISOString(),
    total: comparisons.length,
    newPrograms: newPrograms.length,
    withDiffs: withDiffs.length,
    withNovelFields: withNovelFields.length,
    benefitTypes,
    variationPatterns,
    novelFieldSummary,
    comparisons,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 4: CLASSIFY — Determine program type, geographic scope, complexity
// ═══════════════════════════════════════════════════════════════════════════

function phaseClassify(entity, diveData, compareData) {
  const stateCode = entity.stateCode;
  const stateName = entity.name;
  console.log(`\n  ━━━ CLASSIFY: What kind of program is each one? ━━━\n`);

  const divePrograms = diveData?.programs?.filter((p) => !p._error && !p._parseError) || [];
  if (!divePrograms.length) {
    console.log(`  No dive data to classify.`);
    return null;
  }

  const comparisons = compareData?.comparisons || [];
  const results = [];

  for (const prog of divePrograms) {
    const name = (prog.name || "Unknown").toLowerCase();
    const compare = comparisons.find((c) => c.name === prog.name);
    const benefitType = prog.benefits?.type || compare?.benefitType || "unknown";
    const geo = prog.geography || {};
    const app = prog.application || {};
    const elig = prog.eligibility || {};

    // ── Program Type ──
    let programType = "benefit";

    // Resources: advocacy/information services with no financial qualification
    // Exclude known benefit keywords to avoid misclassifying programs with missing elig data
    const hasBenefitKeywords = /medicaid|waiver|snap|liheap|energy|weatherization|pace|medicare|home help|home care|respite|meals/i.test(prog.name || "");
    const isResource =
      benefitType === "advocacy" ||
      (!elig.income_limits && !elig.asset_limits && !elig.age && !hasBenefitKeywords) ||
      /ombudsman|legal|hotline|counseling|information|advocacy/i.test(prog.name || "") ||
      (prog.benefits?.value && /free|no cost|confidential|advocacy/i.test(prog.benefits.value) && !hasBenefitKeywords);

    // Navigators: help access OTHER programs
    const isNavigator =
      /micafe|211|area agency|aging.*disability.*resource|adrc/i.test(name) ||
      (prog.data_shape_notes && /assist.*apply|help.*access|connect.*program/i.test(prog.data_shape_notes));

    // Employment
    const isEmployment = benefitType === "employment" || /scsep|employment|job training/i.test(name);

    if (isNavigator) programType = "navigator";
    else if (isEmployment) programType = "employment";
    else if (isResource) programType = "resource";
    else programType = "benefit";

    // ── Geographic Scope ──
    const localEntities = [];
    const offices = geo.offices_or_providers || [];

    if (Array.isArray(offices)) {
      for (const o of offices) {
        if (typeof o === "string") {
          localEntities.push({ name: o, type: "service-area" });
        } else if (o && typeof o === "object") {
          localEntities.push({
            name: o.name || o.location || String(o),
            type: o.type || "service-area",
            phone: o.phone,
            address: o.address,
            url: o.url,
          });
        }
      }
    }

    let geoType = "state";
    const isFederal = /snap|medicare|liheap|weatherization|scsep|ombudsman|meals on wheels|ship/i.test(name);
    const isLocal = !geo.statewide && (
      geo.restrictions ||
      localEntities.length > 0 ||
      /county|region|service area|only available in/i.test(geo.regional_variations || "") ||
      /county|region|limited/i.test(geo.restrictions || "")
    );

    if (isFederal) geoType = "federal";
    else if (isLocal) geoType = "local";

    const geographicScope = {
      type: geoType,
      stateVariation: geoType === "federal",
      localEntities: localEntities.length > 0 ? localEntities : undefined,
    };

    // ── Complexity ──
    let complexity = "medium";

    const hasIncomeTiers = elig.income_limits && (
      typeof elig.income_limits === "object" ||
      /household|tier|level|qmb|slmb/i.test(String(elig.income_limits))
    );
    const hasAssetLimits = !!elig.asset_limits;
    const hasRegionalVariation = !!geo.regional_variations;
    const hasFunctionalReq = elig.other_requirements?.some((r) =>
      /nursing facility|level of care|functional|assessment|locd/i.test(r)
    );
    const hasMultipleTiers = prog.benefits?.varies_by === "priority_tier" ||
      /qmb.*slmb|tier|level/i.test(String(prog.benefits?.value || ""));

    const complexitySignals = [hasIncomeTiers, hasAssetLimits, hasRegionalVariation, hasFunctionalReq, hasMultipleTiers].filter(Boolean).length;

    if (programType === "resource" || programType === "navigator") {
      complexity = "simple";
    } else if (complexitySignals >= 3) {
      complexity = "deep";
    } else if (complexitySignals >= 1) {
      complexity = "medium";
    } else {
      complexity = "simple";
    }

    // ── Recommended Content Sections ──
    const contentSectionTypes = [];

    if (programType === "benefit") {
      contentSectionTypes.push("prose"); // intro/overview
      if (hasIncomeTiers) contentSectionTypes.push("income-table");
      if (hasAssetLimits) contentSectionTypes.push("what-counts");
      if (hasMultipleTiers) contentSectionTypes.push("tier-comparison");
      if (app.documents?.length > 0) contentSectionTypes.push("documents");
      if (localEntities.length > 0 || offices.length > 0) contentSectionTypes.push("county-directory");
      if (app.waitlist) contentSectionTypes.push("callout");
    } else if (programType === "resource") {
      contentSectionTypes.push("prose");
      if (localEntities.length > 0) contentSectionTypes.push("county-directory");
    } else if (programType === "navigator") {
      contentSectionTypes.push("prose");
      contentSectionTypes.push("provider-list");
    } else if (programType === "employment") {
      contentSectionTypes.push("prose");
      if (hasIncomeTiers) contentSectionTypes.push("income-table");
      if (app.documents?.length > 0) contentSectionTypes.push("documents");
    }

    results.push({
      name: prog.name,
      programType,
      geographicScope,
      complexity,
      recommendedSections: contentSectionTypes,
      signals: {
        benefitType,
        hasIncomeTiers,
        hasAssetLimits,
        hasRegionalVariation,
        hasFunctionalReq,
        hasMultipleTiers,
        isStatewide: geo.statewide,
      },
    });

    console.log(`  ${prog.name.slice(0, 45).padEnd(45)} → ${programType.padEnd(10)} ${geoType.padEnd(8)} ${complexity}`);
  }

  // Summary
  const types = {};
  const scopes = {};
  const complexities = {};
  for (const r of results) {
    types[r.programType] = (types[r.programType] || 0) + 1;
    scopes[r.geographicScope.type] = (scopes[r.geographicScope.type] || 0) + 1;
    complexities[r.complexity] = (complexities[r.complexity] || 0) + 1;
  }

  console.log(`\n  Types: ${JSON.stringify(types)}`);
  console.log(`  Scopes: ${JSON.stringify(scopes)}`);
  console.log(`  Complexity: ${JSON.stringify(complexities)}`);

  return {
    state: stateCode,
    stateName,
    classifiedAt: new Date().toISOString(),
    total: results.length,
    typeSummary: types,
    scopeSummary: scopes,
    complexitySummary: complexities,
    programs: results,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 5: DRAFT — Generate page content for each program
// ═══════════════════════════════════════════════════════════════════════════

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

async function claudeChat(prompt, maxTokens = 4096) {
  await rateLimiter.wait();

  const resp = await fetchWithRetry("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Claude ${resp.status}: ${text.slice(0, 200)}`);
  }

  const json = await resp.json();
  return json.content?.[0]?.text || "";
}

const CONTENT_VOICE_PROMPT = `You are writing benefit program page content for Olera, a senior care platform. Your audience is family caregivers — adult children helping aging parents navigate government programs.

VOICE PRINCIPLES (non-negotiable):
1. Lead with the caregiver's need, not the program definition. Not "SNAP is a federal nutrition program." Instead: "If your parent is 60+ and on a fixed income, they may qualify for $100–300/month toward groceries."
2. Use causal chains. "Because PACE covers all medical care under one program, your parent won't need to coordinate between separate providers — one team manages everything."
3. Specific evidence immediately after claims. Don't say "income limits apply." Say "Income limit: $2,152/month for a single person (2026)."
4. Clarify jargon inline in parentheses. "Must meet Nursing Facility Level of Care (a clinical assessment of whether your parent needs daily help with bathing, dressing, or medication management)."
5. End sections with the next step. "Call 800-252-2412. No application needed."
6. No hedging, no filler, no bureaucratic language. "You cannot use SNAP for alcohol or tobacco" not "Please note that certain items may not be eligible for purchase."
7. Honest about unknowns. If savings can't be verified, say so. Fewer honest facts beat more generic claims.
8. Write for someone who is stressed, time-pressed, and may be reading on their phone. Short paragraphs. Clear hierarchy.`;

async function phaseDraft(entity, diveData, classifyData) {
  const stateCode = entity.stateCode;
  const stateName = entity.name;
  console.log(`\n  ━━━ DRAFT: Generating page content ━━━\n`);

  if (!ANTHROPIC_API_KEY) {
    console.log(`  WARN: ANTHROPIC_API_KEY not set. Skipping draft phase.`);
    console.log(`  Set it in .env.local to enable content generation.`);
    return null;
  }

  const divePrograms = diveData?.programs?.filter((p) => !p._error && !p._parseError) || [];
  const classifications = classifyData?.programs || [];

  if (!divePrograms.length) {
    console.log(`  No dive data to draft from.`);
    return null;
  }

  console.log(`  Drafting ${divePrograms.length} programs...\n`);
  const results = [];

  for (let i = 0; i < divePrograms.length; i++) {
    const prog = divePrograms[i];
    const classification = classifications.find((c) => c.name === prog.name) || {};
    const name = prog.name || `Program ${i + 1}`;

    process.stdout.write(`  [${i + 1}/${divePrograms.length}] ${name.slice(0, 50).padEnd(50)}\r`);

    const programType = classification.programType || "benefit";
    const complexity = classification.complexity || "medium";
    const sections = classification.recommendedSections || ["prose"];

    // Build the prompt with all research data
    const draftPrompt = `${CONTENT_VOICE_PROMPT}

You are drafting the page content for "${name}" in ${stateName}. This is a ${programType} program with ${complexity} complexity.

Here is everything we know from research:
${JSON.stringify({ ...prog, _raw: undefined }, null, 2)}

Classification: ${JSON.stringify(classification, null, 2)}

Generate the complete page content as a JSON object matching this exact structure:

{
  "id": "<kebab-case slug, e.g., 'michigan-snap-food-benefits'>",
  "name": "${name}",
  "shortName": "<2-4 word abbreviated name>",
  "tagline": "<one compelling sentence for browse cards — what this means for the caregiver, not a definition>",
  "programType": "${programType}",
  "complexity": "${complexity}",
  "geographicScope": ${JSON.stringify(classification.geographicScope || { type: "state" })},
  "intro": "<2-3 paragraph introduction. Lead with what this means for the caregiver's parent. Be specific about what the program provides and who it's for. Include key numbers.>",
  "savingsRange": "<'$X – $Y/year in 2026' format from research, or empty string '' for free services>",
  "savingsSource": "<where the savings number comes from, or 'Free service' for resources>",
  "savingsVerified": <true if we have specific dollar amounts from official sources, false otherwise>,

  "structuredEligibility": {
    "summary": [<3-5 short bullet strings for browse cards, e.g., "Age 60+", "Income below $2,152/month">],
    "ageRequirement": "<e.g., '55+' or '60+' or null>",
    "incomeTable": [<{"householdSize": N, "monthlyLimit": N} for each row if household-size-based, or null>],
    "assetLimits": <{"individual": N, "couple": N, "countedAssets": [...], "exemptAssets": [...], "homeEquityCap": N} or null>,
    "functionalRequirement": "<plain-English explanation if there's a functional/clinical assessment requirement, or null>",
    "otherRequirements": [<any other requirements as clear strings>],
    "povertyLevelReference": "<e.g., '200% FPL' if relevant, or null>"
  },

  "applicationGuide": {
    "method": "<online|phone|mail|in-person|multiple>",
    "summary": "<one sentence: the simplest way to apply and how long it takes>",
    "steps": [<{"step": N, "title": "...", "description": "..."} — program-specific, not generic>],
    "processingTime": "<specific timeline from research>",
    "waitlist": "<specific waitlist info or null>",
    "tip": "<one practical tip for the caregiver, or null>",
    "urls": [<{"label": "...", "url": "..."} — actual application URLs from research>]
  },

  "contentSections": ${JSON.stringify((() => {
      const sectionExamples = [];
      if (sections.includes("income-table")) sectionExamples.push({ type: "income-table", heading: "Income Limits by Household Size", rows: ["...IncomeRow objects..."], footnote: "<year/source>" });
      if (sections.includes("what-counts")) sectionExamples.push({ type: "what-counts", heading: "Asset Limits: What Counts", included: ["...counted assets..."], excluded: ["...exempt assets..."] });
      if (sections.includes("tier-comparison")) sectionExamples.push({ type: "tier-comparison", heading: "Program Tiers", tiers: [{ name: "...", description: "...", incomeLimit: "...", coverage: "..." }] });
      if (sections.includes("county-directory")) sectionExamples.push({ type: "county-directory", heading: "Local Offices", offices: [{ name: "...", type: "county or service-area", phone: "...", address: "..." }] });
      if (sections.includes("documents")) sectionExamples.push({ type: "documents", heading: "What to Bring", categories: [{ name: "Identity", items: ["..."] }, { name: "Financial", items: ["..."] }] });
      if (prog.application?.waitlist) sectionExamples.push({ type: "callout", tone: "warning", text: "<waitlist/timing warning from research>" });
      if (prog.gotchas?.length > 0) sectionExamples.push({ type: "callout", tone: "tip", text: "<most important gotcha as practical tip>" });
      return sectionExamples;
    })(), null, 4)},

  "faqs": [
    <4-6 FAQs that a real caregiver would ask. Not "What is this program?" but "Can Mom keep her house if she qualifies?" or "What if her income is just over the limit?". Question and answer format: {"question": "...", "answer": "..."}>
  ],

  "phone": "<primary contact phone from research or null>",
  "sourceUrl": "<primary official .gov URL>",
  "contentStatus": "pipeline-draft",
  "draftedAt": "${new Date().toISOString().split("T")[0]}"
}

CRITICAL RULES:
- Every number must come from the research data. Do not invent figures.
- If the research doesn't have a specific data point, use null — don't fabricate.
- Savings range must be empty string "" for free services (resources, navigators).
- Application steps must be specific to THIS program, not generic.
- FAQs should address real concerns a caregiver would have about THIS specific program.
- Content sections array should only include sections where you have real data to populate them.
- Return ONLY the JSON object, no markdown wrapping.`;

    // Deep programs with many content sections need more tokens
    const tokenLimit = complexity === "deep" ? 6144 : complexity === "medium" ? 4096 : 3072;

    try {
      const response = await claudeChat(draftPrompt, tokenLimit);
      const parsed = extractJson(response);

      if (parsed) {
        // Ensure required fields
        parsed.programType = parsed.programType || programType;
        parsed.complexity = parsed.complexity || complexity;
        parsed.geographicScope = parsed.geographicScope || classification.geographicScope;
        parsed.contentStatus = "pipeline-draft";
        parsed.draftedAt = new Date().toISOString().split("T")[0];
        results.push(parsed);
      } else {
        results.push({
          name,
          _parseError: true,
          _raw: response.slice(0, 500),
        });
        console.log(`\n  WARN: Could not parse draft for "${name}"`);
      }
    } catch (err) {
      results.push({
        name,
        _error: err.message,
      });
      console.log(`\n  ERROR drafting "${name}": ${err.message}`);
    }
  }

  const successful = results.filter((r) => !r._parseError && !r._error);
  console.log(`\n\n  Drafted ${successful.length}/${divePrograms.length} programs`);
  console.log(`  Parse errors: ${results.filter((r) => r._parseError).length}`);
  console.log(`  Errors: ${results.filter((r) => r._error).length}`);

  // Generate state-level overview content
  let stateOverview = null;
  if (successful.length > 0) {
    console.log(`\n  Generating state overview for ${stateName}...`);

    const programSummaries = successful.map((p) =>
      `- ${p.name} (${p.programType}): ${p.tagline}`
    ).join("\n");

    const typeCounts = {};
    for (const p of successful) {
      typeCounts[p.programType || "benefit"] = (typeCounts[p.programType || "benefit"] || 0) + 1;
    }

    const statePrompt = `${CONTENT_VOICE_PROMPT}

You are writing the state overview page for ${stateName}'s senior benefit programs. This is the landing page a caregiver sees before diving into individual programs.

Here are the ${successful.length} programs we've researched:
${programSummaries}

Program type breakdown: ${JSON.stringify(typeCounts)}

Generate the state overview as a JSON object:

{
  "intro": "<2-3 paragraphs. Lead with what a caregiver in ${stateName} needs to know. How many programs are available? What's the range of help — from financial benefits to free resources? Be specific about ${stateName}, not generic. End with a clear 'here's how to start' direction.>",
  "startHere": [
    <3-4 objects: the most impactful programs a caregiver should look at first. Each: {"name": "...", "programId": "<matching id from the drafts>", "why": "<one sentence: why start here>"}>
  ],
  "byNeed": [
    <4-6 objects grouping programs by caregiver need, not bureaucratic category. Each: {"need": "<plain language need, e.g., 'Help paying for home care', 'Food assistance', 'Free advice and advocacy'>", "programs": ["program name 1", "program name 2"], "description": "<one sentence explaining this group>"}>
  ],
  "quickFacts": [
    <3-4 strings: state-specific facts that orient the caregiver. E.g., "Michigan uses MI Bridges (newmibridges.michigan.gov) for most benefit applications" or "Most programs require income below $2,901/month for a single person">
  ],
  "resourcesVsBenefits": "<one paragraph explaining the difference between qualification-based benefits and free resources available to everyone, using specific ${stateName} examples>"
}

CRITICAL: Use only information from the researched programs. Do not invent programs or facts. Return ONLY the JSON object.`;

    try {
      const response = await claudeChat(statePrompt, 4096);
      stateOverview = extractJson(response);
      if (stateOverview) {
        console.log(`  State overview generated: ${stateOverview.startHere?.length || 0} start-here picks, ${stateOverview.byNeed?.length || 0} need groups`);
      } else {
        console.log(`  WARN: Could not parse state overview`);
      }
    } catch (err) {
      console.log(`  ERROR generating state overview: ${err.message}`);
    }
  }

  return {
    state: stateCode,
    stateName,
    draftedAt: new Date().toISOString(),
    total: results.length,
    successful: successful.length,
    programs: results,
    stateOverview,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 6: REPORT — Human-readable markdown
// ═══════════════════════════════════════════════════════════════════════════

function phaseReport(entity, exploreData, diveData, compareData, classifyData, draftData) {
  const stateCode = entity.stateCode || entity.dirName;
  const stateName = entity.name;
  console.log(`\n  ━━━ REPORT: Generating markdown report ━━━\n`);

  const lines = [];
  const ln = (s = "") => lines.push(s);

  ln(`# ${stateName} Benefits Exploration Report`);
  ln();
  ln(`> Generated ${new Date().toISOString().split("T")[0]} by benefits-pipeline.js`);
  ln(`> Cost: ${cost.summary()}`);
  ln();
  ln(`---`);
  ln();

  // Summary
  ln(`## Summary`);
  ln();
  ln(`| Metric | Value |`);
  ln(`|--------|-------|`);
  ln(`| Programs discovered | ${exploreData?.programCount || "?"} |`);
  ln(`| Programs deep-dived | ${diveData?.parsed || "?"} |`);
  if (compareData) {
    ln(`| New (not in our data) | ${compareData.newPrograms} |`);
    ln(`| Data discrepancies | ${compareData.withDiffs} |`);
    ln(`| Fields our model can't capture | ${compareData.withNovelFields} |`);
  }
  ln();

  // Data model gaps
  if (compareData?.novelFieldSummary && Object.keys(compareData.novelFieldSummary).length > 0) {
    ln(`## Data Model Gaps`);
    ln();
    ln(`These data fields appeared across programs but don't exist in our current model:`);
    ln();
    ln(`| Field | Programs | Note |`);
    ln(`|-------|----------|------|`);
    for (const [field, info] of Object.entries(compareData.novelFieldSummary)) {
      ln(`| \`${field}\` | ${info.count} | ${info.note} |`);
    }
    ln();
  }

  // Benefit type distribution
  if (compareData?.benefitTypes) {
    ln(`## Program Types`);
    ln();
    for (const [type, count] of Object.entries(compareData.benefitTypes)) {
      ln(`- **${type}**: ${count} programs`);
    }
    ln();
  }

  // Data discrepancies
  if (compareData?.comparisons?.filter((c) => c.diffsFound > 0).length > 0) {
    ln(`## Data Discrepancies`);
    ln();
    ln(`Our data differs from what official sources say:`);
    ln();
    for (const c of compareData.comparisons.filter((c) => c.diffsFound > 0)) {
      ln(`### ${c.name}`);
      ln();
      for (const d of c.diffs) {
        ln(`- **${d.field}**: Ours says \`${d.ours}\` → Source says \`${d.found}\`${d.source ? ` ([source](${d.source}))` : ""}`);
      }
      ln();
    }
  }

  // New programs
  const newProgs = compareData?.comparisons?.filter((c) => c.isNew) || [];
  if (newProgs.length > 0) {
    ln(`## New Programs (Not in Our Data)`);
    ln();
    for (const c of newProgs) {
      ln(`- **${c.name}** — ${c.benefitType}${c.officialSource ? ` ([source](${c.officialSource}))` : ""}`);
      if (c.dataShapeNotes) ln(`  - Shape notes: ${c.dataShapeNotes}`);
    }
    ln();
  }

  // Per-program details
  ln(`## Program Details`);
  ln();

  const divePrograms = diveData?.programs?.filter((p) => !p._error && !p._parseError) || [];
  for (const prog of divePrograms) {
    const compare = compareData?.comparisons?.find(
      (c) => c.name === prog.name
    );

    ln(`### ${prog.name || "Unknown"}`);
    ln();

    if (compare?.isNew) ln(`> **NEW** — not currently in our data`);
    if (compare?.existingVerified) ln(`> Last verified: ${compare.existingVerified}`);
    ln();

    // Eligibility
    if (prog.eligibility) {
      ln(`**Eligibility:**`);
      if (prog.eligibility.age) ln(`- Age: ${prog.eligibility.age}+`);
      if (prog.eligibility.income_limits) {
        const inc = prog.eligibility.income_limits;
        ln(`- Income: ${typeof inc === "string" ? inc : JSON.stringify(inc)}`);
      }
      if (prog.eligibility.asset_limits) {
        const ast = prog.eligibility.asset_limits;
        ln(`- Assets: ${typeof ast === "string" ? ast : JSON.stringify(ast)}`);
      }
      if (prog.eligibility.other_requirements?.length > 0) {
        for (const r of prog.eligibility.other_requirements) {
          ln(`- ${r}`);
        }
      }
      ln();
    }

    // Benefits
    if (prog.benefits) {
      ln(`**Benefits:** ${prog.benefits.value || "N/A"}`);
      if (prog.benefits.varies_by && prog.benefits.varies_by !== "not_applicable") {
        ln(`- Varies by: ${prog.benefits.varies_by}`);
      }
      ln();
    }

    // Application
    if (prog.application) {
      if (prog.application.methods?.length > 0) {
        ln(`**How to apply:**`);
        for (const m of prog.application.methods) {
          ln(`- ${m}`);
        }
        ln();
      }
      if (prog.application.processing_time) {
        ln(`**Timeline:** ${prog.application.processing_time}`);
      }
      if (prog.application.waitlist) {
        ln(`**Waitlist:** ${prog.application.waitlist}`);
      }
      ln();
    }

    // Gotchas
    if (prog.gotchas?.length > 0) {
      ln(`**Watch out for:**`);
      for (const g of prog.gotchas) ln(`- ${g}`);
      ln();
    }

    // Data shape
    if (prog.data_shape_notes) {
      ln(`**Data shape:** ${prog.data_shape_notes}`);
      ln();
    }

    // Novel fields
    if (compare?.novelFields?.length > 0) {
      ln(`**Our model can't capture:**`);
      for (const nf of compare.novelFields) ln(`- \`${nf.field}\`: ${nf.note}`);
      ln();
    }

    if (prog.official_source) {
      ln(`**Source:** ${prog.official_source}`);
      ln();
    }

    ln(`---`);
    ln();
  }

  // Classification summary
  if (classifyData?.programs?.length > 0) {
    ln(`## Program Classification`);
    ln();
    ln(`| Program | Type | Scope | Complexity |`);
    ln(`|---------|------|-------|------------|`);
    for (const c of classifyData.programs) {
      ln(`| ${c.name.slice(0, 40)} | ${c.programType} | ${c.geographicScope?.type || "?"} | ${c.complexity} |`);
    }
    ln();
    ln(`**Types:** ${JSON.stringify(classifyData.typeSummary)}`);
    ln(`**Scopes:** ${JSON.stringify(classifyData.scopeSummary)}`);
    ln(`**Complexity:** ${JSON.stringify(classifyData.complexitySummary)}`);
    ln();
  }

  // Draft summary
  if (draftData?.programs?.length > 0) {
    const successful = draftData.programs.filter((p) => !p._parseError && !p._error);
    ln(`## Content Drafts`);
    ln();
    ln(`Generated ${successful.length} page drafts. Review in admin dashboard or \`data/pipeline/${stateCode}/drafts.json\`.`);
    ln();
    for (const p of successful) {
      ln(`- **${p.name}** (${p.programType}) — ${p.contentSections?.length || 0} content sections, ${p.faqs?.length || 0} FAQs`);
    }
    ln();
  }

  // Learning section
  ln(`## What We Learned`);
  ln();
  ln(`### Patterns Observed`);
  ln();
  if (compareData?.variationPatterns) {
    ln(`How benefits vary across these programs:`);
    for (const [pattern, count] of Object.entries(compareData.variationPatterns)) {
      ln(`- **${pattern}**: ${count} programs`);
    }
    ln();
  }

  ln(`### Data Shape Notes`);
  ln();
  ln(`Unique structural observations from each program:`);
  ln();
  for (const prog of divePrograms) {
    if (prog.data_shape_notes) {
      ln(`- **${prog.name}**: ${prog.data_shape_notes}`);
    }
  }
  ln();

  ln(`### Questions for Chantel's Review`);
  ln();
  ln(`1. Are the data discrepancies above correct? (Our data may be outdated)`);
  ln(`2. For new programs found — are these real programs we should add?`);
  ln(`3. What data fields are we missing that matter most for families?`);
  ln(`4. Are there programs NOT found that should exist in ${stateName}?`);
  ln();

  const report = lines.join("\n");
  writeFile(stateCode, "exploration_report.md", report);

  console.log(`  Report: ${lines.length} lines`);
  return report;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
  const opts = parseArgs();
  const entity = resolveEntity(opts);

  if (!entity) {
    console.error(`  Error: --state or --region required`);
    console.error(`  Examples: --state MI, --region "Miami-Dade County, FL" --parent-state FL`);
    printUsage();
    process.exit(1);
  }

  if (!PERPLEXITY_API_KEY) {
    console.error(`  Error: PERPLEXITY_API_KEY not found in .env.local`);
    process.exit(1);
  }

  const dirName = entity.dirName;
  const shouldRun = (phase) => opts.phase === "all" || opts.phase === phase;

  console.log(`\n  Senior Benefits Pipeline — Content Production System`);
  console.log(`  Entity: ${entity.name}${entity.isState ? ` (${entity.stateCode})` : ""}`);
  console.log(`  Type:   ${entity.isState ? "State" : "Region"}${entity.parentState ? ` (parent: ${entity.parentStateName})` : ""}`);
  console.log(`  Slug:   ${entity.slug}`);
  console.log(`  Phase:  ${opts.phase}`);
  console.log(`  Mode:   ${opts.run ? "EXECUTE" : "DRY RUN"}`);

  // Load existing data for comparison (from parent state if region)
  const compareState = entity.stateCode || entity.parentState;
  const existing = compareState ? loadExistingPrograms(compareState) : [];
  if (existing.length > 0) {
    console.log(`  Existing in waiver-library.ts (${compareState}): ${existing.length} programs`);
  }

  if (!opts.run) {
    console.log(`\n  This is a dry run. To execute, add --run:`);
    if (entity.isState) {
      console.log(`  node scripts/benefits-pipeline.js --state ${entity.stateCode} --run\n`);
    } else {
      console.log(`  node scripts/benefits-pipeline.js --region "${entity.name}"${entity.parentState ? ` --parent-state ${entity.parentState}` : ""} --run\n`);
    }

    if (existing.length > 0) {
      console.log(`  Current programs (${compareState}):`);
      for (const p of existing) {
        const v = p.lastVerifiedDate ? `✓ ${p.lastVerifiedDate}` : "✗ unverified";
        console.log(`    ${p.name.padEnd(55)} ${v}`);
      }
    }

    const estPerplexity = 2 + (existing.length || 10);
    const estClaude = existing.length || 10;
    console.log(`\n  Would make ~${estPerplexity} Perplexity calls (~$${(estPerplexity * 0.005).toFixed(3)})`);
    console.log(`  Would make ~${estClaude} Claude calls for drafts`);
    console.log(`  Output: data/pipeline/${dirName}/`);
    console.log(`    explore.json, dive.json, compare.json, classify.json, drafts.json`);
    console.log(`    exploration_report.md`);
    process.exit(0);
  }

  // ─── Execute ─────────────────────────────────────────────────────────

  let exploreData = readJson(dirName, "explore.json");
  let diveData = readJson(dirName, "dive.json");
  let compareData = readJson(dirName, "compare.json");
  let classifyData = readJson(dirName, "classify.json");
  let draftData = readJson(dirName, "drafts.json");

  if (shouldRun("explore")) {
    exploreData = await phaseExplore(entity);
    writeFile(dirName, "explore.json", exploreData);
  }

  if (shouldRun("dive")) {
    if (!exploreData) exploreData = readJson(dirName, "explore.json");
    if (!exploreData?.programs?.length) {
      console.log(`\n  No explore data. Run: --phase explore --run`);
    } else {
      diveData = await phaseDive(entity, exploreData);
      writeFile(dirName, "dive.json", diveData);
    }
  }

  if (shouldRun("compare")) {
    if (!diveData) diveData = readJson(dirName, "dive.json");
    if (!diveData?.programs?.length) {
      console.log(`\n  No dive data. Run: --phase dive --run`);
    } else {
      compareData = phaseCompare(entity, diveData, existing);
      writeFile(dirName, "compare.json", compareData);
    }
  }

  if (shouldRun("classify")) {
    if (!diveData) diveData = readJson(dirName, "dive.json");
    if (!diveData?.programs?.length) {
      console.log(`\n  No dive data. Run: --phase dive --run`);
    } else {
      if (!compareData) compareData = readJson(dirName, "compare.json");
      classifyData = phaseClassify(entity, diveData, compareData);
      writeFile(dirName, "classify.json", classifyData);
    }
  }

  if (shouldRun("draft")) {
    if (!diveData) diveData = readJson(dirName, "dive.json");
    if (!classifyData) classifyData = readJson(dirName, "classify.json");
    if (!diveData?.programs?.length) {
      console.log(`\n  No dive data. Run: --phase dive --run`);
    } else if (!classifyData?.programs?.length) {
      console.log(`\n  No classify data. Run: --phase classify --run`);
    } else {
      draftData = await phaseDraft(entity, diveData, classifyData);
      writeFile(dirName, "drafts.json", draftData);
    }
  }

  if (shouldRun("report")) {
    if (!exploreData) exploreData = readJson(dirName, "explore.json");
    if (!diveData) diveData = readJson(dirName, "dive.json");
    if (!compareData) compareData = readJson(dirName, "compare.json");
    if (!classifyData) classifyData = readJson(dirName, "classify.json");
    if (!draftData) draftData = readJson(dirName, "drafts.json");
    phaseReport(entity, exploreData, diveData, compareData, classifyData, draftData);
  }

  // Auto-generate pipeline-summary.ts for the admin dashboard
  generatePipelineSummary();

  console.log(`\n  Done. ${cost.summary()}\n`);
}

// ═══════════════════════════════════════════════════════════════════════════
// Auto-generate data/pipeline-summary.ts from all pipeline compare.json files
// ═══════════════════════════════════════════════════════════════════════════

function generatePipelineSummary() {
  const pipelineRoot = path.resolve(__dirname, "..", "data", "pipeline");
  if (!fs.existsSync(pipelineRoot)) return;

  const states = fs.readdirSync(pipelineRoot).filter((d) => {
    return /^[A-Z]{2}$/.test(d) && (
      fs.existsSync(path.join(pipelineRoot, d, "compare.json")) ||
      fs.existsSync(path.join(pipelineRoot, d, "classify.json")) ||
      fs.existsSync(path.join(pipelineRoot, d, "drafts.json"))
    );
  });

  if (!states.length) return;

  const entries = {};
  for (const stateCode of states) {
    const comparePath = path.join(pipelineRoot, stateCode, "compare.json");
    const classifyPath = path.join(pipelineRoot, stateCode, "classify.json");
    const draftsPath = path.join(pipelineRoot, stateCode, "drafts.json");

    const compare = fs.existsSync(comparePath)
      ? JSON.parse(fs.readFileSync(comparePath, "utf-8")) : null;
    const classify = fs.existsSync(classifyPath)
      ? JSON.parse(fs.readFileSync(classifyPath, "utf-8")) : null;
    const drafts = fs.existsSync(draftsPath)
      ? JSON.parse(fs.readFileSync(draftsPath, "utf-8")) : null;

    // Build summary with comparisons that have diffs or novel fields
    const comparisons = (compare?.comparisons || [])
      .filter((c) => c.diffsFound > 0 || (c.novelFields && c.novelFields.length > 0))
      .map((c) => ({
        name: c.name,
        isNew: c.isNew,
        existingId: c.existingId || null,
        diffsFound: c.diffsFound || 0,
        diffs: (c.diffs || []).map((d) => ({
          field: d.field,
          ours: d.ours,
          found: typeof d.found === "string" && d.found.length > 100 ? d.found.slice(0, 100) + "..." : d.found,
          source: d.source || undefined,
        })),
        novelFields: (c.novelFields || []).map((nf) => ({
          field: nf.field,
          note: nf.note,
        })),
      }));

    entries[stateCode] = {
      exploredAt: (compare?.comparedAt || "").split("T")[0],
      programsFound: compare?.total || 0,
      newPrograms: compare?.newPrograms || 0,
      diffsFound: compare?.withDiffs || 0,
      novelFieldCount: Object.keys(compare?.novelFieldSummary || {}).length,
      comparisons,
      // Pipeline v2 additions
      classifiedAt: classify?.classifiedAt ? classify.classifiedAt.split("T")[0] : undefined,
      classification: classify ? {
        types: classify.typeSummary || {},
        scopes: classify.scopeSummary || {},
        complexity: classify.complexitySummary || {},
      } : undefined,
      draftedAt: drafts?.draftedAt ? drafts.draftedAt.split("T")[0] : undefined,
      draftsGenerated: drafts?.successful || 0,
      draftsTotal: drafts?.total || 0,
    };
  }

  // Write TypeScript file
  const tsContent = `/**
 * Pipeline exploration summary — AUTO-GENERATED by benefits-pipeline.js
 * Do not edit manually. Regenerated after each pipeline run.
 *
 * Last updated: ${new Date().toISOString()}
 */

export interface PipelineDiff {
  field: string;
  ours: string;
  found: string;
  source?: string;
}

export interface PipelineComparison {
  name: string;
  isNew: boolean;
  existingId: string | null;
  diffsFound: number;
  diffs: PipelineDiff[];
  novelFields: { field: string; note: string }[];
}

export interface PipelineClassification {
  types: Record<string, number>;
  scopes: Record<string, number>;
  complexity: Record<string, number>;
}

export interface PipelineStateSummary {
  exploredAt: string;
  programsFound: number;
  newPrograms: number;
  diffsFound: number;
  novelFieldCount: number;
  comparisons: PipelineComparison[];
  classifiedAt?: string;
  classification?: PipelineClassification;
  draftedAt?: string;
  draftsGenerated?: number;
  draftsTotal?: number;
}

export const pipelineData: Record<string, PipelineStateSummary> = ${JSON.stringify(entries, null, 2)};
`;

  const outPath = path.resolve(__dirname, "..", "data", "pipeline-summary.ts");
  fs.writeFileSync(outPath, tsContent);
  console.log(`\n  → Updated ${outPath} (${states.length} state${states.length > 1 ? "s" : ""})`);

  // Also generate pipeline-drafts.ts for admin dashboard draft previews
  generatePipelineDrafts();
}

function generatePipelineDrafts() {
  const pipelineRoot = path.resolve(__dirname, "..", "data", "pipeline");
  if (!fs.existsSync(pipelineRoot)) return;

  const dirs = fs.readdirSync(pipelineRoot).filter((d) => {
    return fs.statSync(path.join(pipelineRoot, d)).isDirectory() &&
      fs.existsSync(path.join(pipelineRoot, d, "drafts.json"));
  });

  if (!dirs.length) return;

  const entries = {};
  for (const dirName of dirs) {
    const drafts = JSON.parse(
      fs.readFileSync(path.join(pipelineRoot, dirName, "drafts.json"), "utf-8")
    );

    const programs = (drafts.programs || [])
      .filter((p) => !p._error && !p._parseError)
      .map((p) => {
        // Strip _raw and keep the structured draft content
        const { _raw, ...clean } = p;
        // Clean income table rows — LLM sometimes adds extra fields
        if (clean.structuredEligibility?.incomeTable) {
          clean.structuredEligibility.incomeTable = clean.structuredEligibility.incomeTable.map((row) => ({
            householdSize: row.householdSize,
            monthlyLimit: row.monthlyLimit,
            ...(row.annualLimit ? { annualLimit: row.annualLimit } : {}),
          }));
        }
        return clean;
      });

    if (programs.length > 0) {
      // Key: state code for states (backwards compat), slug for regions
      const isState = /^[A-Z]{2}$/.test(dirName);
      const key = isState ? dirName : (drafts.entitySlug || dirName);

      entries[key] = {
        draftedAt: (drafts.draftedAt || "").split("T")[0],
        programs,
        stateOverview: drafts.stateOverview || null,
        // Region metadata (null for states)
        ...(isState ? {} : {
          regionName: drafts.entity || dirName,
          parentState: drafts.state || null,
          slug: drafts.entitySlug || dirName,
          isRegion: true,
        }),
      };
    }
  }

  if (!Object.keys(entries).length) return;

  const tsContent = `/**
 * Pipeline draft content — AUTO-GENERATED by benefits-pipeline.js
 * Do not edit manually. Regenerated after each pipeline draft run.
 *
 * Last updated: ${new Date().toISOString()}
 */

export interface PipelineDraft {
  id: string;
  name: string;
  shortName: string;
  tagline: string;
  programType: string;
  complexity: string;
  intro: string;
  savingsRange: string;
  savingsSource: string;
  savingsVerified: boolean;
  structuredEligibility?: {
    summary: string[];
    ageRequirement?: string | null;
    incomeTable?: { householdSize: number; monthlyLimit: number }[] | null;
    assetLimits?: {
      individual?: number | null;
      couple?: number | null;
      countedAssets?: string[];
      exemptAssets?: string[];
      homeEquityCap?: number | null;
    } | null;
    functionalRequirement?: string | null;
    otherRequirements?: string[];
    povertyLevelReference?: string | null;
  };
  applicationGuide?: {
    method: string;
    summary: string;
    steps?: { step: number; title: string; description: string }[];
    processingTime?: string | null;
    waitlist?: string | null;
    tip?: string | null;
    urls?: { label: string; url: string }[];
  };
  contentSections?: { type: string; [key: string]: unknown }[];
  faqs?: { question: string; answer: string }[];
  phone?: string | null;
  sourceUrl?: string | null;
  contentStatus: string;
  draftedAt: string;
  geographicScope?: { type: string; stateVariation?: boolean; localEntities?: { name: string; type: string; phone?: string; address?: string; url?: string }[] };
}

export interface PipelineStateOverview {
  intro: string;
  startHere: { name: string; programId: string; why: string }[];
  byNeed: { need: string; programs: string[]; description: string }[];
  quickFacts: string[];
  resourcesVsBenefits: string;
}

export interface PipelineStateDrafts {
  draftedAt: string;
  programs: PipelineDraft[];
  stateOverview?: PipelineStateOverview | null;
  // Region metadata (present for non-state entities)
  regionName?: string;
  parentState?: string | null;
  slug?: string;
  isRegion?: boolean;
}

export const pipelineDrafts: Record<string, PipelineStateDrafts> = ${JSON.stringify(entries, null, 2)};
`;

  const outPath = path.resolve(__dirname, "..", "data", "pipeline-drafts.ts");
  fs.writeFileSync(outPath, tsContent);
  console.log(`  → Updated ${outPath} (${Object.keys(entries).length} state${Object.keys(entries).length > 1 ? "s" : ""} with drafts)`);
}

main().catch((err) => {
  console.error(`\n  Fatal: ${err.message}`);
  console.error(err.stack);
  process.exit(1);
});
