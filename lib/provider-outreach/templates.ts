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
 *   - Footer (TJ signature + STOP line) is NOT in the template body.
 *     email-utils.ts composes it once and appends to every send.
 *
 * Variables (substituted by substituteVars):
 *   {provider_name}      provider organization name
 *   {city}               provider city
 *   {state}              provider state
 *   {category}           provider care type (e.g., "home health agency")
 *   {profile_url}        link to their Olera profile page
 *   {claim_url}          link to claim/verify their profile
 *   {sender_name}        sender's first name (TJ)
 */

export interface EmailDraft {
  subject: string;
  body: string;
}

export interface TemplateContext {
  provider_name: string;
  city: string;
  state: string;
  category?: string;
  profile_url: string;
  claim_url: string;
  sender_name?: string;
}

// Template keys for the cadence system
export type ProviderOutreachTemplateKey = "intro" | "followup" | "final";

// Placeholders for variable substitution
const PLACEHOLDER = {
  providerName: "{provider_name}",
  city: "{city}",
  state: "{state}",
  location: "{location}", // Combined city, state (handles empty state)
  category: "{category}",
  profileUrl: "{profile_url}",
  claimUrl: "{claim_url}",
  senderName: "{sender_name}",
};

// Subject lines
const SUBJECT_INTRO = `Your ${PLACEHOLDER.providerName} profile on Olera`;
const SUBJECT_FOLLOWUP = `Following up: ${PLACEHOLDER.providerName} on Olera`;
const SUBJECT_FINAL = `Last check-in: ${PLACEHOLDER.providerName} profile`;

/**
 * Get a template by key
 */
