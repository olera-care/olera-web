import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * "Families are asking" on the /benefits/<state> pages.
 *
 * This used to show the six most recent answered provider-page questions from
 * ANY state on EVERY state page: apartment floor plans on Texas, a Maryland
 * phone number on Vermont, with the answerer's user UUID printed as the
 * author name. Now a question only shows when all of these hold:
 *   - it is about benefits or coverage (Medicaid, Medicare, VA, waivers...)
 *   - the provider it was asked on is in this state
 *   - the answer is a real answer (not a bare "call us at 555-..." line)
 * The author line is the provider's NAME from the directory, never an id.
 * When nothing qualifies, the list is empty and the section hides.
 */

export interface StateFamilyQuestion {
  question: string;
  answer: string;
  providerName: string;
  answeredAt: string;
  providerSlug?: string;
}

const BENEFIT_TERMS = [
  "medicaid",
  "medicare",
  "waiver",
  "benefit",
  "veteran",
  "aid and attendance",
  "long-term care insurance",
  "long term care insurance",
  "financial assistance",
  "snap",
  "food stamps",
  "liheap",
  "voucher",
  "social security",
  "pace program",
];

const BENEFIT_RE =
  /\b(medicaid|medicare|waivers?|benefits?|veterans?|va\b|aid (and|&) attendance|long[- ]term care insurance|financial (assistance|help)|snap\b|food stamps|liheap|vouchers?|social security|ssi\b|star\+?plus|pace\b)/i;

const PHONE_RE = /\(?\b\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function answerIsUsable(answer: string): boolean {
  const a = answer.trim();
  if (a.length < 60) return false;
  if (PHONE_RE.test(a)) return false;
  if (/https?:\/\/|www\.|@[a-z0-9-]+\./i.test(a)) return false;
  return true;
}

export async function getStateFamilyQuestions(
  supabase: SupabaseClient,
  stateCode: string,
  limit = 3,
): Promise<StateFamilyQuestion[]> {
  const orFilter = BENEFIT_TERMS.map((t) => `question.ilike.%${t.replace(/[,()]/g, "")}%`).join(",");
  const { data } = await supabase
    .from("provider_questions")
    .select("question, answer, answered_at, provider_id")
    .in("status", ["answered", "approved"])
    .eq("is_public", true)
    .eq("answer_status", "published")
    .not("answer", "is", null)
    .or(orFilter)
    .order("answered_at", { ascending: false })
    .limit(300);
  if (!data || data.length === 0) return [];

  const candidates = data.filter(
    (q) => q.question && q.answer && BENEFIT_RE.test(q.question) && answerIsUsable(q.answer),
  );
  if (candidates.length === 0) return [];

  // provider_questions.provider_id is the directory SLUG (olera-providers.slug).
  const slugs = Array.from(new Set(candidates.map((q) => q.provider_id).filter(Boolean))) as string[];
  const { data: providers } = await supabase
    .from("olera-providers")
    .select("slug, provider_name, state, deleted")
    .in("slug", slugs);
  const bySlug = new Map<string, { name: string | null; state: string | null; deleted: boolean | null }>();
  for (const p of providers || []) {
    if (p.slug) bySlug.set(p.slug, { name: p.provider_name, state: p.state, deleted: p.deleted });
  }

  const out: StateFamilyQuestion[] = [];
  const seenQuestions = new Set<string>();
  for (const q of candidates) {
    const prov = q.provider_id ? bySlug.get(q.provider_id) : undefined;
    if (!prov || prov.deleted || (prov.state || "").toUpperCase() !== stateCode.toUpperCase()) continue;
    const name = prov.name?.trim();
    if (!name || UUID_RE.test(name)) continue;
    // Several providers get the same suggested question; show each once.
    const key = q.question!.trim().toLowerCase();
    if (seenQuestions.has(key)) continue;
    seenQuestions.add(key);
    out.push({
      question: q.question!,
      answer: q.answer!,
      providerName: name,
      answeredAt: q.answered_at || "",
      providerSlug: q.provider_id || undefined,
    });
    if (out.length >= limit) break;
  }
  return out;
}
