import { NextResponse } from "next/server";
import { sendSlackAlert, slackRemovalRequest } from "@/lib/slack";

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
