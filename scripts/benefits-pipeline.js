#!/usr/bin/env node

/**
 * Senior Benefits Pipeline
 *
 * Discovers, verifies, and quality-checks benefit programs for a state.
 * Modeled on the city pipeline (pipeline-batch.js).
 *
 * Usage:
 *   node scripts/benefits-pipeline.js --state TX                  # dry-run all phases
 *   node scripts/benefits-pipeline.js --state MI --run             # execute all phases
 *   node scripts/benefits-pipeline.js --state MI --phase discover  # only discover
 *   node scripts/benefits-pipeline.js --state MI --phase verify --run
 *   node scripts/benefits-pipeline.js --state MI --phase qa        # QA check only (no API calls)
 *
 * Phases:
 *   discover  — Find all programs for a state via Perplexity
 *   verify    — Check each program's claims against .gov sources
 *   generate  — Output verified data as JSON + optionally seed Supabase
 *   qa        — Automated quality checks
 *   finalize  — Summary report
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
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// ─── CLI Parsing ────────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    state: null,
    phase: "all",
    run: false,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--state":
        opts.state = args[++i]?.toUpperCase();
        break;
      case "--phase":
        opts.phase = args[++i];
        break;
      case "--run":
        opts.run = true;
        break;
      case "--help":
      case "-h":
        printUsage();
        process.exit(0);
      default:
        if (!args[i].startsWith("-")) {
          opts.state = opts.state || args[i].toUpperCase();
        }
    }
  }

  return opts;
}

function printUsage() {
  console.log(`
  Senior Benefits Pipeline

  Usage:
    node scripts/benefits-pipeline.js --state TX              # dry-run
    node scripts/benefits-pipeline.js --state MI --run        # execute
    node scripts/benefits-pipeline.js --state MI --phase discover --run

  Flags:
    --state <XX>     State abbreviation (required)
    --phase <name>   Run only one phase: discover, verify, generate, qa, finalize
    --run            Execute (default is dry-run preview)
    --help           Show this help
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

// ─── Cost Tracker ───────────────────────────────────────────────────────────

class CostTracker {
  constructor() {
    this.perplexity = 0;
    this.httpChecks = 0;
    this.startTime = Date.now();
  }

  addPerplexity(n = 1) { this.perplexity += n; }
  addHttpCheck(n = 1) { this.httpChecks += n; }

  get cost() {
    return this.perplexity * 0.005;
  }

  get elapsed() {
    return (Date.now() - this.startTime) / 1000;
  }

  summary() {
    const s = this.elapsed;
    const t = s < 60 ? `${Math.round(s)}s`
            : s < 3600 ? `${(s / 60).toFixed(1)}m`
            : `${Math.floor(s / 3600)}h${Math.floor((s % 3600) / 60)}m`;
    return `$${this.cost.toFixed(3)} (${this.perplexity} Perplexity, ${this.httpChecks} URL checks, ${t})`;
  }
}

const cost = new CostTracker();

// ─── Rate Limiter ───────────────────────────────────────────────────────────

class RateLimiter {
  constructor(minDelayMs = 200) {
    this.minDelay = minDelayMs;
    this.lastCall = 0;
  }

  async wait() {
    const now = Date.now();
    const elapsed = now - this.lastCall;
    if (elapsed < this.minDelay) {
      await new Promise((r) => setTimeout(r, this.minDelay - elapsed));
    }
    this.lastCall = Date.now();
  }
}

const rateLimiter = new RateLimiter(300);

// ─── Retry ──────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchWithRetry(url, opts = {}, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fetch(url, opts);
    } catch (err) {
      if (i === retries - 1) throw err;
      const delay = 2000 * (i + 1);
      console.log(`  [retry ${i + 1}/${retries}] ${err.message}, waiting ${delay}ms...`);
      await sleep(delay);
    }
  }
}

// ─── Perplexity ─────────────────────────────────────────────────────────────

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
  // Try to find a JSON array first, then object
  const arrayMatch = text.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    try { return JSON.parse(arrayMatch[0]); } catch { /* fall through */ }
  }
  const objMatch = text.match(/\{[\s\S]*\}/);
  if (objMatch) {
    try { return JSON.parse(objMatch[0]); } catch { return null; }
  }
  return null;
}

// ─── URL Checker ────────────────────────────────────────────────────────────

