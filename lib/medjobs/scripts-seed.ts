import { LADDERS, type SectionKey } from "./ladders";
import { scriptSlug } from "./task-board";

/**
 * What the scripts document should contain.
 *
 * The seed lives here rather than in the migration because the copy is long
 * — thirty-odd kilobytes of email bodies — and a migration that size cannot
 * be pasted into the Supabase editor in one piece. It also lives here
 * because the ladder already holds every rung's words, and a second copy in
 * SQL would be a second thing to keep in step.
 *
 * The API inserts whatever is missing, never updating what is there, so a
 * rung added next month gets a section with nothing to remember and an edit
 * made in the UI is never undone by a later read.
 */

export interface SeedSection {
  slug: string;
  kind: "rung" | "situation";
  section: string | null;
  rungKey: string | null;
  title: string;
  callScript: string | null;
  emailSubject: string | null;
  emailBody: string | null;
  notes: string | null;
  instructions: string | null;
  position: number;
}

const SECTION_ORDER: SectionKey[] = [
  "providers",
  "students",
  "jobboard",
  "advisors",
  "orgs",
  "events",
  "professors",
];

/**
 * The document before the ladders.
 *
 * Everything here is true of the job whatever campus you are on and whatever
 * rung you are standing on — the tools, what each one is for, and what to do
 * on your first day. It sits above Providers because it is what somebody
 * reads before they have a task to read about, and it is what every
 * onboarding points at rather than a memo that has to be rewritten each time.
 *
 * Seeded as a situation, not a rung, because there is no ladder behind it.
 * Position 0 puts it first: the rungs start at 10.
 */
