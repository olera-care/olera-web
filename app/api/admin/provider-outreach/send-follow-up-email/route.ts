import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser } from "@/lib/admin";
import { sendEmail } from "@/lib/email";
import { generateClaimToken } from "@/lib/claim-tokens";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/admin/provider-outreach/send-follow-up-email
 *
 * Sends a follow-up email after logging a call outcome.
 * Uses the same Resend infrastructure as MedJobs.
 * Footer matches MedJobs: Logan + Graize signature blocks.
 *
 * Body: {
 *   provider_id: string,
 *   provider_name: string,
 *   to: string,           // recipient email
 *   subject: string,
 *   body: string,          // plain text body (converted to HTML)
 *   outcome: string,       // call outcome key
 *   caller_name?: string,  // defaults to "Chantel"
 * }
 */

const BRAND_COLOR = "#198087";
const FONT_STACK =
  "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://olera.care";

const LOGAN_PHOTO_URL =
  process.env.STUDENT_OUTREACH_LOGAN_PHOTO_URL ??
  "https://ocaabzfiiikjcgqwhbwr.supabase.co/storage/v1/object/public/content-images/team/logan.jpg";
const GRAZIE_PHOTO_URL =
  process.env.STUDENT_OUTREACH_GRAZIE_PHOTO_URL ??
  "https://ocaabzfiiikjcgqwhbwr.supabase.co/storage/v1/object/public/content-images/team/grazie.png";
const CALENDLY_URL = "https://calendly.com/logan-olera/30min";

function loganSignatureHtml(): string {
  return `
<table cellpadding="0" cellspacing="0" style="margin-top:16px;">
  <tr>
    <td style="vertical-align:top;padding-right:16px;">
      <img src="${LOGAN_PHOTO_URL}" alt="Dr. Logan DuBose" width="100" height="100" style="border-radius:8px;display:block;" />
    </td>
    <td style="vertical-align:top;font-size:13px;line-height:1.5;color:#374151;font-family:${FONT_STACK};">
      <p style="margin:0 0 4px;font-weight:600;color:#111827;">Dr. Logan DuBose, MD, MBA</p>
      <p style="margin:0 0 2px;">Chief Research Officer (CRO), <a href="https://www.olera.care" style="color:#059669;">Olera</a></p>
      <p style="margin:0 0 2px;">Researcher funded by the National Institutes of Health Small Business Innovation Research (SBIR) Program</p>
      <p style="margin:0 0 2px;">Texas A&amp;M College of Medicine, Class of 2022</p>
      <p style="margin:0 0 8px;">General Practitioner, Fredericksburg Christian Health Clinic, Virginia</p>
      <p style="margin:0;">
        <a href="${CALENDLY_URL}" style="color:#059669;font-weight:500;">Schedule a meeting with Dr. DuBose &rarr;</a>
      </p>
    </td>
  </tr>
</table>`;
}

function grazieSignatureHtml(): string {
  return `
<table cellpadding="0" cellspacing="0" style="margin-top:6px;">
  <tr>
    <td style="vertical-align:top;padding-right:16px;">
      <img src="${GRAZIE_PHOTO_URL}" alt="Graize Belandres" width="100" height="100" style="border-radius:8px;display:block;" />
    </td>
    <td style="vertical-align:top;font-size:13px;line-height:1.5;color:#374151;font-family:${FONT_STACK};">
      <p style="margin:0 0 4px;font-weight:600;color:#111827;">Graize Belandres</p>
      <p style="margin:0 0 2px;">Assistant to Dr. Logan DuBose</p>
    </td>
  </tr>
</table>`;
}

function footerHtml(): string {
  return [
    // Warm sign-off + Graize block
    `<p style="margin:16px 0 4px;font-size:13px;line-height:1.5;color:#374151;font-family:${FONT_STACK};">Best,</p>`,
    `<p style="margin:0;font-size:13px;line-height:1.5;color:#374151;font-family:${FONT_STACK};">Graize</p>`,
    grazieSignatureHtml(),
    // Divider
    `<hr style="margin:20px 0;border:none;border-top:1px solid #e5e7eb;" />`,
    // Approved-by + Logan block
    `<p style="margin:0 0 8px;font-size:12px;line-height:1.5;color:#6b7280;font-family:${FONT_STACK};">Message Approved by Dr. Logan DuBose, MD/MBA</p>`,
    loganSignatureHtml(),
  ].join("\n");
}

