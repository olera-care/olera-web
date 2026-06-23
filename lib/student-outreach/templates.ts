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
 * Framing: the offering is "Olera's {campus} Student Caregiver Program"
 * (NOT an "internship"). It is paid caregiving work for pre-health students
 * with home care agencies. Use the programName() helper for the name so it
 * never drifts again.
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
 *     DuBose, MD/MBA" + Logan signature block + Graize signature
 *     block) is NOT in the template body. email-send.ts composes
 *     it once and appends to every send. Single source of truth.
 *
 * Variables (substituted by substituteVars):
 *   {salutation}            stakeholder-aware salutation (legacy)
 *   {first_name}            recipient's first name (named variant)
 *   {organization_name}     provider agency OR stakeholder org
 *   {campus_name}           campus / university
 *   {admin_first_name}      sender ("Graize")
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
  /** Activation copy audience: providers (hire students) vs partners /
   *  advisors (circulate the flyer, meet Dr. DuBose, join the partner network).
   *  Defaults to provider when omitted. */
  is_partner?: boolean;
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

/**
 * Canonical program name. Single source of truth so the framing never drifts
 * back to "internship".
 *
 * The university name is deliberately NOT part of the brand. Possessive
 * framing like "Olera's <University> Student Caregiver Program" implies the
 * university runs or endorses the program, which it doesn't — a trademark /
 * false-affiliation risk for a public university's protected name. The campus
 * is referenced descriptively in body copy instead ("students near
 * <campus>"), which keeps the name legally clean while staying personal.
 */
export function programName(): string {
  return "Olera's Student Caregiver Program";
}

const PLACEHOLDER = {
  firstName: "{first_name}",
  salutation: "{salutation}",
  orgName: "{organization_name}",
  campus: "{campus_name}",
  adminName: "{admin_first_name}",
  calendlyUrl: "{calendly_url}",
  programUrl: "{program_url}",
  /** v10 Phase 2+3 Bullet 6 (2026-06-04): per-recipient magic-link URL
   *  pointing at the candidate board. Substituted at email-render time
   *  via buildWelcomeUrl() in welcome-token.ts. Falls back to the
   *  PROGRAM_URL when the welcome URL isn't available (preview / legacy). */
  welcomeUrl: "{welcome_url}",
  /** Campus-specific program PDF (/api/medjobs/program-pdf?university=<slug>).
   *  Filled per-campaign in toSmartleadHtml from the campus slug; falls back to
   *  PROGRAM_URL on the Resend/preview path (no slug there). */
  programPdf: "{program_pdf}",
  /** Canonical student apply link, personalized per-partner (campus + that
   *  row's outreach id) via the per-lead {{apply_url}} Smartlead merge tag set
   *  in rowToLeads. Applies through it trace back to the org that shared it. */
  applyUrl: "{apply_url}",
};

/** Canonical program name (no university name baked in — see programName). */
const PROGRAM_NAME = programName();

/** Uniform subject for every activation-cadence email (provider + partner).
 *  Matches the cold-cadence follow-up subject so the warm emails thread with
 *  what the recipient already received. */
const ACTIVATION_SUBJECT = `Follow Up: Student Caregiver Program for ${PLACEHOLDER.campus} students`;

// Subjects for the cold cadences. Intro touches use the base; every follow-up
// prefixes "Follow Up:". {campus_name} substitutes at send time.
const SUBJECT_INTRO = `Student Caregiver Program for ${PLACEHOLDER.campus} students`;
const SUBJECT_FOLLOWUP = `Follow Up: Student Caregiver Program for ${PLACEHOLDER.campus} students`;

// Audience landing pages for the in-body program link. The flyer link next to
// it uses the audience-aware {program_pdf} token (filled per send).
export const CANDIDATES_URL = "https://olera.care/medjobs/candidates"; // providers
// Per-lead provider board link placeholder (Chunk 5). smartlead-bridge
// substitutes it with the public board URL carrying
// ?outreach_id={{outreach_id}}&screener=1 so a cold click pre-locks the
// eligibility screener to the provider's OWN directory listing — they claim it
// instead of accidentally creating a duplicate. Plain ref, no auth token (cold
// emails stay deliverability-safe).
const PROVIDER_BOARD_URL = "{board_url}";
const FAMILIES_URL = "https://olera.care/medjobs/families"; // student orgs
const FAMILIES_ADVISORS_URL = "https://olera.care/medjobs/families#help"; // advisors + dept heads (existing "For advisors, faculty & student orgs" section)

/**
 * The in-body program reference: the program name linked to its audience
 * landing page, with a "(flyer)" link to the audience-appropriate PDF right
 * after it. Used everywhere a body says "Student Caregiver Program for
 * {campus} students".
 */
function programLink(landingUrl: string): string {
  return `[Student Caregiver Program for ${PLACEHOLDER.campus} students](${landingUrl}) ([flyer](${PLACEHOLDER.programPdf}))`;
}

/**
 * Audience-aware program landing page for a partner stakeholder, so activation
 * emails point to the same page the recipient saw in the cold cadence: student
 * orgs land on the families page, advisors + dept heads on the "For advisors,
 * faculty & student orgs" section.
 */
