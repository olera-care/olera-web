/**
 * POST /api/admin/staffing-outreach/batch
 *
 * Batch operations for staffing outreach V2.
 *
 * Actions supported:
 *   start_sequence_batch    Start email sequence for multiple providers
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { startEmailSequence } from "@/lib/staffing-outreach/resend-automation";
import { getServiceArea, type StaffingOutreachRow } from "@/lib/staffing-outreach/types";

interface BatchResult {
  success: boolean;
  outreachId: string;
  providerName?: string;
  error?: string;
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await getAdminUser(user.id);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const action = body.action as string;

  if (action === "start_sequence_batch") {
    return handleStartSequenceBatch(body, user.id);
  }

  return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
}

async function handleStartSequenceBatch(
  body: { outreach_ids?: string[]; batch_id?: string },
  userId: string,
): Promise<NextResponse> {
  const db = getServiceClient();

  let outreachIds = body.outreach_ids ?? [];

  // If batch_id provided, get all queued providers in that batch
  if (body.batch_id && outreachIds.length === 0) {
    const { data: queued } = await db
      .from("staffing_outreach")
      .select("id")
      .eq("batch_id", body.batch_id)
      .eq("status", "queued");

    outreachIds = (queued ?? []).map((r) => r.id);
  }

  if (outreachIds.length === 0) {
    return NextResponse.json({ error: "No outreach IDs provided" }, { status: 400 });
  }

  // Note: No hard limit - we process sequentially which is safe.
  // Each startEmailSequence call is fast (~100-500ms), so even 100+ providers
  // should complete well within Vercel's timeout limits.

  // Get all outreach records with their batch and provider info
  const { data: outreachRows, error: fetchError } = await db
    .from("staffing_outreach")
    .select(`
      id,
      provider_id,
      batch_id,
      status,
      research_data
    `)
    .in("id", outreachIds)
    .eq("status", "queued");

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!outreachRows || outreachRows.length === 0) {
    return NextResponse.json({ error: "No queued providers found" }, { status: 400 });
  }

  // Get provider names and emails
  const providerIds = outreachRows.map((r) => r.provider_id);
  const { data: providers } = await db
    .from("olera-providers")
    .select("provider_id, provider_name, email")
    .in("provider_id", providerIds);

  const providerMap = new Map(
    (providers ?? []).map((p) => [p.provider_id, { name: p.provider_name, email: p.email }]),
  );

  // Get batch info
  const batchIds = [...new Set(outreachRows.map((r) => r.batch_id))];
  const { data: batches } = await db
    .from("staffing_batches")
    .select("id, university_name, university_slug")
    .in("id", batchIds);

  const batchMap = new Map(
    (batches ?? []).map((b) => [b.id, { name: b.university_name, slug: b.university_slug }]),
  );

  // Process each provider
  const results: BatchResult[] = [];
  const now = new Date().toISOString();

  for (const outreach of outreachRows as StaffingOutreachRow[]) {
    const providerInfo = providerMap.get(outreach.provider_id);
    const providerName = providerInfo?.name ?? "Unknown";
    const batchInfo = batchMap.get(outreach.batch_id);
    // Check both provider.email and research_data.general_email (same as drawer)
    const recipientEmail = (
      providerInfo?.email?.trim() ||
      outreach.research_data?.general_email?.trim() ||
      ""
    );

    // Skip if no email
    if (!recipientEmail) {
      results.push({
        success: false,
        outreachId: outreach.id,
        providerName,
        error: "No email address",
      });
      continue;
    }

    // Start sequence
    const serviceArea = getServiceArea(batchInfo?.slug);
    const seqResult = await startEmailSequence({
      email: recipientEmail,
      outreachId: outreach.id,
      providerId: outreach.provider_id,
      providerName,
      universityName: batchInfo?.name ?? "Unknown University",
      serviceArea,
      batchId: outreach.batch_id,
    });

    if (seqResult.success) {
      // Update status - email1_sent_at is set immediately since we send directly
      await db
        .from("staffing_outreach")
        .update({
          status: "sequencing",
          sequence_started_at: now,
          email1_sent_at: now, // Email sent directly, not via automation
          sequence_email: recipientEmail,
          next_action_due_at: new Date(Date.now() + 6 * 86400_000).toISOString(),
          updated_at: now,
        })
        .eq("id", outreach.id);

      // Log touchpoint
      await db.from("staffing_touchpoints").insert({
        outreach_id: outreach.id,
        type: "sequence_email1_sent",
        notes: "Batch queue operation - Email 1 sent directly",
        payload: {
          recipient_email: recipientEmail,
          resend_email_id: seqResult.emailId,
          university: batchInfo?.name,
          batch_operation: true,
        },
        created_by: userId,
      });

      results.push({
        success: true,
        outreachId: outreach.id,
        providerName,
      });
    } else {
      results.push({
        success: false,
        outreachId: outreach.id,
        providerName,
        error: seqResult.error,
      });
    }
  }

  const successCount = results.filter((r) => r.success).length;
  const failCount = results.filter((r) => !r.success).length;

  return NextResponse.json({
    success: failCount === 0,
    results,
    summary: {
      total: results.length,
      success: successCount,
      failed: failCount,
    },
  });
}