const GENERAL: Omit<SeedSection, "kind" | "section" | "rungKey">[] = [
  {
    slug: "general-starter-pack",
    title: "Starter pack",
    position: 0,
    callScript: null,
    emailSubject: null,
    emailBody: null,
    instructions: `WHAT THIS IS

Every MedJobs Program Coordinator works from the same five tools. This is
what each one is for, so you know where a thing belongs before you go
looking for it.


OLERA ADMIN — WHERE THE WORK LIVES

The Universities tab in the admin portal is your workspace. Every task you
do — outreach to providers, advising offices, student orgs, professors,
campus events, and students — starts and gets logged there.

If it isn't logged in Admin, it didn't happen. The campus dots, the funnel,
and everyone else's view of your campus all read from what you log.


GMAIL AND GOOGLE CALENDAR — WHERE YOU WRITE

Your [name]@olera.care Google Workspace account is for all MedJobs email.
Not a personal address, not a shared inbox. Providers and universities reply
to the person who wrote to them, and the reply has to land somewhere you'll
see it. Your Olera calendar is your primary calendar for meetings.


ZOOM WORKPLACE — YOUR WORK PHONE

You have a direct Olera work number on your Zoom account. Install Zoom
Workplace on your desktop and your phone and sign in on both.

- Outbound calls go out from that number. Give it to students, providers and
  university contacts for callbacks.
- Calls to your direct number ring only you. If you don't answer, the caller
  leaves a personal voicemail you manage in Zoom.
- Record a greeting in your own voice. A default greeting on a number you
  just asked a provider to call back reads as a wrong number.
- Calls to the main Olera number where the caller picks MedJobs ring the
  MedJobs team, not only you.


CALENDLY — HOW PEOPLE BOOK YOU

Your Calendly page is wired to your Olera Google Calendar, so it only offers
times you actually have. Send the link instead of trading availability. It
saves a round of email on every meeting.


ZOOM MEETINGS — WHERE MEETINGS HAPPEN

Your Zoom account is connected to Calendly. Anything booked through your
link gets a Zoom meeting created and attached to the calendar invitation
automatically — you don't have to make one. Use the same account for
internal meetings and anything you set up by hand.


HOW THEY FIT TOGETHER

Admin is where you manage the work. Gmail is how you write. Zoom Workplace
is your phone. Calendly is how people book you. Zoom Meetings is where the
meeting happens.


YOUR SIGNATURE

Every MedJobs email goes out with the same signature, so a provider who
hears from two of us sees one program:

  [Headshot]
  [Name]
  Olera MedJobs
  Program Coordinator
  [name]@olera.care
  Call: [direct number]
  Schedule a meeting: [Calendly link]


YOUR FIRST DAY

1. Sign in to Olera Admin and open the Universities tab.
2. Sign in to Gmail and Google Calendar on your @olera.care account.
3. Install Zoom Workplace on your desktop and your phone, and sign in.
4. Record your voicemail greeting.
5. Open your Calendly page and book a test meeting with yourself. Confirm
   the Zoom link appears on the invitation.
6. Set your email signature.

Tell whoever onboarded you if any of the six won't work. Don't work around it.`,
    notes: `NOT LIVE YET — TEXTING

SMS on the work numbers is waiting on carrier registration. Until it clears,
signatures say "Call:". When it clears it becomes "Call/Text:", coordinators
can text contacts from the same number in Zoom, and this note comes out.`,
  },
  {
    slug: "general-pilot-terms",
    title: "Pilot Terms",
    position: 1,
    callScript: null,
    emailSubject: null,
    emailBody: null,
    instructions: `WHAT THIS IS

The Provider Pilot Agreement is the one document a provider signs to join
the Student Caregiver Program. One page. It is what you attach when somebody
asks what they are agreeing to, and what you send before an onboarding call
so they have read it by the time you talk.

To read it now:

  /medjobs/pilot-agreement.pdf

The onboarding rung attaches the same document, and it is in the SOP library
under Pilot terms. All three are built from one source, so they cannot
disagree.

To send it to a provider, give them the full address:

  olera.care/medjobs/pilot-agreement.pdf

Send the link rather than a file off your own desktop. When the terms change
the link changes with them and a saved copy does not.


WHAT IT SAYS, IN SIX LINES

- Free through their first hire. No fee to browse, interview, connect, or
  make that first hire, and no payment information at any point.
- Anything after the first hire is agreed in writing separately. No fee
  applies unless and until both sides have signed something.
- They are the employer. Olera recruits, vets and matches; the provider
  interviews, hires and pays. Olera is not a staffing agency.
- Feedback is optional. We may ask for it; they may say no.
- Either side can end it with written notice, and ending it does not undo
  placements already made.
- Texas law. No auto-renewal, no exclusivity, no minimum.


WHEN TO SEND IT

- With the programme pack at the onboarding rung. Attach it for review, not
  for signing — that rung's whole job is to let them read it unpressured.
- Any time a provider asks about cost or commitment before a meeting. It
  answers both faster than you can on a call.
- Before an onboarding call, so the call is about their caregivers rather
  than about the document.


IF THEY ASK A QUESTION IT DOES NOT ANSWER

Say you will find out and come back. Do not improvise a term on a call — a
sentence said out loud to a provider becomes what they believe they signed.
Bring it to Logan and the answer goes into the document, where the next
coordinator gets it too.`,
    notes: `NOT SETTLED — WHAT HAPPENS AFTER THE FIRST HIRE

The agreement names no price on purpose. What a provider pays after their
first hire has not been decided, and a number in a document that goes to
every interested provider would settle it by accident.

The public candidates page currently answers "What does it cost?" with a
figure. Until that and the agreement are reconciled, do not quote a price
from memory. Say the first hire is free and that anything beyond it is
agreed in writing, then bring the question back.`,
  },
];

/**
 * The situations no rung covers.
 *
 * Written from the calls that worked, and meant to be edited afterwards —
 * these are a starting point, not the finished article.
 */
