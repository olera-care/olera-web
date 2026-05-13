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
 *
 * Single body link policy: the email body never references the
 * public program URL inline. The program page lives in the Logan
 * signature block (footer architecture) so the body has at most
 * one outbound link — the Calendly CTA. Recipients don't get
 * link-overloaded; the signature carries the rest.
 */
const SCHEDULE_LINK_FULL = `[schedule a quick informational call with Dr. Logan DuBose](${PLACEHOLDER.calendlyUrl})`;
const SCHEDULE_LINK_LONG = `[schedule a quick call with Dr. Logan DuBose](${PLACEHOLDER.calendlyUrl})`;
const SCHEDULE_LINK_SHORT = `[share more on a quick call](${PLACEHOLDER.calendlyUrl})`;

/**
 * Grazie self-introduction line used at the top of every body. The
 * email always opens with greeting → Grazie self-intro → grounding
 * ("I came across..."), then moves into invitation + program. This
 * is the single most important change for tone: recipients see who
 * they're hearing from before they see what we want.
 */
const GRAZIE_INTRO = `My name is Grazie Belandres, and I'm a research assistant working with Dr. Logan DuBose.`;

/**
 * Dr. DuBose credibility line, used once per body after the bold
 * program explanation. Kept short on purpose; the full credential
 * stack lives in his email signature block, so the body only needs
 * the one anchor that lets the program explanation feel
 * trustworthy.
 */
const LOGAN_CREDIBILITY = `The program is directed by Dr. Logan DuBose, an NIH-funded researcher and Texas A&M College of Medicine alum.`;

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
    return `I'm hoping to reach ${named[0]}, or another member of the leadership team.`;
  }
  const list =
    named.length === 2
      ? `${named[0]} or ${named[1]}`
      : `${named.slice(0, -1).join(", ")}, or ${named[named.length - 1]}`;
  return `I'm hoping to reach ${list}, or another member of the leadership team.`;
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

/**
 * Stakeholder intros — same Grazie-first flow as provider intros,
 * but the program value-prop reframes for an academic audience
 * (student opportunity, not staffing relief). Salutation is formal
 * (Dear) for dept_head + professor; friendly (Hi) for student_org +
 * advisor.
 */
