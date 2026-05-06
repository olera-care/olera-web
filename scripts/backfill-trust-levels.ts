/**
 * Backfill Trust Levels for All Claimed Providers
 *
 * This script finds all claimed providers (verified OR unverified) with null
 * claim_trust_level, retrieves their claimer email, scores them using the
 * existing scoreClaimTrust function, and updates the database.
 *
 * SAFE: Only updates claim_trust_level.
 * Does NOT modify verification_state, claim_state, or any access controls.
 *
 * Usage:
 *   npx tsx scripts/backfill-trust-levels.ts           # Dry run (default)
 *   npx tsx scripts/backfill-trust-levels.ts --commit  # Actually write to DB
 */

import { createClient } from "@supabase/supabase-js";
import { scoreClaimTrust, extractDomainFromWebsite } from "../lib/claim-trust";
import { readFileSync } from "fs";
import { resolve } from "path";

// ============================================================
// Load environment variables from .env.local
// ============================================================

function loadEnvFile() {
  const envPath = resolve(process.cwd(), ".env.local");
  try {
    const content = readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIndex = trimmed.indexOf("=");
      if (eqIndex === -1) continue;
      const key = trimmed.slice(0, eqIndex).trim();
      let value = trimmed.slice(eqIndex + 1).trim();
      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
    console.log("Loaded environment from .env.local");
  } catch {
    console.log("No .env.local found, using existing environment variables");
  }
}

loadEnvFile();

// ============================================================
// Configuration
// ============================================================

const BATCH_SIZE = 10; // Process in batches to avoid overwhelming the API
const DELAY_BETWEEN_BATCHES_MS = 1000; // 1 second between batches

// ============================================================
// Setup
// ============================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing environment variables:");
  console.error("  NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl ? "✓" : "✗");
  console.error("  SUPABASE_SERVICE_ROLE_KEY:", supabaseServiceKey ? "✓" : "✗");
  console.error("\nMake sure your .env.local file has these variables set.");
  process.exit(1);
}

const db = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

const isDryRun = !process.argv.includes("--commit");

// ============================================================
// Types
// ============================================================

interface Provider {
  id: string;
  display_name: string;
  account_id: string | null;
  city: string | null;
  state: string | null;
  category: string | null;
  website: string | null;
  verification_state: string;
  claim_trust_level: string | null;
}

interface Account {
  id: string;
  user_id: string;
}

// ============================================================
// Main Logic
// ============================================================

async function getClaimerEmail(accountId: string): Promise<string | null> {
  // Get user_id from accounts table
  const { data: account, error: accountError } = await db
    .from("accounts")
    .select("user_id")
    .eq("id", accountId)
    .single();

  if (accountError || !account) {
    return null;
  }

  // Get email from auth.users
  const { data: authUser, error: authError } = await db.auth.admin.getUserById(
    account.user_id
  );

  if (authError || !authUser?.user?.email) {
    return null;
  }

  return authUser.user.email;
}

