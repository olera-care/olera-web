/**
 * Build a navigator packet for every pending draft and report the routing.
 *
 * Usage:
 *   npx tsx scripts/check-navigator-packets.ts            # every pending draft
 *   npx tsx scripts/check-navigator-packets.ts --limit=20 # a sample
 *   npx tsx scripts/check-navigator-packets.ts --dry      # facts + lint only, no model calls
 *
 * This is the guard for lib/benefits/navigator-packet.ts. It exists because
 * the routing rules were derived from one ad-hoc audit of the live queue on
 * 2026-08-23 (ask 63 · recompose 9 · review 54 · auto 4), and a rule set
 * derived from data should be re-runnable against that data. A large swing in
 * the distribution after a code change is the signal to look, not a pass/fail.
 *
 * Needs a checkout with node_modules and .env.local — a bare worktree has
 * neither. See memory `reference_worktree_node_modules_symlink`.
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { buildNavigatorPacket, draftLintHits } from "../lib/benefits/navigator-packet.server";
import {
  routePacket,
  type NavigatorPacket,
  type PacketRoute,
} from "../lib/benefits/navigator-packet";
import { factsFromProfile } from "../lib/benefits/navigator-gates.server";
import { readBenefitsNavigator } from "../lib/family-comms/benefits-navigator.server";

config({ path: ".env.local" });

const args = process.argv.slice(2);
const DRY = args.includes("--dry");
const LIMIT = Number(args.find((a) => a.startsWith("--limit="))?.split("=")[1] ?? 0);
/** Model calls are per-letter and the queue is >100; keep the fan-out civil. */
const CONCURRENCY = 6;

interface Row {
  id: string;
  email: string | null;
  state: string | null;
  care_types: string[] | null;
  metadata: Record<string, unknown> | null;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env missing — run from a checkout with .env.local");
  const db = createClient(url, key);

  const { data, error } = await db
    .from("business_profiles")
    .select("id, email, state, care_types, metadata")
    .eq("type", "family")
    .eq("metadata->benefits_navigator->>status", "pending")
    .limit(2000);
  if (error) throw error;

  const rows = ((data ?? []) as Row[]).slice(0, LIMIT || undefined);
  console.log(`${rows.length} pending drafts${DRY ? " (dry: no model calls)" : ""}\n`);

  const packets: { row: Row; packet: NavigatorPacket }[] = [];
  const queue = [...rows];
  let done = 0;

