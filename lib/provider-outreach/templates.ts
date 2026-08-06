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

// Preheader text (nudge only - other emails have inline preheaders)
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
 * free profile we've created, and invites them to manage their page.
 *
 * Style: Professional, warm, clear value proposition.
 * Each array element is a paragraph. Empty strings create paragraph breaks.
 * Single newlines within elements become <br> tags.
 */
function introEmail(): EmailDraft {
  return {
    subject: `We've created a free profile for ${PLACEHOLDER.providerName}`,
    body: [
      `Hi ${PLACEHOLDER.providerName},`,
      ``,
      `I'm Dr. Logan DuBose, a physician and co-founder of Olera.`,
      ``,
      `As a physician, I've seen how difficult it can be for families to navigate senior care. That's why we created Olera. With support from the NIH, we're building a free referral platform that helps families discover trusted senior care providers.`,
      ``,
      `As part of that, we've already created a free profile for ${PLACEHOLDER.providerName} using publicly available information. It's ready for your team to review and manage, making it easier for families to find your services.`,
      ``,
      `[Manage your profile →](${PLACEHOLDER.claimUrl})`,
      ``,
      `Claiming your profile takes less than two minutes and allows you to:`,
      `✓ Have families contact you directly`,
      `✓ Never pay referral or per-lead fees`,
      `✓ Improve your online visibility`,
      ``,
      `If you have any questions, simply reply to this email or give us a call at +1 (979) 243-9801. We'd be happy to help.`,
    ].join("\n"),
  };
}

/**
 * Day 3: Follow-up email
 *
 * Encourages providers to complete their profile so families feel
 * more confident choosing them. Personal tone from Logan.
 *
 * Style: Personal, supportive, PitchBook-inspired clean layout.
 */
function followupEmail(): EmailDraft {
  return {
    subject: `Help families feel more confident choosing ${PLACEHOLDER.providerName}`,
    body: [
      `Hi ${PLACEHOLDER.providerName},`,
      ``,
      `One thing I've learned throughout my career is that finding senior care isn't easy. Families are often left making an important decision with limited information and guidance.`,
      ``,
      `That's why your Olera profile matters.`,
      ``,
      `[Manage your profile →](${PLACEHOLDER.claimUrl})`,
      ``,
      `It's ready for your review. Every photo, update, and detail you add helps families better understand your community and feel more confident in choosing the right care.`,
      ``,
      `It only takes a minute to activate your profile.`,
      ``,
      `If you have any questions, simply reply to this email or give us a call at +1 (979) 243-9801. We'd be happy to help.`,
    ].join("\n"),
  };
}

/**
 * Day 7: Free model email
 *
 * Explains why Olera is free and the value proposition for providers.
 * Emphasizes no fees and direct family connections.
 *
 * Style: Personal, supportive, PitchBook-inspired clean layout.
 */
function demandLossEmail(_hasDemandData: boolean): EmailDraft {
  // Note: hasDemandData parameter kept for backward compatibility but no longer used
  return {
    subject: `Why we've made Olera free`,
    body: [
      `Hi ${PLACEHOLDER.providerName},`,
      ``,
      `Throughout my time in senior care, I've seen how difficult finding the right care can be. Families deserve an easier way to connect with providers.`,
      ``,
      `That's why we built Olera.`,
      ``,
      `Claiming and managing your Olera profile is completely free. That means no referral fees, no pay-per-lead costs, and no subscription fees.`,
      ``,
      `[Review your page →](${PLACEHOLDER.claimUrl})`,
      ``,
      `We chose this model because we believe families should be in control of their care. Once your page is claimed, families can contact your team directly, have conversations sooner, and begin their next chapter with confidence.`,
      ``,
      `If you have any questions, simply reply to this email or give us a call at +1 (979) 243-9801. We'd be happy to help.`,
    ].join("\n"),
  };
}

