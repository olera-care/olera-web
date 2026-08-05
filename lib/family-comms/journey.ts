/**
 * Comms journeys — the declarative "which message comes before which" map that
 * /admin/automations/[id] renders as a sequence timeline.
 *
 * WHY THIS EXISTS: the benefits cascade is ONE family experience executed by
 * TWO crons — the daily coordinator composes B1 drafts and sends B2, while the
 * hourly navigator scheduler fires the TJ-approved letters — so no single cron
 * page can show the whole picture from its own registry entry. This module is
 * the journey-level source both pages share: each page highlights the steps it
 * owns and dims (and links) the ones another automation runs.
 *
 * DRIFT GUARD: timings and gates here are hand-authored mirrors of the real
 * ladder in app/api/cron/family-comms-coordinator/route.ts and the send path
 * in lib/family-comms/benefits-navigator-send.server.ts. If you change a time
 * band, gate, or rung order there, update the matching step here (grep for
 * "journey.ts" — both files carry a pointer comment).
 *
 * Pure data + pure functions, client-safe (the detail page imports directly).
 */

export interface JourneyStep {
  key: string;
  /** Step name, e.g. "B1 · Letter sent (+ companion text)". */
  title: string;
  /** When it fires relative to the journey anchor, e.g. "Intake +2–10d". */
  timing: string;
  /** What happens, in plain terms. */
  description: string;
  /** email_log email_type(s) sent at this step — display string, may list several. */
  emailType?: string;
  /** Consent-gated text sent alongside (email_log channel='sms'), if any. */
  smsType?: string;
  /** Registry id of the automation that executes this step. Absent = event-driven. */
  ownedBy?: string;
  /** Shown instead of an owner link when the step isn't cron-driven. */
  ownerNote?: string;
  /** One-line gate note shown under the step. */
  gate?: string;
}

export interface CommsJourney {
  key: string;
  title: string;
  /** "time" = a dated sequence; "priority" = a ladder where the highest
   *  matching rung wins each cycle (order = priority, not chronology). */
  ordering: "time" | "priority";
  description: string;
  steps: JourneyStep[];
}

const BENEFITS_CASCADE: CommsJourney = {
  key: "benefits_cascade",
  title: "Benefits cascade — the family's sequence",
  ordering: "time",
  description:
    "One family journey spanning the intake event and two follow-up automations: results arrive first, the daily coordinator drafts B1 and sends B2, and the hourly scheduler (or TJ's button) fires approved letters.",
  steps: [
    {
      key: "intake_results",
      title: "Results email delivered",
      timing: "Day 0 · Intake completed",
      description:
        "The family completes the benefits finder. Their saved-results email delivers the matched programs and their living /m plan link.",
      emailType: "benefits_results_saved",
      ownedBy: "benefits-results-texts",
    },
    {
      key: "intake_results_sms",
      title: "Results link texted (optional)",
      timing: "Day 0 · When a phone is provided",
      description:
        "If the family chooses text delivery during intake or enters a number at the “Want this by text?” step, Olera immediately texts the same living /m plan link. This is the family's first text from us—not the later B1 companion text.",
      smsType: "benefits_results_sms",
      ownedBy: "benefits-results-texts",
      gate: "Requires a valid phone entered with the SMS disclosure; skipped when no phone is provided",
    },
    {
      key: "b1_draft",
      title: "B1 · Navigator letter drafted",
      timing: "Intake +2–10d",
      description:
        "The coordinator composes a personal TJ-signed first-step letter (one program, its start-here phone number, a call script, three documents) and parks it as a draft in /admin/benefits.",
      ownedBy: "family-comms-coordinator",
      gate: "Draft only — nothing reaches the family until TJ approves it in the queue",
    },
    {
      key: "b1_send",
      title: "B1 · Letter sent (+ companion text)",
      timing: "When TJ sends, or at the scheduled hour",
      description:
        "TJ's Send-as-TJ button and the hourly scheduler run one shared send path: governance caps, DNC, and suppression re-checked at fire time. A TJ-voiced companion text (the doorbell for the letter) goes out with it.",
      emailType: "benefits_first_step",
      smsType: "benefits_first_step_sms",
      ownedBy: "benefits-navigator-scheduler",
      gate: "Text requires stored phone + sms_consent; fires outside the recipient's 8am–8pm window park in sms_queue for morning",
    },
    {
      key: "b2",
      title: "B2 · Check-in (+ mirror text)",
      timing: "First step +3–14d",
      description:
        "The check that's an offer: three forward-looking chips (it's moving / I want help / not right for me). If the family already marked the call done on their /m plan, it congratulates instead of asking. The mirror text links to the living plan.",
      emailType: "benefits_check_in",
      smsType: "benefits_check_in_sms",
      ownedBy: "family-comms-coordinator",
      gate: "One-shot; skipped once an outcome is reported",
    },
    {
      key: "suppression",
      title: "Completion track paused",
      timing: "While the cascade is in flight (~21d)",
      description:
        "Benefits families are excluded from profile-completion nudges while their cascade is active — LIHEAP help never interleaves with \"finish your profile\" asks. They rejoin the completion track after resolution.",
      ownedBy: "family-comms-coordinator",
    },
  ],
};

