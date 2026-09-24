import assert from "node:assert/strict";
import {
  familyAnswerCategoryAutoCloses,
  familyAnswerCategoryNeedsDraft,
  hasNoWords,
  isCourtesyOnlyReply,
  isOptOutPhrase,
  isReactionOnly,
} from "../lib/sms/inbound-intent";
import { detectDeceased } from "../lib/family-comms/benefits-automation";
import { smsCarriesPhone } from "../lib/family-comms/sms-phone";

const COURTESY = [
  "Thank you",
  "Thank you 🙏",
  "Thanks so much!",
  "Okay, thank you.",
  "Got it, thanks",
  "Will do. Thank you",
  "Thank you for your help",
  "Thanks for getting back to me",
  "Thanks, I will call them tomorrow",
  "Much appreciated",
];

const ACTIONABLE = [
  "Thank you, but I still need help",
  "Thanks. What documents do I need?",
  "Okay, thank you. My AC is still broken.",
  "Thanks for the number. Is there another agency?",
  "Thank you, can you help me apply?",
  "Thank you, I want to die",
  "I appreciate it, but nobody answered",
  "No",
  "STUCK",
];

for (const body of COURTESY) {
  assert.equal(isCourtesyOnlyReply(body), true, `expected courtesy-only: ${body}`);
}
for (const body of ACTIONABLE) {
  assert.equal(isCourtesyOnlyReply(body), false, `must keep triaging: ${body}`);
}

assert.equal(familyAnswerCategoryNeedsDraft("thanks"), false);
assert.equal(familyAnswerCategoryNeedsDraft("unrelated"), false);
assert.equal(familyAnswerCategoryNeedsDraft("benefits_question"), true);
assert.equal(familyAnswerCategoryNeedsDraft("status_update"), true);
assert.equal(familyAnswerCategoryNeedsDraft("crisis"), true);
assert.equal(familyAnswerCategoryAutoCloses("thanks"), true);
assert.equal(familyAnswerCategoryAutoCloses("unrelated"), false);
assert.equal(familyAnswerCategoryAutoCloses("benefits_question"), false);

// Tapbacks, as iOS delivers them to a non-iMessage thread (real 2026-09-11 body).
for (const body of [
  "Removed \u200c👍\u200c from \u201c This is Olera's care team following up on your Senior SNAP results.\u201d",
  "Liked \u201cOlera: Your first step for LIHEAP\u201d",
  "Loved \u201cThanks\u201d",
  "Reacted 👍 to \"Olera: Were you able to call?\"",
]) {
  assert.equal(isReactionOnly(body), true, `expected reaction: ${body}`);
}
for (const body of ["Liked the plan but I need the phone number", "Loved it", "I removed my name"]) {
  assert.equal(isReactionOnly(body), false, `not a reaction: ${body}`);
}

assert.equal(hasNoWords("?"), true);
assert.equal(hasNoWords("👍"), true);
assert.equal(hasNoWords("What"), false);

for (const body of ["Stop no longer needed", "STOP texting me", "unsubscribe please"]) {
  assert.equal(isOptOutPhrase(body), true, `expected opt-out: ${body}`);
}
for (const body of ["Please don't stop helping me", "Stop by the office and ask them what documents they need tomorrow"]) {
  assert.equal(isOptOutPhrase(body), false, `not an opt-out: ${body}`);
}

for (const body of ["My mother passed away last week", "He died on Sunday", "She is deceased", "dad passed", "Mom is no longer with us"]) {
  assert.equal(detectDeceased(body), true, `expected deceased: ${body}`);
}
for (const body of ["She passed the screening", "I need a death certificate copy?", "Funeral assistance program", "I called and they said wait"]) {
  assert.equal(detectDeceased(body), false, `not deceased: ${body}`);
}

assert.equal(smsCarriesPhone("Olera: For LIHEAP, call 1-877-555-0142. {link}", "1-877-555-0142"), true);
assert.equal(smsCarriesPhone("Olera: call (877) 555-0142 {link}", "1-877-555-0142"), true);
assert.equal(smsCarriesPhone("Olera: call 2-1-1 {link}", "2-1-1"), true);
assert.equal(smsCarriesPhone("Olera's care team here. Your plan: {link}", "1-877-555-0142"), false);

console.log(
  `SMS inbound intent checks passed: ${COURTESY.length} closers, ${ACTIONABLE.length} actionable counterexamples.`,
);
