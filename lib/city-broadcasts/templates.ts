/**
 * City Broadcasts - Email Templates
 *
 * Two email templates for city broadcasts:
 * 1. Question broadcast: "A family in {city} is looking for {category} care"
 * 2. Profile broadcast: "A family just published their profile in {city}"
 *
 * Uses polishedLayout() from provider-outreach for consistent Olera branding.
 * Uses generateClaimUrl() for one-click claiming with signed tokens.
 */

import { polishedLayout } from "@/lib/provider-outreach/email-utils";
import { generateClaimUrl } from "@/lib/claim-tokens";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://olera.care";

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
 */
export function renderQuestionBroadcast(ctx: BroadcastTemplateContext): RenderedBroadcastEmail {
  const categoryLabel = ctx.category || "care";
  const subject = `A family in ${ctx.city} is looking for ${categoryLabel}`;
  const preheader = `Someone just asked a question about ${categoryLabel} in your area.`;

  // Use generateClaimUrl for one-click claiming with signed token
  const claimUrl = generateClaimUrl(ctx.providerId, ctx.providerSlug, ctx.providerEmail, BASE_URL);
  const profileUrl = `${BASE_URL}/provider/${ctx.providerSlug}`;
  const unsubscribeUrl = `${BASE_URL}/providers/unsubscribe?email=${encodeURIComponent(ctx.providerEmail)}&type=city_broadcast`;

  const bodyHtml = `
    <p style="font-size:15px;line-height:1.6;color:#374151;margin:0 0 16px;">
      Hi ${ctx.providerName},
    </p>
    <p style="font-size:15px;line-height:1.6;color:#374151;margin:0 0 16px;">
      A family in <strong>${ctx.city}</strong> just asked a question about ${categoryLabel} providers.
      ${ctx.questionText ? `They're asking: <em>"${truncateQuestion(ctx.questionText)}"</em>` : ""}
    </p>
    <p style="font-size:15px;line-height:1.6;color:#374151;margin:0 0 16px;">
      You're listed on Olera as a ${categoryLabel} provider in this area.
      <strong>Claim your free profile</strong> to answer questions directly and connect with families looking for care.
    </p>
    <table cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr>
        <td style="background:#198087;border-radius:8px;">
          <a href="${claimUrl}" style="display:inline-block;padding:14px 28px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">
            Claim your profile &rarr;
          </a>
        </td>
      </tr>
    </table>
    <p style="font-size:13px;line-height:1.5;color:#6b7280;margin:0;">
      It takes about 2 minutes. Once verified, you can respond to families directly.
    </p>
  `.trim();

  const footerHtml = buildFooter(profileUrl, unsubscribeUrl);
  const html = polishedLayout(bodyHtml, footerHtml, {
    preheader,
    categoryLabel: "FAMILIES IN YOUR AREA",
  });

  return { subject, preheader, html };
}

/**
 * Render the profile broadcast email.
 * Sent when a family publishes their care-seeker profile in a city.
 */
export function renderProfileBroadcast(ctx: BroadcastTemplateContext): RenderedBroadcastEmail {
  const subject = `A family just published their profile in ${ctx.city}`;
  const preheader = `Someone in your area is actively looking for care.`;

  // Use generateClaimUrl for one-click claiming with signed token
  const claimUrl = generateClaimUrl(ctx.providerId, ctx.providerSlug, ctx.providerEmail, BASE_URL);
  const profileUrl = `${BASE_URL}/provider/${ctx.providerSlug}`;
  const unsubscribeUrl = `${BASE_URL}/providers/unsubscribe?email=${encodeURIComponent(ctx.providerEmail)}&type=city_broadcast`;

  const bodyHtml = `
    <p style="font-size:15px;line-height:1.6;color:#374151;margin:0 0 16px;">
      Hi ${ctx.providerName},
    </p>
    <p style="font-size:15px;line-height:1.6;color:#374151;margin:0 0 16px;">
      A family in <strong>${ctx.city}</strong> just published their care profile on Olera.
      They're actively searching for providers in your area.
    </p>
    <p style="font-size:15px;line-height:1.6;color:#374151;margin:0 0 16px;">
      You're listed as a provider nearby. <strong>Claim your free profile</strong> to show up
      in their search results and let them reach out to you directly.
    </p>
    <table cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr>
        <td style="background:#198087;border-radius:8px;">
          <a href="${claimUrl}" style="display:inline-block;padding:14px 28px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">
            Claim your profile &rarr;
          </a>
        </td>
      </tr>
    </table>
    <p style="font-size:13px;line-height:1.5;color:#6b7280;margin:0;">
      It takes about 2 minutes. Once verified, families can find and contact you.
    </p>
  `.trim();

  const footerHtml = buildFooter(profileUrl, unsubscribeUrl);
  const html = polishedLayout(bodyHtml, footerHtml, {
    preheader,
    categoryLabel: "FAMILIES IN YOUR AREA",
  });

  return { subject, preheader, html };
}

/**
 * Build the email footer with profile link and unsubscribe.
 */
function buildFooter(profileUrl: string, unsubscribeUrl: string): string {
  return `
    <div style="margin-top:24px;padding-top:16px;border-top:1px solid #f3f4f6;">
      <p style="font-size:12px;color:#6b7280;margin:0 0 8px;">
        Questions? Just reply - it goes straight to our team.
      </p>
      <p style="font-size:12px;color:#9ca3af;margin:0;">
        <a href="${profileUrl}" style="color:#9ca3af;text-decoration:underline;">View your listing</a>
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
