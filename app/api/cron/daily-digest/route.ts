import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";
import { sendEmail } from "@/lib/email";
import { sendSlackAlert } from "@/lib/slack";

/**
 * GET /api/cron/daily-digest
 *
 * Runs daily at 8 AM CT (13:00 UTC). Sends admin team a summary of:
 * - New connection requests (leads) in the last 24h
 * - New provider claims in the last 24h
 * - New disputes in the last 24h
 */
export async function GET(request: NextRequest) {
  // Verify cron secret (Vercel sends this header automatically)
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getServiceClient();
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Fetch counts in parallel
    const [connectionsRes, claimsRes, disputesRes] = await Promise.all([
      db
        .from("connections")
        .select("id, from_profile_id, to_profile_id, created_at", { count: "exact" })
        .eq("type", "inquiry")
        .gte("created_at", oneDayAgo)
        .order("created_at", { ascending: false })
        .limit(10),
      db
        .from("business_profiles")
        .select("id, display_name, claim_state, created_at", { count: "exact" })
        .eq("claim_state", "claimed")
        .gte("updated_at", oneDayAgo)
        .order("updated_at", { ascending: false })
        .limit(10),
      db
        .from("disputes")
        .select("id, provider_name, reason, created_at", { count: "exact" })
        .gte("created_at", oneDayAgo)
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    const newLeads = connectionsRes.count ?? 0;
    const newClaims = claimsRes.count ?? 0;
    const newDisputes = disputesRes.count ?? 0;

    // Skip if nothing happened
    if (newLeads === 0 && newClaims === 0 && newDisputes === 0) {
      return NextResponse.json({ status: "skipped", reason: "No activity in last 24h" });
    }

    // Build digest
    const lines: string[] = [];
    lines.push(`<h2 style="margin:0 0 16px;font-size:20px;">Daily Digest</h2>`);
    lines.push(`<p style="color:#666;margin:0 0 24px;">Activity for the last 24 hours</p>`);

    if (newLeads > 0) {
      lines.push(`<p style="margin:0 0 8px;"><strong>${newLeads} new lead${newLeads === 1 ? "" : "s"}</strong></p>`);
    }
    if (newClaims > 0) {
      lines.push(`<p style="margin:0 0 8px;"><strong>${newClaims} provider claim${newClaims === 1 ? "" : "s"}</strong></p>`);
      for (const claim of claimsRes.data || []) {
        lines.push(`<p style="margin:0 0 4px;padding-left:16px;color:#555;">• ${claim.display_name}</p>`);
      }
    }
    if (newDisputes > 0) {
      lines.push(`<p style="margin:0 0 8px;color:#dc2626;"><strong>${newDisputes} new dispute${newDisputes === 1 ? "" : "s"}</strong></p>`);
      for (const dispute of disputesRes.data || []) {
        lines.push(`<p style="margin:0 0 4px;padding-left:16px;color:#555;">• ${dispute.provider_name}: ${dispute.reason?.slice(0, 80)}</p>`);
      }
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://olera.care";
    lines.push(`<p style="margin:24px 0 0;"><a href="${siteUrl}/admin" style="color:#198087;">View admin dashboard →</a></p>`);

    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
    if (adminEmail) {
      await sendEmail({
        to: adminEmail,
        subject: `Olera Daily Digest: ${newLeads} leads, ${newClaims} claims, ${newDisputes} disputes`,
        html: lines.join("\n"),
      });
    }

    // Slack summary
    try {
      const slackText = `📊 *Daily Digest* — ${newLeads} leads, ${newClaims} claims, ${newDisputes} disputes in the last 24h`;
      await sendSlackAlert(slackText);
    } catch {
      // Non-blocking
    }

    return NextResponse.json({
      status: "sent",
      leads: newLeads,
      claims: newClaims,
      disputes: newDisputes,
    });
  } catch (err) {
    console.error("[cron/daily-digest] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
