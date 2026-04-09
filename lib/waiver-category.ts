import type { WaiverProgram } from "@/data/waiver-library";

export type Category = "financial" | "food" | "health" | "caregiver" | "resource";

const FOOD_KEYWORDS = [
  "snap", "food", "nutrition", "meals", "calfresh", "congregate",
  "home-delivered meals", "senior nutrition",
];
const HEALTH_KEYWORDS = [
  "medicaid", "medicare", "health", "medical", "ship", "hicap",
  "pace", "insurance", "coverage", "waiver", "hcbs",
];
const CAREGIVER_KEYWORDS = [
  "caregiver", "respite", "ombudsman", "family caregiver",
];
const FINANCIAL_KEYWORDS = [
  "ssi", "ssp", "supplemental", "energy", "liheap", "weatherization",
  "property tax", "legal", "savings program", "cash assistance",
  "scsep", "employment program", "job training",
];

/**
 * Programs that are really just hotlines, counseling, or referral services —
 * they don't have complex eligibility or applications, just a phone number
 * and an overview. These get their own "Free Resources" tab.
 */
const RESOURCE_PROGRAM_IDS = new Set<string>([
  "texas-ship-medicare-counseling",
  "texas-long-term-care-ombudsman",
  "texas-legal-services-for-seniors",
  "texas-senior-companion-program",
]);

export function isResourceProgram(program: WaiverProgram): boolean {
  return RESOURCE_PROGRAM_IDS.has(program.id);
}

export function getCategory(program: WaiverProgram): Category {
  if (isResourceProgram(program)) return "resource";
  const text = `${program.name} ${program.id} ${program.tagline}`.toLowerCase();
  if (CAREGIVER_KEYWORDS.some((kw) => text.includes(kw))) return "caregiver";
  if (FOOD_KEYWORDS.some((kw) => text.includes(kw))) return "food";
  if (FINANCIAL_KEYWORDS.some((kw) => text.includes(kw))) return "financial";
  return "health";
}
