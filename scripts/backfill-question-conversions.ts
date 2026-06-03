/**
 * Backfill script to enrich family profiles from question conversions
 * with provider city, state, and care category.
 *
 * This fixes historical profiles created through multi_provider question
 * conversions that only captured email (~15% completeness) instead of
 * also capturing location and care type from the provider (~31% completeness).
 *
 * Usage:
 *   npx tsx scripts/backfill-question-conversions.ts [--dry-run]
 *
 * Options:
 *   --dry-run   Show what would be updated without making changes
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { generateProviderSlug } from "../lib/slugify";
import { calculateProfileCompletenessPercentage } from "../components/portal/profile/completeness";

dotenv.config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Care type mapping from provider category to family care_types
const categoryToCareType: Record<string, string> = {
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
  // Display format (olera-providers.provider_category)
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

interface ProviderData {
  city: string | null;
  state: string | null;
  category: string | null;
}

/**
 * Multi-strategy provider lookup (mirrors capture-email and questions routes)
 */
async function lookupProvider(providerId: string): Promise<ProviderData | null> {
  // Strategy 1: business_profiles by slug
  const { data: bpProvider } = await db
    .from("business_profiles")
    .select("city, state, category")
    .eq("slug", providerId)
    .maybeSingle();

  if (bpProvider) {
    return {
      city: bpProvider.city,
      state: bpProvider.state,
      category: bpProvider.category,
    };
  }

  // Strategy 2: olera-providers by slug
  let iosProvider = await db
    .from("olera-providers")
    .select("provider_id, city, state, provider_category, provider_name")
    .eq("slug", providerId)
    .not("deleted", "is", true)
    .maybeSingle()
    .then((r) => r.data);

  if (!iosProvider) {
    // Strategy 3: olera-providers by provider_id
    iosProvider = await db
      .from("olera-providers")
      .select("provider_id, city, state, provider_category, provider_name")
      .eq("provider_id", providerId)
      .not("deleted", "is", true)
      .maybeSingle()
      .then((r) => r.data);
  }

  if (!iosProvider) {
    // Strategy 4: reverse-match auto-generated slug
    const slugParts = providerId.split("-");
    const namePrefix = slugParts.slice(0, 3).join("-");
    const { data: candidates } = await db
      .from("olera-providers")
      .select("provider_id, city, state, provider_category, provider_name")
      .not("deleted", "is", true)
      .is("slug", null)
      .ilike("provider_name", `${namePrefix.replace(/-/g, "%")}%`)
      .limit(20);

    if (candidates) {
      for (const c of candidates) {
        if (generateProviderSlug(c.provider_name, c.state) === providerId) {
          iosProvider = c;
          break;
        }
      }
    }
  }

  if (iosProvider) {
    return {
      city: iosProvider.city,
      state: iosProvider.state,
      category: iosProvider.provider_category,
    };
  }

  return null;
}

