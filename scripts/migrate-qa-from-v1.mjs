/**
 * Migrate Q&A content from Olera 1.0 (iOS app) to 2.0 (provider_questions table).
 *
 * Reads questions_production.csv and answers_production.csv, maps answers
 * to their questions, and inserts into the provider_questions table.
 *
 * Usage:
 *   SUPABASE_KEY=... node scripts/migrate-qa-from-v1.mjs --dry-run   # Preview
 *   SUPABASE_KEY=... node scripts/migrate-qa-from-v1.mjs              # Execute
 */

import { createClient } from "@supabase/supabase-js";
import { createReadStream } from "fs";
import { parse } from "csv-parse";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

// --- Config ---
const SUPABASE_URL = "https://ocaabzfiiikjcgqwhbwr.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_KEY) {
  console.error(
    "Error: Set SUPABASE_KEY env var.\nUsage: SUPABASE_KEY=... node scripts/migrate-qa-from-v1.mjs --dry-run"
  );
  process.exit(1);
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const QUESTIONS_CSV = join(__dirname, "../docs/User migration info/questions_production.csv");
const ANSWERS_CSV = join(__dirname, "../docs/User migration info/answers_production.csv");
const BATCH_SIZE = 100;
const DRY_RUN = process.argv.includes("--dry-run");

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- CSV reader helper ---
function readCSV(filePath) {
  return new Promise((resolve, reject) => {
    const records = [];
    createReadStream(filePath)
      .pipe(parse({ columns: true, skip_empty_lines: true, relax_column_count: true }))
      .on("data", (row) => records.push(row))
      .on("error", reject)
      .on("end", () => resolve(records));
  });
}

// --- Map v1 status to v2 status ---
function mapStatus(reviewStatus, hasAnswer) {
  if (hasAnswer) return "answered";
  if (reviewStatus === "auto_approved" || reviewStatus === "approved") return "approved";
  if (reviewStatus === "rejected") return "rejected";
  if (reviewStatus === "flagged" || reviewStatus === "reported") return "flagged";
  return "pending";
}

// --- Filter out test entries ---
function isTestEntry(providerId) {
  // UUID-format provider IDs are test accounts from the dev environment
  return /^[0-9a-f]{8}-[0-9a-f]{4}-/.test(providerId);
}

async function main() {
  console.log(`Mode: ${DRY_RUN ? "DRY RUN" : "LIVE"}`);
  console.log("Reading CSVs...");

  // Step 1: Read answers and build a map: question_id -> answer
  const answersRaw = await readCSV(ANSWERS_CSV);
  const answersByQuestionId = new Map();

  for (const a of answersRaw) {
    const qId = a.question_id?.trim();
    if (!qId) continue;

    // If multiple answers exist for the same question, pick the most recent
    const existing = answersByQuestionId.get(qId);
    if (!existing || new Date(a.created_at) > new Date(existing.created_at)) {
      answersByQuestionId.set(qId, a);
    }
  }
  console.log(`  Answers loaded: ${answersByQuestionId.size} unique (from ${answersRaw.length} rows)`);

  // Step 2: Read questions
  const questionsRaw = await readCSV(QUESTIONS_CSV);
  console.log(`  Questions loaded: ${questionsRaw.length}`);

  // Step 3: Build insert rows
  const rows = [];
  let skippedTest = 0;
  let skippedEmpty = 0;

  for (const q of questionsRaw) {
    const providerId = q.provider_id?.trim();
    const question = q.content?.trim();
    const askerName = q.author_username?.trim() || "Anonymous";
    const v1Id = q.id?.trim();

    if (!providerId || !question) {
      skippedEmpty++;
      continue;
    }

    if (isTestEntry(providerId)) {
      skippedTest++;
      continue;
    }

    const answer = answersByQuestionId.get(v1Id);
    const answerText = answer?.content?.trim() || null;
    const hasAnswer = !!answerText;
    const status = mapStatus(q.review_status?.trim(), hasAnswer);

    rows.push({
      provider_id: providerId,
      asker_name: askerName,
      asker_email: null,
      asker_user_id: null,
      question: question,
      answer: answerText,
      answered_by: null,
      answered_at: hasAnswer ? new Date(answer.created_at).toISOString() : null,
      status: status,
      is_public: status === "approved" || status === "answered",
      created_at: new Date(q.created_at).toISOString(),
      updated_at: new Date(q.updated_at).toISOString(),
    });
  }

  console.log(`\nReady to insert: ${rows.length} questions`);
  console.log(`  With answers: ${rows.filter((r) => r.answer).length}`);
  console.log(`  Skipped (test): ${skippedTest}`);
  console.log(`  Skipped (empty): ${skippedEmpty}`);
  console.log(`  Status breakdown:`);

  const statusCounts = {};
  for (const r of rows) {
    statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
  }
  for (const [s, c] of Object.entries(statusCounts)) {
    console.log(`    ${s}: ${c}`);
  }

  if (DRY_RUN) {
    console.log("\n--- DRY RUN: No data written ---");
    console.log("\nSample rows (first 3):");
    for (const r of rows.slice(0, 3)) {
      console.log(JSON.stringify(r, null, 2));
    }
    return;
  }

  // Step 4: Insert in batches
  console.log(`\nInserting in batches of ${BATCH_SIZE}...`);
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from("provider_questions").insert(batch);

    if (error) {
      console.error(`  Batch ${Math.floor(i / BATCH_SIZE) + 1} failed:`, error.message);
      errors++;
    } else {
      inserted += batch.length;
      process.stdout.write(`  Inserted ${inserted}/${rows.length}\r`);
    }
  }

  console.log(`\n\nDone! Inserted: ${inserted}, Errors: ${errors} batches`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
