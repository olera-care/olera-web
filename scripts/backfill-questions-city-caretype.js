#!/usr/bin/env node
/**
 * Backfill script to fill in missing city and care_types for family profiles
 * that came through the Questions flow (multi_provider / multi_provider_v2).
 *
 * Run with:
 *   node scripts/backfill-questions-city-caretype.js --dry-run  (preview changes)
 *   node scripts/backfill-questions-city-caretype.js            (apply changes)
 *
 * Unlike the lead flow backfill (backfill-family-city-caretype.js), this script
 * looks up the provider from metadata.signup_context.provider_id since Questions
 * flow users don't create connections.
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

/** Maps provider category → care type display value */
const categoryToCareType = {
  // Database format (from profile.category)
  home_care_agency: "Home Care",
  home_health_agency: "Home Health Care",
  hospice_agency: "Home Health Care",
  assisted_living: "Assisted Living",
  memory_care: "Memory Care",
  nursing_home: "Nursing Home",
  independent_living: "Independent Living",
  adult_day_care: "Home Care",
  inpatient_hospice: "Home Health Care",
  rehab_facility: "Home Health Care",
  wellness_center: "Home Care",
  private_caregiver: "Home Care",
  // Display format (fallback)
  "Home Care": "Home Care",
  "Home Care (Non-medical)": "Home Care",
  "Home Health Care": "Home Health Care",
  "Home Health": "Home Health Care",
  "Assisted Living": "Assisted Living",
  "Memory Care": "Memory Care",
  "Nursing Home": "Nursing Home",
  "Independent Living": "Independent Living",
  "Hospice": "Home Health Care",
  "Inpatient Hospice": "Home Health Care",
  "Adult Day Care": "Home Care",
  "Rehabilitation": "Home Health Care",
  "Wellness Center": "Home Care",
  "Private Caregiver": "Home Care",
};

/**
 * Inline completeness calculation (same logic as components/portal/profile/completeness.ts)
 */
function calculateProfileCompletenessPercentage(profileData, email) {
  const meta = profileData.metadata || {};

  const hasRealName =
    !!profileData.display_name &&
    profileData.display_name.toLowerCase() !== "care seeker";

  let earned = 0;

  // Basic Info (20 total)
  if (profileData.image_url) earned += 2;
  if (profileData.display_name) earned += 5;
  if (hasRealName) earned += 5;
  if (profileData.city) earned += 8;

  // Contact (24 total)
  if (email) earned += 10;
  if (profileData.phone) earned += 12;
  if (meta.contact_preference) earned += 2;

  // Care Recipient (16 total)
  if (meta.relationship_to_recipient || meta.who_needs_care) earned += 10;
  if (meta.age) earned += 2;
  if (profileData.description || meta.about_situation) earned += 4;

  // Care Needs (28 total)
  if ((profileData.care_types?.length ?? 0) > 0) earned += 8;
  if ((meta.care_needs?.length ?? 0) > 0) earned += 6;
  if (meta.timeline) earned += 12;
  if (meta.schedule_preference) earned += 2;

  // Payment (12 total)
  if ((meta.payment_methods?.length ?? 0) > 0) earned += 12;

  return Math.min(earned, 100);
}

