/**
 * Backfill script to copy emails from auth.users to business_profiles
 * for family profiles that have an account_id but no email.
 *
 * This fixes historical profiles created before we started storing
 * email in business_profiles.email.
 *
 * Usage:
 *   npx tsx scripts/backfill-family-emails.ts [--dry-run]
 *
 * Options:
 *   --dry-run   Show what would be updated without making changes
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function backfillFamilyEmails(dryRun: boolean) {
  console.log(`\n🔍 Finding family profiles without email...\n`);
  console.log(dryRun ? "🏃 DRY RUN - No changes will be made\n" : "");

  // Find family profiles with account_id but no email
  const { data: profiles, error: profilesError } = await db
    .from("business_profiles")
    .select("id, display_name, account_id, email")
    .eq("type", "family")
    .is("email", null)
    .not("account_id", "is", null)
    .order("created_at", { ascending: false });

  if (profilesError) {
    console.error("Error fetching profiles:", profilesError);
    process.exit(1);
  }

  if (!profiles || profiles.length === 0) {
    console.log("✅ No family profiles need email backfill.");
    return;
  }

  console.log(`Found ${profiles.length} family profiles without email\n`);

  // Get account_id → user_id mapping
  const accountIds = profiles.map((p) => p.account_id).filter(Boolean) as string[];
  const { data: accounts, error: accountsError } = await db
    .from("accounts")
    .select("id, user_id")
    .in("id", accountIds);

  if (accountsError) {
    console.error("Error fetching accounts:", accountsError);
    process.exit(1);
  }

  const accountToUser = new Map(accounts?.map((a) => [a.id, a.user_id]) || []);

  // Look up emails from auth.users
  const userIds = [...new Set(accounts?.map((a) => a.user_id).filter(Boolean) || [])] as string[];
  const userEmails = new Map<string, string>();

  console.log(`Looking up ${userIds.length} auth users...\n`);

  // Fetch users in batches
  const BATCH_SIZE = 10;
  for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
    const batch = userIds.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(
      batch.map((userId) => db.auth.admin.getUserById(userId))
    );
    for (const result of results) {
      if (result.data?.user?.email) {
        userEmails.set(result.data.user.id, result.data.user.email);
      }
    }
    process.stdout.write(`  Fetched ${Math.min(i + BATCH_SIZE, userIds.length)}/${userIds.length} users\r`);
  }
  console.log("\n");

  // Build updates
  const updates: Array<{ id: string; display_name: string; email: string }> = [];
  const noEmailFound: Array<{ id: string; display_name: string; account_id: string }> = [];

  for (const profile of profiles) {
    if (!profile.account_id) continue;

    const userId = accountToUser.get(profile.account_id);
    if (!userId) {
      noEmailFound.push({
        id: profile.id,
        display_name: profile.display_name,
        account_id: profile.account_id,
      });
      continue;
    }

    const email = userEmails.get(userId);
    if (!email) {
      noEmailFound.push({
        id: profile.id,
        display_name: profile.display_name,
        account_id: profile.account_id,
      });
      continue;
    }

    updates.push({
      id: profile.id,
      display_name: profile.display_name,
      email,
    });
  }

  // Report findings
  console.log(`📊 Results:`);
  console.log(`   - ${updates.length} profiles can be updated with email`);
  console.log(`   - ${noEmailFound.length} profiles have no resolvable email\n`);

  if (updates.length > 0) {
    console.log(`\n📝 Profiles to update:\n`);
    for (const u of updates.slice(0, 20)) {
      console.log(`   ${u.display_name}: ${u.email}`);
    }
    if (updates.length > 20) {
      console.log(`   ... and ${updates.length - 20} more`);
    }
  }

  if (noEmailFound.length > 0) {
    console.log(`\n⚠️  Profiles without resolvable email:\n`);
    for (const p of noEmailFound.slice(0, 10)) {
      console.log(`   ${p.display_name} (account: ${p.account_id})`);
    }
    if (noEmailFound.length > 10) {
      console.log(`   ... and ${noEmailFound.length - 10} more`);
    }
  }

  // Apply updates
  if (!dryRun && updates.length > 0) {
    console.log(`\n🔄 Applying updates...\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const update of updates) {
      const { error } = await db
        .from("business_profiles")
        .update({ email: update.email })
        .eq("id", update.id);

      if (error) {
        console.error(`   ❌ Failed to update ${update.display_name}: ${error.message}`);
        errorCount++;
      } else {
        successCount++;
      }
    }

    console.log(`\n✅ Done!`);
    console.log(`   - ${successCount} profiles updated successfully`);
    if (errorCount > 0) {
      console.log(`   - ${errorCount} profiles failed to update`);
    }
  } else if (dryRun && updates.length > 0) {
    console.log(`\n💡 Run without --dry-run to apply these updates`);
  }
}

// Main
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");

backfillFamilyEmails(dryRun)
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Script failed:", err);
    process.exit(1);
  });
