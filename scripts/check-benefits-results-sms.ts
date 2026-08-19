import {
  BENEFITS_RESULTS_SMS_COPY_VERSION,
  benefitsResultsSms,
} from "../lib/sms/templates";

const productionLengthUrl = "https://olera.care/m/-_8KcFV3s3stX6S-?s=r";
const body = benefitsResultsSms({ matchCount: 5, url: productionLengthUrl });
const expected =
  `Olera care team: Need help choosing, qualifying, or applying? Reply. ` +
  `Plan: ${productionLengthUrl} We'll reply within 48h. STOP to opt out.`;
const gsm7 = /^[ -~\n\r€£¥èéùìòÇØøÅåÆæßÉÄÖÑÜäöñüà]*$/;

const problems: string[] = [];
if (body !== expected) problems.push("positive-match copy no longer matches the approved rollout");
if (!gsm7.test(body)) problems.push("message contains non-GSM characters");
if (body.length > 160) problems.push(`message is ${body.length} characters, above one GSM segment`);
if (BENEFITS_RESULTS_SMS_COPY_VERSION !== "question_led_v1_2026_08_19") {
  problems.push("copy version changed without updating the rollout record");
}

if (problems.length > 0) {
  console.error("Benefits results SMS check failed:");
  for (const problem of problems) console.error(`- ${problem}`);
  process.exit(1);
}

console.log(
  `Benefits results SMS OK: ${body.length} GSM-7 characters, version ${BENEFITS_RESULTS_SMS_COPY_VERSION}`,
);