const HELP_CASCADE_LADDER: CommsJourney = {
  key: "help_cascade_ladder",
  title: "Help-cascade ladder — how the daily pick works",
  ordering: "priority",
  description:
    "Each family gets at most ONE governed email per daily run; the first matching rung from the top wins. Global stops come first: unsubscribed, self-reported \"yes they got back to me\", or an active live thread means nothing sends.",
  steps: [
    {
      key: "r1",
      title: "R1 · Outcome check (sensor)",
      timing: "Inquiry 48–72h old, provider silent",
      description: "\"Did they get back to you?\" — the ground-truth sensor that catches stalled connections early.",
      emailType: "family_outcome_check",
      ownedBy: "family-comms-coordinator",
    },
    {
      key: "archetype",
      title: "First touch · Archetype (intent self-sort)",
      timing: "Any recent inquiry, once ever",
      description: "One question, three scenarios — captures where the family is so tone and cadence are tailored.",
      emailType: "family_archetype",
      ownedBy: "family-comms-coordinator",
    },
    {
      key: "r2",
      title: "R2 · Provider silent → alternatives",
      timing: "Provider still silent after the outcome check",
      description: "Compare-led rescue: responsive alternatives near them, one-tap introductions.",
      emailType: "family_provider_silent",
      ownedBy: "family-comms-coordinator",
    },
    {
      key: "r3",
      title: "R3 · Never engaged → compare / guide",
      timing: "Family never engaged with their inquiry",
      description: "Guide fallback when the market is thin (<3 alternatives), compare otherwise.",
      emailType: "family_never_engaged",
      ownedBy: "family-comms-coordinator",
    },
    {
      key: "r4",
      title: "R4 · Provider responded → compare + choose",
      timing: "~Day 10, family hasn't chosen",
      description: "The provider replied but the family stalled — help them compare and decide.",
      emailType: "day_10_awaiting",
      ownedBy: "family-comms-coordinator",
    },
    {
      key: "r5",
      title: "R5 · Pending reach-out",
      timing: "Reach-out delivered, family hasn't acted",
      description: "Nudges the family back to a provider's waiting reach-out message.",
      emailType: "family_reach_out_nudge",
      ownedBy: "family-comms-coordinator",
    },
    {
      key: "b1_draft",
      title: "B1 · Navigator draft (benefits cascade)",
      timing: "Benefits intake +2–10d",
      description: "Composes the TJ-signed first-step letter into the /admin/benefits queue — see the Benefits cascade sequence below for the full journey.",
      ownedBy: "family-comms-coordinator",
      gate: "Composes a draft; the send is TJ-gated and fired by the navigator scheduler",
    },
    {
      key: "b2",
      title: "B2 · Benefits check-in",
      timing: "First step +3–14d",
      description: "The forward-looking check-in, with its consent-gated mirror text.",
      emailType: "benefits_check_in",
      smsType: "benefits_check_in_sms",
      ownedBy: "family-comms-coordinator",
    },
    {
      key: "completion",
      title: "Completion track (Track 2)",
      timing: "Signup days 0/2/6/13, then monthly",
      description: "The single owner of the \"finish your profile\" ask, for any incomplete family the higher rungs didn't claim. Suppressed while a benefits cascade is in flight.",
      emailType: "completion_nudge_1–4, completion_maintenance",
      ownedBy: "family-comms-coordinator",
    },
  ],
};

const COMMS_JOURNEYS: Record<string, CommsJourney> = {
  [BENEFITS_CASCADE.key]: BENEFITS_CASCADE,
  [HELP_CASCADE_LADDER.key]: HELP_CASCADE_LADDER,
};

/** Which journeys each automation page shows, in display order. */
const JOURNEYS_BY_CRON: Record<string, string[]> = {
  "family-comms-coordinator": [HELP_CASCADE_LADDER.key, BENEFITS_CASCADE.key],
  "benefits-navigator-scheduler": [BENEFITS_CASCADE.key],
  "benefits-results-texts": [BENEFITS_CASCADE.key],
};

export function journeysForCron(cronId: string): CommsJourney[] {
  return (JOURNEYS_BY_CRON[cronId] ?? []).map((k) => COMMS_JOURNEYS[k]).filter(Boolean);
}
