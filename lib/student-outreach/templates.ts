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
 * Inline call-scheduling phrases. Embedded into the closing
 * sentence of each template rather than rendered as a standalone
 * CTA line — keeps the email reading like a personal note from
 * Grazie, not a marketing template. The label varies by context
 * (Day-0 intros name Dr. DuBose explicitly; follow-ups stay
 * shorter + conversational); bodyToHtml turns the markdown link
 * into a clickable inline <a href>.
 */
const SCHEDULE_LINK_FULL = `[schedule a quick informational call with Dr. Logan DuBose directly](${PLACEHOLDER.calendlyUrl})`;
const SCHEDULE_LINK_LONG = `[schedule a quick informational call with him directly](${PLACEHOLDER.calendlyUrl})`;
const SCHEDULE_LINK_SHORT = `[share more on a quick call](${PLACEHOLDER.calendlyUrl})`;
/** Closing "see attached + website" reference. Linked phrase points
 *  to the public program page. */
const ATTACHED_AND_SITE = `Please see the attached information and [website page](${PLACEHOLDER.programUrl}) for details on how ${PLACEHOLDER.orgName} can participate.`;

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
          `We came across ${PLACEHOLDER.orgName} while identifying pre-health student groups at ${PLACEHOLDER.campus} that might be interested in the ${PLACEHOLDER.campus} Student Caregiver Program.`,
          ``,
          `We would like to share the program with your members, who may benefit from paid caregiving roles that strengthen their applications to medical, PA, or nursing school.`,
          ``,
          `The program is directed by Dr. Logan DuBose, an NIH-funded researcher and Texas A&M College of Medicine alum.`,
          ``,
          `**Through the program, Olera connects ${PLACEHOLDER.campus} pre-nursing and pre-medical students with local home care agencies for paid caregiving roles. The students gain direct patient-care hours, mentorship, and recommendation letters that support the health professions pathway.**`,
          ``,
          `You can reply directly to this email or Dr. DuBose is happy to ${SCHEDULE_LINK_SHORT}. Please see the attached information packet for program details.`,
        ].join("\n"),
      };
    case "advisor":
      return {
        subject,
        body: [
          greeting,
          ``,
          `We came across your office while identifying pre-health advisors at ${PLACEHOLDER.campus} who might find the ${PLACEHOLDER.campus} Student Caregiver Program useful for their advisees.`,
          ``,
          `We would like to share the program with your office so it can be passed along to pre-health advisees pursuing professional school pathways.`,
          ``,
          `The program is directed by Dr. Logan DuBose, an NIH-funded researcher and Texas A&M College of Medicine alum.`,
          ``,
          `**Through the program, Olera connects ${PLACEHOLDER.campus} pre-nursing and pre-medical students with local home care agencies for paid caregiving roles. The students gain direct patient-care hours, mentorship, and recommendation letters that strengthen applications to medical, PA, or nursing school.**`,
          ``,
          `You can reply directly to this email or Dr. DuBose is happy to ${SCHEDULE_LINK_SHORT}. Please see the attached information packet for program details.`,
        ].join("\n"),
      };
    case "dept_head":
      return {
        subject,
        body: [
          greeting,
          ``,
          `We came across your department while identifying pre-health programs at ${PLACEHOLDER.campus} that might find the ${PLACEHOLDER.campus} Student Caregiver Program useful for their students.`,
          ``,
          `We would like to share the program with your department so it can be passed along to students preparing for professional school.`,
          ``,
          `The program is directed by Dr. Logan DuBose, an NIH-funded researcher and Texas A&M College of Medicine alum.`,
          ``,
          `**Through the program, Olera connects ${PLACEHOLDER.campus} pre-nursing and pre-medical students with local home care agencies for paid caregiving roles. The students gain direct patient-care hours, mentorship, and recommendation letters that strengthen applications to medical, PA, or nursing school.**`,
          ``,
          `With your approval, Dr. DuBose is happy to ${SCHEDULE_LINK_SHORT}. Please see the attached information packet for program details.`,
        ].join("\n"),
      };
    case "professor":
      return {
        subject,
        body: [
          greeting,
          ``,
          `We came across your courses while identifying pre-health faculty at ${PLACEHOLDER.campus} whose students might be interested in the ${PLACEHOLDER.campus} Student Caregiver Program.`,
          ``,
          `We would like to share the program with you so it can be forwarded to pre-health students in your courses.`,
          ``,
          `The program is directed by Dr. Logan DuBose, an NIH-funded researcher and Texas A&M College of Medicine alum.`,
          ``,
          `**Through the program, Olera connects ${PLACEHOLDER.campus} pre-nursing and pre-medical students with local home care agencies for paid caregiving roles. The students gain direct patient-care hours, mentorship, and recommendation letters that strengthen applications to medical, PA, or nursing school.**`,
          ``,
          `If you would be open to forwarding this information to your students, Dr. DuBose is happy to ${SCHEDULE_LINK_SHORT}. Please see the attached information packet for program details.`,
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
      `Following up on my earlier note about the ${PLACEHOLDER.campus} Student Caregiver Program.`,
      ``,
      `You can reply directly to this email or Dr. DuBose is happy to ${SCHEDULE_LINK_SHORT}. The attached information packet covers how the program works.`,
    ].join("\n"),
  };
}

