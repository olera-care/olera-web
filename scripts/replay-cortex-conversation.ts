/**
 * Replay a real founder exchange through Cortex's conversation pipeline and
 * score each reply against the voice rules.
 *
 * The fixture is the 2026-09-24 DM that prompted the voice block: he asked how
 * organic traffic looked and got two dense paragraphs of methodology, then
 * asked for week by week and got a paragraph on why it could not.
 *
 * Runs against the live database with the real lookups, so it costs money.
 * Defaults to Haiku; set WAR_ROOM_CONVERSATION_MODEL=claude-sonnet-5 to see
 * what production would say.
 *
 *   npx tsx scripts/replay-cortex-conversation.ts
 */
import fs from "node:fs";
import path from "node:path";

const FIXTURE = [
  "How’s organic traffic looking lately?",
  "How about this week versus last week versus the week before?",
];

/** Words the founder should never have to decode. */
const JARGON = /\b(famil(y|ies)|half[- ]window|lens(es)?|probes?|investigations?|conditions?|fact pack|dossier)\b/i;

export function voiceProblems(reply: string): string[] {
  const body = reply.replace(/\n\n_Sources:[\s\S]*$/, "").trim();
  const sentences = body.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 0);
  const problems: string[] = [];
  if (sentences.length > 5) problems.push(`${sentences.length} sentences (max 5)`);
  const jargon = body.match(JARGON);
  if (jargon) problems.push(`jargon: "${jargon[0]}"`);
  if (/[—–]/.test(body)) problems.push("em dash");
  if (/\?\s*$/.test(body)) problems.push("ends on a question");
  if (/\b(not seasonally adjusted|methodolog|caveat)\b/i.test(body)) problems.push("methodology");
  return problems;
}

function loadEnv() {
  const candidates = [path.resolve(".env.local"), path.join(process.env.HOME ?? "", "Desktop/olera-web/.env.local")];
  const file = candidates.find((candidate) => fs.existsSync(candidate));
  if (!file) return;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const i = line.indexOf("=");
    if (i < 1 || line.startsWith("#")) continue;
    process.env[line.slice(0, i).trim()] ??= line.slice(i + 1).trim().replace(/^"|"$/g, "");
  }
}

async function main() {
  loadEnv();
  process.env.WAR_ROOM_CONVERSATION_MODEL ??= "claude-haiku-4-5";
  // Imported after the env is set: the model is read at module load.
  const { createClient } = await import("@supabase/supabase-js");
  const { answerFounderQuestion } = await import("../lib/war-room/conversation.server");
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  console.log(`model: ${process.env.WAR_ROOM_CONVERSATION_MODEL}\n`);
  let prior: { question: string; answer: string; focusInvestigationId: null; at: string } | null = null;
  for (const question of FIXTURE) {
    const { reply } = await answerFounderQuestion(db, question, null, prior);
    const problems = voiceProblems(reply);
    console.log(`> ${question}\n${reply}\n[voice: ${problems.length ? problems.join("; ") : "ok"}]\n`);
    prior = { question, answer: reply, focusInvestigationId: null, at: new Date().toISOString() };
  }
}

if (process.argv[1]?.endsWith("replay-cortex-conversation.ts")) main();