export function introEmail(ctx: TemplateContext): EmailDraft {
  const { stakeholder_type } = ctx;
  const greeting =
    stakeholder_type === "dept_head" || stakeholder_type === "professor"
      ? `Dear ${PLACEHOLDER.salutation},`
      : `Hi ${PLACEHOLDER.salutation},`;
  const subject = `${PLACEHOLDER.campus} Student Caregiver Program`;
  const programExplanation = `**The program matches ${PLACEHOLDER.campus} pre-nursing and pre-medical students with local home care agencies for paid caregiver roles that fit alongside coursework.** Students gain direct patient-care hours, mentorship, and recommendation letters that strengthen their applications to medical, PA, and nursing school.`;

  switch (stakeholder_type) {
    case "student_org":
      return {
        subject,
        body: [
          greeting,
          ``,
          GRAZIE_INTRO,
          ``,
          `I came across ${PLACEHOLDER.orgName} while identifying pre-health student groups at ${PLACEHOLDER.campus} that might be interested in the ${PLACEHOLDER.campus} Student Caregiver Program.`,
          ``,
          `We'd love to share the program with your members. It's a way for pre-health students to pick up paid clinical hours close to campus while supporting their applications to professional school.`,
          ``,
          programExplanation,
          ``,
          LOGAN_CREDIBILITY,
          ``,
          `You can reply directly to this email, or Dr. DuBose is happy to ${SCHEDULE_LINK_SHORT}. The attached information packet has the program details.`,
        ].join("\n"),
      };
    case "advisor":
      return {
        subject,
        body: [
          greeting,
          ``,
          GRAZIE_INTRO,
          ``,
          `I came across your office while identifying pre-health advisors at ${PLACEHOLDER.campus} who might find the ${PLACEHOLDER.campus} Student Caregiver Program useful for their advisees.`,
          ``,
          `We'd love to share the program with your office so it can be passed along to advisees preparing for professional school.`,
          ``,
          programExplanation,
          ``,
          LOGAN_CREDIBILITY,
          ``,
          `You can reply directly to this email, or Dr. DuBose is happy to ${SCHEDULE_LINK_SHORT}. The attached information packet has the program details.`,
        ].join("\n"),
      };
    case "dept_head":
      return {
        subject,
        body: [
          greeting,
          ``,
          GRAZIE_INTRO,
          ``,
          `I came across your department while identifying pre-health programs at ${PLACEHOLDER.campus} whose students might benefit from the ${PLACEHOLDER.campus} Student Caregiver Program.`,
          ``,
          `With your approval, we'd love to share the program with your department so it can reach students preparing for medical, PA, and nursing school.`,
          ``,
          programExplanation,
          ``,
          LOGAN_CREDIBILITY,
          ``,
          `Dr. DuBose is happy to ${SCHEDULE_LINK_SHORT} at your convenience. The attached information packet has the program details.`,
        ].join("\n"),
      };
    case "professor":
      return {
        subject,
        body: [
          greeting,
          ``,
          GRAZIE_INTRO,
          ``,
          `I came across your courses while identifying pre-health faculty at ${PLACEHOLDER.campus} whose students might be interested in the ${PLACEHOLDER.campus} Student Caregiver Program.`,
          ``,
          `If you'd be open to forwarding the program to interested students, we'd really appreciate it.`,
          ``,
          programExplanation,
          ``,
          LOGAN_CREDIBILITY,
          ``,
          `Dr. DuBose is happy to ${SCHEDULE_LINK_SHORT} if any questions come up. The attached information packet has the program details.`,
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
      `Just following up on my note from earlier this week, in case it got buried.`,
      ``,
      `If the ${PLACEHOLDER.campus} Student Caregiver Program could be useful for your students or advisees, you can reply directly to this email, or Dr. DuBose is happy to ${SCHEDULE_LINK_SHORT}. The attached information packet covers how it works.`,
    ].join("\n"),
  };
}

export function followupSocialProofEmail(_ctx: TemplateContext): EmailDraft {
  return {
    subject: `${PLACEHOLDER.campus} Student Caregiver Program`,
    body: [
      `Hi ${PLACEHOLDER.salutation},`,
      ``,
      `Following up on the ${PLACEHOLDER.campus} Student Caregiver Program. Pre-health students at peer campuses are picking up paid caregiver hours alongside coursework, which is giving them clinical experience and recommendation letters that strengthen applications to professional school.`,
      ``,
      `If you'd like the program materials to share with your students or advisees, just reply and I'll send them over. Dr. DuBose is also happy to ${SCHEDULE_LINK_SHORT}.`,
    ].join("\n"),
  };
}

export function followupFinalEmail(_ctx: TemplateContext): EmailDraft {
  return {
    subject: `${PLACEHOLDER.campus} Student Caregiver Program`,
    body: [
      `Hi ${PLACEHOLDER.salutation},`,
      ``,
      `Wanted to circle back one last time on the ${PLACEHOLDER.campus} Student Caregiver Program. If there's interest from your team, you can reply directly to this email or Dr. DuBose is happy to ${SCHEDULE_LINK_SHORT}.`,
      ``,
      `If now isn't the right time, no worries; we'll check back next term. If there's a better person at ${PLACEHOLDER.orgName} to coordinate with, we'd appreciate a redirect.`,
      ``,
      `Thanks for your time.`,
    ].join("\n"),
  };
}

// ── Post-agreement & seasonal (stakeholder) ─────────────────────────────

export function postAgreedShareEmail(_ctx: TemplateContext): EmailDraft {
  return {
    subject: `Materials for your students: ${PLACEHOLDER.campus} Student Caregiver Program`,
    body: [
      `Hi ${PLACEHOLDER.salutation},`,
      ``,
      `Thanks for offering to share the ${PLACEHOLDER.campus} Student Caregiver Program with your students. Below is a short blurb plus a link they can use to learn more and apply.`,
      ``,
      `Olera connects pre-nursing and pre-medical students with paid caregiving roles at local home care agencies. Learn more and apply: [olera.care/students](${PLACEHOLDER.programUrl})`,
      ``,
      `If a longer version or PDF would be more useful, just let me know and I'll send it over.`,
    ].join("\n"),
  };
}

export function partnerSeasonalEmail(
  _ctx: TemplateContext,
  season: string,
): EmailDraft {
  return {
    subject: `${season} update: ${PLACEHOLDER.campus} Student Caregiver Program`,
    body: [
      `Hi ${PLACEHOLDER.salutation},`,
      ``,
      `Hope the term is off to a good start. Wanted to check back in as we head into ${season.toLowerCase().replace("pre-", "")}. Would it be helpful to share an updated information packet from Dr. DuBose's program with your students this cycle?`,
      ``,
      `Happy to share metrics from last term too if that would be useful.`,
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
 * Provider intro day-0. Flow (per v9 final tone pass):
 *
 *   1. Greeting (Hi {first_name}, OR Hello,)
 *   2. Grazie self-intro — recipients see who we are first
 *   3. Grounding ("I came across ... through your website ...")
 *   4. Leadership ask (general variant only, when contacts present)
 *   5. Invitation — surfaced early so the ask is not buried
 *   6. Bold program explanation + concrete student profile
 *   7. Dr. DuBose credibility (after the program explanation; the
 *      detailed credential stack lives in his signature)
 *   8. Simple CTA — reply OR call; packet referenced; no inline
 *      program-page link (it lives in the signature instead)
 *
 * Variant differences are minimal: greeting + grounding object
 * change ("I came across {organization_name}" for general,
 * "I came across your contact information on {organization_name}'s
 * website" for named — feels more personal when we have a real
 * inbox to reach).
 */
export function providerIntroEmail(
  ctx: TemplateContext,
  contacts: Contact[] | undefined,
): EmailDraft {
  const variant = ctx.variant ?? "general";
  const subject = `${PLACEHOLDER.campus} Student Caregiver Program`;
  const greeting =
    variant === "named" ? `Hi ${PLACEHOLDER.firstName},` : providerSalutation(contacts);
  const groundingLine =
    variant === "named"
      ? `I came across your contact information on ${PLACEHOLDER.orgName}'s website while identifying home care agencies near ${PLACEHOLDER.campus} for the ${PLACEHOLDER.campus} Student Caregiver Program.`
      : `I came across ${PLACEHOLDER.orgName} through your website while identifying home care agencies near ${PLACEHOLDER.campus} for the ${PLACEHOLDER.campus} Student Caregiver Program.`;
  const leadership =
    variant === "general" ? providerLeadershipIntroLine(contacts) : null;
  return {
    subject,
    body: [
      greeting,
      ``,
      GRAZIE_INTRO,
      ``,
      groundingLine,
      ...(leadership ? [``, leadership] : []),
      ``,
      `We'd like to invite ${PLACEHOLDER.orgName} to join Olera's ${PLACEHOLDER.campus} Student Caregiver Program and begin receiving student referrals to help support caregiver staffing needs and vacant shifts.`,
      ``,
      `**This program matches ${PLACEHOLDER.campus} college students with home care agencies to help fill caregiver roles, PRN shifts, and staffing needs with students interested in gaining meaningful healthcare experience.** These are pre-nursing and pre-medical students, future nurses and physicians, motivated more by mentorship, recommendation letters, and clinical experience than by compensation. They show up for the long, accountable hours that caregiver work requires.`,
      ``,
      LOGAN_CREDIBILITY,
      ``,
      `You can reply directly to this email or ${SCHEDULE_LINK_FULL}. The attached information packet has the program details.`,
    ].join("\n"),
  };
}

/**
 * Provider follow-up (Day 3). Lighter than the intro — assumes the
 * recipient saw the Day-0 note. Opens with a friendly "just in case
 * it got buried" line, restates the value crisply, lowers friction
 * by offering reply-or-call. No re-litigation of credentials; the
 * Logan signature carries them on every send.
 */
export function providerFollowupEmail(
  ctx: TemplateContext,
  contacts: Contact[] | undefined,
): EmailDraft {
  const variant = ctx.variant ?? "general";
  const subject = `${PLACEHOLDER.campus} Student Caregiver Program`;
  const greeting =
    variant === "named" ? `Hi ${PLACEHOLDER.firstName},` : providerSalutation(contacts);
  return {
    subject,
    body: [
      greeting,
      ``,
      `Just following up on my note from earlier this week, in case it got buried.`,
      ``,
      `If ${PLACEHOLDER.orgName} could use reliable ${PLACEHOLDER.campus} pre-health students to help cover vacant caregiver shifts and PRN gaps, we'd love to share more about how the program works.`,
      ``,
      `You can reply directly to this email or ${SCHEDULE_LINK_LONG}. Happy to answer questions over email if that's easier — the attached information packet covers the basics.`,
    ].join("\n"),
  };
}

/**
 * Provider final (Day 7). Warmer + low-pressure close. Offers a
 * graceful out ("if now isn't the right time"), invites a redirect
 * to the right caregiver-hiring contact, and thanks them by name
 * where possible. The signature block carries the program URL so
 * the recipient still has a path to learn more on their own time.
 */
export function providerFinalEmail(
  ctx: TemplateContext,
  contacts: Contact[] | undefined,
): EmailDraft {
  const variant = ctx.variant ?? "general";
  const subject = `${PLACEHOLDER.campus} Student Caregiver Program`;
  const greeting =
    variant === "named" ? `Hi ${PLACEHOLDER.firstName},` : providerSalutation(contacts);
  const thanksLine =
    variant === "named"
      ? `Thanks for your time, ${PLACEHOLDER.firstName}.`
      : `Thanks for your time.`;
  return {
    subject,
    body: [
      greeting,
      ``,
      `Wanted to circle back one more time on the ${PLACEHOLDER.campus} Student Caregiver Program.`,
      ``,
      `If there's interest in receiving student referrals to help with caregiver staffing and vacant shifts at ${PLACEHOLDER.orgName}, you can reply directly to this email or ${SCHEDULE_LINK_LONG}.`,
      ``,
      `If now isn't the right time, no worries; we'll check back next term. And if there's a better person at ${PLACEHOLDER.orgName} for us to reach about caregiver hiring, we'd appreciate a quick redirect.`,
      ``,
      thanksLine,
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
        `"Hi, this is ${ctx.admin_first_name ?? "Grazie"} calling from Dr. Logan DuBose's office. I'm a research assistant on the ${ctx.campus_name} Student Caregiver Program."`,
        ``,
        `"I came across ${ctx.organization_name} while we were identifying home care agencies near ${ctx.campus_name} for the program, and I wanted to reach out personally. The program matches ${ctx.campus_name} pre-health students with home care agencies to help fill caregiver roles, PRN shifts, and staffing needs."`,
      ].join("\n"),
    };
  }
  return {
    title: `Day ${day} follow-up`,
    script: [
      `"Hi, this is ${ctx.admin_first_name ?? "Grazie"} from Dr. Logan DuBose's office, following up on prior outreach about the ${ctx.campus_name} Student Caregiver Program. Just hoping to connect with whoever handles caregiver hiring at ${ctx.organization_name}."`,
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
