/**
 * Cheap, deterministic intent gates for the Twilio webhook.
 *
 * The webhook cannot wait minutes for the Family Answers model before deciding
 * whether to send an acknowledgement. This gate handles only the safest case:
 * a message whose entire meaning is conversational closure. Anything with a
 * question, problem, contrast, or additional detail deliberately falls through
 * to the normal human/research path.
 */

function normalize(body: string): string {
  return body
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[‘’ʼ']/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const COURTESY_ONLY = [
  /^(?:thank you|thanks|thx)(?: so (?:very )?much| very much| again)?$/,
  /^(?:many thanks|much appreciated|appreciate it|i appreciate it)$/,
  /^(?:ok|okay|got it|understood|sounds good|all right|perfect|great|will do)(?: thank you| thanks| thx)?$/,
  /^(?:thank you|thanks|thx) (?:got it|will do|sounds good|i appreciate it)$/,
  /^(?:thank you|thanks) for (?:your |the )?(?:help|reply|response|answer|guidance|information|info|time|number)$/,
  /^(?:thank you|thanks) for get(?:ting)? back to me$/,
  /^(?:thank you|thanks) i will call (?:them|the agency|that number)(?: tomorrow| today| now)?$/,
];

/**
 * True only for a high-confidence courtesy/acknowledgement with no new need.
 * This is intentionally an allowlist rather than a sentiment classifier: a
 * false negative causes one unnecessary acknowledgement, while a false
 * positive can hide a real request for help.
 */
export function isCourtesyOnlyReply(body: string | null | undefined): boolean {
  if (!body) return false;
  const text = normalize(body);
  return Boolean(text) && COURTESY_ONLY.some((pattern) => pattern.test(text));
}

/** The model triage categories that warrant the expensive research/draft path. */
export function familyAnswerCategoryNeedsDraft(category: string | null | undefined): boolean {
  return category !== "thanks" && category !== "unrelated";
}

/** Only pure conversational closure is safe to remove from the human queue. */
export function familyAnswerCategoryAutoCloses(category: string | null | undefined): boolean {
  return category === "thanks";
}
