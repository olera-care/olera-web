/**
 * Replies that worked, kept as few-shot examples for the drafter.
 *
 * Every one of these was sent to a real care seeker on 2026-09-01, after the
 * engine's own draft was rejected or rewritten by hand. The rewrite is the
 * lesson: the gap between what the engine proposed and what a person actually
 * sent is the only honest signal we have about how these should sound.
 *
 * Rules for this file, so it stays useful rather than becoming an archive:
 *
 *   - Only messages that were REALLY SENT. Not drafts, not improvements
 *     imagined afterwards. A made-up example teaches a voice nobody used.
 *   - Keep the inbound message it answered. Half of what each one teaches is
 *     the fit between their message and ours, and length is most of that fit.
 *   - One lesson per entry, written as the reason it worked. An example with
 *     no stated lesson is decoration.
 *   - Prune. Six examples the drafter reads beat twenty it skims. When a new
 *     one teaches the same lesson better, replace rather than append.
 */

export interface Exemplar {
  /** What the family sent, verbatim. */
  inbound: string;
  /** What a human actually sent back. */
  reply: string;
  /** Why this one worked. Shown to the drafter. */
  lesson: string;
}

export const EXEMPLARS: Exemplar[] = [
  {
    inbound: "What",
    reply:
      "Sorry, too much at once. Just call Florida DCF at 850-300-4323 and ask what docs they still need. They handle food stamps and Medicaid.",
    lesson:
      "She had written 9, 5, 23 and 4 characters. We sent 397 with two numbers, a script, an ID requirement and a fallback, and she replied \"What\". Match the length they write. One number, one ask, and her word (docs) not ours (documents).",
  },
  {
    inbound: "Acworth GA is in the list for this program?",
    reply:
      "Yes, Acworth is covered. If the home is inside Acworth city limits it is Cobb County, and Cobb Senior Services runs Meals on Wheels there: call 770-528-5364 and ask for an assessment. They look for age 60+, living in Cobb, and a physical or mental condition that keeps them from preparing meals daily. Cost is income-based and no one is denied for inability to pay.",
    lesson:
      "A yes-or-no question gets its answer in the first word. Everything after that is how to act on it. Do not make someone read three sentences to find out whether the answer was yes.",
  },
  {
    inbound:
      "I have been his only Caretaker for 4 years. Managing his appts. Medications, making all calls regarding his conditions, arranging rides, caring for his needs at home. It has interfered with my ability to maintain my work to earn",
    reply:
      "Four years as his only caregiver, and losing income for it. That's a lot.\n\nWhat you just described is what the CMPAS assessment looks at. When you call 2-1-1, tell them exactly that: four years, his appointments, his medications, the rides, all of his care at home.\n\nOne other thing, is he a veteran?",
    lesson:
      "When someone tells you what they have been carrying, say it back before you say anything else, in their own words and without adding sympathy words. Then use the very facts they gave you as the script for their call. She was building her case; the reply told her she already had it.",
  },
  {
    inbound: "32351",
    reply:
      "You're right, $124 does not go far. There may be a way to get more. At 60 and over, what you pay for medicine and doctor visits comes off your income and can raise your food stamps. Anything over $35 a month counts. Call DCF at 850-300-4323 and ask for the medical expense deduction.\n\nAlso, your zip came to us instead of 211. Text 32351 to 898211 and they will send you pantries near you.",
    lesson:
      "She said $124 was not enough and sent her zip to us by mistake. Agreeing first (\"You're right\") answers the person before the problem. The correction is stated as what happened, not as what she got wrong: \"your zip came to us\", never \"you sent it to the wrong number\".",
  },
  {
    inbound: "Thanks",
    reply:
      "Here is the number itself instead of a link. If you are in Reno or Sparks, call Washoe County Senior Services at 775-328-2575. Anywhere else in Nevada, dial 2-1-1 and ask for home delivered meals in your county. They serve people 60 and older who cannot get out to a meal site, and they confirm it with a home visit. What happened when you tried?",
    lesson:
      "Three earlier messages had told her the phone number was behind a link. She never got there and went a week stuck. Put the digits in the text, always. The closing question is open on purpose: we did not know whether she never found the number or called and hit a wall.",
  },
  {
    inbound:
      "Good morning none help but there is one I have to wait for September for them to open applications",
    reply:
      "Sorry, none of those came through. If you own your home, call Marion County Community Services at 352-671-8781 and ask whether homeowner rehabilitation is taking applications and whether it covers AC. It is a no-interest loan forgiven after 15 years, not a grant. Also ask whether your cancer center has a social worker. Finding funds and filling out applications is part of that job. You should not have to do this on your own.",
    lesson:
      "Four referrals had already failed her, so the reply acknowledges that in one clause and never repeats them. It says plainly that the money is a loan against her home, not a grant, because a fifth disappointment is worse than a smaller promise. And it names a person whose job is helping, not only an agency.",
  },
];

/** Render the examples for a model prompt. */
export function renderExemplars(): string {
  return EXEMPLARS.map(
    (e, i) =>
      `Example ${i + 1}\nTHEY WROTE: ${JSON.stringify(e.inbound)}\nWE SENT: ${JSON.stringify(e.reply)}\nWHY IT WORKED: ${e.lesson}`,
  ).join("\n\n");
}
