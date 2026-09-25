/**
 * Replay a real founder exchange through Cortex's conversation pipeline and
 * score each reply against the voice rules.
 *
 * The fixture is the 2026-09-24 DM that prompted the voice block: he asked how
 * organic traffic looked and got two dense paragraphs of methodology, then
 * asked for week by week and got a paragraph on why it could not.
 *
 * Reads the live database with the real lookups, so it costs money. Writes are
 * dropped (see readOnly), so a replay never shows up in the founder's brief.
 * Defaults to Haiku; set WAR_ROOM_CONVERSATION_MODEL=claude-sonnet-5 to see
 * what production would say.
 *
 *   npx tsx scripts/replay-cortex-conversation.ts
 *   npx tsx scripts/replay-cortex-conversation.ts "What shipped this week?"
 */
import fs from "node:fs";
import path from "node:path";

const FIXTURE = [
  "How’s organic traffic looking lately?",
  "How about this week versus last week versus the week before?",
];

/** Words the founder should never have to decode. */
// "Families" alone is Olera's word for care seekers, so only the page-type sense is jargon.
const JARGON = /\b((page|provider|benefits?|editorial) famil(y|ies)|smaller famil(y|ies)|half[- ]window|lens(es)?|probes?|investigations?|fact pack|dossier)\b/i;

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

/**
 * The live database, with every write turned into a no-op.
 *
 * A replay is not the founder. When Cortex cannot answer, it records a lookup
 * gap, and the next morning's brief lists it under "What I could not look up"
 * as if he had asked. On 2026-09-25 two replay questions landed there before
 * this wrapper existed.
 */
export function readOnly<T extends { from: (table: string) => unknown }>(client: T): T {
  const skipped = Promise.resolve({ data: null, error: null });
  return new Proxy(client, {
    get(target, prop, receiver) {
      if (prop !== "from") return Reflect.get(target, prop, receiver);
      return (table: string) => new Proxy(target.from(table) as object, {
        get(builder, method, inner) {
          if (method === "insert" || method === "upsert" || method === "update" || method === "delete") {
            return () => skipped;
          }
          return Reflect.get(builder, method, inner);
        },
      });
    },
  });
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
  const db = readOnly(createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!));

  console.log(`model: ${process.env.WAR_ROOM_CONVERSATION_MODEL}\n`);
  // Questions on the command line replace the fixture and run independently;
  // the fixture runs as one conversation, the way he sent it.
  const custom = process.argv.slice(2);
  const questions = custom.length ? custom : FIXTURE;
  let prior: { question: string; answer: string; focusInvestigationId: null; at: string } | null = null;
  for (const question of questions) {
    const { reply } = await answerFounderQuestion(db, question, null, prior);
    const problems = voiceProblems(reply);
    console.log(`> ${question}\n${reply}\n[voice: ${problems.length ? problems.join("; ") : "ok"}]\n`);
    if (!custom.length) prior = { question, answer: reply, focusInvestigationId: null, at: new Date().toISOString() };
  }
}

if (process.argv[1]?.endsWith("replay-cortex-conversation.ts")) main();