const SITUATIONS: Omit<SeedSection, "kind" | "section" | "rungKey" | "instructions">[] = [
  {
    slug: "situation-front-desk",
    title: "Reaching the front desk",
    position: 1010,
    callScript: `Transcribed from the calls on 21 September. This is the call that
worked three times out of three in Bloomington.

YOU: "Hi, my name is [your name]. I was calling about a student caregiving
program with the Indiana University Bloomington students. I was just trying
to get in contact with somebody in recruiting — I wanted to send over an
email. I was wondering if there was a best email for us to send over program
details."

THEM: "Sure. It is pgodfrey@homehelpershomecare.com."

YOU: "Great, let me just run that back to you. That's P as in Penelope,
godfrey@homehelpershomecare.com."

YOU: "Is there a first name I can address it to, or is it just Patty?"

YOU: "And what was your name again? ... Lisa, thank you, Lisa."

YOU: "Okay, well, thank you. I'll send Patty an email. Have a nice day."

If they ask what the program is, one sentence and then back to the address:

"It basically just talks about how we vet pre-health students — pre-nursing
and pre-med students looking for part-time work — and then we send them over
to you for interviews as part of a program."

And if you have their attention, name the reply you want before you hang up:

"If it seems like something you might want to participate in, you can just
shoot me back a little 'I'm interested' note, and I can send you the next
steps."`,
    emailSubject: null,
    emailBody: null,
    notes: `Three things make this call work, and all three are easy to skip.

READ THE ADDRESS BACK, letter by letter, using a word for the ambiguous ones
— "P as in Penelope". A mistyped address is a lead lost with no bounce and no
way of knowing.

ASK FOR A FIRST NAME. It is the difference between "Good afternoon," and
"Good afternoon, Melony," and it costs one sentence.

GET THE NAME OF WHOEVER GAVE IT TO YOU. The email then opens "Lisa provided
me with your contact information", which is why it gets read past the first
line. Put both names in the note on the task.

You are asking for one thing: an email address. Do not pitch on this call.`,
  },
  {
    slug: "situation-voicemail",
    title: "Leaving a voicemail",
    position: 1020,
    callScript: `"Hello, my name is [your name]. I'm the director of a student caregiving
program that connects students from Indiana University Bloomington to
non-medical home care agencies for part-time work. I was hoping to get in
contact with the recruitment manager so that I could send over some
information about the program to see if your organization would be
interested in participating.

My phone number is [your number]. You're welcome to call me back. I also
found an email address, [address], online, so I'll go ahead and shoot over
some information there.

Have a nice day. Bye-bye."`,
    emailSubject: null,
    emailBody: null,
    notes: `Say the number once, slowly. Repeating it makes the message long and
people stop listening.

Naming the email you found does two jobs: it tells them to expect it, and it
gives them a chance to correct you if it is the wrong address.

Then actually send it, and open by saying what you just did, so the two
arrive as one approach rather than two strangers:

"I just left a voicemail at [number] and found this email online. I wanted to
share information about our Student Caregiver Program for IU Bloomington
pre-health students."`,
  },
  {
    slug: "situation-non-licensed",
    title: "Checking they can hire non-licensed staff",
    position: 1030,
    callScript: `"Hi, my name is [your name]. I had a question. I'm the director of a
student caregiving program in Bloomington, Indiana, and these students are
looking for part-time work. I was wondering if you have non-licensed care
that you might be able to employ them in, or if you are only skilled
nursing."

If they can:

"Okay, that works. I would love to send over some information on the program
to whoever handles recruiting."`,
    emailSubject: null,
    emailBody: null,
    notes: `Ask this early on any agency you are not sure about. A
skilled-nursing-only agency cannot hire a pre-health student with no licence,
and finding that out on the first call saves seven follow-ups.

If the answer is skilled nursing only, thank them and archive the record with
that as the reason. It is not a loss.`,
  },
  {
    slug: "situation-price",
    title: "When they ask what it costs",
    position: 1040,
    callScript: null,
    emailSubject: "Re: Student Caregiver Program",
    emailBody: `Hi {first},

That's great news! So glad that you're interested! We already have six students who applied this week, and more are coming in each day, so we can get started relatively quickly.

Pricing info:
To ensure the student is officially hired, performs well, and provides clear value to your organization, the first confirmed hire is completely free.

After that, our standard fee is $250 per hired student. This allows us to pay our coordinators so that they can maintain our university funnels and qualification process. That said, we have a satisfaction guarantee: if a student doesn't work an adequate number of shifts to justify the placement cost or you aren't satisfied with their work for any reason, we will refund the placement fee.

Please note that while $250 per confirmed hire is our standard rate, we are very open to negotiation. Our priority is ensuring a reasonable cost for your organization.

Please let me know if this pricing structure and guarantee work for you. If not, I would be happy to discuss what pricing model best fits your budget.

To reiterate, the first student placement is a free pilot program to ensure it's a good fit for both you and the student before moving forward with formal payment terms.

I hope that seems reasonable, and if not, I'd love to learn more about what you think makes the most sense cost-wise and keep the dialogue going.

Looking forward to talking more!

[your name]`,
    notes: `Do not lead with price. Answer it when asked, fully, then get back to
the students.

The two lines that do the work are "the first confirmed hire is completely
free" and "we are very open to negotiation". Together they mean there is no
reason to say no today.

Update the student count before you send. Six is the real number for the week
of 21 September at IU Bloomington, and a real number is more convincing than
"several".

DECISION STILL OPEN: $250 is recorded as unsettled in
docs/medjobs/operating/07-OPEN-DECISIONS-AND-CONFLICTS.md (C1), which also
says that sending a number to every interested provider settles it in
practice. It is being sent. Either ratify $250 or change this copy — do not
leave the two disagreeing.`,
  },
  {
    slug: "situation-interested",
    title: "When they say they are interested",
    position: 1050,
    callScript: null,
    emailSubject: "Next steps — Student Caregiver Program",
    emailBody: `Hi {first},

I'm CCing our lead program coordinator, Chantel, to help with the next steps.

That's great news! I'm glad to hear that {org} is interested in the program. We have a few students who applied this week, and for this first placement, we would love to review them with you on a call to see if any are a good fit, as well as confirm the details of how the process works.

Do you have time for a brief call this week to discuss how to get started with one of these students and confirm the program details? One of our coordinators or I can be available during most business hours this week. Please let me know what day and time work best for you.

In preparation for the call, here are some more details:

How It Works
When a pre-health student near {org} is qualified by our process, we will notify you by email and text, and their profile will appear in your portal. Some students may also call your office directly. Each applicant profile includes their field of study, availability, background, and a short video introduction. You simply invite the candidates you want to interview and hire on your own terms.

Process
1. We notify you when a student is ready.
2. You invite them to interview.
3. You hire the candidates you choose.
4. We confirm the hire with both you and the student.

Candidate Criteria
Let us know your specific requirements (hours, shift types, certifications, etc.), and we will work to only send matching students. You can reply to this email with your preferences, or update them directly in your portal.

Terms & Pilot Program
There is nothing to sign and no obligation to continue. This is a pilot program until the first student is hired and confirmed to be a valuable team member of your group. We will continue sending candidates until you successfully meet this goal. Formal terms will only be established if you decide to continue working with us after the first pilot student.

Looking forward to hopping on a call to go over the above details, answer any questions, and review the students that we are working with right now.

[your name]`,
    notes: `CC Chantel. This is the first message where somebody other than you
appears, and doing it here means the handover is already made by the time the
call happens.

Ask for the call. Do not send this and wait — the whole message is a reason to
book fifteen minutes.

"There is nothing to sign and no obligation to continue" is load-bearing. It
is the sentence that stops a yes turning into a legal review.`,
  },
  {
    slug: "situation-questions",
    title: "Questions we get asked",
    position: 1060,
    callScript: null,
    emailSubject: null,
    emailBody: null,
    notes: `Add what you get asked, and what you said. Date each one. This section
is the reason the document is editable.

— What does it cost? See "When they ask what it costs".
— Are they licensed? No. They are pre-health students looking for non-medical
  caregiving work. See "Checking they can hire non-licensed staff".
— Do we have to sign anything? No, and nothing to sign is the point. Say it
  early.
— How many students are there? Six applied in the week of 21 September at IU
  Bloomington. Use the real number; it is more convincing than "several".`,
  },
];

