/**
 * v9 final: outreach email + call templates.
 *
 * Tone principles (apply to every body in this file):
 *   - operational, direct, human
 *   - no em-dashes
 *   - no marketing flourishes ("real patient-facing experience",
 *     "flexible hours", "build your application")
 *   - simple, professional, relationship-oriented
 *
 * Structure:
 *   - Body is plain text with two markdown markers:
 *       **text**       → <strong>text</strong> on the HTML side,
 *                        plain text on the text side
 *       [label](url)   → <a href="url">label</a> on the HTML side,
 *                        "label: url" on the text side
 *     email-send.ts → bodyToHtml() handles both. Templates stay
 *     readable when admin previews them in PreFlight.
 *   - Footer (divider + STOP + "Message Approved by Dr. Logan
 *     DuBose, MD/MBA" + Logan signature block + Grazie signature
 *     block) is NOT in the template body. email-send.ts composes
 *     it once and appends to every send. Single source of truth.
 *
 * Variables (substituted by substituteVars):
 *   {salutation}            stakeholder-aware salutation (legacy)
 *   {first_name}            recipient's first name (named variant)
 *   {organization_name}     provider agency OR stakeholder org
 *   {campus_name}           campus / university
 *   {admin_first_name}      sender ("Grazie")
 *   {calendly_url}          15-min call booking link
 *   {program_url}           public program info page
 */

import type { Contact, StakeholderType } from "./types";
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
  /** Active named contacts on the outreach row. Provider general
   *  variant uses this for the optional leadership-team reference
   *  line; stakeholder paths ignore it. */
  contacts?: Contact[];
  /** Provider templates branch on this; stakeholder templates
   *  ignore it. */
  variant?: "general" | "named";
}

/**
 * 15-minute informational call booking link. Used as the primary
 * outreach CTA across every body.
 */
export const CALENDLY_URL =
  "https://calendly.com/caregivers979/home-care-agency-manager-interview";

/**
 * Public program info page. Lives in signatures + occasional body
 * mentions. Distinct purpose from the Calendly URL: this is the
 * "learn more" landing page, not the scheduling CTA.
 */
export const PROGRAM_URL = "https://olera.care/medjobs/providers";

const PLACEHOLDER = {
  firstName: "{first_name}",
  salutation: "{salutation}",
  orgName: "{organization_name}",
  campus: "{campus_name}",
  adminName: "{admin_first_name}",
  calendlyUrl: "{calendly_url}",
  programUrl: "{program_url}",
};

/**
 * Shared CTA line — appears as the last line of every email body
 * before the signature block. Markdown link syntax that
 * bodyToHtml() converts to <a href>.
 */
const SCHEDULE_CTA = `[Schedule a 15-minute informational call with Dr. Logan DuBose](${PLACEHOLDER.calendlyUrl})`;

// ── Public API ──────────────────────────────────────────────────────────

export function getTemplate(key: TemplateKey, ctx: TemplateContext): EmailDraft {
  switch (key) {
    case "intro": return introEmail(ctx);
    case "followup_light": return followupLightEmail(ctx);
    case "followup_socialproof": return followupSocialProofEmail(ctx);
    case "followup_final": return followupFinalEmail(ctx);
    case "share": return postAgreedShareEmail(ctx);
    case "seasonal": return partnerSeasonalEmail(ctx, "Pre-Fall");
    case "provider_intro": return providerIntroEmail(ctx, ctx.contacts);
    case "provider_followup": return providerFollowupEmail(ctx, ctx.contacts);
    case "provider_final": return providerFinalEmail(ctx, ctx.contacts);
  }
}

/**
 * v9 provider greeting for the GENERAL variant. Always "Hello,".
 * Named variant uses "Hi {first_name},".
 */
export function providerSalutation(_contacts: Contact[] | undefined): string {
  return "Hello,";
}

/**
 * Optional leadership-team reference line for the general variant.
 * Skips contacts tagged General Office / General Inbox + stale.
 */