async function backfillQuestionsData() {
  if (DRY_RUN) {
    console.log("🔍 DRY RUN MODE - No changes will be made\n");
  } else {
    console.log("⚡ LIVE MODE - Changes will be applied\n");
  }
  console.log("Fetching Questions flow family profiles...\n");

  // Fetch family profiles that came through Questions flow
  const { data: profiles, error } = await db
    .from("business_profiles")
    .select(
      "id, display_name, image_url, city, state, phone, description, care_types, email, metadata, source, created_at"
    )
    .eq("type", "family")
    .in("source", ["multi_provider", "multi_provider_v2"])
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching profiles:", error);
    process.exit(1);
  }

  // Filter to profiles missing city OR care_types
  const profilesToFix = profiles.filter(
    (p) => !p.city || !p.care_types || p.care_types.length === 0
  );

  console.log(`Found ${profiles.length} total Questions flow family profiles`);
  console.log(`Found ${profilesToFix.length} profiles missing city or care_types\n`);

  if (profilesToFix.length === 0) {
    console.log("No profiles need fixing!");
    return;
  }

  let updated = 0;
  let skipped = 0;
  let noProvider = 0;

  for (const profile of profilesToFix) {
    const needsCity = !profile.city;
    const needsCareTypes = !profile.care_types || profile.care_types.length === 0;

    // Get provider ID from signup context
    const signupContext = profile.metadata?.signup_context || {};
    const providerId = signupContext.provider_id;

    if (!providerId) {
      // No provider ID stored - can't determine provider
      noProvider++;
      continue;
    }

    // Get provider info - try by ID first, then by slug
    // (Questions flow stores slug in provider_id, not UUID)
    let provider = null;
    let providerError = null;

    // Check if providerId looks like a UUID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(providerId);

    if (isUuid) {
      const result = await db
        .from("business_profiles")
        .select("city, state, category")
        .eq("id", providerId)
        .single();
      provider = result.data;
      providerError = result.error;
    } else {
      // Try by slug
      const result = await db
        .from("business_profiles")
        .select("city, state, category")
        .eq("slug", providerId)
        .single();
      provider = result.data;
      providerError = result.error;
    }

    if (providerError || !provider) {
      console.log(`  Could not find provider ${providerId} for ${profile.display_name || profile.id}`);
      skipped++;
      continue;
    }

    // Build updates
    const updates = {};
    let changes = [];

    // Fill city from provider if missing
    if (needsCity && provider.city) {
      updates.city = provider.city;
      if (provider.state) {
        updates.state = provider.state;
      }
      changes.push(`city: ${provider.city}`);
    }

    // Fill care_types from provider category if missing
    if (needsCareTypes && provider.category) {
      const careTypeDisplay = categoryToCareType[provider.category];
      if (careTypeDisplay) {
        updates.care_types = [careTypeDisplay];
        changes.push(`care_types: [${careTypeDisplay}]`);
      }
    }

    // Skip if nothing to update
    if (Object.keys(updates).length === 0) {
      skipped++;
      continue;
    }

    // Calculate new completeness with updated data
    const mergedProfile = {
      display_name: profile.display_name,
      image_url: profile.image_url,
      city: updates.city || profile.city,
      phone: profile.phone,
      description: profile.description,
      care_types: updates.care_types || profile.care_types,
      metadata: profile.metadata || {},
    };

    const oldCompleteness = (profile.metadata || {}).profile_completeness ?? 0;
    const newCompleteness = calculateProfileCompletenessPercentage(
      mergedProfile,
      profile.email
    );

    // Update metadata with new completeness
    const updatedMeta = {
      ...(profile.metadata || {}),
      profile_completeness: newCompleteness,
    };
    updates.metadata = updatedMeta;

    // Apply updates (or just log in dry-run mode)
    if (DRY_RUN) {
      console.log(
        `[DRY RUN] Would update ${profile.display_name || profile.id}: ${changes.join(", ")} | completeness: ${oldCompleteness}% → ${newCompleteness}%`
      );
      updated++;
    } else {
      const { error: updateError } = await db
        .from("business_profiles")
        .update(updates)
        .eq("id", profile.id);

      if (updateError) {
        console.error(`Error updating ${profile.id}:`, updateError);
        skipped++;
      } else {
        console.log(
          `Updated ${profile.display_name || profile.id}: ${changes.join(", ")} | completeness: ${oldCompleteness}% → ${newCompleteness}%`
        );
        updated++;
      }
    }
  }

  console.log(`\n${"=".repeat(60)}`);
  if (DRY_RUN) {
    console.log(`DRY RUN COMPLETE`);
    console.log(`  Would update: ${updated}`);
    console.log(`  Would skip (no data to fill): ${skipped}`);
    console.log(`  No provider_id in metadata: ${noProvider}`);
    console.log(`\nRun without --dry-run to apply changes.`);
  } else {
    console.log(`Done!`);
    console.log(`  Updated: ${updated}`);
    console.log(`  Skipped (no data to fill): ${skipped}`);
    console.log(`  No provider_id in metadata: ${noProvider}`);
  }
}

backfillQuestionsData().catch(console.error);
