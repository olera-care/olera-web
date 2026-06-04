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
const SCHEDULE_LINK_FULL = `[schedule a quick informational call with Dr. Logan DuBose directly](${PLACEHOLDER.calendlyUrl})`;
const SCHEDULE_LINK_SHORT = `[share more on a quick call](${PLACEHOLDER.calendlyUrl})`;

/**
 * Graize self-introduction line used at the top of every body. The
 * email always opens with greeting → Graize self-intro (which now
 * carries Dr. DuBose's headline credentials inline) → grounding /
 * invitation → program explanation → CTA. Folding the credentials
 * into the intro removes a separate "The program is directed by..."
 * sentence later in the body — one introduction, not two.
 */
const GRAIZE_INTRO = `My name is Graize Belandres, and I'm a research assistant working with Dr. Logan DuBose, MD, MBA, an NIH-funded researcher and Texas A&M College of Medicine alum.`;

/**
 * Standard closing for intro emails. v9.1 Graize 05.13 audit
 * (Item 4C): CTA crispened with an explicit "next step" framing
 * so the recipient knows exactly what action moves things forward.
 * Followups borrow the reply/call line without the invitation
 * preamble.
 */
const INTRO_CTA_LINES = [
  `We hope you'll accept this invitation. The next step is to reply directly to this email expressing interest, or ${SCHEDULE_LINK_FULL}.`,
  ``,
  `The attached information packet has the program details.`,
];

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
  },
): string {
  return text
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

  switch (stakeholder_type) {
    case "student_org":
      return {
        subject,
        body: [
          greeting,
          ``,
          GRAIZE_INTRO,
          ``,
          `I came across ${PLACEHOLDER.orgName} while identifying pre-health student groups at ${PLACEHOLDER.campus} that might be interested in Olera's ${PLACEHOLDER.campus} Student Caregiver Program.`,
          ``,
          programExplanation,
          ``,
          `We hope you'll consider sharing the program with your members. If you'd like more information first, you can reply directly to this email, or Dr. DuBose is happy to ${SCHEDULE_LINK_SHORT}.`,
          ``,
          packetLine,
        ].join("\n"),
      };
    case "advisor":
      return {
        subject,
        body: [
          greeting,
          ``,
          GRAIZE_INTRO,
          ``,
          `I came across your office while identifying pre-health advisors at ${PLACEHOLDER.campus} who might find Olera's ${PLACEHOLDER.campus} Student Caregiver Program useful for their advisees.`,
          ``,
          programExplanation,
          ``,
          `We hope you'll consider passing this along to your advisees. If you'd like more information first, you can reply directly to this email, or Dr. DuBose is happy to ${SCHEDULE_LINK_SHORT}.`,
          ``,
          packetLine,
        ].join("\n"),
      };
    case "dept_head":
      return {
        subject,
        body: [
          greeting,
          ``,
          GRAIZE_INTRO,
          ``,
          `I came across your department while identifying pre-health programs at ${PLACEHOLDER.campus} whose students might benefit from Olera's ${PLACEHOLDER.campus} Student Caregiver Program.`,
          ``,
          programExplanation,
          ``,
          `With your approval, we'd love to share this with your department. If you'd like more information first, you can reply directly to this email, or Dr. DuBose is happy to ${SCHEDULE_LINK_SHORT} at your convenience.`,
          ``,
          packetLine,
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

// ── Post-agreement & seasonal (stakeholder) ─────────────────────────────

export function postAgreedShareEmail(_ctx: TemplateContext): EmailDraft {
  return {
    subject: `Materials for your students: Olera's ${PLACEHOLDER.campus} Student Caregiver Program`,
    body: [
      `Hi ${PLACEHOLDER.salutation},`,
      ``,
      `Thanks for offering to share Olera's ${PLACEHOLDER.campus} Student Caregiver Program with your students. Below is a short blurb plus a link they can use to learn more and apply.`,
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
    subject: `${season} update: Olera's ${PLACEHOLDER.campus} Student Caregiver Program`,
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
  const subject = `${PLACEHOLDER.campus} student caregivers · Olera`;
  const greeting =
    variant === "named" ? `Hi ${PLACEHOLDER.firstName},` : providerSalutation(contacts);
  const leadershipPhrase =
    variant === "general"
      ? providerLeadershipInvitationPhrase(contacts)
      : null;
  const groundingAndInvitation =
    leadershipPhrase
      ? `I came across ${PLACEHOLDER.orgName} through your website while identifying home care agencies near ${PLACEHOLDER.campus}. ${leadershipPhrase}, to invite ${PLACEHOLDER.orgName} into our ${PLACEHOLDER.campus} student caregiver pilot.`
      : `I came across ${PLACEHOLDER.orgName} through your website while identifying home care agencies near ${PLACEHOLDER.campus}. I'd like to invite ${PLACEHOLDER.orgName} into our ${PLACEHOLDER.campus} student caregiver pilot.`;
  return {
    subject,
    body: [
      greeting,
      ``,
      GRAIZE_INTRO,
      ``,
      groundingAndInvitation,
      ``,
      `We've been recruiting and vetting ${PLACEHOLDER.campus} pre-nursing and pre-medical students who are looking for caregiver shifts — and ${PLACEHOLDER.orgName} stood out as a great fit. The pilot is free for three months and you can review students before contacting anyone.`,
      ``,
      `Take a look at the students near you:`,
      ``,
      `**[Review ${PLACEHOLDER.campus} student caregivers →](${PLACEHOLDER.welcomeUrl})**`,
      ``,
      `The link will land you on olera.care, our main platform. A short background on the pilot is attached. If you'd rather chat first, you can ${SCHEDULE_LINK_FULL} — no pressure either way.`,
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
  const subject = `${PLACEHOLDER.campus} student caregivers · Olera`;
  const greeting =
    variant === "named" ? `Hi ${PLACEHOLDER.firstName},` : providerSalutation(contacts);
  return {
    subject,
    body: [
      greeting,
      ``,
      `Just following up on my note from Monday, in case it got buried.`,
      ``,
      `If ${PLACEHOLDER.orgName} could use vetted ${PLACEHOLDER.campus} pre-nursing and pre-medical students to help fill caregiver roles, PRN shifts, and support staffing needs, here's the candidate board:`,
      ``,
      `**[Review ${PLACEHOLDER.campus} student caregivers →](${PLACEHOLDER.welcomeUrl})**`,
      ``,
      `Lands on olera.care. The first three months are free; reply or ${SCHEDULE_LINK_SHORT} if it'd help to walk through it.`,
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
  const subject = `${PLACEHOLDER.campus} student caregivers · Olera`;
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
      `Wanted to circle back one more time on the ${PLACEHOLDER.campus} student caregiver pilot.`,
      ``,
      `If ${PLACEHOLDER.orgName} could use vetted ${PLACEHOLDER.campus} pre-nursing and pre-medical students for caregiver roles, PRN shifts, and staffing needs, the candidate board is at:`,
      ``,
      `**[Review ${PLACEHOLDER.campus} student caregivers →](${PLACEHOLDER.welcomeUrl})**`,
      ``,
      `Lands on olera.care. Reply or ${SCHEDULE_LINK_SHORT} if it'd help.`,
      ``,
      `If now isn't the right time, no worries — we'll check back next term. And if there's a better person at ${PLACEHOLDER.orgName} for us to reach about caregiver hiring, we'd appreciate a quick redirect.`,
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
        `"Hi, this is ${ctx.admin_first_name ?? "Graize"} calling from Dr. Logan DuBose's office. I'm a research assistant on Olera's ${ctx.campus_name} Student Caregiver Program."`,
        ``,
        `"I came across ${ctx.organization_name} while we were identifying home care agencies near ${ctx.campus_name} for the program, and I wanted to reach out personally. The program matches ${ctx.campus_name} pre-health students with home care agencies to help fill caregiver roles, PRN shifts, and staffing needs."`,
      ].join("\n"),
    };
  }
  return {
    title: `Day ${day} follow-up`,
    script: [
      `"Hi, this is ${ctx.admin_first_name ?? "Graize"} from Dr. Logan DuBose's office, following up on prior outreach about Olera's ${ctx.campus_name} Student Caregiver Program. Just hoping to connect with whoever handles caregiver hiring at ${ctx.organization_name}."`,
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
