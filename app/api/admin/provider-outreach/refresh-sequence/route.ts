import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { buildProviderEmailSequence } from "@/lib/provider-outreach/smartlead-bridge";
import { saveSequence } from "@/lib/smartlead";

/**
 * POST /api/admin/provider-outreach/refresh-sequence
 *
 * Refreshes the SmartLead email sequence HTML for existing campaigns.
 * Use this after deploying email template fixes to update campaigns
 * that were created before the fix.
 *
 * Body:
 *   - campaign_ids: number[] (optional) - Specific campaign IDs to update
 *   - all: boolean (optional) - If true, updates ALL active campaigns
 *   - dry_run: boolean (default: true) - If true, shows what would be updated without making changes
 *
 * Returns:
 *   - updated: number - Count of campaigns updated
 *   - campaigns: Array of { campaign_id, status, error? }
 */

interface RefreshResult {
  campaign_id: number;
  status: "updated" | "skipped" | "failed";
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const adminUser = await getAdminUser(user.id);
    if (!adminUser) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await request.json();
    const { campaign_ids, all = false, dry_run = true } = body;

    if (!campaign_ids && !all) {
      return NextResponse.json(
        { error: "Either campaign_ids array or all=true is required" },
        { status: 400 }
      );
    }

    const db = getServiceClient();

    // Find campaigns to update
    let campaignIdsToUpdate: number[] = [];

    if (campaign_ids && Array.isArray(campaign_ids)) {
      campaignIdsToUpdate = campaign_ids.filter(
        (id): id is number => typeof id === "number" && id > 0
      );
    } else if (all) {
      // Find all active campaigns from tracking records
      const { data: trackingRecords } = await db
        .from("provider_outreach_tracking")
        .select("smartlead_data")
        .eq("stage", "in_sequence")
        .not("smartlead_data", "is", null);

      if (trackingRecords) {
        const ids = new Set<number>();
        for (const record of trackingRecords) {
          const slData = record.smartlead_data as { campaign_id?: number } | null;
          if (slData?.campaign_id) {
            ids.add(slData.campaign_id);
          }
        }
        campaignIdsToUpdate = [...ids];
      }
    }

    if (campaignIdsToUpdate.length === 0) {
      return NextResponse.json({
        dry_run,
        message: "No campaigns found to update",
        updated: 0,
        campaigns: [],
      });
    }

    // Build the new sequence with fixed HTML
    const newSequence = buildProviderEmailSequence();

    const results: RefreshResult[] = [];

    for (const campaignId of campaignIdsToUpdate) {
      if (dry_run) {
        results.push({
          campaign_id: campaignId,
          status: "skipped",
          error: "dry_run mode - no changes made",
        });
        continue;
      }

      try {
        const result = await saveSequence(campaignId, newSequence);

        if (result.ok) {
          results.push({
            campaign_id: campaignId,
            status: "updated",
          });

          console.log(`[refresh-sequence] Updated campaign ${campaignId}`);
        } else {
          results.push({
            campaign_id: campaignId,
            status: "failed",
            error: `SmartLead API error: ${result.status}`,
          });
        }
      } catch (err) {
        console.error(`[refresh-sequence] Failed to update campaign ${campaignId}:`, err);
        results.push({
          campaign_id: campaignId,
          status: "failed",
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    const updatedCount = results.filter((r) => r.status === "updated").length;

    return NextResponse.json({
      dry_run,
      updated: updatedCount,
      total_campaigns: campaignIdsToUpdate.length,
      campaigns: results,
      sequence_preview: dry_run
        ? {
            steps: newSequence.length,
            subjects: newSequence.map((s) => s.subject),
          }
        : undefined,
    });
  } catch (error) {
    console.error("Error in refresh-sequence:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/provider-outreach/refresh-sequence
 *
 * Returns info about campaigns that could be refreshed.
 */
export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const adminUser = await getAdminUser(user.id);
    if (!adminUser) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const db = getServiceClient();

    // Find all active campaigns
    const { data: trackingRecords } = await db
      .from("provider_outreach_tracking")
      .select("smartlead_data, provider_id, city, state")
      .eq("stage", "in_sequence")
      .not("smartlead_data", "is", null);

    const campaigns = new Map<number, { campaign_id: number; campaign_name: string; provider_count: number }>();

    if (trackingRecords) {
      for (const record of trackingRecords) {
        const slData = record.smartlead_data as {
          campaign_id?: number;
          campaign_name?: string;
        } | null;

        if (slData?.campaign_id) {
          const existing = campaigns.get(slData.campaign_id);
          if (existing) {
            existing.provider_count++;
          } else {
            campaigns.set(slData.campaign_id, {
              campaign_id: slData.campaign_id,
              campaign_name: slData.campaign_name || `Campaign ${slData.campaign_id}`,
              provider_count: 1,
            });
          }
        }
      }
    }

    return NextResponse.json({
      campaigns: [...campaigns.values()],
      total_campaigns: campaigns.size,
      usage: {
        dry_run: "POST with { all: true, dry_run: true } to preview",
        update_all: "POST with { all: true, dry_run: false } to update all",
        update_specific: "POST with { campaign_ids: [123, 456], dry_run: false } to update specific campaigns",
      },
    });
  } catch (error) {
    console.error("Error in refresh-sequence GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
