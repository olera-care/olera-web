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
}

/** All outreach emails offer a 15-min call with Logan via this Calendly. */
export const CALENDLY_URL = "https://calendly.com/caregivers979/olera-demo";

const SIGN_OFF = [
  `If you'd rather talk live, grab 15 min here: ${CALENDLY_URL}`,
  "",
  "— Olera Team",
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
 * v9 provider greeting composer. Reads the active-and-named contact
 * set and produces the appropriate salutation line. Skips contacts
 * tagged "General Inbox" (a queue isn't a person to address) and
 * stale/incorrect contacts (won't receive the email anyway).
 *
 * "Named" requires an explicit first_name or last_name. The
 * student_outreach_contacts.name field falls back to the
 * organization name when admin hasn't entered a person's name —
 * we DO NOT want "Hi HealthQuest," in the salutation. If no
 * contact has an explicit first/last name, the greeting falls
 * through to the no-name branch ("Hello,").
 *
 * Branches:
 *   0 named → "Hello,"
 *   1 named → "Hi <first>,"
 *   2 named → "Hello, I was hoping to reach <A> or <B>, or another
 *              member of the leadership team,"
 *   3+      → "Hello, I was hoping to reach <A>, <B>, or <C>, or
 *              another member of the leadership team,"
 *
 * Called at snapshot-build time so the rendered body has the
 * resolved greeting baked in — no per-recipient substitution
 * needed for providers (the team greeting is the same regardless
 * of which inbox the email lands in).
 */
export function providerSalutation(contacts: Contact[] | undefined): string {
  const named = (contacts ?? [])
    .filter((c) => c.status === "active")
    .filter((c) => c.role !== "General Inbox")
    .map((c) => {
      const first = c.first_name?.trim() || "";
      const last = c.last_name?.trim() || "";
      // Only the explicit first/last fields count. The `name` column
      // can be the org name (mirrored at materialize), which would
      // produce "Hi <Agency Name>," — wrong tone for a person-less
      // contact. No fallback to c.name on purpose.
      return [first, last].filter(Boolean).join(" ").trim();
    })
    .filter((name) => name.length > 0);

  if (named.length === 0) return "Hello,";
  if (named.length === 1) {
    const first = named[0].split(/\s+/)[0];
    return `Hi ${first},`;
  }
  const list =
    named.length === 2
      ? `${named[0]} or ${named[1]}`
      : `${named.slice(0, -1).join(", ")}, or ${named[named.length - 1]}`;
  return `Hello, I was hoping to reach ${list}, or another member of the leadership team,`;
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
  switch (stakeholder_type) {
    case "student_org":
      return {
        subject: `Paid clinical experience for ${PLACEHOLDER.orgName} members`,
        body: [
          `Hi ${PLACEHOLDER.salutation},`,
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
          `Hi ${PLACEHOLDER.salutation},`,
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
          `Dear ${PLACEHOLDER.salutation},`,
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
          `Dear ${PLACEHOLDER.salutation},`,
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
      `Hi ${PLACEHOLDER.salutation},`,
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
      `Hi ${PLACEHOLDER.salutation},`,
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
      `Hi ${PLACEHOLDER.salutation},`,
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
      `Hi ${PLACEHOLDER.salutation},`,
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
      `Hi ${PLACEHOLDER.salutation},`,
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

// ── Provider outreach (v9) ──────────────────────────────────────────────
//
// Different audience from the university templates above. The recipient
// is the owner / hiring manager of a home-care agency in a Site's
// catchment — pitched on hiring student caregivers we recruit from the
// linked university. {organization_name} is the agency; {campus_name}
// is the university whose students would be placed.

export function providerIntroEmail(
  _ctx: TemplateContext,
  contacts: Contact[] | undefined,
): EmailDraft {
  const greeting = providerSalutation(contacts);
  return {
    subject: `Caregivers at ${PLACEHOLDER.orgName} from ${PLACEHOLDER.campus} students`,
    body: [
      greeting,
      ``,
      `I'm reaching out from Olera. We connect pre-health students at ${PLACEHOLDER.campus} with home-care agencies in their area looking for reliable caregivers — flexible scheduling around coursework, motivated workers, real patient-care experience for them.`,
      ``,
      `Open to a quick 15-min intro to see if there's a fit?`,
      ``,
      `Best,`,
      `${PLACEHOLDER.adminName}`,
      ``,
      SIGN_OFF,
    ].join("\n"),
  };
}

export function providerFollowupEmail(
  _ctx: TemplateContext,
  contacts: Contact[] | undefined,
): EmailDraft {
  const greeting = providerSalutation(contacts);
  return {
    subject: `Re: Olera caregivers for ${PLACEHOLDER.orgName}`,
    body: [
      greeting,
      ``,
      `Just bubbling this up in case it got buried. We have pre-health students at ${PLACEHOLDER.campus} looking for caregiver placements — happy to share a one-pager or jump on a quick call if helpful.`,
      ``,
      `Best,`,
      `${PLACEHOLDER.adminName}`,
      ``,
      SIGN_OFF,
    ].join("\n"),
  };
}

export function providerFinalEmail(
  _ctx: TemplateContext,
  contacts: Contact[] | undefined,
): EmailDraft {
  const greeting = providerSalutation(contacts);
  return {
    subject: `Last note — Olera caregivers for ${PLACEHOLDER.orgName}`,
    body: [
      greeting,
      ``,
      `Closing the loop here. If there's a better person to reach about hiring caregivers, happy to redirect.`,
      ``,
      `Either way, thanks for your time.`,
      ``,
      `${PLACEHOLDER.adminName}`,
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
