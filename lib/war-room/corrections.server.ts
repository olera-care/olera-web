import Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * The founder's corrections, kept so they stick.
 *
 * On 2026-09-26 Cortex told him to "call Hoop Cares and ask her point blank why
 * she paid". He answered: "mid-curve advice, it's obvious why Hoop Cares
 * subscribed. She wants more leads." The next answer was good, but nothing
 * carried the lesson forward, so the same advice could come back tomorrow.
 *
 * Stored as short dated lines in `war_room_company_models.corrections`
 * (migration 260) and loaded into every DM answer and every brief. Cortex only
 * appends here; it never edits north_star or targets.
 */
export type Correction = { at: string; lesson: string; quote?: string };

const MAX_CORRECTIONS = 60;

/** Newest last. Empty when the column does not exist yet or cannot be read. */
export async function loadCorrections(db: SupabaseClient): Promise<Correction[]> {
  const { data, error } = await db.from("war_room_company_models")
    .select("corrections")
    .eq("key", "olera")
    .maybeSingle();
  if (error || !data) return [];
  const list = (data as { corrections?: unknown }).corrections;
  return Array.isArray(list)
    ? list.filter((item): item is Correction => Boolean(item) && typeof (item as Correction).lesson === "string")
    : [];
}

/** As prompt lines: "2026-09-26: Do not recommend ..." */
export function correctionLines(corrections: Correction[]): string[] {
  return corrections.map((correction) => `${correction.at}: ${correction.lesson}`);
}

/**
 * Is this message the founder correcting what Cortex just said? If so, what is
 * the lasting lesson about Olera, in one line?
 *
 * One Haiku call, only when a conversation is in progress (there is something
 * to correct). It returns NONE for anything that is not a correction: a new
 * question, a follow-up, agreement, or a correction too specific to reuse.
 */
export async function extractCorrection(
  previousAnswer: string,
  message: string,
): Promise<string | null> {
  if (!process.env.ANTHROPIC_API_KEY || message.trim().length < 8) return null;
  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const reply = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 150,
      system: "The founder of Olera, a senior-care marketplace, is replying to his AI chief of staff. Decide whether his message corrects or pushes back on what the assistant just said (e.g. 'that's wrong', 'mid-curve', 'I told you', 'not X, it's Y', 'don't tell me to...'). If it does, reply with ONLY the lasting lesson: one plain sentence that names the specific fact or rule he stated, general enough to apply next time. Example: \"Providers pay for leads; never recommend asking a provider why they paid.\" No preamble, no label, no markdown, no quotes. If it is a question, a follow-up, agreement, or new information that is not a correction, reply exactly NONE.",
      messages: [{ role: "user", content: `ASSISTANT SAID:\n${previousAnswer.slice(0, 1_500)}\n\nFOUNDER REPLIED:\n${message.slice(0, 1_000)}` }],
    }, { timeout: 15_000, maxRetries: 0 });
    const raw = reply.content.find((block): block is Anthropic.TextBlock => block.type === "text")?.text.trim() ?? "";
    // Keep only the lesson if the model wrapped it anyway ("**Lesson:** ...").
    const text = raw.replace(/^[\s\S]*?\blesson\b\s*:\s*/i, "").replace(/[*_`"]/g, "").replace(/\s+/g, " ").trim();
    if (!text || /^NONE\b/i.test(text) || text.length > 300) return null;
    return text;
  } catch {
    return null;
  }
}

/** Append one correction, newest last, bounded. Never touches other fields. */
export async function saveCorrection(db: SupabaseClient, lesson: string, quote: string): Promise<boolean> {
  const existing = await loadCorrections(db);
  if (existing.some((correction) => correction.lesson.toLowerCase() === lesson.toLowerCase())) return false;
  const next: Correction[] = [
    ...existing,
    { at: new Date().toISOString().slice(0, 10), lesson, quote: quote.slice(0, 300) },
  ].slice(-MAX_CORRECTIONS);
  const { error } = await db.from("war_room_company_models")
    .update({ corrections: next, updated_at: new Date().toISOString() })
    .eq("key", "olera");
  return !error;
}