export function providerLeadershipIntroLine(
  contacts: Contact[] | undefined,
): string | null {
  const named = (contacts ?? [])
    .filter((c) => c.status === "active")
    .filter((c) => c.role !== "General Office" && c.role !== "General Inbox")
    .map((c) => {
      const first = c.first_name?.trim() || "";
      const last = c.last_name?.trim() || "";
      return [first, last].filter(Boolean).join(" ").trim();
    })
    .filter((name) => name.length > 0);

  if (named.length === 0) return null;
  if (named.length === 1) {
    return `I am hoping to reach ${named[0]}, or another member of the leadership team.`;
  }
  const list =
    named.length === 2
      ? `${named[0]} or ${named[1]}`
      : `${named.slice(0, -1).join(", ")}, or ${named[named.length - 1]}`;
  return `I am hoping to reach ${list}, or another member of the leadership team.`;
}

/**
 * Substitute placeholders. Unmatched placeholders pass through so
 * PreFlight previews can show a partially-substituted draft.
 */
export function substituteVars(
  text: string,
  vars: {
    first_name?: string;
    salutation?: string;
    organization_name?: string;
    campus_name?: string;
    admin_first_name?: string;
    calendly_url?: string;
    program_url?: string;
  },
): string {
  return text
    .replace(/\{salutation\}/g, vars.salutation ?? vars.first_name ?? "{salutation}")
    .replace(/\{first_name\}/g, vars.first_name ?? "{first_name}")
    .replace(/\{organization_name\}/g, vars.organization_name ?? "{organization_name}")
    .replace(/\{campus_name\}/g, vars.campus_name ?? "{campus_name}")
    .replace(/\{admin_first_name\}/g, vars.admin_first_name ?? "{admin_first_name}")
    .replace(/\{calendly_url\}/g, vars.calendly_url ?? CALENDLY_URL)
    .replace(/\{program_url\}/g, vars.program_url ?? PROGRAM_URL);
}

export function firstNameOf(fullName: string | null | undefined): string {
  if (!fullName) return "there";
  const trimmed = fullName.trim();
  if (!trimmed) return "there";
  return trimmed.split(/\s+/)[0];
}

/**
 * Stakeholder-aware salutation:
 *   dept_head / professor with title  →  "Dr. Smith"
 *   dept_head / professor with last   →  "Smith"
 *   dept_head / professor with first  →  "Sarah"
 *   advisor / student_org             →  "Marcus"
 *   no name at all                    →  "there"
 */
export function salutationFor(
  stakeholder_type: StakeholderType,
  first_name: string | null | undefined,
  last_name: string | null | undefined,
  title: string | null | undefined,
): string {
  const first = first_name?.trim() || "";
  const last = last_name?.trim() || "";
  const t = title?.trim() || "";
  const isFormal = stakeholder_type === "dept_head" || stakeholder_type === "professor";
  if (isFormal) {
    if (t && last) return `${t} ${last}`;
    if (last) return last;
    if (first) return first;
    return "there";
  }
  return first || last || "there";
}

// ── Stakeholder intro emails (Day 0) ────────────────────────────────────

