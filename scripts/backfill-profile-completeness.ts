/**
 * One-time backfill script to store profile_completeness for all published families.
 *
 * This ensures accurate completeness display in Find Families for families who:
 * - Published before this feature was added
 * - Are fully complete (100%) and don't receive nudges
 *
 * Run with: npx ts-node scripts/backfill-profile-completeness.ts
 * Or: npx tsx scripts/backfill-profile-completeness.ts
 */

import { createClient } from "@supabase/supabase-js";
import type { FamilyMetadata } from "../lib/types";

// Load environment variables
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Calculate family profile completeness - same logic as lib/admin/profile-completeness.ts
 */
function calculateFamilyCompleteness(
  profile: {
    display_name?: string | null;
    image_url?: string | null;
    phone?: string | null;
    city?: string | null;
    description?: string | null;
    care_types?: string[] | null;
    metadata?: FamilyMetadata | null;
  },
  email?: string | null
): number {
  const meta = (profile.metadata || {}) as FamilyMetadata;

  // Check if name is a real name (not placeholder - case insensitive)
  const hasRealName = !!profile.display_name && profile.display_name.toLowerCase() !== "care seeker";

  let earned = 0;

  // Basic Info (20 total)
  if (profile.image_url) earned += 2;
  if (profile.display_name) earned += 5;
  if (hasRealName) earned += 5;
  if (profile.city) earned += 8;

  // Contact (24 total)
  if (email) earned += 10;
  if (profile.phone) earned += 12;
  if (meta.contact_preference) earned += 2;

  // Care Recipient (16 total)
  if (meta.relationship_to_recipient || meta.who_needs_care) earned += 10;
  if (meta.age) earned += 2;
  if (profile.description || meta.about_situation) earned += 4;

  // Care Needs (28 total)
  if ((profile.care_types?.length ?? 0) > 0) earned += 8;
  if ((meta.care_needs?.length ?? 0) > 0) earned += 6;
  if (meta.timeline) earned += 12;
  if (meta.schedule_preference) earned += 2;

  // Payment (12 total)
  if ((meta.payment_methods?.length ?? 0) > 0) earned += 12;

  return Math.min(earned, 100);
}

async function main() {
  console.log("🔍 Fetching published families...\n");

  // Get all published families with their account emails
  const { data: families, error } = await supabase
    .from("business_profiles")
    .select(`
      id,
      display_name,
      image_url,
      phone,
      city,
      description,
      care_types,
      metadata,
      account_id,
      accounts!inner(user_id)
    `)
    .eq("type", "family")
    .eq("is_active", true)
    .filter("metadata->care_post->>status", "eq", "active");

  if (error) {
    console.error("Error fetching families:", error);
    process.exit(1);
  }

  console.log(`Found ${families?.length || 0} published families\n`);

  if (!families || families.length === 0) {
    console.log("No families to process.");
    return;
  }

  // Get emails from auth.users
  const userIds = families
    .map((f) => (f.accounts as { user_id: string })?.user_id)
    .filter(Boolean);

  const { data: users } = await supabase.auth.admin.listUsers();
  const emailMap = new Map<string, string>();
  for (const user of users?.users || []) {
    if (user.email) {
      emailMap.set(user.id, user.email);
    }
  }

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const family of families) {
    const meta = (family.metadata || {}) as FamilyMetadata;

    // Skip if already has profile_completeness stored
    if (meta.profile_completeness !== undefined) {
      skipped++;
      continue;
    }

    const userId = (family.accounts as { user_id: string })?.user_id;
    const email = userId ? emailMap.get(userId) : null;

    const completeness = calculateFamilyCompleteness(family, email);

    // Update metadata with profile_completeness
    const updatedMeta = {
      ...meta,
      profile_completeness: completeness,
    };

    const { error: updateError } = await supabase
      .from("business_profiles")
      .update({ metadata: updatedMeta })
      .eq("id", family.id);

    if (updateError) {
      console.error(`❌ Error updating ${family.display_name}:`, updateError.message);
      errors++;
    } else {
      console.log(`✓ ${family.display_name || "Care Seeker"} (${family.city}): ${completeness}%`);
      updated++;
    }
  }

  console.log("\n📊 Summary:");
  console.log(`   Updated: ${updated}`);
  console.log(`   Skipped (already set): ${skipped}`);
  console.log(`   Errors: ${errors}`);
}

main().catch(console.error);
