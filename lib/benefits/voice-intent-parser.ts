// Voice Intent Parser for Senior Benefits Finder
// Ported from iOS VoiceIntentParser.swift — keyword-based parsing per intake step

import type {
  IntakeStep,
  CarePreference,
  PrimaryNeed,
  IncomeRange,
  MedicaidStatus,
  VeteranStatus,
} from "@/lib/types/benefits";
import { searchCities } from "@/lib/us-city-search";

// ─── Types ──────────────────────────────────────────────────────────────────

export type ParseConfidence = "exact" | "fuzzy" | "unknown";

export type VoiceParseResult =
  | { type: "zipCode"; value: string; confidence: ParseConfidence }
  | { type: "location"; city: string; stateCode: string; confidence: ParseConfidence }
  | { type: "age"; value: number; confidence: ParseConfidence }
  | { type: "carePreference"; value: CarePreference; confidence: ParseConfidence }
  | { type: "primaryNeeds"; value: PrimaryNeed[]; confidence: ParseConfidence }
  | { type: "incomeRange"; value: IncomeRange; confidence: ParseConfidence }
  | { type: "medicaidStatus"; value: MedicaidStatus; confidence: ParseConfidence }
  | { type: "veteranStatus"; value: VeteranStatus; confidence: ParseConfidence }
  | { type: "navigation"; value: "back" | "skip" | "continue"; confidence: "exact" }
  | { type: "unknown"; clarification: string };

// ─── Spoken digit map ───────────────────────────────────────────────────────

const DIGIT_WORDS: Record<string, string> = {
  zero: "0", oh: "0", o: "0",
  one: "1", two: "2", three: "3", four: "4", five: "5",
  six: "6", seven: "7", eight: "8", nine: "9",
};

// ─── Spoken number map (for age parsing) ────────────────────────────────────

const TENS_WORDS: [string, number][] = [
  ["twenty", 20], ["thirty", 30], ["forty", 40], ["fifty", 50],
  ["sixty", 60], ["seventy", 70], ["eighty", 80], ["ninety", 90],
];

const ONES_WORDS = [
  "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
];

const SINGLE_NUMBERS: Record<string, number> = {
  eighteen: 18, nineteen: 19,
  twenty: 20, thirty: 30, forty: 40, fifty: 50,
  sixty: 60, seventy: 70, eighty: 80, ninety: 90,
  "one hundred": 100,
};

// ─── Clarification prompts ──────────────────────────────────────────────────

const CLARIFICATIONS: Record<IntakeStep, string> = {
  0: "I didn't catch that. Could you say your city and state, or just the 5-digit ZIP code?",
  1: "I need a number for the age. How old is the person who needs care?",
  2: "Would you like to stay at home, or are you exploring facility options?",
  3: "What kind of help is needed? For example: bathing, cooking, medications, or companionship.",
  4: "What's the approximate monthly budget for care? For example, about fifteen hundred, or two thousand.",
  5: "Do you have Medicaid, are you applying, or not sure?",
  6: "Is the person who needs care a veteran? You can say yes, no, or prefer not to say.",
};

// ─── Navigation intents ─────────────────────────────────────────────────────

function parseNavigation(text: string): VoiceParseResult | null {
  if (text.includes("go back") || text.includes("previous") || text === "back") {
    return { type: "navigation", value: "back", confidence: "exact" };
  }
  if (text.includes("skip") || text === "next" || text === "pass") {
    return { type: "navigation", value: "skip", confidence: "exact" };
  }
  // "Done" / "that's it" / "continue" / "that's all" — used by guided voice mode
  if (
    text === "done" || text === "i'm done" || text.includes("that's it") ||
    text.includes("that's all") || text === "continue" || text === "move on"
  ) {
    return { type: "navigation", value: "continue", confidence: "exact" };
  }
  return null;
}

// ─── State names + location helpers ─────────────────────────────────────────

const STATE_NAMES: Record<string, string> = {
  alabama: "AL", alaska: "AK", arizona: "AZ", arkansas: "AR",
  california: "CA", colorado: "CO", connecticut: "CT", delaware: "DE",
  florida: "FL", georgia: "GA", hawaii: "HI", idaho: "ID",
  illinois: "IL", indiana: "IN", iowa: "IA", kansas: "KS",
  kentucky: "KY", louisiana: "LA", maine: "ME", maryland: "MD",
  massachusetts: "MA", michigan: "MI", minnesota: "MN", mississippi: "MS",
  missouri: "MO", montana: "MT", nebraska: "NE", nevada: "NV",
  "new hampshire": "NH", "new jersey": "NJ", "new mexico": "NM", "new york": "NY",
  "north carolina": "NC", "north dakota": "ND", ohio: "OH", oklahoma: "OK",
  oregon: "OR", pennsylvania: "PA", "rhode island": "RI", "south carolina": "SC",
  "south dakota": "SD", tennessee: "TN", texas: "TX", utah: "UT",
  vermont: "VT", virginia: "VA", washington: "WA", "west virginia": "WV",
  wisconsin: "WI", wyoming: "WY", "district of columbia": "DC",
};

