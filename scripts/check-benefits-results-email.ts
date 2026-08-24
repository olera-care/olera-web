import {
  benefitsResultsSavedEmail,
  benefitsResultsSavedSubject,
} from "../lib/email-templates";
import { resolveBenefitsProgramEntry } from "../lib/benefits/program-entry";

const legacyPhrases = [
  "We found <strong>4 programs</strong>",
  "strongest 4 matches",
  "Open my Olera plan",
];

const programHtml = benefitsResultsSavedEmail({
  greetingName: "Maria",
  stateName: "Texas",
  careLabel: "memory and medical care",
  familyPhrase: "your mom",
  relatedPrograms: [
    { name: "LIHEAP", url: "https://olera.care/benefits/texas/liheap" },
    { name: "Medicare Savings Programs", url: "https://olera.care/benefits/texas/msp" },
  ],
  matchesUrl: "https://olera.care/m/sample",
  matchCount: 4,
  requestedProgram: {
    name: "STAR+PLUS Home and Community-Based Services Waiver",
    shortName: "STAR+PLUS",
    url: "https://olera.care/benefits/texas/star-plus-medicaid-hcbs",
    tagline: "Home care for older Texans who meet the program requirements.",
    eligibilityFactors: [
      "Medicaid eligibility",
      "Income and assets",
      "Need for a nursing-facility level of care",
    ],
    applicationSummary: "Join the interest list first, then apply for Medicaid when invited.",
  },
});

const genericHtml = benefitsResultsSavedEmail({
  greetingName: "Maria",
  stateName: "Texas",
  careLabel: "memory and medical care",
  familyPhrase: "your mom",
  relatedPrograms: [
    { name: "LIHEAP", url: "https://olera.care/benefits/texas/liheap" },
  ],
  matchesUrl: "https://olera.care/m/sample",
  matchCount: 4,
});

const problems: string[] = [];
const expectContains = (html: string, phrase: string, label: string) => {
  if (!html.includes(phrase)) problems.push(`${label} is missing: ${phrase}`);
};

expectContains(programHtml, "You were checking STAR+PLUS. Start here.", "program email");
expectContains(programHtml, "We can't determine eligibility from an email address alone.", "program email");
expectContains(programHtml, "Need for a nursing-facility level of care", "program email");
expectContains(programHtml, "See my STAR+PLUS next step", "program email");
expectContains(programHtml, "not replacements for STAR+PLUS", "program email");
expectContains(genericHtml, "Your Texas benefits plan is ready.", "generic email");
expectContains(genericHtml, "This is a starting list, not an eligibility decision.", "generic email");
expectContains(genericHtml, "Review my benefits plan", "generic email");

for (const phrase of legacyPhrases) {
  if (programHtml.includes(phrase)) problems.push(`program email still contains legacy copy: ${phrase}`);
  if (genericHtml.includes(phrase)) problems.push(`generic email still contains legacy copy: ${phrase}`);
}

const programSubject = benefitsResultsSavedSubject({
  stateName: "Texas",
  requestedProgramName: "STAR+PLUS",
});
const genericSubject = benefitsResultsSavedSubject({ stateName: "Texas" });
if (programSubject !== "What to check for STAR+PLUS") {
  problems.push(`unexpected program subject: ${programSubject}`);
}
if (genericSubject !== "Your Texas benefits plan is ready") {
  problems.push(`unexpected generic subject: ${genericSubject}`);
}

const starPlusEntry = resolveBenefitsProgramEntry(
  "https://olera.care/benefits/texas/star-plus-medicaid-hcbs?ref=article",
);
if (starPlusEntry?.program.shortName !== "STAR+PLUS") {
  problems.push("specific benefits entry no longer resolves its server-side program context");
}
for (const broadEntry of [
  "/benefits/texas",
  "/provider/example-care",
  "/caregiver-support/medicaid-guide",
  "/benefits/texas/not-a-real-program",
  "/benefits/%E0%A4%A/bad-encoding",
]) {
  if (resolveBenefitsProgramEntry(broadEntry) !== null) {
    problems.push(`non-program entry unexpectedly established program intent: ${broadEntry}`);
  }
}

if (problems.length > 0) {
  console.error("Benefits results email check failed:");
  for (const problem of problems) console.error(`- ${problem}`);
  process.exit(1);
}

console.log("Benefits results email OK: program-aware and broad-entry paths contain no legacy template copy.");
