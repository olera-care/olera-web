/**
 * The seven ladders — what to do, in order, for each kind of thing a
 * university holds.
 *
 * One rung is one task. A rung says what the task is, why it exists, the
 * steps, and what each button does to the record. Nothing about a rung is
 * per-university: the ladder is the operating model, and a university is
 * just a set of records climbing it.
 *
 * Criteria are not replaced by this file. `campus_channels.criteria` is
 * still what makes a channel live, and Health, the 30-day funnel and Site
 * Health all read it — so a rung that proves a criterion says so with
 * `ticks`, and finishing it writes the tick. See lib/medjobs/activation.ts
 * for the criterion keys.
 */

export type SectionKey =
  | "providers"
  | "students"
  | "jobboard"
  | "advisors"
  | "orgs"
  | "events"
  | "professors";

/** What pressing a button does to the record. */
export type Outcome =
  /** Move to the next rung — or the next follow-up inside a block. */
  | "next"
  /** They answered. Skip the rest of the follow-ups and move on. */
  | "replied"
  /** Same rung again later. */
  | "repeat"
  /** The ladder's goal is reached. */
  | "goal"
  /** Parked without reaching the goal. */
  | "archive"
  /** The whole section is closed for this university. */
  | "closed"
  /** A meeting fell through — start reschedule rounds. */
  | "reschedule"
  /** Turn the names found into their own records, each starting the next rung. */
  | "fanout";

/** A field the rung exists to find, written onto the record. */
export type ContactField = "contact" | "phone" | "email";

export interface LadderAction {
  label: string;
  outcome: Outcome;
  /** Business days until the generated task is due. 0 means today. */
  delay: number;
  /** Criterion keys this answers on the channel, if any. */
  ticks?: string[];
}

export interface LadderRung {
  title: string;
  what: string;
  why: string;
  steps: string[];
  script?: string;
  /** Renders the suggested email, addressed to the record's contact. */
  email?: boolean;
  /** Offers "They replied", which breaks out of a follow-up block. */
  reply?: boolean;
  /** Contact fields this rung collects, written onto the record. */
  collects?: ContactField[];
  /** A one-line value recorded on the task itself. */
  input?: string;
  /** A longer note recorded on the task itself. */
  textarea?: string;
  /** Names this rung would find. Each becomes its own record. */
  fanout?: string[];
  /** A block of N identical follow-ups rather than a single task. */
  rounds?: number;
  /** Comes back every season; never part of the forward sequence. */
  seasonal?: boolean;
  /** Comes back every month; never part of the forward sequence. */
  monthly?: boolean;
  /** A branch-only rung, reached by name rather than in sequence. */
  branch?: string;
  actions: LadderAction[];
}

export interface Ladder {
  label: string;
  /** What "done" means for one record on this ladder. */
  goal: string;
  /** Records arrive on their own; there is nothing to start. */
  auto?: boolean;
  /** Explains an empty section that nobody can populate by hand. */
  emptyNote?: string;
  /** The campus channel this ladder's criteria belong to. */
  channel?: "st3" | "st4" | "st5" | "st6" | "st7";
  steps: LadderRung[];
}

/** The season the current checkpoint belongs to. */
export const SEASON = "late July";

/**
 * One follow-up. Providers, advisors and orgs all run the same block of
 * seven, two business days apart, so the copy lives in one place.
 */
export function followUp(n: number, who: string): LadderRung {
  return {
    title: `Follow up ${n}`,
    what: "The two-day check on this contact.",
    why: "No reply yet.",
    steps: ["Check your inbox first.", "No reply — call, then email."],
    script: `"Hi, this is [your name] from Dr. DuBose's office — I emailed ${who} about the Student Caregiver Program. Did that reach the right person?"`,
    email: true,
    reply: true,
    actions: [{ label: "Log call and email", outcome: "next", delay: 2 }],
  };
}

export const FOLLOW_UP_ROUNDS = 7;

