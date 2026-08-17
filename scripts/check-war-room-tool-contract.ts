/**
 * Live War Room tool-contract check.
 *
 * Anthropic compiles every `strict` tool schema into a decoding grammar and
 * rejects the request outright when that grammar exceeds an internal budget.
 * That budget is not documented, not derivable from the schema, and not
 * detectable by any static check — a schema can be small, valid, and still be
 * refused before inference begins. The only way to know is to ask the provider.
 *
 * This exercises the exact production tool objects against the exact production
 * model, with synthetic input and `max_tokens: 1`, so a contract regression is
 * caught here instead of during a real scan. It reads and writes no Olera
 * business state and starts no discovery run.
 *
 * Deliberately separate from `check:war-room` and `check:war-room:replay`:
 * those are deterministic and offline, this one costs a network call and an API
 * key. Run it whenever a War Room tool schema changes.
 *
 *   npm run check:war-room:contract
 */
import Anthropic from "@anthropic-ai/sdk";
import {
  WAR_ROOM_DISCOVERY_MODEL,
  WAR_ROOM_STRICT_TOOLS,
  describeProviderFailure,
} from "../lib/war-room/discovery.server";

// A first compile of an unseen schema can take well over a minute; the provider
// caches it afterwards. Allow for the cold path rather than reporting a slow
// compile as a contract failure.
const TIMEOUT_MS = 300_000;

async function checkTool(anthropic: Anthropic, tool: Anthropic.Messages.Tool) {
  const started = Date.now();
  try {
    await anthropic.messages.create({
      model: WAR_ROOM_DISCOVERY_MODEL,
      max_tokens: 1,
      tools: [tool],
      tool_choice: { type: "tool", name: tool.name },
      messages: [{
        role: "user",
        content: "Synthetic contract check. Do not analyze any company; this input is fabricated.",
      }],
    }, { maxRetries: 0, timeout: TIMEOUT_MS });
    const seconds = ((Date.now() - started) / 1_000).toFixed(1);
    console.log(`  ok    ${tool.name} (${seconds}s)`);
    return null;
  } catch (error) {
    const diagnostic = describeProviderFailure(error, { stage: "contract_check", tool: tool.name });
    const seconds = ((Date.now() - started) / 1_000).toFixed(1);
    console.error(`  FAIL  ${tool.name} (${seconds}s)`);
    console.error(`        category:   ${diagnostic.category}`);
    console.error(`        status:     ${diagnostic.status ?? "none"}`);
    console.error(`        request id: ${diagnostic.requestId ?? "none"}`);
    console.error(`        provider:   ${diagnostic.detail}`);
    return diagnostic;
  }
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY is not set. This check must reach the real provider to mean anything.");
    process.exit(1);
  }
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  console.log(`War Room tool contract against ${WAR_ROOM_DISCOVERY_MODEL}:`);

  const failures = [];
  for (const tool of WAR_ROOM_STRICT_TOOLS) {
    const failure = await checkTool(anthropic, tool as Anthropic.Messages.Tool);
    if (failure) failures.push(failure);
  }

  if (failures.length) {
    console.error(
      `\n${failures.length} of ${WAR_ROOM_STRICT_TOOLS.length} War Room tool contracts were rejected by the provider.`,
    );
    if (failures.some((failure) => failure.category === "tool_schema_grammar_limit")) {
      console.error(
        "A grammar-limit rejection means the schema is too large to compile. Split the call or\n"
        + "move properties out of the object graph; shrinking strings or dropping maxLength/pattern\n"
        + "will not help, and neither will nesting the same properties more deeply.",
      );
    }
    process.exit(1);
  }

  console.log(`\nAll ${WAR_ROOM_STRICT_TOOLS.length} War Room tool contracts compiled and were accepted.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
