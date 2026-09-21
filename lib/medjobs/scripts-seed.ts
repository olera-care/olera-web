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
 * The situations no rung covers.
 *
 * Written from the calls that worked, and meant to be edited afterwards —
 * these are a starting point, not the finished article.
 */
const SITUATIONS: Omit<SeedSection, "kind" | "section" | "rungKey">[] = [
  {
    slug: "situation-front-desk",
    title: "Reaching the front desk",
    position: 1010,
    callScript: `"Hi, my name is [your name]. I'm calling about a student caregiving program with Indiana University Bloomington students. I was trying to get in contact with somebody in recruiting — I wanted to send over an email. Is there a best address for us to send program details to?"

Then, once they give it:

"Great, let me just run that back to you. That's P as in Penelope, godfrey@homehelpershomecare.com."

"Is there a first name I can address it to?"

"And what was your name, so I can say who gave it to me? ... Thank you, Lisa."`,
    emailSubject: null,
    emailBody: null,
    notes: `Three things make this call work, and all three are easy to skip.

READ THE ADDRESS BACK, letter by letter, using words for the ambiguous ones. A mistyped address is a lead lost with no bounce and no way of knowing.

ASK FOR A FIRST NAME. It is the difference between "Good afternoon," and "Good afternoon, Melony," and it costs one sentence.

GET THE GATEKEEPER'S NAME TOO. It lets the email open with "Lisa provided me with your contact information", which is why the recipient reads past the first line. Write it in the note on the task.

You are asking for one thing: an email address. Do not pitch the program on this call. If they ask what it is, one sentence — pre-health students looking for part-time caregiving work — and back to the address.`,
  },
  {
    slug: "situation-voicemail",
    title: "Leaving a voicemail",
    position: 1020,
    callScript: `"Hello, my name is [your name]. I'm the director of a student caregiving program that connects students from Indiana University Bloomington to non-medical home care agencies for part-time work. I was hoping to get in contact with the recruitment manager so I could send over some information about the program and see if your organization would be interested in participating.

My phone number is [your number]. You're welcome to call me back. I also found an email address, care@example.com, online, so I'll go ahead and shoot over some information there.

Have a nice day."`,
    emailSubject: null,
    emailBody: null,
    notes: `Say the number slowly and say it once. Do not repeat it twice — it makes the message long and people stop listening.

Naming the email you found does two jobs: it tells them to expect the email, and it gives them a way to correct you if it is the wrong address.

Then actually send it. The email that follows a voicemail should open by saying so — "I just left a voicemail at 812-815-1296 and found this email online" — so the two arrive as one approach rather than two strangers.`,
  },
  {
    slug: "situation-non-licensed",
    title: "Checking they can hire non-licensed staff",
    position: 1030,
    callScript: `"I'm the director of a student caregiving program in Bloomington, and these students are looking for part-time work. Do you have non-licensed care that you might be able to employ them in, or are you only skilled nursing?"`,
    emailSubject: null,
    emailBody: null,
    notes: `Ask this early on any agency you are not sure about. A skilled-nursing-only agency cannot hire a pre-health student with no licence, and finding that out on the first call saves seven follow-ups and a relationship you did not need to spend.

If the answer is skilled nursing only, thank them and archive the record with that as the reason. It is not a loss.`,
  },
  {
    slug: "situation-price",
    title: "When they ask what it costs",
    position: 1040,
    callScript: null,
    emailSubject: "Re: Student Caregiver Program — how it works",
    emailBody: `Hi {first},

That's great news, and I'm glad you're interested. We already have six students who applied this week and more coming in each day, so we can get started relatively quickly.

To make sure the student is hired, performs well and is clearly worth it to you, the first confirmed hire is free.

After that our standard fee is $250 per hired student, which pays our coordinators to maintain the university funnels and the qualification process. It comes with a guarantee: if a student doesn't work enough shifts to justify the placement cost, or you aren't satisfied with their work for any reason, we refund the fee.

$250 is our standard rate and we are open to negotiation. The priority is a reasonable cost for your organization, so if this doesn't fit your budget, tell me what does and we'll keep talking.

To say it plainly: the first placement is free, so you can see whether it works before any money changes hands.

Best,
{your name}`,
    notes: `Do not lead with price. Answer it when asked, fully and without hedging, then get back to the students.

The two sentences that do the work are "the first confirmed hire is free" and "we are open to negotiation". Together they mean there is no reason to say no today.

DECISION STILL OPEN: the $250 figure is recorded as unsettled in docs/medjobs/operating/07-OPEN-DECISIONS-AND-CONFLICTS.md (C1), which also says that sending a number to every interested provider settles it in practice. It is being sent. Either ratify $250 or change this copy — do not leave the two disagreeing.`,
  },
  {
    slug: "situation-interested",
    title: "When they say they are interested",
    position: 1050,
    callScript: null,
    emailSubject: "Next steps — Student Caregiver Program",
    emailBody: `Hi {first},

I'm copying in Chantel, our lead program coordinator, to help with the next steps.

That's great news, and I'm glad {organization} is interested. We have a few students who applied this week, and for this first placement we'd like to review them with you on a call — to see whether any are a good fit and to confirm how the process works.

Do you have time for a short call this week? One of our coordinators or I can be available during most business hours. Let me know what day and time suit you.

In preparation, here are the details:

HOW IT WORKS
When a pre-health student near {organization} is qualified by our process, we notify you by email and text, and their profile appears in your portal. Some students may also call your office directly. Each profile includes their field of study, availability, background and a short video introduction. You invite the candidates you want to interview, and hire on your own terms.

THE PROCESS
1. We notify you when a student is ready.
2. You invite them to interview.
3. You hire the ones you choose.
4. We confirm the hire with you and with the student.

WHAT YOU WANT IN A CANDIDATE
Tell us your requirements — hours, shift types, certifications — and we will only send students who match. Reply to this email with them, or set them in your portal.

TERMS
There is nothing to sign and no obligation to continue. This is a pilot until the first student is hired and has proved to be worth having. We keep sending candidates until you get there. Formal terms only come up if you decide to carry on afterwards.

Looking forward to the call.

Best,
{your name}`,
    notes: `CC Chantel on this one. It is the first message where somebody other than you appears, and doing it here rather than later means the handover is already made when the call happens.

Ask for the call. Do not send this and wait — the whole message is a reason to book fifteen minutes.

"There is nothing to sign and no obligation to continue" is load-bearing. It is the sentence that stops a yes turning into a legal review.`,
  },
  {
    slug: "situation-questions",
    title: "Questions we get asked",
    position: 1060,
    callScript: null,
    emailSubject: null,
    emailBody: null,
    notes: `Add what you get asked, and what you said. Date each one. This section is the reason the document is editable.

— What does it cost? See "When they ask what it costs".
— Are they licensed? No. They are pre-health students looking for non-medical caregiving work. See "Checking they can hire non-licensed staff".
— Do we have to sign anything? No, and nothing to sign is the point. Say it early.
— How many students are there? Six applied in the week of 21 September at IU Bloomington. Use the real number; it is more convincing than "several".`,
  },
];

/** Every section the document should have, rungs first, in reading order. */
export function seedSections(): SeedSection[] {
  const out: SeedSection[] = [];
  let position = 0;

  for (const section of SECTION_ORDER) {
    LADDERS[section].steps.forEach((rung, step) => {
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
        position,
      });
    });
  }

  for (const s of SITUATIONS) {
    out.push({ ...s, kind: "situation", section: null, rungKey: null });
  }

  return out;
}
