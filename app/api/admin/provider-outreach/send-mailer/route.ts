import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * POST /api/admin/provider-outreach/send-mailer
 *
 * Sends a postcard to a provider via PostGrid Print & Mail API.
 *
 * 1. Builds personalized front/back HTML with provider name + QR code
 * 2. Calls PostGrid POST /postcards with inline HTML
 * 3. Stores the PostGrid postcard ID for webhook status tracking
 *
 * Body: { provider_id: string, address: string }
 *
 * Requires env: POSTGRID_API_KEY
 *
 * Returns: { success: true, postcard_id: string }
 */
export const runtime = "nodejs";
export const maxDuration = 30;

const POSTGRID_API_URL = "https://api.postgrid.com/print-mail/v1/postcards";

// Olera return address
const FROM_ADDRESS = {
  firstName: "Olera",
  lastName: "Care",
  companyName: "Olera Care Inc.",
  addressLine1: "Dallas, TX",
  city: "Dallas",
  provinceOrState: "TX",
  postalOrZip: "75201",
  country: "US",
};

/**
 * Build the postcard front HTML (6x4 inches, 300 DPI = 1800x1200px).
 * PostGrid renders this HTML to print.
 */
function buildFrontHtml(providerName: string, qrUrl: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    @page { size: 6in 4in; margin: 0; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 6in; height: 4in;
      font-family: Georgia, 'Times New Roman', serif;
      background: #fff;
      position: relative;
      overflow: hidden;
    }
  </style>
</head>
<body>
  <!-- Logo icon -->
  <img src="https://olera.care/images/olera-logo.png" width="28" height="28" style="position:absolute; top:0.3in; left:0.4in; object-fit:contain;" />
  <!-- Logo text -->
  <div style="position:absolute; top:0.28in; left:0.72in;">
    <span style="color:#2A7C7C; font-size:28px; font-weight:800; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; letter-spacing:-0.5px;">Olera</span>
    <div style="color:#aaa; font-size:9px; font-family:-apple-system,sans-serif; margin-top:1px;">olera.care</div>
  </div>
  <!-- Slogan top-right -->
  <div style="position:absolute; top:0.28in; right:0.4in; text-align:right; font-size:9px; font-weight:700; color:#222; text-transform:uppercase; letter-spacing:2px; line-height:1.5; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    Helping Families Find<br>Trusted Senior Care.
  </div>

  <!-- Main content block: headline + subtitle + divider + features (normal flow) -->
  <div style="position:absolute; top:0.8in; left:0.4in; width:3in;">
    <div style="font-size:42px; font-weight:700; color:#111; line-height:1.08;">
      Your Next Referral<br>
      <span style="color:#2A7C7C; position:relative; display:inline-block;">Starts Here.<svg style="position:absolute; bottom:-3px; left:0; width:100%;" height="6" viewBox="0 0 200 10" fill="none" preserveAspectRatio="none"><path d="M2 7C40 3 100 1 198 5" stroke="#2A7C7C" stroke-width="3" stroke-linecap="round"/></svg></span>
    </div>
    <p style="font-size:13px; color:#555; margin-top:8px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Help more families find <span style="font-weight:700; color:#111;">${escapeHtml(providerName)}</span>.</p>
    <!-- Divider -->
    <div style="height:1px; background:#e0e0e0; margin-top:10px;"></div>
    <!-- Feature 1 -->
    <div style="margin-top:12px; position:relative; padding-left:40px; min-height:32px;">
      <div style="width:32px; height:32px; border-radius:50%; background:#EDF7F6; position:absolute; top:0; left:0;"></div>
      <svg style="position:absolute; top:5px; left:5px;" width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="9" cy="7" r="3" stroke="#2A7C7C" stroke-width="1.5"/>
        <circle cx="16" cy="8" r="2.5" stroke="#2A7C7C" stroke-width="1.5"/>
        <path d="M2 20c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="#2A7C7C" stroke-width="1.5" stroke-linecap="round"/>
        <path d="M16 14c2.761 0 5 1.79 5 4" stroke="#2A7C7C" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
      <p style="font-size:11px; color:#111; line-height:1.4; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; padding-top:4px;">A free referral platform that connects<br>families with trusted senior care providers.</p>
    </div>
    <!-- Feature 2 -->
    <div style="margin-top:8px; position:relative; padding-left:40px; min-height:32px;">
      <div style="width:32px; height:32px; border-radius:50%; background:#EDF7F6; position:absolute; top:0; left:0;"></div>
      <span style="position:absolute; top:6px; left:10px; color:#2A7C7C; font-size:14px; font-weight:700; font-family:-apple-system,sans-serif;">$</span>
      <p style="font-size:11px; font-weight:700; color:#111; line-height:1.4; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; padding-top:8px;">No referral fees &middot; No cost per lead</p>
    </div>
  </div>

  <!-- QR code block (right side, vertically centered in bottom half) -->
  <div style="position:absolute; top:2.05in; right:0.5in; text-align:center;">
    <div style="border:2px solid #2A7C7C; border-radius:8px; padding:8px; display:inline-block; background:#fff;">
      <img src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrUrl)}" width="110" height="110" style="display:block;" />
    </div>
    <p style="font-size:11px; font-weight:700; color:#111; margin-top:6px; font-family:-apple-system,sans-serif;">Manage your free profile</p>
    <p style="font-size:8px; color:#888; margin-top:2px; font-family:-apple-system,sans-serif;">Scan the QR code to get started.</p>
  </div>
