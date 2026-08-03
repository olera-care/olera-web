/**
 * Backfill missing email_sent touchpoints for Provider Outreach campaigns.
 *
 * Problem: Some providers enrolled in SmartLead campaigns don't have email_sent
 * touchpoints because the EMAIL_SENT webhook wasn't working when they were enrolled.
 * This means opens/clicks for these providers can't be recorded.
 *
 * Solution: Create synthetic email_sent touchpoints for providers missing them,
 * then try to fetch open/click data from SmartLead's API to backfill the stats.
 *
 * Usage:
 *   npx tsx scripts/backfill-provider-outreach-touchpoints.ts --dry-run
 *   npx tsx scripts/backfill-provider-outreach-touchpoints.ts
 */

import { createClient } from "@supabase/supabase-js";
import { listCampaignLeads, isSmartleadConfigured } from "../lib/smartlead";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const DRY_RUN = process.argv.includes("--dry-run");

interface ProviderMissingTouchpoint {
  provider_id: string;
  tracking_id: string;
  campaign_id: number;
  email: string;
  enrolled_at: string | null;
}

async function findProvidersMissingTouchpoints(): Promise<ProviderMissingTouchpoint[]> {
  console.log("Finding providers enrolled in SmartLead but missing email_sent touchpoints...\n");

  // Get all providers with SmartLead enrollment
  const { data: trackingRows, error } = await supabase
    .from("provider_outreach_tracking")
    .select("id, provider_id, smartlead_data")
    .not("smartlead_data", "is", null)
    .not("smartlead_data->campaign_id", "is", null);

  if (error) {
    console.error("Error fetching tracking rows:", error.message);
    return [];
  }

  if (!trackingRows || trackingRows.length === 0) {
    console.log("No providers with SmartLead enrollment found.");
    return [];
  }

  console.log(`Found ${trackingRows.length} providers enrolled in SmartLead campaigns.`);

  // Get provider IDs that have email_sent touchpoints
  const providerIds = trackingRows.map((r) => r.provider_id);
  const { data: existingTouchpoints } = await supabase
    .from("provider_outreach_touchpoints")
    .select("provider_id")
    .eq("touchpoint_type", "email_sent")
    .eq("details->>source", "smartlead")
    .in("provider_id", providerIds);

  const providersWithTouchpoints = new Set(
    (existingTouchpoints ?? []).map((t) => t.provider_id)
  );

  // Find providers missing touchpoints
  const missing: ProviderMissingTouchpoint[] = [];
  for (const row of trackingRows) {
    if (!providersWithTouchpoints.has(row.provider_id)) {
      const slData = row.smartlead_data as {
        campaign_id?: number;
        lead_email?: string;
        enrolled_at?: string;
      } | null;

      if (slData?.campaign_id) {
        missing.push({
          provider_id: row.provider_id,
          tracking_id: row.id,
          campaign_id: slData.campaign_id,
          email: slData.lead_email ?? "",
          enrolled_at: slData.enrolled_at ?? null,
        });
      }
    }
  }

  console.log(`\nProviders missing touchpoints: ${missing.length}`);
  return missing;
}

async function createMissingTouchpoints(
  providers: ProviderMissingTouchpoint[]
): Promise<number> {
  if (providers.length === 0) {
    console.log("No missing touchpoints to create.");
    return 0;
  }

  console.log(`\n${DRY_RUN ? "[DRY RUN] Would create" : "Creating"} ${providers.length} touchpoints...`);

  if (DRY_RUN) {
    for (const p of providers) {
      console.log(
        `  - provider_id=${p.provider_id}, campaign=${p.campaign_id}, email=${p.email}`
      );
    }
    return providers.length;
  }

  let created = 0;
  for (const p of providers) {
    const { error } = await supabase.from("provider_outreach_touchpoints").insert({
      provider_id: p.provider_id,
      touchpoint_type: "email_sent",
      details: {
        source: "smartlead",
        smartlead_event_id: null,
        recipient_email: p.email,
        sequence_step: 1, // Assume intro email
        occurred_at: p.enrolled_at, // Use enrollment date as best guess
        campaign_id: p.campaign_id,
        synthetic: true,
        backfilled: true,
        backfilled_at: new Date().toISOString(),
      },
    });

    if (error) {
      console.error(`  Error creating touchpoint for ${p.provider_id}:`, error.message);
    } else {
      created++;
      console.log(`  Created touchpoint for provider ${p.provider_id}`);
    }
  }

  return created;
}

async function tryBackfillStatsFromSmartLead(
  providers: ProviderMissingTouchpoint[]
): Promise<void> {
  if (!isSmartleadConfigured()) {
    console.log("\nSmartLead not configured - skipping stats backfill.");
    console.log("Note: Open/click stats will be recorded when providers open future emails.");
    return;
  }

  console.log("\nAttempting to fetch stats from SmartLead...");

  // Group providers by campaign
  const byCampaign = new Map<number, ProviderMissingTouchpoint[]>();
  for (const p of providers) {
    const list = byCampaign.get(p.campaign_id) ?? [];
    list.push(p);
    byCampaign.set(p.campaign_id, list);
  }

  for (const [campaignId, campaignProviders] of byCampaign) {
    console.log(`\nCampaign ${campaignId}: ${campaignProviders.length} providers`);

    // Fetch leads from SmartLead
    const result = await listCampaignLeads(campaignId, { limit: 500 });
    if (!result.ok || !result.data?.data) {
      console.log(`  Could not fetch leads: ${result.error ?? "unknown error"}`);
      continue;
    }

    const leads = result.data.data;
    console.log(`  Fetched ${leads.length} leads from SmartLead`);

    // SmartLead's listCampaignLeads doesn't include open/click stats
    // We would need a different API endpoint for per-lead statistics
    // For now, just log that the touchpoints are created and stats will come from future events

    console.log(
      `  Note: SmartLead's lead list API doesn't include per-lead open/click stats.`
    );
    console.log(
      `  Stats will be populated when these providers open/click future emails.`
    );
  }
}

async function main() {
  console.log("=== Provider Outreach Touchpoint Backfill ===\n");
  console.log(`Mode: ${DRY_RUN ? "DRY RUN (no changes)" : "LIVE"}\n`);

  // Step 1: Find providers missing touchpoints
  const missing = await findProvidersMissingTouchpoints();

  if (missing.length === 0) {
    console.log("\nAll providers have touchpoints. Nothing to do.");
    return;
  }

  // Group by campaign for summary
  const byCampaign = new Map<number, number>();
  for (const p of missing) {
    byCampaign.set(p.campaign_id, (byCampaign.get(p.campaign_id) ?? 0) + 1);
  }
  console.log("\nBreakdown by campaign:");
  for (const [campaignId, count] of byCampaign) {
    console.log(`  Campaign ${campaignId}: ${count} missing`);
  }

  // Step 2: Create missing touchpoints
  const created = await createMissingTouchpoints(missing);

  // Step 3: Try to backfill stats (if SmartLead is configured)
  if (!DRY_RUN && created > 0) {
    await tryBackfillStatsFromSmartLead(missing);
  }

  console.log("\n=== Summary ===");
  console.log(`Providers missing touchpoints: ${missing.length}`);
  console.log(`Touchpoints ${DRY_RUN ? "would be created" : "created"}: ${created}`);

  if (!DRY_RUN) {
    console.log(
      "\nNext steps: Open/click stats will be populated when providers engage with future emails."
    );
    console.log(
      "The webhook fix deployed earlier will record these events going forward."
    );
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
