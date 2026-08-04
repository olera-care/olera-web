import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";

/**
 * GET /api/admin/provider-outreach/fax-pdf?provider_id=...
 *
 * Renders the fax one-pager as an HTML page that Telnyx fetches and
 * converts to a fax-compatible image. This must be publicly accessible
 * (no auth) because Telnyx fetches it server-side.
 *
 * The HTML matches the FaxPreviewSidebar in the re-engagement page.
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
  const providerId = request.nextUrl.searchParams.get("provider_id");

  if (!providerId) {
    return new NextResponse("provider_id is required", { status: 400 });
  }

  const db = getServiceClient();

  const { data: provider } = await db
    .from("olera-providers")
    .select("provider_id, provider_name, slug")
    .eq("provider_id", providerId)
    .maybeSingle();

  const providerName = escapeHtml(provider?.provider_name || "Provider");
  const providerSlug = provider?.slug || "";

  const qrUrl = providerSlug
    ? `https://olera.care/provider/${providerSlug}?utm_source=fax&utm_medium=qr&utm_campaign=re_engage`
    : "https://olera.care";

  const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrUrl)}`;
  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const logoUrl = "https://olera.care/images/olera-logo.png";
  const headshotUrl = "https://olera.care/images/for-providers/team/logan.jpg";

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    @page { size: 8.5in 11in; margin: 0; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 8.5in;
      height: 11in;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      color: #1f2937;
      background: #fff;
      padding: 0.6in 0.7in;
      display: flex;
      flex-direction: column;
    }
    .header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding-bottom: 8px;
      border-bottom: 1px solid #d1d5db;
      margin-bottom: 12px;
    }
    .header img { height: 32px; }
    .header-text { font-size: 10px; color: #6b7280; line-height: 1.4; }
    .header-text .company { font-weight: 600; color: #374151; }

    .cover-row {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    .cover-fields {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0 24px;
      font-size: 9px;
      color: #4b5563;
      line-height: 1.8;
    }
    .cover-fields .label { font-weight: 600; color: #1f2937; }
    .qr-block { text-align: center; flex-shrink: 0; }
    .qr-block img { width: 90px; height: 90px; border: 1px solid #e5e7eb; border-radius: 4px; }
    .qr-block p { font-size: 8px; font-weight: 500; color: #4b5563; margin-top: 3px; }

    .optout {
      border: 1px solid #d1d5db;
      background: #f9fafb;
      border-radius: 4px;
      padding: 6px 12px;
      margin-bottom: 14px;
      font-size: 8px;
      color: #4b5563;
      line-height: 1.5;
    }
    .optout .title { font-weight: 600; color: #374151; margin-bottom: 2px; }
    .optout .bold { font-weight: 500; color: #1f2937; }

    .letter { font-size: 12px; line-height: 1.7; flex: 1; }
    .letter p { margin-bottom: 14px; }
    .letter ul { list-style: none; margin-bottom: 14px; padding-left: 4px; }
    .letter ul li { margin-bottom: 6px; }
    .letter ul li::before { content: "\\2713"; font-weight: 700; margin-right: 8px; }

    .signature {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      margin-top: 16px;
    }
    .signature img {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      object-fit: cover;
      filter: grayscale(100%);
    }
    .sig-text { line-height: 1.5; }
    .sig-text .care { font-size: 12px; color: #6b7280; font-style: italic; }
    .sig-text .name { font-size: 13px; font-weight: 700; color: #111827; margin-top: 2px; }
    .sig-text .title-line { font-size: 11px; color: #4b5563; }
    .sig-text .detail { font-size: 10px; color: #6b7280; }

    .footer {
      margin-top: auto;
      padding-top: 10px;
      border-top: 1px solid #e5e7eb;
      font-size: 8px;
      color: #9ca3af;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    <img src="${logoUrl}" alt="Olera" />
    <div class="header-text">
      <p class="company">Olera Care</p>
      <p>(833) 653-7200 &middot; olera.care</p>
    </div>
  </div>

  <!-- Cover fields + QR -->
  <div class="cover-row">
    <div class="cover-fields">
      <p><span class="label">To:</span> ${providerName}</p>
      <p><span class="label">From:</span> Dr. Logan DuBose, Olera</p>
      <p><span class="label">Subject:</span> Your free Olera profile</p>
      <p><span class="label">Attn:</span> Administrator / Executive Director</p>
      <p><span class="label">Date:</span> ${today}</p>
    </div>
    <div class="qr-block">
      <img src="${qrImgUrl}" alt="QR Code" />
      <p>Scan to manage your page</p>
    </div>
  </div>

  <!-- Opt-out notice -->
  <div class="optout">
    <p class="title">OPT-OUT NOTICE</p>
    <p>
      To stop receiving faxes from Olera, call <span class="bold">(833) 653-7200</span> or
      send a fax to <span class="bold">(833) 653-7201</span> at any time, any day of the week.
      Requests are accepted 24 hours a day at no cost to you.
    </p>
  </div>

  <!-- Letter body -->
  <div class="letter">
    <p>Dear ${providerName},</p>
    <p>I'm Dr. Logan DuBose, a physician and co-founder of Olera.</p>
    <p>We created Olera, a free referral platform that helps families find trusted senior care. We're proud to be supported by NIH as we build a better solution for families and providers to connect.</p>
    <p>We've already created a profile for ${providerName} using publicly available information, and it's ready for your team to manage.</p>
    <p>Get started in less than two minutes and you'll be able to:</p>
    <ul>
      <li>Have families contact you directly</li>
      <li>Never pay referral fees or per-lead charges</li>
      <li>Improve your online visibility</li>
    </ul>
    <p>Scan the QR code above to take ownership of your page.</p>
    <p>If you have any questions or would like to schedule a quick call, I'd be happy to help.</p>

    <!-- Signature -->
    <div class="signature">
      <img src="${headshotUrl}" alt="Dr. Logan DuBose" />
      <div class="sig-text">
        <p class="care">With care,</p>
        <p class="name">Dr. Logan DuBose, MD, MBA</p>
        <p class="title-line">Chief Research Officer (CRO), Olera</p>
        <p class="detail">Researcher funded by the NIH Small Business Innovation Research (SBIR) Program</p>
        <p class="detail">Texas A&amp;M College of Medicine, Class of 2022</p>
      </div>
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    <p>Olera Care, Inc. &middot; (833) 653-7200 &middot; olera.care</p>
    <p>To stop receiving faxes, call (833) 653-7200 or fax (833) 653-7201 at any time, any day. Requests accepted 24/7 at no cost.</p>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