export function followupSocialProofEmail(_ctx: TemplateContext): EmailDraft {
  return {
    subject: `${PLACEHOLDER.campus} Student Caregiver Program`,
    body: [
      `Hi ${PLACEHOLDER.salutation},`,
      ``,
      `Following up on the ${PLACEHOLDER.campus} Student Caregiver Program. Students at peer campuses are picking up paid caregiving hours alongside their coursework, with direct patient-care experience and recommendation letters that support their health professions applications.`,
      ``,
      `If you would like the program materials to share with your students or advisees, you can reply directly to this email. Dr. DuBose is also happy to ${SCHEDULE_LINK_SHORT}.`,
    ].join("\n"),
  };
}

export function followupFinalEmail(_ctx: TemplateContext): EmailDraft {
  return {
    subject: `${PLACEHOLDER.campus} Student Caregiver Program`,
    body: [
      `Hi ${PLACEHOLDER.salutation},`,
      ``,
      `Circling back one last time on the ${PLACEHOLDER.campus} Student Caregiver Program. If there is interest from your team, you can reply directly to this email or Dr. DuBose is happy to ${SCHEDULE_LINK_SHORT}.`,
      ``,
      `If now is not the right time, we will circle back next term. If there is a better person at ${PLACEHOLDER.orgName} to coordinate with, we would be grateful for a redirect.`,
      ``,
      `Thank you for your time.`,
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
      `We came across ${PLACEHOLDER.orgName} through your website while identifying home care agencies near ${PLACEHOLDER.campus} to invite into the ${PLACEHOLDER.campus} Student Caregiver Program.`,
      ``,
      `We would like to invite ${PLACEHOLDER.orgName} to join the program and begin receiving student referrals to help fill vacant caregiver roles, PRN shifts, and staffing needs.`,
      ``,
      `The program is directed by Dr. Logan DuBose, an NIH-funded researcher and Texas A&M College of Medicine alum.`,
      ``,
      `**Through the program, Olera matches ${PLACEHOLDER.campus} pre-nursing and pre-medical students with local home care agencies. The students are reliable, motivated by clinical experience and recommendation letters more than compensation, and pursuing professional school pathways that depend on direct patient-care hours.**`,
      ``,
      `You can reply directly to this email or ${SCHEDULE_LINK_FULL}. ${ATTACHED_AND_SITE}`,
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
      `Following up on my earlier note about the ${PLACEHOLDER.campus} Student Caregiver Program. The program can help ${PLACEHOLDER.orgName} fill vacant caregiver roles and PRN shifts with reliable pre-health students from ${PLACEHOLDER.campus}.`,
      ``,
      `You can reply directly to this email or ${SCHEDULE_LINK_LONG}. ${ATTACHED_AND_SITE}`,
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
      `Circling back one more time on the ${PLACEHOLDER.campus} Student Caregiver Program. If ${PLACEHOLDER.orgName} is interested in receiving student referrals to help fill vacant caregiver roles and PRN shifts, you can reply directly to this email or ${SCHEDULE_LINK_LONG}.`,
      ``,
      `If now is not the right time, we appreciate your consideration and will circle back next term. If there is a better person at ${PLACEHOLDER.orgName} for us to reach regarding caregiver hiring, we would be grateful for a redirect.`,
      ``,
      `Thank you for your time. ${ATTACHED_AND_SITE}`,
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
        `"Hi, this is ${ctx.admin_first_name ?? "Grazie"} calling on behalf of Dr. Logan DuBose regarding the ${ctx.campus_name} Student Caregiver Program."`,
        ``,
        `"We came across ${ctx.organization_name} while identifying home care agencies near ${ctx.campus_name} to invite into the program. The program matches ${ctx.campus_name} pre-health students with home care agencies to help fill vacant caregiver roles and PRN shifts."`,
      ].join("\n"),
    };
  }
  return {
    title: `Day ${day} follow-up`,
    script: [
      `"Hi, this is ${ctx.admin_first_name ?? "Grazie"} from the ${ctx.campus_name} Student Caregiver Program, following up on prior outreach. Hoping to connect with whoever handles caregiver hiring at ${ctx.organization_name}."`,
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
