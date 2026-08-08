/**
 * POST /api/admin/provider-outreach/sync-smartlead-stats
 *
 * Syncs historical open/click data from SmartLead into our system.
 * This pulls data that was missed because webhooks weren't working.
 *
 * Approach:
 * 1. For each campaign, fetch campaign-level statistics from SmartLead
 * 2. Store aggregate stats in provider_outreach_tracking.smartlead_data
 * 3. The email-stats endpoint will read these and display totals
 *
 * Auth: admin-only.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { isAdmin } from "@/lib/admin";
import {
  getCampaignStatistics,
  isSmartleadConfigured,
} from "@/lib/smartlead";

export const maxDuration = 300;

function makeServiceClient(url: string, key: string) {
  return createServiceClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

interface CampaignSyncResult {
  campaign_id: number;
  campaign_name?: string;
  stats?: {
    sent: number;
    opened: number;
    clicked: number;
    open_rate: number;
    click_rate: number;
  };
  providers_updated: number;
  providers_failed: number;
  error?: string;
  update_errors?: string[];
}

export async function POST() {
  const supaUser = await createClient();
  const { data: { user } } = await supaUser.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (!(await isAdmin(user.id))) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "Server configuration error (Supabase env)" }, { status: 500 });
  }
  if (!isSmartleadConfigured()) {
    return NextResponse.json({ error: "SMARTLEAD_API_KEY is not set in this environment." }, { status: 500 });
  }

  const supabase = makeServiceClient(supabaseUrl, serviceKey);

  // 1. Get all providers with SmartLead data, grouped by campaign
  const { data: trackingRows, error: trackingError } = await supabase
    .from("provider_outreach_tracking")
    .select("id, provider_id, smartlead_data")
    .not("smartlead_data", "is", null);

  if (trackingError) {
    return NextResponse.json({ error: `Failed to fetch tracking data: ${trackingError.message}` }, { status: 500 });
  }

  if (!trackingRows || trackingRows.length === 0) {
    return NextResponse.json({ ok: true, message: "No providers with SmartLead data found", synced: 0 });
  }

  // Group by campaign_id
  const campaignProviders = new Map<number, Array<{ tracking_id: string; provider_id: string; smartlead_data: Record<string, unknown> }>>();

  for (const row of trackingRows) {
    const sd = row.smartlead_data as { campaign_id?: number } | null;
    const campaignId = sd?.campaign_id;
    if (typeof campaignId !== "number") continue;

    if (!campaignProviders.has(campaignId)) {
      campaignProviders.set(campaignId, []);
    }
    campaignProviders.get(campaignId)!.push({
      tracking_id: row.id,
      provider_id: row.provider_id,
      smartlead_data: row.smartlead_data as Record<string, unknown>,
    });
  }

  // 2. Fetch stats for each campaign from SmartLead API
  const results: CampaignSyncResult[] = [];

  for (const [campaignId, providers] of campaignProviders) {
    const result: CampaignSyncResult = {
      campaign_id: campaignId,
      providers_updated: 0,
      providers_failed: 0,
      update_errors: [],
    };

    // Fetch campaign statistics from SmartLead
    const statsResult = await getCampaignStatistics(campaignId);

    if (!statsResult.ok) {
      result.error = statsResult.error ?? "Failed to fetch stats";
      results.push(result);
      continue;
    }

    const stats = statsResult.data;
    if (stats) {
      // SmartLead API may return "contacted" or "sent" - try both
      const sentCount = stats.contacted ?? (stats as Record<string, unknown>).sent ?? 0;

      result.stats = {
        sent: typeof sentCount === "number" ? sentCount : 0,
        opened: stats.opened ?? 0,
        clicked: stats.clicked ?? 0,
        open_rate: stats.open_rate ?? 0,
        click_rate: stats.click_rate ?? 0,
      };

      // Update each provider's smartlead_data with campaign stats
      for (const provider of providers) {
        const updatedSmartleadData = {
          ...provider.smartlead_data,
          campaign_stats: {
            sent: result.stats.sent,
            opened: result.stats.opened,
            clicked: result.stats.clicked,
            open_rate: result.stats.open_rate,
            click_rate: result.stats.click_rate,
            synced_at: new Date().toISOString(),
          },
        };

        const { error: updateError } = await supabase
          .from("provider_outreach_tracking")
          .update({ smartlead_data: updatedSmartleadData })
          .eq("id", provider.tracking_id);

        if (updateError) {
          result.providers_failed++;
          result.update_errors!.push(`${provider.provider_id}: ${updateError.message}`);
          console.error(`[sync-smartlead-stats] Failed to update provider ${provider.provider_id}:`, updateError.message);
        } else {
          result.providers_updated++;
        }
      }

      // Clean up empty errors array
      if (result.update_errors!.length === 0) {
        delete result.update_errors;
      }
    }

    results.push(result);
  }

  const totalUpdated = results.reduce((sum, r) => sum + r.providers_updated, 0);
  const hasErrors = results.some(r => r.error);

  return NextResponse.json({
    ok: !hasErrors,
    campaigns_synced: results.length,
    providers_updated: totalUpdated,
    results,
  });
}

export async function GET() {
  // GET = dry run - show what would be synced
  const supaUser = await createClient();
  const { data: { user } } = await supaUser.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (!(await isAdmin(user.id))) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }
  if (!isSmartleadConfigured()) {
    return NextResponse.json({ error: "SMARTLEAD_API_KEY is not set" }, { status: 500 });
  }

  const supabase = makeServiceClient(supabaseUrl, serviceKey);

  // Get tracking data
  const { data: trackingRows } = await supabase
    .from("provider_outreach_tracking")
    .select("provider_id, smartlead_data")
    .not("smartlead_data", "is", null);

  const campaigns = new Map<number, { name?: string; provider_count: number }>();
  for (const row of (trackingRows ?? [])) {
    const sd = row.smartlead_data as { campaign_id?: number; campaign_name?: string } | null;
    if (typeof sd?.campaign_id === "number") {
      const existing = campaigns.get(sd.campaign_id);
      if (existing) {
        existing.provider_count++;
      } else {
        campaigns.set(sd.campaign_id, { name: sd.campaign_name, provider_count: 1 });
      }
    }
  }

  // Fetch current stats from SmartLead for preview
  const campaignPreviews = [];
  for (const [campaignId, info] of campaigns) {
    const statsResult = await getCampaignStatistics(campaignId);
    if (statsResult.ok && statsResult.data) {
      const stats = statsResult.data;
      // SmartLead API may return "contacted" or "sent" - try both
      const sentCount = stats.contacted ?? (stats as Record<string, unknown>).sent ?? 0;
      campaignPreviews.push({
        campaign_id: campaignId,
        campaign_name: info.name,
        providers_in_db: info.provider_count,
        smartlead_stats: {
          sent: typeof sentCount === "number" ? sentCount : 0,
          opened: stats.opened ?? 0,
          clicked: stats.clicked ?? 0,
          open_rate: stats.open_rate ?? 0,
          click_rate: stats.click_rate ?? 0,
        },
        // Include raw response for debugging field names
        raw_api_response: stats,
      });
    } else {
      campaignPreviews.push({
        campaign_id: campaignId,
        campaign_name: info.name,
        providers_in_db: info.provider_count,
        smartlead_stats: { error: statsResult.error },
      });
    }
  }

  return NextResponse.json({
    dry_run: true,
    providers_with_smartlead: trackingRows?.length ?? 0,
    campaigns: campaignPreviews,
  });
}
