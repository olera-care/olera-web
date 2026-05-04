/**
 * Email + call-script templates.
 *
 * v3: bodies + subjects contain `{first_name}` and other placeholders.
 * The email-send module substitutes per-recipient variables when
 * actually sending. This lets one editable draft go out personalized
 * to multiple officers.
 *
 * Variables:
 *   {first_name}         per-recipient first name
 *   {organization_name}  the stakeholder's display name
 *   {campus_name}        the campus
 *   {admin_first_name}   the admin's first name (sender)
 */

import type { StakeholderType } from "./types";
import type { TemplateKey } from "./cadence";

export interface EmailDraft {
  subject: string;
  body: string;
}

export interface CallScript {
  title: string;
  script: string;
}

export interface TemplateContext {
  stakeholder_type: StakeholderType;
  organization_name: string;
  campus_name: string;
  admin_first_name?: string;
}

const SIGN_OFF = "— Olera Team\nhttps://olera.care";

const PLACEHOLDER = {
  firstName: "{first_name}",
  orgName: "{organization_name}",
  campus: "{campus_name}",
  adminName: "{admin_first_name}",
};

// ── Public API ──────────────────────────────────────────────────────────

export function getTemplate(key: TemplateKey, ctx: TemplateContext): EmailDraft {
  switch (key) {
    case "intro": return introEmail(ctx);
    case "followup_light": return followupLightEmail(ctx);
    case "followup_socialproof": return followupSocialProofEmail(ctx);
    case "followup_final": return followupFinalEmail(ctx);
    case "share": return postAgreedShareEmail(ctx);
    case "seasonal": return partnerSeasonalEmail(ctx, "Pre-Fall");
  }
}

/**
 * Substitute placeholders. `vars` need not be exhaustive — unmatched
 * placeholders pass through (so admin can preview a partially-substituted
 * draft).
 */
export function substituteVars(text: string, vars: {
  first_name?: string;
  organization_name?: string;
  campus_name?: string;
  admin_first_name?: string;
}): string {
  return text
    .replace(/\{first_name\}/g, vars.first_name ?? "{first_name}")
    .replace(/\{organization_name\}/g, vars.organization_name ?? "{organization_name}")
    .replace(/\{campus_name\}/g, vars.campus_name ?? "{campus_name}")
    .replace(/\{admin_first_name\}/g, vars.admin_first_name ?? "{admin_first_name}");
}

/** Extract first name from a full name string. */
export function firstNameOf(fullName: string | null | undefined): string {
  if (!fullName) return "there";
  const trimmed = fullName.trim();
  if (!trimmed) return "there";
  return trimmed.split(/\s+/)[0];
}

// ── Day-0 intro emails ──────────────────────────────────────────────────

export function introEmail(ctx: TemplateContext): EmailDraft {
  const { stakeholder_type } = ctx;
  switch (stakeholder_type) {
    case "student_org":
      return {
        subject: `Paid clinical experience for ${PLACEHOLDER.orgName} members`,
        body: [
          `Hi ${PLACEHOLDER.firstName},`,
          ``,
          `I'm reaching out from Olera. We help pre-health students earn while building real patient-care experience — flexible hours, paid, and aligned with med/PA/nursing applications.`,
          ``,
          `Would ${PLACEHOLDER.orgName}'s members be interested? I've attached a one-pager you can pass around to officers or post in your group chat.`,
          ``,
          `Best,`,
          `${PLACEHOLDER.adminName}`,
          ``,
          SIGN_OFF,
        ].join("\n"),
      };
    case "advisor":
      return {
        subject: `A paid, resume-building option for ${PLACEHOLDER.campus} pre-health advisees`,
        body: [
          `Hi ${PLACEHOLDER.firstName},`,
          ``,
          `I'm with Olera. We connect pre-health students at ${PLACEHOLDER.campus} with paid caregiver work — meaningful patient-facing hours that strengthen med/PA/nursing applications.`,
          ``,
          `Attached is a short overview you could share with advisees. Happy to set up a quick 15-minute call if it's useful.`,
          ``,
          `Thanks for your time,`,
          `${PLACEHOLDER.adminName}`,
          ``,
          SIGN_OFF,
        ].join("\n"),
      };
    case "dept_head":
      return {
        subject: `Career-aligned employment opportunity for ${PLACEHOLDER.campus} pre-health students`,
        body: [
          `Dear ${PLACEHOLDER.firstName},`,
          ``,
          `I lead outreach at Olera. We provide paid caregiver positions tailored for pre-health students — flexible enough to work around coursework and directly relevant to clinical careers.`,
          ``,
          `Attached is a brief overview. With your approval I'd love to make this opportunity available to your students through whichever channel you prefer.`,
          ``,
          `Best regards,`,
          `${PLACEHOLDER.adminName}`,
          ``,
          SIGN_OFF,
        ].join("\n"),
      };
    case "professor":
      return {
        subject: `Paid clinical experience for ${PLACEHOLDER.campus} pre-health students`,
        body: [
          `Dear ${PLACEHOLDER.firstName},`,
          ``,
          `I'm reaching out from Olera with permission from your department. We offer paid caregiver work designed for pre-health students — flexible hours, real clinical exposure.`,
          ``,
          `Attached is a brief overview. Would you be open to forwarding it to your students?`,
          ``,
          `Thanks very much,`,
          `${PLACEHOLDER.adminName}`,
          ``,
          SIGN_OFF,
        ].join("\n"),
      };
  }
}

