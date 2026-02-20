/**
 * Backfill provider_description in olera-providers from CSV archive.
 *
 * Usage:
 *   node scripts/backfill-descriptions.mjs --dry-run   # Preview what would change
 *   node scripts/backfill-descriptions.mjs              # Execute the update
 */

import { createClient } from "@supabase/supabase-js";
import { createReadStream } from "fs";
import { parse } from "csv-parse";

// --- Config ---
const SUPABASE_URL = "https://ocaabzfiiikjcgqwhbwr.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_KEY) {
  console.error("Error: Set SUPABASE_KEY env var.\nUsage: SUPABASE_KEY=... node scripts/backfill-descriptions.mjs --dry-run");
  process.exit(1);
}
const CSV_PATH =
  "/Users/tfalohun/Desktop/OleraClean/Current Database/Descriptions/Provider Database-Descriptions.csv";
const BATCH_SIZE = 500;
const DRY_RUN = process.argv.includes("--dry-run");

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- Step 1: Read CSV into a map ---
async function readCSV() {
  const descriptions = new Map();
  const parser = createReadStream(CSV_PATH).pipe(
    parse({ columns: true, skip_empty_lines: true, relax_column_count: true, bom: true })
  );

  for await (const row of parser) {
    const id = (row.provider_id || "").trim();
    const desc = (row.provider_description || "").trim();
    if (id && desc) {
      descriptions.set(id, desc);
    }
  }

  return descriptions;
}

// --- Step 2: Find providers with NULL descriptions ---
async function getProvidersWithoutDescriptions() {
  const ids = [];
  let from = 0;
  const PAGE = 1000;

  while (true) {
    const { data, error } = await supabase
      .from("olera-providers")
      .select("provider_id")
      .is("provider_description", null)
      .not("deleted", "is", true)
      .range(from, from + PAGE - 1);

    if (error) throw new Error(`Supabase query failed: ${error.message}`);
    if (!data || data.length === 0) break;

    for (const row of data) ids.push(row.provider_id);
    if (data.length < PAGE) break;
    from += PAGE;
  }

  return ids;
}

// --- Step 3: Batch update ---
async function updateDescriptions(updates) {
  let updated = 0;
  let failed = 0;

  for (let i = 0; i < updates.length; i += BATCH_SIZE) {
    const batch = updates.slice(i, i + BATCH_SIZE);

    // Supabase JS doesn't support bulk upsert by arbitrary column easily,
    // so we update one-by-one but in parallel batches
    const results = await Promise.allSettled(
      batch.map(({ id, description }) =>
        supabase
          .from("olera-providers")
          .update({ provider_description: description })
          .eq("provider_id", id)
      )
    );

    for (const r of results) {
      if (r.status === "fulfilled" && !r.value.error) {
        updated++;
      } else {
        failed++;
      }
    }

    const progress = Math.min(i + BATCH_SIZE, updates.length);
    process.stdout.write(`\r  Progress: ${progress}/${updates.length} (${updated} updated, ${failed} failed)`);
  }

  console.log(); // newline
  return { updated, failed };
}

// --- Main ---
async function main() {
  console.log(DRY_RUN ? "=== DRY RUN ===" : "=== LIVE UPDATE ===");
  console.log();

  // Read CSV
  console.log("1. Reading CSV...");
  const csvDescriptions = await readCSV();
  console.log(`   ${csvDescriptions.size} providers with descriptions in CSV`);

  // Find providers missing descriptions
  console.log("2. Querying Supabase for providers with NULL descriptions...");
  const nullIds = await getProvidersWithoutDescriptions();
  console.log(`   ${nullIds.length} providers with NULL provider_description`);

  // Match
  const updates = [];
  let noMatch = 0;
  for (const id of nullIds) {
    const desc = csvDescriptions.get(id);
    if (desc) {
      updates.push({ id, description: desc });
    } else {
      noMatch++;
    }
  }

  console.log(`   ${updates.length} can be filled from CSV`);
  console.log(`   ${noMatch} have no match in CSV (will remain NULL)`);
  console.log();

  if (updates.length === 0) {
    console.log("Nothing to update.");
    return;
  }

  // Preview
  console.log("3. Sample updates:");
  for (const u of updates.slice(0, 3)) {
    console.log(`   [${u.id}] "${u.description.slice(0, 80)}..."`);
  }
  console.log();

  if (DRY_RUN) {
    console.log("Dry run complete. Run without --dry-run to execute.");
    return;
  }

  // Execute
  console.log(`4. Updating ${updates.length} providers...`);
  const { updated, failed } = await updateDescriptions(updates);
  console.log();
  console.log(`Done! ${updated} updated, ${failed} failed.`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
