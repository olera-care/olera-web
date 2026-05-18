/**
 * Backfill script: Convert Guest care seekers with emails to proper accounts
 *
 * This script finds all family profiles where:
 * - account_id IS NULL (Guest)
 * - email IS NOT NULL (has contact email)
 *
 * For each, it:
 * 1. Checks if a Supabase Auth user exists with that email
 * 2. If yes: finds or creates the account, links the profile
 * 3. If no: creates Supabase Auth user + account, links the profile
 *
 * Usage:
 *   node scripts/backfill-guest-to-accounts.js [--dry-run]
 *
 * Options:
 *   --dry-run   Preview changes without making them
 */

const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

// Load .env.local if environment variables aren't set
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  const envPath = path.join(__dirname, "..", ".env.local");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf8");
    for (const line of envContent.split("\n")) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const eqIndex = trimmed.indexOf("=");
        if (eqIndex > 0) {
          const key = trimmed.slice(0, eqIndex);
          let value = trimmed.slice(eqIndex + 1);
          // Remove quotes if present
          if ((value.startsWith('"') && value.endsWith('"')) ||
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          process.env[key] = value;
        }
      }
    }
    console.log("Loaded environment from .env.local\n");
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const DRY_RUN = process.argv.includes("--dry-run");

async function main() {
  console.log(`\n🔍 Backfill Guest Care Seekers to Accounts`);
  console.log(`   Mode: ${DRY_RUN ? "DRY RUN (no changes)" : "LIVE"}\n`);

  // 1. Find all Guest family profiles with emails
  const { data: guests, error: fetchError } = await supabase
    .from("business_profiles")
    .select("id, email, display_name, phone, slug, created_at")
    .eq("type", "family")
    .is("account_id", null)
    .not("email", "is", null)
    .order("created_at", { ascending: false });

  if (fetchError) {
    console.error("Failed to fetch guests:", fetchError.message);
    process.exit(1);
  }

  console.log(`Found ${guests.length} Guest profiles with emails\n`);

  if (guests.length === 0) {
    console.log("Nothing to backfill.");
    return;
  }

  let converted = 0;
  let skipped = 0;
  let errors = 0;

  for (const guest of guests) {
    const email = guest.email.trim().toLowerCase();
    console.log(`\n--- Processing: ${guest.display_name} <${email}>`);
    console.log(`    Profile ID: ${guest.id}`);
    console.log(`    Created: ${guest.created_at}`);

    try {
      // Safety check: Skip if this email belongs to a provider/caregiver profile
      const { data: providerProfile } = await supabase
        .from("business_profiles")
        .select("id, type, display_name")
        .eq("email", email)
        .in("type", ["organization", "caregiver", "student"])
        .maybeSingle();

      if (providerProfile) {
        console.log(`    ⚠ Email belongs to a ${providerProfile.type} profile: ${providerProfile.display_name}`);
        console.log(`    → Skipping (don't mix provider/family accounts)`);
        skipped++;
        continue;
      }

      // 2. Check if Supabase Auth user exists
      let existingAuthUser = null;

      // Search through auth users to find by email
      const { data: userList } = await supabase.auth.admin.listUsers({ perPage: 1000 });
      if (userList?.users) {
        existingAuthUser = userList.users.find(u => u.email?.toLowerCase() === email);
      }

      if (existingAuthUser) {
        console.log(`    ✓ Auth user exists: ${existingAuthUser.id}`);

        // Check if account exists for this auth user
        const { data: existingAccount } = await supabase
          .from("accounts")
          .select("id, active_profile_id")
          .eq("user_id", existingAuthUser.id)
          .maybeSingle();

        if (existingAccount) {
          console.log(`    ✓ Account exists: ${existingAccount.id}`);

          // Check if this account already has a family profile
          const { data: existingFamilyProfile } = await supabase
            .from("business_profiles")
            .select("id")
            .eq("account_id", existingAccount.id)
            .eq("type", "family")
            .maybeSingle();

          if (existingFamilyProfile && existingFamilyProfile.id !== guest.id) {
            console.log(`    ⚠ Account already has a different family profile: ${existingFamilyProfile.id}`);
            console.log(`    → Skipping (would create duplicate)`);
            skipped++;
            continue;
          }

          // Link this guest profile to the existing account
          if (!DRY_RUN) {
            const { error: linkError } = await supabase
              .from("business_profiles")
              .update({
                account_id: existingAccount.id,
                claim_state: "claimed"
              })
              .eq("id", guest.id);

            if (linkError) {
              console.log(`    ✗ Failed to link: ${linkError.message}`);
              errors++;
              continue;
            }

            // Set as active profile if account doesn't have one
            if (!existingAccount.active_profile_id) {
              await supabase
                .from("accounts")
                .update({ active_profile_id: guest.id })
                .eq("id", existingAccount.id);
            }
          }

          console.log(`    ✓ Linked to existing account`);
          converted++;
        } else {
          // Auth user exists but no account - create account
          console.log(`    → Creating account for existing auth user`);

          if (!DRY_RUN) {
            const { data: newAccount, error: accountError } = await supabase
              .from("accounts")
              .insert({
                user_id: existingAuthUser.id,
                display_name: guest.display_name || "Care Seeker",
                active_profile_id: guest.id,
                onboarding_completed: false,
              })
              .select("id")
              .single();

            if (accountError) {
              console.log(`    ✗ Failed to create account: ${accountError.message}`);
              errors++;
              continue;
            }

            // Link profile to new account
            const { error: linkError } = await supabase
              .from("business_profiles")
              .update({
                account_id: newAccount.id,
                claim_state: "claimed"
              })
              .eq("id", guest.id);

            if (linkError) {
              console.log(`    ✗ Failed to link profile: ${linkError.message}`);
              errors++;
              continue;
            }
          }

          console.log(`    ✓ Created account and linked`);
          converted++;
        }
      } else {
        // No auth user exists - create one
        console.log(`    → Creating new auth user`);

        if (!DRY_RUN) {
          const { data: newAuthUser, error: authError } = await supabase.auth.admin.createUser({
            email: email,
            email_confirm: false, // They'll need to verify via magic link
            user_metadata: {
              full_name: guest.display_name || "Care Seeker",
            },
          });

          if (authError) {
            console.log(`    ✗ Failed to create auth user: ${authError.message}`);
            errors++;
            continue;
          }

          // Create account
          const { data: newAccount, error: accountError } = await supabase
            .from("accounts")
            .insert({
              user_id: newAuthUser.user.id,
              display_name: guest.display_name || "Care Seeker",
              active_profile_id: guest.id,
              onboarding_completed: false,
            })
            .select("id")
            .single();

          if (accountError) {
            console.log(`    ✗ Failed to create account: ${accountError.message}`);
            errors++;
            continue;
          }

          // Link profile
          const { error: linkError } = await supabase
            .from("business_profiles")
            .update({
              account_id: newAccount.id,
              claim_state: "claimed"
            })
            .eq("id", guest.id);

          if (linkError) {
            console.log(`    ✗ Failed to link profile: ${linkError.message}`);
            errors++;
            continue;
          }
        }

        console.log(`    ✓ Created auth user, account, and linked`);
        converted++;
      }
    } catch (err) {
      console.log(`    ✗ Error: ${err.message}`);
      errors++;
    }
  }

  console.log(`\n${"=".repeat(50)}`);
  console.log(`Summary:`);
  console.log(`  Total Guests with emails: ${guests.length}`);
  console.log(`  Converted: ${converted}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Errors: ${errors}`);
  console.log(`${"=".repeat(50)}\n`);

  if (DRY_RUN) {
    console.log("This was a dry run. Run without --dry-run to apply changes.\n");
  }
}

main().catch(console.error);
