import type { SupabaseClient } from "@supabase/supabase-js";
import { sendSlackAlert, sendSlackDirectMessage } from "@/lib/slack";
import { getSiteUrl } from "@/lib/site-url";
import { loadWarRoomBriefing, warRoomScanCost } from "@/lib/war-room/briefing.server";
import { pickQuestionForFounder, recordFounderAsk, type FounderQuestion } from "@/lib/war-room/founder-loop.server";
import type { WarRoomDiscoveryRun, WarRoomProbeReading } from "@/lib/war-room/types";

/**
 * The mouth.
 *
 * War Room had none. It wrote a correct, specific company read every morning to
 * `/admin/war-room`, a page nobody opens, and there was no Slack, email or SMS
 * path anywhere in the module. The founder's stated problem was "I get busy,
 * overwhelmed, distracted, or simply forget", and the answer to it required him
 * to remember to visit a page.
 *
 * Two rules shape everything below.
 *
 * **A failed scan is reported as loudly as a successful one.** On 2026-09-20 the
 * 10:30 run died at the dossier step and nobody knew for six hours, because the
 * only way to find out was to query the table. It was the fourth failure of that
 * exact kind and the gaps are closing (13, 11, then 9 days). A brief that only
 * speaks on success is a nicer-looking version of the silence it replaces.
 *
 * **Delivery never fails the scan.** A Slack outage must not turn a completed
 * company read into a failed run.
 */

const DELIVERY_STATE_KEY = "brief_delivery";

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

/** Slack renders a single asterisk as bold and needs `<url|label>` for links. */
function link(siteUrl: string, path: string, label: string) {
  return `<${siteUrl}${path}|${label}>`;
}

function readingLine(reading: WarRoomProbeReading, scanDate: string) {
  const measured = shortDate(reading.measuredAt);
  // Each reading states when it was measured. loadWarRoomBriefing returns the
  // latest answer per probe across all scans, so a probe that did not run today
  // still appears. Dating it is what stops a stale answer reading as today's.
  const age = measured === scanDate ? "" : ` _(measured ${measured})_`;
  return `• *${reading.label}* ${reading.headline}${age}`;
}

type ProposalRow = { title: string; why_now: string; decision_required: string };
type InvestigationRow = { status: string };

/**
 * Pure: takes already-fetched data and returns the Slack text.
 *
 * Split out from the delivery path so the exact message can be rendered offline
 * against a real run before it is ever sent to a human. A brief nobody has read
 * in its final form is a brief nobody has reviewed.
 */
export function buildWarRoomBriefText(input: {
  run: Pick<WarRoomDiscoveryRun, "status" | "created_at" | "error_message" | "source_summary">;
  siteUrl: string;
  readings: WarRoomProbeReading[];
  proposals: ProposalRow[];
  open: number;
  watching: number;
  costUsd: number | null;
  question?: FounderQuestion | null;
}): string {
  const { run, siteUrl } = input;
  const date = shortDate(run.created_at);
  const href = link(siteUrl, "/admin/war-room", "War Room");

  if (run.status === "failed") {
    const failure = (run.source_summary?.failure ?? {}) as { stage?: string; detail?: string };
    return [
      `:rotating_light: *War Room scan failed, ${date}*`,
      failure.stage ? `Stage: ${failure.stage}` : null,
      failure.detail || run.error_message || "No failure detail recorded.",
      "",
      `There is no company read for today. ${href}`,
    ].filter(Boolean).join("\n");
  }

  // Lead with what was measured, not with what did not clear the gate. Zero
  // proposals is the designed outcome on most days; a brief that opens on it
  // reads as failure every morning.
  const lines: string[] = [`*War Room, ${date}* ${href}`];

  if (input.readings.length) {
    lines.push("", "*Today's read*");
    lines.push(...input.readings.slice(0, 6).map((reading) => readingLine(reading, date)));
  } else {
    lines.push("", "No probe answers landed in this scan.");
  }

  if (input.proposals.length) {
    lines.push("", "*Decision ready*");
    for (const proposal of input.proposals) {
      lines.push(`*${proposal.title}*`, proposal.why_now || proposal.decision_required);
    }
  } else {
    lines.push("", `No founder decision is ready. ${input.open} case${input.open === 1 ? "" : "s"} open, ${input.watching} watching.`);
  }

  // One question, never a list. This system's whole design is that it spends
  // its compute removing work before the founder sees it, and a brief ending in
  // six questions is a brief that gets none of them answered. Replying in the
  // DM is what makes the answer evidence on the next scan.
  if (input.question) {
    lines.push("", "*One thing only you can answer*");
    lines.push(input.question.question);
    lines.push("_Just reply here. Your answer becomes evidence on tomorrow's scan._");
  }

  lines.push("", input.costUsd != null ? `_Scan ${input.costUsd.toFixed(2)}._` : "_Scan cost unknown._");
  return lines.join("\n");
}

