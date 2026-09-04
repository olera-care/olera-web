import assert from "node:assert/strict";
import {
  familyAnswerCategoryAutoCloses,
  familyAnswerCategoryNeedsDraft,
  isCourtesyOnlyReply,
} from "../lib/sms/inbound-intent";

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

console.log(
  `SMS inbound intent checks passed: ${COURTESY.length} closers, ${ACTIONABLE.length} actionable counterexamples.`,
);
