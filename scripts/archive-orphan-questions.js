#!/usr/bin/env node
/**
 * Archive questions that reference non-existent providers.
 *
 * Run with:
 *   node scripts/archive-orphan-questions.js --dry-run  (preview changes)
 *   node scripts/archive-orphan-questions.js            (apply changes)
 *
 * These are questions where:
 * - metadata.needs_provider_email = true
 * - status is not archived/rejected
 * - provider_id doesn't exist in business_profiles OR olera-providers
 */

const DRY_RUN = process.argv.includes("--dry-run");

require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const db = createClient(supabaseUrl, supabaseServiceKey);

async function archiveOrphanQuestions() {
  if (DRY_RUN) {
    console.log("🔍 DRY RUN MODE - No changes will be made\n");
  } else {
    console.log("⚡ LIVE MODE - Changes will be applied\n");
  }

  // Get questions needing email that aren't archived/rejected
  const { data: questions, error } = await db
    .from("provider_questions")
    .select("id, provider_id, question, status, metadata, created_at")
    .neq("status", "archived")
    .neq("status", "rejected")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching questions:", error);
    process.exit(1);
  }

  // Filter to questions with needs_provider_email flag
  const needsEmail = questions.filter((q) => {
    const meta = q.metadata || {};
    return meta.needs_provider_email === true;
  });

  console.log(`Found ${needsEmail.length} questions with needs_provider_email flag\n`);

  // Get unique provider IDs
  const providerIds = [...new Set(needsEmail.map((q) => q.provider_id).filter(Boolean))];
  console.log(`Checking ${providerIds.length} unique provider IDs...\n`);

  // Look up providers in business_profiles
  const { data: bpProviders } = await db
    .from("business_profiles")
    .select("slug")
    .in("slug", providerIds);

  // Look up providers in olera-providers
  const { data: oleraProviders } = await db
    .from("olera-providers")
    .select("slug")
    .in("slug", providerIds)
    .not("deleted", "is", true);

  // Build set of existing provider IDs
  const existingProviders = new Set();
  for (const p of bpProviders || []) {
    if (p.slug) existingProviders.add(p.slug);
  }
  for (const p of oleraProviders || []) {
    if (p.slug) existingProviders.add(p.slug);
  }

  console.log(`Providers found in business_profiles: ${bpProviders?.length || 0}`);
  console.log(`Providers found in olera-providers: ${oleraProviders?.length || 0}`);
  console.log(`Total unique providers that exist: ${existingProviders.size}\n`);

  // Find orphan questions (provider doesn't exist)
  const orphanQuestions = needsEmail.filter((q) => !existingProviders.has(q.provider_id));

  console.log(`Found ${orphanQuestions.length} orphan questions (provider doesn't exist)\n`);

  if (orphanQuestions.length === 0) {
    console.log("No orphan questions to archive!");
    return;
  }

  // Show what we'll archive
  console.log("Questions to archive:");
  for (const q of orphanQuestions) {
    const preview = q.question?.substring(0, 50) || "(no question)";
    console.log(`  - ID: ${q.id}`);
    console.log(`    Provider ID: ${q.provider_id}`);
    console.log(`    Question: ${preview}...`);
    console.log(`    Created: ${q.created_at}`);
    console.log("");
  }

  if (DRY_RUN) {
    console.log("=".repeat(60));
    console.log("DRY RUN COMPLETE");
    console.log(`Would archive: ${orphanQuestions.length} questions`);
    console.log("\nRun without --dry-run to apply changes.");
    return;
  }

  // Archive the orphan questions
  let archived = 0;
  let failed = 0;

  for (const q of orphanQuestions) {
    const { error: updateError } = await db
      .from("provider_questions")
      .update({ status: "archived" })
      .eq("id", q.id);

    if (updateError) {
      console.error(`Failed to archive question ${q.id}:`, updateError);
      failed++;
    } else {
      archived++;
    }
  }

  console.log("=".repeat(60));
  console.log("Done!");
  console.log(`  Archived: ${archived}`);
  console.log(`  Failed: ${failed}`);
}

archiveOrphanQuestions().catch(console.error);
