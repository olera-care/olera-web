/**
 * Per-stakeholder-type outreach cadence over a 14-day cycle.
 *
 * v3 model: each cadence DAY has a list of STEPS with required/optional
 * flags. The drawer renders one day's steps as a vertical checklist; the
 * required step(s) gate advancement to the next day.
 *
 * Cadence is RECOMMENDED, not enforced — admin can cancel/reschedule
 * any task. The state machine consults `firstCadenceStep` when entering
 * `outreach_sent` to queue the initial cadence task; the step list
 * inside the drawer drives the day-to-day workflow.
 */

import type { Channel, StakeholderType, TaskType } from "./types";

export type StepId = "email" | "ig_dm" | "contact_form" | "phone";

/** Template keys used by the email step. Match templates.ts. */
export type TemplateKey =
  | "intro"
  | "followup_light"
  | "followup_socialproof"
  | "followup_final"
  | "share"
  | "seasonal"
  // Advisor relationship-first cadence (R1): meeting-led cold touches; sharing
  // and the portal are deferred to the warm program-info touch + after the
  // meeting. Each email stands alone (no narrative threading).
  | "advisor_bump"
  | "advisor_info"
  | "advisor_nudge"
  | "advisor_close"
  // Student-org cadence (R1): value-first, share-led, lighter than advisors.
  // Each email stands alone; the application link is the org's unique link.
  | "org_bump"
  | "org_followup"
  | "org_close"
  // v9 provider cadence — distinct copy targeting agency owners /
  // hiring managers, not university stakeholders.
  | "provider_intro"
  | "provider_followup"
  | "provider_final"
  // Activation cadence — launched from a warm signal (reply / call /
  // meeting) to drive an interested provider to click the magic link
  // and accept Terms. Every body carries the link AND the meeting
  // option; the cadence stops on Trial Active or a booked meeting.
  | "activation_intro"
  | "activation_nudge"
  | "activation_final"
  // Partner welcome cadence — launched when a stakeholder becomes an active
  // Recruitment Partner. A slow, long nurture (every ~45-70 days) that
  // welcomes them, shares the flyer + portal link, keeps the program fresh
  // with periodic check-ins, and invites seasonal term-planning meetings
  // with Dr. DuBose.
  | "partner_welcome_intro"
  | "partner_welcome_checkin"
  | "partner_welcome_planning";

/**
 * Cadence lookup key. Stakeholder rows use their StakeholderType;
 * provider rows (kind='provider') use the explicit 'provider' key.
 * Keeps one cadence registry serving both surfaces — the universal
 * launch path goes through schedule_sequence regardless of kind.
 */
export type CadenceKey = StakeholderType | "provider" | "activation" | "partner_welcome";

export interface OutreachStep {
  id: StepId;
  channel: Channel;
  required: boolean;
  /** Email step pulls subject/body from this template. */
  template?: TemplateKey;
  /** Display label override (e.g. "Re-attempt multi-channel"). */
  label?: string;
}

export interface OutreachDay {
  day: number;
  /** Friendly title for the day, shown in the step-list header. */
  title: string;
  steps: OutreachStep[];
}

export const CADENCE_END_DAY = 14;

