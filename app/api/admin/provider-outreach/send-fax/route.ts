import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * POST /api/admin/provider-outreach/send-fax
 *
 * Sends a fax to a provider via Telnyx Programmable Fax API.
 *
 * 1. Generates a personalized one-pager PDF (provider name + QR code)
 * 2. Uploads it as a media URL Telnyx can fetch
 * 3. Calls Telnyx fax.send with the provider's fax number
 * 4. Stores the Telnyx fax_id for webhook status tracking
 *
 * Body: { provider_id: string }
 *
 * Requires env vars:
 *   TELNYX_API_KEY       — v2 API key from Telnyx Mission Control
 *   TELNYX_FAX_APP_ID    — Telnyx TeXML or Fax application ID
 *   TELNYX_FROM_NUMBER   — Telnyx-provisioned fax-capable number (E.164)
 *
 * Returns: { success: true, fax_id: string }
 */
export const runtime = "nodejs";
export const maxDuration = 30;

const TELNYX_API_URL = "https://api.telnyx.com/v2/faxes";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const admin = await getAdminUser(user.id);
    if (!admin) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = (await request.json()) as { provider_id?: string; fax_number?: string };
    const providerId = body.provider_id?.trim();
    const bodyFaxNumber = body.fax_number?.trim();

    if (!providerId) {
      return NextResponse.json(
        { error: "provider_id is required" },
        { status: 400 },
      );
    }

    // ── Check env vars ───────────────────────────────────────────────────
    const telnyxApiKey = process.env.TELNYX_API_KEY;
    const telnyxFromNumber = process.env.TELNYX_FROM_NUMBER;

    if (!telnyxApiKey || !telnyxFromNumber) {
      return NextResponse.json(
        {
          error: "Fax sending is not configured. Set TELNYX_API_KEY and TELNYX_FROM_NUMBER.",
          missing_config: true,
        },
        { status: 503 },
      );
    }

    // ── Fetch provider + fax number ──────────────────────────────────────
    const db = getServiceClient();

    const { data: tracking, error: trackError } = await db
      .from("provider_outreach_tracking")
      .select("*")
      .eq("provider_id", providerId)
      .maybeSingle();

    if (trackError) {
      console.error("[send-fax] Tracking query error:", trackError);
      return NextResponse.json({ error: "Failed to fetch tracking" }, { status: 500 });
    }

    const faxNumber = tracking?.fax_number || bodyFaxNumber;
    if (!faxNumber) {
      return NextResponse.json(
        { error: "No fax number saved for this provider. Run Find & Save first." },
        { status: 400 },
      );
    }

    // Fetch provider details for the letter
    const { data: provider } = await db
      .from("olera-providers")
      .select("provider_id, provider_name, slug")
      .eq("provider_id", providerId)
      .maybeSingle();

    const providerName = provider?.provider_name || "Provider";
    const providerSlug = provider?.slug || "";

    // ── Generate fax PDF URL ─────────────────────────────────────────────
    // The fax content is hosted as a dynamic page that Telnyx fetches and
    // converts to a fax-compatible format. We pass provider details as
    // query params to the render endpoint.
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://olera.care";
    const mediaUrl = `${baseUrl}/api/admin/provider-outreach/fax-pdf?provider_id=${encodeURIComponent(providerId)}`;

    // ── Send via Telnyx ──────────────────────────────────────────────────
    // Normalize fax number to E.164
    const faxDigits = faxNumber.replace(/\D/g, "");
    const toNumber = faxDigits.length === 10 ? `+1${faxDigits}` : `+${faxDigits}`;

    const telnyxRes = await fetch(TELNYX_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${telnyxApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        connection_id: process.env.TELNYX_FAX_APP_ID || undefined,
        media_url: mediaUrl,
        to: toNumber,
        from: telnyxFromNumber,
        quality: "normal",
      }),
    });

    if (!telnyxRes.ok) {
      const errBody = await telnyxRes.text();
      console.error("[send-fax] Telnyx error:", telnyxRes.status, errBody);
      return NextResponse.json(
        { error: "Telnyx fax send failed", detail: errBody },
        { status: 502 },
      );
    }

    const telnyxData = await telnyxRes.json();
    const faxId = telnyxData?.data?.id || null;

    // ── Write send record to DB ──────────────────────────────────────────
    const { error: updateError } = await db
      .from("provider_outreach_tracking")
      .update({
        fax_sent_at: new Date().toISOString(),
        fax_telnyx_id: faxId,
        fax_status: "queued",
        fax_sent_by: user.id,
      })
      .eq("provider_id", providerId);

    if (updateError) {
      console.error("[send-fax] Failed to update tracking:", updateError);
      // Don't fail — fax was already sent
    }

    return NextResponse.json({
      success: true,
      fax_id: faxId,
      to: toNumber,
      provider_name: providerName,
    });
  } catch (e) {
    console.error("[send-fax] Error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to send fax" },
      { status: 500 },
    );
  }
}
