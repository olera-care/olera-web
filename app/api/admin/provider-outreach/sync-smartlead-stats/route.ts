/**
 * POST /api/admin/provider-outreach/sync-smartlead-stats
 *
 * Syncs historical open/click data from SmartLead into our system.
 * This pulls data that was missed because webhooks weren't working.
 *
 * Approach:
 * 1. For each campaign, fetch per-lead statistics from SmartLead
 * 2. Match leads to providers by email
 * 3. Create/update touchpoints with open_count, click_count, sequence_step
 * 4. The email-stats endpoint will read these for per-template breakdown
 *
 * Auth: admin-only.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { isAdmin } from "@/lib/admin";
import {
  getCampaignLeadStatistics,
  getCampaignStatistics,
  isSmartleadConfigured,
  type SmartleadLeadStats,
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
    total_leads: number;
    sent: number;
    opened: number;
    clicked: number;
  };
  touchpoints_created: number;
  touchpoints_updated: number;
  providers_not_found: number;
  /** Emails that couldn't be matched to providers (for debugging) */
  unmatched_emails?: string[];
  /** Number of insert operations that failed */
  insert_errors: number;
  /** Number of update operations that failed */
  update_errors: number;
  /** Sample error messages for debugging (first 5) */
  error_samples?: string[];
  error?: string;
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

  // 1. Get all providers with SmartLead data and build email -> provider_id map
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

  // Get provider emails
  const providerIds = trackingRows.map(r => r.provider_id);
  const { data: providers } = await supabase
    .from("providers")
    .select("id, email")
    .in("id", providerIds);

  // Build email -> provider_id map (lowercase for matching)
  const emailToProviderId = new Map<string, string>();
  for (const p of (providers ?? [])) {
    if (p.email) {
      emailToProviderId.set(p.email.toLowerCase(), p.id);
    }
  }

  // Also check smartlead_data for lead_email
  for (const row of trackingRows) {
    const sd = row.smartlead_data as { lead_email?: string } | null;
    if (sd?.lead_email) {
      emailToProviderId.set(sd.lead_email.toLowerCase(), row.provider_id);
    }
  }

  // Group tracking rows by campaign_id
  const campaignIds = new Set<number>();
  for (const row of trackingRows) {
    const sd = row.smartlead_data as { campaign_id?: number } | null;
    if (typeof sd?.campaign_id === "number") {
      campaignIds.add(sd.campaign_id);
    }
  }

  // 2. Process each campaign
  const results: CampaignSyncResult[] = [];

  for (const campaignId of campaignIds) {
    const result: CampaignSyncResult = {
      campaign_id: campaignId,
      touchpoints_created: 0,
      touchpoints_updated: 0,
      providers_not_found: 0,
      unmatched_emails: [],
      insert_errors: 0,
      update_errors: 0,
      error_samples: [],
    };

    // Fetch per-lead statistics from SmartLead
    const leadsResult = await getCampaignLeadStatistics(campaignId);

    if (!leadsResult.ok) {
      result.error = leadsResult.error ?? "Failed to fetch lead stats";
      results.push(result);
      continue;
    }

    const leads = leadsResult.data ?? [];
    result.stats = {
      total_leads: leads.length,
      sent: leads.filter(l => l.sent_time).length,
      opened: leads.filter(l => (l.open_count ?? 0) > 0).length,
      clicked: leads.filter(l => (l.click_count ?? 0) > 0).length,
    };

    // Process each lead with engagement data
    for (const lead of leads) {
      if (!lead.lead_email) continue;

      const openCount = lead.open_count ?? 0;
      const clickCount = lead.click_count ?? 0;

      // Skip leads with no engagement
      if (openCount === 0 && clickCount === 0 && !lead.sent_time) continue;

      const providerId = emailToProviderId.get(lead.lead_email.toLowerCase());
      if (!providerId) {
        result.providers_not_found++;
        // Track unmatched emails for debugging (limit to first 50 to avoid huge responses)
        if (result.unmatched_emails && result.unmatched_emails.length < 50) {
          result.unmatched_emails.push(lead.lead_email);
        }
        continue;
      }

      // Map sequence_number to sequence_step (1-4)
      // sequence_number 1 = Day 0 (step 1), 2 = Day 3 (step 2), etc.
      // Guard against invalid values (0, negative, or missing)
      const sequenceStep = lead.sequence_number && lead.sequence_number > 0 && lead.sequence_number <= 4
        ? lead.sequence_number
        : 1;

      // Check for existing touchpoint FOR THIS SPECIFIC SEQUENCE STEP
      // Critical: We must match by sequence_step to avoid overwriting touchpoints
      // for different steps when a lead progresses through the sequence.
      const { data: existingTouchpoint } = await supabase
        .from("provider_outreach_touchpoints")
        .select("id, details")
        .eq("provider_id", providerId)
        .eq("touchpoint_type", "email_sent")
        .eq("details->>source", "smartlead")
        .eq("details->>sequence_step", sequenceStep.toString())
        .limit(1)
        .single();

      if (existingTouchpoint) {
        // Update existing touchpoint with engagement data
        const existingDetails = (existingTouchpoint.details ?? {}) as Record<string, unknown>;
        const existingOpenCount = Number(existingDetails.open_count ?? 0);
        const existingClickCount = Number(existingDetails.click_count ?? 0);

        // Only update if we have new/higher engagement
        if (openCount > existingOpenCount || clickCount > existingClickCount) {
          const { error: updateError } = await supabase
            .from("provider_outreach_touchpoints")
            .update({
              details: {
                ...existingDetails,
                sequence_step: sequenceStep,
                open_count: Math.max(openCount, existingOpenCount),
                click_count: Math.max(clickCount, existingClickCount),
                synced_from_smartlead: true,
                synced_at: new Date().toISOString(),
              },
            })
            .eq("id", existingTouchpoint.id);

          if (updateError) {
            result.update_errors++;
            // Capture first 5 error messages for debugging
            if (result.error_samples && result.error_samples.length < 5) {
              result.error_samples.push(`UPDATE ${providerId}: ${updateError.message}`);
            }
            console.error(`[sync-smartlead-stats] Update failed for provider ${providerId}:`, updateError.message);
          } else {
            result.touchpoints_updated++;
          }
        }
      } else {
        // Create new touchpoint
        const { error: insertError } = await supabase
          .from("provider_outreach_touchpoints")
          .insert({
            provider_id: providerId,
            touchpoint_type: "email_sent",
            details: {
              source: "smartlead",
              campaign_id: campaignId,
              lead_email: lead.lead_email,
              sequence_step: sequenceStep,
              open_count: openCount,
              click_count: clickCount,
              is_bounced: lead.is_bounced ?? false,
              is_unsubscribed: lead.is_unsubscribed ?? false,
              synthetic: true, // Mark as backfilled
              synced_from_smartlead: true,
              synced_at: new Date().toISOString(),
            },
            created_at: lead.sent_time ?? new Date().toISOString(),
          });

        if (insertError) {
          result.insert_errors++;
          // Capture first 5 error messages for debugging
          if (result.error_samples && result.error_samples.length < 5) {
            result.error_samples.push(`INSERT ${providerId}: ${insertError.message}`);
          }
          console.error(`[sync-smartlead-stats] Insert failed for provider ${providerId}:`, insertError.message);
        } else {
          result.touchpoints_created++;
        }
      }
    }

    // Clean up empty arrays for cleaner response
    if (result.unmatched_emails?.length === 0) {
      delete result.unmatched_emails;
    }
    if (result.error_samples?.length === 0) {
      delete result.error_samples;
    }

    results.push(result);
  }

  const totalCreated = results.reduce((sum, r) => sum + r.touchpoints_created, 0);
  const totalUpdated = results.reduce((sum, r) => sum + r.touchpoints_updated, 0);
  const totalInsertErrors = results.reduce((sum, r) => sum + r.insert_errors, 0);
  const totalUpdateErrors = results.reduce((sum, r) => sum + r.update_errors, 0);
  const totalProvidersNotFound = results.reduce((sum, r) => sum + r.providers_not_found, 0);
  const hasCampaignErrors = results.some(r => r.error);
  const hasDbErrors = totalInsertErrors > 0 || totalUpdateErrors > 0;

  return NextResponse.json({
    ok: !hasCampaignErrors && !hasDbErrors,
    campaigns_synced: results.length,
    touchpoints_created: totalCreated,
    touchpoints_updated: totalUpdated,
    insert_errors: totalInsertErrors,
    update_errors: totalUpdateErrors,
    providers_not_found: totalProvidersNotFound,
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
      campaignPreviews.push({
        campaign_id: campaignId,
        campaign_name: info.name,
        providers_in_db: info.provider_count,
        smartlead_stats: {
          total_leads: stats.total_leads ?? 0,
          sent: stats.contacted ?? 0,
          opened: stats.opened ?? 0,
          clicked: stats.clicked ?? 0,
          bounced: stats.bounced ?? 0,
          open_rate: stats.open_rate ?? 0,
          click_rate: stats.click_rate ?? 0,
        },
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
