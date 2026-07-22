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
}

// Template keys for the cadence system
// "intro" = Day 0, "intro_resend" = Day 3 non-opener resend (same body, different subject)
export type ProviderOutreachTemplateKey = "intro" | "intro_resend" | "followup" | "final";

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
};

// Subject lines
const SUBJECT_INTRO = `Families in ${PLACEHOLDER.city} rank you #${PLACEHOLDER.rank} of ${PLACEHOLDER.total}`;
const SUBJECT_INTRO_RESEND = `Where ${PLACEHOLDER.providerName} stands in ${PLACEHOLDER.city}`;
const SUBJECT_INTRO_NO_RANK = `${PLACEHOLDER.providerName} on Olera`;
const SUBJECT_FOLLOWUP = `Following up: ${PLACEHOLDER.providerName} on Olera`;
const SUBJECT_FINAL = `Last check-in: ${PLACEHOLDER.providerName} profile`;

// Preheader text
const PREHEADER_INTRO = "By the Google reviews they actually read";

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

  switch (key) {
    case "intro":
      return introEmail(hasRank);
    case "intro_resend":
      return introResendEmail(hasRank);
    case "followup":
      return followupEmail();
    case "final":
      return finalEmail();
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
 * Day 3: Resend for non-openers
 *
 * Same body as Day 0 intro, different subject line.
 * Subject: "Where {Business name} stands in {city}"
 */
function introResendEmail(hasRank: boolean): EmailDraft {
  const intro = introEmail(hasRank);
  return {
    subject: SUBJECT_INTRO_RESEND,
    preheader: intro.preheader,
    body: intro.body,
  };
}

/**
 * Day 3: Follow-up email (for openers who didn't claim)
 *
 * Lighter touch. Re-emphasizes the value prop and CTA.
 */
function followupEmail(): EmailDraft {
  return {
    subject: SUBJECT_FOLLOWUP,
    body: [
      `Hello,`,
      ``,
      `I wanted to follow up on my earlier email about your [${PLACEHOLDER.providerName}](${PLACEHOLDER.profileUrl}) page on Olera.`,
      ``,
      `Families in ${PLACEHOLDER.city} are actively searching for ${PLACEHOLDER.category} options, and claiming your page is a simple way to get in front of them.`,
      ``,
      `It's free, takes just a couple of minutes, and gives you direct access to leads from families looking for care.`,
      ``,
      `[Claim your page here](${PLACEHOLDER.claimUrl})`,
      ``,
      `Let me know if you have any questions.`,
    ].join("\n"),
  };
}

/**
 * Day 7: Final email
 *
 * Last outreach attempt. Low-pressure, graceful close.
 * Offers to connect them with the right person if they're not the decision maker.
 */
function finalEmail(): EmailDraft {
  return {
    subject: SUBJECT_FINAL,
    body: [
      `Hello,`,
      ``,
      `This is my last check-in about your [${PLACEHOLDER.providerName}](${PLACEHOLDER.profileUrl}) page on Olera.`,
      ``,
      `If claiming your page isn't a priority right now, no problem. Your listing will remain visible to families searching in ${PLACEHOLDER.city}, and you can claim it anytime.`,
      ``,
      `If someone else at ${PLACEHOLDER.providerName} handles marketing or online presence, I'd appreciate a quick forward to them.`,
      ``,
      `[Claim your page](${PLACEHOLDER.claimUrl}) | [View your listing](${PLACEHOLDER.profileUrl})`,
      ``,
      `Thanks for your time, and best of luck with your work in the community.`,
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
