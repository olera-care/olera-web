/**
 * Crisis detection for inbound care-seeker texts.
 *
 * This runs in the Twilio webhook, before anything else decides what to do with
 * a message. It is deliberately a deterministic term match rather than a model
 * call: the webhook must answer Twilio in well under a second, and a rule you
 * can read is a rule you can audit after it fails. A model here would be slower,
 * non-reproducible, and impossible to review in a code review.
 *
 * ASYMMETRY (the whole design):
 *   false positive  → a human gets pinged about a non-emergency. Costs a glance.
 *   false negative  → someone in crisis receives "we're looking into this and
 *                     will get back to you", which is the worst possible reply.
 * So this errs toward matching. Every judgement call in the term list below
 * resolves in favour of flagging.
 *
 * A crisis match does NOT send an automated reply. There is no safe canned
 * response to "I want to die" from a benefits directory, and attempting one
 * risks implying we are a crisis service. We page a human and stop.
 *
 * DOMAIN TRAP, learned the hard way: our own benefits programs have the word
 * "Emergency" in their names — EHEAP is the Emergency Home Energy Assistance
 * for the Elderly Program, and LIHEAP has an emergency crisis tier. A family
 * repeating a program name back to us ("I called about the emergency home
 * energy program") must not trip this. So bare "emergency" and bare "crisis"
 * are NOT terms; only phrasings that bind them to a person are.
 */

export type CrisisCategory = "self_harm" | "medical" | "safety";

export interface CrisisResult {
  isCrisis: boolean;
  /** Highest-severity category matched, in the order self_harm > medical > safety. */
  category: CrisisCategory | null;
  /** Every term that matched, for the Slack page and the audit trail. */
  matched: string[];
}

/**
 * Terms are matched case-insensitively against the message with word
 * boundaries, so "stroke" cannot fire inside "strokes" and "ER" is never a
 * term at all (it would match half the alphabet).
 *
 * Contractions are listed in both apostrophe and bare forms because phone
 * keyboards produce both, and a curly apostrophe is normalized before matching.
 */
const TERMS: Record<CrisisCategory, string[]> = {
  // Suicidal ideation and self-harm. Widest net of the three.
  //
  // THIRD PERSON MATTERS AS MUCH AS FIRST. Most people who text us are
  // caregivers, so the crisis is at least as likely to be phrased about the
  // person they care for ("my mother wants to die") as about themselves.
  // Every first-person phrasing below has her/him variants for that reason.
  //
  // Inflections are listed explicitly rather than stemmed. "ending it all"
  // does not match the term "end it all" under a word-boundary regex, and
  // that exact miss showed up the first time this list was tested.
  self_harm: [
    "kill myself", "kill herself", "kill himself", "kill themselves",
    "killing myself", "killing herself", "killing himself", "killing themselves",
    "end my life", "end her life", "end his life",
    "ending my life", "ending her life", "ending his life",
    "end it all", "ending it all",
    "take my own life", "taking my own life",
    "want to die", "wants to die", "wanted to die", "wanna die",
    "want to be dead", "wants to be dead",
    "better off dead",
    "no reason to live", "nothing to live for",
    "dont want to live", "do not want to live", "doesnt want to live", "does not want to live",
    "dont want to be here",
    "hurt myself", "hurt herself", "hurt himself",
    "hurting myself", "hurting herself", "hurting himself",
    "harm myself", "harm herself", "harm himself", "harming myself",
    "cut myself", "cutting myself",
    "suicide", "suicidal",
    "overdose", "overdosed", "overdosing",
    "take all my pills", "took all my pills", "took all her pills", "took all his pills",
  ],
  // Acute medical events. "chest pain" and "cant breathe" are the two that
  // most often show up in an otherwise ordinary message.
  medical: [
    "cant breathe", "can not breathe", "cannot breathe",
    "not breathing", "stopped breathing", "trouble breathing",
    "chest pain", "chest pains",
    "heart attack",
    "having a stroke", "had a stroke",
    "unconscious", "unresponsive",
    "passed out", "collapsed",
    "seizure", "seizures",
    "wont wake up", "will not wake up", "cant wake her", "cant wake him",
    "turning blue",
    "bleeding", "bleeding badly", "wont stop bleeding",
    "911", "call 911", "called 911", "calling 911",
    "ambulance",
    "medical emergency",
    "life threatening", "life or death",
  ],
  // Abuse, violence, and immediate danger, including the elder-abuse phrasings
  // a family is most likely to use with us.
  safety: [
    "elder abuse",
    "being abused", "is abused", "abusing her", "abusing him", "abusing me",
    "hit me", "hits me", "hitting me",
    "hit her", "hits her", "hitting her",
    "hit him", "hits him", "hitting him",
    "beating me", "beating her", "beating him",
    "threatening me", "threatened me", "threatens me", "threatening to",
    "afraid for my life", "fear for my life", "scared for my life",
    "afraid of him", "afraid of her",
    "not safe here", "im not safe", "i am not safe", "shes not safe", "hes not safe",
    "in danger",
    "being hurt", "hurting her", "hurting him",
  ],
};

/** Severity order. The page should name the worst thing it found. */
const SEVERITY: CrisisCategory[] = ["self_harm", "medical", "safety"];

/**
 * Normalize for matching: lowercase, curly quotes to straight, strip
 * apostrophes so "can't" and "cant" both hit the "cant breathe" term, and
 * collapse whitespace so a line break inside a phrase doesn't hide it.
 */
function normalize(body: string): string {
  return body
    .toLowerCase()
    .replace(/[‘’ʼ]/g, "'")
    .replace(/'/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Escape a term for use inside a RegExp. Terms are static, but this keeps the list safe to edit. */
function escapeRe(term: string): string {
  return term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Word-boundary match. `\b` on both ends means "hit me" does not fire inside
 * "whit men" and "suicide" does not fire inside "suicidee", while still
 * allowing trailing punctuation.
 */
function containsTerm(haystack: string, term: string): boolean {
  return new RegExp(`\\b${escapeRe(term)}\\b`).test(haystack);
}

/**
 * Scan an inbound message body for crisis language.
 *
 * Pure and synchronous. Safe to call on every inbound text.
 */
export function detectCrisis(body: string | null | undefined): CrisisResult {
  if (!body) return { isCrisis: false, category: null, matched: [] };

  const text = normalize(body);
  if (!text) return { isCrisis: false, category: null, matched: [] };

  const matched: string[] = [];
  let category: CrisisCategory | null = null;

  for (const cat of SEVERITY) {
    for (const term of TERMS[cat]) {
      if (containsTerm(text, term)) {
        matched.push(term);
        // First category in SEVERITY order wins, but keep scanning so the
        // page can show everything that fired.
        category ||= cat;
      }
    }
  }

  return { isCrisis: matched.length > 0, category, matched };
}

/** Human-readable label for the Slack page. */
export function crisisLabel(category: CrisisCategory): string {
  switch (category) {
    case "self_harm":
      return "possible self-harm";
    case "medical":
      return "possible medical emergency";
    case "safety":
      return "possible abuse or danger";
  }
}
