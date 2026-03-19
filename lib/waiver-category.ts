import type { WaiverProgram } from "@/data/waiver-library";

export type Category = "financial" | "food" | "health" | "caregiver";

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
];

export function getCategory(program: WaiverProgram): Category {
  const text = `${program.name} ${program.id} ${program.tagline}`.toLowerCase();
  if (CAREGIVER_KEYWORDS.some((kw) => text.includes(kw))) return "caregiver";
  if (FOOD_KEYWORDS.some((kw) => text.includes(kw))) return "food";
  if (FINANCIAL_KEYWORDS.some((kw) => text.includes(kw))) return "financial";
  return "health";
}