function partnerLandingUrl(type: StakeholderType): string {
  return type === "student_org" ? FAMILIES_URL : FAMILIES_ADVISORS_URL;
}

/**
 * Inline call-scheduling phrases. Embedded into the closing
 * sentence of each template rather than rendered as a standalone
 * CTA line — keeps the email reading like a personal note from
 * Graize, not a marketing template. The label varies by context
 * (Day-0 intros name Dr. DuBose explicitly; follow-ups stay
 * shorter + conversational); bodyToHtml turns the markdown link
 * into a clickable inline <a href>.
 *
 * Single body link policy: the email body never references the
 * public program URL inline. The program page lives in the Logan
 * signature block (footer architecture) so the body has at most
 * one outbound link — the Calendly CTA. Recipients don't get
 * link-overloaded; the signature carries the rest.
 */
// Stakeholder follow-ups use this short, conversational call link inline.
const SCHEDULE_LINK_SHORT = `[share more on a quick call](${PLACEHOLDER.calendlyUrl})`;

/**
 * Graize self-introduction line used by the stakeholder (academic-audience)
 * templates. Provider templates now use their own simpler intro inline.
 */
const GRAIZE_INTRO = `My name is Graize Belandres, and I'm a research assistant working with Dr. Logan DuBose, MD, MBA, an NIH-funded researcher and Texas A&M College of Medicine alum.`;

// ── Public API ──────────────────────────────────────────────────────────