const STATE_ABBREVS = new Set(Object.values(STATE_NAMES));

const LOCATION_FILLER = [
  "i live in", "i'm in", "i am in", "i'm from", "i am from",
  "we live in", "we're in", "we are in", "my location is",
  "i'm located in", "i am located in", "located in", "i reside in",
  "my zip code is", "my zip is", "zip code", "zip",
];

// ─── Step 0: ZIP Code / City parsing ────────────────────────────────────────

function parseZipCode(text: string): VoiceParseResult {
  // Try direct 5-digit ZIP
  const zipMatch = text.match(/\b\d{5}\b/);
  if (zipMatch) {
    return { type: "zipCode", value: zipMatch[0], confidence: "exact" };
  }

  // Try spoken digits: "seven five two zero one"
  const words = text.split(/\s+/);
  let digits = "";
  for (const word of words) {
    if (DIGIT_WORDS[word]) {
      digits += DIGIT_WORDS[word];
    } else if (/^\d$/.test(word)) {
      digits += word;
    }
  }
  if (digits.length === 5) {
    return { type: "zipCode", value: digits, confidence: "exact" };
  }

  // Try city + state extraction
  return parseCityState(text);
}

function parseCityState(text: string): VoiceParseResult {
  // Strip filler phrases
  let cleaned = text;
  for (const filler of LOCATION_FILLER) {
    cleaned = cleaned.replace(filler, "").trim();
  }
  if (!cleaned) {
    return { type: "unknown", clarification: CLARIFICATIONS[0] };
  }

  // Try to extract state from the end (check 2-word states first, then 1-word)
  let stateCode: string | null = null;
  let cityPart = cleaned;
  const words = cleaned.split(/\s+/);

  // Check last two words for multi-word states (e.g. "new york", "north carolina")
  if (words.length >= 2) {
    const lastTwo = words.slice(-2).join(" ");
    if (STATE_NAMES[lastTwo]) {
      stateCode = STATE_NAMES[lastTwo];
      cityPart = words.slice(0, -2).join(" ");
    }
  }

  // Check last word for single-word states (e.g. "texas", "maryland")
  if (!stateCode && words.length >= 1) {
    const lastWord = words[words.length - 1];
    if (STATE_NAMES[lastWord]) {
      stateCode = STATE_NAMES[lastWord];
      cityPart = words.slice(0, -1).join(" ");
    }
    // Also check 2-letter abbreviations (e.g. "tx", "md")
    if (!stateCode && lastWord.length === 2) {
      const upper = lastWord.toUpperCase();
      if (STATE_ABBREVS.has(upper)) {
        stateCode = upper;
        cityPart = words.slice(0, -1).join(" ");
      }
    }
  }

  // Search for the city using existing city search infrastructure
  const query = cityPart || cleaned;
  const results = searchCities(query, 5);

  if (results.length > 0) {
    // If we extracted a state, prefer a match in that state
    if (stateCode) {
      const stateMatch = results.find((r) => r.state === stateCode);
      if (stateMatch) {
        return {
          type: "location",
          city: stateMatch.city,
          stateCode: stateMatch.state,
          confidence: "exact",
        };
      }
    }
    // Use top result
    const top = results[0];
    return {
      type: "location",
      city: top.city,
      stateCode: top.state,
      confidence: "fuzzy",
    };
  }

  // If we at least have a state code, return it with the city text as-is
  if (stateCode) {
    const titleCity = cityPart
      ? cityPart.split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
      : "";
    return {
      type: "location",
      city: titleCity,
      stateCode,
      confidence: "fuzzy",
    };
  }

  return { type: "unknown", clarification: CLARIFICATIONS[0] };
}

// ─── Step 1: Age parsing ────────────────────────────────────────────────────