export function introEmail(ctx: TemplateContext): EmailDraft {
  const { stakeholder_type } = ctx;
  const greeting =
    stakeholder_type === "dept_head" || stakeholder_type === "professor"
      ? `Dear ${PLACEHOLDER.salutation},`
      : `Hi ${PLACEHOLDER.salutation},`;
  const subject = `${PLACEHOLDER.campus} Student Caregiver Program`;

  switch (stakeholder_type) {
    case "student_org":
      return {
        subject,
        body: [
          greeting,
          ``,
          `I work with Dr. Logan DuBose. He is an NIH-funded researcher, Texas A&M College of Medicine alum, and director of the ${PLACEHOLDER.campus} Student Caregiver Program.`,
          ``,
          `The program connects pre-nursing and pre-medical students from ${PLACEHOLDER.campus} with home care agencies for paid caregiving experience that supports their applications to medical, PA, or nursing school.`,
          ``,
          `**For ${PLACEHOLDER.orgName} members, this is a paid clinical opportunity that fits alongside coursework and gives them experience and recommendation letters relevant to health professions.**`,
          ``,
          `If this would be useful for your group, Dr. DuBose would be happy to share more on a quick 15-minute call. Please see the attached information packet for program details.`,
          ``,
          SCHEDULE_CTA,
        ].join("\n"),
      };
    case "advisor":
      return {
        subject,
        body: [
          greeting,
          ``,
          `I work with Dr. Logan DuBose. He is an NIH-funded researcher, Texas A&M College of Medicine alum, and director of the ${PLACEHOLDER.campus} Student Caregiver Program.`,
          ``,
          `The program connects pre-nursing and pre-medical students from ${PLACEHOLDER.campus} with home care agencies for paid caregiving experience that supports their applications to medical, PA, or nursing school.`,
          ``,
          `**For your pre-health advisees, this offers a paid clinical opportunity that fits alongside coursework and aligns with the experience that strengthens applications.**`,
          ``,
          `If this would be useful for your advisees, Dr. DuBose would be happy to share more on a quick 15-minute call. Please see the attached information packet for program details.`,
          ``,
          SCHEDULE_CTA,
        ].join("\n"),
      };
    case "dept_head":
      return {
        subject,
        body: [
          greeting,
          ``,
          `I work with Dr. Logan DuBose. He is an NIH-funded researcher, Texas A&M College of Medicine alum, and director of the ${PLACEHOLDER.campus} Student Caregiver Program.`,
          ``,
          `The program connects pre-nursing and pre-medical students from ${PLACEHOLDER.campus} with home care agencies for paid caregiving experience that supports their applications to medical, PA, or nursing school.`,
          ``,
          `**For students in your department, this is a paid clinical opportunity that fits alongside coursework and aligns with the experience that strengthens health professions applications.**`,
          ``,
          `With your approval, Dr. DuBose would be happy to share more about the program on a quick 15-minute call. Please see the attached information packet for program details.`,
          ``,
          SCHEDULE_CTA,
        ].join("\n"),
      };
    case "professor":
      return {
        subject,
        body: [
          greeting,
          ``,
          `I work with Dr. Logan DuBose. He is an NIH-funded researcher, Texas A&M College of Medicine alum, and director of the ${PLACEHOLDER.campus} Student Caregiver Program.`,
          ``,
          `The program connects pre-nursing and pre-medical students from ${PLACEHOLDER.campus} with home care agencies for paid caregiving experience that supports their applications to medical, PA, or nursing school.`,
          ``,
          `**For pre-health students in your courses, this is a paid clinical opportunity that fits alongside coursework and gives them experience and recommendation letters relevant to health professions.**`,
          ``,
          `If you would be open to forwarding this information to your students, Dr. DuBose would be happy to share more on a quick 15-minute call. Please see the attached information packet for program details.`,
          ``,
          SCHEDULE_CTA,
        ].join("\n"),
      };
  }
}

// ── Stakeholder follow-up emails ────────────────────────────────────────

export function followupLightEmail(_ctx: TemplateContext): EmailDraft {
  return {
    subject: `${PLACEHOLDER.campus} Student Caregiver Program`,
    body: [
      `Hi ${PLACEHOLDER.salutation},`,
      ``,
      `Just following up on my earlier note regarding Dr. Logan DuBose's ${PLACEHOLDER.campus} Student Caregiver Program.`,
      ``,
      `Dr. DuBose would be happy to share more on a quick 15-minute call, or we can continue the conversation over email. Please see the attached information packet with program details.`,
      ``,
      SCHEDULE_CTA,
    ].join("\n"),
  };
}

