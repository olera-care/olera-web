/**
 * Email + call-script templates for student outreach.
 *
 * MVP: lightweight scaffolds only. Real copy will be iterated in PRs to
 * this single file. Each function returns plain text the admin can drop
 * into their own mail client via mailto: (or copy from a "Copy body"
 * button if the URL would be too long).
 */

import type { StakeholderType } from "./types";

const SIGN_OFF = "— Olera Team\nhttps://olera.care";

export interface EmailDraft {
  subject: string;
  body: string;
}

export interface CallScript {
  title: string;
  script: string;
}

interface BaseCtx {
  stakeholder_type: StakeholderType;
  organization_name: string;
  contact_first_name?: string;
  campus_name: string;
  admin_first_name?: string;
}

// ── Day-0 intro emails ──────────────────────────────────────────────────

export function introEmail(ctx: BaseCtx): EmailDraft {
  const first = ctx.contact_first_name ?? "there";
  const adminName = ctx.admin_first_name ?? "the Olera team";

  switch (ctx.stakeholder_type) {
    case "student_org":
      return {
        subject: `Paid clinical experience for your members at ${ctx.campus_name}`,
        body: [
          `Hi ${first},`,
          ``,
          `I'm reaching out from Olera. We help pre-health students earn while building real patient-care experience — flexible hours, paid, and aligned with their goals.`,
          ``,
          `Would your members be interested? Happy to share a one-pager you could pass around to officers or post in your group chat.`,
          ``,
          `Best,`,
          `${adminName}`,
          ``,
          SIGN_OFF,
        ].join("\n"),
      };

    case "advisor":
      return {
        subject: `A paid, resume-building option for your pre-health advisees`,
        body: [
          `Hi ${first},`,
          ``,
          `I'm with Olera. We connect pre-health students at ${ctx.campus_name} with paid caregiver work — meaningful patient-facing hours that strengthen med/PA/nursing applications.`,
          ``,
          `If it would be useful, I'd love to send a short overview you could share with advisees, or set up a 15-minute call.`,
          ``,
          `Thanks for your time,`,
          `${adminName}`,
          ``,
          SIGN_OFF,
        ].join("\n"),
      };

    case "dept_head":
      return {
        subject: `Career-aligned employment opportunity for ${ctx.campus_name} pre-health students`,
        body: [
          `Dear ${first},`,
          ``,
          `I lead outreach at Olera. We provide paid caregiver positions tailored for pre-health students — flexible enough to work around coursework and directly relevant to clinical careers.`,
          ``,
          `I'd appreciate the chance to share a brief overview with your department, and (with your approval) make this opportunity available to your students through whichever channel you prefer.`,
          ``,
          `Best regards,`,
          `${adminName}`,
          ``,
          SIGN_OFF,
        ].join("\n"),
      };

    case "professor":
      return {
        subject: `Paid clinical experience opportunity for your students`,
        body: [
          `Dear Professor ${ctx.organization_name.split(" ").pop() ?? ""},`,
          ``,
          `I'm reaching out from Olera with permission from your department. We offer paid caregiver work designed for pre-health students — flexible hours, real clinical exposure.`,
          ``,
          `Would you be open to forwarding a short note to your students, or letting me share materials you could pass along?`,
          ``,
          `Thanks very much,`,
          `${ctx.admin_first_name ?? "the Olera team"}`,
          ``,
          SIGN_OFF,
        ].join("\n"),
      };
  }
}

// ── Follow-up emails ────────────────────────────────────────────────────

export function followupEmail(ctx: BaseCtx, day: number): EmailDraft {
  const first = ctx.contact_first_name ?? "there";
  const adminName = ctx.admin_first_name ?? "the Olera team";

  if (day <= 5) {
    return {
      subject: `Re: paid clinical experience for ${ctx.campus_name} students`,
      body: [
        `Hi ${first},`,
        ``,
        `Just bubbling this up in case it got buried. Happy to send a one-pager or jump on a 15-minute call — whichever is easier.`,
        ``,
        `Best,`,
        `${adminName}`,
        ``,
        SIGN_OFF,
      ].join("\n"),
    };
  }

  // Day 7-10: social proof
  return {
    subject: `Re: paid clinical experience for ${ctx.campus_name} students`,
    body: [
      `Hi ${first},`,
      ``,
      `Wanted to share a quick example: pre-health students at peer schools have been picking up 8-15 hours a week alongside their coursework, with the kind of patient-facing experience that strengthens applications.`,
      ``,
      `If you'd like the materials to forward to your students, just reply and I'll send them right over.`,
      ``,
      `Thanks,`,
      `${adminName}`,
      ``,
      SIGN_OFF,
    ].join("\n"),
  };
}

// ── Post-agreement emails ───────────────────────────────────────────────

export function postAgreedShareEmail(ctx: BaseCtx): EmailDraft {
  const first = ctx.contact_first_name ?? "there";
  const adminName = ctx.admin_first_name ?? "the Olera team";

  return {
    subject: `Materials for your students — Olera`,
    body: [
      `Hi ${first},`,
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
      `${adminName}`,
      ``,
      SIGN_OFF,
    ].join("\n"),
  };
}

// ── Seasonal partner check-ins ──────────────────────────────────────────

export function partnerSeasonalEmail(ctx: BaseCtx, season: string): EmailDraft {
  const first = ctx.contact_first_name ?? "there";
  const adminName = ctx.admin_first_name ?? "the Olera team";

  return {
    subject: `${season} update from Olera`,
    body: [
      `Hi ${first},`,
      ``,
      `Hope the term is off to a good start! Wanted to circle back as we head into ${season.toLowerCase().replace("pre-", "")} — would it be helpful to share an updated one-pager with your students this cycle?`,
      ``,
      `Happy to also share metrics from last term if useful.`,
      ``,
      `Best,`,
      `${adminName}`,
      ``,
      SIGN_OFF,
    ].join("\n"),
  };
}

// ── Call scripts (used in drawer; not sent anywhere) ────────────────────

export function callScript(ctx: BaseCtx, day: number): CallScript {
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

// ── Helper: mailto: URL builder ─────────────────────────────────────────

export function buildMailto(to: string, draft: EmailDraft): string {
  const params = new URLSearchParams({
    subject: draft.subject,
    body: draft.body,
  });
  return `mailto:${encodeURIComponent(to)}?${params.toString()}`;
}