function parseAge(text: string): VoiceParseResult {
  // Check compound spoken numbers: "seventy eight", "sixty-five"
  for (const [tensWord, tensValue] of TENS_WORDS) {
    for (let i = 0; i < ONES_WORDS.length; i++) {
      const onesWord = ONES_WORDS[i];
      const age = tensValue + (i + 1);
      if (
        text.includes(`${tensWord} ${onesWord}`) ||
        text.includes(`${tensWord}-${onesWord}`)
      ) {
        if (age >= 18 && age <= 120) {
          return { type: "age", value: age, confidence: "exact" };
        }
      }
    }
  }

  // Check single number words: "eighteen", "seventy"
  for (const [word, value] of Object.entries(SINGLE_NUMBERS)) {
    if (text.includes(word) && value >= 18 && value <= 120) {
      return { type: "age", value, confidence: "exact" };
    }
  }

  // Extract numeric digits: "72", "she's 85"
  const ageMatch = text.match(/\b(\d{2,3})\b/);
  if (ageMatch) {
    const age = parseInt(ageMatch[1], 10);
    if (age >= 18 && age <= 120) {
      return { type: "age", value: age, confidence: "exact" };
    }
  }

  return { type: "unknown", clarification: CLARIFICATIONS[1] };
}

// ─── Step 2: Care preference ────────────────────────────────────────────────

const STAY_HOME_KEYWORDS = [
  "stay home", "stay at home", "at home", "home care", "keep at home",
  "keep her at home", "keep him at home", "keep them at home",
  "keep her home", "keep him home", "keep them home",
  "like to keep", "want to keep", "prefer to keep",
  "live at home", "remain at home", "don't want to move", "aging in place",
];

const FACILITY_KEYWORDS = [
  "facility", "nursing home", "assisted living", "senior living",
  "memory care facility", "exploring", "looking at places", "moving somewhere",
];

const UNSURE_KEYWORDS = [
  "not sure", "don't know", "unsure", "haven't decided", "thinking about it",
];

function parseCarePreference(text: string): VoiceParseResult {
  for (const kw of STAY_HOME_KEYWORDS) {
    if (text.includes(kw)) {
      return { type: "carePreference", value: "stayHome", confidence: "exact" };
    }
  }
  for (const kw of FACILITY_KEYWORDS) {
    if (text.includes(kw)) {
      return { type: "carePreference", value: "exploringFacility", confidence: "exact" };
    }
  }
  for (const kw of UNSURE_KEYWORDS) {
    if (text.includes(kw)) {
      return { type: "carePreference", value: "unsure", confidence: "exact" };
    }
  }
  return { type: "unknown", clarification: CLARIFICATIONS[2] };
}

// ─── Step 3: Primary needs (multi-select) ───────────────────────────────────

const NEED_KEYWORDS: Record<PrimaryNeed, string[]> = {
  personalCare: [
    "personal care", "bathing", "bath", "dressing", "dress",
    "toileting", "hygiene", "grooming", "bathroom", "restroom",
    "toilet", "feeding", "eating", "shower", "adl",
    "activities of daily living",
  ],
  householdTasks: [
    "household", "cleaning", "clean", "meals", "cooking", "cook",
    "laundry", "errands", "shopping", "grocery", "chores",
    "light housekeeping", "homemaking",
  ],
  healthManagement: [
    "medication", "medicine", "pills", "appointments", "doctor",
    "health management", "medical", "prescriptions", "treatments",
  ],
  companionship: [
    "companion", "loneliness", "lonely", "social", "visit",
    "someone to talk to", "friendship", "emotional support",
  ],
  financialHelp: [
    "financial", "money", "bills", "afford", "budget",
    "paying for", "cost",
  ],
  memoryCare: [
    "memory care", "dementia", "alzheimer", "forgetful", "confusion",
    "cognitive", "wandering",
  ],
  mobilityHelp: [
    "mobility", "walking", "getting around", "wheelchair", "stairs",
    "transferring", "getting in and out", "fall", "balance",
  ],
};

function parsePrimaryNeeds(text: string): VoiceParseResult {
  const matched: PrimaryNeed[] = [];

  for (const [need, keywords] of Object.entries(NEED_KEYWORDS) as [PrimaryNeed, string[]][]) {
    for (const kw of keywords) {
      if (text.includes(kw)) {
        matched.push(need);
        break; // one match per need category is enough
      }
    }
  }

  if (matched.length > 0) {
    return { type: "primaryNeeds", value: matched, confidence: matched.length === 1 ? "fuzzy" : "exact" };
  }
  return { type: "unknown", clarification: CLARIFICATIONS[3] };
}

// ─── Step 4: Income range ───────────────────────────────────────────────────

