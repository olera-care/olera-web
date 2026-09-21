-- ===========================================================================
-- 239 — medjobs_scripts
-- ===========================================================================
-- The master scripts and email copy, in one place everyone can edit.
--
-- It used to live in lib/medjobs/ladders.ts, shown inline on a task behind a
-- "Show suggested call script and email copy" toggle. That put the copy where
-- only someone who could commit to the repo could improve it, and repeated it
-- on every rung's screen rather than anywhere you could read end to end or
-- train somebody from.
--
-- So the copy moves here and the task links to it. One row per rung, plus
-- rows for the situations no rung covers — the front desk, the voicemail,
-- the price question, the reply that says yes. `notes` is the part that
-- grows: what worked, what they asked, what to say next time.
--
-- Access is through the service client, which bypasses RLS, the same as
-- every other admin-only table here. RLS is on so the anon key reads nothing.
-- ===========================================================================

CREATE TABLE IF NOT EXISTS medjobs_scripts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- The anchor a task deep-links to. Stable: renaming a rung's title must
  -- not break every link into the document.
  slug          TEXT NOT NULL UNIQUE,
  kind          TEXT NOT NULL CHECK (kind IN ('rung', 'situation')),
  -- Which ladder, and which rung on it. Null on a situation.
  section       TEXT,
  rung_key      TEXT,
  title         TEXT NOT NULL,
  call_script   TEXT,
  email_subject TEXT,
  email_body    TEXT,
  -- What we have learned. Common questions, what worked, what not to say.
  -- The reason the document is a table and not a file.
  notes         TEXT,
  position      INT NOT NULL DEFAULT 0,
  updated_by    UUID,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One row per rung, so a second seed run cannot double the document.
CREATE UNIQUE INDEX IF NOT EXISTS uq_medjobs_scripts_rung
  ON medjobs_scripts (section, rung_key)
  WHERE kind = 'rung';

CREATE INDEX IF NOT EXISTS idx_medjobs_scripts_position
  ON medjobs_scripts (position);

ALTER TABLE medjobs_scripts ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE medjobs_scripts IS
  'The master call scripts, email copy and situation notes for MedJobs. '
  'One row per ladder rung plus one per situation no rung covers. Edited '
  'from /admin/medjobs/sop/scripts, and linked from every task.';

-- ===========================================================================
-- Seed: every rung's copy as it stands in the ladder today.
-- ===========================================================================
-- ON CONFLICT DO NOTHING, so re-running this file never overwrites an edit
-- somebody made in the UI.

INSERT INTO medjobs_scripts
  (slug, kind, section, rung_key, title, call_script, email_subject, email_body, notes, position)