export function followupSocialProofEmail(_ctx: TemplateContext): EmailDraft {
  return {
    subject: `${PLACEHOLDER.campus} Student Caregiver Program`,
    body: [
      `Hi ${PLACEHOLDER.salutation},`,
      ``,
      `Following up on Dr. Logan DuBose's ${PLACEHOLDER.campus} Student Caregiver Program. Students at peer campuses are picking up paid caregiving hours alongside their coursework that supports their health professions applications.`,
      ``,
      `If you would like the program materials to share with your students or advisees, please reply and I will send them over. Dr. DuBose is also happy to share more on a quick 15-minute call.`,
      ``,
      SCHEDULE_CTA,
    ].join("\n"),
  };
}

export function followupFinalEmail(_ctx: TemplateContext): EmailDraft {
  return {
    subject: `${PLACEHOLDER.campus} Student Caregiver Program`,
    body: [
      `Hi ${PLACEHOLDER.salutation},`,
      ``,
      `Dr. Logan DuBose would be happy to share more about the ${PLACEHOLDER.campus} Student Caregiver Program if there is interest from your team.`,
      ``,
      `If now is not the right time, we appreciate your time and will circle back next term. If there is a better person at ${PLACEHOLDER.orgName} to coordinate with, we would be grateful for a redirect.`,
      ``,
      `Thank you for your time.`,
      ``,
      SCHEDULE_CTA,
    ].join("\n"),
  };
}

// ── Post-agreement & seasonal (stakeholder) ─────────────────────────────

export function postAgreedShareEmail(_ctx: TemplateContext): EmailDraft {
  return {
    subject: `Materials for your students — ${PLACEHOLDER.campus} Student Caregiver Program`,
    body: [
      `Hi ${PLACEHOLDER.salutation},`,
      ``,
      `Thank you for sharing the ${PLACEHOLDER.campus} Student Caregiver Program with your students. Below is a short blurb plus a link they can use to learn more and apply.`,
      ``,
      `Olera connects pre-nursing and pre-medical students with paid caregiving experience through home care agencies. Learn more and apply: [olera.care/students](${PLACEHOLDER.programUrl})`,
      ``,
      `If a longer version or PDF would be more useful, let me know and I will send it over.`,
    ].join("\n"),
  };
}

export function partnerSeasonalEmail(
  _ctx: TemplateContext,
  season: string,
): EmailDraft {
  return {
    subject: `${season} update — ${PLACEHOLDER.campus} Student Caregiver Program`,
    body: [
      `Hi ${PLACEHOLDER.salutation},`,
      ``,
      `Hope the term is off to a good start. Wanted to circle back as we head into ${season.toLowerCase().replace("pre-", "")}. Would it be helpful to share an updated information packet from Dr. DuBose's program with your students this cycle?`,
      ``,
      `Happy to also share metrics from last term if useful.`,
    ].join("\n"),
  };
}

// Backward-compat alias for callers still using the old name.
export const followupEmail = followupLightEmail;

// ── Provider outreach ───────────────────────────────────────────────────
//
// Audience: owner / hiring manager / hiring team at a home-care agency
// in a Site's catchment. {organization_name} is the agency;
// {campus_name} is the university whose students would be placed.

function generalIntroLines(contacts: Contact[] | undefined): string[] {
  const lines: string[] = [providerSalutation(contacts), ``];
  const leadership = providerLeadershipIntroLine(contacts);
  if (leadership) {
    lines.push(leadership, ``);
  }
  return lines;
}

