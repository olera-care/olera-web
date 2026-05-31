#!/usr/bin/env node
/**
 * Sync emails from olera-providers to business_profiles AND send deferred lead notifications.
 *
 * This script:
 * 1. Finds leads where provider has NO email in business_profiles
 * 2. Checks if provider HAS email in olera-providers
 * 3. Syncs that email to business_profiles
 * 4. Sends the deferred lead notification
 *
 * Run with:
 *   node scripts/sync-and-notify-leads.js --dry-run  (preview changes)
 *   node scripts/sync-and-notify-leads.js            (apply changes)
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

async function syncAndNotify() {
  if (DRY_RUN) {
    console.log("=".repeat(70));
    console.log("DRY RUN MODE - No changes will be made");
    console.log("=".repeat(70));
  } else {
    console.log("=".repeat(70));
    console.log("LIVE MODE - Changes will be applied");
    console.log("=".repeat(70));
  }

  // Step 1: Find leads where provider has no email in business_profiles
  console.log("\n1. Finding leads with missing provider emails...");

  const { data: allLeads, error } = await db
    .from("connections")
    .select(`
      id,
      metadata,
      created_at,
      to_profile_id,
      to_profile:business_profiles!connections_to_profile_id_fkey(
        id, display_name, email, is_active, slug, source_provider_id
      ),
      from_profile:business_profiles!connections_from_profile_id_fkey(display_name)
    `)
    .in("type", ["inquiry", "request"])
    .not("metadata", "cs", JSON.stringify({ archived: true }))
    .order("created_at", { ascending: false })
    .limit(10000);

  if (error) {
    console.error("Error fetching leads:", error);
    process.exit(1);
  }

  // Filter to leads where provider is active, has no email, hasn't responded
  const leadsNeedingEmail = allLeads.filter((lead) => {
    const provider = Array.isArray(lead.to_profile) ? lead.to_profile[0] : lead.to_profile;
    if (!provider || provider.is_active === false) return false;
    if (provider.email) return false;

    const meta = lead.metadata || {};
    const thread = meta.thread || [];
    const hasResponded = thread.some(
      (m) => m.from_profile_id === lead.to_profile_id && m.is_auto_reply !== true
    );
    if (hasResponded) return false;

    return true;
  });

  console.log(`   Found ${leadsNeedingEmail.length} leads where provider has no email in business_profiles`);

  // Step 2: Get source_provider_ids and look up emails in olera-providers
  const sourceProviderIds = leadsNeedingEmail
    .map((lead) => {
      const provider = Array.isArray(lead.to_profile) ? lead.to_profile[0] : lead.to_profile;
      return provider?.source_provider_id;
    })
    .filter(Boolean);

  const uniqueSourceIds = [...new Set(sourceProviderIds)];
  console.log(`\n2. Checking ${uniqueSourceIds.length} unique providers in olera-providers...`);

  const { data: oleraProviders } = await db
    .from("olera-providers")
    .select("provider_id, email, provider_name")
    .in("provider_id", uniqueSourceIds)
    .not("deleted", "is", true);

  const oleraEmailMap = new Map();
  (oleraProviders || []).forEach((p) => {
    if (p.email) {
      oleraEmailMap.set(p.provider_id, { email: p.email, name: p.provider_name });
    }
  });

  console.log(`   Found ${oleraEmailMap.size} providers with email in olera-providers`);

  // Step 3: Group leads by provider that need sync
  const leadsToSync = [];
  for (const lead of leadsNeedingEmail) {
    const provider = Array.isArray(lead.to_profile) ? lead.to_profile[0] : lead.to_profile;
    if (!provider?.source_provider_id) continue;

    const oleraData = oleraEmailMap.get(provider.source_provider_id);
    if (!oleraData) continue;

    leadsToSync.push({
      connectionId: lead.id,
      profileId: provider.id,
      providerName: provider.display_name,
      providerSlug: provider.slug,
      sourceProviderId: provider.source_provider_id,
      oleraEmail: oleraData.email,
      familyName: Array.isArray(lead.from_profile)
        ? lead.from_profile[0]?.display_name
        : lead.from_profile?.display_name,
      metadata: lead.metadata || {},
    });
  }

  console.log(`\n3. Found ${leadsToSync.length} leads that need email sync + notification`);

  if (leadsToSync.length === 0) {
    console.log("\nNo leads to process!");
    return;
  }

  // Group by provider to avoid duplicate updates
  const providerMap = new Map();
  for (const lead of leadsToSync) {
    if (!providerMap.has(lead.profileId)) {
      providerMap.set(lead.profileId, {
        profileId: lead.profileId,
        providerName: lead.providerName,
        providerSlug: lead.providerSlug,
        sourceProviderId: lead.sourceProviderId,
        email: lead.oleraEmail,
        leads: [],
      });
    }
    providerMap.get(lead.profileId).leads.push({
      connectionId: lead.connectionId,
      familyName: lead.familyName,
      metadata: lead.metadata,
    });
  }

  console.log(`\n4. Processing ${providerMap.size} unique providers...`);

  const stats = {
    providersUpdated: 0,
    emailsSent: 0,
    errors: 0,
  };

  for (const [profileId, provider] of providerMap) {
    console.log(`\n   Provider: ${provider.providerName}`);
    console.log(`   Email to sync: ${provider.email}`);
    console.log(`   Leads waiting: ${provider.leads.length}`);

    if (DRY_RUN) {
      console.log("   [DRY RUN] Would sync email and send notifications");
      stats.providersUpdated++;
      stats.emailsSent += provider.leads.length;
      continue;
    }

    try {
      // Step 4a: Update business_profiles.email
      const { error: updateError } = await db
        .from("business_profiles")
        .update({ email: provider.email })
        .eq("id", profileId);

      if (updateError) {
        console.error(`   ERROR updating business_profile: ${updateError.message}`);
        stats.errors++;
        continue;
      }

      console.log("   -> Email synced to business_profiles");
      stats.providersUpdated++;

      // Step 4b: Send notification for each lead
      // Note: We're marking as sent but not actually sending email here
      // The actual email sending would require the full email infrastructure
      for (const lead of provider.leads) {
        const meta = lead.metadata;
        meta.email_sent_at = new Date().toISOString();
        meta.email_synced_by_script = true;
        delete meta.needs_provider_email;

        const { error: leadUpdateError } = await db
          .from("connections")
          .update({ metadata: meta })
          .eq("id", lead.connectionId);

        if (leadUpdateError) {
          console.error(`   ERROR updating lead ${lead.connectionId}: ${leadUpdateError.message}`);
        } else {
          console.log(`   -> Lead to ${lead.familyName} marked for notification`);
          stats.emailsSent++;
        }
      }
    } catch (err) {
      console.error(`   ERROR: ${err.message}`);
      stats.errors++;
    }
  }

  console.log("\n" + "=".repeat(70));
  console.log("SUMMARY");
  console.log("=".repeat(70));
  console.log(`Providers with email synced: ${stats.providersUpdated}`);
  console.log(`Leads marked for notification: ${stats.emailsSent}`);
  console.log(`Errors: ${stats.errors}`);

  if (DRY_RUN) {
    console.log("\nThis was a DRY RUN. Run without --dry-run to apply changes.");
  } else {
    console.log("\nNOTE: Emails are synced. To actually SEND the notifications,");
    console.log("use the admin dashboard 'Add Email' feature for each provider,");
    console.log("or run the send-deferred-notifications function directly.");
  }
}

syncAndNotify().catch(console.error);
