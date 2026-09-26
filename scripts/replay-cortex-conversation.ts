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
 *   npx tsx scripts/replay-cortex-conversation.ts --fixture sep26
 */
import fs from "node:fs";
import path from "node:path";

const FIXTURES: Record<string, string[]> = {
  // 2026-09-24: two dense paragraphs of methodology, then a paragraph on why not.
  sep24: [
    "How’s organic traffic looking lately?",
    "How about this week versus last week versus the week before?",
  ],
  // 2026-09-26: "I could not put an answer together", then an answer claiming
  // no published-profile system existed.
  sep26: [
    `People are asking for questions in your area. That's smart. I was actually thinking about the process when care seekers, after making a connection, opt to make their care needs public in that city. We have a system for this: published profiles. Look into this to get a deeper sense.\n\nI think we have two ideas:\n1. Some type of email: "People are searching for care in your area. People asking questions in the area"\n2. Care seekers are looking for care professionals in your area\n\n\nSomething like that. What are your thoughts? `,
  ],
};
const FIXTURE = FIXTURES.sep24;

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
  // --fixture sep26 picks a saved exchange; other arguments are questions.
  const args = process.argv.slice(2);
  const fixtureAt = args.indexOf("--fixture");
  const named = fixtureAt >= 0 ? FIXTURES[args[fixtureAt + 1] ?? ""] : null;
  const custom = fixtureAt >= 0 ? [] : args;
  const questions = named ?? (custom.length ? custom : FIXTURE);
  let prior: { question: string; answer: string; focusInvestigationId: null; at: string } | null = null;
  for (const question of questions) {
    const { reply } = await answerFounderQuestion(db, question, null, prior);
    const problems = voiceProblems(reply);
    console.log(`> ${question}\n${reply}\n[voice: ${problems.length ? problems.join("; ") : "ok"}]\n`);
    if (!custom.length) prior = { question, answer: reply, focusInvestigationId: null, at: new Date().toISOString() };
  }
}

if (process.argv[1]?.endsWith("replay-cortex-conversation.ts")) main();
