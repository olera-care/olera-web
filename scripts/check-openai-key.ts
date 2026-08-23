/**
 * Verify OPENAI_API_KEY works for the navigator packet's fit gate.
 *
 * Usage:
 *   npx tsx scripts/check-openai-key.ts
 *
 * Makes ONE real call shaped exactly like the fit read, then reports whether
 * the key authenticates, whether the model id is valid, whether the model
 * honours the JSON response format the gate depends on, and what the call
 * actually cost. Never prints the key or any part of it.
 *
 * Run this before wiring the second fit read into anything: the gate degrades
 * silently to a single Claude read when the key is missing or wrong (by
 * design — a broken second opinion must not block letters), which means a bad
 * key looks exactly like no key at all from the outside.
 */
import { config } from "dotenv";
import { openAIFitBody, OPENAI_URL, FIT_MODEL_OPENAI } from "../lib/benefits/navigator-gates.server";

config({ path: ".env.local" });

/** Published rates for gpt-5.6-terra, 2026-08-23, per million tokens. */
const RATE_IN = 2.0;
const RATE_OUT = 12.0;
const MODEL = FIT_MODEL_OPENAI;

function mask(key: string): string {
  // Enough to tell two keys apart in a screenshot, not enough to use.
  return `${key.slice(0, 7)}…${key.slice(-4)} (${key.length} chars)`;
}

async function main() {
  const key = process.env.OPENAI_API_KEY;

  if (!key) {
    console.log("❌ OPENAI_API_KEY is not set.\n");
    console.log("   Add this line to ~/Desktop/olera-web/.env.local:");
    console.log("     OPENAI_API_KEY=sk-...\n");
    console.log("   Then run this script again.");
    process.exit(1);
  }
  console.log(`key found: ${mask(key)}`);
  if (!key.startsWith("sk-")) {
    console.log("⚠️  does not start with 'sk-' — check you copied the API key, not an org or project id");
  }

  // Post the EXACT body production posts, built by the production function.
  // A hand-written copy of it is how this guard passed while every real fit
  // call returned 400 on a parameter the copy did not send.
  const body = openAIFitBody({
    factsBlock: "- care types: memory care\n- age 82\n- Medicaid: doesNotHave",
    programName: "Low Income Home Energy Assistance Program (LIHEAP)",
    programSummary: "Helps low-income households pay heating and cooling bills.",
    eligibilitySummary: "Household income at or below the state threshold.",
    stateProgramNames: [
      "Medicaid Aged & Disabled Waiver",
      "Alzheimer's Respite Care",
      "Area Agency on Aging",
    ],
  });
  const started = Date.now();
  const res = await fetch(OPENAI_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const ms = Date.now() - started;

  if (!res.ok) {
    const text = await res.text();
    console.log(`\n❌ ${res.status} ${res.statusText}`);
    if (res.status === 401) console.log("   The key was rejected. Wrong key, revoked, or extra whitespace.");
    if (res.status === 404) console.log(`   Model "${MODEL}" not found for this account — it may need a different tier.`);
    if (res.status === 429) console.log("   Rate limited or out of credit. Check billing on the OpenAI dashboard.");
    console.log(`   ${text.slice(0, 400)}`);
    process.exit(1);
  }

  const payload = (await res.json()) as {
    model?: string;
    choices?: { message?: { content?: string } }[];
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };
  const content = payload.choices?.[0]?.message?.content ?? "";

  console.log(`\n✅ authenticated · ${ms}ms · served by ${payload.model ?? "(unreported)"}`);

  let parsed: { verdict?: string; why?: string } | null = null;
  try {
    parsed = JSON.parse(content);
  } catch {
    console.log("⚠️  response was not valid JSON — the fit gate would discard this read:");
    console.log(`   ${content.slice(0, 200)}`);
  }

  if (parsed) {
    const ok = ["good", "questionable", "wrong"].includes(String(parsed.verdict));
    console.log(`   verdict: ${parsed.verdict}${ok ? "" : "  ⚠️ not one of the three allowed values"}`);
    console.log(`   why:     ${parsed.why ?? "(none)"}`);
    // This scenario is deliberately absurd — energy help for a memory-care
    // family — so anything other than "wrong" means the prompt is not landing.
    if (parsed.verdict !== "wrong") {
      console.log("   ⚠️  expected 'wrong' here (energy assistance cannot answer a memory-care need).");
      console.log("      The key works, but check the fit prompt before trusting its judgments.");
    }
  }

  const pin = payload.usage?.prompt_tokens ?? 0;
  const pout = payload.usage?.completion_tokens ?? 0;
  const cost = (pin / 1e6) * RATE_IN + (pout / 1e6) * RATE_OUT;
  console.log(`\n   tokens: ${pin} in / ${pout} out`);
  console.log(`   cost:   $${cost.toFixed(5)} this call · ~$${(cost * 130).toFixed(2)} for a 130-letter queue`);
  console.log("\nReady. The fit gate will now run two independent reads per letter.");
}

main().catch((err) => {
  console.error("\n❌ request failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