async function checkUrl(url) {
  if (!url) return { ok: false, reason: "empty" };
  cost.addHttpCheck();
  try {
    const resp = await fetchWithRetry(url, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
    });
    return { ok: resp.ok, status: resp.status };
  } catch (err) {
    // Some servers reject HEAD, try GET
    try {
      const resp = await fetchWithRetry(url, {
        method: "GET",
        redirect: "follow",
        signal: AbortSignal.timeout(10000),
      });
      return { ok: resp.ok, status: resp.status };
    } catch (err2) {
      return { ok: false, reason: err2.message };
    }
  }
}

// ─── Pipeline Directory ─────────────────────────────────────────────────────

function ensurePipelineDir(stateCode) {
  const dir = path.resolve(__dirname, "..", "data", "pipeline", stateCode);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function readPipelineFile(stateCode, filename) {
  const filepath = path.join(ensurePipelineDir(stateCode), filename);
  if (!fs.existsSync(filepath)) return null;
  return JSON.parse(fs.readFileSync(filepath, "utf-8"));
}

function writePipelineFile(stateCode, filename, data) {
  const filepath = path.join(ensurePipelineDir(stateCode), filename);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
  console.log(`  Wrote ${filepath}`);
}

// ─── Load Existing Programs from waiver-library.ts ──────────────────────────

function loadExistingPrograms(stateCode) {
  try {
    // Dynamic require of the compiled waiver library
    // We parse the TS file directly to extract program data
    const waiverPath = path.resolve(__dirname, "..", "data", "waiver-library.ts");
    const content = fs.readFileSync(waiverPath, "utf-8");

    // Find the state's data in allStates array
    const stateId = STATE_NAMES[stateCode]?.toLowerCase().replace(/\s+/g, "-");
    if (!stateId) return [];

    // Look for the state entry and extract program count
    const stateRegex = new RegExp(
      `\\{\\s*id:\\s*"${stateId}"[^}]*abbreviation:\\s*"${stateCode}"`,
      "s"
    );
    if (!stateRegex.test(content)) {
      console.log(`  State ${stateCode} not found in waiver-library.ts`);
      return [];
    }

    // Find programs array for this state variable
    const varName = STATE_NAMES[stateCode].toLowerCase().replace(/\s+/g, "");
    const programsVarRegex = new RegExp(
      `const\\s+${varName}Programs.*?=\\s*\\[`
    );
    const varMatch = content.match(programsVarRegex);

    if (!varMatch) {
      // Try alternate naming patterns
      const altNames = [
        stateCode.toLowerCase(),
        STATE_NAMES[stateCode].toLowerCase().replace(/\s+/g, "_"),
      ];
      for (const alt of altNames) {
        const altRegex = new RegExp(`const\\s+${alt}Programs.*?=\\s*\\[`);
        if (altRegex.test(content)) {
          console.log(`  Found programs var: ${alt}Programs`);
          break;
        }
      }
    }

    // Extract top-level program objects by finding `{  id: "...", name: "..."` patterns
    // that appear at the start of WaiverProgram entries (not nested forms, serviceAreas, etc.)
    const programs = [];
    const stateSection = getStateSection(content, stateCode);
    if (!stateSection) return [];

    // Match program blocks: lines starting with `    id:` followed by `    name:`
    // Top-level programs have 4-space indent; nested objects have 6+
    const programBlockRegex = /\{\s*\n\s{4}id:\s*"([^"]+)",\s*\n\s{4}name:\s*"([^"]+)",/g;
    let match;
    while ((match = programBlockRegex.exec(stateSection)) !== null) {
      const id = match[1];
      const name = match[2];

      // Look ahead in the block for optional fields
      const blockStart = match.index;
      const blockEnd = stateSection.indexOf("\n  },", blockStart);
      const block = stateSection.slice(blockStart, blockEnd > 0 ? blockEnd : blockStart + 2000);

      const savingsMatch = block.match(/savingsRange:\s*"([^"]*)"/);
      const sourceMatch = block.match(/sourceUrl:\s*"([^"]*)"/);
      const verifiedMatch = block.match(/lastVerifiedDate:\s*"([^"]*)"/);
      const phoneMatch = block.match(/phone:\s*"([^"]*)"/);
      const verifiedByMatch = block.match(/verifiedBy:\s*"([^"]*)"/);

      programs.push({
        id,
        name,
        savingsRange: savingsMatch?.[1] || "",
        sourceUrl: sourceMatch?.[1] || null,
        lastVerifiedDate: verifiedMatch?.[1] || null,
        verifiedBy: verifiedByMatch?.[1] || null,
        phone: phoneMatch?.[1] || null,
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

  // Find the section header for this state
  const headerRegex = new RegExp(
    `// ─── ${stateName} ─+\\n\\n`,
    "i"
  );
  const headerMatch = content.match(headerRegex);
  if (!headerMatch) return null;

  const startIdx = headerMatch.index;

  // Find the next state section header
  const nextHeaderRegex = /\n\/\/ ─── [A-Z][a-z]+ ─+/g;
  nextHeaderRegex.lastIndex = startIdx + headerMatch[0].length;
  const nextMatch = nextHeaderRegex.exec(content);

  const endIdx = nextMatch ? nextMatch.index : content.length;
  return content.slice(startIdx, endIdx);
}

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 1: DISCOVER
// ═══════════════════════════════════════════════════════════════════════════

async function phaseDiscover(stateCode, stateName, existingPrograms) {
  console.log(`\n  ━━━ Phase 1: DISCOVER ━━━`);
  console.log(`  Finding all senior benefit programs in ${stateName}...`);
  console.log(`  Existing programs in data: ${existingPrograms.length}`);

  const prompt = `List ALL senior benefit programs available in ${stateName} (${stateCode}). Include:
- State Medicaid programs (aged/disabled, waivers, HCBS)
- PACE programs
- Medicare Savings Programs (QMB, SLMB, QI)
- SNAP/food assistance
- LIHEAP/energy assistance
- Weatherization
- Respite care / caregiver support
- Meals on Wheels or home-delivered meals
- Senior employment programs (SCSEP)
- Legal aid for seniors
- Long-term care ombudsman
- Senior companion/volunteer programs
- Property tax relief for seniors
- Any state-unique programs not in the list above

For EACH program, return:
- name: Official program name
- type: Category (healthcare, income, food, housing, utilities, caregiver)
- source_url: Official .gov or state website URL
- phone: Main contact phone number (if known)
- is_state_specific: true if only available in ${stateName}, false if federal

Return as a JSON array. Be comprehensive — include every program a senior in ${stateName} could apply for.`;

  const response = await perplexityChat(prompt);
  const discovered = extractJson(response);

  if (!discovered || !Array.isArray(discovered)) {
    console.log(`  ERROR: Could not parse discovery response`);
    console.log(`  Raw response: ${response.slice(0, 500)}`);
    return [];
  }

  console.log(`  Discovered ${discovered.length} programs`);

  // Cross-reference with existing
  const existingIds = new Set(existingPrograms.map((p) => p.id));
  const existingNames = new Set(existingPrograms.map((p) => p.name.toLowerCase()));

  const newPrograms = [];
  const matched = [];

  for (const prog of discovered) {
    const nameKey = (prog.name || "").toLowerCase();
    const isExisting = existingNames.has(nameKey) ||
      [...existingNames].some((n) =>
        n.includes(nameKey.slice(0, 20)) || nameKey.includes(n.slice(0, 20))
      );

    if (isExisting) {
      matched.push(prog);
    } else {
      newPrograms.push(prog);
    }
  }

  console.log(`  Matched to existing: ${matched.length}`);
  console.log(`  New programs found: ${newPrograms.length}`);

  if (newPrograms.length > 0) {
    console.log(`  New programs:`);
    for (const p of newPrograms) {
      console.log(`    + ${p.name} (${p.type || "unknown"})`);
    }
  }

  const result = {
    state: stateCode,
    stateName,
    discoveredAt: new Date().toISOString(),
    total: discovered.length,
    matched: matched.length,
    new: newPrograms.length,
    programs: discovered,
    newPrograms,
  };

  return result;
}

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 2: VERIFY
// ═══════════════════════════════════════════════════════════════════════════

async function phaseVerify(stateCode, stateName, discoveredData, existingPrograms) {
  console.log(`\n  ━━━ Phase 2: VERIFY ━━━`);

  const allPrograms = discoveredData?.programs || [];
  if (allPrograms.length === 0) {
    console.log(`  No programs to verify. Run discover phase first.`);
    return null;
  }

  console.log(`  Verifying ${allPrograms.length} programs against official sources...`);

  const verified = [];

  for (let i = 0; i < allPrograms.length; i++) {
    const prog = allPrograms[i];
    const name = prog.name || `Program ${i + 1}`;

    process.stdout.write(`  [${i + 1}/${allPrograms.length}] ${name.slice(0, 50).padEnd(50)} | ${cost.summary()}\r`);

    const prompt = `For the program "${name}" in ${stateName} (${stateCode}), verify these specific facts from official government sources:

1. INCOME LIMITS: What is the monthly income limit for a single person? For a couple? Give exact dollar amounts.
2. AGE REQUIREMENT: Minimum age to qualify (if any)
3. SAVINGS/BENEFIT VALUE: What is the actual dollar value of benefits received? (Not a range — the real amount from the program's benefit schedule)
4. PHONE NUMBER: Official contact phone number
5. APPLICATION URL: Direct URL to the application form or online portal
6. SOURCE URL: The official .gov page describing this program's eligibility
7. WAIT TIME: Typical processing or waitlist time
8. WHAT IT COVERS: Brief list of services/benefits provided

Return as JSON:
{
  "name": "${name}",
  "income_limit_single": <number or null>,
  "income_limit_couple": <number or null>,
  "min_age": <number or null>,
  "benefit_value": "<description of actual benefit amount>",
  "phone": "<phone number or null>",
  "application_url": "<url or null>",
  "source_url": "<official .gov url>",
  "wait_time": "<description or null>",
  "covers": "<brief list>",
  "verified": true,
  "confidence": "<high|medium|low>",
  "notes": "<any caveats or uncertainties>"
}

Only include facts you can verify from official sources. Set confidence to "low" if you're unsure.`;

    try {
      const response = await perplexityChat(prompt);
      const parsed = extractJson(response);

      if (parsed) {
        parsed._originalName = name;
        parsed._originalType = prog.type || null;
        parsed._originalSourceUrl = prog.source_url || null;
        verified.push(parsed);
      } else {
        console.log(`\n  WARN: Could not parse verification for "${name}"`);
        verified.push({
          name,
          verified: false,
          confidence: "low",
          notes: "Failed to parse Perplexity response",
          _originalType: prog.type || null,
        });
      }
    } catch (err) {
      console.log(`\n  ERROR verifying "${name}": ${err.message}`);
      verified.push({
        name,
        verified: false,
        confidence: "low",
        notes: `Error: ${err.message}`,
        _originalType: prog.type || null,
      });
    }
  }

  console.log(`\n  Verified ${verified.filter((v) => v.verified).length}/${allPrograms.length} programs`);

  // URL checks on source and application URLs
  console.log(`  Checking URLs...`);
  let urlsChecked = 0;
  let urlsOk = 0;
  let urlsBroken = 0;

  for (const prog of verified) {
    for (const field of ["source_url", "application_url"]) {
      const url = prog[field];
      if (url && url.startsWith("http")) {
        const result = await checkUrl(url);
        prog[`${field}_check`] = result;
        urlsChecked++;
        if (result.ok) urlsOk++;
        else urlsBroken++;
      }
    }
  }

  console.log(`  URLs: ${urlsOk} ok, ${urlsBroken} broken, ${urlsChecked} total`);

  const result = {
    state: stateCode,
    stateName,
    verifiedAt: new Date().toISOString(),
    total: allPrograms.length,
    verified: verified.filter((v) => v.verified).length,
    highConfidence: verified.filter((v) => v.confidence === "high").length,
    urlsOk,
    urlsBroken,
    programs: verified,
  };

  return result;
}

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 3: GENERATE
// ═══════════════════════════════════════════════════════════════════════════

function phaseGenerate(stateCode, stateName, verifiedData, existingPrograms) {
  console.log(`\n  ━━━ Phase 3: GENERATE ━━━`);

  if (!verifiedData?.programs) {
    console.log(`  No verified data. Run verify phase first.`);
    return null;
  }

  const programs = verifiedData.programs;
  console.log(`  Generating output for ${programs.length} programs...`);

  // Build WaiverProgram-compatible objects
  const output = programs.map((prog) => {
    const id = slugify(prog.name);
    const existing = existingPrograms.find(
      (e) => e.id === id || e.name.toLowerCase() === prog.name?.toLowerCase()
    );

    return {
      id: existing?.id || id,
      name: prog.name,
      category: prog._originalType || "healthcare",
      isNew: !existing,
      // Verified data
      income_limit_single: prog.income_limit_single || null,
      income_limit_couple: prog.income_limit_couple || null,
      min_age: prog.min_age || null,
      benefit_value: prog.benefit_value || null,
      phone: prog.phone || existing?.phone || null,
      application_url: prog.application_url || null,
      source_url: prog.source_url || prog._originalSourceUrl || null,
      source_url_ok: prog.source_url_check?.ok ?? null,
      application_url_ok: prog.application_url_check?.ok ?? null,
      wait_time: prog.wait_time || null,
      covers: prog.covers || null,
      confidence: prog.confidence || "low",
      verified: prog.verified || false,
      verified_date: new Date().toISOString().split("T")[0],
      verified_by: "pipeline",
      notes: prog.notes || null,
      // Existing data (for comparison)
      existing_savings: existing?.savingsRange || null,
      existing_source: existing?.sourceUrl || null,
      existing_verified: existing?.lastVerifiedDate || null,
    };
  });

  const newCount = output.filter((p) => p.isNew).length;
  const updatedCount = output.filter((p) => !p.isNew).length;

  console.log(`  Generated: ${updatedCount} updates, ${newCount} new programs`);
  console.log(`  High confidence: ${output.filter((p) => p.confidence === "high").length}`);
  console.log(`  Medium confidence: ${output.filter((p) => p.confidence === "medium").length}`);
  console.log(`  Low confidence: ${output.filter((p) => p.confidence === "low").length}`);

  return {
    state: stateCode,
    stateName,
    generatedAt: new Date().toISOString(),
    total: output.length,
    new: newCount,
    updated: updatedCount,
    programs: output,
  };
}

function slugify(text) {
  return (text || "unknown")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 4: QA GATE
// ═══════════════════════════════════════════════════════════════════════════

function phaseQa(stateCode, stateName, generateData) {
  console.log(`\n  ━━━ Phase 4: QA GATE ━━━`);

  if (!generateData?.programs) {
    console.log(`  No generated data. Run generate phase first.`);
    return null;
  }

  const programs = generateData.programs;
  const results = [];
  let totalPass = 0;
  let totalFail = 0;

  for (const prog of programs) {
    const checks = [];

    // Required checks
    checks.push({
      check: "Has source URL",
      pass: !!prog.source_url,
      value: prog.source_url || "MISSING",
    });

    checks.push({
      check: "Source URL accessible",
      pass: prog.source_url_ok === true || prog.source_url_ok === null,
      value: prog.source_url_ok === null ? "Not checked" : prog.source_url_ok ? "OK" : "BROKEN",
    });

    checks.push({
      check: "Verified by source",
      pass: prog.verified === true,
      value: prog.verified ? "Yes" : "No",
    });

    checks.push({
      check: "Confidence level",
      pass: prog.confidence === "high" || prog.confidence === "medium",
      value: prog.confidence || "unknown",
    });

    checks.push({
      check: "Has income limit or age requirement",
      pass: prog.income_limit_single != null || prog.min_age != null,
      value: prog.income_limit_single ? `$${prog.income_limit_single}/mo` : prog.min_age ? `${prog.min_age}+` : "MISSING",
    });

    checks.push({
      check: "Has benefit value description",
      pass: !!prog.benefit_value && prog.benefit_value.length > 5,
      value: prog.benefit_value ? prog.benefit_value.slice(0, 60) : "MISSING",
    });

    if (prog.application_url) {
      checks.push({
        check: "Application URL accessible",
        pass: prog.application_url_ok !== false,
        value: prog.application_url_ok ? "OK" : "BROKEN",
      });
    }

    if (prog.phone) {
      checks.push({
        check: "Phone format valid",
        pass: /[\d\-\(\)\s]{7,}/.test(prog.phone),
        value: prog.phone,
      });
    }

    const passed = checks.filter((c) => c.pass).length;
    const failed = checks.filter((c) => !c.pass).length;
    const score = Math.round((passed / checks.length) * 100);

    if (failed === 0) totalPass++;
    else totalFail++;

    results.push({
      name: prog.name,
      id: prog.id,
      isNew: prog.isNew,
      score,
      passed,
      failed,
      checks,
    });
  }

  // Sort: worst scores first so problems are visible
  results.sort((a, b) => a.score - b.score);

  const overallScore = Math.round(
    (results.reduce((sum, r) => sum + r.score, 0) / results.length)
  );

  console.log(`\n  QA Results for ${stateName}:`);
  console.log(`  ─────────────────────────────────`);

  for (const r of results) {
    const icon = r.failed === 0 ? "✓" : "✗";
    const color = r.failed === 0 ? "\x1b[32m" : "\x1b[33m";
    console.log(`  ${color}${icon}\x1b[0m ${(r.name || r.id || "Unknown").padEnd(55)} ${r.score}%${r.isNew ? " (NEW)" : ""}`);

    if (r.failed > 0) {
      for (const c of r.checks.filter((c) => !c.pass)) {
        console.log(`    \x1b[31m✗\x1b[0m ${c.check}: ${c.value}`);
      }
    }
  }

  console.log(`\n  Overall: ${overallScore}% | ${totalPass} pass, ${totalFail} need attention`);

  const gatePass = overallScore >= 80 && totalFail <= Math.ceil(programs.length * 0.2);

  if (gatePass) {
    console.log(`  \x1b[32m✓ QA GATE: PASS\x1b[0m — Ready for review`);
  } else {
    console.log(`  \x1b[31m✗ QA GATE: FAIL\x1b[0m — ${totalFail} programs need fixes before launch`);
  }

  return {
    state: stateCode,
    stateName,
    qaAt: new Date().toISOString(),
    overallScore,
    gatePass,
    totalPass,
    totalFail,
    programs: results,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 5: FINALIZE
// ═══════════════════════════════════════════════════════════════════════════

function phaseFinalize(stateCode, stateName, qaData, generateData) {
  console.log(`\n  ━━━ Phase 5: FINALIZE ━━━`);

  const summary = {
    state: stateCode,
    stateName,
    completedAt: new Date().toISOString(),
    cost: cost.summary(),
    programs: generateData?.total || 0,
    newPrograms: generateData?.new || 0,
    qaScore: qaData?.overallScore || 0,
    qaPass: qaData?.gatePass || false,
    qaFailed: qaData?.totalFail || 0,
  };

  console.log(`\n  ┌─────────────────────────────────────────────┐`);
  console.log(`  │  Benefits Pipeline Summary: ${stateName.padEnd(16)}│`);
  console.log(`  ├─────────────────────────────────────────────┤`);
  console.log(`  │  Programs:     ${String(summary.programs).padEnd(29)}│`);
  console.log(`  │  New:          ${String(summary.newPrograms).padEnd(29)}│`);
  console.log(`  │  QA Score:     ${(summary.qaScore + "%").padEnd(29)}│`);
  console.log(`  │  QA Gate:      ${(summary.qaPass ? "PASS ✓" : "FAIL ✗").padEnd(29)}│`);
  console.log(`  │  Issues:       ${String(summary.qaFailed).padEnd(29)}│`);
  console.log(`  │  Cost:         ${cost.summary().padEnd(29)}│`);
  console.log(`  └─────────────────────────────────────────────┘`);

  if (summary.qaPass) {
    console.log(`\n  Next steps:`);
    console.log(`  1. Review output at: data/pipeline/${stateCode}/`);
    console.log(`  2. Claude ingests programs_generated.json → updates waiver-library.ts`);
    console.log(`  3. Review at /admin/benefits → click ${stateName}`);
    console.log(`  4. Seed: /api/admin/seed-sbf-programs?state=${stateCode}&confirm=true`);
    console.log(`  5. PR to staging → deploy → live`);
  } else {
    console.log(`\n  Fix ${summary.qaFailed} failing programs, then re-run:`);
    console.log(`  node scripts/benefits-pipeline.js --state ${stateCode} --phase qa`);
  }

  // Save run log
  const logPath = path.join(ensurePipelineDir(stateCode), "run_log.json");
  const existingLog = fs.existsSync(logPath)
    ? JSON.parse(fs.readFileSync(logPath, "utf-8"))
    : [];
  existingLog.push(summary);
  fs.writeFileSync(logPath, JSON.stringify(existingLog, null, 2));

  return summary;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
  const opts = parseArgs();

  if (!opts.state || !STATE_NAMES[opts.state]) {
    console.error(`  Error: Valid --state required (e.g., --state TX)`);
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

  console.log(`\n  Senior Benefits Pipeline`);
  console.log(`  State: ${stateName} (${stateCode})`);
  console.log(`  Phase: ${opts.phase}`);
  console.log(`  Mode:  ${opts.run ? "EXECUTE" : "DRY RUN"}`);
  console.log(`  ─────────────────────────────────`);

  // Load existing data
  const existingPrograms = loadExistingPrograms(stateCode);
  console.log(`  Existing programs in waiver-library.ts: ${existingPrograms.length}`);

  if (!opts.run) {
    console.log(`\n  This is a dry run. To execute, add --run:`);
    console.log(`  node scripts/benefits-pipeline.js --state ${stateCode} --run`);

    if (existingPrograms.length > 0) {
      console.log(`\n  Current ${stateCode} programs:`);
      for (const p of existingPrograms) {
        const verified = p.lastVerifiedDate ? `✓ ${p.lastVerifiedDate}` : "✗ unverified";
        console.log(`    ${p.name.padEnd(55)} ${verified}`);
      }
    }

    console.log(`\n  Pipeline would:`);
    if (shouldRun("discover")) console.log(`    1. DISCOVER: Query Perplexity for all ${stateName} programs`);
    if (shouldRun("verify"))   console.log(`    2. VERIFY:   Check each program against .gov sources`);
    if (shouldRun("generate")) console.log(`    3. GENERATE: Output verified data as JSON`);
    if (shouldRun("qa"))       console.log(`    4. QA:       Run automated quality checks`);
    if (shouldRun("finalize")) console.log(`    5. FINALIZE: Summary report + run log`);

    const estCalls = existingPrograms.length + 1; // 1 discover + 1 per program verify
    console.log(`\n  Estimated cost: ~$${(estCalls * 0.005).toFixed(3)} (${estCalls} Perplexity calls)`);

    process.exit(0);
  }

  // ─── Execute phases ───────────────────────────────────────────────────

  let discoveredData = readPipelineFile(stateCode, "programs_discovered.json");
  let verifiedData = readPipelineFile(stateCode, "programs_verified.json");
  let generatedData = readPipelineFile(stateCode, "programs_generated.json");
  let qaData = readPipelineFile(stateCode, "qa_report.json");

  // Phase 1: Discover
  if (shouldRun("discover")) {
    discoveredData = await phaseDiscover(stateCode, stateName, existingPrograms);
    writePipelineFile(stateCode, "programs_discovered.json", discoveredData);
  }

  // Phase 2: Verify
  if (shouldRun("verify")) {
    if (!discoveredData) {
      discoveredData = readPipelineFile(stateCode, "programs_discovered.json");
    }
    verifiedData = await phaseVerify(stateCode, stateName, discoveredData, existingPrograms);
    if (verifiedData) {
      writePipelineFile(stateCode, "programs_verified.json", verifiedData);
    }
  }

  // Phase 3: Generate
  if (shouldRun("generate")) {
    if (!verifiedData) {
      verifiedData = readPipelineFile(stateCode, "programs_verified.json");
    }
    generatedData = phaseGenerate(stateCode, stateName, verifiedData, existingPrograms);
    if (generatedData) {
      writePipelineFile(stateCode, "programs_generated.json", generatedData);
    }
  }

  // Phase 4: QA
  if (shouldRun("qa")) {
    if (!generatedData) {
      generatedData = readPipelineFile(stateCode, "programs_generated.json");
    }
    qaData = phaseQa(stateCode, stateName, generatedData);
    if (qaData) {
      writePipelineFile(stateCode, "qa_report.json", qaData);
    }
  }

  // Phase 5: Finalize
  if (shouldRun("finalize")) {
    if (!qaData) qaData = readPipelineFile(stateCode, "qa_report.json");
    if (!generatedData) generatedData = readPipelineFile(stateCode, "programs_generated.json");
    phaseFinalize(stateCode, stateName, qaData, generatedData);
  }

  console.log(`\n  Done. ${cost.summary()}\n`);
}

main().catch((err) => {
  console.error(`\n  Fatal error: ${err.message}`);
  console.error(err.stack);
  process.exit(1);
});
