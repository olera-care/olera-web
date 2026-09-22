import type { SupabaseClient } from "@supabase/supabase-js";
import { detectMaterialChange } from "@/lib/war-room/change-check.server";

/**
 * "scan" typed into the founder's Slack DM.
 *
 * Deliberately a keyword in the existing DM rather than a slash command. A
 * slash command needs a manifest edit, and saving the Slack manifest resets
 * Event Subscriptions URL verification -- which is what broke the reply loop
 * once already. This path needs no Slack configuration change at all.
 *
 * The bare word runs the change check first and usually answers instantly for
 * nothing. `scan force` skips the check, for when he knows something moved that
 * the check cannot see: a conversation, a meeting, something he was told.
 */
export type ScanCommand = { kind: "scan"; force: boolean };

export function parseScanCommand(text: string): ScanCommand | null {
  const body = text.trim().toLowerCase().replace(/^\//, "");
  if (body === "scan" || body === "scan now") return { kind: "scan", force: false };
  if (body === "scan force" || body === "force scan") return { kind: "scan", force: true };
  return null;
}

/** Wrapped so a Slack-facing reply never contains a raw stack trace. */
function plural(n: number, one: string, many: string) {
  return n === 1 ? one : many;
}

export function describeUnchanged(lastScanAt: string): string {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(lastScanAt).getTime()) / 60_000));
  const hours = Math.floor(minutes / 60);
  const ago = hours >= 1
    ? `${hours} ${plural(hours, "hour", "hours")} ago`
    : `${minutes} ${plural(minutes, "minute", "minutes")} ago`;
  return [
    `Nothing material has moved since the last scan, ${ago}.`,
    "No founder answer, no proposal decision, no campaign change.",
    "I have not spent anything. Reply `scan force` if you know something changed that I cannot see.",
  ].join("\n");
}

export type ScanCommandResult = {
  handled: true;
  started: boolean;
  reply: string;
  runId?: string;
  reused?: boolean;
};

/**
 * Runs the command and returns the text to send back. Does not send it: the
 * caller owns the Slack round trip, because Slack retries any request it does
 * not see answered within three seconds and the reply must go out on the same
 * short path.
 */
export async function runScanCommand(
  db: SupabaseClient,
  command: ScanCommand,
): Promise<ScanCommandResult> {
  if (!command.force) {
    const change = await detectMaterialChange(db);
    if (!change.changed && change.lastScanAt) {
      return { handled: true, started: false, reply: describeUnchanged(change.lastScanAt) };
    }
  }

  const { queueWarRoomDiscovery, failWarRoomDiscovery } = await import("@/lib/war-room/discovery.server");
  const { warRoomDiscoveryWorkflow } = await import("@/workflows/war-room-discovery");
  const { start } = await import("workflow/api");

  const queued = await queueWarRoomDiscovery(db, "manual", "slack:founder");
  // A scan is already in flight. Saying so is the honest answer, and it is also
  // what stops a double-tap -- or a Slack retry -- from paying twice.
  if (queued.reused) {
    return {
      handled: true,
      started: false,
      runId: queued.run.id,
      reused: true,
      reply: "A scan is already running. The brief will land here when it finishes.",
    };
  }

  try {
    await start(warRoomDiscoveryWorkflow, [queued.run.id]);
  } catch (error) {
    await failWarRoomDiscovery(
      queued.run.id,
      error instanceof Error ? error.message : "Durable workflow could not start",
    );
    return { handled: true, started: false, runId: queued.run.id, reply: "The scan could not start. Nothing was spent." };
  }

  return {
    handled: true,
    started: true,
    runId: queued.run.id,
    reply: "Scanning. This takes a few minutes and the brief lands here when it is done.",
  };
}