  async function worker() {
    while (queue.length) {
      const row = queue.shift()!;
      const nav = readBenefitsNavigator(row.metadata);
      let packet: NavigatorPacket;
      if (DRY) {
        // Facts + lint only. Everything model-backed reads as "never ran",
        // which the router holds — so a dry run can never show `auto`.
        const facts = factsFromProfile(row);
        const lint = draftLintHits(nav.edited_sms ?? nav.sms ?? null);
        const { route, holds } = routePacket({
          facts,
          fit: [],
          rails: [],
          clearance: null,
          lint,
          intakeAgeDays: null,
          statesDollarFigure: false,
        });
        packet = {
          version: 1,
          builtAt: new Date().toISOString(),
          facts,
          fit: [],
          rails: [],
          clearance: null,
          lint,
          intakeAgeDays: null,
          statesDollarFigure: false,
          route,
          holds,
          models: {},
        };
      } else {
        packet = await buildNavigatorPacket(row, nav);
      }
      packets.push({ row, packet });
      done++;
      if (done % 25 === 0) process.stderr.write(`  ${done}/${rows.length}\n`);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  const byRoute = packets.reduce<Record<string, number>>((acc, p) => {
    acc[p.packet.route] = (acc[p.packet.route] ?? 0) + 1;
    return acc;
  }, {});
  const order: PacketRoute[] = ["ask", "recompose", "review", "auto"];

  console.log("ROUTING");
  for (const r of order) console.log(`  ${r.padEnd(11)} ${String(byRoute[r] ?? 0).padStart(4)}`);

  // The `ask` bucket is the one judgment call in the router, so show what it
  // is actually made of. "Nothing at all" is unarguable; "screening facts but
  // no direction" is the population the threshold decides, and it is the
  // difference between asking ~63 families and asking ~92.
  const asks = packets.filter((p) => p.packet.route === "ask");
  const nothingAtAll = asks.filter((p) => p.packet.facts.screening.length === 0).length;
  console.log(
    `\nASK BUCKET  ${nothingAtAll} know-nothing · ${asks.length - nothingAtAll} have screening facts but no stated need`,
  );

  // Group by cause, not by the hold's rendered text — the strings carry
  // per-letter detail (day counts, quoted sentences) that would otherwise
  // give every letter its own histogram bucket.
  const holdCause = (h: string): string => {
    if (h.startsWith("intake was")) return "intake older than the stale threshold";
    if (h.startsWith("program verified")) return "program clearance stale";
    if (h.startsWith("program never verified")) return "program never verified";
    if (h.startsWith("program lint HIGH")) return "program carries a HIGH lint finding";
    if (h.startsWith("no clearance record")) return "no clearance record";
    if (h.startsWith("fit questionable")) return "fit questionable";
    if (h.startsWith("models disagree")) return "models disagree on fit";
    if (h.startsWith("fit was never read")) return "fit was never read";
    if (h.startsWith("draft lint")) return `draft lint: ${h.split(":")[1]?.trim() ?? "?"}`;
    if (h.includes("rail:")) return `${h.split(" rail:")[0]} rail violation`;
    if (h.startsWith("letter states a dollar")) return "letter states a dollar figure";
    if (h.startsWith("stage failed")) return "a stage failed";
    return h.split(":")[0].trim();
  };
  const holdCounts: Record<string, number> = {};
  for (const { packet } of packets) {
    if (packet.route !== "review") continue;
    for (const h of packet.holds) {
      const key = holdCause(h);
      holdCounts[key] = (holdCounts[key] ?? 0) + 1;
    }
  }
  console.log("\nWHY THE REVIEW BUCKET IS HELD");
  for (const [k, v] of Object.entries(holdCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(v).padStart(4)}  ${k}`);
  }

  const wrong = packets.filter((p) => p.packet.route === "recompose");
  if (wrong.length) {
    console.log("\nRECOMPOSE — the pick is ruled out by the family's own facts");
    for (const { row, packet } of wrong) {
      const pick = readBenefitsNavigator(row.metadata).pick;
      console.log(`  ${pick?.stateId ?? "?"}/${pick?.programId ?? "?"}`);
      console.log(`     ${packet.holds[0]}`);
    }
  }

  // Only letters that got past the facts gate are judged on fit, so average
  // over those — dividing by the whole queue makes a healthy run look broken.
  const judged = packets.filter((p) => p.packet.route !== "ask");
  const split = judged.filter(
    (p) => p.packet.fit.length > 1 && new Set(p.packet.fit.map((f) => f.verdict)).size > 1,
  );
  const readsPerJudged = judged.length
    ? (judged.reduce((n, p) => n + p.packet.fit.length, 0) / judged.length).toFixed(2)
    : "0";
  console.log(`\nfit reads per judged letter: ${readsPerJudged} (of ${judged.length} judged)`);
  console.log(`models disagreed on fit: ${split.length}`);

  // The disagreement MATRIX, not just the count. good-vs-wrong means the two
  // models are seeing different letters; questionable-vs-wrong means they
  // agree the pick is bad and differ only on how bad. Those are completely
  // different signals and the count alone cannot tell them apart.
  const pairs: Record<string, number> = {};
  const perModel: Record<string, Record<string, number>> = {};
  for (const { packet } of judged) {
    for (const r of packet.fit) {
      perModel[r.model] = perModel[r.model] ?? {};
      perModel[r.model][r.verdict] = (perModel[r.model][r.verdict] ?? 0) + 1;
    }
    if (packet.fit.length < 2) continue;
    const key = packet.fit
      .map((f) => f.verdict)
      .sort()
      .join(" vs ");
    pairs[key] = (pairs[key] ?? 0) + 1;
  }
  if (Object.keys(pairs).length) {
    console.log("\nFIT VERDICT PAIRS");
    for (const [k, v] of Object.entries(pairs).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${String(v).padStart(3)}  ${k}`);
    }
  }
  if (Object.keys(perModel).length > 1) {
    console.log("\nPER-MODEL CALIBRATION");
    for (const [m, counts] of Object.entries(perModel)) {
      const line = ["good", "questionable", "wrong"]
        .map((v) => `${v} ${counts[v] ?? 0}`)
        .join(" · ");
      console.log(`  ${m.padEnd(16)} ${line}`);
    }
  }
  if (readsPerJudged === "1.00") {
    console.log("  note: one read per letter — set OPENAI_API_KEY for the second, independent read");
  }
  const errored = packets.filter((p) => p.packet.errors?.length);
  if (errored.length) console.log(`packets with a failed stage: ${errored.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