// ── Follow-up emails ────────────────────────────────────────────────────

export function followupLightEmail(_ctx: TemplateContext): EmailDraft {
  return {
    subject: `Re: paid clinical experience for {campus_name} students`,
    body: [
      `Hi ${PLACEHOLDER.firstName},`,
      ``,
      `Just bubbling this up in case it got buried. Happy to send a one-pager or jump on a 15-minute call — whichever is easier.`,
      ``,
      `Best,`,
      `${PLACEHOLDER.adminName}`,
      ``,
      SIGN_OFF,
    ].join("\n"),
  };
}

export function followupSocialProofEmail(_ctx: TemplateContext): EmailDraft {
  return {
    subject: `Re: paid clinical experience for {campus_name} students`,
    body: [
      `Hi ${PLACEHOLDER.firstName},`,
      ``,
      `Wanted to share a quick example: pre-health students at peer schools are picking up 8-15 hours a week alongside their coursework, with the kind of patient-facing experience that strengthens applications.`,
      ``,
      `If you'd like the materials to forward, just reply and I'll send them right over.`,
      ``,
      `Thanks,`,
      `${PLACEHOLDER.adminName}`,
      ``,
      SIGN_OFF,
    ].join("\n"),
  };
}

export function followupFinalEmail(_ctx: TemplateContext): EmailDraft {
  return {
    subject: `One last note — Olera for {campus_name} students`,
    body: [
      `Hi ${PLACEHOLDER.firstName},`,
      ``,
      `Closing the loop here. If now's not the right time, totally understand — I'll circle back next term. If it is, here's a one-line reply you can forward to students:`,
      ``,
      `>>> "Olera connects pre-health students with paid caregiver work that builds real clinical experience: https://olera.care/students"`,
      ``,
      `Either way, appreciate your time.`,
      ``,
      `${PLACEHOLDER.adminName}`,
      ``,
      SIGN_OFF,
    ].join("\n"),
  };
}

// ── Post-agreement & seasonal ───────────────────────────────────────────

export function postAgreedShareEmail(_ctx: TemplateContext): EmailDraft {
  return {
    subject: `Materials for your students — Olera`,
    body: [
      `Hi ${PLACEHOLDER.firstName},`,
      ``,
      `Thanks again for your willingness to share this with your students! Below is a short blurb plus a link they can use to learn more and apply:`,
      ``,
      `>>> Olera connects pre-health students with paid caregiver work — flexible hours,`,
      `    real patient experience, and aligned with med/PA/nursing applications.`,
      `    Learn more: https://olera.care/students`,
      ``,
      `If a longer version or PDF would be more useful, let me know and I'll send it.`,
      ``,
      `Appreciate it,`,
      `${PLACEHOLDER.adminName}`,
      ``,
      SIGN_OFF,
    ].join("\n"),
  };
}

export function partnerSeasonalEmail(_ctx: TemplateContext, season: string): EmailDraft {
  return {
    subject: `${season} update from Olera`,
    body: [
      `Hi ${PLACEHOLDER.firstName},`,
      ``,
      `Hope the term is off to a good start! Wanted to circle back as we head into ${season.toLowerCase().replace("pre-", "")} — would it be helpful to share an updated one-pager with your students this cycle?`,
      ``,
      `Happy to also share metrics from last term if useful.`,
      ``,
      `Best,`,
      `${PLACEHOLDER.adminName}`,
      ``,
      SIGN_OFF,
    ].join("\n"),
  };
}

// Backward-compat alias for callers still using the old name.
export const followupEmail = followupLightEmail;

// ── Call scripts (used in drawer; not sent anywhere) ────────────────────

export function callScript(ctx: TemplateContext, day: number): CallScript {
  if (day === 0) {
    return {
      title: "Day 0 — referenced email",
      script: [
        `"Hi, this is ${ctx.admin_first_name ?? "[your name]"} from Olera. I just sent an email about a paid clinical experience opportunity for ${ctx.campus_name} pre-health students — wanted to follow up live in case you have a quick question or two."`,
        ``,
        `If voicemail: leave name + callback number + reference the email.`,
        `If connected: ask if they have 2 minutes; if yes, walk through the value prop briefly and offer to send a one-pager.`,
      ].join("\n"),
    };
  }

  return {
    title: `Day ${day} follow-up`,
    script: [
      `"Hi, this is ${ctx.admin_first_name ?? "[your name]"} from Olera following up on my note about pre-health students at ${ctx.campus_name}. Wanted to see if you had a chance to take a look — happy to answer any questions."`,
    ].join("\n"),
  };
}

// ── Helper: mailto: URL builder (kept for compatibility) ────────────────

export function buildMailto(to: string, draft: EmailDraft): string {
  const params = new URLSearchParams({
    subject: draft.subject,
    body: draft.body,
  });
  return `mailto:${encodeURIComponent(to)}?${params.toString()}`;
}
