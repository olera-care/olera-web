/**
 * Run Cortex's ten-lens sweep on today's data, on any model, writing nothing.
 *
 * The cheap way to tinker: Sonnet 5 costs about $0.26 a sweep against Opus's
 * $0.68, and nothing reaches the War Room tables, the brief or Slack. Pass
 * several models to compare them. Haiku cannot run the sweep: the API rejects
 * its strict tool schema as too large to compile.
 *
 *   npx tsx scripts/cortex-dev-sweep.ts                      # Sonnet 5
 *   npx tsx scripts/cortex-dev-sweep.ts claude-sonnet-5 claude-opus-5
 *   npx tsx scripts/cortex-dev-sweep.ts --json out.json claude-sonnet-5
 */
import fs from "node:fs";
import path from "node:path";
import { readOnly } from "./replay-cortex-conversation";

const PRICE: Record<string, { input: number; output: number }> = {
  "claude-opus-5": { input: 5, output: 25 },
  "claude-sonnet-5": { input: 2, output: 10 },
  "claude-haiku-4-5": { input: 1, output: 5 },
  "claude-haiku-4-5-20251001": { input: 1, output: 5 },
};

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
  const args = process.argv.slice(2);
  let jsonPath: string | null = null;
  const models: string[] = [];
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === "--json") jsonPath = args[++i] ?? null;
    else models.push(args[i]);
  }
  if (!models.length) models.push("claude-sonnet-5");

  const { createClient } = await import("@supabase/supabase-js");
  const { devSweepWarRoomLenses } = await import("../lib/war-room/discovery.server");
  const db = readOnly(createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!));

  const results: Record<string, unknown> = {};
  for (const [index, model] of models.entries()) {
    // Keyed by position too, so the same model twice keeps both runs.
    const key = `${index + 1}:${model}`;
    const started = Date.now();
    // One model failing must not lose the others: Haiku, for one, cannot
    // compile the sweep's strict tool schema at all.
    const sweep = await devSweepWarRoomLenses(db, model).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`\n== ${model}: FAILED ${message.slice(0, 200)}`);
      results[key] = { error: message };
      return null;
    });
    if (!sweep) continue;
    const price = PRICE[model];
    const usd = price ? (sweep.inputTokens * price.input + sweep.outputTokens * price.output) / 1_000_000 : null;
    console.log(`\n== ${model}: ${sweep.inputTokens} in / ${sweep.outputTokens} out, ${usd != null ? `$${usd.toFixed(3)}` : "unpriced"}, ${Math.round((Date.now() - started) / 1000)}s`);
    for (const review of sweep.lensReviews) {
      console.log(`${review.domain.padEnd(22)} ${String(review.status).padEnd(12)} ${String(review.impact ?? "").padEnd(6)} ${review.title}`);
    }
    results[key] = { usd, ...sweep };
    if (jsonPath) fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));
  }
}

main();
