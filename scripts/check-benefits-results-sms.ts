import {
  BENEFITS_HELP_REQUEST_SMS_COPY_VERSION,
  BENEFITS_RESULTS_SMS_COPY_VERSION,
  BENEFITS_RESULTS_ZERO_MATCH_SMS_COPY_VERSION,
  benefitsResultsSms,
} from "../lib/sms/templates";

const productionLengthUrl = "https://olera.care/m/-_8KcFV3s3stX6S-?s=r";
const body = benefitsResultsSms({ matchCount: 5, url: productionLengthUrl });
const expected =
  `Olera care team: We got your answers. Any questions about next steps? ` +
  `Plan: ${productionLengthUrl} We'll reply within 48h. STOP to opt out.`;
const helpBody = benefitsResultsSms({
  matchCount: 5,
  url: productionLengthUrl,
  context: "help_requested",
});
const expectedHelp =
  `Olera care team: We got your request. What should we help with first? ` +
  `Plan: ${productionLengthUrl} We'll reply within 48h. STOP to opt out.`;
const zeroMatchBody = benefitsResultsSms({ matchCount: 0, url: productionLengthUrl });
const expectedZeroMatch =
  `Olera: We created your private Olera plan. No strong match yet; we'll keep checking. ` +
  `See it here: ${productionLengthUrl} Reply STOP to opt out.`;
const gsm7 = /^[ -~\n\r€£¥èéùìòÇØøÅåÆæßÉÄÖÑÜäöñüà]*$/;

const problems: string[] = [];
if (body !== expected) problems.push("positive-match copy no longer matches the approved rollout");
if (!gsm7.test(body)) problems.push("message contains non-GSM characters");
if (body.length > 160) problems.push(`message is ${body.length} characters, above one GSM segment`);
if (helpBody !== expectedHelp) problems.push("help-request copy no longer matches the approved rollout");
if (!gsm7.test(helpBody)) problems.push("help-request message contains non-GSM characters");
if (helpBody.length > 160) {
  problems.push(`help-request message is ${helpBody.length} characters, above one GSM segment`);
}
if (zeroMatchBody !== expectedZeroMatch) problems.push("zero-match copy changed unexpectedly");
if (!gsm7.test(zeroMatchBody)) problems.push("zero-match message contains non-GSM characters");
if (BENEFITS_RESULTS_SMS_COPY_VERSION !== "continuity_question_v1_2026_08_19") {
  problems.push("copy version changed without updating the rollout record");
}
if (BENEFITS_HELP_REQUEST_SMS_COPY_VERSION !== "help_request_v1_2026_08_19") {
  problems.push("help-request copy version changed without updating the rollout record");
}
if (BENEFITS_RESULTS_ZERO_MATCH_SMS_COPY_VERSION !== "zero_match_v1") {
  problems.push("zero-match copy version changed unexpectedly");
}

if (problems.length > 0) {
  console.error("Benefits results SMS check failed:");
  for (const problem of problems) console.error(`- ${problem}`);
  process.exit(1);
}

console.log(
  `Benefits SMS OK: results ${body.length} chars, help request ${helpBody.length} chars, ` +
    `versions ${BENEFITS_RESULTS_SMS_COPY_VERSION} / ${BENEFITS_HELP_REQUEST_SMS_COPY_VERSION}`,
);
