/**
 * Rewrite the first sentence of provider_description for a batch of
 * candidates produced by 1_select-candidates.mjs.
 *
 * Usage:
 *   # Dry run — no Supabase writes, prints diffs to stdout
 *   SUPABASE_KEY=... ANTHROPIC_API_KEY=... node scripts/description-rewrite/2_rewrite-descriptions.mjs \
 *     --candidates scripts/description-rewrite/candidates-wave-01.json \
 *     --wave 1 \
 *     --limit 10 \
 *     --dry-run
 *
 *   # Live wave 1 (first 500)
 *   SUPABASE_KEY=... ANTHROPIC_API_KEY=... node scripts/description-rewrite/2_rewrite-descriptions.mjs \
 *     --candidates scripts/description-rewrite/candidates-wave-01.json \
 *     --wave 1
 */
import { readFileSync, writeFileSync, appendFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

const SUPABASE_URL = "https://ocaabzfiiikjcgqwhbwr.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = process.env.REWRITE_MODEL || "claude-haiku-4-5-20251001";

if (!SUPABASE_KEY || !ANTHROPIC_API_KEY) {
  console.error("Error: Set both SUPABASE_KEY and ANTHROPIC_API_KEY env vars.");
  process.exit(1);
}

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  if (i === -1) return fallback;
  return process.argv[i + 1];
}