export async function deliverWarRoomBrief(
  db: SupabaseClient,
  runId: string,
): Promise<{ delivered: boolean; reason?: string; channel?: "dm" | "webhook"; dmError?: string | null }> {
  try {
    // Durable steps retry. Without this guard a retried step sends the founder
    // the same brief twice, which is exactly the kind of noise that trains
    // someone to stop reading a channel.
    const { data: state } = await db.from("war_room_source_state")
      .select("metadata")
      .eq("source_key", DELIVERY_STATE_KEY)
      .maybeSingle();
    if ((state?.metadata as { run_id?: string } | null)?.run_id === runId) {
      return { delivered: false, reason: "already delivered for this run" };
    }

    const { data: runRow } = await db.from("war_room_discovery_runs")
      .select("*")
      .eq("id", runId)
      .maybeSingle();
    if (!runRow) return { delivered: false, reason: "run not found" };
    const run = runRow as WarRoomDiscoveryRun;
    let readings: WarRoomProbeReading[] = [];
    let proposals: ProposalRow[] = [];
    let open = 0;
    let watching = 0;
    let question: FounderQuestion | null = null;
    if (run.status !== "failed") {
      // Never ask on a failed scan. There is no fresh read behind the question,
      // and the only useful message on a failure is that it failed.
      question = await pickQuestionForFounder(db).catch(() => null);
      const [readingResult, proposalResult, investigationResult] = await Promise.all([
        loadWarRoomBriefing(db),
        db.from("war_room_proposals")
          .select("title, why_now, decision_required")
          .eq("discovery_run_id", runId)
          .eq("status", "proposed"),
        db.from("war_room_investigations").select("status"),
      ]);
      readings = readingResult;
      proposals = (proposalResult.data ?? []) as ProposalRow[];
      const investigations = (investigationResult.data ?? []) as InvestigationRow[];
      open = investigations.filter((row) => row.status === "investigating").length;
      watching = investigations.filter((row) => row.status === "watchlist").length;
    }

    const text = buildWarRoomBriefText({
      run,
      siteUrl: getSiteUrl(),
      readings,
      proposals,
      open,
      watching,
      costUsd: warRoomScanCost(run)?.usd ?? null,
      question,
    });

    // Prefer a DM. The shared webhook posts to the operations channel, where
    // this would arrive among lead alerts, claim notifications and QA events —
    // delivered, and easy to skim past, which is most of the problem it exists
    // to solve.
    //
    // The webhook stays as the fallback because the DM depends on a scope that
    // may never be granted: SLACK_BOT_TOKEN is read-only today, so
    // chat.postMessage returns missing_scope until chat:write is added and the
    // app reinstalled. A brief in the wrong place beats no brief.
    const dmUserId = process.env.WAR_ROOM_BRIEF_SLACK_USER_ID?.trim();
    let channel: "dm" | "webhook" = "webhook";
    let dmError: string | null = null;

    let result: { success: boolean; error?: string } = { success: false, error: "not attempted" };
    if (dmUserId) {
      result = await sendSlackDirectMessage(dmUserId, text);
      if (result.success) channel = "dm";
      else dmError = result.error ?? "DM failed";
    }
    if (!result.success) result = await sendSlackAlert(text);
    if (!result.success) return { delivered: false, reason: result.error ?? "Slack send failed" };

    // Only after the message is out. Recording an ask nobody received would
    // leave an open question that can never be answered, and the next reply
    // would attach to it instead of to the real one.
    if (question) await recordFounderAsk(db, question, runId).catch(() => false);

    await db.from("war_room_source_state").upsert({
      source_key: DELIVERY_STATE_KEY,
      last_synced_at: new Date().toISOString(),
      last_success_at: new Date().toISOString(),
      last_error: null,
      // Which path actually carried it. Without this a missing chat:write
      // scope looks identical to a successful DM from the outside.
      metadata: { run_id: runId, status: run.status, channel, dm_error: dmError },
      updated_at: new Date().toISOString(),
    }, { onConflict: "source_key" }).then(() => undefined, () => undefined);

    return { delivered: true, channel, dmError };
  } catch (error) {
    // A scan that produced a real company read must not be recorded as failed
    // because a webhook was down.
    return { delivered: false, reason: error instanceof Error ? error.message : "brief delivery failed" };
  }
}