async function processProvider(
  provider: Provider
): Promise<{ success: boolean; level?: string; reason?: string; error?: string }> {
  if (!provider.account_id) {
    return { success: false, error: "No account_id (unclaimed?)" };
  }

  const email = await getClaimerEmail(provider.account_id);
  if (!email) {
    return { success: false, error: "Could not retrieve claimer email" };
  }

  // Score using existing trust function
  const trustResult = await scoreClaimTrust({
    email,
    providerName: provider.display_name,
    providerCity: provider.city,
    providerState: provider.state,
    providerCategory: provider.category,
    providerDomain: extractDomainFromWebsite(provider.website),
  });

  if (!isDryRun) {
    // Only update claim_trust_level (claim_trust_reason column may not exist)
    const { error: updateError } = await db
      .from("business_profiles")
      .update({
        claim_trust_level: trustResult.level,
      })
      .eq("id", provider.id);

    if (updateError) {
      return { success: false, error: `DB update failed: ${updateError.message}` };
    }
  }

  return {
    success: true,
    level: trustResult.level,
    reason: trustResult.reason,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log("=".repeat(60));
  console.log("Backfill Trust Levels for All Claimed Providers");
  console.log("=".repeat(60));
  console.log("");
  console.log(`Mode: ${isDryRun ? "DRY RUN (no changes)" : "COMMIT (writing to DB)"}`);
  console.log("");

  // Find all claimed providers without trust level
  // Includes both verified AND unverified providers who have claimed
  // Only organizations and caregivers (NOT family, student, or other types)
  const { data: providers, error: fetchError } = await db
    .from("business_profiles")
    .select("id, display_name, account_id, city, state, category, website, verification_state, claim_trust_level")
    .is("claim_trust_level", null)
    .not("account_id", "is", null)
    .in("claim_state", ["pending", "claimed"])
    .in("type", ["organization", "caregiver"])
    .order("updated_at", { ascending: false });

  if (fetchError) {
    console.error("Failed to fetch providers:", fetchError.message);
    process.exit(1);
  }

  if (!providers || providers.length === 0) {
    console.log("No providers found with null trust level. Nothing to backfill.");
    return;
  }

  console.log(`Found ${providers.length} claimed providers with null trust level.`);
  console.log("");

  // Process in batches
  const stats = { total: providers.length, success: 0, failed: 0, high: 0, medium: 0, low: 0 };
  const failures: { name: string; error: string }[] = [];

  for (let i = 0; i < providers.length; i += BATCH_SIZE) {
    const batch = providers.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(providers.length / BATCH_SIZE);

    console.log(`Processing batch ${batchNum}/${totalBatches} (${batch.length} providers)...`);

    const results = await Promise.all(
      batch.map(async (provider) => {
        const result = await processProvider(provider as Provider);
        return { provider, result };
      })
    );

    for (const { provider, result } of results) {
      if (result.success) {
        stats.success++;
        if (result.level === "high") stats.high++;
        else if (result.level === "medium") stats.medium++;
        else if (result.level === "low") stats.low++;

        console.log(
          `  ✓ ${provider.display_name.slice(0, 40).padEnd(40)} → ${result.level?.toUpperCase().padEnd(6)} | ${result.reason?.slice(0, 50)}`
        );
      } else {
        stats.failed++;
        failures.push({ name: provider.display_name, error: result.error || "Unknown error" });
        console.log(`  ✗ ${provider.display_name.slice(0, 40).padEnd(40)} → FAILED: ${result.error}`);
      }
    }

    // Delay between batches to avoid rate limiting
    if (i + BATCH_SIZE < providers.length) {
      await sleep(DELAY_BETWEEN_BATCHES_MS);
    }
  }

  // Summary
  console.log("");
  console.log("=".repeat(60));
  console.log("Summary");
  console.log("=".repeat(60));
  console.log(`Total processed: ${stats.total}`);
  console.log(`Successful:      ${stats.success}`);
  console.log(`Failed:          ${stats.failed}`);
  console.log("");
  console.log("Trust Level Distribution:");
  console.log(`  High:   ${stats.high}`);
  console.log(`  Medium: ${stats.medium}`);
  console.log(`  Low:    ${stats.low}`);

  if (failures.length > 0) {
    console.log("");
    console.log("Failures:");
    for (const f of failures.slice(0, 10)) {
      console.log(`  - ${f.name}: ${f.error}`);
    }
    if (failures.length > 10) {
      console.log(`  ... and ${failures.length - 10} more`);
    }
  }

  if (isDryRun) {
    console.log("");
    console.log("─".repeat(60));
    console.log("This was a DRY RUN. No changes were made to the database.");
    console.log("Run with --commit to apply changes:");
    console.log("  npx tsx scripts/backfill-trust-levels.ts --commit");
    console.log("─".repeat(60));
  } else {
    console.log("");
    console.log("✓ Changes committed to database.");
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
