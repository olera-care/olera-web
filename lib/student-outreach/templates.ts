/**
 * Email + call-script templates.
 *
 * v3: bodies + subjects contain placeholders. The email-send module
 * substitutes per-recipient variables when actually sending. This
 * lets one editable draft go out personalized to multiple officers.
 *
 * Variables:
 *   {salutation}         per-recipient salutation, stakeholder-aware:
 *                          dept_head/professor with title → "Dr. Smith"
 *                          dept_head/professor without title → "Smith"
 *                          advisor/student_org → first name ("Marcus")
 *   {first_name}         per-recipient first name (legacy; kept for
 *                          drafts and backward compat)
 *   {organization_name}  the stakeholder's display name
 *   {campus_name}        the campus
 *   {admin_first_name}   the admin's first name (sender)
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
  /**
   * v9 multi-contact greeting input. Provider templates use the
   * active-named-contact list to compose the salutation at
   * snapshot-build time:
   *   - 0 named contacts → "Hello,"
   *   - 1 named         → "Hi {first_name},"
   *   - 2+ named        → "Hello, I was hoping to reach {names},
   *                        or another member of the leadership team,"
   * Stakeholder templates ignore this — their per-recipient
   * substitution still uses the {salutation} placeholder.
   */
  contacts?: Contact[];
  /**
   * v9 Phase 9 per-recipient variant. Provider templates branch
   * on this; stakeholder templates ignore it.
   *   "general" → body composed for the General Office contact:
   *               "Hello," + optional team reference; no
   *               first-name interpolation.
   *   "named"   → body composed for a named recipient: greeting
   *               uses {first_name} placeholder that planSequence
   *               substitutes per-recipient at queue time.
   * Default: "general" (safest fallback when caller doesn't
   * specify).
   */
  variant?: "general" | "named";
}

/**
 * All outreach emails offer a 15-min call with Dr. Logan DuBose via this
 * Calendly. Matches the calendar the existing strong staffing-outreach
 * variant uses (see lib/staffing-outreach/resend-automation.ts).
 */
export const CALENDLY_URL = "https://calendly.com/caregivers979/home-care-agency-manager-interview";

/**
 * v9 outreach sign-off. Grazie is the sender (Dr. Logan DuBose's
 * assistant); the body frames Dr. DuBose as the person the recipient
 * is being invited to meet. The HTML signature block with photo +
 * credentials is appended at send time by email-send.ts — see the
 * loganSignatureHtml constant there. This text-only block keeps the
 * body readable in PreFlight previews + plain-text fallbacks.
 */
const SIGN_OFF = [
  `Schedule a quick call with Dr. Logan DuBose: ${CALENDLY_URL}`,
  "",
  "Best,",
  "Grazie",
  "Assistant to Dr. Logan DuBose",
  "https://olera.care",
  "",
  "Reply STOP if you'd like us to stop reaching out.",
].join("\n");

const PLACEHOLDER = {
  firstName: "{first_name}",
  salutation: "{salutation}",
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
    case "provider_intro": return providerIntroEmail(ctx, ctx.contacts);
    case "provider_followup": return providerFollowupEmail(ctx, ctx.contacts);
    case "provider_final": return providerFinalEmail(ctx, ctx.contacts);
  }
}

/**
 * v9 provider greeting for the GENERAL variant. Always returns
 * "Hello," — the general variant is addressed to the General Office
 * contact (front-desk inbox / phone), never to a named person.
 *
 * The team-reference line that mentions specific named contacts
 * lives on its own line via providerLeadershipIntroLine() below;
 * keeping greeting + leadership reference as two separate strings
 * lets template bodies compose them with proper blank-line spacing.
 *
 * For the NAMED variant, templates use "Hi {first_name},"
 * directly — planSequence substitutes the recipient's actual
 * first name per task at queue time.
 */
export function providerSalutation(_contacts: Contact[] | undefined): string {
  return "Hello,";
}

