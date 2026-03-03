/**
 * Olera email templates — plain HTML strings with inline styles.
 * Each template returns an HTML string ready for `sendEmail({ html })`.
 *
 * Design: clean, minimal, system font stack. Matches Olera brand colors.
 */

const BRAND_COLOR = "#198087";
const FONT_STACK =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://olera.care";

// ── Layout helpers ──────────────────────────────────────────────

function layout(body: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:${FONT_STACK};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 0;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:480px;width:100%;">
        <!-- Header -->
        <tr><td style="padding:24px 32px 16px;">
          <span style="font-size:18px;font-weight:700;color:${BRAND_COLOR};letter-spacing:-0.3px;">Olera</span>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:0 32px 32px;">
          ${body}
        </td></tr>
        <!-- Footer -->
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

function button(label: string, href: string): string {
  return `<a href="${href}" style="display:inline-block;padding:12px 24px;background:${BRAND_COLOR};color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;">${label}</a>`;
}

// ── Templates ───────────────────────────────────────────────────

/** Verification code email for provider claims (existing flow) */
export function verificationCodeEmail(
  providerName: string,
  code: string
): string {
  return layout(`
    <h1 style="font-size:22px;font-weight:700;color:#111827;margin:0 0 8px;">Verify your organization</h1>
    <p style="font-size:15px;color:#6b7280;margin:0 0 24px;line-height:1.5;">
      Someone is trying to claim the page for <strong>${providerName}</strong> on Olera.
      Use this code to complete verification:
    </p>
    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:24px;text-align:center;margin:0 0 24px;">
      <span style="font-size:32px;font-weight:700;letter-spacing:6px;color:#111827;">${code}</span>
    </div>
    <p style="font-size:13px;color:#9ca3af;margin:0;">
      This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.
    </p>
  `);
}

/** Email to provider when a family sends a connection request */
export function connectionRequestEmail(opts: {
  providerName: string;
  familyName: string;
  careType: string | null;
  message: string | null;
  viewUrl: string;
}): string {
  const careLine = opts.careType
    ? `<p style="font-size:14px;color:#6b7280;margin:0 0 8px;"><strong>Care type:</strong> ${opts.careType}</p>`
    : "";
  const messageLine = opts.message
    ? `<div style="background:#f9fafb;border-left:3px solid ${BRAND_COLOR};padding:12px 16px;margin:0 0 24px;border-radius:0 8px 8px 0;">
        <p style="font-size:14px;color:#374151;margin:0;line-height:1.5;">${opts.message}</p>
      </div>`
    : "";

  return layout(`
    <h1 style="font-size:22px;font-weight:700;color:#111827;margin:0 0 8px;">New care inquiry</h1>
    <p style="font-size:15px;color:#6b7280;margin:0 0 20px;line-height:1.5;">
      <strong>${opts.familyName}</strong> is looking for care and reached out to <strong>${opts.providerName}</strong> on Olera.
    </p>
    ${careLine}
    ${messageLine}
    <div style="margin:24px 0 0;">${button("View request", opts.viewUrl)}</div>
  `);
}

/** Email to family when a provider responds (accept/decline) */
export function connectionResponseEmail(opts: {
  familyName: string;
  providerName: string;
  accepted: boolean;
  viewUrl: string;
}): string {
  const statusText = opts.accepted
    ? `Great news — <strong>${opts.providerName}</strong> has accepted your care inquiry.`
    : `<strong>${opts.providerName}</strong> is unable to take on new clients at this time.`;

  const ctaLabel = opts.accepted ? "View conversation" : "Browse other providers";
  const ctaUrl = opts.accepted ? opts.viewUrl : `${BASE_URL}/browse`;

  return layout(`
    <h1 style="font-size:22px;font-weight:700;color:#111827;margin:0 0 8px;">Update on your inquiry</h1>
    <p style="font-size:15px;color:#6b7280;margin:0 0 24px;line-height:1.5;">
      Hi ${opts.familyName}, ${statusText}
    </p>
    <div>${button(ctaLabel, ctaUrl)}</div>
  `);
}

/** Email when a new message is sent in a connection thread */
export function newMessageEmail(opts: {
  recipientName: string;
  senderName: string;
  messagePreview: string;
  viewUrl: string;
}): string {
  return layout(`
    <h1 style="font-size:22px;font-weight:700;color:#111827;margin:0 0 8px;">New message</h1>
    <p style="font-size:15px;color:#6b7280;margin:0 0 20px;line-height:1.5;">
      <strong>${opts.senderName}</strong> sent you a message on Olera.
    </p>
    <div style="background:#f9fafb;border-left:3px solid ${BRAND_COLOR};padding:12px 16px;margin:0 0 24px;border-radius:0 8px 8px 0;">
      <p style="font-size:14px;color:#374151;margin:0;line-height:1.5;">${opts.messagePreview}</p>
    </div>
    <div>${button("Reply", opts.viewUrl)}</div>
  `);
}

/** Email to admin when a provider claims their page */
export function claimNotificationEmail(opts: {
  providerName: string;
  providerSlug: string;
  claimedByEmail: string;
}): string {
  return layout(`
    <h1 style="font-size:22px;font-weight:700;color:#111827;margin:0 0 8px;">Provider claimed</h1>
    <p style="font-size:15px;color:#6b7280;margin:0 0 8px;line-height:1.5;">
      <strong>${opts.providerName}</strong> was just claimed on Olera.
    </p>
    <p style="font-size:14px;color:#6b7280;margin:0 0 24px;">
      <strong>Claimed by:</strong> ${opts.claimedByEmail}
    </p>
    <div>${button("View listing", `${BASE_URL}/provider/${opts.providerSlug}`)}</div>
  `);
}
