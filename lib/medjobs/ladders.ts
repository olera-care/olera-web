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
export type ContactField = "contact" | "role" | "phone" | "email";

/**
 * The copy an operator sends. Tokens are filled at render time:
 *   {university} {org} {contact} {first} {role} {flyer} {approver}
 * A token with nothing behind it falls back to something that still reads
 * as a sentence, so a half-filled record never produces "Hi ,".
 */
export interface LadderEmail {
  subject: string;
  body: string;
}

export interface LadderInput {
  /** Stable key the value is stored under on the task. */
  key: string;
  label: string;
  /** Defaults to a plain text field. */
  type?: "text" | "datetime-local" | "url" | "number";
}

export interface LadderAction {
  label: string;
  outcome: Outcome;
  /** Business days until the generated task is due. 0 means today. */
  delay: number;
  /** Criterion keys this answers on the channel, if any. */
  ticks?: string[];
  /**
   * Go to the branch rung of this name rather than the next in sequence.
   *
   * A branch is skipped when climbing, which is the point of it — but an
   * outcome that exists to reach one then had nowhere to go, and fell off
   * the end of the ladder into the goal. "The posting is gone" marked the
   * job board live.
   */
  goto?: string;
}

export interface LadderRung {
  title: string;
  what: string;
  why: string;
  steps: string[];
  script?: string;
  /** The email to send, with tokens filled from the record. */
  email?: LadderEmail;
  /** Offers "They replied", which breaks out of a follow-up block. */
  reply?: boolean;
  /** Contact fields this rung collects, written onto the record. */
  collects?: ContactField[];
  /** Values the rung records on the task itself. Typed, so a date is a date
   *  picker and a link is a link field rather than a box you can put
   *  anything in. */
  inputs?: LadderInput[];
  /** A longer note recorded on the task itself. */
  textarea?: string;
  /**
   * A document to look at while doing this. Served through the guarded SOP
   * route by key, never as a public URL — these are internal.
   */
  attachment?: { label: string; doc: string };
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
  /**
   * A name an action can aim at without making the rung a branch.
   *
   * A seasonal rung has to stay visible under "still to come", which a
   * branch does not, but something still has to be able to queue it — a
   * recurring check that nothing ever queues is a promise on a screen.
   */
  name?: string;
  /**
   * A fact about the record that makes this rung already true.
   *
   * Some rungs are not work at all — they are a state the system can see.
   * A student whose application is complete has completed it whether or not
   * anybody chased them, and asking somebody to tick that is asking them to
   * copy the database into the database.
   *
   * The board computes these facts per record; a rung whose fact holds is
   * shown as done and stepped over when climbing. It is what lets this
   * ladder stay in order while the order stops mattering.
   */
  satisfiedBy?: string;
  /** What to say under a rung the system satisfied, instead of an outcome. */
  satisfiedNote?: string;
  /**
   * Reaching this rung means everything before it is moot.
   *
   * An interview on the calendar says the earlier rungs happened one way or
   * another. A finished application does not: nobody has met that student
   * yet, and meeting them is still the next thing to do.
   */
  supersedes?: boolean;
  /**
   * Worked on the record itself rather than through the task screen.
   *
   * Some rungs are not an event to log. Checking that what we hold about a
   * provider is true is done by reading the record and fixing it, so the
   * record is the screen, and the rung is a checkbox in its To do band.
   * There is nothing to script, nothing to send and no outcome to pick —
   * offering notes, deferrals and four buttons would be furniture around an
   * act that is already finished by the time you reach for them.
   */
  check?: boolean;
  actions: LadderAction[];
}