/**
 * v9 provider leadership intro line. Composed alongside the
 * general "Hello," greeting when named contacts exist on the
 * outreach row, so the general-inbox recipient knows who admin
 * was actually hoping to reach.
 *
 * Branches:
 *   0 named   → null (no extra line)
 *   1 named   → "I'm hoping to reach <name>, or another member
 *                 of the leadership team."
 *   2 named   → "I'm hoping to reach <A> or <B>, or another
 *                 member of the leadership team."
 *   3+ named  → "I'm hoping to reach <A>, <B>, or <C>, or
 *                 another member of the leadership team."
 *
 * Skips contacts tagged General Office / General Inbox (those are
 * shared destinations, not named leadership) and stale contacts.
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
 * Substitute placeholders. `vars` need not be exhaustive — unmatched
 * placeholders pass through (so admin can preview a partially-substituted
 * draft).
 */
export function substituteVars(text: string, vars: {
  first_name?: string;
  salutation?: string;
  organization_name?: string;
  campus_name?: string;
  admin_first_name?: string;
}): string {
  return text
    .replace(/\{salutation\}/g, vars.salutation ?? vars.first_name ?? "{salutation}")
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

/**
 * Resolve the per-recipient salutation, stakeholder-aware:
 *
 *   dept_head / professor with title  →  "Dr. Smith"      (title + last_name)
 *   dept_head / professor with last   →  "Smith"          (last_name only)
 *   dept_head / professor with first  →  "Sarah"          (first_name fallback)
 *   advisor / student_org             →  "Marcus"         (first_name)
 *   no name at all                    →  "there"          (last-resort)
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

// ── Day-0 intro emails ──────────────────────────────────────────────────

export function introEmail(ctx: TemplateContext): EmailDraft {
  const { stakeholder_type } = ctx;
  // All stakeholder intros now frame Grazie as the sender writing on
  // behalf of Dr. Logan DuBose. Body stays stakeholder-type-specific
  // for tone (formal for dept_head/professor; informal for advisor/
  // student_org), but the Olera/Dr. DuBose framing + Calendly + sign-
  // off is consistent. SIGN_OFF (defined above) carries "Best, Grazie
  // · Assistant to Dr. Logan DuBose" so the inline closing line is
  // gone from each body — would have been a double sign-off.
  switch (stakeholder_type) {
    case "student_org":
      return {
        subject: `Paid clinical experience for ${PLACEHOLDER.orgName} members`,
        body: [
          `Hi ${PLACEHOLDER.salutation},`,
          ``,
          `I work with Dr. Logan DuBose, MD MBA — Olera co-founder and Texas A&M College of Medicine alum. He's running a pilot program that connects pre-health students with paid caregiver work: flexible hours, real patient-facing experience, and aligned with med/PA/nursing applications.`,
          ``,
          `Would ${PLACEHOLDER.orgName}'s members be interested? I've attached a one-pager you can pass around to officers or post in your group chat.`,
          ``,
          SIGN_OFF,
        ].join("\n"),
      };
    case "advisor":
      return {
        subject: `A paid, resume-building option for ${PLACEHOLDER.campus} pre-health advisees`,
        body: [
          `Hi ${PLACEHOLDER.salutation},`,
          ``,
          `I work with Dr. Logan DuBose, MD MBA at Olera. He's running a pilot pre-health student caregiver program at ${PLACEHOLDER.campus} — connecting students with paid caregiver work that gives them meaningful patient-facing hours alongside their coursework.`,
          ``,
          `Attached is a short overview you could share with advisees. Happy to set up a quick 15-minute call with Dr. DuBose if it's useful.`,
          ``,
          SIGN_OFF,
        ].join("\n"),
      };
    case "dept_head":
      return {
        subject: `Career-aligned employment opportunity for ${PLACEHOLDER.campus} pre-health students`,
        body: [
          `Dear ${PLACEHOLDER.salutation},`,
          ``,
          `I'm writing on behalf of Dr. Logan DuBose, MD MBA — Olera co-founder, NIH-funded researcher, and Texas A&M College of Medicine alum. He's running a pilot program providing paid caregiver positions tailored for pre-health students at ${PLACEHOLDER.campus}: flexible enough to work around coursework, directly relevant to clinical careers.`,
          ``,
          `Attached is a brief overview. With your approval, Dr. DuBose would love to make this opportunity available to your students.`,
          ``,
          SIGN_OFF,
        ].join("\n"),
      };
    case "professor":
      return {
        subject: `Paid clinical experience for ${PLACEHOLDER.campus} pre-health students`,
        body: [
          `Dear ${PLACEHOLDER.salutation},`,
          ``,
          `I work with Dr. Logan DuBose, MD MBA at Olera, with permission from your department. Dr. DuBose runs a pilot pre-health caregiver program at ${PLACEHOLDER.campus} — paid caregiver work designed for students balancing coursework with real clinical exposure.`,
          ``,
          `Attached is a brief overview. Would you be open to forwarding it to your students?`,
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
      `Hi ${PLACEHOLDER.salutation},`,
      ``,
      `Just bubbling this up in case it got buried. Happy to send a one-pager or set up a quick 15-min call with Dr. Logan DuBose — whichever is easier.`,
      ``,
      SIGN_OFF,
    ].join("\n"),
  };
}

export function followupSocialProofEmail(_ctx: TemplateContext): EmailDraft {
  return {
    subject: `Re: paid clinical experience for {campus_name} students`,
    body: [
      `Hi ${PLACEHOLDER.salutation},`,
      ``,
      `Wanted to share a quick example from Dr. DuBose's pilot: pre-health students at peer schools are picking up 8-15 hours a week alongside their coursework, with the kind of patient-facing experience that strengthens med/PA/nursing applications.`,
      ``,
      `If you'd like the materials to forward, just reply and I'll send them right over.`,
      ``,
      SIGN_OFF,
    ].join("\n"),
  };
}

export function followupFinalEmail(_ctx: TemplateContext): EmailDraft {
  return {
    subject: `One last note — Olera for {campus_name} students`,
    body: [
      `Hi ${PLACEHOLDER.salutation},`,
      ``,
      `Closing the loop here. If now's not the right time for Dr. DuBose's caregiver pilot, totally understand — we'll circle back next term. If it is, here's a one-line reply you can forward to students:`,
      ``,
      `>>> "Olera connects pre-health students with paid caregiver work that builds real clinical experience: https://olera.care/students"`,
      ``,
      `Either way, appreciate your time.`,
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
      `Hi ${PLACEHOLDER.salutation},`,
      ``,
      `Thanks again for your willingness to share Dr. Logan DuBose's caregiver pilot with your students! Below is a short blurb plus a link they can use to learn more and apply:`,
      ``,
      `>>> Olera connects pre-health students with paid caregiver work — flexible hours,`,
      `    real patient experience, and aligned with med/PA/nursing applications.`,
      `    Learn more: https://olera.care/students`,
      ``,
      `If a longer version or PDF would be more useful, let me know and I'll send it.`,
      ``,
      SIGN_OFF,
    ].join("\n"),
  };
}

export function partnerSeasonalEmail(_ctx: TemplateContext, season: string): EmailDraft {
  return {
    subject: `${season} update from Olera`,
    body: [
      `Hi ${PLACEHOLDER.salutation},`,
      ``,
      `Hope the term is off to a good start! Wanted to circle back as we head into ${season.toLowerCase().replace("pre-", "")} — would it be helpful to share an updated one-pager from Dr. DuBose's pilot with your students this cycle?`,
      ``,
      `Happy to also share metrics from last term if useful.`,
      ``,
      SIGN_OFF,
    ].join("\n"),
  };
}

// Backward-compat alias for callers still using the old name.
export const followupEmail = followupLightEmail;

// ── Provider outreach (v9) ──────────────────────────────────────────────
//
// Different audience from the university templates above. The recipient
// is the owner / hiring manager of a home-care agency in a Site's
// catchment — pitched on hiring student caregivers we recruit from the
// linked university. {organization_name} is the agency; {campus_name}
// is the university whose students would be placed.

/**
 * v9 helper: compose the general-variant body intro block —
 * "Hello," greeting + optional leadership-team reference line +
 * blank-line spacing. Returns an array of lines ready to spread
 * into the template body.
 */
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
  const subject = `Caregivers at ${PLACEHOLDER.orgName} from ${PLACEHOLDER.campus} students`;
  if (variant === "named") {
    return {
      subject,
      body: [
        `Hi ${PLACEHOLDER.firstName},`,
        ``,
        `I work with Dr. Logan DuBose, MD MBA — Olera co-founder, NIH-funded researcher, and Texas A&M College of Medicine alum. He's running a pilot pre-health student caregiver program at ${PLACEHOLDER.campus}, connecting motivated students with home-care agencies in the area for paid caregiver placements.`,
        ``,
        `Would you have 15 minutes for a quick call with Dr. DuBose to hear more about a potential fit at ${PLACEHOLDER.orgName}?`,
        ``,
        SIGN_OFF,
      ].join("\n"),
    };
  }
  // general variant — addressed to General Office (front-desk
  // inbox / phone). Greeting is always "Hello," with an optional
  // leadership-team reference line so the recipient knows who
  // we're actually trying to reach.
  return {
    subject,
    body: [
      ...generalIntroLines(contacts),
      `I work with Dr. Logan DuBose, MD MBA — Olera co-founder, NIH-funded researcher, and Texas A&M College of Medicine alum. He's running a pilot pre-health student caregiver program at ${PLACEHOLDER.campus}, connecting motivated students with home-care agencies in the area for paid caregiver placements.`,
      ``,
      `Would you have 15 minutes for a quick call with Dr. DuBose to hear more about a potential fit at ${PLACEHOLDER.orgName}?`,
      ``,
      SIGN_OFF,
    ].join("\n"),
  };
}

