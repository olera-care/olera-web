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
  // City demand metric (Day 5 template)
  // Total unique page views for this city+category in the last 30 days
  city_views?: number;
}

// Template keys for the cadence system
// Cadence emails: intro (Day 0), followup (Day 3), demand_loss (Day 5), final (Day 7)
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
    city: ctx.city || ctx.state || "your area",
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
 * First touch. Direct value prop: families can see you but can't reach you.
 * Shorter, more urgent, location-specific.
 *
 * Style: Direct, concise, action-oriented.
 * Each array element is a paragraph. Empty strings create paragraph breaks.
 * Single newlines within elements become <br> tags.
 */
function introEmail(): EmailDraft {
  return {
    subject: `Families in ${PLACEHOLDER.city} can see ${PLACEHOLDER.providerName} on Olera`,
    body: [
      `Hi ${PLACEHOLDER.providerName},`,
      ``,
      `Families in ${PLACEHOLDER.city} searching for ${PLACEHOLDER.category} can already see the page we built for ${PLACEHOLDER.providerName} from public information. But if one of them reached out today, no one at ${PLACEHOLDER.providerName} would see the message.`,
      ``,
      `Olera is free for providers: no contracts, no referral or per-lead fees. Taking over your page takes about two minutes.`,
      ``,
      `[Activate ${PLACEHOLDER.providerName}'s page →](${PLACEHOLDER.claimUrl})`,
      ``,
      `Questions? Just reply to this email or call +1 (979) 243-9801. A real person answers both.`,
    ].join("\n"),
  };
}

/**
 * Day 3: Follow-up email
 *
 * Focuses on family questions going unanswered. Creates urgency
 * with link expiration notice.
 *
 * Style: Direct, concise, action-oriented.
 */
function followupEmail(): EmailDraft {
  return {
    subject: `When a family asks about ${PLACEHOLDER.providerName}`,
    body: [
      `Hi ${PLACEHOLDER.providerName},`,
      ``,
      `Families on Olera ask providers questions directly: about availability, pricing, and whether the fit is right for their loved one. The answers are often how a family decides.`,
      ``,
      `If a family asked ${PLACEHOLDER.providerName} something today, it would go unanswered. Taking over your page fixes that in about two minutes, free: no contracts, no referral or per-lead fees.`,
      ``,
      `[Activate ${PLACEHOLDER.providerName}'s page →](${PLACEHOLDER.claimUrl})`,
      ``,
      `Questions? Just reply to this email or call +1 (979) 243-9801. A real person answers both.`,
    ].join("\n"),
  };
}

/**
 * Day 5: Free model email
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
      `Claiming and managing your Olera profile is **completely free**. That means **no referral fees**, **no pay-per-lead costs**, and **no subscription fees**.`,
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
 * Day 7: Final email
 *
 * Focuses on the Verified badge as a trust signal for families.
 * Personal tone with medical school trust story from Logan.
 *
 * Style: Personal, supportive, PitchBook-inspired clean layout.
 */
function finalEmail(): EmailDraft {
  return {
    subject: `Show families ${PLACEHOLDER.providerName} is verified`,
    body: [
      `Hi ${PLACEHOLDER.providerName},`,
      ``,
      `One of the first things we learn in medical school is that trust is the foundation of every patient relationship.`,
      ``,
      `The same is true in senior care. Before families ever pick up the phone or schedule a tour, they want peace of mind that they're connecting with the right provider.`,
      ``,
      `That's why we recommend verifying your Olera profile to display a **verified badge**, letting families know your information has been reviewed and confirmed by your team.`,
      ``,
      `[Get your verified badge →](${PLACEHOLDER.claimUrl})`,
      ``,
      `It's a small step that helps build trust before the very first conversation.`,
      ``,
      `If you have any questions or need help getting verified, simply reply to this email or give us a call at +1 (979) 243-9801. We'd be happy to help.`,
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
 * Personal tone emphasizing mission and direct family connections.
 *
 * Style: Personal, supportive, PitchBook-inspired clean layout.
 */
function nudgeEmail(): EmailDraft {
  return {
    subject: `Your free Olera page for ${PLACEHOLDER.providerName} is ready`,
    body: [
      `Hi ${PLACEHOLDER.providerName},`,
      ``,
      `Finding the right senior care is one of the biggest decisions a family will make. That's why we're building a better experience for both families and providers.`,
      ``,
      `We've already created a free Olera profile to help more families discover ${PLACEHOLDER.providerName}, ask questions, and connect directly with your team.`,
      ``,
      `[Review your page →](${PLACEHOLDER.claimUrl})`,
      ``,
      `There are **no referral fees** and no brokers in between, so every conversation stays directly between your team and the families you serve.`,
      ``,
      `If you have any questions or need help getting started, simply reply to this email or give us a call at +1 (979) 243-9801. We'd be happy to help.`,
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