export const LADDERS: Record<SectionKey, Ladder> = {
  providers: {
    label: "Providers",
    goal: "signed up",
    auto: true,
    emptyNote: "Providers populate from the catchment when the university is added.",
    steps: [
      {
        title: "Call to get the right email",
        what: "A short call to find out who should receive the program email.",
        why: "A general inbox rarely reaches the owner.",
        steps: ["Call the main line.", "Ask who handles this and for their email.", "Type it in and log the call."],
        script:
          '"Hi, this is [your name] from Dr. DuBose\'s office, calling about his Student Caregiver Program. I\'d like to send your team the details — what\'s the best address?"',
        collects: ["contact", "email"],
        actions: [{ label: "Log call", outcome: "next", delay: 0 }],
      },
      {
        title: "Send the program info",
        what: "The first email to this provider, sent by you from your own inbox.",
        why: "It comes from a real person, so replies land in your inbox.",
        steps: ["Copy the email below.", "Attach the flyer.", "Send it, then log it."],
        email: true,
        actions: [{ label: "Log email sent", outcome: "next", delay: 2 }],
      },
      { rounds: FOLLOW_UP_ROUNDS, ...followUp(1, "your agency") },
      {
        title: "Schedule the meeting",
        what: "Get a time on the calendar with the sales team.",
        why: "They replied and they're interested. This is the handover.",
        steps: ["Offer two or three times.", "Confirm one.", "Put it in the calendar."],
        input: "Meeting date and time",
        actions: [{ label: "Meeting booked", outcome: "next", delay: 0 }],
      },
      {
        title: "Log the meeting",
        what: "What happened at the meeting.",
        why: "People no-show often. What happens next depends on which.",
        steps: ["Pick the outcome.", "Write a line about it."],
        textarea: "How it went",
        actions: [
          { label: "Held", outcome: "next", delay: 0 },
          { label: "No-show", outcome: "reschedule", delay: 0 },
          { label: "Needs reschedule", outcome: "reschedule", delay: 0 },
        ],
      },
      {
        title: "Confirm they've signed up to receive students",
        what: "The provider is on board and ready for placements.",
        why: "This is the goal for a provider.",
        steps: ["Confirm they've completed sign-up.", "Log it."],
        actions: [{ label: "Signed up", outcome: "goal", delay: 0 }],
      },
      {
        seasonal: true,
        title: `Seasonal check — ${SEASON}`,
        what: "Meet the provider to review the season.",
        why: "We need feedback on the students and to know if they want more next term.",
        steps: ["Book a short call.", "Ask how the students did.", "Ask if they want more next season."],
        actions: [{ label: "Logged", outcome: "goal", delay: 0 }],
      },
    ],
  },

  students: {
    label: "Students",
    goal: "hired",
    auto: true,
    emptyNote: "Students appear here when an application lands.",
    steps: [
      {
        title: "Meeting with the student",
        what: "The intro call with the applicant.",
        why: "We meet every student before putting them in front of a provider.",
        steps: ["Book a time.", "Hold it.", "Log how it went."],
        textarea: "How it went",
        actions: [{ label: "Meeting held", outcome: "next", delay: 0 }],
      },
      {
        title: "Complete their application",
        what: "Chase whatever is missing from their profile.",
        why: "An incomplete application can't be sent to a provider.",
        steps: ["Check what's missing.", "Email or call them for it.", "Log it when complete."],
        email: true,
        actions: [{ label: "Application complete", outcome: "next", delay: 0 }],
      },
      {
        title: "Get them an interview",
        what: "Put them in front of a signed-up provider.",
        why: "The interview is what turns an applicant into a hire.",
        steps: ["Pick a provider taking students.", "Introduce them.", "Confirm the interview is booked."],
        actions: [{ label: "Interview booked", outcome: "next", delay: 0 }],
      },
      {
        title: "Confirm hire",
        what: "Did they get the job?",
        why: "A hire is the outcome the whole program exists for.",
        steps: ["Ask the student.", "Confirm with the provider.", "Log it."],
        actions: [
          { label: "Hired", outcome: "next", delay: 30 },
          { label: "Not hired", outcome: "archive", delay: 0 },
        ],
      },
      {
        monthly: true,
        title: "Confirm hours worked",
        what: "The monthly check on hours.",
        why: "Hours worked is how we know the placement is real and holding.",
        steps: ["Ask the student how many hours this month.", "Type the number.", "Log it."],
        input: "Hours this month",
        actions: [{ label: "Logged", outcome: "repeat", delay: 30 }],
      },
    ],
  },

  jobboard: {
    label: "Job board",
    goal: "live",
    channel: "st3",
    steps: [
      {
        title: "Submit the job board request",
        what: "Ask the university to post the Olera listing on their job board.",
        why: "The job board is where students find us without us finding them.",
        steps: ["Find the posting request form or contact.", "Submit the listing.", "Log it."],
        email: true,
        actions: [{ label: "Request submitted", outcome: "next", delay: 3, ticks: ["submitted"] }],
      },
      {
        title: "Confirm it's approved",
        what: "Check the university approved and posted the listing.",
        why: "Submitting and posting are not the same thing.",
        steps: ["Look for the listing.", "Paste the link.", "Log it."],
        input: "Posting link",
        actions: [{ label: "Approved and live", outcome: "next", delay: 7, ticks: ["approved"] }],
      },
      {
        title: "Confirm the first student has applied",
        what: "Someone came through the board.",
        why: "A live listing nobody applies to isn't working.",
        steps: ["Check for applications.", "Log it."],
        actions: [{ label: "First applicant in", outcome: "goal", delay: 0, ticks: ["visible"] }],
      },
      {
        seasonal: true,
        title: `Confirm the listing is still live — ${SEASON}`,
        what: "The seasonal look at the posting.",
        why: "Postings expire silently.",
        steps: ["Open the posting.", "Confirm a student could still apply."],
        actions: [
          { label: "Still live", outcome: "goal", delay: 0 },
          { label: "It's gone", outcome: "next", delay: 0 },
        ],
      },
      {
        branch: "relist",
        title: "Get the listing back up",
        what: "The posting dropped off. Put it back.",
        why: "Every day it's down is a day students can't find us.",
        steps: ["Contact the job board owner.", "Resubmit.", "Confirm it's back."],
        email: true,
        actions: [{ label: "Back up", outcome: "goal", delay: 0, ticks: ["visible"] }],
      },
    ],
  },

  advisors: {
    label: "Advisors",
    goal: "circulating · meeting held",
    channel: "st4",
    steps: [
      {
        title: "Research the advising offices",
        what: "Find who advises pre-health students here.",
        why: "You need a named office before any outreach starts.",
        steps: ["Search the university site.", "Add each office you find.", "Done — each one starts its own outreach."],
        fanout: ["Pre-Health Advising Office", "Nursing Student Services"],
        actions: [{ label: "Done — start outreach", outcome: "fanout", delay: 0 }],
      },
      {
        title: "Send the program info",
        what: "The first email to this office, sent by you from your own inbox.",
        why: "There is nothing to follow up on until something has been sent.",
        steps: ["Copy the email below.", "Attach the flyer.", "Send it, then log it."],
        email: true,
        actions: [{ label: "Log email sent", outcome: "next", delay: 2, ticks: ["flyer_sent"] }],
      },
      { rounds: FOLLOW_UP_ROUNDS, ...followUp(1, "the advising office") },
      {
        title: "Confirm the flyer is circulating",
        what: "Check they actually sent it to students.",
        why: "Agreeing and sending are not the same thing.",
        steps: ["Ask how it went out.", "Log what they say."],
        actions: [
          { label: "Yes, circulating", outcome: "next", delay: 0, ticks: ["agreed", "confirmed"] },
        ],
      },
      {
        title: "Confirm a meeting with the team",
        what: "A conversation about raising awareness with students.",
        why: "The meeting is where the partnership actually forms.",
        steps: ["Offer times.", "Confirm one.", "Put it in the calendar."],
        input: "Meeting date and time",
        actions: [{ label: "Meeting booked", outcome: "next", delay: 0 }],
      },
      {
        title: "Log the meeting",
        what: "What happened at the meeting.",
        why: "People no-show often. What happens next depends on which.",
        steps: ["Pick the outcome.", "Write a line about it."],
        textarea: "How it went",
        actions: [
          { label: "Held", outcome: "goal", delay: 0 },
          { label: "No-show", outcome: "reschedule", delay: 0 },
          { label: "Needs reschedule", outcome: "reschedule", delay: 0 },
        ],
      },
      {
        seasonal: true,
        title: `Recirculate the flyer — ${SEASON}`,
        what: "Ask the office to send the flyer out again.",
        why: "A flyer sent last term isn't reaching this term's students.",
        steps: ["Email the office with the current flyer.", "Confirm it went out."],
        email: true,
        actions: [{ label: "Logged", outcome: "goal", delay: 0, ticks: ["flyer_sent"] }],
      },
    ],
  },

  orgs: {
    label: "Student orgs",
    goal: "reached this term",
    channel: "st5",
    steps: [
      {
        title: "Identify the student orgs",
        what: "Find the pre-health and nursing student organisations.",
        why: "Orgs reach students through channels we can't touch — group chats, meetings.",
        steps: ["Search the university org directory.", "Add each one you find.", "Done — each starts its own outreach."],
        fanout: ["Pre-Med Society", "Anesthesia SIG"],
        actions: [{ label: "Done — start outreach", outcome: "fanout", delay: 0 }],
      },
      {
        title: "Identify a contact at the org",
        what: "Find the president or an officer.",
        why: "Orgs have no general inbox that anyone reads.",
        steps: ["Check the org page and socials.", "Add a name and an email or phone."],
        collects: ["contact", "email", "phone"],
        actions: [{ label: "Contact found", outcome: "next", delay: 0 }],
      },
      {
        title: "Send the program info",
        what: "The first email to the officer you just named.",
        why: "There is nothing to follow up on until something has been sent.",
        steps: ["Copy the email below.", "Attach the flyer.", "Send it, then log it."],
        email: true,
        actions: [{ label: "Log email sent", outcome: "next", delay: 2 }],
      },
      { rounds: FOLLOW_UP_ROUNDS, ...followUp(1, "your organisation") },
      {
        title: "Confirm the flyer went out or a presentation is booked",
        what: "Either outcome counts — they circulate it, or they let us present.",
        why: "This is the goal for an org, and it resets every semester.",
        steps: ["Ask which one they'll do.", "Confirm it happened or is booked.", "Log it."],
        actions: [
          { label: "Flyer circulated", outcome: "goal", delay: 0 },
          { label: "Presentation booked", outcome: "goal", delay: 0 },
        ],
      },
      {
        seasonal: true,
        title: `Recirculate with the org — ${SEASON}`,
        what: "Reach the org again for the new term.",
        why: "Presidents and officers change every year.",
        steps: ["Check the contact is still there.", "Ask for the flyer to go out again."],
        email: true,
        actions: [{ label: "Logged", outcome: "goal", delay: 0 }],
      },
    ],
  },

  events: {
    label: "Campus events",
    goal: "attended",
    channel: "st6",
    steps: [
      {
        title: "Research career fairs and events",
        what: "Find the events where we could meet students face to face.",
        why: "One good fair beats a hundred cold emails.",
        steps: ["Search the university events calendar.", "Add each event worth attending.", "Done."],
        fanout: ["Fall Career Fair"],
        actions: [{ label: "Done — add events", outcome: "fanout", delay: 0 }],
      },
      {
        title: "Sign up for the event",
        what: "Register Olera as an exhibitor or attendee.",
        why: "Fairs fill up and close registration early.",
        steps: ["Find the registration.", "Sign up.", "Log it."],
        actions: [{ label: "Signed up", outcome: "next", delay: 0 }],
      },
      {
        title: "Ask the advisor about other events",
        what: "Find the events that aren't listed online.",
        why: "Advisors know about things the calendar never shows, and can help us run our own.",
        steps: ["Email the advising office.", "Ask what's coming and whether we could host something.", "Log what they say."],
        email: true,
        actions: [{ label: "Logged", outcome: "next", delay: 0 }],
      },
      {
        title: "Set the event up",
        what: "Lock the logistics — date, place, table, whatever it needs.",
        why: "An event nobody set up doesn't happen.",
        steps: ["Confirm date and location.", "Sort the logistics.", "Log it."],
        input: "Date and location",
        actions: [{ label: "Set up", outcome: "next", delay: 0 }],
      },
      {
        title: "Prepare for the event",
        what: "Everything needed before the day.",
        why: "Turning up unprepared wastes the slot.",
        steps: ["Assign a team member to lead.", "Build the collateral — deck, agenda, flyers."],
        input: "Who's leading",
        actions: [{ label: "Ready for the day", outcome: "next", delay: 0 }],
      },
      {
        title: "Attend and document",
        what: "Go, then write down what happened.",
        why: "If we don't record it we can't tell which events are worth repeating.",
        steps: ["Attend.", "Note students spoken to and applications started."],
        textarea: "How it went",
        actions: [{ label: "Log the event", outcome: "goal", delay: 0 }],
      },
      {
        seasonal: true,
        title: `What's coming this term — ${SEASON}`,
        what: "Look ahead at the term's events.",
        why: "Registration closes weeks before the event.",
        steps: ["Check the calendar.", "Add anything worth attending."],
        actions: [{ label: "Logged", outcome: "goal", delay: 0 }],
      },
    ],
  },

  professors: {
    label: "Professors",
    goal: "emailed this season",
    channel: "st7",
    steps: [
      {
        title: "Get permission to email professors",
        what: "Written approval from the dean, department chair, or another person of authority.",
        why: "We do not email professors cold. This is the gate for the whole section.",
        steps: [
          "Start with the dean or chair.",
          "Call and email asking permission.",
          "Type their name — it goes in the professor email.",
        ],
        script:
          '"Hi, this is [your name] from Dr. DuBose\'s office. We run a Student Caregiver Program and we\'d like to let your faculty know about it — would you be comfortable authorising us to email them?"',
        email: true,
        input: "Who gave permission",
        actions: [
          { label: "Permission granted", outcome: "next", delay: 0, ticks: ["pathway", "approved"] },
          { label: "Refused — close this section", outcome: "closed", delay: 0 },
        ],
      },
      {
        title: "Identify professors from the directory",
        what: "List the professors whose students fit the program.",
        why: "Targeting the right courses matters more than volume.",
        steps: ["Open the department directory.", "Add each professor worth emailing.", "Done — each gets one email."],
        fanout: ["Dr. Mehta · BIO 340", "Dr. Okafor · NUR 210"],
        actions: [{ label: "Done — add professors", outcome: "fanout", delay: 0 }],
      },
      {
        title: "Email — flyer and class visit",
        what: "One email asking them to share the flyer and offering a class visit.",
        why: "Never more than one email per professor per season. That's the rule.",
        steps: ["Copy the email — it already names who authorised us.", "Send it from your own inbox.", "Log it."],
        email: true,
        actions: [{ label: "Log email sent", outcome: "goal", delay: 0 }],
      },
      {
        seasonal: true,
        title: `Message professors again — ${SEASON}`,
        what: "The one message this season.",
        why: "A new term means new students on the roster.",
        steps: ["Send the seasonal email.", "Log it."],
        email: true,
        actions: [{ label: "Logged", outcome: "goal", delay: 0 }],
      },
    ],
  },
};

/** Column order, left to right, everywhere the seven appear together. */
export const SECTION_ORDER: SectionKey[] = [
  "providers",
  "students",
  "jobboard",
  "advisors",
  "orgs",
  "events",
  "professors",
];

/**
 * The rung at a position, with a follow-up block resolved to the round in
 * hand. `round` is 1-based and ignored outside a block.
 */
export function rungAt(section: SectionKey, step: number, round = 1): LadderRung | null {
  const rung = LADDERS[section].steps[step];
  if (!rung) return null;
  if (rung.rounds) return { ...followUp(round, followUpWho(section)), rounds: rung.rounds };
  return rung;
}

function followUpWho(section: SectionKey): string {
  if (section === "advisors") return "the advising office";
  if (section === "orgs") return "your organisation";
  return "your agency";
}

/** Every criterion key the ladders claim to answer, by channel. */
export function criteriaTicked(): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const key of SECTION_ORDER) {
    const ladder = LADDERS[key];
    if (!ladder.channel) continue;
    const keys = new Set<string>();
    for (const rung of ladder.steps)
      for (const action of rung.actions) for (const t of action.ticks ?? []) keys.add(t);
    out[ladder.channel] = [...keys];
  }
  return out;
}
