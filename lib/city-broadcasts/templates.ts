/**
 * City Broadcasts - Email Templates
 *
 * Two email templates for city broadcasts:
 * 1. Question broadcast: "A family has a question about {category} in {city}"
 * 2. Profile broadcast: "A family just published their profile in {city}"
 *
 * These templates are designed to match the high-converting questionReceivedEmail
 * pattern - making providers feel like they have a question to answer, not just
 * a profile to claim.
 *
 * Uses polishedLayout() from provider-outreach for consistent Olera branding.
 * Uses generateClaimUrl() for one-click claiming with signed tokens.
 */

import { polishedLayout } from "@/lib/provider-outreach/email-utils";
import { generateClaimUrl } from "@/lib/claim-tokens";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://olera.care";

/**
 * Trust introduction matching the direct question email.
 * Establishes credibility (NIH-backed) before asking for action.
 */
function trustIntro(): string {
  return `<p style="font-size:14px;color:#6b7280;margin:0 0 20px;line-height:1.6;">Olera is an NIH-backed platform helping families find quality senior care providers like you. Families in your area are actively researching care options.</p>`;
}

export interface BroadcastTemplateContext {
  providerId: string;
  providerName: string;
  providerSlug: string;
  providerEmail: string;
  city: string;
  category?: string | null;
  /** For question broadcasts: the actual question text */
  questionText?: string;
}

export interface RenderedBroadcastEmail {
  subject: string;
  preheader: string;
  html: string;
}

/**
 * Render the question broadcast email.
 * Sent when a family asks a question in a city with dormant providers.
 *
 * Designed to match the high-converting questionReceivedEmail pattern:
 * - Same subject line structure ("A family has a question about...")
 * - Trust intro (NIH-backed)
 * - Question in styled box
 * - "View and respond" CTA (not "Claim your profile")
 */
export function renderQuestionBroadcast(ctx: BroadcastTemplateContext): RenderedBroadcastEmail {
  const categoryLabel = ctx.category || "care";
  const escapedCategory = escapeHtml(categoryLabel);
  const escapedCity = escapeHtml(ctx.city);

  // Match the direct question email subject pattern
  const subject = `A family has a question about ${categoryLabel} in ${ctx.city}`;
  const preheader = ctx.questionText
    ? `"${truncateQuestion(ctx.questionText, 60)}"`
    : `Someone is researching ${categoryLabel} options in your area.`;

  // Use generateClaimUrl for one-click claiming with signed token
  const claimUrl = generateClaimUrl(ctx.providerId, ctx.providerSlug, ctx.providerEmail, BASE_URL);
  const viewListingUrl = `${BASE_URL}/provider/${ctx.providerSlug}`;
  // Use slug-based unsubscribe URL with cold_outreach type (city broadcasts are cold outreach)
  const unsubscribeUrl = `${BASE_URL}/unsubscribe/${ctx.providerSlug}?type=cold_outreach`;

  // Build the question display - match the direct email styling
  // Only show "and asked:" if we have the actual question text
  const questionSection = ctx.questionText
    ? `
    <p style="font-size:15px;color:#374151;margin:0 0 16px;line-height:1.5;">
      A family is researching ${escapedCategory} options and asked:
    </p>
    <div style="background:#f9fafb;padding:16px;border-radius:12px;margin:0 0 16px;">
      <p style="font-size:15px;color:#111827;margin:0;line-height:1.5;font-style:italic;">&ldquo;${escapeHtml(ctx.questionText)}&rdquo;</p>
    </div>`
    : `
    <p style="font-size:15px;color:#374151;margin:0 0 16px;line-height:1.5;">
      A family is researching ${escapedCategory} options in your area and has questions.
    </p>`;

  const bodyHtml = `
    <h1 style="font-size:22px;font-weight:700;color:#111827;margin:0 0 8px;">A family has a question about ${escapedCategory} in ${escapedCity}</h1>
    ${trustIntro()}
    ${questionSection}
    <p style="font-size:14px;color:#6b7280;margin:0 0 24px;line-height:1.5;">
      You're listed as a ${escapedCategory} provider in ${escapedCity}. A thoughtful answer helps families see your expertise and builds trust with people actively looking for care.
    </p>
    <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
      <tr>
        <td style="background:#198087;border-radius:8px;">
          <a href="${claimUrl}" style="display:inline-block;padding:14px 28px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">
            View and respond &rarr;
          </a>
        </td>
      </tr>
    </table>
  `.trim();

  const footerHtml = buildFooter(viewListingUrl, unsubscribeUrl);
  const html = polishedLayout(bodyHtml, footerHtml, {
    preheader,
  });

  return { subject, preheader, html };
}

