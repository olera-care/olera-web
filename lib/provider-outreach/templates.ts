/**
 * Provider Outreach Email Templates
 *
 * Cold outreach templates for unclaimed providers in the Olera directory.
 * Goal: get providers to claim their profile and add their contact information.
 *
 * Tone principles:
 *   - professional, direct, value-focused
 *   - no em-dashes
 *   - no marketing fluff
 *   - relationship-oriented, not transactional
 *
 * Structure:
 *   - Body is plain text with markdown markers:
 *       **text**       → <strong>text</strong> in HTML
 *       [label](url)   → <a href="url">label</a> in HTML
 *   - Footer (Logan signature + links) is composed separately.
 *
 * Variables (substituted by substituteVars):
 *   {provider_name}      provider organization name
 *   {city}               provider city
 *   {state}              provider state
 *   {category}           provider care type (e.g., "home care")
 *   {rank}               provider's ranking in market (number)
 *   {total}              total providers in market
 *   {ordinal}            ordinal form of rank ("1st", "2nd", etc.)
 *   {profile_url}        link to their Olera profile page (no sign-in)
 *   {claim_url}          magic link to claim/verify their profile
 *   {manage_url}         magic link to manage listing
 *   {remove_url}         link to request listing removal
 *   {unsubscribe_url}    link to unsubscribe from emails
 *   {mailing_address}    physical mailing address (CAN-SPAM)
 *   {gap_list}           formatted list of missing profile fields (Day 3 only)
 */

export interface EmailDraft {
  subject: string;
  preheader?: string;
  body: string;
}

export interface TemplateContext {
  provider_name: string;
  city: string;
  state: string;
  category?: string;
  // Ranking data (optional - if missing, use fallback opener)
  rank?: number;
  total?: number;
  // URLs
  profile_url: string;
  claim_url: string;
  manage_url: string;
  remove_url: string;
  unsubscribe_url: string;
  // Compliance
  mailing_address: string;
  // Profile gaps (Day 3 template)
  gap_list?: string;
  // City demand metric (Day 7 template)
  // Total unique page views for this city+category in the last 30 days
  city_views?: number;
}

// Template keys for the cadence system
// Cadence emails: intro (Day 0), followup (Day 3), demand_loss (Day 7), final (Day 14)
// Standalone: nudge (Follow Up resend action)
export type ProviderOutreachTemplateKey = "intro" | "followup" | "demand_loss" | "final" | "nudge";

// Placeholders for variable substitution
const PLACEHOLDER = {
  providerName: "{provider_name}",
  city: "{city}",
  state: "{state}",
  category: "{category}",
  rank: "{rank}",
  total: "{total}",
  ordinal: "{ordinal}",
  profileUrl: "{profile_url}",
  claimUrl: "{claim_url}",
  manageUrl: "{manage_url}",
  removeUrl: "{remove_url}",
  unsubscribeUrl: "{unsubscribe_url}",
  mailingAddress: "{mailing_address}",
  gapList: "{gap_list}",
  cityViews: "{city_views}",
};

// Subject lines
const SUBJECT_INTRO = `Families in ${PLACEHOLDER.city} rank you #${PLACEHOLDER.rank} of ${PLACEHOLDER.total}`;
const SUBJECT_INTRO_NO_RANK = `${PLACEHOLDER.providerName} on Olera`;
const SUBJECT_FOLLOWUP = `What families see when they open ${PLACEHOLDER.providerName}`;
const SUBJECT_DEMAND_LOSS = `Families are searching for ${PLACEHOLDER.category} in ${PLACEHOLDER.city}`;
const SUBJECT_DEMAND_LOSS_WITH_COUNT = `Families viewed ${PLACEHOLDER.category} providers in ${PLACEHOLDER.city} ${PLACEHOLDER.cityViews} times in the last 30 days`;
const SUBJECT_FINAL = `What claiming ${PLACEHOLDER.providerName} actually gets you`;
const SUBJECT_NUDGE = `Your claim link for ${PLACEHOLDER.providerName}`;

