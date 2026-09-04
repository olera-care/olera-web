import "server-only";

import { getServiceClient } from "@/lib/admin";

/**
 * Outcome capture for the Family Answers Engine.
 *
 * Seven days after we send a researched answer we ask one question, and the
 * answer has to be machine-readable. If we ask "did you get help?" and get
 * prose back, we have generated another message that needs a human to read it,
 * which is precisely the cost this system exists to reduce. So the follow-up
 * names two keywords and the webhook matches them here.
 *
 * KEYWORD CHOICE IS CONSTRAINED, not arbitrary. The obvious pair is YES/NO, and
 * YES is unavailable: it is a TCPA opt-IN keyword handled earlier in the
 * webhook, and hijacking it would mean a family trying to resubscribe silently
 * files an outcome instead. STUCK is also taken, by the benefits cascade's
 * progress replies. HELPED and NOTYET are free, and NO is accepted as an alias
 * because it is what people actually type.
 */

/** Reply keywords that close out a follow-up. Normalized: letters only, uppercased. */
const HELPED_KEYWORDS = new Set(["HELPED", "HELPFUL", "SORTED", "FIXED"]);
const NOT_HELPED_KEYWORDS = new Set(["NOTYET", "NO", "NOPE", "NOTHING", "STILLSTUCK"]);

export type Outcome = "helped" | "not_helped" | "no_response";

export interface OutcomeCapture {
  recorded: boolean;
  outcome?: Outcome;
  /** A receipt to text back, so the family knows the reply landed. */
  response?: string;
  /** True when a human should look — they told us it did not work. */
  needsHuman?: boolean;
}

/** Map a normalized inbound keyword to an outcome, or null if it is not one. */
export function outcomeFromKeyword(keyword: string | null): Outcome | null {
  if (!keyword) return null;
  if (HELPED_KEYWORDS.has(keyword)) return "helped";
  if (NOT_HELPED_KEYWORDS.has(keyword)) return "not_helped";
  return null;
}

/**
 * Record an outcome against the most recent follow-up this number is still
 * owed an answer to.
 *
 * Returns `recorded: false` when nothing is awaiting an outcome, which is the
 * common case — most inbound texts are not follow-up replies, and the caller
 * must fall through to normal handling rather than swallowing the message.
 */
export async function captureOutcome(
  phoneLast10: string,
  keyword: string | null,
  body: string,
): Promise<OutcomeCapture> {
  const outcome = outcomeFromKeyword(keyword);
  if (!outcome) return { recorded: false };

  const db = getServiceClient();

  const { data: job, error } = await db
    .from("family_answer_jobs")
    .select("id")
    .eq("phone_last10", phoneLast10)
    .not("followup_sent_at", "is", null)
    .is("outcome", null)
    .order("followup_sent_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // A HELPED with no pending follow-up is just a person saying thanks. Let it
  // flow to normal handling instead of recording an outcome nobody asked for.
  if (error || !job) return { recorded: false };

  const { error: updateError } = await db
    .from("family_answer_jobs")
    .update({
      outcome,
      outcome_at: new Date().toISOString(),
      // Keep the raw text. The keyword is the measurement; this is the part
      // worth reading, and it is where the reason lives.
      outcome_note: body.slice(0, 1000),
    })
    .eq("id", job.id);

  if (updateError) {
    console.error("[family-answers] Outcome update failed:", updateError);
    return { recorded: false };
  }

  if (outcome === "helped") {
    return {
      recorded: true,
      outcome,
      response: "Olera: That's good to hear. Thanks for telling us, it helps us do better for the next family.",
    };
  }

  return {
    recorded: true,
    outcome,
    needsHuman: true,
    response: "Olera: Thanks for telling us. We'll take another look and get back to you.",
  };
}

/**
 * Age out follow-ups nobody answered.
 *
 * A silent family is data too: it is the difference between "we do not know"
 * and "we asked and heard nothing", and only one of those can be counted.
 */
export async function expireUnansweredFollowups(afterDays = 14): Promise<number> {
  const db = getServiceClient();
  const cutoff = new Date(Date.now() - afterDays * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await db
    .from("family_answer_jobs")
    .update({ outcome: "no_response", outcome_at: new Date().toISOString() })
    .not("followup_sent_at", "is", null)
    .is("outcome", null)
    .lt("followup_sent_at", cutoff)
    .select("id");

  if (error) {
    console.error("[family-answers] Expire unanswered failed:", error);
    return 0;
  }
  return data?.length ?? 0;
}
