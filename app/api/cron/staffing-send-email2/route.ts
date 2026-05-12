/**
 * GET /api/cron/staffing-send-email2
 *
 * Runs hourly. Sends Email 2 (follow-up) to providers who:
 * - Are in "sequencing" status
 * - Have email1_sent_at set (Email 1 was sent)
 * - Have email2_sent_at NOT set (Email 2 not yet sent)
 * - email1_sent_at was > 3 days ago
 *
 * This replaces the Resend Automation for sending follow-up emails.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";
import { sendFollowUpEmail, isResendMockMode } from "@/lib/staffing-outreach/resend-automation";
import { withCronRun } from "@/lib/crons/run";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return withCronRun("staffing-send-email2", async () => {
  try {
    const db = getServiceClient();
    const now = new Date().toISOString();

    // Find providers who need Email 2
    // 3 days = 3 * 24 * 60 * 60 * 1000 = 259200000 ms
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

    const { data: readyForEmail2, error: queryError } = await db
      .from("staffing_outreach")
      .select(`
        id,
        provider_id,
        batch_id,
        sequence_email,
        email1_sent_at
      `)
      .eq("status", "sequencing")
      .not("email1_sent_at", "is", null)
      .is("email2_sent_at", null)
      .lt("email1_sent_at", threeDaysAgo)
      .limit(50); // Process in batches to avoid timeout

    if (queryError) {
      console.error("[cron/staffing-send-email2] Query error:", queryError);
      return NextResponse.json({ error: queryError.message }, { status: 500 });
    }

    if (!readyForEmail2 || readyForEmail2.length === 0) {
      console.log("[cron/staffing-send-email2] No providers ready for Email 2");
      return NextResponse.json({ status: "ok", sent: 0 });
    }

    console.log(
      `[cron/staffing-send-email2] Found ${readyForEmail2.length} providers ready for Email 2`
    );

    // Get batch info for university names
    const batchIds = [...new Set(readyForEmail2.map((r) => r.batch_id))];
    const { data: batches } = await db
      .from("staffing_batches")
      .select("id, university_name")
      .in("id", batchIds);

    const batchMap = new Map(
      (batches ?? []).map((b) => [b.id, b.university_name])
    );

    // Send Email 2 to each provider
    const results: Array<{ id: string; success: boolean; error?: string }> = [];
    const isMockMode = isResendMockMode();

    for (const outreach of readyForEmail2) {
      const universityName = batchMap.get(outreach.batch_id) ?? "Unknown University";
      const recipientEmail = outreach.sequence_email;

      if (!recipientEmail) {
        console.log(`[cron/staffing-send-email2] No email for outreach ${outreach.id}, skipping`);
        results.push({ id: outreach.id, success: false, error: "No email" });
        continue;
      }

      try {
        const sendResult = await sendFollowUpEmail({
          email: recipientEmail,
          outreachId: outreach.id,
          universityName,
        });

        if (sendResult.success) {
          // Update the outreach record
          await db
            .from("staffing_outreach")
            .update({
              email2_sent_at: now,
              updated_at: now,
            })
            .eq("id", outreach.id);

          // Log touchpoint
          await db.from("staffing_touchpoints").insert({
            outreach_id: outreach.id,
            type: "sequence_email2_sent",
            notes: isMockMode ? "Email 2 sent (mock mode)" : "Email 2 sent via cron",
            payload: {
              recipient_email: recipientEmail,
              resend_email_id: sendResult.emailId,
              triggered_by: "cron",
            },
            created_at: now,
          });

          console.log(`[cron/staffing-send-email2] Sent Email 2 to ${recipientEmail}`);
          results.push({ id: outreach.id, success: true });
        } else {
          console.error(
            `[cron/staffing-send-email2] Failed to send Email 2 to ${recipientEmail}:`,
            sendResult.error
          );
          results.push({ id: outreach.id, success: false, error: sendResult.error });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error(`[cron/staffing-send-email2] Error sending to ${recipientEmail}:`, message);
        results.push({ id: outreach.id, success: false, error: message });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    console.log(
      `[cron/staffing-send-email2] Completed: ${successCount} sent, ${failCount} failed`
    );

    return NextResponse.json({
      status: "ok",
      sent: successCount,
      failed: failCount,
      results,
    });
  } catch (err) {
    console.error("[cron/staffing-send-email2] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
  });
}
