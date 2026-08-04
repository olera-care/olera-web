import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";
import { generateClaimUrl } from "@/lib/claim-tokens";

/**
 * GET /api/admin/provider-outreach/fax-pdf
 *
 * Generates fax content HTML for Telnyx to fetch and convert.
 * Returns a letter-sized HTML page with provider name, QR code,
 * and claim instructions.
 *
 * Query params: ?provider_id=...
 *
 * This endpoint is called by Telnyx when sending a fax, so it must:
 * - Return HTML (not JSON)
 * - Be publicly accessible (no auth - Telnyx fetches it)
 * - Include all content inline (no external CSS that Telnyx can't fetch)
 */
export const runtime = "nodejs";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function GET(request: NextRequest) {
  try {
    const providerId = request.nextUrl.searchParams.get("provider_id");

    if (!providerId) {
      return new NextResponse("Missing provider_id", { status: 400 });
    }

    const db = getServiceClient();

    // Fetch provider details
    const { data: provider, error: provError } = await db
      .from("olera-providers")
      .select("provider_id, provider_name, slug, email, city, state, provider_category")
      .eq("provider_id", providerId)
      .maybeSingle();

    if (provError || !provider) {
      console.error("[fax-pdf] Provider fetch error:", provError);
      return new NextResponse("Provider not found", { status: 404 });
    }

    const providerName = provider.provider_name || "Provider";
    const city = provider.city || "";
    const state = provider.state || "";
    const category = provider.provider_category || "Senior Care";
    const slug = provider.slug || "";

    // Generate claim URL if we have email, otherwise use profile URL
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://olera.care";
    let claimUrl: string;

    if (provider.email) {
      claimUrl = generateClaimUrl(providerId, slug, provider.email, baseUrl);
    } else {
      // Fallback to profile URL with UTM tracking
      claimUrl = `${baseUrl}/provider/${slug}?utm_source=fax&utm_medium=outreach&utm_campaign=provider_claim`;
    }

    // Generate QR code URL (using external service - Telnyx can fetch this)
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(claimUrl)}`;

    // Build fax HTML - letter size (8.5x11 inches), black and white friendly
    const html = `<!DOCTYPE html>
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

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (e) {
    console.error("[fax-pdf] Error:", e);
    return new NextResponse("Internal error", { status: 500 });
  }
}
