/**
 * Regression check for lib/sms/crisis.ts.
 *
 *   npx tsx scripts/check-crisis-terms.ts
 *
 * Exits non-zero on any miss. The repo has no test runner, so this is a
 * self-checking script rather than a spec file. Run it after ANY edit to the
 * term list, because the failure mode there is silent: a term list can look
 * completely reasonable and still miss the phrasing a real person uses.
 *
 * Two case sets, and they are not symmetric in importance.
 *
 * MUST_FLAG is the one that matters. A miss here means someone in crisis gets
 * an automated "we're looking into this", which is the worst reply we could
 * send. Add a case here every time you think of a phrasing, even a clumsy one.
 *
 * MUST_NOT_FLAG guards against the opposite failure, which is much cheaper but
 * still real: if ordinary benefits questions trip the detector, every message
 * pages a human, the pages become noise, and a genuine one gets skimmed past.
 * Note how many of these come from our own vocabulary. Olera's programs are
 * literally named "Emergency Home Energy Assistance" and LIHEAP has a "crisis"
 * tier, so bare "emergency" and bare "crisis" can never be terms.
 */

import { detectCrisis } from "../lib/sms/crisis";

/** Real crisis language. A miss here is the failure this module exists to prevent. */
const MUST_FLAG: string[] = [
  // First person
  "I want to die, nothing is working",
  "I'm thinking about ending it all",
  "I can't breathe and my chest hurts",
  "I have chest pain right now",
  "I took all my pills",
  "we had to call 911 last night",
  "I am not safe in this house",
  "I've been thinking about suicide",
  "I might hurt myself tonight",

  // Third person. Most people who text us are caregivers, so the crisis is at
  // least as likely to be about the person they care for.
  "my mom says she wants to die",
  "my father talks about killing himself",
  "she has nothing to live for anymore",
  "I'm afraid he will hurt himself",
  "my husband had a stroke this morning",
  "my mother is unresponsive",
  "she won't wake up",
  "he collapsed in the kitchen",

  // Abuse and danger
  "he keeps hitting me and I'm scared",
  "This is elder abuse, please help",
  "my dad's aide has been hitting him",
  "she's not safe living alone",
  "my brother is threatening to throw her out",
];

/** Ordinary messages, including our own program vocabulary. Must stay quiet. */
const MUST_NOT_FLAG: string[] = [
  // The actual message that started this project, 18 Aug 2026.
  "Good morning I hope you are well. I am looking for assistance, resources for an AC. " +
    "The one that I have is NOT cooling the right way. Recently I was diagnosed with cancer, " +
    "now suffering alongside fibromyalgia. Can you help?",
  "I am disabled but not 60. Can you still provide help. Marion County FL",

  // Our own vocabulary. These are the traps.
  "I called about the Emergency Home Energy Assistance Program",
  "Can I get LIHEAP crisis assistance for my bill?",
  "EHEAP said I need to be 60, is that right?",
  "Is this the emergency energy program?",
  "The weatherization people said there is a waitlist",

  // Ordinary benefits and care questions
  "My AC is broken and the house is hot",
  "Thanks, I will call them tomorrow",
  "What documents do I need for weatherization?",
  "Do you have a list of home care agencies near Ocala?",
  "My mother needs help with bathing and meals",
  "How long does the application take?",
  "Can my daughter apply on my behalf?",
];

function main(): void {
  const misses: string[] = [];
  const falsePositives: string[] = [];

  for (const message of MUST_FLAG) {
    if (!detectCrisis(message).isCrisis) misses.push(message);
  }
  for (const message of MUST_NOT_FLAG) {
    const result = detectCrisis(message);
    if (result.isCrisis) falsePositives.push(`${message}  →  matched: ${result.matched.join(", ")}`);
  }

  console.log(`crisis terms: ${MUST_FLAG.length} must-flag, ${MUST_NOT_FLAG.length} must-not-flag`);

  if (misses.length) {
    console.error(`\n${misses.length} MISSED (false negatives, the dangerous kind):`);
    for (const m of misses) console.error(`  - ${m}`);
  }
  if (falsePositives.length) {
    console.error(`\n${falsePositives.length} FALSE POSITIVES (noise, page fatigue):`);
    for (const m of falsePositives) console.error(`  - ${m}`);
  }

  if (misses.length || falsePositives.length) process.exit(1);
  console.log("all cases pass");
}

main();
