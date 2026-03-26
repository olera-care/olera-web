/**
 * Email Template: reviewRequestEmail
 *
 * This function should be added to lib/email-templates.tsx
 *
 * Dependencies:
 * - layout() function from email-templates.tsx
 * - button() function from email-templates.tsx
 * - firstName() helper from email-templates.tsx
 * - BRAND_COLOR constant from email-templates.tsx
 */

// Add this to lib/email-templates.tsx:

/** Email sent to clients requesting they leave a review for a provider */
export function reviewRequestEmail(opts: {
  clientName: string;
  providerName: string;
  customMessage: string;
  reviewUrl: string;
}): string {
  // Note: This uses the layout(), button(), firstName(), and BRAND_COLOR
  // from the email-templates.tsx file
  return layout(`
    <h1 style="font-size:22px;font-weight:700;color:#111827;margin:0 0 8px;">${opts.providerName} would love your feedback</h1>
    <p style="font-size:15px;color:#6b7280;margin:0 0 20px;line-height:1.5;">
      Hi ${firstName(opts.clientName)},
    </p>
    <div style="background:#f9fafb;border-left:3px solid ${BRAND_COLOR};padding:16px 20px;margin:0 0 24px;border-radius:0 8px 8px 0;">
      <p style="font-size:14px;color:#374151;margin:0;line-height:1.6;white-space:pre-wrap;">${opts.customMessage}</p>
    </div>
    <p style="font-size:14px;color:#6b7280;margin:0 0 24px;line-height:1.5;">
      Sharing your experience helps other families find quality care — and only takes a couple of minutes.
    </p>
    <div>${button("Write a review", opts.reviewUrl)}</div>
    <p style="font-size:12px;color:#9ca3af;margin:24px 0 0;line-height:1.5;">
      This email was sent on behalf of ${opts.providerName} via Olera.
    </p>
  `);
}

// Placeholder types for reference - these exist in email-templates.tsx
declare function layout(content: string): string;
declare function button(text: string, url: string): string;
declare function firstName(name: string): string;
declare const BRAND_COLOR: string;