function parseIncomeRange(text: string): VoiceParseResult {
  // Prefer not to say
  if (
    text.includes("prefer not") || text.includes("rather not") ||
    text.includes("don't want to say") || text.includes("private")
  ) {
    return { type: "incomeRange", value: "preferNotToSay", confidence: "exact" };
  }

  // Over 6000
  if (
    text.includes("over 6") || text.includes("more than 6") || text.includes("above 6") ||
    text.includes("over six") || text.includes("high income")
  ) {
    return { type: "incomeRange", value: "over6000", confidence: "exact" };
  }

  // 4000-6000 range
  if (
    text.includes("over 4") || text.includes("more than 4") || text.includes("above 4") ||
    text.includes("over four") || text.includes("around 5") || text.includes("about 5") ||
    text.includes("5000") || text.includes("five thousand") ||
    text.includes("6000") || text.includes("six thousand") || text.includes("6,000")
  ) {
    return { type: "incomeRange", value: "under6000", confidence: "fuzzy" };
  }

  // 2500-4000 range
  if (
    text.includes("over 2") || text.includes("more than 2") || text.includes("above 2") ||
    text.includes("over two") || text.includes("around 3") || text.includes("about 3") ||
    text.includes("4000") || text.includes("four thousand") || text.includes("4,000") ||
    text.includes("3000") || text.includes("three thousand") || text.includes("3,000")
  ) {
    return { type: "incomeRange", value: "under4000", confidence: "fuzzy" };
  }

  // 1500-2500 range
  if (
    text.includes("2500") || text.includes("twenty five hundred") || text.includes("2,500") ||
    text.includes("around 2000") || text.includes("about 2000") || text.includes("2000") ||
    text.includes("two thousand")
  ) {
    return { type: "incomeRange", value: "under2500", confidence: "fuzzy" };
  }

  // Under 1500
  if (
    text.includes("under 1") || text.includes("less than 1") || text.includes("below 1") ||
    text.includes("under fifteen") || text.includes("less than fifteen") ||
    text.includes("social security") ||
    text.includes("1400") || text.includes("1300") || text.includes("1200") ||
    text.includes("1100") || text.includes("1000") || text.includes("1,000") ||
    text.includes("900") || text.includes("nine hundred") ||
    text.includes("800") || text.includes("eight hundred") ||
    text.includes("700") || text.includes("seven hundred") ||
    text.includes("1500") || text.includes("fifteen hundred") || text.includes("1,500")
  ) {
    return { type: "incomeRange", value: "under1500", confidence: "fuzzy" };
  }

  return { type: "unknown", clarification: CLARIFICATIONS[4] };
}

// ─── Step 5: Medicaid status ────────────────────────────────────────────────

function parseMedicaidStatus(text: string): VoiceParseResult {
  // Check negation FIRST — "don't have medicaid" contains "have medicaid"
  const doesNotHaveKeywords = [
    "don't have medicaid", "do not have medicaid", "no medicaid",
    "not on medicaid", "don't qualify", "just medicare",
    "only medicare", "no i don't", "doesn't have medicaid",
    "does not have medicaid",
  ];
  for (const kw of doesNotHaveKeywords) {
    if (text.includes(kw)) {
      return { type: "medicaidStatus", value: "doesNotHave", confidence: "exact" };
    }
  }

  // Positive (after negation check)
  const alreadyHasKeywords = [
    "have medicaid", "already have", "on medicaid", "got medicaid",
    "enrolled in medicaid", "yes medicaid", "i have it", "have it already",
  ];
  for (const kw of alreadyHasKeywords) {
    if (text.includes(kw)) {
      return { type: "medicaidStatus", value: "alreadyHas", confidence: "exact" };
    }
  }

  // Applying
  const applyingKeywords = [
    "applying", "applied", "waiting", "in process", "just applied",
    "application pending", "started the application",
  ];
  for (const kw of applyingKeywords) {
    if (text.includes(kw)) {
      return { type: "medicaidStatus", value: "applying", confidence: "exact" };
    }
  }

  // Not sure
  const notSureKeywords = [
    "not sure", "don't know", "unsure", "what's medicaid", "what is medicaid",
    "confused", "don't understand",
  ];
  for (const kw of notSureKeywords) {
    if (text.includes(kw)) {
      return { type: "medicaidStatus", value: "notSure", confidence: "exact" };
    }
  }

  // Simple yes/no as contextual answers
  if (text === "yes" || text === "yeah" || text === "i do" || text === "yep") {
    return { type: "medicaidStatus", value: "alreadyHas", confidence: "fuzzy" };
  }
  if (text === "no" || text === "nope" || text === "i don't") {
    return { type: "medicaidStatus", value: "doesNotHave", confidence: "fuzzy" };
  }

  return { type: "unknown", clarification: CLARIFICATIONS[5] };
}