// Preheader text
const PREHEADER_INTRO = "By the Google reviews they actually read";
const PREHEADER_FOLLOWUP = `It's one of the first pages ${PLACEHOLDER.city} families compare — here's what it shows them`;
const PREHEADER_DEMAND_LOSS = "They couldn't ask you a single question";
const PREHEADER_FINAL = "The whole thing in one email: free leads, family questions, your page under your control";
const PREHEADER_NUDGE = "Two minutes, and the page is yours";

/**
 * Convert number to ordinal string (1 → "1st", 2 → "2nd", etc.)
 */
export function toOrdinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/**
 * Get a template by key
 */
export function getTemplate(
  key: ProviderOutreachTemplateKey,
  ctx: TemplateContext
): EmailDraft {
  const hasRank = ctx.rank != null && ctx.total != null && ctx.rank > 0;

  // Minimum threshold for showing specific view counts in demand-loss email
  // Below this, we use generic "families are searching" language
  const CITY_VIEWS_THRESHOLD = 10;
  const hasDemandData = ctx.city_views != null && ctx.city_views >= CITY_VIEWS_THRESHOLD;

  switch (key) {
    case "intro":
      return introEmail();
    case "followup":
      return followupEmail();
    case "demand_loss":
      return demandLossEmail(hasDemandData);
    case "final":
      return finalEmail();
    case "nudge":
      return nudgeEmail();
  }
}

/**
 * Substitute variables in subject and body
 */
export function substituteVars(
  text: string,
  vars: Record<string, string>
): string {
  let result = text;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, "g"), value);
  }
  return result;
}

/**
 * Build the variables object from context
 */
export function buildVars(ctx: TemplateContext): Record<string, string> {
  return {
    provider_name: ctx.provider_name,
    city: ctx.city,
    state: ctx.state,
    category: ctx.category || "care providers",
    rank: ctx.rank?.toString() || "",
    total: ctx.total?.toString() || "",
    ordinal: ctx.rank ? toOrdinal(ctx.rank) : "",
    profile_url: ctx.profile_url,
    claim_url: ctx.claim_url,
    manage_url: ctx.manage_url,
    remove_url: ctx.remove_url,
    unsubscribe_url: ctx.unsubscribe_url,
    mailing_address: ctx.mailing_address,
    gap_list: ctx.gap_list || "",
    city_views: ctx.city_views?.toLocaleString() || "0",
  };
}

// ── Templates ────────────────────────────────────────────────────────────

/**
 * Day 0: Introduction email
 *
 * First touch from Dr. Logan DuBose. Introduces Olera, explains the
 * no-cost/no-referral-fee model, and invites them to review their page.
 */
function introEmail(): EmailDraft {
  return {
    subject: `A free way for more families to find ${PLACEHOLDER.providerName}`,
    preheader: `No broker, no fee, families come directly to you`,
    body: [
      `We've created a free Olera page for ${PLACEHOLDER.providerName}, giving families an easier way to discover and connect with you.`,
      ``,
      `There's no cost to manage your page and no referral fees. When a family finds you through Olera, they contact your team directly.`,
      ``,
      `[Review your page →](${PLACEHOLDER.claimUrl})`,
      ``,
      `I'm Dr. Logan DuBose, a physician-researcher and co-founder of Olera. With support from the NIH, we built Olera to make finding trusted senior care easier for families.`,
      ``,
      `We'd love for you to take a look and make sure the page accurately reflects ${PLACEHOLDER.providerName}.`,
      ``,
      `Questions or need help getting set up? Just reply. We're happy to help.`,
    ].join("\n"),
  };
}

/**
 * Day 3: Follow-up email
 *
 * Encourages providers to personalize their page and show what makes
 * them different. Integrates gap_list to highlight what's currently missing.
 */