/**
 * Day 14: Final email
 *
 * Focuses on the Verified badge as a trust signal for families.
 * Simple, focused message about building confidence.
 *
 * Style: Apple/Airbnb - flowing prose that wraps naturally.
 */
function finalEmail(): EmailDraft {
  return {
    subject: `${PLACEHOLDER.providerName} isn't verified on Olera yet`,
    preheader: `Give families confidence to reach out`,
    body: [
      `**Your page still isn't verified.**`,
      ``,
      `Choosing senior care is one of the biggest decisions a family will ever make. Families need to know they're connecting with a real person they can trust.`,
      ``,
      `A Verified badge gives them that confidence. It shows that a member of the ${PLACEHOLDER.providerName} team has confirmed the information is accurate.`,
      ``,
      `[Get your Verified badge →](${PLACEHOLDER.claimUrl})`,
      ``,
      `It only takes about two minutes and helps families feel at ease when they're ready to reach out.`,
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
 *
 * Style: Apple/Airbnb - flowing prose that wraps naturally.
 */
function nudgeEmail(): EmailDraft {
  return {
    subject: `Your free Olera page for ${PLACEHOLDER.providerName} is ready`,
    preheader: PREHEADER_NUDGE,
    body: [
      `**Your page is ready.**`,
      ``,
      `We've already created a free Olera page for ${PLACEHOLDER.providerName}. It's ready for your team to manage whenever you are.`,
      ``,
      `[Open your page →](${PLACEHOLDER.claimUrl})`,
      ``,
      `It only takes about two minutes to get started. Once your page is yours, you can start receiving leads, answering questions, and connecting directly with families looking for care.`,
      ``,
      `No referral fees or brokers in between. The relationship stays directly with your team.`,
      ``,
      `Questions? Just reply and I'll help personally.`,
    ].join("\n"),
  };
}

// ── Signature ────────────────────────────────────────────────────────────

/**
 * Logan photo URL (Supabase-hosted for email compatibility)
 */
export const LOGAN_PHOTO_URL =
  "https://ocaabzfiiikjcgqwhbwr.supabase.co/storage/v1/object/public/content-images/team/logan.jpg";

/** Brand color for links */
const BRAND_COLOR = "#198087";

/** LinkedIn profile URLs */
const LINKEDIN_LOGAN = "https://www.linkedin.com/in/logan-dubose/";
const LINKEDIN_TJ = "https://www.linkedin.com/in/tfalohun/";

/**
 * Logan signature block HTML.
 * Photo + bio with LinkedIn links for both Logan and TJ.
 * Matches the polished style used in weekly digest emails.
 * NOTE: No leading newline to avoid extra whitespace when concatenated.
 */
export function loganSignatureHtml(): string {
  // NOTE: margin-top reduced from 24px to 8px to avoid huge gaps while maintaining
  // reasonable spacing for both SmartLead and Resend email paths.
  // - SmartLead: "Logan" has 8px bottom margin + 8px top = 16px gap (good)
  // - Resend: "Logan" has 0px bottom margin + 8px top = 8px gap (good)
  return `<table cellpadding="0" cellspacing="0" style="margin-top:8px;"><tr><td style="vertical-align:top;padding-right:16px;"><img src="${LOGAN_PHOTO_URL}" alt="Dr. Logan DuBose" width="64" height="64" style="border-radius:50%;display:block;" /></td><td style="vertical-align:top;font-size:13px;line-height:1.5;color:#6b7280;font-family:Inter,Arial,sans-serif;"><p style="margin:0;">Olera is built by <a href="${LINKEDIN_LOGAN}" style="color:${BRAND_COLOR};text-decoration:underline;">Dr. Logan DuBose</a>, a physician-researcher funded by NIH SBIR, and <a href="${LINKEDIN_TJ}" style="color:${BRAND_COLOR};text-decoration:underline;">TJ Falohun</a>, a PhD researcher in biomedical engineering. We&rsquo;re working to make senior care easier to understand and compare.</p></td></tr></table>`;
}