</body>
</html>`;
}

/**
 * Build the postcard back HTML (6x4 inches).
 */
function buildBackHtml(providerName: string): string {
  const headshotUrl = "https://olera.care/images/for-providers/team/logan.jpg";
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    @page { size: 6in 4in; margin: 0; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 6in; height: 4in;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #fff;
      overflow: hidden;
    }
  </style>
</head>
<body>
  <!--
    Single container in the left half. Normal document flow inside
    so text wraps naturally without overlapping. PostGrid renders
    its own address block on the right ~3in.
  -->
  <div style="position:absolute; top:0.25in; left:0.3in; width:2.7in; bottom:0.2in;">
    <p style="font-size:9.5px; color:#444; line-height:1.5; margin-bottom:6px;">Dear ${escapeHtml(providerName)},</p>
    <p style="font-size:9.5px; color:#444; line-height:1.5; margin-bottom:6px;">I'm Dr. Logan DuBose, a physician and co-founder of Olera.</p>
    <p style="font-size:9.5px; color:#444; line-height:1.5; margin-bottom:6px;">We created Olera, a free referral platform that helps families find trusted senior care. We're proud to be supported by NIH as we build a better way for families and providers to connect.</p>
    <p style="font-size:9.5px; color:#444; line-height:1.5; margin-bottom:6px;">We've already created a free profile for <span style="font-weight:600;">${escapeHtml(providerName)}</span>. It's ready for your team to manage.</p>
    <p style="font-size:9.5px; color:#444; line-height:1.5; margin-bottom:4px;">Get started in under two minutes to:</p>
    <p style="font-size:9.5px; color:#444; line-height:1.5; margin-bottom:2px; padding-left:8px;">&bull; Have families contact you directly</p>
    <p style="font-size:9.5px; color:#444; line-height:1.5; margin-bottom:2px; padding-left:8px;">&bull; Never pay referral or per-lead fees</p>
    <p style="font-size:9.5px; color:#444; line-height:1.5; margin-bottom:6px; padding-left:8px;">&bull; Improve your online visibility</p>
    <p style="font-size:9.5px; color:#444; line-height:1.5; margin-bottom:4px;">Scan the QR code to get started.</p>
    <p style="font-size:9.5px; color:#444; line-height:1.5; margin-bottom:8px;">Questions? Give us a call at (979) 243-9801.</p>
    <!-- Signature -->
    <table cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="vertical-align:top; padding-right:8px;">
          <img src="${headshotUrl}" width="34" height="34" style="border-radius:50%; display:block;" />
        </td>
        <td style="vertical-align:top;">
          <p style="font-size:7px; color:#888; font-style:italic;">With care,</p>
          <p style="font-size:9px; font-weight:700; color:#111; margin-top:1px;">Dr. Logan DuBose, MD, MBA</p>
          <p style="font-size:7px; color:#666; margin-top:1px;">Chief Research Officer (CRO), Olera</p>
          <p style="font-size:6px; color:#888; margin-top:1px;">Researcher funded by the NIH SBIR Program</p>
          <p style="font-size:6px; color:#888;">Texas A&amp;M College of Medicine, Class of 2022</p>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Parse a freeform US address string into PostGrid address components.
 * Handles many formats:
 *   "123 Main St, City, ST 12345"
 *   "123 Main St, Suite 200, City, ST 12345-6789"
 *   "123 Main St, City, ST 12345, USA"
 *   "123 Main St City, ST 12345"
 */
function parseAddress(raw: string): {
  addressLine1: string;
  city: string;
  provinceOrState: string;
  postalOrZip: string;
} | null {
  // Strip trailing country (", US" / ", USA" / ", United States")
  const cleaned = raw.replace(/,?\s*(?:US|USA|United States)\s*$/i, "").trim();

  // Try: ... City, ST ZIP at the end (with comma separating street from city)
  const match = cleaned.match(
    /^(.+?),\s*([A-Za-z\s]+),\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/
  );
  if (match) {
    return {
      addressLine1: match[1].trim(),
      city: match[2].trim(),
      provinceOrState: match[3],
      postalOrZip: match[4],
    };
  }

  // Fallback: try without the comma before city
  const match2 = cleaned.match(
    /^(.+?)\s+([A-Za-z\s]+),\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/
  );
  if (match2) {
    return {
      addressLine1: match2[1].trim(),
      city: match2[2].trim(),
      provinceOrState: match2[3],
      postalOrZip: match2[4],
    };
  }

  return null;
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

    const body = (await request.json()) as {
      provider_id?: string;
      address?: string;
    };
    const providerId = body.provider_id?.trim();
    const rawAddress = body.address?.trim();

    if (!providerId) {
      return NextResponse.json(
        { error: "provider_id is required" },
        { status: 400 },
      );
    }

    if (!rawAddress) {
      return NextResponse.json(
        { error: "address is required" },
        { status: 400 },
      );
    }

    // Check env
    const apiKey = process.env.POSTGRID_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "PostGrid is not configured. Set POSTGRID_API_KEY.", missing_config: true },
        { status: 503 },
      );
    }

    const db = getServiceClient();

    // Fetch provider details
    const { data: provider } = await db
      .from("olera-providers")
      .select("provider_id, provider_name, slug")
      .eq("provider_id", providerId)
      .maybeSingle();

    const providerName = provider?.provider_name || "Provider";
    const providerSlug = provider?.slug || "";

    // Build QR URL with UTM tracking
    const qrUrl = providerSlug
      ? `https://olera.care/provider/${providerSlug}?utm_source=direct_mail&utm_medium=postcard&utm_campaign=re_engage`
      : "https://olera.care";

    // Parse address into components, or fall back to freeform
    const parsed = parseAddress(rawAddress);

    // Build HTML
    const frontHtml = buildFrontHtml(providerName, qrUrl);
    const backHtml = buildBackHtml(providerName);

    // Build "to" address — structured if we can parse, freeform otherwise
    const toAddress = parsed
      ? {
          firstName: providerName,
          lastName: "",
          companyName: providerName,
          addressLine1: parsed.addressLine1,
          city: parsed.city,
          provinceOrState: parsed.provinceOrState,
          postalOrZip: parsed.postalOrZip,
          country: "US",
        }
      : {
          firstName: providerName,
          lastName: "",
          companyName: providerName,
          addressText: rawAddress,
          country: "US",
        };

    // Call PostGrid API
    const pgRes = await fetch(POSTGRID_API_URL, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        size: "6x4",
        frontHTML: frontHtml,
        backHTML: backHtml,
        to: toAddress,
        from: FROM_ADDRESS,
        description: `Olera outreach postcard for ${providerName}`,
        metadata: {
          provider_id: providerId,
          slug: providerSlug,
          source: "olera_re_engagement",
        },
      }),
    });

    if (!pgRes.ok) {
      const errBody = await pgRes.text();
      console.error("[send-mailer] PostGrid error:", pgRes.status, errBody);
      return NextResponse.json(
        { error: "PostGrid postcard send failed", detail: errBody },
        { status: 502 },
      );
    }

    const pgData = await pgRes.json();
    const postcardId = pgData?.id || null;
    const postcardStatus = pgData?.status || "draft";

    // Write send record to tracking table
    const { error: updateError } = await db
      .from("provider_outreach_tracking")
      .update({
        mail_sent_at: new Date().toISOString(),
        mail_postgrid_id: postcardId,
        mail_status: postcardStatus,
        mail_sent_by: user.id,
      })
      .eq("provider_id", providerId);

    if (updateError) {
      console.error("[send-mailer] Failed to update tracking:", updateError);
      // Don't fail -- postcard was already sent
    }

    return NextResponse.json({
      success: true,
      postcard_id: postcardId,
      status: postcardStatus,
      provider_name: providerName,
    });
  } catch (e) {
    console.error("[send-mailer] Error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to send postcard" },
      { status: 500 },
    );
  }
}