function followupEmail(): EmailDraft {
  return {
    subject: `Your story deserves more than a listing`,
    preheader: `Give families the full picture`,
    body: [
      `Families don't choose care from a list of services. They choose the people and places they trust.`,
      ``,
      `Right now, your page shows ${PLACEHOLDER.gapList}. Your Olera page is your opportunity to change that — to show families what makes ${PLACEHOLDER.providerName} different. Add photos, highlight the people behind your care, and showcase what makes your community special.`,
      ``,
      `[Personalize your page →](${PLACEHOLDER.claimUrl})`,
      ``,
      `Help families see why ${PLACEHOLDER.providerName} could be the right place for someone they love. It only takes a few minutes to get started.`,
    ].join("\n"),
  };
}

/**
 * Day 7: Demand-loss email
 *
 * Creates urgency by showing real demand and emphasizing the risk of
 * missing family inquiries. Encourages turning on notifications.
 *
 * Has fallback for low view counts (< 10) to avoid showing weak numbers.
 */
function demandLossEmail(hasDemandData: boolean): EmailDraft {
  const opener = hasDemandData
    ? `Families in ${PLACEHOLDER.city} viewed ${PLACEHOLDER.category} providers on Olera ${PLACEHOLDER.cityViews} times in the last 30 days.`
    : `Families in ${PLACEHOLDER.city} are actively searching for ${PLACEHOLDER.category} providers on Olera.`;

  return {
    subject: `A family has a question. Will you see it?`,
    preheader: `Don't miss families ready to talk`,
    body: [
      opener,
      ``,
      `Imagine a daughter urgently searching for care for her mom. She finds ${PLACEHOLDER.providerName} and has a question before taking the next step.`,
      ``,
      `If she can't reach you, she'll find a provider she can.`,
      ``,
      `[Turn on notifications →](${PLACEHOLDER.claimUrl})`,
      ``,
      `Be the first to know when a family reaches out and respond when it matters most.`,
      ``,
      `Don't miss out on a family who could be ready to choose you.`,
    ].join("\n"),
  };
}

/**
 * Day 14: Summary email
 *
 * Everything in one place for recipients who may have missed earlier emails.
 * Comprehensive value prop, low-pressure close, offer to redirect to right contact.
 */
function finalEmail(): EmailDraft {
  return {
    subject: SUBJECT_FINAL,
    preheader: PREHEADER_FINAL,
    body: [
      `In case my earlier notes never reached you, here's everything in one place.`,
      ``,
      `Olera is where families find and compare senior care in ${PLACEHOLDER.city}, built by a physician-researcher, funded by the NIH, with nothing to buy and no selling of your leads. ${PLACEHOLDER.providerName} is already listed. Claiming the page is free, takes about two minutes, and gives you:`,
      ``,
      `• Direct leads from families looking for ${PLACEHOLDER.category} in ${PLACEHOLDER.city}, free, no broker taking a cut`,
      `• Family questions come to you, right now they go unanswered, and families move on`,
      `• A verified badge that families trust when comparing options`,
      `• Your prices, photos, and details under your control instead of publicly-gathered blanks`,
      ``,
      `If now isn't the time, no pressure. The page stays up and stays yours to claim whenever you're ready.`,
      ``,
      `[Claim your page — about 2 minutes](${PLACEHOLDER.claimUrl})`,
      ``,
      `And if I've had the wrong address all along, reply with the email of whoever manages ${PLACEHOLDER.providerName}'s marketing or admissions, and I'll reach out to them directly.`,
    ].join("\n"),
  };
}

/**
 * Standalone: Nudge email
 *
 * NOT part of the cadence. Used by:
 *   - Follow Up "resend link" action
 *   - Future re-engagement triggers
 *
 * Short and simple: just the claim link, easy to find.
 */
function nudgeEmail(): EmailDraft {
  return {
    subject: SUBJECT_NUDGE,
    preheader: PREHEADER_NUDGE,
    body: [
      `Just putting the claim link where it's easy to find:`,
      ``,
      `[Claim your page — about 2 minutes](${PLACEHOLDER.claimUrl})`,
      ``,
      `It's free and puts ${PLACEHOLDER.providerName}'s page under your control: prices, photos, and family questions. If anything's in the way, reply and I'll help you directly.`,
    ].join("\n"),
  };
}