export interface Ladder {
  label: string;
  /** What "done" means for one record on this ladder. */
  goal: string;
  /** Records arrive on their own; there is nothing to start. */
  auto?: boolean;
  /**
   * The university has exactly one of these, so the section is the record.
   *
   * Opening it should not cost two clicks — one into a list, one onto the
   * only thing in it. The list is furniture around a single object.
   */
  singleton?: boolean;
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
    script: `"Hi, this is [your name] from Dr. DuBose's office. I emailed ${who} last week about our Student Caregiver Program — students who work paid caregiving shifts around their classes. Did that reach the right person, or is there someone better I should send it to?"`,
    email: {
      subject: "Following up — Student Caregiver Program at {university}",
      body: `Hi {first},

Following up on my note about the Student Caregiver Program. The short version: we place pre-health students at {university} into paid caregiving shifts that work around their class schedule, and they come to you screened and ready.

There is nothing to sign up front — a short call is enough to see whether it fits.

Is there a day this week or next that works?

The one-page overview is here if it is easier to forward: {flyer}

Best,
[your name]
Dr. Logan DuBose's office · Olera`,
    },
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
        check: true,
        title: "Research",
        what: "Check what we hold against the provider's own website, before anyone calls.",
        why: "Every wrong number caught here is a call nobody has to waste later.",
        steps: [
          "Open the record and find their website.",
          "Review their website and fix anything that's wrong.",
          "Confirm their address is no more than 60 minutes from the university.",
        ],
        actions: [{ label: "Done", outcome: "next", delay: 0 }],
      },
      {
        title: "Call to confirm the right contact",
        what: "A short call to confirm who we should be talking to, and how to reach them.",
        why: "The research gives us a name and an address. Only the call proves they are the right ones.",
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
        steps: ["Copy the email below.", "Check the flyer link opens.", "Send it, then log it."],
        email: {
          subject: "Pre-health students looking for caregiving shifts — {university}",
          body: `Hi {first},

I am writing from Dr. Logan DuBose's office about the Student Caregiver Program at {university}.

We work with pre-health students — pre-med, pre-nursing, pre-PA — who want paid, hands-on caregiving experience before they apply to professional school. They are motivated, they are local, and they are looking for shifts that fit around classes.

What it means for {org}:

  · Screened students, matched to your openings
  · They work your shifts, on your terms
  · No cost to you, and nothing to sign to start

One-page overview: {flyer}

If it is worth fifteen minutes, I will find a time that suits you.

Best,
[your name]
Dr. Logan DuBose's office · Olera`,
        },
        actions: [{ label: "Log email sent", outcome: "next", delay: 2 }],
      },
      { rounds: FOLLOW_UP_ROUNDS, ...followUp(1, "your agency") },
      {
        title: "Schedule the meeting",
        what: "Get a time on the calendar with the sales team.",
        why: "They replied and they're interested. This is the handover.",
        steps: ["Offer two or three times.", "Confirm one.", "Put it in the calendar."],
        inputs: [{ key: "meeting_at", label: "Meeting date and time", type: "datetime-local" }],
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
        // Not every student needs one, and a student who has already been
        // interviewed plainly did not. The second outcome exists so nobody
        // has to log a meeting that never happened to move a record on.
        actions: [
          { label: "Meeting held", outcome: "next", delay: 0 },
          { label: "No meeting needed", outcome: "next", delay: 0 },
        ],
      },
      {
        title: "Complete their application",
        what: "Chase whatever is missing from their profile.",
        why: "An incomplete application can't be sent to a provider.",
        steps: ["Check what's missing.", "Email or call them for it.", "Log it when complete."],
        // They may finish it themselves, and most will. The record says so
        // the moment they go live.
        satisfiedBy: "application_complete",
        satisfiedNote: "They completed it themselves.",
        email: {
          subject: "One thing left on your Olera application",
          body: `Hi {first},

Thanks for applying to the Student Caregiver Program. Your profile is nearly there — there is one piece still outstanding before we can put you in front of a provider.

Once that is in, I can start matching you to shifts near campus.

Reply here and I will walk you through it.

Best,
[your name]
Dr. Logan DuBose's office · Olera`,
        },
        actions: [{ label: "Application complete", outcome: "next", delay: 0 }],
      },
      {
        title: "Get them an interview",
        what: "Put them in front of a signed-up provider.",
        why: "The interview is what turns an applicant into a hire.",
        steps: ["Pick a provider taking students.", "Introduce them.", "Confirm the interview is booked."],
        satisfiedBy: "interview_booked",
        satisfiedNote: "An interview is on the calendar.",
        supersedes: true,
        actions: [{ label: "Interview booked", outcome: "next", delay: 0 }],
      },
      {
        title: "Confirm hire",
        what: "Did they get the job?",
        why: "A hire is the outcome the whole program exists for.",
        steps: ["Ask the student.", "Confirm with the provider.", "Log it."],
        satisfiedBy: "hired",
        satisfiedNote: "A placement was accepted.",
        supersedes: true,
        // Reaching the goal, and earning the monthly check with it. Plain
        // "next" would queue the hours and leave the record reading as
        // unfinished, which is the opposite of what a hire means.
        actions: [
          { label: "Hired", outcome: "goal", delay: 30, goto: "hours" },
          { label: "Not hired", outcome: "archive", delay: 0 },
        ],
      },
      {
        monthly: true,
        name: "hours",
        title: "Confirm hours worked",
        what: "The monthly check on hours.",
        why: "Hours worked is how we know the placement is real and holding.",
        steps: ["Ask the student how many hours this month.", "Type the number.", "Log it."],
        inputs: [{ key: "hours", label: "Hours this month", type: "number" }],
        actions: [{ label: "Logged", outcome: "repeat", delay: 30 }],
      },
    ],
  },

  jobboard: {
    label: "Job board",
    goal: "live",
    channel: "st3",
    // One board per university. The list around it was furniture.
    singleton: true,
    steps: [
      {
        check: true,
        title: "Research",
        // No {university} token: the help panel shows a rung as written, and
        // only the email copy is filled from the record. A token here reached
        // the screen as a token.
        what: "Find where the university lets an employer post a job, and record the way in.",
        why: "Every campus does this differently — Handshake, a career-services form, an email to a person.",
        steps: [
          "Search for the university career centre or student job board.",
          "Find where an employer creates an account or submits a posting. Put that in Job board link.",
          "If a person or an inbox owns it, add them under Add a contact. Optional.",
        ],
        actions: [{ label: "Done", outcome: "next", delay: 0 }],
      },
      {
        title: "Confirm it's submitted",
        what: "Get the Olera listing in front of the university, however this campus takes it.",
        why: "The job board is where students find us without us finding them.",
        steps: [
          "Open the job board link on the record.",
          "Submit the listing. Use the example posting as the template.",
          "Log it here.",
        ],
        attachment: { label: "Example posting", doc: "posting" },
        email: {
          subject: "Job posting request — paid caregiving roles for pre-health students",
          body: `Hello,

I would like to post a role on the {university} student job board.

  Position    Student Caregiver (part-time, paid)
  Employer    Olera, on behalf of local licensed care providers
  Who it fits Pre-health students — pre-med, pre-nursing, pre-PA
  Schedule    Flexible shifts built around class timetables
  Apply       {flyer}

Students are screened by us and placed with licensed providers in the area. Happy to send anything else your posting process needs.

Thank you,
[your name]
Dr. Logan DuBose's office · Olera`,
        },
        // Two business days, because approval is somebody else's queue.
        actions: [{ label: "Submitted", outcome: "next", delay: 2, ticks: ["submitted"] }],
      },
      {
        title: "Confirm it's approved",
        what: "Check the university approved and posted the listing.",
        why: "Submitting and posting are not the same thing.",
        steps: [
          "Look for the listing on their board.",
          "Put the link in Listing link on the record.",
          "Log it here.",
        ],
        actions: [{ label: "Approved and live", outcome: "next", delay: 2, ticks: ["approved"] }],
      },
      {
        title: "Confirm the first student has applied",
        what: "Someone came through the board.",
        why: "A live listing nobody applies to isn't working.",
        steps: ["Check for applications.", "Log it."],
        // The one that turns the light green: with submitted and approved
        // already ticked, this completes the channel. Reaching the goal is
        // also what earns the seasonal check, roughly a term out.
        actions: [
          { label: "First applicant in", outcome: "goal", delay: 120, ticks: ["visible"], goto: "seasonal" },
        ],
      },
      {
        seasonal: true,
        name: "seasonal",
        title: `Confirm the listing is still live — ${SEASON}`,
        what: "The seasonal look at the posting.",
        why: "Postings expire silently.",
        steps: ["Open the listing link.", "Confirm a student could still apply."],
        attachment: { label: "Example posting", doc: "posting" },
        actions: [
          { label: "Still live", outcome: "goal", delay: 120, goto: "seasonal" },
          { label: "It's gone", outcome: "next", delay: 0, goto: "relist" },
        ],
      },
      {
        branch: "relist",
        title: "Get the listing back up",
        what: "The posting dropped off. Put it back.",
        why: "Every day it's down is a day students can't find us.",
        steps: ["Contact the job board owner.", "Resubmit.", "Confirm it's back."],
        email: {
          subject: "Re-posting the Student Caregiver role — {university}",
          body: `Hello,

Our Student Caregiver posting appears to have expired from the {university} job board. Students are still applying through other channels, so we would like it back up.

Same role as before — part-time paid caregiving shifts for pre-health students, flexible around classes. Details here: {flyer}

Is there anything you need from me to renew it?

Thank you,
[your name]
Dr. Logan DuBose's office · Olera`,
        },
        actions: [
          { label: "Back up", outcome: "goal", delay: 120, ticks: ["visible"], goto: "seasonal" },
        ],
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
        email: {
          subject: "Paid caregiving shifts for your pre-health students — {university}",
          body: `Hi {first},

I am writing from Dr. Logan DuBose's office. We run the Student Caregiver Program, which places pre-health students at {university} into paid caregiving shifts with licensed local providers.

It is built for the students you advise: paid hands-on patient contact, hours that work around a class schedule, and a reference and recommendation letter at the end. No cost to the student and no cost to the university.

Would you be willing to pass the one-pager to your pre-health list? It is here: {flyer}

Happy to talk it through first if that is easier.

Best,
[your name]
Dr. Logan DuBose's office · Olera`,
        },
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
        inputs: [{ key: "meeting_at", label: "Meeting date and time", type: "datetime-local" }],
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
        email: {
          subject: "New term, new flyer — Student Caregiver Program",
          body: `Hi {first},

New term, so a fresh copy of the Student Caregiver flyer for your pre-health students: {flyer}

Same programme — paid caregiving shifts with local licensed providers, built around a class schedule. Placements from last term are going well and we have openings again.

Would you be able to send it out with your usual student mail?

Thank you,
[your name]
Dr. Logan DuBose's office · Olera`,
        },
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
        steps: [
          "Check the org page and socials.",
          "Add their name and what they are to the org — president, vice-president, outreach chair.",
          "Add an email, and a phone if you can find one.",
        ],
        collects: ["contact", "role", "email", "phone"],
        actions: [{ label: "Contact found", outcome: "next", delay: 0 }],
      },
      {
        title: "Send the program info",
        what: "The first email to the officer you just named.",
        why: "There is nothing to follow up on until something has been sent.",
        steps: ["Copy the email below.", "Attach the flyer.", "Send it, then log it."],
        email: {
          subject: "Something for your members — paid caregiving shifts",
          body: `Hi {first},

I am writing from Dr. Logan DuBose's office about the Student Caregiver Program, and I think it fits {org} well.

We place pre-health students into paid caregiving shifts with licensed providers near {university}. Members get real patient contact before they apply to professional school, paid, on a schedule that works around classes.

Two ways we usually work with a group like yours:

  · You share the one-pager with your members: {flyer}
  · Or we come to a meeting and present for ten minutes

Either is fine. Which suits {org} better?

Best,
[your name]
Dr. Logan DuBose's office · Olera`,
        },
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
        email: {
          subject: "Checking in for the new term — {org}",
          body: `Hi {first},

New term, so checking in. Are you still the right person for {org}, or has the committee changed hands?

The Student Caregiver Program is running again with openings near campus — paid caregiving shifts for pre-health students. Current flyer: {flyer}

If you can send it round, or if a ten-minute slot at a meeting is easier, let me know which works.

Thank you,
[your name]
Dr. Logan DuBose's office · Olera`,
        },
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
        email: {
          subject: "Anything coming up we should be at? — {university}",
          body: `Hi {first},

We are looking at which {university} events are worth attending this term for the Student Caregiver Program — career fairs, pre-health nights, anything where we would meet students face to face.

Two questions:

  1. Is there anything coming up that is not on the public calendar?
  2. Would you ever co-host a short info session with us?

We bring the material and the people; you bring the room and the students.

Thank you,
[your name]
Dr. Logan DuBose's office · Olera`,
        },
        actions: [{ label: "Logged", outcome: "next", delay: 0 }],
      },
      {
        title: "Set the event up",
        what: "Lock the logistics — date, place, table, whatever it needs.",
        why: "An event nobody set up doesn't happen.",
        steps: ["Confirm date and location.", "Sort the logistics.", "Log it."],
        inputs: [
          { key: "event_at", label: "Event date and time", type: "datetime-local" },
          { key: "event_place", label: "Location" },
        ],
        actions: [{ label: "Set up", outcome: "next", delay: 0 }],
      },
      {
        title: "Prepare for the event",
        what: "Everything needed before the day.",
        why: "Turning up unprepared wastes the slot.",
        steps: ["Assign a team member to lead.", "Build the collateral — deck, agenda, flyers."],
        inputs: [{ key: "lead", label: "Who's leading" }],
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
        email: {
          subject: "Permission to contact faculty about a student programme",
          body: `Dear {first},

I am writing from Dr. Logan DuBose's office to ask permission before contacting any faculty in your department.

We run the Student Caregiver Program: pre-health students take paid caregiving shifts with licensed providers near {university}, built around their class schedule. It gives them real patient contact before professional school.

We would like to let a small number of faculty know, so they can mention it to students for whom it fits. One email each, once a term — we do not contact faculty repeatedly.

Overview: {flyer}

May we have your approval to do that? If you would rather we did not, tell me and we will close the file on faculty outreach here.

With thanks,
[your name]
Dr. Logan DuBose's office · Olera`,
        },
        inputs: [{ key: "approver", label: "Who gave permission" }],
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
        email: {
          subject: "For your students: paid caregiving shifts (approved by {approver})",
          body: `Dear {first},

{approver} approved us contacting faculty about this, so I am writing once with something that may suit your students.

The Student Caregiver Program places pre-health students into paid caregiving shifts with licensed providers near {university}. Hands-on patient experience, paid, arranged around a class timetable — the kind of thing that strengthens a professional school application.

Two offers, take either or neither:

  · Share the one-pager with your class: {flyer}
  · We come and speak for ten minutes at the start of a session

This is the only email you will get from me this term.

With thanks,
[your name]
Dr. Logan DuBose's office · Olera`,
        },
        actions: [{ label: "Log email sent", outcome: "goal", delay: 0 }],
      },
      {
        seasonal: true,
        title: `Message professors again — ${SEASON}`,
        what: "The one message this season.",
        why: "A new term means new students on the roster.",
        steps: ["Send the seasonal email.", "Log it."],
        email: {
          subject: "New term — Student Caregiver Program at {university}",
          body: `Dear {first},

New term, so one note about the Student Caregiver Program: paid caregiving shifts for pre-health students with licensed providers near {university}, arranged around their classes.

Current one-pager: {flyer}

Same offer as before — share it with your students, or we will come and speak for ten minutes. Either way, this is my one email this term.

With thanks,
[your name]
Dr. Logan DuBose's office · Olera`,
        },
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