function buildHtml(opts: {
  subject: string;
  body: string;
  providerName: string;
  outcome: string;
  providerId: string;
  claimUrl: string;
  pageUrl: string;
}): string {
  // Convert plain text body to HTML paragraphs
  const bodyHtml = opts.body
    .split("\n\n")
    .map((para) => {
      // Detect CTA lines and render as buttons with magic link URLs
      if (para.includes("[Set your password")) {
        return `<p style="margin:0 0 16px;text-align:left;">
          <a href="${opts.claimUrl}" style="display:inline-block;padding:12px 24px;background:${BRAND_COLOR};color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;">Set your password &rarr;</a>
        </p>`;
      }
      if (para.includes("[See your page")) {
        return `<p style="margin:0 0 16px;text-align:left;">
          <a href="${opts.pageUrl}" style="display:inline-block;padding:12px 24px;background:${BRAND_COLOR};color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;">See your page &rarr;</a>
        </p>`;
      }
      // Check if this paragraph contains arrow list items
      const lines = para.split("\n");
      const hasArrowItems = lines.some((l) => l.startsWith("→ "));
      if (hasArrowItems) {
        // Split into intro line + list items
        const intro = lines.filter((l) => !l.startsWith("→ "));
        const items = lines.filter((l) => l.startsWith("→ ")).map((l) => l.slice(2));
        let html = "";
        if (intro.length > 0 && intro[0].trim()) {
          html += `<p style="font-size:14px;color:#374151;line-height:1.6;margin:0 0 8px;">${intro.join("<br>").replace(/\[number\]/g, "(914) 200-0000")}</p>`;
        }
        html += `<table cellpadding="0" cellspacing="0" style="margin:0 0 16px;">`;
        for (const item of items) {
          html += `<tr>
            <td style="vertical-align:top;padding:2px 8px 2px 0;font-size:14px;color:${BRAND_COLOR};">&rarr;</td>
            <td style="vertical-align:top;padding:2px 0;font-size:14px;color:#374151;line-height:1.6;">${item.replace(/\[number\]/g, "(914) 200-0000")}</td>
          </tr>`;
        }
        html += `</table>`;
        return html;
      }
      // Regular paragraph
      const escaped = para
        .replace(/\n/g, "<br>")
        .replace(/\[number\]/g, "(914) 200-0000");
      return `<p style="font-size:14px;color:#374151;line-height:1.6;margin:0 0 16px;">${escaped}</p>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:${FONT_STACK};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 0;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:480px;width:100%;">
        <tr><td style="padding:24px 32px 16px;">
          <span style="font-size:18px;font-weight:700;color:${BRAND_COLOR};letter-spacing:-0.3px;">Olera</span>
        </td></tr>
        <tr><td style="padding:0 32px 32px;">
          ${bodyHtml}
          ${footerHtml()}
        </td></tr>
        <tr><td style="padding:16px 32px;border-top:1px solid #f3f4f6;">
          <p style="font-size:12px;color:#9ca3af;margin:0;">
            &copy; ${new Date().getFullYear()} Olera &middot;
            <a href="${BASE_URL}" style="color:#9ca3af;">olera.care</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await getAdminUser(user.id);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { provider_id, provider_name, to, subject, body: emailBody, outcome } = body;

  if (!provider_id || !to || !subject || !emailBody) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Look up provider slug for magic link URLs
  const supabase = await createClient();
  const { data: providerRow } = await supabase
    .from("business_profiles")
    .select("slug")
    .eq("id", provider_id)
    .single();
  const slug = providerRow?.slug || provider_id;

  // Generate magic link URLs using claim tokens (72h expiry, HMAC-signed)
  const token = generateClaimToken(provider_id, to);
  const claimUrl = `${BASE_URL}/provider/${slug}/onboard?action=campaign&otk=${token}`;
  const pageUrl = `${BASE_URL}/provider/${slug}/onboard?action=manage&otk=${token}`;

  const html = buildHtml({
    subject,
    body: emailBody,
    providerName: provider_name || "Provider",
    outcome: outcome || "unknown",
    providerId: provider_id,
    claimUrl,
    pageUrl,
  });

  const emailType =
    outcome === "claimed"
      ? "provider_claimed_welcome"
      : outcome === "not_interested"
        ? "provider_removal_confirmation"
        : "provider_outreach_follow_up";

  const result = await sendEmail({
    to,
    subject,
    html,
    emailType,
    recipientType: "provider",
    providerId: provider_id,
    metadata: { outcome, provider_name },
  });

  if (!result.success) {
    return NextResponse.json(
      { error: result.error || "Send failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    emailLogId: result.emailLogId,
    skipped: result.skipped,
  });
}
