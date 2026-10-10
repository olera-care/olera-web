import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Payment questions families ask on provider pages, for building email 1.
 * About one in four family questions are about cost (3,532 of 13,561 in the
 * 180 days to 10 Oct 2026), so a provider who hasn't listed payment options
 * often has one waiting on their own page.
 */
// How a family would pay, not what it costs: the email's subject is "A family
// asked how they'd pay", so "What's included in the monthly cost?" doesn't fit.
export const PAYMENT_QUESTION = /\b(medicaid|medicare|insurance|afford|affordable|pay for|private pay|veteran|va|waiver|long[- ]term care)\b/i;

/** The question most families ask about payment; its count goes in the email when there is no question of their own. */
export const COMMON_PAYMENT_QUESTION = "Does Medicare or Medicaid cover the stay?";

/**
 * The newest payment question visible on this provider's page, word for word,
 * or null. Same visibility rule as the public page (public, and pending,
 * approved or answered), so "a family on your page asked" is always something
 * the provider can see.
 */
export async function latestPaymentQuestion(db: SupabaseClient, providerIds: Array<string | null | undefined>): Promise<string | null> {
  const ids = [...new Set(providerIds.filter((id): id is string => Boolean(id)))];
  if (!ids.length) return null;
  const { data, error } = await db.from("provider_questions")
    .select("question")
    .in("provider_id", ids)
    .eq("is_public", true)
    .in("status", ["pending", "approved", "answered"])
    .order("created_at", { ascending: false })
    .limit(25);
  if (error || !data) return null;
  const hit = data.find((row) => typeof row.question === "string" && PAYMENT_QUESTION.test(row.question) && row.question.length <= 240);
  return hit ? hit.question.trim() : null;
}

/** Times the common payment question was asked in the last 180 days, or null if it can't be counted. */
export async function commonPaymentQuestionCount(db: SupabaseClient): Promise<number | null> {
  const since = new Date(Date.now() - 180 * 24 * 3600_000).toISOString();
  const { count, error } = await db.from("provider_questions")
    .select("id", { count: "exact", head: true })
    .eq("question", COMMON_PAYMENT_QUESTION)
    .gte("created_at", since);
  return error || typeof count !== "number" ? null : count;
}