export const OUTREACH_DAYS_BY_TYPE: Record<CadenceKey, OutreachDay[]> = {
  // Student organizations mirror the advising-office (advisor) cadence exactly:
  // they're office-shaped partners confirmed at Pre-Flight (when a phone exists),
  // so there's no cold Day-0 paired call. Phone steps queue only when a phone is
  // on file (planSequence's has_phone gate) — most student orgs are email-only.
  student_org: [
    {
      day: 0,
      title: "Day 0 · intro email",
      steps: [{ id: "email", channel: "email", required: true, template: "intro" }],
    },
    {
      day: 3,
      title: "Day 3 · one-line bump",
      steps: [{ id: "email", channel: "email", required: true, template: "org_bump" }],
    },
    {
      day: 6,
      title: "Day 6 · call (if phone) + follow-up email",
      steps: [
        { id: "phone", channel: "phone", required: true, label: "Call — paid opportunity + speaker offer" },
        { id: "email", channel: "email", required: true, template: "org_followup" },
      ],
    },
    {
      day: 10,
      title: "Day 10 · short final",
      steps: [{ id: "email", channel: "email", required: true, template: "org_close" }],
    },
  ],
  advisor: [
    {
      // No Day-0 call for advising offices — they're confirmed by a Pre-Flight
      // call before launch, so a paired Day-0 call would be redundant.
      day: 0,
      title: "Day 0 · intro email (meeting-first)",
      steps: [{ id: "email", channel: "email", required: true, template: "intro" }],
    },
    {
      day: 3,
      title: "Day 3 · one-line bump",
      steps: [{ id: "email", channel: "email", required: true, template: "advisor_bump" }],
    },
    {
      day: 6,
      title: "Day 6 · intro call + program info email",
      steps: [
        { id: "phone", channel: "phone", required: true, label: "Intro call — info is coming, then the meeting" },
        { id: "email", channel: "email", required: true, template: "advisor_info" },
      ],
    },
    {
      day: 10,
      title: "Day 10 · short nudge",
      steps: [{ id: "email", channel: "email", required: true, template: "advisor_nudge" }],
    },
    {
      day: 14,
      title: "Day 14 · seasonal close",
      steps: [{ id: "email", channel: "email", required: true, template: "advisor_close" }],
    },
  ],
  // Dept heads (all Drs.) get a relationship-first, meeting-oriented cadence.
  // The Day-0 intro CALL is NOT a queued cadence step — it's an optional,
  // non-blocking pre-launch intro call surfaced at Pre-Flight (a confirm-the-
  // person courtesy, only when a phone exists). Post-launch calls (Day 7/11)
  // remain operational follow-ups.
  dept_head: [
    {
      day: 0,
      title: "Day 0 · formal intro email",
      steps: [{ id: "email", channel: "email", required: true, template: "intro" }],
    },
    {
      day: 5,
      title: "Day 5 · email follow-up",
      steps: [{ id: "email", channel: "email", required: true, template: "followup_light" }],
    },
    {
      day: 7,
      title: "Day 7 · call attempt",
      steps: [{ id: "phone", channel: "phone", required: true }],
    },
    {
      day: 11,
      title: "Day 11 · call attempt",
      steps: [{ id: "phone", channel: "phone", required: true }],
    },
    {
      day: 12,
      title: "Day 12 · final email",
      steps: [{ id: "email", channel: "email", required: true, template: "followup_final" }],
    },
  ],
  professor: [
    {
      day: 0,
      title: "Day 0 · intro email + paired call (post-permission)",
      steps: [
        { id: "email", channel: "email", required: true, template: "intro" },
        { id: "phone", channel: "phone", required: true, label: "Call referencing the email" },
      ],
    },
    {
      day: 3,
      title: "Day 3 · email follow-up",
      steps: [{ id: "email", channel: "email", required: true, template: "followup_light" }],
    },
    {
      day: 7,
      title: "Day 7 · email follow-up + call",
      steps: [
        { id: "email", channel: "email", required: true, template: "followup_socialproof" },
        { id: "phone", channel: "phone", required: true },
      ],
    },
    {
      day: 10,
      title: "Day 10 · final email",
      steps: [{ id: "email", channel: "email", required: true, template: "followup_final" }],
    },
    {
      day: 11,
      title: "Day 11 · call attempt",
      steps: [{ id: "phone", channel: "phone", required: true }],
    },
  ],
  // v10 provider cadence (Phase 1 Bullet 2, 2026-06-04). Targets non-
  // medical home care agencies — owners / hiring managers, not
  // university stakeholders. 3 emails + 2 calls over 7 days.
  //
  // What changed from v9:
  //   - Day 0 paired call REMOVED. The "verify contacts / confirm
  //     decision maker" call moved into Pre-Flight under v9.x. Cold
  //     Day 0 calls were redundant + too aggressive given the email
  //     just went out.
  //   - Day 1 follow-up call REMOVED entirely. Too soon to follow up
  //     on Day 0 email; created friction without proportional signal.
  //   - Day 3 gains a phone step alongside the email (was email only).
  //     The Day 3 call is the "did you get our email?" check + offer
  //     a Dr. DuBose meeting if helpful.
  //
  // Phone steps still gated on has_phone at queue time (planSequence
  // skips them when absent).
  provider: [
    {
      day: 0,
      title: "Day 0 · intro email",
      steps: [
        { id: "email", channel: "email", required: true, template: "provider_intro" },
      ],
    },
    {
      day: 3,
      title: "Day 3 · light follow-up + check-in call",
      steps: [
        { id: "email", channel: "email", required: true, template: "provider_followup" },
        { id: "phone", channel: "phone", required: true, label: "\"Did you get our email Monday?\"" },
      ],
    },
    {
      day: 5,
      title: "Day 5 · call attempt",
      steps: [{ id: "phone", channel: "phone", required: true }],
    },
    {
      day: 7,
      title: "Day 7 · final follow-up",
      steps: [{ id: "email", channel: "email", required: true, template: "provider_final" }],
    },
  ],
  // Activation cadence (Phase 1, 2026-06-09). Launched from a warm signal
  // — an interested email reply, an interested call, or a meeting — to
  // nudge the provider to click their magic link and accept Terms. Offers
  // the link AND a meeting option in every touch. 3 emails + 1 call over
  // 7 days. The call step queues only if a phone number exists. The cadence
  // is stopped by the activation auto-stop (Trial Active) or a booked
  // meeting. The Day 0 opener varies by source — the launch screen seeds
  // activation_intro (reply/call) or activation_postmeeting_intro and the
  // admin edits it before launch.
  activation: [
    {
      day: 0,
      title: "Now · activation link + meeting offer",
      steps: [
        { id: "email", channel: "email", required: true, template: "activation_intro" },
      ],
    },
    {
      day: 2,
      title: "Day 2 · nudge",
      steps: [
        { id: "email", channel: "email", required: true, template: "activation_nudge" },
      ],
    },
    {
      day: 4,
      title: "Day 4 · check-in call",
      steps: [
        { id: "phone", channel: "phone", required: true, label: "Activation check-in call" },
      ],
    },
    {
      day: 7,
      title: "Day 7 · soft final",
      steps: [
        { id: "email", channel: "email", required: true, template: "activation_final" },
      ],
    },
  ],
  // Partner welcome cadence (MVP, 2026-06-11). Begins when a stakeholder is
  // promoted to an active Recruitment Partner (the "Make a partner" button).
  // Email-only, delivered via its own per-campus Smartlead campaign. Six
  // touches spread every ~45-70 days across roughly a 10-month loop so the
  // program stays top-of-mind without overdoing it:
  //   Day 0   welcome + flyer + portal link, sets expectations
  //   Day 45  light check-in
  //   Day 110 term-planning meeting invite (Dr. DuBose)
  //   Day 165 light check-in
  //   Day 230 term-planning meeting invite
  //   Day 300 term-planning meeting invite
  // Seasonal beats (pre-Fall/Spring/Summer) are approximated by the relative
  // spacing in MVP rather than pinned to real semester start dates.
  partner_welcome: [
    {
      day: 0,
      title: "Welcome · flyer + partner portal",
      steps: [
        { id: "email", channel: "email", required: true, template: "partner_welcome_intro" },
      ],
    },
    {
      day: 45,
      title: "Day 45 · check-in",
      steps: [
        { id: "email", channel: "email", required: true, template: "partner_welcome_checkin" },
      ],
    },
    {
      day: 110,
      title: "Day 110 · term-planning meeting",
      steps: [
        { id: "email", channel: "email", required: true, template: "partner_welcome_planning" },
      ],
    },
    {
      day: 165,
      title: "Day 165 · check-in",
      steps: [
        { id: "email", channel: "email", required: true, template: "partner_welcome_checkin" },
      ],
    },
    {
      day: 230,
      title: "Day 230 · term-planning meeting",
      steps: [
        { id: "email", channel: "email", required: true, template: "partner_welcome_planning" },
      ],
    },
    {
      day: 300,
      title: "Day 300 · term-planning meeting",
      steps: [
        { id: "email", channel: "email", required: true, template: "partner_welcome_planning" },
      ],
    },
  ],
};