const CANDIDATES_PATH = arg("--candidates");
if (!CANDIDATES_PATH) {
  console.error("Error: --candidates <path> is required");
  process.exit(1);
}
const WAVE = parseInt(arg("--wave", "1"), 10);
const LIMIT = parseInt(arg("--limit", "0"), 10); // 0 = no limit
const DRY_RUN = process.argv.includes("--dry-run");
const CONCURRENCY = parseInt(arg("--concurrency", "4"), 10);
// --variant-lock C: force a single variant for every record instead of the
// A/B/C index rotation. Wave 2 is Senior Communities × variant C only, the
// only cell that won across both the 3-week and 4-week wave-1 reads.
const VARIANT_LOCK = arg("--variant-lock", null);
if (VARIANT_LOCK && !["A", "B", "C"].includes(VARIANT_LOCK)) {
  console.error(`Error: --variant-lock must be one of A, B, C (got "${VARIANT_LOCK}")`);
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

// Three style variants. Rotated deterministically by candidate index so the
// SERP fingerprint doesn't cluster on any single pattern.
//
// A  — Name-first descriptive.     "Regency at Troy is an assisted living community in Troy, NY, offering..."
// B  — Name-first comma-inset.     "Regency at Troy, an assisted living community in Troy, NY, provides..."
// C  — Location-first.             "Based in Troy, NY, Regency at Troy is an assisted living community that..."
const STYLE_VARIANTS = ["A", "B", "C"];

const STYLE_GUIDANCE = {
  A: "Lead with the provider name. Structure: '{Name} is a {category phrased naturally} in {city}, {state}, {verb-phrase about services or focus}.'",
  B: "Lead with the provider name, immediately followed by a comma-set descriptor. Structure: '{Name}, a {category phrased naturally} in {city}, {state}, {verb-phrase about services or focus}.'",
  C: "Lead with the location. Structure: 'Based in {city}, {state}, {Name} is a {category phrased naturally} that {verb-phrase}.'",
};

function buildPrompt(candidate, variant) {
  const firstSentence = splitFirstSentence(candidate.original_description).first;

  return `You are rewriting the first sentence of a senior care provider's page description. This first sentence becomes the meta description snippet on Google search results, so it needs to be dense with provider name, facility type, and location in the first 80 characters to maximize click-through.

Only the first sentence changes. The rest of the description is human-written and stays as-is. The rewrite must read as natural prose, not as a template or keyword stuffing.

PROVIDER DATA
- Name: ${candidate.provider_name}
- Category (raw label): ${candidate.provider_category}
- City: ${candidate.city || "unknown"}
- State: ${candidate.state || "unknown"}

ORIGINAL FIRST SENTENCE (human-written, may contain useful facts):
"${firstSentence}"

ORIGINAL REST OF DESCRIPTION (remains unchanged, shown for context only):
"${candidate.original_description.slice(firstSentence.length, firstSentence.length + 500).trim()}"

STYLE VARIANT: ${variant}
${STYLE_GUIDANCE[variant]}

HARD RULES
1. 140–170 characters. Shorter than 140 wastes snippet real estate. Longer than 170 gets truncated by Google.
2. First 80 characters must include the provider name, a natural phrasing of the category, and the city + state.
3. Translate the raw category label into natural English. Examples:
   - "Home Care (Non-medical)" → "home care agency" or "in-home care provider"
   - "Home Health Care" → "home health agency" or "Medicare-certified home health agency"
   - "Assisted Living" → "assisted living community"
   - "Memory Care" → "memory care community"
   - "Nursing Home" → "nursing home" or "skilled nursing facility"
   - "Hospice" → "hospice provider"
   - "Independent Living" → "independent living community"
4. Preserve at least one distinctive fact from the original first sentence ONLY if it appears verbatim there (a specific service, accreditation, year founded, or population served). If the original is generic filler, skip — do not manufacture a distinctive fact to fill the gap.
5. State ONLY facts that appear verbatim in the provider data or the original sentence. Do NOT invent or infer services, certifications, specialties, languages, amenities, or descriptors. Inference counts as invention: if the original says "Indian inspired," you may NOT write "multilingual" or "culturally familiar care" — those are claims we cannot verify. When you have nothing verifiable beyond name, category, and location, write a clean sentence with just those three and a neutral closing phrase (e.g. "serving seniors in the area"). A shorter, fully-grounded sentence is always better than a longer one with an unverified claim.
6. Do NOT mention ratings, star counts, or review scores. Those are shown elsewhere on the page and change over time — baking them into static copy creates stale claims.
7. Do NOT mention prices, price ranges, or dollar amounts.
8. Do NOT use clickbait ("Discover...", "Find the best...", rhetorical questions).
9. End with a period. No trailing spaces.
10. Output ONLY the new first sentence, nothing else. No quotes, no commentary, no preamble.`;
}

function splitFirstSentence(desc) {
  if (!desc) return { first: "", rest: "" };
  // Find the first sentence-ending . ! ? that's followed by whitespace or end.
  // Keep the delimiter with the first sentence.
  const match = desc.match(/^[^.!?]*[.!?](?=\s|$)/);
  if (!match) return { first: desc, rest: "" };
  const first = match[0].trim();
  const rest = desc.slice(match[0].length).trim();
  return { first, rest };
}

// Category keywords -> canonical singleton category label. Supabase
// provider_category values can be either a single label ("Memory Care")
// or a " | " separated compound ("Assisted Living | Memory Care").
// The check below splits Supabase's value on " | " and tests whether any
// of the original's asserted phrases maps to a token in that set, so
// ordering doesn't matter. Order within this list matters only for
// longest-match-first dedup below ("home health care" must be checked
// before "home health" and "home care").
const CATEGORY_KEYWORDS = [
  { phrase: "skilled nursing", canonical: "Nursing Home" },
  { phrase: "nursing home", canonical: "Nursing Home" },
  { phrase: "memory care", canonical: "Memory Care" },
  { phrase: "home health care", canonical: "Home Health Care" },
  { phrase: "home health", canonical: "Home Health Care" },
  { phrase: "hospice", canonical: "Hospice" },
  { phrase: "assisted living", canonical: "Assisted Living" },
  { phrase: "independent living", canonical: "Independent Living" },
  { phrase: "home care", canonical: "Home Care (Non-medical)" },
];

// Returns null if the original's asserted categories overlap with any
// Supabase provider_category token, or if the original is silent on
// category. Returns an {asserted, expected} pair only when none of the
// asserted categories match Supabase (a true data-quality mismatch).
function detectCategoryDivergence(firstSentence, providerCategory) {
  if (!firstSentence || !providerCategory) return null;
  const lower = firstSentence.toLowerCase();

  const supabaseTokens = new Set(
    providerCategory.split(/\s*\|\s*/).map((t) => t.trim()).filter(Boolean)
  );

  const assertedCanonicals = [];
  const assertedPhrases = [];
  const seenPositions = new Set();
  for (const { phrase, canonical } of CATEGORY_KEYWORDS) {
    const idx = lower.indexOf(phrase);
    if (idx === -1) continue;
    // Skip overlapping matches: "home health" inside "home health care" etc.
    let overlaps = false;
    for (let i = idx; i < idx + phrase.length; i++) {
      if (seenPositions.has(i)) { overlaps = true; break; }
    }
    if (overlaps) continue;
    for (let i = idx; i < idx + phrase.length; i++) seenPositions.add(i);
    assertedPhrases.push(phrase);
    assertedCanonicals.push(canonical);
  }

  if (assertedCanonicals.length === 0) return null; // silent original -> defer to Supabase
  const anyAgrees = assertedCanonicals.some((c) => supabaseTokens.has(c));
  if (anyAgrees) return null;
  return { asserted: assertedPhrases.join("+"), expected: providerCategory };
}

// Diff-check validation. Any failure routes the record to rejected status and
// we leave the original description alone.
function validate(newFirst, candidate) {
  const fail = (reason) => ({ ok: false, reason });
  if (!newFirst) return fail("empty_output");
  const len = newFirst.length;
  if (len < 100) return fail(`too_short_${len}`);
  if (len > 200) return fail(`too_long_${len}`);
  if (!nameIsPresent(newFirst, candidate.provider_name)) return fail("missing_name");
  if (candidate.city && !newFirst.toLowerCase().includes(candidate.city.toLowerCase()))
    return fail("missing_city");
  if (candidate.state && !newFirst.toUpperCase().includes(candidate.state.toUpperCase()))
    return fail("missing_state");
  // Reject bare templates that have clearly failed to vary
  if (/^(Discover|Find the best|Looking for)/i.test(newFirst))
    return fail("banned_hook");
  if (!/[.!?]$/.test(newFirst)) return fail("missing_terminator");
  return { ok: true };
}

// A provider name is "present" if the first 2-3 significant words of the
// cleaned name appear contiguously in the rewrite. This handles long/ugly
// names ("Always Best Care Senior Services - Home Care Services in Atlanta"
// where the LLM sensibly uses "Always Best Care Senior Services") and single-
// word abbreviations ("CDWA") while still catching cases where the LLM drops
// the name entirely.
function nameIsPresent(text, name) {
  if (!name) return true;
  const lowerText = text.toLowerCase();
  if (lowerText.includes(name.toLowerCase())) return true;
  // Extract the "core" name: everything before " - " or " | " separators.
  const core = name.split(/\s+[-|]\s+/)[0].trim();
  if (core && lowerText.includes(core.toLowerCase())) return true;
  // Fall back to first N significant words.
  const words = core
    .split(/\s+/)
    .filter((w) => w.length > 1 && !["of", "the", "in", "at", "and", "&"].includes(w.toLowerCase()));
  const probe = words.slice(0, Math.min(3, Math.max(1, words.length))).join(" ");
  return probe && lowerText.includes(probe.toLowerCase());
}

async function rewriteOne(candidate, variant) {
  const prompt = buildPrompt(candidate, variant);
  const start = Date.now();
  try {
    const msg = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 300,
      temperature: 0.2,
      messages: [{ role: "user", content: prompt }],
    });
    const text = msg.content
      .filter((c) => c.type === "text")
      .map((c) => c.text)
      .join("")
      .trim()
      .replace(/^["']|["']$/g, ""); // strip any accidental surrounding quotes
    const elapsedMs = Date.now() - start;
    return { text, elapsedMs };
  } catch (err) {
    return { text: null, elapsedMs: Date.now() - start, error: String(err?.message || err) };
  }
}

async function main() {
  console.log(`=== Description rewrite ${DRY_RUN ? "(DRY RUN)" : "(LIVE)"} ===`);
  console.log(`Model:        ${MODEL}`);
  console.log(`Wave:         ${WAVE}`);
  console.log(`Candidates:   ${CANDIDATES_PATH}`);
  console.log();

  const all = JSON.parse(readFileSync(CANDIDATES_PATH, "utf8"));
  const candidates = LIMIT > 0 ? all.slice(0, LIMIT) : all;
  console.log(`Processing ${candidates.length} records (of ${all.length} total).`);
  console.log();

  const stats = {
    applied: 0,
    rejected: 0,
    errors: 0,
    byVariant: { A: 0, B: 0, C: 0 },
    byReject: {},
  };

  const diffLog = [];
  const auditRows = [];

  // Simple throttle via batched Promise.all.
  for (let i = 0; i < candidates.length; i += CONCURRENCY) {
    const batch = candidates.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      batch.map(async (c, idx) => {
        const globalIdx = i + idx;
        const variant = VARIANT_LOCK || STYLE_VARIANTS[globalIdx % STYLE_VARIANTS.length];
        // Pre-LLM guard: if the original description's first sentence asserts
        // a category that disagrees with Supabase's provider_category, skip.
        // Either Supabase is wrong (stale data) or the original prose was
        // sloppy. Either way, rewriting would amplify the disagreement.
        const firstSentence = splitFirstSentence(c.original_description).first;
        const divergence = detectCategoryDivergence(firstSentence, c.provider_category);
        if (divergence) {
          stats.rejected++;
          stats.byReject.category_mismatch = (stats.byReject.category_mismatch || 0) + 1;
          return {
            candidate: c,
            variant,
            status: "rejected_category_mismatch",
            reject_reason: `orig_says_${divergence.asserted}_vs_supabase_${divergence.expected}`,
            new_first: null,
          };
        }
        const { text, error } = await rewriteOne(c, variant);
        if (error) {
          stats.errors++;
          stats.byReject.llm_error = (stats.byReject.llm_error || 0) + 1;
          return { candidate: c, variant, status: "rejected_llm_error", reject_reason: error, new_first: null };
        }
        const check = validate(text, c);
        if (!check.ok) {
          stats.rejected++;
          stats.byReject[check.reason] = (stats.byReject[check.reason] || 0) + 1;
          return {
            candidate: c,
            variant,
            status: `rejected_${check.reason}`,
            reject_reason: check.reason,
            new_first: text,
          };
        }
        stats.applied++;
        stats.byVariant[variant] = (stats.byVariant[variant] || 0) + 1;
        return { candidate: c, variant, status: "applied", reject_reason: null, new_first: text };
      })
    );

    for (const r of results) {
      const orig = splitFirstSentence(r.candidate.original_description).first;
      diffLog.push({
        slug: r.candidate.gsc_slug,
        provider_id: r.candidate.provider_id,
        variant: r.variant,
        status: r.status,
        reject_reason: r.reject_reason,
        impressions: r.candidate.impressions_current,
        clicks: r.candidate.clicks_current,
        ctr: r.candidate.ctr_current,
        position: r.candidate.position_current,
        original: orig,
        new: r.new_first,
      });
      auditRows.push({
        provider_id: r.candidate.provider_id,
        wave: WAVE,
        style_variant: r.variant,
        model: MODEL,
        original_first_sentence: orig,
        new_first_sentence: r.new_first,
        status: r.status,
        reject_reason: r.reject_reason,
        impressions_current: r.candidate.impressions_current,
        clicks_current: r.candidate.clicks_current,
        ctr_current: r.candidate.ctr_current,
        position_current: r.candidate.position_current,
      });

      // Apply to Supabase if live + record applied.
      if (!DRY_RUN && r.status === "applied") {
        const { rest } = splitFirstSentence(r.candidate.original_description);
        const newDescription = rest ? `${r.new_first} ${rest}` : r.new_first;
        // First-time backup: only set provider_description_v1_backup if it
        // is currently null. This preserves the genuinely original text
        // across re-runs.
        const { error: updateErr } = await supabase.rpc(
          "update_provider_description_with_backup",
          {
            p_provider_id: r.candidate.provider_id,
            p_new_description: newDescription,
            p_original_description: r.candidate.original_description,
          }
        );
        if (updateErr) {
          // Fall back to direct UPDATE that only touches the backup column
          // if it's currently null. Two statements instead of one RPC. If
          // the RPC isn't installed in Supabase yet, this is the path.
          const { data: existing } = await supabase
            .from("olera-providers")
            .select("provider_description_v1_backup")
            .eq("provider_id", r.candidate.provider_id)
            .single();
          const patch = existing?.provider_description_v1_backup
            ? { provider_description: newDescription }
            : {
                provider_description: newDescription,
                provider_description_v1_backup: r.candidate.original_description,
              };
          const { error: fallbackErr } = await supabase
            .from("olera-providers")
            .update(patch)
            .eq("provider_id", r.candidate.provider_id);
          if (fallbackErr) {
            stats.errors++;
            stats.byReject["supabase_write_error"] = (stats.byReject.supabase_write_error || 0) + 1;
          }
        }
      }
    }

    const progress = Math.min(i + CONCURRENCY, candidates.length);
    process.stdout.write(
      `\r  Progress: ${progress}/${candidates.length}  applied=${stats.applied} rejected=${stats.rejected} errors=${stats.errors}`
    );
  }
  console.log();

  // Write audit log JSON (always) — lets us backfill the Supabase audit
  // table or re-inspect a run without hitting Supabase again.
  const auditPath = CANDIDATES_PATH.replace(/\.json$/, `-wave${WAVE}-audit${DRY_RUN ? "-dryrun" : ""}.json`);
  writeFileSync(auditPath, JSON.stringify(auditRows, null, 2));
  console.log(`Audit log: ${auditPath}`);

  // Write a readable diff log for human review
  const diffPath = CANDIDATES_PATH.replace(/\.json$/, `-wave${WAVE}-diff${DRY_RUN ? "-dryrun" : ""}.txt`);
  const diffText = diffLog
    .map((d) => {
      return [
        `SLUG:       ${d.slug}`,
        `PROVIDER:   ${d.provider_id}`,
        `VARIANT:    ${d.variant}`,
        `STATUS:     ${d.status}${d.reject_reason ? ` (${d.reject_reason})` : ""}`,
        `BASELINE:   imp=${d.impressions} clicks=${d.clicks} ctr=${(d.ctr * 100).toFixed(2)}% pos=${d.position?.toFixed(1) ?? "—"}`,
        `ORIGINAL:   ${d.original}`,
        `NEW:        ${d.new ?? "(none)"}`,
        "",
      ].join("\n");
    })
    .join("\n");
  writeFileSync(diffPath, diffText);
  console.log(`Diff log:  ${diffPath}`);

  // Write audit rows to Supabase if live. Idempotent per (provider_id,wave)
  // is not guaranteed; re-running the same wave will create duplicate audit
  // rows. That's intentional for now — the wave number makes it easy to
  // filter the latest run when analyzing.
  if (!DRY_RUN) {
    const CHUNK = 200;
    for (let i = 0; i < auditRows.length; i += CHUNK) {
      const chunk = auditRows.slice(i, i + CHUNK);
      const { error } = await supabase.from("provider_description_rewrites").insert(chunk);
      if (error) console.error("Audit insert error:", error.message);
    }
    console.log(`Inserted ${auditRows.length} audit rows.`);
  }

  console.log();
  console.log("=== Stats ===");
  console.log(`Applied:    ${stats.applied}`);
  console.log(`Rejected:   ${stats.rejected}`);
  console.log(`Errors:     ${stats.errors}`);
  console.log(`Variant distribution: A=${stats.byVariant.A} B=${stats.byVariant.B} C=${stats.byVariant.C}`);
  if (Object.keys(stats.byReject).length > 0) {
    console.log(`Reject reasons:`);
    for (const [k, v] of Object.entries(stats.byReject)) {
      console.log(`  ${k}: ${v}`);
    }
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