export function getTemplate(
  key: ProviderOutreachTemplateKey,
  _ctx: TemplateContext
): EmailDraft {
  switch (key) {
    case "intro":
      return introEmail();
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
  // Handle city/state formatting to avoid "Houston, " when state is empty
  const location = ctx.state
    ? `${ctx.city}, ${ctx.state}`
    : ctx.city;

  return {
    provider_name: ctx.provider_name,
    city: ctx.city,
    state: ctx.state,
    // Combined location for use in templates (avoids trailing comma)
    location: location,
    category: ctx.category || "care provider",
    profile_url: ctx.profile_url,
    claim_url: ctx.claim_url,
    sender_name: ctx.sender_name || "TJ",
  };
}

// ── Templates ────────────────────────────────────────────────────────────

/**
 * Day 0: Introduction email
 *
 * First touch. Introduces Olera, explains the value of claiming their profile,
 * and provides a clear CTA to claim/verify.
 */
function introEmail(): EmailDraft {
  return {
    subject: SUBJECT_INTRO,
    body: [
      `Hello,`,
      ``,
      `I'm reaching out because **${PLACEHOLDER.providerName}** has a profile on [Olera](https://olera.care), a directory that helps families find and compare senior care providers in ${PLACEHOLDER.location}.`,
      ``,
      `Your profile is currently unclaimed, which means:`,
      ``,
      `• Families can see your listing but can't contact you directly through Olera`,
      `• You're missing out on free leads from families actively searching for care`,
      `• You can't respond to questions or reviews on your profile`,
      ``,
      `**Claiming your profile takes about 2 minutes** and gives you:`,
      ``,
      `• Free leads from families in your area`,
      `• The ability to respond to questions and reviews`,
      `• A verified badge that builds trust with families`,
      `• Control over your listing information`,
      ``,
      `You can view your profile here: [${PLACEHOLDER.providerName}](${PLACEHOLDER.profileUrl})`,
      ``,
      `Ready to claim it? [Click here to get started](${PLACEHOLDER.claimUrl}).`,
      ``,
      `If you have any questions, just reply to this email.`,
    ].join("\n"),
  };
}

/**
 * Day 3: Follow-up email
 *
 * Lighter touch. "Just in case you missed it" framing.
 * Re-emphasizes the value prop and CTA.
 */
function followupEmail(): EmailDraft {
  return {
    subject: SUBJECT_FOLLOWUP,
    body: [
      `Hello,`,
      ``,
      `I wanted to follow up on my earlier email about your [${PLACEHOLDER.providerName}](${PLACEHOLDER.profileUrl}) profile on Olera.`,
      ``,
      `Families in ${PLACEHOLDER.location} are actively searching for ${PLACEHOLDER.category} options, and claiming your profile is a simple way to get in front of them.`,
      ``,
      `It's free, takes just a couple of minutes, and gives you direct access to leads from families looking for care.`,
      ``,
      `[Claim your profile here](${PLACEHOLDER.claimUrl}).`,
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
      `This is my last check-in about your [${PLACEHOLDER.providerName}](${PLACEHOLDER.profileUrl}) profile on Olera.`,
      ``,
      `If claiming your profile isn't a priority right now, no problem. Your listing will remain visible to families searching in ${PLACEHOLDER.location}, and you can claim it anytime.`,
      ``,
      `If someone else at ${PLACEHOLDER.providerName} handles marketing or online presence, I'd appreciate a quick forward to them.`,
      ``,
      `[Claim your profile](${PLACEHOLDER.claimUrl}) | [View your listing](${PLACEHOLDER.profileUrl})`,
      ``,
      `Thanks for your time, and best of luck with your work in the community.`,
    ].join("\n"),
  };
}

// ── Signature ────────────────────────────────────────────────────────────

/**
 * TJ signature photo URL (Supabase-hosted for email compatibility)
 */
export const TJ_PHOTO_URL =
  process.env.PROVIDER_OUTREACH_TJ_PHOTO_URL ??
  "https://ocaabzfiiikjcgqwhbwr.supabase.co/storage/v1/object/public/content-images/team/tj.jpg";

/**
 * TJ signature block HTML.
 * Photo + name + title + company link.
 */
export function tjSignatureHtml(): string {
  return `
<table cellpadding="0" cellspacing="0" style="margin-top:16px;">
  <tr>
    <td style="vertical-align:top;padding-right:16px;">
      <img src="${TJ_PHOTO_URL}" alt="TJ Falohun" width="80" height="80" style="border-radius:8px;display:block;" />
    </td>
    <td style="vertical-align:top;font-size:13px;line-height:1.5;color:#374151;font-family:Inter,Arial,sans-serif;">
      <p style="margin:0 0 4px;font-weight:600;color:#111827;">TJ Falohun</p>
      <p style="margin:0 0 2px;">Co-founder &amp; CEO, <a href="https://olera.care" style="color:#059669;">Olera</a></p>
      <p style="margin:0 0 2px;">PhD Researcher, Biomedical Engineering</p>
      <p style="margin:0;"><a href="https://www.linkedin.com/in/tfalohun/" style="color:#059669;">LinkedIn</a></p>
    </td>
  </tr>
</table>`;
}

/**
 * TJ signature block plain text (for text/plain MIME alternative)
 */
export function tjSignaturePlainText(): string {
  return [
    ``,
    `TJ Falohun`,
    `Co-founder & CEO, Olera`,
    `PhD Researcher, Biomedical Engineering`,
    `https://olera.care`,
  ].join("\n");
}

/**
 * Compose the full email footer HTML.
 * Includes: sign-off, TJ signature, compliance line.
 */
export function composeFooterHtml(): string {
  return [
    // Sign-off
    `<p style="margin:16px 0 4px;font-size:13px;line-height:1.5;color:#374151;font-family:Inter,Arial,sans-serif;">Best,</p>`,
    `<p style="margin:0;font-size:13px;line-height:1.5;color:#374151;font-family:Inter,Arial,sans-serif;">TJ</p>`,
    // Signature block
    tjSignatureHtml(),
    // Compliance line
    `<p style="margin:24px 0 0;font-size:11px;line-height:1.5;color:#9ca3af;font-family:Inter,Arial,sans-serif;">Reply STOP if you would like us to stop reaching out.</p>`,
  ].join("\n");
}

/**
 * Compose the full email footer plain text.
 */
export function composeFooterPlainText(): string {
  return [
    ``,
    `Best,`,
    `TJ`,
    tjSignaturePlainText(),
    ``,
    `---`,
    `Reply STOP if you would like us to stop reaching out.`,
  ].join("\n");
}