interface ProfileMetadata {
  signup_context?: {
    provider_id?: string;
    provider_name?: string;
  };
  profile_completeness?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

async function backfillQuestionConversions(dryRun: boolean) {
  console.log(`\n🔍 Finding question conversion profiles to enrich...\n`);
  console.log(dryRun ? "🏃 DRY RUN - No changes will be made\n" : "");

  // Find family profiles from question conversions that might need enrichment
  // source = "multi_provider" or "multi_provider_v2"
  const { data: profiles, error: profilesError } = await db
    .from("business_profiles")
    .select("id, display_name, city, state, care_types, metadata, email")
    .eq("type", "family")
    .in("source", ["multi_provider", "multi_provider_v2"])
    .order("created_at", { ascending: false });

  if (profilesError) {
    console.error("Error fetching profiles:", profilesError);
    process.exit(1);
  }

  if (!profiles || profiles.length === 0) {
    console.log("✅ No question conversion profiles found.");
    return;
  }

  console.log(`Found ${profiles.length} question conversion profiles\n`);

  // Filter to profiles that need enrichment (missing city or care_types)
  const profilesToEnrich = profiles.filter((p) => {
    const needsCity = !p.city;
    const needsCareTypes = !p.care_types || p.care_types.length === 0;
    return needsCity || needsCareTypes;
  });

  console.log(`${profilesToEnrich.length} profiles need enrichment (missing city or care_types)\n`);

  if (profilesToEnrich.length === 0) {
    console.log("✅ All question conversion profiles are already enriched.");
    return;
  }

  const updates: Array<{
    id: string;
    display_name: string;
    providerId: string;
    city: string | null;
    state: string | null;
    careType: string | null;
  }> = [];
  const noProviderFound: Array<{ id: string; display_name: string; providerId: string | null }> = [];
  const noProviderData: Array<{ id: string; display_name: string; providerId: string }> = [];

  console.log("Looking up providers...\n");

  for (let i = 0; i < profilesToEnrich.length; i++) {
    const profile = profilesToEnrich[i];
    const metadata = profile.metadata as ProfileMetadata | null;
    const providerId = metadata?.signup_context?.provider_id;

    process.stdout.write(`  Processing ${i + 1}/${profilesToEnrich.length}...\r`);

    if (!providerId) {
      noProviderFound.push({
        id: profile.id,
        display_name: profile.display_name,
        providerId: null,
      });
      continue;
    }

    const providerData = await lookupProvider(providerId);

    if (!providerData || (!providerData.city && !providerData.category)) {
      noProviderData.push({
        id: profile.id,
        display_name: profile.display_name,
        providerId,
      });
      continue;
    }

    // Only update fields that are currently empty
    const needsCity = !profile.city && providerData.city;
    const needsCareTypes =
      (!profile.care_types || profile.care_types.length === 0) && providerData.category;

    if (needsCity || needsCareTypes) {
      updates.push({
        id: profile.id,
        display_name: profile.display_name,
        providerId,
        city: needsCity ? providerData.city : null,
        state: needsCity ? providerData.state : null,
        careType: needsCareTypes ? providerData.category : null,
      });
    }
  }

  console.log("\n");

  // Report findings
  console.log(`📊 Results:`);
  console.log(`   - ${updates.length} profiles can be enriched`);
  console.log(`   - ${noProviderFound.length} profiles have no provider_id in metadata`);
  console.log(`   - ${noProviderData.length} profiles have provider_id but provider not found\n`);

  if (updates.length > 0) {
    console.log(`\n📝 Profiles to update:\n`);
    for (const u of updates.slice(0, 20)) {
      const enrichments = [];
      if (u.city) enrichments.push(`city: ${u.city}`);
      if (u.careType) enrichments.push(`care: ${categoryToCareType[u.careType] || u.careType}`);
      console.log(`   ${u.display_name}: ${enrichments.join(", ")}`);
    }
    if (updates.length > 20) {
      console.log(`   ... and ${updates.length - 20} more`);
    }
  }

  if (noProviderFound.length > 0) {
    console.log(`\n⚠️  Profiles without provider_id in metadata:\n`);
    for (const p of noProviderFound.slice(0, 5)) {
      console.log(`   ${p.display_name}`);
    }
    if (noProviderFound.length > 5) {
      console.log(`   ... and ${noProviderFound.length - 5} more`);
    }
  }

  if (noProviderData.length > 0) {
    console.log(`\n⚠️  Profiles with provider not found:\n`);
    for (const p of noProviderData.slice(0, 5)) {
      console.log(`   ${p.display_name} (provider: ${p.providerId})`);
    }
    if (noProviderData.length > 5) {
      console.log(`   ... and ${noProviderData.length - 5} more`);
    }
  }

  // Apply updates
  if (!dryRun && updates.length > 0) {
    console.log(`\n🔄 Applying updates...\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const update of updates) {
      // Build the update object
      const updateData: Record<string, unknown> = {};

      if (update.city) {
        updateData.city = update.city;
      }
      if (update.state) {
        updateData.state = update.state;
      }

      // Get current profile data for care_types append and completeness recalculation
      const { data: currentProfile } = await db
        .from("business_profiles")
        .select("display_name, image_url, city, phone, description, care_types, metadata, email")
        .eq("id", update.id)
        .single();

      if (!currentProfile) continue;

      // For care_types, append if not already present
      if (update.careType) {
        const mappedCareType = categoryToCareType[update.careType] || update.careType;
        const currentCareTypes: string[] = currentProfile.care_types || [];
        if (!currentCareTypes.includes(mappedCareType)) {
          updateData.care_types = [...currentCareTypes, mappedCareType];
        }
      }

      // Recalculate profile completeness using the actual function
      const metadata = (currentProfile.metadata || {}) as ProfileMetadata;
      const mergedProfileData = {
        display_name: currentProfile.display_name,
        image_url: currentProfile.image_url,
        city: (updateData.city as string) ?? currentProfile.city,
        phone: currentProfile.phone,
        description: currentProfile.description,
        care_types: (updateData.care_types as string[]) ?? currentProfile.care_types,
        metadata: metadata,
      };

      const newCompleteness = calculateProfileCompletenessPercentage(
        mergedProfileData,
        currentProfile.email
      );
      metadata.profile_completeness = newCompleteness;
      updateData.metadata = metadata;

      if (Object.keys(updateData).length === 0) {
        continue;
      }

      const { error } = await db
        .from("business_profiles")
        .update(updateData)
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

backfillQuestionConversions(dryRun)
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Script failed:", err);
    process.exit(1);
  });