// ── Signature ────────────────────────────────────────────────────────────

/**
 * Logan photo URL (Supabase-hosted for email compatibility)
 */
export const LOGAN_PHOTO_URL =
  "https://ocaabzfiiikjcgqwhbwr.supabase.co/storage/v1/object/public/content-images/team/logan.jpg";

/**
 * Logan signature block HTML.
 * Photo + name + title + NIH credentials.
 */
export function loganSignatureHtml(): string {
  return `
<table cellpadding="0" cellspacing="0" style="margin-top:16px;">
  <tr>
    <td style="vertical-align:top;padding-right:12px;">
      <img src="${LOGAN_PHOTO_URL}" alt="Dr. Logan DuBose" width="48" height="48" style="border-radius:50%;display:block;" />
    </td>
    <td style="vertical-align:middle;font-size:13px;line-height:1.4;color:#374151;font-family:Inter,Arial,sans-serif;">
      <p style="margin:0;font-weight:600;color:#111827;">Dr. Logan DuBose</p>
      <p style="margin:2px 0 0;color:#6b7280;">CRO, Olera · Researcher funded by NIH Small Business Innovation Research (SBIR) Program</p>
    </td>
  </tr>
</table>`;
}

/**
 * Logan signature block plain text (for text/plain MIME alternative)
 */
export function loganSignaturePlainText(): string {
  return [
    ``,
    `Dr. Logan DuBose`,
    `CRO, Olera · Researcher funded by NIH SBIR Program`,
  ].join("\n");
}

/**
 * Compose the full email footer HTML.
 * Includes: sign-off, Logan signature, footer links, mailing address.
 */
export function composeFooterHtml(vars: Record<string, string>): string {
  return [
    // Sign-off
    `<p style="margin:16px 0 4px;font-size:14px;line-height:1.5;color:#374151;font-family:Inter,Arial,sans-serif;">Best,</p>`,
    `<p style="margin:0;font-size:14px;line-height:1.5;color:#374151;font-family:Inter,Arial,sans-serif;">Logan</p>`,
    // Signature block
    loganSignatureHtml(),
    // Footer links
    `<div style="margin:30px 0 0;padding:16px 0 0;border-top:1px solid #f3f4f6;">`,
    `<p style="font-size:13px;color:#9ca3af;margin:0;font-family:Inter,Arial,sans-serif;">`,
    `<a href="${vars.manage_url}" style="color:#9ca3af;text-decoration:underline;">Manage your listing</a> · `,
    `<a href="${vars.remove_url}" style="color:#9ca3af;text-decoration:underline;">Remove my listing</a> · `,
    `<a href="${vars.unsubscribe_url}" style="color:#9ca3af;text-decoration:underline;">Unsubscribe</a>`,
    `</p>`,
    // Mailing address (CAN-SPAM)
    `<p style="font-size:11px;color:#d1d5db;margin:12px 0 0;font-family:Inter,Arial,sans-serif;">Olera · ${vars.mailing_address}</p>`,
    `</div>`,
  ].join("\n");
}

/**
 * Compose the full email footer plain text.
 */
export function composeFooterPlainText(vars: Record<string, string>): string {
  return [
    ``,
    `Best,`,
    `Logan`,
    loganSignaturePlainText(),
    ``,
    `---`,
    `Manage your listing: ${vars.manage_url}`,
    `Remove my listing: ${vars.remove_url}`,
    `Unsubscribe: ${vars.unsubscribe_url}`,
    ``,
    `Olera · ${vars.mailing_address}`,
  ].join("\n");
}

// ── Legacy exports (for backward compatibility) ──────────────────────────

/**
 * @deprecated Use loganSignatureHtml instead
 */
export const TJ_PHOTO_URL = LOGAN_PHOTO_URL;

/**
 * @deprecated Use loganSignatureHtml instead
 */
export function tjSignatureHtml(): string {
  return loganSignatureHtml();
}

/**
 * @deprecated Use loganSignaturePlainText instead
 */
export function tjSignaturePlainText(): string {
  return loganSignaturePlainText();
}
