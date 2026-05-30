#!/usr/bin/env node
/**
 * Backfill script to fill in missing city and care_types for family profiles
 * by looking up the provider they connected with.
 *
 * Run with: node scripts/backfill-family-city-caretype.js
 *
 * This fixes profiles where:
 * - city was not auto-filled from provider (8 points)
 * - care_types was not auto-filled from provider category (8 points)
 *
 * After filling in the data, it recalculates profile completeness.
 */

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

async function backfillFamilyData() {
  console.log("Fetching family profiles with low completeness...\n");

  // Fetch family profiles that might be missing city or care_types
  const { data: profiles, error } = await db
    .from("business_profiles")
    .select(
      "id, display_name, image_url, city, state, phone, description, care_types, email, metadata, created_at"
    )
    .eq("type", "family")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching profiles:", error);
    process.exit(1);
  }

  // Filter to profiles missing city OR care_types
  const profilesToFix = profiles.filter(
    (p) => !p.city || !p.care_types || p.care_types.length === 0
  );

  console.log(`Found ${profiles.length} total family profiles`);
  console.log(`Found ${profilesToFix.length} profiles missing city or care_types\n`);

  if (profilesToFix.length === 0) {
    console.log("No profiles need fixing!");
    return;
  }

  let updated = 0;
  let skipped = 0;
  let noConnection = 0;

  for (const profile of profilesToFix) {
    const needsCity = !profile.city;
    const needsCareTypes = !profile.care_types || profile.care_types.length === 0;

    // Find their most recent connection to get provider info
    const { data: connections, error: connError } = await db
      .from("connections")
      .select("to_profile_id, message, created_at")
      .eq("from_profile_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(1);

    if (connError || !connections || connections.length === 0) {
      // No connection found - can't determine provider
      noConnection++;
      continue;
    }

    const connection = connections[0];
    const providerProfileId = connection.to_profile_id;

    // Get provider info
    const { data: provider, error: providerError } = await db
      .from("business_profiles")
      .select("city, state, category")
      .eq("id", providerProfileId)
      .single();

    if (providerError || !provider) {
      console.log(`  Could not find provider ${providerProfileId} for ${profile.display_name || profile.id}`);
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

    // Apply updates
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

  console.log(`\n${"=".repeat(60)}`);
  console.log(`Done!`);
  console.log(`  Updated: ${updated}`);
  console.log(`  Skipped (no data to fill): ${skipped}`);
  console.log(`  No connection found: ${noConnection}`);
}

backfillFamilyData().catch(console.error);
