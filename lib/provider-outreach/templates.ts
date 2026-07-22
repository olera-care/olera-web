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
      return introEmail(hasRank);
    case "followup":
      return followupEmail(hasRank);
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
 * First touch from Dr. Logan DuBose. Trust-forward opener explaining
 * who Olera is, NIH backing, no-broker model. CTA to claim profile.
 *
 * Two variants:
 *   - With rank: "Families comparing {care type} in {city} see {total} providers.
 *                 {Business name} ranks {ordinal}..."
 *   - Without rank: "Families comparing {care type} in {city} can already find
 *                    {Business name}'s page..."
 */
function introEmail(hasRank: boolean): EmailDraft {
  const opener = hasRank
    ? `Families comparing ${PLACEHOLDER.category} in ${PLACEHOLDER.city} see ${PLACEHOLDER.total} providers. ${PLACEHOLDER.providerName} ranks ${PLACEHOLDER.ordinal} — by the Google reviews they actually read.`
    : `Families comparing ${PLACEHOLDER.category} in ${PLACEHOLDER.city} can already find ${PLACEHOLDER.providerName}'s page — here's what they see.`;

  return {
    subject: hasRank ? SUBJECT_INTRO : SUBJECT_INTRO_NO_RANK,
    preheader: hasRank ? PREHEADER_INTRO : undefined,
    body: [
      opener,
      ``,
      `I'm Dr. Logan DuBose, a physician-researcher and co-founder of Olera. We built it with NIH funding so families can find trustworthy care directly, without a broker taking a cut. There's nothing to buy here, and we don't sell your leads.`,
      ``,
      `Your page is already up — you can see exactly what families see here: [${PLACEHOLDER.providerName}](${PLACEHOLDER.profileUrl}). It's unclaimed, so all it shows is what we could gather publicly, blanks included.`,
      ``,
      `[Claim your page — it takes about 2 minutes](${PLACEHOLDER.claimUrl})`,
      ``,
      `Questions? Just reply — it goes straight to our team, and I'll help you directly.`,
      ``,
      `Not the right person for this? Forwarding it to whoever manages ${PLACEHOLDER.providerName}'s listing would be a big help.`,
    ].join("\n"),
  };
}

/**
 * Day 3: Follow-up email
 *
 * Focuses on profile gaps — what families see when they open the page.
 * Two variants based on whether Day 0 mentioned ranking.
 */
function followupEmail(hasRank: boolean): EmailDraft {
  // Reference Day 0 appropriately based on whether we mentioned ranking
  const opener = hasRank
    ? `A few days ago I wrote about where ${PLACEHOLDER.providerName} ranks in ${PLACEHOLDER.city}. Here's the part that matters more: what families actually see when they open your page.`
    : `A few days ago I wrote about your ${PLACEHOLDER.providerName} page on Olera. Here's what matters most: what families actually see when they open it.`;

  return {
    subject: SUBJECT_FOLLOWUP,
    preheader: PREHEADER_FOLLOWUP,
    body: [
      opener,
      ``,
      `Right now it shows ${PLACEHOLDER.gapList}. Families comparing care filter on exactly those things — and when the answers aren't there, they move on to the next provider on their list, even when you would have been the right fit.`,
      ``,
      `Claiming fixes that. Two minutes, and the blanks become your answers.`,
      ``,
      `[Claim your page — about 2 minutes](${PLACEHOLDER.claimUrl})`,
      ``,
      `Or start even smaller: reply with your starting price, and I'll add it to your page for you.`,
      ``,
      `Not the right contact? Please forward this to whoever manages ${PLACEHOLDER.providerName}'s listing.`,
    ].join("\n"),
  };
}

/**
 * Day 7: Demand-loss email
 *
 * Shows families are actively viewing providers in their city but can't
 * engage with unclaimed pages. Creates urgency through real demand data.
 *
 * Two variants:
 *   - With demand data (hasDemandData=true): Shows specific view count
 *   - Without demand data (hasDemandData=false): Uses generic "families are searching" language
 *
 * Variable: {city_views} = total unique page views for this city+category
 * in the last 30 days (from provider_page_view_stats table).
 */
function demandLossEmail(hasDemandData: boolean): EmailDraft {
  // Opener varies based on whether we have meaningful view data
  const opener = hasDemandData
    ? `Families in ${PLACEHOLDER.city} viewed ${PLACEHOLDER.category} pages on Olera ${PLACEHOLDER.cityViews} times in the last 30 days.`
    : `Families in ${PLACEHOLDER.city} are searching for ${PLACEHOLDER.category} on Olera right now.`;

  return {
    subject: hasDemandData ? SUBJECT_DEMAND_LOSS_WITH_COUNT : SUBJECT_DEMAND_LOSS,
    preheader: PREHEADER_DEMAND_LOSS,
    body: [
      opener,
      ``,
      `When they open ${PLACEHOLDER.providerName}'s page, here's what they can do: compare you with the other providers, read your public reviews — and that's it. They can't ask about availability, pricing, or room for their mother next month, because unclaimed pages can't answer questions.`,
      ``,
      `And families don't wait for answers. They ask the next provider on their list.`,
      ``,
      `Claiming changes what that page does: questions reach you, your prices and photos replace the blanks, and the families already looking at ${PLACEHOLDER.providerName} can finally talk to ${PLACEHOLDER.providerName}.`,
      ``,
      `[Claim your page — about 2 minutes](${PLACEHOLDER.claimUrl})`,
      ``,
      `Or reply with your starting price and I'll put it up for you today.`,
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