export function getTemplate(key: TemplateKey, ctx: TemplateContext): EmailDraft {
  switch (key) {
    case "intro": return introEmail(ctx);
    case "followup_light": return followupLightEmail(ctx);
    case "followup_socialproof": return followupSocialProofEmail(ctx);
    case "followup_final": return followupFinalEmail(ctx);
    case "advisor_bump": return advisorBumpEmail(ctx);
    case "advisor_info": return advisorInfoEmail(ctx);
    case "advisor_nudge": return advisorNudgeEmail(ctx);
    case "advisor_close": return advisorCloseEmail(ctx);
    case "org_bump": return orgBumpEmail(ctx);
    case "org_followup": return orgFollowupEmail(ctx);
    case "org_close": return orgCloseEmail(ctx);
    case "dept_bump": return deptHeadBumpEmail(ctx);
    case "dept_followup": return deptHeadFollowupEmail(ctx);
    case "dept_close": return deptHeadCloseEmail(ctx);
    case "share": return postAgreedShareEmail(ctx);
    case "seasonal": return partnerSeasonalEmail(ctx, "Pre-Fall");
    case "provider_intro": return providerIntroEmail(ctx, ctx.contacts);
    case "provider_followup": return providerFollowupEmail(ctx, ctx.contacts);
    case "provider_final": return providerFinalEmail(ctx, ctx.contacts);
    case "activation_intro": return activationIntroEmail(ctx);
    case "activation_nudge": return activationNudgeEmail(ctx);
    case "activation_final": return activationFinalEmail(ctx);
    case "partner_welcome_intro": return partnerWelcomeIntroEmail(ctx);
    case "partner_welcome_checkin": return partnerWelcomeCheckinEmail(ctx);
    case "partner_welcome_planning": return partnerWelcomePlanningEmail(ctx);
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
 * Optional leadership-team invitation phrase for the general
 * variant. Returns a fragment without trailing punctuation so it
 * can be woven inline into the invitation sentence ("I'm hoping
 * to reach Jim David, or another member of the leadership team,
 * to invite {organization_name} to join Olera's..."). Skips
 * contacts tagged General Office / General Inbox + stale rows.
 *
 * Returns null when no named leadership contacts are on the
 * outreach row — callers fall back to a plain "I'd like to invite
 * {organization_name}..." opening.
 */
function providerLeadershipInvitationPhrase(
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
    return `I'm hoping to reach ${named[0]}, or another member of the leadership team`;
  }
  const list =
    named.length === 2
      ? `${named[0]} or ${named[1]}`
      : `${named.slice(0, -1).join(", ")}, or ${named[named.length - 1]}`;
  return `I'm hoping to reach ${list}, or another member of the leadership team`;
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
    /** v10 Phase 2+3 Bullet 6: per-recipient magic-link URL. */
    welcome_url?: string;
    /** Campus program PDF URL. */
    program_pdf?: string;
    /** Canonical student apply link (per-partner). */
    apply_url?: string;
  },
): string {
  return text
    .replace(/\{program_pdf\}/g, vars.program_pdf ?? PROGRAM_URL)
    .replace(/\{apply_url\}/g, vars.apply_url ?? "https://olera.care/medjobs/families?screener=1")
    .replace(/\{salutation\}/g, vars.salutation ?? vars.first_name ?? "{salutation}")
    .replace(/\{first_name\}/g, vars.first_name ?? "{first_name}")
    .replace(/\{organization_name\}/g, vars.organization_name ?? "{organization_name}")
    .replace(/\{campus_name\}/g, vars.campus_name ?? "{campus_name}")
    .replace(/\{admin_first_name\}/g, vars.admin_first_name ?? "{admin_first_name}")
    .replace(/\{calendly_url\}/g, vars.calendly_url ?? CALENDLY_URL)
    .replace(/\{program_url\}/g, vars.program_url ?? PROGRAM_URL)
    // Welcome URL falls back to PROGRAM_URL when the magic-link secret
    // isn't configured (preview rendering, dev environments) so the email
    // still has a working link.
    .replace(/\{welcome_url\}/g, vars.welcome_url ?? PROGRAM_URL);
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

/**
 * Stakeholder intros — same Graize-first flow as provider intros,
 * but the value-prop reframes for an academic audience (student
 * opportunity, not staffing relief). Salutation is formal (Dear)
 * for dept_head + professor; friendly (Hi) for student_org +
 * advisor. Closing uses a softened version of the provider CTA
 * ("We hope you'll consider..." instead of "accept this
 * invitation") because stakeholders are being asked to share the
 * program with students, not enroll their organization.
 */
export function introEmail(ctx: TemplateContext): EmailDraft {
  const { stakeholder_type } = ctx;
  const greeting =
    stakeholder_type === "dept_head" || stakeholder_type === "professor"
      ? `Dear ${PLACEHOLDER.salutation},`
      : `Hi ${PLACEHOLDER.salutation},`;
  const subject = PROGRAM_NAME;
  const programExplanation = `**This program matches ${PLACEHOLDER.campus} pre-nursing and pre-medical students with local home care agencies for paid caregiver roles that fit alongside coursework.** Students gain hands-on experience working with clients, mentorship, and recommendation letters that strengthen their applications to medical, PA, and nursing school.`;
  const packetLine = `The attached information packet has the program details.`;
  // Portal magic-link CTA (#5): lets a partner self-serve from email one —
  // learn more, share the flyer, add colleagues/events, or confirm partnership.
  const portalLine = `You can also open our partner portal to see the program, share the flyer with students, and tell us how you'd like to help: [open the partner portal]({welcome_url}).`;

  switch (stakeholder_type) {
    case "student_org":
      return {
        subject: SUBJECT_INTRO,
        body: [
          greeting,
          ``,
          `I'm Graize, research assistant to Dr. Logan DuBose, reaching out regarding the ${programLink(FAMILIES_URL)}. This program places pre-health students in paid caregiver roles with older adults in the community to help them get hands-on caregiving hours, recommendation letters, and experience that strengthens their med, PA, and nursing applications.`,
          ``,
          `Your members are exactly who it's for, and Dr. DuBose and I are hoping to share it with pre-health groups like yours. If you're open to it, just reply with your general interest level and we can follow up with more information and possibly a time for Dr. DuBose to speak with your members.`,
          ``,
          `Thanks for looking out for your members.`,
        ].join("\n"),
      };
    case "advisor":
      return {
        subject: SUBJECT_INTRO,
        body: [
          greeting,
          ``,
          `I'm Graize, research assistant to Dr. Logan DuBose, reaching out regarding the ${programLink(FAMILIES_ADVISORS_URL)}. This program places pre-health students in paid caregiver roles with older adults in the community to help them get hands-on caregiving hours, recommendation letters, and experience that strengthens their med, PA, and nursing applications.`,
          ``,
          `Dr. DuBose and I are hoping to talk about the program with the ${PLACEHOLDER.campus} advisors that pre-health students turn to for advice on getting into medical or nursing school. If you're open to it, just reply with your general interest level and we can follow up with more information and possibly a couple of times that work this week or next for a Zoom call.`,
          ``,
          `Thank you for looking into this program for your students.`,
        ].join("\n"),
      };
    case "dept_head":
      return {
        subject: SUBJECT_INTRO,
        body: [
          greeting,
          ``,
          `I'm Graize, research assistant to Dr. Logan DuBose, reaching out regarding the ${programLink(FAMILIES_ADVISORS_URL)}. This program places pre-health students in paid caregiver roles with older adults in the community to help them get hands-on caregiving hours, recommendation letters, and experience that strengthens their med, PA, and nursing applications.`,
          ``,
          `I'm reaching out to you as the head of your department because your students are among those it would serve. Dr. DuBose and I would value the chance to talk it through with you and learn how we may connect with your faculty and students about it. If you're open to it, just reply with your general interest level and we can follow up with more information and possibly a short Zoom this week or next.`,
          ``,
          `Thank you for looking into this program for your students.`,
        ].join("\n"),
      };
    case "professor":
      return {
        subject,
        body: [
          greeting,
          ``,
          GRAIZE_INTRO,
          ``,
          `I came across your courses while identifying pre-health faculty at ${PLACEHOLDER.campus} whose students might be interested in ${PROGRAM_NAME}.`,
          ``,
          programExplanation,
          ``,
          `If you'd be open to forwarding this to interested students, we'd be grateful. For more information first, you can reply directly to this email, or Dr. DuBose is happy to ${SCHEDULE_LINK_SHORT}.`,
          ``,
          portalLine,
          ``,
          packetLine,
        ].join("\n"),
      };
  }
}

// ── Stakeholder follow-up emails ────────────────────────────────────────

export function followupLightEmail(_ctx: TemplateContext): EmailDraft {
  return {
    subject: PROGRAM_NAME,
    body: [
      `Hi ${PLACEHOLDER.salutation},`,
      ``,
      `Just following up on my note from earlier this week, in case it got buried.`,
      ``,
      `If ${PROGRAM_NAME} could be useful for your students or advisees and you'd like more information, you can reply directly to this email, or Dr. DuBose is happy to ${SCHEDULE_LINK_SHORT}.`,
      ``,
      `The attached information packet covers how it works.`,
    ].join("\n"),
  };
}

export function followupSocialProofEmail(_ctx: TemplateContext): EmailDraft {
  return {
    subject: PROGRAM_NAME,
    body: [
      `Hi ${PLACEHOLDER.salutation},`,
      ``,
      `Following up on ${PROGRAM_NAME}. Pre-health students at peer campuses are picking up paid caregiver hours alongside coursework, giving them hands-on experience and recommendation letters that strengthen their applications to professional school.`,
      ``,
      `If you'd like the program materials to share with your students or advisees, just reply and I'll send them over. Dr. DuBose is also happy to ${SCHEDULE_LINK_SHORT} if more information would help.`,
    ].join("\n"),
  };
}

export function followupFinalEmail(_ctx: TemplateContext): EmailDraft {
  return {
    subject: PROGRAM_NAME,
    body: [
      `Hi ${PLACEHOLDER.salutation},`,
      ``,
      `Wanted to circle back one last time on ${PROGRAM_NAME}. If there's interest from your team and you'd like more information, you can reply directly to this email, or Dr. DuBose is happy to ${SCHEDULE_LINK_SHORT}.`,
      ``,
      `If now isn't the right time, no worries; we'll check back next term. If there's a better person at ${PLACEHOLDER.orgName} to coordinate with, we'd appreciate a redirect.`,
      ``,
      `Thanks for your time.`,
    ].join("\n"),
  };
}

// ── Advisor relationship-first cadence (meeting-led) ────────────────────
// Each email stands alone (no narrative threading). The cold ask is a soft
// "reply with your interest level"; details + a Zoom follow once they bite.

/** Touch 2 — standalone bump. */
export function advisorBumpEmail(_ctx: TemplateContext): EmailDraft {
  return {
    subject: SUBJECT_FOLLOWUP,
    body: [
      `Hi ${PLACEHOLDER.salutation},`,
      ``,
      `Following up. Dr. DuBose and I would still love to talk with you about the ${programLink(FAMILIES_ADVISORS_URL)}. If you're open to it, just reply with your general interest level and we'll follow up with more information.`,
    ].join("\n"),
  };
}

/** Touch 3 — program info (paired with the Day-6 intro call). */
export function advisorInfoEmail(_ctx: TemplateContext): EmailDraft {
  return {
    subject: SUBJECT_FOLLOWUP,
    body: [
      `Hi ${PLACEHOLDER.salutation},`,
      ``,
      `Following up. The ${programLink(FAMILIES_ADVISORS_URL)} places pre-health students in paid caregiver roles with older adults, so they earn hands-on caregiving hours, recommendation letters, and experience that strengthens their med, PA, and nursing applications.`,
      ``,
      `If this could be useful for the students you advise, just reply with your interest level and we can set up a quick Zoom with Dr. DuBose to talk it through.`,
    ].join("\n"),
  };
}

/** Touch 4 — short, standalone nudge. */
export function advisorNudgeEmail(_ctx: TemplateContext): EmailDraft {
  return {
    subject: SUBJECT_FOLLOWUP,
    body: [
      `Hi ${PLACEHOLDER.salutation},`,
      ``,
      `We have room for more ${PLACEHOLDER.campus} pre-health students in the program this term. If it could help the students you advise, just reply with your interest level and Dr. DuBose and I will follow up with more information and a time to talk.`,
    ].join("\n"),
  };
}

/** Touch 5 — gracious, standalone close that reopens by season. */
export function advisorCloseEmail(_ctx: TemplateContext): EmailDraft {
  return {
    subject: SUBJECT_FOLLOWUP,
    body: [
      `Hi ${PLACEHOLDER.salutation},`,
      ``,
      `We'd still love to support your ${PLACEHOLDER.campus} pre-health students through the program, so just reply anytime with your interest level and we'll take it from there.`,
      ``,
      `And if someone else advises pre-health students at ${PLACEHOLDER.campus}, a quick forward to them would be appreciated. Thank you.`,
    ].join("\n"),
  };
}

// ── Student-org cadence (relationship-first, reply-with-interest) ────────
// Each email stands alone. The cold ask is a soft "reply with your interest
// level"; the unique apply link + a meeting slot for Dr. DuBose follow once
// the org engages, so applies still trace to that org.

/** Touch 2 — standalone bump. */
export function orgBumpEmail(_ctx: TemplateContext): EmailDraft {
  return {
    subject: SUBJECT_FOLLOWUP,
    body: [
      `Hi ${PLACEHOLDER.salutation},`,
      ``,
      `Following up. Dr. DuBose and I would still love to share the ${programLink(FAMILIES_URL)} with your members. If you're open to it, just reply with your general interest level and we'll follow up with more information.`,
    ].join("\n"),
  };
}

/** Touch 3 — follow-up (paired with the Day-6 call when a phone exists). */
export function orgFollowupEmail(_ctx: TemplateContext): EmailDraft {
  return {
    subject: SUBJECT_FOLLOWUP,
    body: [
      `Hi ${PLACEHOLDER.salutation},`,
      ``,
      `Following up. The ${programLink(FAMILIES_URL)} places pre-health students in paid caregiver roles with older adults, so they earn hands-on caregiving hours, recommendation letters, and experience that strengthens their med, PA, and nursing applications.`,
      ``,
      `If your members would be interested, just reply with your interest level and we can set up a time for Dr. DuBose to share it with your group, or a quick call to talk it through.`,
    ].join("\n"),
  };
}

/** Touch 4 — short, standalone final. */
export function orgCloseEmail(_ctx: TemplateContext): EmailDraft {
  return {
    subject: SUBJECT_FOLLOWUP,
    body: [
      `Hi ${PLACEHOLDER.salutation},`,
      ``,
      `We'd still love to get the ${programLink(FAMILIES_URL)} in front of your members, so just reply anytime with your interest level and we'll follow up with more info and next steps.`,
      ``,
      `And if another officer handles this, a quick forward their way would be appreciated. Thanks for looking out for your members.`,
    ].join("\n"),
  };
}

// ── Department-head cadence (formal, meeting-led, gateway-framed) ────────
// Same skeleton as advisors but formal (Dear Dr.) and the ask is a short Zoom.
// Each email stands alone; flyer linked for context, no portal / apply link.

/** Touch 2 — standalone bump. */
export function deptHeadBumpEmail(_ctx: TemplateContext): EmailDraft {
  return {
    subject: SUBJECT_FOLLOWUP,
    body: [
      `Dear ${PLACEHOLDER.salutation},`,
      ``,
      `Following up. Dr. DuBose and I would still value the chance to talk with you about the ${programLink(FAMILIES_ADVISORS_URL)}. If you're open to it, just reply with your general interest level and we'll follow up with more information.`,
    ].join("\n"),
  };
}

/** Touch 3 — standalone follow-up (paired with the Day-6 call). */
export function deptHeadFollowupEmail(_ctx: TemplateContext): EmailDraft {
  return {
    subject: SUBJECT_FOLLOWUP,
    body: [
      `Dear ${PLACEHOLDER.salutation},`,
      ``,
      `Following up on the ${programLink(FAMILIES_ADVISORS_URL)}. If this could serve your department's students, just reply with your interest level and Dr. DuBose and I would love to meet and talk about how we could connect with your faculty and students who may benefit.`,
    ].join("\n"),
  };
}

/** Touch 4 — gracious, standalone close that reopens by season. */
export function deptHeadCloseEmail(_ctx: TemplateContext): EmailDraft {
  return {
    subject: SUBJECT_FOLLOWUP,
    body: [
      `Dear ${PLACEHOLDER.salutation},`,
      ``,
      `We'd still value the chance to support your department's pre-health students through the program, so just reply anytime with your interest level and we'll take it from there.`,
      ``,
      `And if another faculty member would be the better contact, I'd appreciate a quick forward to them. Thank you for your time.`,
    ].join("\n"),
  };
}

// ── Post-agreement & seasonal (stakeholder) ─────────────────────────────

export function postAgreedShareEmail(_ctx: TemplateContext): EmailDraft {
  return {
    subject: `Materials for your students: the Olera Student Caregiver Program`,
    body: [
      `Hi ${PLACEHOLDER.salutation},`,
      ``,
      `Thanks for offering to share the Olera Student Caregiver Program with your students. Below is a short blurb plus a link they can use to learn more and apply.`,
      ``,
      `Dr. DuBose runs a paid caregiving program that places pre-health students with older adults. Students earn paid healthcare experience, a credential, and references for their med, PA, and nursing school applications. Learn more and apply: [olera.care/medjobs](${PLACEHOLDER.applyUrl}).`,
      ``,
      `If a longer version or a PDF would be more useful, just let me know and I'll send it over.`,
    ].join("\n"),
  };
}

export function partnerSeasonalEmail(
  _ctx: TemplateContext,
  season: string,
): EmailDraft {
  return {
    subject: `${season} update: the Olera Student Caregiver Program`,
    body: [
      `Hi ${PLACEHOLDER.salutation},`,
      ``,
      `Hope the term is off to a good start. Wanted to check back in as we head into ${season.toLowerCase().replace("pre-", "")}. Would it be helpful to share the caregiving program with your students again this cycle?`,
      ``,
      `Happy to share how last term's students did, too, if that would be useful.`,
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

/**
 * Provider intro day-0. Flow (per v9.2 final tone pass):
 *
 *   1. Greeting (Hi {first_name}, OR Hello,)
 *   2. Graize self-intro w/ Dr. DuBose credentials inline — one
 *      introduction, not two; recipients see who we are AND who
 *      we work for in a single sentence
 *   3. Grounding + leadership ask + invitation, collapsed into one
 *      paragraph so the ask isn't buried below scaffolding
 *   4. Bold program explanation + concrete student profile
 *   5. Reliability/accountability sentence that ties follow-through
 *      to professional-school incentives (what operators care
 *      about) — see ACCOUNTABILITY_LINE
 *   6. CTA — "We hope you'll accept this invitation. If you'd like
 *      more information before moving forward, you can reply
 *      directly to this email or schedule a call." Packet
 *      referenced on a separate line.
 *
 * Variant differences live in the second paragraph:
 *   named   → "I'd like to invite {organization_name} to join..."
 *             (specific recipient, no leadership ask)
 *   general → "I'm hoping to reach {names}, or another member of
 *             the leadership team, to invite {organization_name}..."
 *             (when we know the leadership names) OR just
 *             "I'd like to invite..." when no names are on the row.
 *
 * Bold sentence rendered via the **...** markdown marker (see
 * email-send.ts → bodyToHtml).
 */
export function providerIntroEmail(
  _ctx: TemplateContext,
  _contacts: Contact[] | undefined,
): EmailDraft {
  const subject = SUBJECT_INTRO;
  const greeting = `Hi again,`;
  return {
    subject,
    body: [
      greeting,
      ``,
      `Thanks for the call today. This is Graize, research assistant to Dr. Logan DuBose. As promised, here's more on the ${programLink(PROVIDER_BOARD_URL)}.`,
      ``,
      `Here are the highlights:`,
      ``,
      `• Vetted college students matched to your agency based on client schedules, or brought on PRN for coverage when you need it.`,
      `• Students set their availability for the full term, so you get predictable coverage.`,
      `• Students are mainly in it for the experience and a recommendation letter, so their pay expectations sit at the lower end of market rates.`,
      `• Many stay on for future semesters, or go full-time over winter and summer breaks or during gap years before grad school.`,
      `• It's a win-win-win: you need staff, students need experience, and clients need caregivers.`,
      ``,
      `If you're interested in working with ${PLACEHOLDER.campus} students, let me know and Dr. DuBose or I will follow up with next steps.`,
      ``,
      `Thank you for your service to the community. Have a great day!`,
    ].join("\n"),
  };
}

/**
 * Provider Day 3 follow-up.
 *
 * Lighter than the intro — "just in case it got buried" framing.
 * Re-surfaces the same magic-link CTA. Short and conversational.
 */
export function providerFollowupEmail(
  _ctx: TemplateContext,
  _contacts: Contact[] | undefined,
): EmailDraft {
  const subject = SUBJECT_FOLLOWUP;
  const greeting = `Hi again,`;
  return {
    subject,
    body: [
      greeting,
      ``,
      `Following up. If the ${programLink(PROVIDER_BOARD_URL)} could help, just reply "Interested" and Dr. DuBose or I will follow up with next steps.`,
      ``,
      `Graize`,
    ].join("\n"),
  };
}

/**
 * Provider Day 7 final.
 *
 * Warmer + low-pressure close. Graceful out + redirect-the-contact ask.
 * Magic-link CTA stays present but the framing is "in case you missed it"
 * rather than a fresh push.
 */
export function providerFinalEmail(
  _ctx: TemplateContext,
  _contacts: Contact[] | undefined,
): EmailDraft {
  const subject = SUBJECT_FOLLOWUP;
  const greeting = `Hi again,`;
  return {
    subject,
    body: [
      greeting,
      ``,
      `Circling back one last time on the ${programLink(PROVIDER_BOARD_URL)}.`,
      ``,
      `If you're interested, just reply "Interested" and Dr. DuBose or I will follow up with next steps. And if someone else at ${PLACEHOLDER.orgName} handles caregiver hiring, a quick forward to them would be appreciated.`,
      ``,
      `Thank you. Have a great day!`,
    ].join("\n"),
  };
}

// ── Activation cadence ──────────────────────────────────────────────────
//
// Launched from a warm signal (interested reply, interested call, or a
// meeting). Goal: get the provider to click their magic link ({welcome_url})
// and accept Terms. Every body offers BOTH the link and a meeting option so
// the provider self-selects. Tone: simple, warm, human, low-pressure — a note
// from the research assistant, not a marketing blast. No em-dashes.
//
// Greeting follows the provider pattern: named variant -> "Hi {first_name},";
// general -> "Hello,". Activation usually targets the one person who engaged,
// so named is the common case.

export function activationIntroEmail(ctx: TemplateContext): EmailDraft {
  const variant = ctx.variant ?? "named";
  const greeting = variant === "named" ? `Hi ${PLACEHOLDER.firstName},` : `Hello,`;
  if (ctx.is_partner) {
    // Fired manually when the team marks a partner reply "Interested". Reply-
    // agnostic (works no matter how they phrased interest) + editable before
    // send. A menu of ways to help, then a meeting via reply-with-times.
    if (ctx.stakeholder_type === "dept_head") {
      return {
        subject: ACTIVATION_SUBJECT,
        body: [
          greeting,
          ``,
          `Thank you for getting back to me. Here are the ways department leaders can help:`,
          ``,
          `• Endorse the program to your faculty and students`,
          `• Allow us to email your professors so they can share it with their students`,
          `• Host a short class visit or talk`,
          `• Share the ${programLink(FAMILIES_ADVISORS_URL)} directly`,
          ``,
          `Would a short meeting with Dr. DuBose help? He can share more and talk through the right approach for your department. Just reply with a couple of times that work this week or next and I'll set it up.`,
          ``,
          `Thank you for your time.`,
        ].join("\n"),
      };
    }
    if (ctx.stakeholder_type === "student_org") {
      return {
        subject: ACTIVATION_SUBJECT,
        body: [
          greeting,
          ``,
          `Thanks for getting back to me. Here are the easiest ways to help:`,
          ``,
          `• Post the application link in your group chat or on social`,
          `• Email it to your listserv (the ${programLink(FAMILIES_URL)})`,
          `• Do this again each term as new members join`,
          `• Have Dr. DuBose speak at one of your meetings`,
          ``,
          `Want to set up a time for Dr. DuBose to meet your group? He can share more and talk through the best way to get it in front of your members. Just reply with a few times that work and I'll set it up.`,
          ``,
          `Thanks for your time.`,
        ].join("\n"),
      };
    }
    // advisor (and any other partner type)
    return {
      subject: ACTIVATION_SUBJECT,
      body: [
        greeting,
        ``,
        `Thanks for getting back to me. Here are the ways advisors can help:`,
        ``,
        `• Share the ${programLink(FAMILIES_ADVISORS_URL)} with your students`,
        `• Mention it to students looking for clinical hours`,
        `• Include it in a newsletter or your advising listserv`,
        `• Point us toward a job board where we could post it`,
        `• Keep us in mind for relevant campus events`,
        ``,
        `Can we set up a time to meet with Dr. DuBose and learn how your office works? Please kindly let me know a good time for you this week or next and I'll set it up.`,
        ``,
        `Thank you in advance for your time.`,
      ].join("\n"),
    };
  }
  return {
    subject: ACTIVATION_SUBJECT,
    body: [
      greeting,
      ``,
      `Thanks for getting back to me. Here's a quick overview, and the full details are here: ${programLink(CANDIDATES_URL)}.`,
      ``,
      `A few things worth knowing up front:`,
      ``,
      `• Pre-screened students, ready to interview. Every candidate is a ${PLACEHOLDER.campus}-area health or pre-health student.`,
      `• We surface students looking for caregiving hours near ${PLACEHOLDER.campus}; you just interview and choose to hire.`,
      `• No cost to review and interview candidates. If you hire, we have simple terms and no long-term commitment.`,
      ``,
      `The best way to know if it's a fit is to meet the students yourself. Whenever you're ready, you can [start interviewing candidates near ${PLACEHOLDER.campus}](${PLACEHOLDER.welcomeUrl}). If it's easier to talk through specifics first, let me know and I'll arrange a call with Dr. DuBose. And of course, you can always reply here with any questions.`,
      ``,
      `Thanks again, and talk soon.`,
    ].join("\n"),
  };
}

export function activationNudgeEmail(ctx: TemplateContext): EmailDraft {
  const variant = ctx.variant ?? "named";
  const greeting = variant === "named" ? `Hi ${PLACEHOLDER.firstName},` : `Hello,`;
  if (ctx.is_partner) {
    return {
      subject: ACTIVATION_SUBJECT,
      body: [
        greeting,
        ``,
        `Just making sure this reached you. Here's the program to share with your students: ${programLink(partnerLandingUrl(ctx.stakeholder_type))}.`,
        ``,
        `And Dr. DuBose would love to meet whenever it's useful, just reply with a couple of times that work and I'll set it up.`,
      ].join("\n"),
    };
  }
  return {
    subject: ACTIVATION_SUBJECT,
    body: [
      greeting,
      ``,
      `Following up. Whenever you're ready, the best way to see if it's a fit is to meet the students yourself. You can [start interviewing candidates near ${PLACEHOLDER.campus}](${PLACEHOLDER.welcomeUrl}) anytime.`,
      ``,
      `And if it's easier to talk through specifics first, just let me know and I'll set up a quick call with Dr. DuBose, or reply here with any questions.`,
    ].join("\n"),
  };
}

export function activationFinalEmail(ctx: TemplateContext): EmailDraft {
  const variant = ctx.variant ?? "named";
  const greeting = variant === "named" ? `Hi ${PLACEHOLDER.firstName},` : `Hello,`;
  if (ctx.is_partner) {
    return {
      subject: ACTIVATION_SUBJECT,
      body: [
        greeting,
        ``,
        `No rush at all. Whenever you're ready, here's the program to share with your students: ${programLink(partnerLandingUrl(ctx.stakeholder_type))}.`,
        ``,
        `And Dr. DuBose is glad to meet whenever it helps, just reply with a few times that work.`,
      ].join("\n"),
    };
  }
  return {
    subject: ACTIVATION_SUBJECT,
    body: [
      greeting,
      ``,
      `Following up. You can review the program information [here](${CANDIDATES_URL}).`,
      ``,
      `The best way to see if it's a good fit is to meet a student yourself on a video interview, and there's no cost or commitment to do so. Whenever you're ready, you can [meet a student on a video interview](${PLACEHOLDER.welcomeUrl}).`,
      ``,
      `If you'd like to talk through specifics first, just let me know and I'll arrange a time with Dr. DuBose, and you can always reply here with any questions.`,
    ].join("\n"),
  };
}

// ── Partner welcome cadence ─────────────────────────────────────────────
//
// Begins when a stakeholder is promoted to an active Recruitment Partner.
// Audience: an advising office / faculty / student-org contact who has
// agreed to help get the program in front of pre-health students. Goal:
// welcome them warmly, hand them the flyer + partner portal, keep the
// program fresh with periodic check-ins, and pull them into seasonal
// term-planning meetings with Dr. DuBose. Tone: warm, human, low-pressure.
// No em-dashes. Greeting follows the partner pattern: named -> "Hi
// {first_name},"; general -> "Hello,".

function partnerGreeting(ctx: TemplateContext): string {
  const variant = ctx.variant ?? "named";
  return variant === "named" ? `Hi ${PLACEHOLDER.firstName},` : `Hello,`;
}

export function partnerWelcomeIntroEmail(ctx: TemplateContext): EmailDraft {
  return {
    subject: `Welcome to ${PROGRAM_NAME}`,
    body: [
      partnerGreeting(ctx),
      ``,
      `Thank you for partnering with us. We're glad to have you helping connect ${PLACEHOLDER.campus} pre-health students with paid caregiving work that fits alongside their coursework and counts toward a healthcare career.`,
      ``,
      `Two things to get you started:`,
      ``,
      `• Our one-pager to share with students: [program one-pager](${PLACEHOLDER.programPdf})`,
      `• Your partner portal, where you can share the one-pager, add colleagues, tell us about events, and see your impact: [open the partner portal](${PLACEHOLDER.welcomeUrl})`,
      ``,
      `Here's how we like to work with partners: a quick check-in every couple of months, plus a short planning meeting with Dr. DuBose a few weeks before each term (Fall, Spring, and Summer) to line up events, share updates and results, refresh student-org contacts, and find new ways to reach students.`,
      ``,
      `Want to get the first one on the calendar? [grab a time with Dr. DuBose](${PLACEHOLDER.calendlyUrl}). And of course, just reply here anytime.`,
    ].join("\n"),
  };
}

export function partnerWelcomeCheckinEmail(ctx: TemplateContext): EmailDraft {
  return {
    subject: `Checking in: ${PROGRAM_NAME}`,
    body: [
      partnerGreeting(ctx),
      ``,
      `Just a quick check-in. Hope things are going well on your end.`,
      ``,
      `If it would help, here's the one-pager to pass along to any students who'd benefit: [program one-pager](${PLACEHOLDER.programPdf}). And your partner portal is always here if you'd like to add a colleague or tell us about an upcoming event: [open the partner portal](${PLACEHOLDER.welcomeUrl}).`,
      ``,
      `Anything we can do to make this easier? Just reply and let me know.`,
    ].join("\n"),
  };
}

export function partnerWelcomePlanningEmail(ctx: TemplateContext): EmailDraft {
  return {
    subject: `Planning ahead for your ${PLACEHOLDER.campus} students`,
    body: [
      partnerGreeting(ctx),
      ``,
      `With a new term coming up, it's a good time for a short planning meeting with Dr. DuBose. We usually use it to line up events, share program updates and results, refresh student-org contacts, and find new ways to get in front of students.`,
      ``,
      `Find a time that works for you: [grab a time with Dr. DuBose](${PLACEHOLDER.calendlyUrl}).`,
      ``,
      `In the meantime, the latest one-pager is here to share: [program one-pager](${PLACEHOLDER.programPdf}), and you can manage everything from your partner portal: [open the partner portal](${PLACEHOLDER.welcomeUrl}).`,
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
        `"Hi, this is ${ctx.admin_first_name ?? "Graize"} from Dr. Logan DuBose's office at Olera. We run a Student Caregiver Program that places pre-health students in paid caregiver roles at home care agencies near ${ctx.campus_name}."`,
        ``,
        `"I came across ${ctx.organization_name} while identifying agencies near ${ctx.campus_name} for the program, and wanted to see if you'd consider hiring a student caregiver this fall. Could you point me to whoever handles caregiver hiring?"`,
      ].join("\n"),
    };
  }
  return {
    title: `Day ${day} follow-up`,
    script: [
      `"Hi, this is ${ctx.admin_first_name ?? "Graize"} from Dr. Logan DuBose's office at Olera, following up on our note to ${ctx.organization_name} about Olera's Student Caregiver Program for pre-health students near ${ctx.campus_name}. Is there a better person or email I should send the details to?"`,
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
