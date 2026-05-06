/**
 * Backfill script for providers missing trust scores
 *
 * This script fixes two cases:
 * 1. Providers with email_otp_attempt in metadata but no claim_trust_level
 *    - Extract the reason from the OTP attempt and set appropriate trust level
 * 2. Providers who are verified/claimed but have no trust score
 *    - Re-run trust scoring based on their claimer email (via account link)
 *
 * Usage:
 *   npx tsx scripts/backfill-missing-trust-scores.ts           # Dry run (default)
 *   npx tsx scripts/backfill-missing-trust-scores.ts --commit  # Actually write to DB
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
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const COMMIT_MODE = process.argv.includes("--commit");

interface EmailOtpAttempt {
  email: string;
  fullName?: string;
  submitted_at: string;
  reason: string;
  otp_verified: boolean;
}

interface ProviderMetadata {
  email_otp_attempt?: EmailOtpAttempt;
  claimer_email?: string;
  [key: string]: unknown;
}

interface Provider {
  id: string;
  display_name: string;
  verification_state: string;
  claim_state: string;
  claim_trust_level: string | null;
  account_id: string | null;
  website: string | null;
  city: string | null;
  state: string | null;
  metadata: ProviderMetadata | null;
}

// Get claimer email from account -> auth.users (like existing backfill script)
async function getClaimerEmail(accountId: string): Promise<string | null> {
  const { data: account, error: accountError } = await supabase
    .from("accounts")
    .select("user_id")
    .eq("id", accountId)
    .single();

  if (accountError || !account) {
    return null;
  }

  const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(
    account.user_id
  );

  if (authError || !authUser?.user?.email) {
    return null;
  }

  return authUser.user.email;
}

async function backfillMissingTrustScores() {
  console.log("=".repeat(60));
  console.log("Backfill Missing Trust Scores");
  console.log(COMMIT_MODE ? "🚀 COMMIT MODE - Changes will be applied" : "🔍 DRY RUN MODE - No changes will be made (use --commit to apply)");
  console.log("=".repeat(60));
  console.log();

  // Query providers in pending/verified/not_required states missing trust scores
  const { data: providers, error } = await supabase
    .from("business_profiles")
    .select(
      "id, display_name, verification_state, claim_state, claim_trust_level, account_id, website, city, state, metadata"
    )
    .eq("claim_state", "claimed")
    .is("claim_trust_level", null)
    .in("verification_state", ["pending", "verified", "not_required"])
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch providers:", error);
    process.exit(1);
  }

  if (!providers || providers.length === 0) {
    console.log("✅ No providers missing trust scores. All good!");
    return;
  }

  console.log(`Found ${providers.length} provider(s) missing trust scores:\n`);

  let updated = 0;
  let skipped = 0;

  for (const provider of providers as Provider[]) {
    console.log(`\n--- ${provider.display_name} (${provider.id}) ---`);
    console.log(`  Verification state: ${provider.verification_state}`);

    const metadata = provider.metadata;
    const emailOtpAttempt = metadata?.email_otp_attempt;

    let trustLevel: "high" | "medium" | "low";
    let trustReason: string;

    // Case 1: Has email_otp_attempt - extract trust info from it
    if (emailOtpAttempt) {
      console.log(`  Has email_otp_attempt: ${emailOtpAttempt.email}`);
      console.log(`  OTP reason: ${emailOtpAttempt.reason}`);

      // The reason in email_otp_attempt tells us why they weren't auto-verified
      if (emailOtpAttempt.otp_verified) {
        // OTP verified but domain didn't match - medium trust
        trustLevel = "medium";
        trustReason = `Email OTP verified but ${emailOtpAttempt.reason.replace("OTP verified but ", "")}`;
      } else {
        trustLevel = "low";
        trustReason = emailOtpAttempt.reason;
      }
    }
    // Case 2: No OTP attempt but has account - get email via account link
    else if (provider.account_id) {
      const claimerEmail = await getClaimerEmail(provider.account_id);

      if (!claimerEmail) {
        console.log(`  ⚠️ Could not resolve claimer email - skipping`);
        skipped++;
        continue;
      }

      console.log(`  Claimer email (via account): ${claimerEmail}`);

      const trustResult = await scoreClaimTrust({
        email: claimerEmail,
        providerName: provider.display_name || "",
        providerCity: provider.city,
        providerState: provider.state,
        providerDomain: extractDomainFromWebsite(provider.website),
      });

      trustLevel = trustResult.level;
      trustReason = trustResult.reason;
    }
    // Case 3: No email info at all - skip
    else {
      console.log(`  ⚠️ No account linked - skipping`);
      skipped++;
      continue;
    }

    console.log(`  → Trust level: ${trustLevel}`);
    console.log(`  → Trust reason: ${trustReason}`);

    if (!COMMIT_MODE) {
      console.log(`  [DRY RUN] Would update trust score`);
      updated++;
    } else {
      const { error: updateError } = await supabase
        .from("business_profiles")
        .update({
          claim_trust_level: trustLevel,
          claim_trust_reason: trustReason,
        })
        .eq("id", provider.id);

      if (updateError) {
        console.error(`  ❌ Failed to update: ${updateError.message}`);
      } else {
        console.log(`  ✅ Updated successfully`);
        updated++;
      }
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log(`Summary: ${updated} updated, ${skipped} skipped`);
  if (!COMMIT_MODE) {
    console.log("Run with --commit to apply changes");
  }
  console.log("=".repeat(60));
}

backfillMissingTrustScores()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Script failed:", err);
    process.exit(1);
  });