/** First day's first step — used by state-machine on enter outreach_sent. */
export function firstCadenceStep(type: CadenceKey): { day: number; task_type: TaskType } {
  const first = OUTREACH_DAYS_BY_TYPE[type][0];
  return {
    day: first.day,
    task_type: dayToTaskType(first),
  };
}

/** Day strictly after currentDay. Returns null if cycle exhausted. */
export function nextCadenceDay(type: CadenceKey, currentDay: number): OutreachDay | null {
  return OUTREACH_DAYS_BY_TYPE[type].find((d) => d.day > currentDay) ?? null;
}

/** Day matching currentDay (for the active step list). */
export function currentCadenceDay(type: CadenceKey, currentDay: number): OutreachDay | null {
  return OUTREACH_DAYS_BY_TYPE[type].find((d) => d.day === currentDay) ?? null;
}

/** Compute due_at offset (in days) for a target day, anchored to "now". */
export function daysFromNow(deltaDays: number): Date {
  return new Date(Date.now() + Math.max(0, deltaDays) * 86_400_000);
}

/**
 * Map a cadence day to the legacy `task_type` enum value used in the
 * tasks table. Each day gets one task representing "Day N is due."
 */
export function dayToTaskType(day: OutreachDay): TaskType {
  // The day's primary step's channel decides the task category.
  const primary = day.steps[0];
  if (primary?.channel === "phone") return "outreach_followup_call";
  // Multi-channel days use the multichannel task type.
  if (day.steps.length > 1 && day.steps.some((s) => s.channel === "ig_dm")) {
    return "outreach_multichannel_orgs";
  }
  if (day.day === 0 && day.steps.some((s) => s.channel === "phone")) {
    return "outreach_day_0";
  }
  return "outreach_followup_email";
}