VALUES
  ($sq$providers-research$sq$, 'rung', $sq$providers$sq$, $sq$research$sq$, $sq$Research$sq$, NULL, NULL, NULL, NULL, 10),
  ($sq$providers-call-to-confirm-the-right-contact$sq$, 'rung', $sq$providers$sq$, $sq$call-to-confirm-the-right-contact$sq$, $sq$Call to confirm the right contact$sq$, $sq$"Hi, this is [your name] from Dr. DuBose's office, calling about his Student Caregiver Program. I'd like to send your team the details — what's the best address?"$sq$, NULL, NULL, NULL, 20),
  ($sq$providers-send-the-program-info$sq$, 'rung', $sq$providers$sq$, $sq$send-the-program-info$sq$, $sq$Send the program info$sq$, NULL, $sq$Pre-health students looking for caregiving shifts — {university}$sq$, $sq$Hi {first},

I am writing from Dr. Logan DuBose's office about the Student Caregiver Program at {university}.

We work with pre-health students — pre-med, pre-nursing, pre-PA — who want paid, hands-on caregiving experience before they apply to professional school. They are motivated, they are local, and they are looking for shifts that fit around their classes.

They come to you screened. You interview and hire the ones you want, on your own terms, and there is nothing to sign to start.

One-page overview: {flyer}

Would you like to hear more? A reply is enough and I will send you everything.

Best,
[your name]
Dr. Logan DuBose's office · Olera$sq$, NULL, 30),
  ($sq$providers-followup$sq$, 'rung', $sq$providers$sq$, $sq$followup$sq$, $sq$Follow up$sq$, $sq$"Hi, this is [your name] from Dr. DuBose's office. I emailed your agency last week about our Student Caregiver Program — students who work paid caregiving shifts around their classes. Did that reach the right person, or is there someone better I should send it to?"$sq$, $sq$Following up — Student Caregiver Program at {university}$sq$, $sq$Hi {first},

Following up on my note about the Student Caregiver Program. The short version: we place pre-health students at {university} into paid caregiving shifts that work around their class schedule, and they come to you screened and ready.

They come to you screened. You interview and hire the ones you want, on your own terms, and there is nothing to sign to start.

Would you like to hear more? A reply is enough and I will send you everything — how it works, what it costs, and the pilot terms to look over.

The one-page overview is here if it is easier to forward: {flyer}

Best,
[your name]
Dr. Logan DuBose's office · Olera$sq$, NULL, 40),
  ($sq$providers-onboarding$sq$, 'rung', $sq$providers$sq$, $sq$onboarding$sq$, $sq$Send the onboarding pack$sq$, NULL, $sq$Everything you need — Student Caregiver Program at {university}$sq$, $sq$Hi {first},

Good to hear from you. Here is the whole thing.

HOW IT WORKS
When a pre-health student near {org} is ready, we send them over — by email and by text, and they are waiting in your portal too. Some will ring your office directly and say they came through the Student Caregiver Program.

Each student arrives as one page: what they are studying, when they can work, what they have done before, and a short video. You invite the ones you want to interview, and you hire on your own terms.

  1. We tell you a student is ready
  2. You invite them to interview
  3. You hire the ones you want
  4. We confirm the hire with you and with them

WHAT YOU ARE LOOKING FOR
Tell us and we will only send students who fit — hours, shift types, certifications, anything you will not move on. The easiest thing is to reply to this email and say it in your own words$sq$ || chr(59) || $sq$ we will set it up on our side. If you would rather do it yourself, it is all in your portal: {portal_link}

THE TERMS, FOR YOUR REVIEW
Attached. Nothing to sign, and no obligation to carry on — this is a pilot. We will keep sending you students until you hire one and the placement works out. If you like working with our students after that, we agree formal terms then rather than now.

ONE THING BACK FROM YOU
Reply and tell me you are ready to receive your first student and you are clear on what happens when one arrives. If anything is unclear, reply with the question instead and I will answer it here.

When your first student is ready I will get on a call with you then and we will go through reviewing them and inviting them to interview together. And if you would rather talk any of it through sooner — now, at the first student, or later — just say the word.

Best,
[your name]
Dr. Logan DuBose's office · Olera$sq$, NULL, 50),
  ($sq$providers-onboardfollow$sq$, 'rung', $sq$providers$sq$, $sq$onboardfollow$sq$, $sq$Onboarding follow up$sq$, $sq$"Hi, it's [your name] from Dr. DuBose's office — I sent over the Student Caregiver Program details last week. I wanted to check you are happy with how it works, and whether you are ready for us to send your first student. Anything you would like me to run through while I have got you?"$sq$, $sq$Re: Everything you need — Student Caregiver Program at {university}$sq$, $sq$Hi {first},

Following up on the Student Caregiver Program pack I sent over.

Just one question: are you ready for us to send your first student? If yes, a one-line reply is all I need.

If there is anything you would rather go through first, tell me and I will either answer it here or find fifteen minutes — whichever suits you.

Your portal, in case it is buried: {portal_link}

Best,
[your name]
Dr. Logan DuBose's office · Olera$sq$, NULL, 60),
  ($sq$providers-seasonal-check-late-july$sq$, 'rung', $sq$providers$sq$, $sq$seasonal-check-late-july$sq$, $sq$Seasonal check — late July$sq$, NULL, NULL, NULL, NULL, 70),
  ($sq$providers-errand$sq$, 'rung', $sq$providers$sq$, $sq$errand$sq$, $sq$Something else$sq$, NULL, NULL, NULL, NULL, 80),
  ($sq$providers-help$sq$, 'rung', $sq$providers$sq$, $sq$help$sq$, $sq$Help them on a call$sq$, NULL, NULL, NULL, NULL, 90),
  ($sq$providers-mapsweep$sq$, 'rung', $sq$providers$sq$, $sq$mapsweep$sq$, $sq$Sweep Google Maps for missing agencies$sq$, $sq$Add an agency when all four are true:

  1. It sends caregivers to someone's home. Not a facility, not hospital staffing, not medical supply. Home care agencies only.
  2. Its address is near campus, inside the area we recruit from.
  3. It has a phone number that works, or a website.
  4. No provider already on the board shares its phone number or its street address.

If you are unsure on any of the four, leave it out and say so in the note. A provider added wrongly costs somebody a research rung and a call.$sq$, NULL, NULL, NULL, 100),
  ($sq$students-meeting-with-the-student$sq$, 'rung', $sq$students$sq$, $sq$meeting-with-the-student$sq$, $sq$Meeting with the student$sq$, NULL, NULL, NULL, NULL, 110),
  ($sq$students-complete-their-application$sq$, 'rung', $sq$students$sq$, $sq$complete-their-application$sq$, $sq$Complete their application$sq$, NULL, $sq$One thing left on your Olera application$sq$, $sq$Hi {first},

Thanks for applying to the Student Caregiver Program. Your profile is nearly there — there is one piece still outstanding before we can put you in front of a provider.

Once that is in, I can start matching you to shifts near campus.

Reply here and I will walk you through it.

Best,
[your name]
Dr. Logan DuBose's office · Olera$sq$, NULL, 120),
  ($sq$students-get-them-an-interview$sq$, 'rung', $sq$students$sq$, $sq$get-them-an-interview$sq$, $sq$Get them an interview$sq$, NULL, NULL, NULL, NULL, 130),
  ($sq$students-confirm-hire$sq$, 'rung', $sq$students$sq$, $sq$confirm-hire$sq$, $sq$Confirm hire$sq$, NULL, NULL, NULL, NULL, 140),
  ($sq$students-hours$sq$, 'rung', $sq$students$sq$, $sq$hours$sq$, $sq$Confirm hours worked$sq$, NULL, NULL, NULL, NULL, 150),
  ($sq$jobboard-research$sq$, 'rung', $sq$jobboard$sq$, $sq$research$sq$, $sq$Research$sq$, NULL, NULL, NULL, NULL, 160),
  ($sq$jobboard-confirm-it-s-submitted$sq$, 'rung', $sq$jobboard$sq$, $sq$confirm-it-s-submitted$sq$, $sq$Confirm it's submitted$sq$, NULL, $sq$Job posting request — paid caregiving roles for pre-health students$sq$, $sq$Hello,

I would like to post a role on the {university} student job board.

  Position    Student Caregiver (part-time, paid)
  Employer    Olera, on behalf of local licensed care providers
  Who it fits Pre-health students — pre-med, pre-nursing, pre-PA
  Schedule    Flexible shifts built around class timetables
  Apply       {flyer}

Students are screened by us and placed with licensed providers in the area. Happy to send anything else your posting process needs.

Thank you,
[your name]
Dr. Logan DuBose's office · Olera$sq$, NULL, 170),
  ($sq$jobboard-confirm-it-s-approved$sq$, 'rung', $sq$jobboard$sq$, $sq$confirm-it-s-approved$sq$, $sq$Confirm it's approved$sq$, NULL, NULL, NULL, NULL, 180),
  ($sq$jobboard-confirm-the-first-student-has-applied$sq$, 'rung', $sq$jobboard$sq$, $sq$confirm-the-first-student-has-applied$sq$, $sq$Confirm the first student has applied$sq$, NULL, NULL, NULL, NULL, 190),
  ($sq$jobboard-seasonal$sq$, 'rung', $sq$jobboard$sq$, $sq$seasonal$sq$, $sq$Confirm the listing is still live — late July$sq$, NULL, NULL, NULL, NULL, 200),
  ($sq$jobboard-relist$sq$, 'rung', $sq$jobboard$sq$, $sq$relist$sq$, $sq$Get the listing back up$sq$, NULL, $sq$Re-posting the Student Caregiver role — {university}$sq$, $sq$Hello,

Our Student Caregiver posting appears to have expired from the {university} job board. Students are still applying through other channels, so we would like it back up.

Same role as before — part-time paid caregiving shifts for pre-health students, flexible around classes. Details here: {flyer}

Is there anything you need from me to renew it?

Thank you,
[your name]
Dr. Logan DuBose's office · Olera$sq$, NULL, 210),
  ($sq$advisors-research-the-advising-offices$sq$, 'rung', $sq$advisors$sq$, $sq$research-the-advising-offices$sq$, $sq$Research the advising offices$sq$, NULL, NULL, NULL, NULL, 220),
  ($sq$advisors-send-the-program-info$sq$, 'rung', $sq$advisors$sq$, $sq$send-the-program-info$sq$, $sq$Send the program info$sq$, NULL, $sq$Paid caregiving shifts for your pre-health students — {university}$sq$, $sq$Hi {first},

I am writing from Dr. Logan DuBose's office. We run the Student Caregiver Program, which places pre-health students at {university} into paid caregiving shifts with licensed local providers.

It is built for the students you advise: paid hands-on patient contact, hours that work around a class schedule, and a reference and recommendation letter at the end. No cost to the student and no cost to the university.

Would you be willing to pass the one-pager to your pre-health list? It is here: {flyer}

Happy to talk it through first if that is easier.

Best,
[your name]
Dr. Logan DuBose's office · Olera$sq$, NULL, 230),
  ($sq$advisors-follow-up-1$sq$, 'rung', $sq$advisors$sq$, $sq$follow-up-1$sq$, $sq$Follow up$sq$, $sq$"Hi, this is [your name] from Dr. DuBose's office. I emailed the advising office last week about our Student Caregiver Program — students who work paid caregiving shifts around their classes. Did that reach the right person, or is there someone better I should send it to?"$sq$, $sq$Following up — Student Caregiver Program at {university}$sq$, $sq$Hi {first},

Following up on my note about the Student Caregiver Program. The short version: we place pre-health students at {university} into paid caregiving shifts that work around their class schedule, and they come to you screened and ready.

They come to you screened. You interview and hire the ones you want, on your own terms, and there is nothing to sign to start.

Would you like to hear more? A reply is enough and I will send you everything — how it works, what it costs, and the pilot terms to look over.

The one-page overview is here if it is easier to forward: {flyer}

Best,
[your name]
Dr. Logan DuBose's office · Olera$sq$, NULL, 240),
  ($sq$advisors-confirm-the-flyer-is-circulating$sq$, 'rung', $sq$advisors$sq$, $sq$confirm-the-flyer-is-circulating$sq$, $sq$Confirm the flyer is circulating$sq$, NULL, NULL, NULL, NULL, 250),
  ($sq$advisors-confirm-a-meeting-with-the-team$sq$, 'rung', $sq$advisors$sq$, $sq$confirm-a-meeting-with-the-team$sq$, $sq$Confirm a meeting with the team$sq$, NULL, NULL, NULL, NULL, 260),
  ($sq$advisors-log-the-meeting$sq$, 'rung', $sq$advisors$sq$, $sq$log-the-meeting$sq$, $sq$Log the meeting$sq$, NULL, NULL, NULL, NULL, 270),
  ($sq$advisors-recirculate-the-flyer-late-july$sq$, 'rung', $sq$advisors$sq$, $sq$recirculate-the-flyer-late-july$sq$, $sq$Recirculate the flyer — late July$sq$, NULL, $sq$New term, new flyer — Student Caregiver Program$sq$, $sq$Hi {first},

New term, so a fresh copy of the Student Caregiver flyer for your pre-health students: {flyer}

Same programme — paid caregiving shifts with local licensed providers, built around a class schedule. Placements from last term are going well and we have openings again.

Would you be able to send it out with your usual student mail?

Thank you,
[your name]
Dr. Logan DuBose's office · Olera$sq$, NULL, 280),
  ($sq$orgs-identify-the-student-orgs$sq$, 'rung', $sq$orgs$sq$, $sq$identify-the-student-orgs$sq$, $sq$Identify the student orgs$sq$, NULL, NULL, NULL, NULL, 290),
  ($sq$orgs-identify-a-contact-at-the-org$sq$, 'rung', $sq$orgs$sq$, $sq$identify-a-contact-at-the-org$sq$, $sq$Identify a contact at the org$sq$, NULL, NULL, NULL, NULL, 300),
  ($sq$orgs-send-the-program-info$sq$, 'rung', $sq$orgs$sq$, $sq$send-the-program-info$sq$, $sq$Send the program info$sq$, NULL, $sq$Something for your members — paid caregiving shifts$sq$, $sq$Hi {first},

I am writing from Dr. Logan DuBose's office about the Student Caregiver Program, and I think it fits {org} well.

We place pre-health students into paid caregiving shifts with licensed providers near {university}. Members get real patient contact before they apply to professional school, paid, on a schedule that works around classes.

Two ways we usually work with a group like yours:

  · You share the one-pager with your members: {flyer}
  · Or we come to a meeting and present for ten minutes

Either is fine. Which suits {org} better?

Best,
[your name]
Dr. Logan DuBose's office · Olera$sq$, NULL, 310),
  ($sq$orgs-follow-up-1$sq$, 'rung', $sq$orgs$sq$, $sq$follow-up-1$sq$, $sq$Follow up$sq$, $sq$"Hi, this is [your name] from Dr. DuBose's office. I emailed your organisation last week about our Student Caregiver Program — students who work paid caregiving shifts around their classes. Did that reach the right person, or is there someone better I should send it to?"$sq$, $sq$Following up — Student Caregiver Program at {university}$sq$, $sq$Hi {first},

Following up on my note about the Student Caregiver Program. The short version: we place pre-health students at {university} into paid caregiving shifts that work around their class schedule, and they come to you screened and ready.

They come to you screened. You interview and hire the ones you want, on your own terms, and there is nothing to sign to start.

Would you like to hear more? A reply is enough and I will send you everything — how it works, what it costs, and the pilot terms to look over.

The one-page overview is here if it is easier to forward: {flyer}

Best,
[your name]
Dr. Logan DuBose's office · Olera$sq$, NULL, 320),
  ($sq$orgs-confirm-the-flyer-went-out-or-a-presentation-is-booked$sq$, 'rung', $sq$orgs$sq$, $sq$confirm-the-flyer-went-out-or-a-presentation-is-booked$sq$, $sq$Confirm the flyer went out or a presentation is booked$sq$, NULL, NULL, NULL, NULL, 330),
  ($sq$orgs-recirculate-with-the-org-late-july$sq$, 'rung', $sq$orgs$sq$, $sq$recirculate-with-the-org-late-july$sq$, $sq$Recirculate with the org — late July$sq$, NULL, $sq$Checking in for the new term — {org}$sq$, $sq$Hi {first},

New term, so checking in. Are you still the right person for {org}, or has the committee changed hands?

The Student Caregiver Program is running again with openings near campus — paid caregiving shifts for pre-health students. Current flyer: {flyer}

If you can send it round, or if a ten-minute slot at a meeting is easier, let me know which works.

Thank you,
[your name]
Dr. Logan DuBose's office · Olera$sq$, NULL, 340),
  ($sq$events-research-career-fairs-and-events$sq$, 'rung', $sq$events$sq$, $sq$research-career-fairs-and-events$sq$, $sq$Research career fairs and events$sq$, NULL, NULL, NULL, NULL, 350),
  ($sq$events-sign-up-for-the-event$sq$, 'rung', $sq$events$sq$, $sq$sign-up-for-the-event$sq$, $sq$Sign up for the event$sq$, NULL, NULL, NULL, NULL, 360),
  ($sq$events-ask-the-advisor-about-other-events$sq$, 'rung', $sq$events$sq$, $sq$ask-the-advisor-about-other-events$sq$, $sq$Ask the advisor about other events$sq$, NULL, $sq$Anything coming up we should be at? — {university}$sq$, $sq$Hi {first},

We are looking at which {university} events are worth attending this term for the Student Caregiver Program — career fairs, pre-health nights, anything where we would meet students face to face.

Two questions:

  1. Is there anything coming up that is not on the public calendar?
  2. Would you ever co-host a short info session with us?

We bring the material and the people$sq$ || chr(59) || $sq$ you bring the room and the students.

Thank you,
[your name]
Dr. Logan DuBose's office · Olera$sq$, NULL, 370),
  ($sq$events-set-the-event-up$sq$, 'rung', $sq$events$sq$, $sq$set-the-event-up$sq$, $sq$Set the event up$sq$, NULL, NULL, NULL, NULL, 380),
  ($sq$events-prepare-for-the-event$sq$, 'rung', $sq$events$sq$, $sq$prepare-for-the-event$sq$, $sq$Prepare for the event$sq$, NULL, NULL, NULL, NULL, 390),
  ($sq$events-attend-and-document$sq$, 'rung', $sq$events$sq$, $sq$attend-and-document$sq$, $sq$Attend and document$sq$, NULL, NULL, NULL, NULL, 400),
  ($sq$events-what-s-coming-this-term-late-july$sq$, 'rung', $sq$events$sq$, $sq$what-s-coming-this-term-late-july$sq$, $sq$What's coming this term — late July$sq$, NULL, NULL, NULL, NULL, 410),
  ($sq$professors-get-permission-to-email-professors$sq$, 'rung', $sq$professors$sq$, $sq$get-permission-to-email-professors$sq$, $sq$Get permission to email professors$sq$, $sq$"Hi, this is [your name] from Dr. DuBose's office. We run a Student Caregiver Program and we'd like to let your faculty know about it — would you be comfortable authorising us to email them?"$sq$, $sq$Permission to contact faculty about a student programme$sq$, $sq$Dear {first},

I am writing from Dr. Logan DuBose's office to ask permission before contacting any faculty in your department.

We run the Student Caregiver Program: pre-health students take paid caregiving shifts with licensed providers near {university}, built around their class schedule. It gives them real patient contact before professional school.

We would like to let a small number of faculty know, so they can mention it to students for whom it fits. One email each, once a term — we do not contact faculty repeatedly.

Overview: {flyer}

May we have your approval to do that? If you would rather we did not, tell me and we will close the file on faculty outreach here.

With thanks,
[your name]
Dr. Logan DuBose's office · Olera$sq$, NULL, 420),
  ($sq$professors-identify-professors-from-the-directory$sq$, 'rung', $sq$professors$sq$, $sq$identify-professors-from-the-directory$sq$, $sq$Identify professors from the directory$sq$, NULL, NULL, NULL, NULL, 430),
  ($sq$professors-email-flyer-and-class-visit$sq$, 'rung', $sq$professors$sq$, $sq$email-flyer-and-class-visit$sq$, $sq$Email — flyer and class visit$sq$, NULL, $sq$For your students: paid caregiving shifts (approved by {approver})$sq$, $sq$Dear {first},

{approver} approved us contacting faculty about this, so I am writing once with something that may suit your students.

The Student Caregiver Program places pre-health students into paid caregiving shifts with licensed providers near {university}. Hands-on patient experience, paid, arranged around a class timetable — the kind of thing that strengthens a professional school application.

Two offers, take either or neither:

  · Share the one-pager with your class: {flyer}
  · We come and speak for ten minutes at the start of a session

This is the only email you will get from me this term.

With thanks,
[your name]
Dr. Logan DuBose's office · Olera$sq$, NULL, 440),
  ($sq$professors-message-professors-again-late-july$sq$, 'rung', $sq$professors$sq$, $sq$message-professors-again-late-july$sq$, $sq$Message professors again — late July$sq$, NULL, $sq$New term — Student Caregiver Program at {university}$sq$, $sq$Dear {first},

New term, so one note about the Student Caregiver Program: paid caregiving shifts for pre-health students with licensed providers near {university}, arranged around their classes.

Current one-pager: {flyer}

Same offer as before — share it with your students, or we will come and speak for ten minutes. Either way, this is my one email this term.

With thanks,
[your name]
Dr. Logan DuBose's office · Olera$sq$, NULL, 450)
,

  ($sq$situation-front-desk$sq$, 'situation', NULL, NULL, $sq$Reaching the front desk$sq$,
   $sq$"Hi, my name is [your name]. I'm calling about a student caregiving program with Indiana University Bloomington students. I was trying to get in contact with somebody in recruiting — I wanted to send over an email. Is there a best address for us to send program details to?"

Then, once they give it:

"Great, let me just run that back to you. That's P as in Penelope, godfrey@homehelpershomecare.com."

"Is there a first name I can address it to?"

"And what was your name, so I can say who gave it to me? ... Thank you, Lisa."$sq$,
   NULL, NULL,
   $sq$Three things make this call work, and all three are easy to skip.

READ THE ADDRESS BACK, letter by letter, using words for the ambiguous ones. A mistyped address is a lead lost with no bounce and no way of knowing.

ASK FOR A FIRST NAME. It is the difference between "Good afternoon," and "Good afternoon, Melony," and it costs one sentence.

GET THE GATEKEEPER'S NAME TOO. It lets the email open with "Lisa provided me with your contact information", which is why the recipient reads past the first line. Write it in the note on the task.

You are asking for one thing: an email address. Do not pitch the program on this call. If they ask what it is, one sentence — pre-health students looking for part-time caregiving work — and back to the address.$sq$, 1010),

  ($sq$situation-voicemail$sq$, 'situation', NULL, NULL, $sq$Leaving a voicemail$sq$,
   $sq$"Hello, my name is [your name]. I'm the director of a student caregiving program that connects students from Indiana University Bloomington to non-medical home care agencies for part-time work. I was hoping to get in contact with the recruitment manager so I could send over some information about the program and see if your organization would be interested in participating.

My phone number is [your number]. You're welcome to call me back. I also found an email address, care@example.com, online, so I'll go ahead and shoot over some information there.

Have a nice day."$sq$,
   NULL, NULL,
   $sq$Say the number slowly and say it once. Do not repeat it twice — it makes the message long and people stop listening.

Naming the email you found does two jobs: it tells them to expect the email, and it gives them a way to correct you if it is the wrong address.

Then actually send it. The email that follows a voicemail should open by saying so — "I just left a voicemail at 812-815-1296 and found this email online" — so the two arrive as one approach rather than two strangers.$sq$, 1020),

  ($sq$situation-non-licensed$sq$, 'situation', NULL, NULL, $sq$Checking they can hire non-licensed staff$sq$,
   $sq$"I'm the director of a student caregiving program in Bloomington, and these students are looking for part-time work. Do you have non-licensed care that you might be able to employ them in, or are you only skilled nursing?"$sq$,
   NULL, NULL,
   $sq$Ask this early on any agency you are not sure about. A skilled-nursing-only agency cannot hire a pre-health student with no licence, and finding that out on the first call saves seven follow-ups and a relationship you did not need to spend.

If the answer is skilled nursing only, thank them and archive the record with that as the reason. It is not a loss.$sq$, 1030),

  ($sq$situation-price$sq$, 'situation', NULL, NULL, $sq$When they ask what it costs$sq$,
   NULL,
   $sq$Re: Student Caregiver Program — how it works$sq$,
   $sq$Hi {first},

That's great news, and I'm glad you're interested. We already have six students who applied this week and more coming in each day, so we can get started relatively quickly.

To make sure the student is hired, performs well and is clearly worth it to you, the first confirmed hire is free.

After that our standard fee is $250 per hired student, which pays our coordinators to maintain the university funnels and the qualification process. It comes with a guarantee: if a student doesn't work enough shifts to justify the placement cost, or you aren't satisfied with their work for any reason, we refund the fee.

$250 is our standard rate and we are open to negotiation. The priority is a reasonable cost for your organization, so if this doesn't fit your budget, tell me what does and we'll keep talking.

To say it plainly: the first placement is free, so you can see whether it works before any money changes hands.

Best,
{your name}$sq$,
   $sq$Do not lead with price. Answer it when asked, fully and without hedging, then get back to the students.

The two sentences that do the work are "the first confirmed hire is free" and "we are open to negotiation". Together they mean there is no reason to say no today.

DECISION STILL OPEN: the $250 figure is recorded as unsettled in docs/medjobs/operating/07-OPEN-DECISIONS-AND-CONFLICTS.md (C1), which also says that sending a number to every interested provider settles it in practice. It is being sent. Either ratify $250 or change this copy — do not leave the two disagreeing.$sq$, 1040),

  ($sq$situation-interested$sq$, 'situation', NULL, NULL, $sq$When they say they are interested$sq$,
   NULL,
   $sq$Next steps — Student Caregiver Program$sq$,
   $sq$Hi {first},

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
{your name}$sq$,
   $sq$CC Chantel on this one. It is the first message where somebody other than you appears, and doing it here rather than later means the handover is already made when the call happens.

Ask for the call. Do not send this and wait — the whole message is a reason to book fifteen minutes.

"There is nothing to sign and no obligation to continue" is load-bearing. It is the sentence that stops a yes turning into a legal review.$sq$, 1050),

  ($sq$situation-questions$sq$, 'situation', NULL, NULL, $sq$Questions we get asked$sq$,
   NULL, NULL, NULL,
   $sq$Add what you get asked, and what you said. Date each one. This section is the reason the document is editable.

— What does it cost? See "When they ask what it costs".
— Are they licensed? No. They are pre-health students looking for non-medical caregiving work. See "Checking they can hire non-licensed staff".
— Do we have to sign anything? No, and nothing to sign is the point. Say it early.
— How many students are there? Six applied in the week of 21 September at IU Bloomington. Use the real number$sq$ || chr(59) || $sq$ it is more convincing than "several".$sq$, 1060)
ON CONFLICT (slug) DO NOTHING;
