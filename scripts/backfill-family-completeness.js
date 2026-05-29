#!/usr/bin/env node
/**
 * Backfill script to recalculate profile_completeness for all family profiles.
 *
 * Run with: node scripts/backfill-family-completeness.js
 *
 * This fixes profiles where enrichment data was synced but completeness
 * was never recalculated (stuck at initial value like 23%).
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

/**
 * Inline completeness calculation (same logic as components/portal/profile/completeness.ts)
 */
function calculateProfileCompletenessPercentage(profileData, email) {
  const meta = profileData.metadata || {};

  // Check if name is a real name (not placeholder "Care Seeker" - case insensitive)
  const hasRealName =
    !!profileData.display_name &&
    profileData.display_name.toLowerCase() !== "care seeker";

  let earned = 0;

  // Basic Info (20 total)
  if (profileData.image_url) earned += 2;
  if (profileData.display_name) earned += 5; // Placeholder counts
  if (hasRealName) earned += 5; // Bonus for real name
  if (profileData.city) earned += 8; // Required for Go Live

  // Contact (24 total)
  if (email) earned += 10;
  if (profileData.phone) earned += 12; // Enrichment Step 5
  if (meta.contact_preference) earned += 2;

  // Care Recipient (16 total)
  if (meta.relationship_to_recipient || meta.who_needs_care) earned += 10; // Enrichment Step 1
  if (meta.age) earned += 2;
  if (profileData.description || meta.about_situation) earned += 4;

  // Care Needs (28 total)
  if ((profileData.care_types?.length ?? 0) > 0) earned += 8; // Required for Go Live
  if ((meta.care_needs?.length ?? 0) > 0) earned += 6; // Enrichment Step 3
  if (meta.timeline) earned += 12; // Enrichment Step 2
  if (meta.schedule_preference) earned += 2;

  // Payment (12 total)
  if ((meta.payment_methods?.length ?? 0) > 0) earned += 12; // Enrichment Step 4

  return Math.min(earned, 100);
}

async function backfillCompleteness() {
  console.log("Fetching family profiles...");

  // Fetch all family profiles
  const { data: profiles, error } = await db
    .from("business_profiles")
    .select(
      "id, display_name, image_url, city, phone, description, care_types, email, metadata"
    )
    .eq("type", "family")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching profiles:", error);
    process.exit(1);
  }

  console.log(`Found ${profiles.length} family profiles`);

  let updated = 0;
  let skipped = 0;

  for (const profile of profiles) {
    const meta = profile.metadata || {};
    const oldCompleteness = meta.profile_completeness ?? 0;

    // Calculate new completeness
    const newCompleteness = calculateProfileCompletenessPercentage(
      {
        display_name: profile.display_name,
        image_url: profile.image_url,
        city: profile.city,
        phone: profile.phone,
        description: profile.description,
        care_types: profile.care_types,
        metadata: meta,
      },
      profile.email
    );

    // Only update if different
    if (newCompleteness !== oldCompleteness) {
      const updatedMeta = { ...meta, profile_completeness: newCompleteness };

      const { error: updateError } = await db
        .from("business_profiles")
        .update({ metadata: updatedMeta })
        .eq("id", profile.id);

      if (updateError) {
        console.error(`Error updating ${profile.id}:`, updateError);
      } else {
        console.log(
          `Updated ${profile.display_name || profile.id}: ${oldCompleteness}% → ${newCompleteness}%`
        );
        updated++;
      }
    } else {
      skipped++;
    }
  }

  console.log(
    `\nDone! Updated: ${updated}, Skipped (already correct): ${skipped}`
  );
}

backfillCompleteness().catch(console.error);