// ─── Step 6: Veteran status ─────────────────────────────────────────────────

function parseVeteranStatus(text: string): VoiceParseResult {
  const veteranKeywords = ["veteran", "vet", "military", "served", "service"];
  const noKeywords = ["no", "nope", "not a veteran", "never served", "civilian"];
  const preferNotKeywords = ["prefer not", "rather not", "skip", "don't want to say"];

  if (preferNotKeywords.some((kw) => text.includes(kw))) {
    return { type: "veteranStatus", value: "preferNotToSay", confidence: "exact" };
  }

  // Check negation first
  const hasNegation = text.startsWith("no") || text.includes("not") || text.includes("never");
  if (hasNegation) {
    return { type: "veteranStatus", value: "no", confidence: "exact" };
  }

  // Check for positive veteran signals
  if (veteranKeywords.some((kw) => text.includes(kw))) {
    return { type: "veteranStatus", value: "yes", confidence: "exact" };
  }

  // Simple yes/no
  if (text === "yes" || text === "yeah" || text === "yep" || text === "he is" || text === "she is") {
    return { type: "veteranStatus", value: "yes", confidence: "fuzzy" };
  }
  if (noKeywords.some((kw) => text === kw || text.startsWith(kw))) {
    return { type: "veteranStatus", value: "no", confidence: "fuzzy" };
  }

  return { type: "unknown", clarification: CLARIFICATIONS[6] };
}

// ─── Main entry point ───────────────────────────────────────────────────────

/**
 * Parse a voice transcript into a structured form value for the given intake step.
 *
 * Returns the parsed value with confidence level, or an "unknown" result with
 * a clarification prompt to show the user.
 */
export function parseVoiceIntent(
  transcript: string,
  step: IntakeStep
): VoiceParseResult {
  const normalized = transcript.toLowerCase().trim();
  if (!normalized) {
    return { type: "unknown", clarification: CLARIFICATIONS[step] };
  }

  // Check navigation intents first (work on any step)
  const nav = parseNavigation(normalized);
  if (nav) return nav;

  // Parse based on current step
  switch (step) {
    case 0:
      return parseZipCode(normalized);
    case 1:
      return parseAge(normalized);
    case 2:
      return parseCarePreference(normalized);
    case 3:
      return parsePrimaryNeeds(normalized);
    case 4:
      return parseIncomeRange(normalized);
    case 5:
      return parseMedicaidStatus(normalized);
    case 6:
      return parseVeteranStatus(normalized);
    default:
      return { type: "unknown", clarification: "I didn't understand that." };
  }
}

/**
 * Get a confirmation message for a successfully parsed result.
 */
export function getConfirmationMessage(result: VoiceParseResult): string | null {
  switch (result.type) {
    case "zipCode":
      return `ZIP code ${result.value}, got it.`;
    case "location":
      return result.city
        ? `${result.city}, ${result.stateCode} — got it.`
        : `${result.stateCode} — got it.`;
    case "age":
      return `${result.value} years old, got it.`;
    case "carePreference":
      switch (result.value) {
        case "stayHome": return "Staying at home, understood.";
        case "exploringFacility": return "Exploring facility options, got it.";
        case "unsure": return "Not sure yet, that's okay.";
      }
      break;
    case "primaryNeeds": {
      const names = result.value.map((n) => n.replace(/([A-Z])/g, " $1").toLowerCase().trim());
      return `Help with ${names.join(" and ")}, noted.`;
    }
    case "incomeRange":
      return "Income noted.";
    case "medicaidStatus":
      switch (result.value) {
        case "alreadyHas": return "Medicaid, got it.";
        case "applying": return "Applying for Medicaid, noted.";
        case "notSure": return "Not sure about Medicaid, that's okay.";
        case "doesNotHave": return "No Medicaid, understood.";
      }
      break;
    case "veteranStatus":
      switch (result.value) {
        case "yes": return "Veteran, got it.";
        case "no": return "Not a veteran, understood.";
        case "preferNotToSay": return "That's okay, we'll skip that.";
      }
      break;
    case "navigation":
      if (result.value === "back") return "Going back.";
      if (result.value === "continue") return "Moving on.";
      return "Skipping ahead.";
    case "unknown":
      return null;
  }
  return null;
}
