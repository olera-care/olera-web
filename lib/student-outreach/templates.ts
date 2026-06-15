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
    .replace(/\{apply_url\}/g, vars.apply_url ?? "https://olera.care/medjobs/apply")
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
  const subject = `Olera's ${PLACEHOLDER.campus} Student Caregiver Program`;
  // v9.1 Graize 05.13 audit (Item 4A): "patient-care hours" framed
  // the work too clinically for a caregiving context. "Hands-on
  // experience working with clients" matches how home-care actually
  // reads to operators and faculty alike.
  const programExplanation = `**This program matches ${PLACEHOLDER.campus} pre-nursing and pre-medical students with local home care agencies for paid caregiver roles that fit alongside coursework.** Students gain hands-on experience working with clients, mentorship, and recommendation letters that strengthen their applications to medical, PA, and nursing school.`;
  const packetLine = `The attached information packet has the program details.`;
  // Portal magic-link CTA (#5): lets a partner self-serve from email one —
  // learn more, share the flyer, add colleagues/events, or confirm partnership.
  const portalLine = `You can also open our partner portal to see the program, share the flyer with students, and tell us how you'd like to help: [open the partner portal]({welcome_url}).`;

  switch (stakeholder_type) {
    case "student_org":
      // Pilot-as-internship. Lead with the opportunity for members + partner
      // status, make sharing one tap (flyer + the org's application link), and
      // offer Dr. DuBose as a speaker.
      return {
        subject: `A paid caregiving internship for your members`,
        body: [
          greeting,
          ``,
          `I work with Dr. Logan DuBose, a physician and NIH-funded researcher who is piloting a structured caregiving internship for pre-health students. Interns provide care to older adults and earn paid healthcare experience, a credential, and references for their medical, PA, and nursing school applications. It is early work toward a National Institute on Aging grant.`,
          ``,
          `I think it could be a great fit for your members, and we would love to partner with ${PLACEHOLDER.orgName} at ${PLACEHOLDER.campus}. A couple of simple ways we could do that:`,
          ``,
          `- Share it with your members. Here is the [flyer](${PLACEHOLDER.programPdf}) and the [application link](${PLACEHOLDER.applyUrl}) for your group chat.`,
          `- Dr. DuBose would be glad to speak at an org meeting about getting into healthcare careers and the internship.`,
          ``,
          `If you are interested, take a look at our website and reply to let me know. Interested orgs will get more details and can have Dr. DuBose speak at a meeting.`,
        ].join("\n"),
      };
    case "advisor":
      // Pilot-as-internship, relationship-led. The standardized CTA earns the
      // meeting with Dr. DuBose. Overview linked for context.
      return {
        subject: `A pre-health caregiving internship pilot for your students`,
        body: [
          greeting,
          ``,
          `I work with Dr. Logan DuBose, a physician and NIH-funded researcher who is piloting a structured caregiving internship for pre-health students. Interns provide care to older adults in the community and earn paid healthcare experience, a credential, and references for their medical, PA, and nursing school applications. The pilot is early work toward a National Institute on Aging grant. I attached a one-page overview so you can see what it offers your students: [overview](${PLACEHOLDER.programPdf}).`,
          ``,
          `If you are interested, take a look at our website and reply to let me know. Interested advisors will get more details and can meet directly with Dr. DuBose to discuss partnering.`,
        ].join("\n"),
      };
    case "dept_head":
      // Formal, pilot-as-internship, gateway-framed. Standardized CTA earns the
      // conversation with Dr. DuBose.
      return {
        subject: `A pre-health caregiving internship pilot for your students`,
        body: [
          greeting,
          ``,
          `My name is Graize Belandres, and I am a research assistant working with Dr. Logan DuBose, a physician and NIH-funded researcher. I came across your department while identifying pre-health programs at ${PLACEHOLDER.campus}, and wanted to share a pilot we are running.`,
          ``,
          `Dr. DuBose is piloting a structured caregiving internship that places pre-health students with older adults in the community. Interns earn paid healthcare experience, a credential, and references for their medical, PA, and nursing school applications. The pilot is preliminary work toward a National Institute on Aging grant. I attached a one-page overview so you can see what it offers your students: [overview](${PLACEHOLDER.programPdf}).`,
          ``,
          `If you are interested, take a look at our website and reply to let me know. Interested departments will get more details and can meet directly with Dr. DuBose to discuss collaborating.`,
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
          `I came across your courses while identifying pre-health faculty at ${PLACEHOLDER.campus} whose students might be interested in Olera's ${PLACEHOLDER.campus} Student Caregiver Program.`,
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
    subject: `Olera's ${PLACEHOLDER.campus} Student Caregiver Program`,
    body: [
      `Hi ${PLACEHOLDER.salutation},`,
      ``,
      `Just following up on my note from earlier this week, in case it got buried.`,
      ``,
      `If Olera's ${PLACEHOLDER.campus} Student Caregiver Program could be useful for your students or advisees and you'd like more information, you can reply directly to this email, or Dr. DuBose is happy to ${SCHEDULE_LINK_SHORT}.`,
      ``,
      `The attached information packet covers how it works.`,
    ].join("\n"),
  };
}

export function followupSocialProofEmail(_ctx: TemplateContext): EmailDraft {
  return {
    subject: `Olera's ${PLACEHOLDER.campus} Student Caregiver Program`,
    body: [
      `Hi ${PLACEHOLDER.salutation},`,
      ``,
      `Following up on Olera's ${PLACEHOLDER.campus} Student Caregiver Program. Pre-health students at peer campuses are picking up paid caregiver hours alongside coursework, giving them hands-on experience and recommendation letters that strengthen their applications to professional school.`,
      ``,
      `If you'd like the program materials to share with your students or advisees, just reply and I'll send them over. Dr. DuBose is also happy to ${SCHEDULE_LINK_SHORT} if more information would help.`,
    ].join("\n"),
  };
}

export function followupFinalEmail(_ctx: TemplateContext): EmailDraft {
  return {
    subject: `Olera's ${PLACEHOLDER.campus} Student Caregiver Program`,
    body: [
      `Hi ${PLACEHOLDER.salutation},`,
      ``,
      `Wanted to circle back one last time on Olera's ${PLACEHOLDER.campus} Student Caregiver Program. If there's interest from your team and you'd like more information, you can reply directly to this email, or Dr. DuBose is happy to ${SCHEDULE_LINK_SHORT}.`,
      ``,
      `If now isn't the right time, no worries; we'll check back next term. If there's a better person at ${PLACEHOLDER.orgName} to coordinate with, we'd appreciate a redirect.`,
      ``,
      `Thanks for your time.`,
    ].join("\n"),
  };
}

// ── Advisor relationship-first cadence (meeting-led) ────────────────────
// Each email stands alone (no narrative threading). The only ask in the cold
// stretch is a meeting; sharing/portal arrive at the program-info touch.

/** Touch 2 — one-line bump. Empty subject so Smartlead sends it as a reply in
 *  the same thread with the original email quoted beneath. */
export function advisorBumpEmail(_ctx: TemplateContext): EmailDraft {
  return {
    subject: ``,
    body: `Bumping this note about a pre-health caregiving internship for your students.`,
  };
}

/** Touch 3 — program info (paired with the Day-6 intro call). The first place
 *  the portal link appears; flyer linked for context; meeting is the CTA. */
export function advisorInfoEmail(_ctx: TemplateContext): EmailDraft {
  return {
    subject: `More on the pre-health caregiving internship`,
    body: [
      `Hi ${PLACEHOLDER.salutation},`,
      ``,
      `Here is a bit more on the internship pilot. Dr. DuBose places pre-health students with older adults in the community as caregivers. Interns earn paid healthcare experience, a credential, and references for their med, PA, and nursing school applications, on a schedule that works around their classes. We handle the matching, training, and support.`,
      ``,
      `The attached overview has the details: [overview](${PLACEHOLDER.programPdf}).`,
      ``,
      `If you are interested, take a look at our website and reply to let me know. Interested advisors will get more details and can meet directly with Dr. DuBose to discuss partnering.`,
    ].join("\n"),
  };
}

/** Touch 4 — short, standalone nudge. */
export function advisorNudgeEmail(_ctx: TemplateContext): EmailDraft {
  return {
    subject: `A pre-health caregiving internship for your students`,
    body: [
      `Hi ${PLACEHOLDER.salutation},`,
      ``,
      `We have room for more ${PLACEHOLDER.campus} pre-health students in the caregiving internship this semester. Interns earn paid healthcare experience and a credential for their applications, around their classes.`,
      ``,
      `If you are interested, take a look at our website and reply to let me know. Interested advisors will get more details and can meet directly with Dr. DuBose to discuss partnering.`,
    ].join("\n"),
  };
}

/** Touch 5 — gracious close that reopens by season. */
export function advisorCloseEmail(_ctx: TemplateContext): EmailDraft {
  return {
    subject: `Checking in before the semester`,
    body: [
      `Hi ${PLACEHOLDER.salutation},`,
      ``,
      `We would still love to support your ${PLACEHOLDER.campus} pre-health students through the caregiving internship. If the timing is better later, we will check back before next semester. Anytime, take a look at our website and reply, and Dr. DuBose is glad to connect.`,
    ].join("\n"),
  };
}

// ── Student-org cadence (value-first, share-led) ────────────────────────
// Lighter than advisors. Each email stands alone and restates the offer; the
// application link is the org's unique link so applies count for that org.

/** Touch 2 — one-line bump. Empty subject so Smartlead replies in-thread. */
export function orgBumpEmail(_ctx: TemplateContext): EmailDraft {
  return {
    subject: ``,
    body: `Bumping this note about a paid caregiving internship for your members.`,
  };
}

/** Touch 3 — follow-up (paired with the Day-6 call when a phone exists). */
export function orgFollowupEmail(_ctx: TemplateContext): EmailDraft {
  return {
    subject: `A paid caregiving internship for your members`,
    body: [
      `Hi ${PLACEHOLDER.salutation},`,
      ``,
      `Dr. DuBose is piloting a caregiving internship that places pre-health students with older adults: paid healthcare experience, a credential, and references for med, PA, and nursing applications, around their class schedule.`,
      ``,
      `Easy ways to share with your members:`,
      `- Here is the [flyer](${PLACEHOLDER.programPdf}) and the [application link](${PLACEHOLDER.applyUrl}) for your group chat.`,
      `- Dr. DuBose would be glad to speak at one of your meetings.`,
      ``,
      `Let me know if you are interested or have any questions. Thanks!`,
    ].join("\n"),
  };
}

/** Touch 4 — short final. */
export function orgCloseEmail(_ctx: TemplateContext): EmailDraft {
  return {
    subject: `Checking in for your members`,
    body: [
      `Hi ${PLACEHOLDER.salutation},`,
      ``,
      `Glad to help your members get into the caregiving internship this semester. Here is the [flyer](${PLACEHOLDER.programPdf}) and the [application link](${PLACEHOLDER.applyUrl}) to share, and Dr. DuBose is happy to speak at a meeting anytime.`,
      ``,
      `Just let me know. Thanks!`,
    ].join("\n"),
  };
}

// ── Department-head cadence (formal, meeting-led, gateway-framed) ────────
// Same skeleton as advisors but formal (Dear Dr.) and the ask is a short Zoom.
// Each email stands alone; flyer linked for context, no portal / apply link.

/** Touch 2 — one-line bump. Empty subject so Smartlead replies in-thread. */
export function deptHeadBumpEmail(_ctx: TemplateContext): EmailDraft {
  return {
    subject: ``,
    body: `Bumping this note about a pre-health caregiving internship for your students.`,
  };
}

/** Touch 3 — full standalone follow-up (paired with the Day-6 call). */
export function deptHeadFollowupEmail(_ctx: TemplateContext): EmailDraft {
  return {
    subject: `A pre-health caregiving internship for your students`,
    body: [
      `Dear ${PLACEHOLDER.salutation},`,
      ``,
      `I am a research assistant working with Dr. Logan DuBose, reaching out about a caregiving internship for your department's pre-health students. Dr. DuBose places pre-health students with older adults in the community: paid healthcare experience, a credential, and references for med, PA, and nursing applications, around their class schedule. The [overview](${PLACEHOLDER.programPdf}) is attached so you can see what it offers your students.`,
      ``,
      `If you are interested, take a look at our website and reply to let me know. Interested departments will get more details and can meet directly with Dr. DuBose to discuss collaborating.`,
    ].join("\n"),
  };
}

/** Touch 4 — gracious close that reopens by season. */
export function deptHeadCloseEmail(_ctx: TemplateContext): EmailDraft {
  return {
    subject: `Checking in for your pre-health students`,
    body: [
      `Dear ${PLACEHOLDER.salutation},`,
      ``,
      `If the caregiving internship would be useful for your pre-health students, Dr. DuBose and I would be glad to connect, now or next semester. The [overview](${PLACEHOLDER.programPdf}) is attached if it would help.`,
      ``,
      `If you are interested, take a look at our website and reply anytime.`,
    ].join("\n"),
  };
}

// ── Post-agreement & seasonal (stakeholder) ─────────────────────────────

export function postAgreedShareEmail(_ctx: TemplateContext): EmailDraft {
  return {
    subject: `Materials for your students: the Olera pre-health caregiving internship`,
    body: [
      `Hi ${PLACEHOLDER.salutation},`,
      ``,
      `Thanks for offering to share the Olera pre-health caregiving internship with your students. Below is a short blurb plus a link they can use to learn more and apply.`,
      ``,
      `Dr. DuBose is piloting a structured caregiving internship that places pre-health students with older adults. Interns earn paid healthcare experience, a credential, and references for their med, PA, and nursing school applications. Learn more and apply: [olera.care/medjobs](${PLACEHOLDER.applyUrl}).`,
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
    subject: `${season} update: the Olera pre-health caregiving internship`,
    body: [
      `Hi ${PLACEHOLDER.salutation},`,
      ``,
      `Hope the term is off to a good start. Wanted to check back in as we head into ${season.toLowerCase().replace("pre-", "")}. Would it be helpful to share the caregiving internship with your students again this cycle?`,
      ``,
      `Happy to share how last term's interns did, too, if that would be useful.`,
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
/**
 * Provider Day 0 intro (v10 Phase 2+3 Bullet 6, 2026-06-04).
 *
 * What changed from v9:
 *   - Single primary CTA: "Review {campus} student caregivers →" pointing
 *     at the magic-link welcome URL (per-recipient, signed). Reply +
 *     Calendly stay as smaller secondary CTAs.
 *   - No "trial" language anywhere. "Pilot" appears once as honest
 *     framing for why we're inviting them — not as a sales pitch.
 *   - Brand-consistency one-liner so the brand jump from findmedjobs.co
 *     (sender) to olera.care (landing) isn't a surprise (master plan § 6.7).
 *   - Reply or Calendly stay available; CTA priority is platform first.
 */
export function providerIntroEmail(
  ctx: TemplateContext,
  contacts: Contact[] | undefined,
): EmailDraft {
  const variant = ctx.variant ?? "general";
  const subject = `Olera's ${PLACEHOLDER.campus} Student Caregiver Internship`;
  const greeting =
    variant === "named" ? `Hi ${PLACEHOLDER.firstName},` : providerSalutation(contacts);
  return {
    subject,
    body: [
      greeting,
      ``,
      `I'm Graize Belandres, research assistant to Dr. Logan DuBose, a geriatric-focused physician and National Institute on Aging (NIA) researcher. I'm reaching out about a project we're piloting, [Olera's ${PLACEHOLDER.campus} Student Caregiver Internship](${PLACEHOLDER.programUrl}): a new program that places **pre-nursing and pre-medical students in caregiver roles at host home care agencies near campus.** I came across ${PLACEHOLDER.orgName} while researching nearby home care agencies, and I'd like to invite you to learn about the program and check your eligibility to serve as a host agency for local interns.`,
      ``,
      `We think it's a win-win-win for home care agencies, ${PLACEHOLDER.campus} pre-health students, and the clients you serve. You need reliable staff, students need hands-on experience to get into grad school, and clients need quality caregivers. This program delivers all three.`,
      ``,
      `Here is what hosting looks like:`,
      ``,
      `• Vetted caregiving interns matched to your agency based on your client needs, or brought on PRN for coverage when you need it.`,
      `• Interns set availability they pledge to keep open for the full semester, giving you predictable coverage for client assignments.`,
      `• Interns work mainly for the experience and a recommendation letter, and their pay expectations sit at the lower end of your usual rates.`,
      `• Many interns stay on for future semesters, or go full-time over winter and summer breaks or during gap years before grad school.`,
      ``,
      `The eligibility check takes about a minute: [check your eligibility to be a host home care agency](${PLACEHOLDER.welcomeUrl}).`,
      ``,
      `There is no commitment to check your eligibility. The commitment begins only once you are fully onboarded as a host agency and you and an intern agree it's a good fit.`,
      ``,
      `We hope you'll consider learning about the program and hosting an intern. If you are interested and eligible, just reply "interested and eligible" and Dr. DuBose or I will follow up with next steps (onboarding call, program costs, set-up).`,
      ``,
      `Thank you for your service to the community. Have a great day!`,
    ].join("\n"),
  };
}

/**
 * Provider Day 3 follow-up (v10 Phase 2+3 Bullet 6, 2026-06-04).
 *
 * Lighter than the intro — "just in case it got buried" framing.
 * Re-surfaces the same magic-link CTA. Short and conversational.
 */
export function providerFollowupEmail(
  ctx: TemplateContext,
  contacts: Contact[] | undefined,
): EmailDraft {
  const variant = ctx.variant ?? "general";
  const subject = `Olera's ${PLACEHOLDER.campus} Student Caregiver Internship`;
  const greeting =
    variant === "named" ? `Hi ${PLACEHOLDER.firstName},` : providerSalutation(contacts);
  return {
    subject,
    body: [
      greeting,
      ``,
      `Following up in case my last note got buried. I'm Graize, research assistant to Dr. Logan DuBose, a geriatric-focused physician and NIA researcher. We're piloting [Olera's ${PLACEHOLDER.campus} Student Caregiver Internship](${PLACEHOLDER.programUrl}), which places pre-nursing and pre-medical students in caregiver roles at host home care agencies near campus.`,
      ``,
      `It's a win-win-win: you get reliable, vetted caregivers who pledge their availability for the full semester, the students get hands-on experience and a recommendation letter, and your clients get quality care. Many interns stay on for future semesters or go full-time over breaks.`,
      ``,
      `The eligibility check takes about a minute: [check your eligibility to be a host home care agency](${PLACEHOLDER.welcomeUrl}). There's no commitment to check. If you're interested and eligible, just reply "interested and eligible" and Dr. DuBose or I will follow up with next steps.`,
    ].join("\n"),
  };
}

/**
 * Provider Day 7 final (v10 Phase 2+3 Bullet 6, 2026-06-04).
 *
 * Warmer + low-pressure close. Graceful out + redirect-the-contact ask.
 * Magic-link CTA stays present but the framing is "in case you missed it"
 * rather than a fresh push.
 */
export function providerFinalEmail(
  ctx: TemplateContext,
  contacts: Contact[] | undefined,
): EmailDraft {
  const variant = ctx.variant ?? "general";
  const subject = `Olera's ${PLACEHOLDER.campus} Student Caregiver Internship`;
  const greeting =
    variant === "named" ? `Hi ${PLACEHOLDER.firstName},` : providerSalutation(contacts);
  return {
    subject,
    body: [
      greeting,
      ``,
      `Circling back one last time on [Olera's ${PLACEHOLDER.campus} Student Caregiver Internship](${PLACEHOLDER.programUrl}). If hosting a vetted pre-health student in a caregiver role would help ${PLACEHOLDER.orgName}, the eligibility check takes about a minute: [check your eligibility to be a host home care agency](${PLACEHOLDER.welcomeUrl}). There's no commitment until you're onboarded and you and an intern agree it's a good fit.`,
      ``,
      `If you're interested and eligible, just reply "interested and eligible" and Dr. DuBose or I will follow up with next steps. And if someone else at ${PLACEHOLDER.orgName} handles caregiver hiring, a quick redirect would help.`,
      ``,
      `Thank you for your service to the community. Have a great day!`,
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
    return {
      subject: `Supporting your ${PLACEHOLDER.campus} pre-health students`,
      body: [
        greeting,
        ``,
        `Great to connect! A few easy ways to support the internship:`,
        ``,
        `• Share our one-pager with students who'd benefit: [internship one-pager](${PLACEHOLDER.programPdf})`,
        `• Talk it through with Dr. DuBose: [grab a time](${PLACEHOLDER.calendlyUrl})`,
        `• Join our partner network and manage everything from your recruitment partner portal, where you can share the one-pager, add colleagues, and tell us how you'd like to help: [open the partner portal](${PLACEHOLDER.welcomeUrl})`,
        ``,
        `Either way, happy to help.`,
      ].join("\n"),
    };
  }
  return {
    subject: `Next step for hosting ${PLACEHOLDER.campus} student caregivers`,
    body: [
      greeting,
      ``,
      `Great to hear from you. The next step is a quick eligibility check to confirm you meet the host home care agency requirements and review the partner terms. It takes about a minute: [check your eligibility](${PLACEHOLDER.welcomeUrl}).`,
      ``,
      `Once you're through, you can review potential student matches and meet them in online interviews, with no commitment until you find a good fit.`,
      ``,
      `If you'd rather talk it through first, [grab a time with Dr. DuBose](${PLACEHOLDER.calendlyUrl}), or just reply with a couple of windows that work and I'll set it up.`,
    ].join("\n"),
  };
}

export function activationNudgeEmail(ctx: TemplateContext): EmailDraft {
  const variant = ctx.variant ?? "named";
  const greeting = variant === "named" ? `Hi ${PLACEHOLDER.firstName},` : `Hello,`;
  if (ctx.is_partner) {
    return {
      subject: `Your ${PLACEHOLDER.campus} partner portal is ready`,
      body: [
        greeting,
        ``,
        `Just making sure this didn't get buried. You can support your students anytime:`,
        ``,
        `**[Open the partner portal →](${PLACEHOLDER.welcomeUrl})**, where you can share the one-pager, add colleagues, and join our partner network.`,
        ``,
        `Or grab a time with Dr. DuBose if it's easier to talk first: [Dr. DuBose's calendar](${PLACEHOLDER.calendlyUrl}).`,
      ].join("\n"),
    };
  }
  return {
    subject: `Your ${PLACEHOLDER.campus} host agency eligibility check`,
    body: [
      greeting,
      ``,
      `Just making sure this didn't get buried. Whenever you're ready, the eligibility check takes about a minute: [check your eligibility](${PLACEHOLDER.welcomeUrl}).`,
      ``,
      `Prefer to talk first? Here's Dr. DuBose's calendar: [grab a time](${PLACEHOLDER.calendlyUrl}).`,
    ].join("\n"),
  };
}

export function activationFinalEmail(ctx: TemplateContext): EmailDraft {
  const variant = ctx.variant ?? "named";
  const greeting = variant === "named" ? `Hi ${PLACEHOLDER.firstName},` : `Hello,`;
  if (ctx.is_partner) {
    return {
      subject: `Still here when you're ready`,
      body: [
        greeting,
        ``,
        `No rush at all. Whenever you're ready, here's your recruitment partner portal to share the flyer with students and join our partner network:`,
        ``,
        `**[Open the partner portal →](${PLACEHOLDER.welcomeUrl})**`,
        ``,
        `And Dr. DuBose's calendar is here if it's easier to talk first: [grab a time](${PLACEHOLDER.calendlyUrl}).`,
      ].join("\n"),
    };
  }
  return {
    subject: `Still here when you're ready`,
    body: [
      greeting,
      ``,
      `No rush at all. Whenever you're ready, your eligibility check to host ${PLACEHOLDER.campus} student caregivers is here and takes about a minute: [check your eligibility](${PLACEHOLDER.welcomeUrl}).`,
      ``,
      `And Dr. DuBose's calendar is here if it's easier to talk first: [grab a time](${PLACEHOLDER.calendlyUrl}).`,
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
    subject: `Welcome to Olera's ${PLACEHOLDER.campus} pre-health caregiving internship`,
    body: [
      partnerGreeting(ctx),
      ``,
      `Thank you for partnering with us. We're glad to have you helping connect ${PLACEHOLDER.campus} pre-health students with paid caregiving experience that fits alongside their coursework and counts toward a healthcare career.`,
      ``,
      `Two things to get you started:`,
      ``,
      `• Our one-pager to share with students: [internship one-pager](${PLACEHOLDER.programPdf})`,
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
    subject: `Checking in: Olera's ${PLACEHOLDER.campus} pre-health caregiving internship`,
    body: [
      partnerGreeting(ctx),
      ``,
      `Just a quick check-in. Hope things are going well on your end.`,
      ``,
      `If it would help, here's the one-pager to pass along to any students who'd benefit: [internship one-pager](${PLACEHOLDER.programPdf}). And your partner portal is always here if you'd like to add a colleague or tell us about an upcoming event: [open the partner portal](${PLACEHOLDER.welcomeUrl}).`,
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
      `In the meantime, the latest one-pager is here to share: [internship one-pager](${PLACEHOLDER.programPdf}), and you can manage everything from your partner portal: [open the partner portal](${PLACEHOLDER.welcomeUrl}).`,
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
        `"Hi, this is ${ctx.admin_first_name ?? "Graize"} calling from Dr. Logan DuBose's office. I'm a research assistant on Olera's ${ctx.campus_name} pre-health caregiving internship."`,
        ``,
        `"I came across ${ctx.organization_name} while we were identifying home care agencies near ${ctx.campus_name} for the program, and I wanted to reach out personally. We place vetted pre-health students into caregiver roles at host home care agencies like yours, as paid healthcare experience for the students. I wanted to see if you'd consider hosting an intern this fall."`,
      ].join("\n"),
    };
  }
  return {
    title: `Day ${day} follow-up`,
    script: [
      `"Hi, this is ${ctx.admin_first_name ?? "Graize"} from Dr. Logan DuBose's office, following up on prior outreach about Olera's ${ctx.campus_name} pre-health caregiving internship. Just hoping to connect with whoever handles staffing at ${ctx.organization_name}."`,
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
