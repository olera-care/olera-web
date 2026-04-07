#!/usr/bin/env node

/**
 * Senior Benefits Pipeline — Exploration-First
 *
 * Explores benefit programs for a state with open-ended questions,
 * compares against existing data, and produces human-readable reports.
 * The taxonomy emerges from exploration — it's not predetermined.
 *
 * Usage:
 *   node scripts/benefits-pipeline.js --state TX                  # dry-run
 *   node scripts/benefits-pipeline.js --state MI --run             # explore Michigan
 *   node scripts/benefits-pipeline.js --state MI --phase explore   # explore only
 *   node scripts/benefits-pipeline.js --state MI --phase dive --run # deep dive only
 *
 * Phases:
 *   explore   — Survey the landscape: what programs exist?
 *   dive      — Deep dive each program: what data matters?
 *   compare   — Cross-reference with our existing data, surface diffs
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
  const opts = { state: null, phase: "all", run: false };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--state": opts.state = args[++i]?.toUpperCase(); break;
      case "--phase": opts.phase = args[++i]; break;
      case "--run":   opts.run = true; break;
      case "--help": case "-h": printUsage(); process.exit(0);
      default:
        if (!args[i].startsWith("-")) opts.state = opts.state || args[i].toUpperCase();
    }
  }
  return opts;
}

function printUsage() {
  console.log(`
  Senior Benefits Pipeline — Exploration-First

  Usage:
    node scripts/benefits-pipeline.js --state MI              # dry-run
    node scripts/benefits-pipeline.js --state MI --run        # explore
    node scripts/benefits-pipeline.js --state MI --phase dive --run

  Phases:
    explore   Survey the landscape: what programs exist?
    dive      Deep dive: what data matters for each program?
    compare   Cross-reference with our existing data
    report    Generate human-readable markdown report

  The taxonomy emerges from exploration — it's not predetermined.
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

function pipelineDir(stateCode) {
  const dir = path.resolve(__dirname, "..", "data", "pipeline", stateCode);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function writeFile(stateCode, filename, content) {
  const filepath = path.join(pipelineDir(stateCode), filename);
  fs.writeFileSync(filepath, typeof content === "string" ? content : JSON.stringify(content, null, 2));
  console.log(`  → ${filepath}`);
}

function readJson(stateCode, filename) {
  const filepath = path.join(pipelineDir(stateCode), filename);
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

async function phaseExplore(stateCode, stateName) {
  console.log(`\n  ━━━ EXPLORE: What programs exist in ${stateName}? ━━━\n`);

  // Split into two queries: federal programs administered by the state, then state-unique
  const federalPrompt = `What are the major federal senior benefit programs as they are administered in ${stateName} (${stateCode})? I need the ${stateName}-specific name for each.

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

For each, give: name (as used in ${stateName}), what_it_does (2 sentences), who_its_for, official_url, benefit_value.

Return as a JSON array: [{"name":"...","what_it_does":"...","who_its_for":"...","official_url":"...","benefit_value":"..."}]`;

  const statePrompt = `What senior benefit programs are unique to ${stateName} (${stateCode}) — programs that only exist in this state, or state-funded programs beyond the standard federal ones?

Think about: property tax relief, state pharmaceutical assistance, state-funded home care, state energy credits, veteran supplements, senior housing programs, transportation programs, companion programs, anything ${stateName} offers that not every state has.

For each, give: name, what_it_does (2 sentences), who_its_for, whats_unique, official_url, benefit_value.

Return as a JSON array: [{"name":"...","what_it_does":"...","who_its_for":"...","whats_unique":"...","official_url":"...","benefit_value":"..."}]`;

  console.log(`  Query 1: Federal programs as administered in ${stateName}...`);
  const fedResponse = await perplexityChat(federalPrompt, 0.2);
  const fedPrograms = extractJson(fedResponse) || [];
  console.log(`  Found ${fedPrograms.length} federal programs`);

  console.log(`  Query 2: ${stateName}-unique programs...`);
  const stateResponse = await perplexityChat(statePrompt, 0.2);
  const statePrograms = extractJson(stateResponse) || [];
  console.log(`  Found ${statePrograms.length} state-unique programs`);

  // Merge and deduplicate with semantic normalization
  const allDiscovered = [...fedPrograms, ...statePrograms];
  const programs = deduplicatePrograms(allDiscovered, stateName);

  if (!programs.length) {
    console.log(`  ERROR: No programs found. Raw federal: ${fedResponse.slice(0, 300)}`);
    return { programs: [], raw: fedResponse };
  }

  console.log(`\n  Total unique programs: ${programs.length}\n`);
  for (const p of programs) {
    console.log(`  • ${(p.name || "?").slice(0, 60)}`);
    console.log(`    ${(p.what_it_does || "").slice(0, 100)}`);
    console.log();
  }

  return {
    state: stateCode,
    stateName,
    exploredAt: new Date().toISOString(),
    programCount: programs.length,
    programs,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 2: DEEP DIVE — What data matters for each program?
// ═══════════════════════════════════════════════════════════════════════════

async function phaseDive(stateCode, stateName, exploreData) {
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

function phaseCompare(stateCode, stateName, diveData, existingPrograms) {
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
// PHASE 4: REPORT — Human-readable markdown
// ═══════════════════════════════════════════════════════════════════════════

function phaseReport(stateCode, stateName, exploreData, diveData, compareData) {
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

  if (!opts.state || !STATE_NAMES[opts.state]) {
    console.error(`  Error: Valid --state required (e.g., --state MI)`);
    printUsage();
    process.exit(1);
  }

  if (!PERPLEXITY_API_KEY) {
    console.error(`  Error: PERPLEXITY_API_KEY not found in .env.local`);
    process.exit(1);
  }

  const stateCode = opts.state;
  const stateName = STATE_NAMES[stateCode];
  const shouldRun = (phase) => opts.phase === "all" || opts.phase === phase;

  console.log(`\n  Senior Benefits Pipeline — Exploration-First`);
  console.log(`  State: ${stateName} (${stateCode})`);
  console.log(`  Phase: ${opts.phase}`);
  console.log(`  Mode:  ${opts.run ? "EXECUTE" : "DRY RUN"}`);

  // Load existing data
  const existing = loadExistingPrograms(stateCode);
  console.log(`  Existing in waiver-library.ts: ${existing.length} programs`);

  if (!opts.run) {
    console.log(`\n  This is a dry run. To execute, add --run:`);
    console.log(`  node scripts/benefits-pipeline.js --state ${stateCode} --run\n`);

    if (existing.length > 0) {
      console.log(`  Current programs:`);
      for (const p of existing) {
        const v = p.lastVerifiedDate ? `✓ ${p.lastVerifiedDate}` : "✗ unverified";
        console.log(`    ${p.name.padEnd(55)} ${v}`);
      }
    }

    const estCalls = 1 + (existing.length || 10); // 1 explore + N dives
    console.log(`\n  Would make ~${estCalls} Perplexity calls (~$${(estCalls * 0.005).toFixed(3)})`);
    console.log(`  Output: data/pipeline/${stateCode}/exploration_report.md`);
    process.exit(0);
  }

  // ─── Execute ─────────────────────────────────────────────────────────

  let exploreData = readJson(stateCode, "explore.json");
  let diveData = readJson(stateCode, "dive.json");
  let compareData = readJson(stateCode, "compare.json");

  if (shouldRun("explore")) {
    exploreData = await phaseExplore(stateCode, stateName);
    writeFile(stateCode, "explore.json", exploreData);
  }

  if (shouldRun("dive")) {
    if (!exploreData) exploreData = readJson(stateCode, "explore.json");
    if (!exploreData?.programs?.length) {
      console.log(`\n  No explore data. Run: --phase explore --run`);
    } else {
      diveData = await phaseDive(stateCode, stateName, exploreData);
      writeFile(stateCode, "dive.json", diveData);
    }
  }

  if (shouldRun("compare")) {
    if (!diveData) diveData = readJson(stateCode, "dive.json");
    if (!diveData?.programs?.length) {
      console.log(`\n  No dive data. Run: --phase dive --run`);
    } else {
      compareData = phaseCompare(stateCode, stateName, diveData, existing);
      writeFile(stateCode, "compare.json", compareData);
    }
  }

  if (shouldRun("report")) {
    if (!exploreData) exploreData = readJson(stateCode, "explore.json");
    if (!diveData) diveData = readJson(stateCode, "dive.json");
    if (!compareData) compareData = readJson(stateCode, "compare.json");
    phaseReport(stateCode, stateName, exploreData, diveData, compareData);
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
    const compareFile = path.join(pipelineRoot, d, "compare.json");
    return fs.existsSync(compareFile) && /^[A-Z]{2}$/.test(d);
  });

  if (!states.length) return;

  const entries = {};
  for (const stateCode of states) {
    const compare = JSON.parse(
      fs.readFileSync(path.join(pipelineRoot, stateCode, "compare.json"), "utf-8")
    );

    // Build summary with comparisons that have diffs or novel fields
    const comparisons = (compare.comparisons || [])
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
      exploredAt: (compare.comparedAt || "").split("T")[0],
      programsFound: compare.total || 0,
      newPrograms: compare.newPrograms || 0,
      diffsFound: compare.withDiffs || 0,
      novelFieldCount: Object.keys(compare.novelFieldSummary || {}).length,
      comparisons,
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

export interface PipelineStateSummary {
  exploredAt: string;
  programsFound: number;
  newPrograms: number;
  diffsFound: number;
  novelFieldCount: number;
  comparisons: PipelineComparison[];
}

export const pipelineData: Record<string, PipelineStateSummary> = ${JSON.stringify(entries, null, 2)};
`;

  const outPath = path.resolve(__dirname, "..", "data", "pipeline-summary.ts");
  fs.writeFileSync(outPath, tsContent);
  console.log(`\n  → Updated ${outPath} (${states.length} state${states.length > 1 ? "s" : ""})`);
}

main().catch((err) => {
  console.error(`\n  Fatal: ${err.message}`);
  console.error(err.stack);
  process.exit(1);
});
