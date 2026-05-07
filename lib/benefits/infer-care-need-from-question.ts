/**
 * Infer (careNeed, intent) from the user's question text.
 *
 * Used by the empathic_single arm to:
 *   1. Pick which intent-mapped H2 to render (cost / care-type / fit / default)
 *   2. Choose a careNeed for matchingPrograms when the user didn't explicitly pick one
 *
 * Pure, deterministic, easy to unit-test. No LLM. If accuracy data later
 * shows misroutes, we can swap the implementation without touching callers.
 */

import type { CareNeed } from "./match-care-need";

export type QuestionIntent = "cost" | "care-type" | "fit" | "default";

export interface InferredFromQuestion {
  careNeed: CareNeed;
  intent: QuestionIntent;
}

// Intent patterns — what KIND of question is being asked.
// Cost questions get the loss-frame H2 ($400-900/mo data). Care-type gets the
// availability-frame ('families like yours'). Fit gets the 'more options'
// framing. Default gets the empathic 'Care is expensive' line.
const INTENT_PATTERNS: Array<{ intent: QuestionIntent; pattern: RegExp }> = [
  // Cost first — most common pull, also most common phrasing
  {
    intent: "cost",
    pattern:
      /\b(cost|price|pay|afford|month(ly)?|charge|fee|expens|money|dollar|insur|medicare|medicaid|pricing|rate)\b|\$/i,
  },
  // Fit / recommendations
  {
    intent: "fit",
    pattern: /\b(best|recommend|right (one|fit|place)|choose|between|vs\.?|versus|compare|which)\b/i,
  },
  // Care type / services / staff
  {
    intent: "care-type",
    pattern:
      /\b(memory|dementia|alzheimer|staff|trained|nurse|doctor|medical|prescription|home care|in.?home|aide|mobility|daily|personal care|service|amenity|amenities|activit)\b/i,
  },
];

// CareNeed patterns — what TYPE of care the question implies.
// More specific patterns first (memoryHealth before stayingAtHome).
const CARE_NEED_PATTERNS: Array<{ careNeed: CareNeed; pattern: RegExp }> = [
  {
    careNeed: "memoryHealth",
    pattern: /\b(memory|dementia|alzheimer|medical|doctor|prescription|hospice|nursing|skilled)\b/i,
  },
  {
    careNeed: "companionship",
    pattern: /\b(respite|break|caregiver support|social|companion|isolat|lonely|family help)\b/i,
  },
  {
    careNeed: "stayingAtHome",
    pattern: /\b(home care|in.?home|aide|mobility|daily|personal care|attendant|stay (at )?home)\b/i,
  },
  {
    careNeed: "payingForCare",
    pattern:
      /\b(cost|price|pay|afford|month(ly)?|charge|fee|expens|money|dollar|insur|medicare|medicaid|qualif|benefit|financial|aid|subsid)\b|\$/i,
  },
];

// Map provider category strings (lowercase, matched loosely) to a fallback
// careNeed. Used when the question text gives no signal.
function inferCareNeedFromCategory(category: string | null): CareNeed {
  if (!category) return "payingForCare";
  const c = category.toLowerCase();
  if (c.includes("memory")) return "memoryHealth";
  if (c.includes("home") || c.includes("in-home") || c.includes("hospice")) return "stayingAtHome";
  if (c.includes("adult day") || c.includes("respite")) return "companionship";
  if (c.includes("assisted") || c.includes("nursing") || c.includes("independent")) return "stayingAtHome";
  return "payingForCare";
}

/**
 * Main entry. Returns the inferred care need and intent for the question
 * text, falling back to provider category, then to sensible defaults.
 */
export function inferCareNeedAndIntent(
  questionText: string | null | undefined,
  providerCategory: string | null | undefined,
): InferredFromQuestion {
  const text = (questionText ?? "").trim();

  // No question / very short — fall back to category for careNeed, default intent
  if (text.length < 4) {
    return {
      careNeed: inferCareNeedFromCategory(providerCategory ?? null),
      intent: "default",
    };
  }

  // Intent: first match wins (patterns ordered by frequency)
  let intent: QuestionIntent = "default";
  for (const { intent: candidate, pattern } of INTENT_PATTERNS) {
    if (pattern.test(text)) {
      intent = candidate;
      break;
    }
  }

  // CareNeed: first specific match wins; if none, fall back to category
  let careNeed: CareNeed | null = null;
  for (const { careNeed: candidate, pattern } of CARE_NEED_PATTERNS) {
    if (pattern.test(text)) {
      careNeed = candidate;
      break;
    }
  }

  return {
    careNeed: careNeed ?? inferCareNeedFromCategory(providerCategory ?? null),
    intent,
  };
}