export function providerFollowupEmail(
  ctx: TemplateContext,
  contacts: Contact[] | undefined,
): EmailDraft {
  const variant = ctx.variant ?? "general";
  const subject = `Re: Olera caregivers for ${PLACEHOLDER.orgName}`;
  if (variant === "named") {
    return {
      subject,
      body: [
        `Hi ${PLACEHOLDER.firstName},`,
        ``,
        `Following up on my earlier note about Dr. Logan DuBose's pre-health student caregiver pilot at ${PLACEHOLDER.campus}.`,
        ``,
        `Dr. DuBose is happy to share more about the program on a quick 15-min call.`,
        ``,
        SIGN_OFF,
      ].join("\n"),
    };
  }
  return {
    subject,
    body: [
      ...generalIntroLines(contacts),
      `Just bubbling up my earlier note about Dr. Logan DuBose's pre-health student caregiver pilot at ${PLACEHOLDER.campus}.`,
      ``,
      `Dr. DuBose is happy to share more about the program on a quick 15-min call when convenient.`,
      ``,
      SIGN_OFF,
    ].join("\n"),
  };
}

export function providerFinalEmail(
  ctx: TemplateContext,
  contacts: Contact[] | undefined,
): EmailDraft {
  const variant = ctx.variant ?? "general";
  const subject = `Last note — Olera caregivers for ${PLACEHOLDER.orgName}`;
  if (variant === "named") {
    return {
      subject,
      body: [
        `Hi ${PLACEHOLDER.firstName},`,
        ``,
        `Last note from me — Dr. Logan DuBose is happy to share more about the pre-health student caregiver pilot at ${PLACEHOLDER.campus} if there's interest. If now isn't the right time, totally understand.`,
        ``,
        `Either way, thanks for your time.`,
        ``,
        SIGN_OFF,
      ].join("\n"),
    };
  }
  return {
    subject,
    body: [
      ...generalIntroLines(contacts),
      `Last note from me — Dr. Logan DuBose is happy to share more about the pre-health student caregiver pilot at ${PLACEHOLDER.campus} if there's interest. If there's a better person to reach about hiring caregivers at ${PLACEHOLDER.orgName}, happy to redirect.`,
      ``,
      `Either way, thanks for your time.`,
      ``,
      SIGN_OFF,
    ].join("\n"),
  };
}

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