export function providerIntroEmail(
  ctx: TemplateContext,
  contacts: Contact[] | undefined,
): EmailDraft {
  const variant = ctx.variant ?? "general";
  const subject = `${PLACEHOLDER.campus} Student Caregiver Program`;
  const greetingBlock =
    variant === "named"
      ? [`Hi ${PLACEHOLDER.firstName},`, ``]
      : generalIntroLines(contacts);
  return {
    subject,
    body: [
      ...greetingBlock,
      `I work with Dr. Logan DuBose. He is an NIH-funded researcher, Texas A&M College of Medicine alum, and director of the ${PLACEHOLDER.campus} Student Caregiver Program.`,
      ``,
      `We work with pre-nursing and pre-medical students from ${PLACEHOLDER.campus} who are interested in caregiving experience.`,
      ``,
      `**This program matches qualified college students with home care agencies to help fill vacant caregiver roles, PRN shifts, and staffing needs with reliable students who are often seeking experience and recommendation letters more than compensation.**`,
      ``,
      `We would like to invite ${PLACEHOLDER.orgName} to join the program and begin accepting students to supplement your caregiver workforce.`,
      ``,
      `If you are interested, you can reply directly to this email, continue the conversation with Dr. DuBose over email, or schedule a quick informational call with him directly. Please see the attached information packet with program details and agency participation information.`,
      ``,
      SCHEDULE_CTA,
    ].join("\n"),
  };
}

export function providerFollowupEmail(
  ctx: TemplateContext,
  contacts: Contact[] | undefined,
): EmailDraft {
  const variant = ctx.variant ?? "general";
  const subject = `${PLACEHOLDER.campus} Student Caregiver Program`;
  const greetingBlock =
    variant === "named"
      ? [`Hi ${PLACEHOLDER.firstName},`, ``]
      : generalIntroLines(contacts);
  return {
    subject,
    body: [
      ...greetingBlock,
      `Just following up on my earlier note and calls regarding Dr. Logan DuBose's ${PLACEHOLDER.campus} Student Caregiver Program.`,
      ``,
      `Dr. DuBose would be happy to share more about the program on a quick 15-minute call, or we are happy to continue the conversation over email. Please see the attached information packet with highlights about the program and how participation works for home care agencies.`,
      ``,
      SCHEDULE_CTA,
    ].join("\n"),
  };
}

export function providerFinalEmail(
  ctx: TemplateContext,
  contacts: Contact[] | undefined,
): EmailDraft {
  const variant = ctx.variant ?? "general";
  const subject = `${PLACEHOLDER.campus} Student Caregiver Program`;
  const greetingBlock =
    variant === "named"
      ? [`Hi ${PLACEHOLDER.firstName},`, ``]
      : generalIntroLines(contacts);
  return {
    subject,
    body: [
      ...greetingBlock,
      `Dr. Logan DuBose would be happy to share more about the ${PLACEHOLDER.campus} Student Caregiver Program.`,
      ``,
      `If there is interest from your leadership team, this program can help supplement your caregiver workforce, fill vacant shifts, and improve client engagement with qualified pre-nursing and pre-medical students vetted by our team and referred to agencies for hire.`,
      ``,
      `If there is a better person for us to speak with regarding caregiver hiring at ${PLACEHOLDER.orgName}, we are also happy to reach out to them directly.`,
      ``,
      `Thank you for your time. Please see the attached program information and agency participation details.`,
      ``,
      SCHEDULE_CTA,
    ].join("\n"),
  };
}

// ── Call scripts (used in drawer; not sent anywhere) ────────────────────
// Note: sequencer.ts → defaultCallScriptForDay carries the canonical
// per-day scripts used by PreFlight. This callScript() entry point is
// kept for legacy callers (drawer mount-time display).

export function callScript(ctx: TemplateContext, day: number): CallScript {
  if (day === 0) {
    return {
      title: "Day 0 — referenced email",
      script: [
        `"Hi, this is ${ctx.admin_first_name ?? "Grazie"} calling on behalf of Dr. Logan DuBose regarding Olera's ${ctx.campus_name} Student Caregiver Program."`,
        ``,
        `"We wanted to share information about a program that connects qualified pre-nursing and pre-medical students with home care agencies to help supplement caregiver workforce and staffing needs."`,
      ].join("\n"),
    };
  }
  return {
    title: `Day ${day} follow-up`,
    script: [
      `"Hi, this is ${ctx.admin_first_name ?? "Grazie"} from the ${ctx.campus_name} Student Caregiver Program, following up on prior outreach. Hoping to connect with whoever handles caregiver hiring."`,
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
