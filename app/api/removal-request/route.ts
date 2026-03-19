import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendSlackAlert, slackRemovalRequest } from "@/lib/slack";

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

/**
 * POST /api/removal-request
 *
 * Submits a page removal/hide request from a provider.
 * No auth required — angry providers won't be signed in.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      provider_id,
      provider_name,
      provider_slug,
      full_name,
      business_email,
      business_phone,
      action,
      reason,
      additional_details,
    } = body;

    if (
      !provider_id ||
      !full_name?.trim() ||
      !business_email?.trim() ||
      !business_phone?.trim() ||
      !action ||
      !reason
    ) {
      return NextResponse.json(
        { error: "All required fields must be filled." },
        { status: 400 }
      );
    }

    // Persist to database
    const db = getServiceClient();
    if (db) {
      const { error: insertErr } = await db.from("removal_requests").insert({
        provider_id,
        provider_name: provider_name || provider_id,
        provider_slug: provider_slug || null,
        full_name: full_name.trim(),
        business_email: business_email.trim(),
        business_phone: business_phone.trim(),
        action,
        reason,
        additional_details: additional_details?.trim() || null,
      });

      if (insertErr) {
        console.error("Failed to insert removal request:", insertErr);
        // Continue anyway — Slack alert is the fallback
      }
    }

    // Send Slack alert with full details
    try {
      const alert = slackRemovalRequest({
        providerName: provider_name || provider_id,
        providerSlug: provider_slug || provider_id,
        fullName: full_name.trim(),
        email: business_email.trim(),
        phone: business_phone.trim(),
        action,
        reason,
        details: additional_details?.trim() || undefined,
      });
      await sendSlackAlert(alert.text, alert.blocks);
    } catch (err) {
      console.error("Slack alert failed for removal request:", err);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Removal request route error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