/** The rung's own explanation of itself, as one editable block. */
function rungInstructions(rung: { what?: string; why?: string; steps?: string[] }): string {
  const parts: string[] = [];
  if (rung.what) parts.push(`WHAT THIS IS\n${rung.what}`);
  if (rung.why) parts.push(`WHY\n${rung.why}`);
  if (rung.steps?.length) {
    parts.push(`WHAT TO DO\n${rung.steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}`);
  }
  return parts.join("\n\n");
}

/**
 * The order the document reads in, where it differs from the order a record
 * climbs.
 *
 * A branch is not part of the sequence, so it reads after it — except the
 * sweep on the advisor ladder, which is the first thing anybody does at a
 * campus and belongs at the top however late in the array it sits. The
 * provider sweep stays last on purpose: you research the providers you were
 * given long before you go looking for more.
 *
 * Anchors, not indexes, and the ladder check asserts every one of them names
 * a real rung — so this cannot quietly start ordering a rung that is gone.
 */
const READS_FIRST: Partial<Record<SectionKey, string[]>> = {
  advisors: ["advisorsweep"],
  orgs: ["orgsweep"],
  events: ["eventsweep"],
  professors: ["professorsweep", "permission"],
};

/**
 * Sections of the document that are not a rung.
 *
 * "Ready for students" is the goal a provider record reaches, not a job
 * somebody does — there is no task, because the record arrives there by an
 * outcome on the rung before it. It still needs somewhere to say what it
 * means and what happens next.
 */