/**
 * HTML-escape text to prevent XSS in email content.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Render the profile broadcast email.
 * Sent when a family publishes their care-seeker profile in a city.
 *
 * Framed as "you're being considered" to create urgency - the provider
 * feels like they're already on someone's shortlist and need to respond.
 */
export function renderProfileBroadcast(ctx: BroadcastTemplateContext): RenderedBroadcastEmail {
  const categoryLabel = ctx.category || "care";
  const escapedCategory = escapeHtml(categoryLabel);
  const escapedCity = escapeHtml(ctx.city);

  const subject = `A family in ${ctx.city} added you to their list`;
  const preheader = `You're being considered by a family looking for ${categoryLabel}.`;

  // Use generateClaimUrl for one-click claiming with signed token
  const claimUrl = generateClaimUrl(ctx.providerId, ctx.providerSlug, ctx.providerEmail, BASE_URL);
  const viewListingUrl = `${BASE_URL}/provider/${ctx.providerSlug}`;
  // Use slug-based unsubscribe URL with cold_outreach type (city broadcasts are cold outreach)
  const unsubscribeUrl = `${BASE_URL}/unsubscribe/${ctx.providerSlug}?type=cold_outreach`;

  const bodyHtml = `
    <h1 style="font-size:22px;font-weight:700;color:#111827;margin:0 0 8px;">A family in ${escapedCity} added you to their list</h1>
    ${trustIntro()}
    <p style="font-size:15px;color:#374151;margin:0 0 16px;line-height:1.5;">
      A family looking for ${escapedCategory} is comparing providers in your area — and you're on their shortlist.
    </p>
    <p style="font-size:14px;color:#6b7280;margin:0 0 24px;line-height:1.5;">
      Introduce yourself and learn more about what they're looking for.
    </p>
    <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
      <tr>
        <td style="background:#198087;border-radius:8px;">
          <a href="${claimUrl}" style="display:inline-block;padding:14px 28px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">
            Connect with them &rarr;
          </a>
        </td>
      </tr>
    </table>
  `.trim();

  const footerHtml = buildFooter(viewListingUrl, unsubscribeUrl);
  const html = polishedLayout(bodyHtml, footerHtml, {
    preheader,
  });

  return { subject, preheader, html };
}

/**
 * Build the email footer with view listing link and unsubscribe.
 * Matches the offRampBlock pattern from questionReceivedEmail.
 */
function buildFooter(viewListingUrl: string, unsubscribeUrl: string): string {
  return `
    <div style="margin-top:24px;padding-top:16px;border-top:1px solid #f3f4f6;">
      <p style="font-size:13px;color:#9ca3af;margin:0 0 6px;line-height:1.5;">
        Not the right contact? Please forward this to the appropriate person on your team.
      </p>
      <p style="font-size:12px;color:#9ca3af;margin:0;">
        <a href="${viewListingUrl}" style="color:#9ca3af;text-decoration:underline;">View listing</a>
        &middot; <a href="${unsubscribeUrl}" style="color:#9ca3af;text-decoration:underline;">Unsubscribe</a>
      </p>
    </div>
  `.trim();
}

/**
 * Truncate question text for the email preview.
 */
function truncateQuestion(text: string, maxLen = 100): string {
  const cleaned = text.trim().replace(/\s+/g, " ");
  if (cleaned.length <= maxLen) return cleaned;
  return cleaned.slice(0, maxLen).trim() + "...";
}
