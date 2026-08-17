import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  WarRoomDiscoveryRun,
  WarRoomProbeReading,
  WarRoomScanCost,
} from "@/lib/war-room/types";

/**
 * The founder-facing half of the investigation loop.
 *
 * War Room spends most of its compute deciding that nothing is decision-ready,
 * which is correct and also means the interruption gate is not where its value
 * lives. The value is the probe answers: bounded, read-only measurements of the
 * business that nobody had that morning. `probes.server.ts` writes them to the
 * investigation event trail so the *next scan* can reason over them. This module
 * reads the same rows so a *person* can.
 *
 * Nothing here re-measures anything. A brief is only ever as fresh as the last
 * scan, and it says so.
 */

const PROBE_LABELS: Record<string, { label: string; question: string }> = {
  question_to_claim_conversion: {
    label: "Question to claim",
    question: "Does question volume on a page actually pull that provider into claiming?",
  },
  question_inventory_health: {
    label: "Question inventory",
    question: "Is the question inventory usable as provider-acquisition demand?",
  },
  provider_contactability: {
    label: "Provider reachability",
    question: "Can Olera reach the providers holding unanswered questions?",
  },
  traffic_by_page_family: {
    label: "Organic traffic",
    question: "Which page family gained or lost organic reach?",
  },
  revenue_by_product: {
    label: "Revenue",
    question: "Where does the Ad Boost funnel stop?",
  },
  support_backlog_composition: {
    label: "Support backlog",
    question: "What is actually in the support backlog?",
  },
};

function humanizeProbeId(probeId: string) {
  return probeId.replace(/_/g, " ").replace(/^./, (character) => character.toUpperCase());
}

function readRows(value: unknown): Array<Record<string, string | number>> {
  if (!Array.isArray(value)) return [];
  const rows: Array<Record<string, string | number>> = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
    const row: Record<string, string | number> = {};
    for (const [key, cell] of Object.entries(entry as Record<string, unknown>)) {
      if (typeof cell === "string" || typeof cell === "number") row[key] = cell;
    }
    if (Object.keys(row).length) rows.push(row);
  }
  return rows.slice(0, 12);
}

/**
 * Latest answer per probe, newest first.
 *
 * Deduplicated by probe id: the same probe re-run tomorrow supersedes today's
 * answer rather than stacking beside it, so the brief stays a current reading of
 * the business instead of a log.
 */
export async function loadWarRoomBriefing(db: SupabaseClient): Promise<WarRoomProbeReading[]> {
  const { data, error } = await db.from("war_room_investigation_events")
    .select("details, created_at")
    .eq("event_type", "probe_completed")
    .order("created_at", { ascending: false })
    .limit(60);
  // A brief is a bonus surface on a page that must still load. A missing
  // migration 179 should cost the reader the brief, not the dashboard.
  if (error) return [];

  const seen = new Set<string>();
  const readings: WarRoomProbeReading[] = [];
  for (const row of (data ?? []) as Array<{ details: Record<string, unknown> | null; created_at: string }>) {
    const details = row.details ?? {};
    const probeId = typeof details.probe_id === "string" ? details.probe_id : null;
    const headline = typeof details.headline === "string" ? details.headline : null;
    if (!probeId || !headline || probeId === "none" || seen.has(probeId)) continue;
    seen.add(probeId);
    const known = PROBE_LABELS[probeId];
    readings.push({
      probeId,
      label: known?.label ?? humanizeProbeId(probeId),
      question: known?.question ?? "",
      headline,
      detail: typeof details.detail === "string" ? details.detail : "",
      rows: readRows(details.rows),
      caveat: typeof details.caveat === "string" && details.caveat ? details.caveat : null,
      measuredAt: typeof details.measured_at === "string" ? details.measured_at : row.created_at,
    });
  }
  return readings;
}

/**
 * Published list price per million tokens.
 *
 * Deliberately a small table rather than a live lookup: an unknown model
 * reports its token counts with a null price instead of guessing a number the
 * founder might act on.
 */
const MODEL_PRICE_PER_MTOK: Record<string, { input: number; output: number }> = {
  "claude-opus-5": { input: 5, output: 25 },
  "claude-opus-4-8": { input: 5, output: 25 },
  "claude-sonnet-5": { input: 3, output: 15 },
  "claude-haiku-4-5": { input: 1, output: 5 },
};

/**
 * What the last scan cost.
 *
 * The run row already records tokens; nothing here measures anything new. This
 * only prices them, because a daily cron that buys a full reasoning pass should
 * not be an unknown number on the founder's own dashboard.
 */
export function warRoomScanCost(run: WarRoomDiscoveryRun | null): WarRoomScanCost | null {
  if (!run) return null;
  const inputTokens = run.input_tokens ?? 0;
  const outputTokens = run.output_tokens ?? 0;
  if (!inputTokens && !outputTokens) return null;
  const price = MODEL_PRICE_PER_MTOK[run.model];
  return {
    model: run.model,
    inputTokens,
    outputTokens,
    usd: price
      ? (inputTokens * price.input + outputTokens * price.output) / 1_000_000
      : null,
  };
}
