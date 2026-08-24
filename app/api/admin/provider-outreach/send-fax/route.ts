import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { generateClaimUrl } from "@/lib/claim-tokens";

/**
 * POST /api/admin/provider-outreach/send-fax
 *
 * Sends a fax to a provider via Telnyx Programmable Fax API.
 *
 * 1. Generates a personalized one-pager HTML (provider name + QR code)
 * 2. Uploads it to Supabase Storage (bypasses Vercel firewall)
 * 3. Calls Telnyx fax.send with the storage URL
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
const FAX_BUCKET = "fax-documents";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Generate fax HTML content for a provider.
 */
function generateFaxHtml(provider: {
  provider_name: string;
  city?: string;
  state?: string;
  provider_category?: string;
  email?: string;
  provider_id: string;
  slug?: string;
}): string {
  const providerName = provider.provider_name || "Provider";
  const city = provider.city || "";
  const state = provider.state || "";
  const category = provider.provider_category || "Senior Care";

  // Generate claim URL if we have email, otherwise use profile URL
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://olera.care";
  let claimUrl: string;

  if (provider.email) {
    claimUrl = generateClaimUrl(provider.provider_id, provider.slug || "", provider.email, baseUrl);
  } else {
    // Fallback to profile URL with UTM tracking
    claimUrl = `${baseUrl}/provider/${provider.slug || ""}?utm_source=fax&utm_medium=outreach&utm_campaign=provider_claim`;
  }

  // Generate QR code URL (using external service)
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(claimUrl)}`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    @page { size: 8.5in 11in; margin: 0.5in; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: Georgia, 'Times New Roman', Times, serif;
      font-size: 12pt;
      line-height: 1.5;
      color: #000;
      background: #fff;
      padding: 0.5in;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #000;
      padding-bottom: 0.25in;
      margin-bottom: 0.3in;
    }
    .logo {
      font-size: 28pt;
      font-weight: bold;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .tagline {
      font-size: 10pt;
      color: #333;
      margin-top: 4px;
    }
    .date {
      font-size: 10pt;
      text-align: right;
      color: #333;
    }
    h1 {
      font-size: 22pt;
      margin-bottom: 0.2in;
      font-weight: bold;
    }
    .provider-name {
      font-size: 16pt;
      font-weight: bold;
      margin-bottom: 0.3in;
    }
    p {
      margin-bottom: 0.15in;
      text-align: justify;
    }
    .benefits {
      margin: 0.25in 0;
      padding-left: 0.3in;
    }
    .benefits li {
      margin-bottom: 0.1in;
    }
    .qr-section {
      margin-top: 0.4in;
      padding: 0.25in;
      border: 2px solid #000;
      display: flex;
      align-items: center;
      gap: 0.3in;
    }
    .qr-code img {
      display: block;
    }
    .qr-text {
      flex: 1;
    }
    .qr-text h2 {
      font-size: 14pt;
      margin-bottom: 0.1in;
    }
    .qr-text p {
      font-size: 11pt;
      margin-bottom: 0.05in;
    }
    .signature {
      margin-top: 0.4in;
    }
    .signature-name {
      font-weight: bold;
      margin-top: 0.15in;
    }
    .signature-title {
      font-size: 10pt;
      color: #333;
    }
    .footer {
      position: absolute;
      bottom: 0.5in;
      left: 0.5in;
      right: 0.5in;
      border-top: 1px solid #ccc;
      padding-top: 0.1in;
      font-size: 9pt;
      color: #666;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">Olera</div>
      <div class="tagline">Helping Families Find Trusted Senior Care</div>
    </div>
    <div class="date">${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</div>
  </div>

  <h1>Your Free Olera Profile is Ready</h1>

  <p class="provider-name">Dear ${escapeHtml(providerName)},</p>

  <p>
    I'm Dr. Logan DuBose, a physician and co-founder of Olera. We've created a free profile
    for ${escapeHtml(providerName)} on Olera, a platform that helps families find trusted
    ${escapeHtml(category.toLowerCase())} providers${city ? ` in ${escapeHtml(city)}${state ? `, ${escapeHtml(state)}` : ""}` : ""}.
  </p>

  <p>
    Olera is different from traditional referral services. There are no referral fees,
    no cost per lead, and no broker in the middle. When a family finds you through Olera,
    they contact your team directly.
  </p>

  <p>By claiming your free profile, you can:</p>

  <ul class="benefits">
    <li><strong>Receive direct inquiries</strong> from families actively searching for care</li>
    <li><strong>Showcase what makes you different</strong> with photos, descriptions, and highlights</li>
    <li><strong>Improve your online visibility</strong> in local senior care searches</li>
    <li><strong>Never pay referral or per-lead fees</strong> — it's completely free</li>
  </ul>

  <div class="qr-section">
    <div class="qr-code">
      <img src="${qrUrl}" alt="QR Code" width="150" height="150" />
    </div>
    <div class="qr-text">
      <h2>Get Started in Under 2 Minutes</h2>
      <p><strong>Scan the QR code</strong> with your phone camera to claim your profile.</p>
      <p>Or visit: <strong>olera.care</strong> and search for your community.</p>
      <p>Questions? Call us at <strong>(979) 243-9801</strong></p>
    </div>
  </div>

  <div class="signature">
    <p>We'd love to help more families discover ${escapeHtml(providerName)}.</p>
    <p class="signature-name">Dr. Logan DuBose, MD, MPH</p>
    <p class="signature-title">Co-Founder, Olera | Physician-Researcher</p>
  </div>

  <div class="footer">
    Olera Care Inc. | Dallas, TX | olera.care | contact@olera.care
  </div>
</body>
</html>`;
}

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
      .select("provider_id, provider_name, slug, email, city, state, provider_category")
      .eq("provider_id", providerId)
      .maybeSingle();

    const providerName = provider?.provider_name || "Provider";

    // ── Generate fax HTML and upload to Supabase Storage ──────────────────
    // We upload the HTML to Supabase Storage so Telnyx can fetch it without
    // being blocked by Vercel's Attack Challenge Mode.
    const faxHtml = generateFaxHtml({
      provider_name: providerName,
      city: provider?.city,
      state: provider?.state,
      provider_category: provider?.provider_category,
      email: provider?.email,
      provider_id: providerId,
      slug: provider?.slug,
    });

    // Upload to Supabase Storage
    const fileName = `fax-${providerId}-${Date.now()}.html`;
    const { error: uploadError } = await db.storage
      .from(FAX_BUCKET)
      .upload(fileName, Buffer.from(faxHtml, "utf-8"), {
        contentType: "text/html",
        upsert: true,
      });

    if (uploadError) {
      console.error("[send-fax] Storage upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload fax content", detail: uploadError.message },
        { status: 500 },
      );
    }

    // Get public URL for the uploaded file
    const { data: urlData } = db.storage.from(FAX_BUCKET).getPublicUrl(fileName);
    const mediaUrl = urlData.publicUrl;

    // ── Send via Telnyx ──────────────────────────────────────────────────
    // Validate and normalize fax number to E.164
    const faxDigits = faxNumber.replace(/\D/g, "");

    // Validate: must be 10 digits, or 11 digits starting with 1
    const isValid10 = faxDigits.length === 10;
    const isValid11 = faxDigits.length === 11 && faxDigits.startsWith("1");
    if (!isValid10 && !isValid11) {
      return NextResponse.json(
        { error: `Invalid fax number format. Expected 10-digit US number, got ${faxDigits.length} digits.` },
        { status: 400 },
      );
    }

    const toNumber = isValid10 ? `+1${faxDigits}` : `+${faxDigits}`;

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
