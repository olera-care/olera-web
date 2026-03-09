/**
 * Fix migrated Q&A provider_ids: replace v1 short IDs with slugs.
 *
 * The provider page queries provider_questions by slug, but the migration
 * inserted the v1 short provider_id. This script looks up each provider_id
 * in olera-providers, gets its slug, and updates the question.
 *
 * Usage:
 *   SUPABASE_KEY=... node scripts/fix-qa-provider-ids.mjs --dry-run
 *   SUPABASE_KEY=... node scripts/fix-qa-provider-ids.mjs
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://ocaabzfiiikjcgqwhbwr.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_KEY) {
  console.error("Error: Set SUPABASE_KEY env var.");
  process.exit(1);
}

const DRY_RUN = process.argv.includes("--dry-run");
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  console.log(`Mode: ${DRY_RUN ? "DRY RUN" : "LIVE"}`);

  // Step 1: Get all unique provider_ids from provider_questions (paginated)
  const questions = [];
  let offset = 0;
  const PAGE = 1000;
  while (true) {
    const { data, error: qErr } = await db
      .from("provider_questions")
      .select("id, provider_id")
      .range(offset, offset + PAGE - 1);

    if (qErr) {
      console.error("Failed to fetch questions:", qErr.message);
      process.exit(1);
    }
    questions.push(...data);
    if (data.length < PAGE) break;
    offset += PAGE;
  }

  // Collect unique v1-style provider_ids (short alphanumeric, not slugs)
  // Slugs contain hyphens and are longer; v1 IDs are 7-char alphanumeric
  const uniqueIds = [...new Set(questions.map((q) => q.provider_id))];
  const v1Ids = uniqueIds.filter((id) => !id.includes("-") && id.length < 20);

  console.log(`Total questions: ${questions.length}`);
  console.log(`Unique provider_ids: ${uniqueIds.length}`);
  console.log(`V1-style IDs to fix: ${v1Ids.length}`);
  console.log(`Already using slugs: ${uniqueIds.length - v1Ids.length}`);

  if (v1Ids.length === 0) {
    console.log("Nothing to fix!");
    return;
  }

  // Step 2: Look up slugs for each v1 provider_id from olera-providers
  // Fetch in batches since .in() has limits
  const BATCH = 100;
  const idToSlug = new Map();
  const missingIds = [];

  for (let i = 0; i < v1Ids.length; i += BATCH) {
    const batch = v1Ids.slice(i, i + BATCH);
    const { data: providers, error } = await db
      .from("olera-providers")
      .select("provider_id, slug, provider_name, state")
      .in("provider_id", batch);

    if (error) {
      console.error("Failed to fetch providers:", error.message);
      process.exit(1);
    }

    for (const p of providers) {
      if (p.slug) {
        idToSlug.set(p.provider_id, p.slug);
      } else {
        // Generate slug from name + state (same logic as generateProviderSlug)
        const name = p.provider_name || "";
        const state = p.state || "";
        const slug = `${name}-${state}`
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");
        if (slug) {
          idToSlug.set(p.provider_id, slug);
        } else {
          missingIds.push(p.provider_id);
        }
      }
    }

    // Track IDs not found in olera-providers at all
    for (const id of batch) {
      if (!providers.some((p) => p.provider_id === id)) {
        missingIds.push(id);
      }
    }
  }

  console.log(`\nSlug mappings found: ${idToSlug.size}`);
  if (missingIds.length > 0) {
    console.log(`Missing/no-slug providers: ${missingIds.length}`);
    console.log(`  Examples: ${missingIds.slice(0, 5).join(", ")}`);
  }

  // Step 3: Update questions
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  // Group questions by old provider_id for batch updates
  for (const [oldId, newSlug] of idToSlug.entries()) {
    if (oldId === newSlug) {
      skipped++;
      continue;
    }

    if (DRY_RUN) {
      const count = questions.filter((q) => q.provider_id === oldId).length;
      console.log(`  ${oldId} → ${newSlug} (${count} questions)`);
      updated += count;
      continue;
    }

    const { error } = await db
      .from("provider_questions")
      .update({ provider_id: newSlug })
      .eq("provider_id", oldId);

    if (error) {
      console.error(`  Failed to update ${oldId}:`, error.message);
      errors++;
    } else {
      const count = questions.filter((q) => q.provider_id === oldId).length;
      updated += count;
    }
  }

  console.log(`\n${DRY_RUN ? "Would update" : "Updated"}: ${updated} questions`);
  console.log(`Skipped (already correct): ${skipped}`);
  console.log(`Errors: ${errors}`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
