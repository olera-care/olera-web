/**
 * GET /api/admin/provider-outreach/debug-smartlead
 *
 * Debug endpoint to see raw SmartLead API response data.
 * Shows what sequence_number values are being returned.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import { getCampaignLeadStatistics, isSmartleadConfigured } from "@/lib/smartlead";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function GET() {
  const supaUser = await createClient();
  const { data: { user } } = await supaUser.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (!(await isAdmin(user.id))) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  if (!isSmartleadConfigured()) {
    return NextResponse.json({ error: "SMARTLEAD_API_KEY not configured" }, { status: 500 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createServiceClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Get all campaign IDs
  const { data: trackingRows } = await supabase
    .from("provider_outreach_tracking")
    .select("smartlead_data")
    .not("smartlead_data", "is", null);

  const campaignIds = new Set<number>();
  for (const row of trackingRows ?? []) {
    const sd = row.smartlead_data as { campaign_id?: number } | null;
    if (typeof sd?.campaign_id === "number") {
      campaignIds.add(sd.campaign_id);
    }
  }

  const results: Record<number, unknown> = {};
  const sequenceNumberDistribution: Record<string, number> = {};

  for (const campaignId of campaignIds) {
    const leadsResult = await getCampaignLeadStatistics(campaignId);

    if (leadsResult.ok && leadsResult.data) {
      // Count sequence_number distribution
      for (const lead of leadsResult.data) {
        const seqNum = lead.sequence_number;
        const key = seqNum === undefined ? "undefined" : String(seqNum);
        sequenceNumberDistribution[key] = (sequenceNumberDistribution[key] || 0) + 1;
      }

      // Show first 5 leads as sample
      results[campaignId] = {
        total_leads: leadsResult.data.length,
        sample_leads: leadsResult.data.slice(0, 5).map(lead => ({
          email: lead.lead_email?.replace(/(.{3}).*@/, "$1***@"), // Partially mask email
          sequence_number: lead.sequence_number,
          open_count: lead.open_count,
          click_count: lead.click_count,
          sent_time: lead.sent_time,
        })),
      };
    } else {
      results[campaignId] = { error: leadsResult.error };
    }
  }

  return NextResponse.json({
    campaigns: results,
    sequence_number_distribution: sequenceNumberDistribution,
    total_campaigns: campaignIds.size,
  });
}