const EXTRA: Array<{ after: string; section: SectionKey; slug: string; title: string }> = [
  {
    after: "providers-onboardfollow",
    section: "providers",
    slug: "providers-ready-for-students",
    title: "Ready for students",
  },
];

/** The sections that are deliberately not a rung, for the ladder check. */
export const NON_RUNG_SECTIONS: ReadonlySet<string> = new Set(EXTRA.map((e) => e.slug));

/** The anchors a section reads first, for the ladder check. */
export const READS_FIRST_ANCHORS: ReadonlyArray<[string, string]> = Object.entries(
  READS_FIRST,
).flatMap(([section, keys]) => (keys ?? []).map((k) => [section, k] as [string, string]));

/** Every section the document should have, rungs first, in reading order. */
export function seedSections(): SeedSection[] {
  const out: SeedSection[] = GENERAL.map((g) => ({
    ...g,
    kind: "situation" as const,
    section: "general",
    rungKey: null,
  }));
  let position = 0;

  for (const section of SECTION_ORDER) {
    const first = READS_FIRST[section] ?? [];
    const order = [...LADDERS[section].steps.entries()].sort(([, a], [, b]) => {
      const rank = (r: { name?: string; branch?: string }) =>
        first.includes(r.name ?? r.branch ?? "") ? -1 : r.branch ? 1 : 0;
      return rank(a) - rank(b);
    });
    order.forEach(([step, rung]) => {
      const slug = scriptSlug(section, step);
      if (!slug) return;
      position += 10;
      out.push({
        slug,
        kind: "rung",
        section,
        rungKey: slug.slice(section.length + 1),
        // A rounds block is one section however many rounds it has, so the
        // title drops the round number it was built with.
        title: rung.rounds ? String(rung.title ?? "").replace(/ 1$/, "") : String(rung.title ?? ""),
        callScript: rung.script ?? null,
        emailSubject: rung.email?.subject ?? null,
        emailBody: rung.email?.body ?? null,
        notes: null,
        // Everything the task screen used to print — what this is, why, and
        // the numbered steps — moved here whole. The screen shows none of it
        // now, so nothing may be dropped in the move.
        instructions: rungInstructions(rung),
        position,
      });

      // Anything that belongs beside this rung but is not one.
      for (const extra of EXTRA.filter((e) => e.after === slug)) {
        position += 10;
        out.push({
          slug: extra.slug,
          kind: "rung",
          section: extra.section,
          rungKey: extra.slug.slice(extra.section.length + 1),
          title: extra.title,
          callScript: null,
          emailSubject: null,
          emailBody: null,
          notes: null,
          instructions: null,
          position,
        });
      }
    });
  }

  for (const s of SITUATIONS) {
    out.push({ ...s, kind: "situation", section: null, rungKey: null, instructions: null });
  }

  return out;
}
