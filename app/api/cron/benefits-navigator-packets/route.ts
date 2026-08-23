import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";
import { withCronRun } from "@/lib/crons/run";
import { getSiteUrl } from "@/lib/site-url";
import { sendSlackAlert } from "@/lib/slack";
import { readBenefitsNavigator } from "@/lib/family-comms/benefits-navigator.server";
import { packetNeedsBuild, type PacketRoute } from "@/lib/benefits/navigator-packet";
import { buildNavigatorPacket } from "@/lib/benefits/navigator-packet.server";

/**
 * GET /api/cron/benefits-navigator-packets
 *
 * Builds the routing verdict for pending first-step letters, replacing the
 * manual copy-paste review loop: export the prompt, paste into one AI, paste
 * the report into another, apply, re-check, send. Nine hops, six of them
 * human, and the queue grew faster than one person could clear it — 130
 * letters waiting, median intake 69 days.
 *
 * This route NEVER SENDS ANYTHING. It reads each pending draft, runs the
 * gates (facts, fit by two independent models, honesty rails, program
 * clearance, draft lint), and writes the verdict back onto the draft. The
 * admin queue then explains itself, and a letter can be released on its own
 * gates instead of waiting for its whole batch.
 *
 * Why a cron and not the compose path: the gates are several model calls and
 * take tens of seconds. Composition already runs inside the coordinator's
 * budget, and adding this to it would starve the rungs after it.
 *
 * Rebuild is driven by the LETTER CHANGING, never by the clock. Fit verdicts
 * vary run to run, so a scheduled rebuild would silently reroute letters
 * nobody touched.
 */

export const maxDuration = 300;

/**
 * Packets per run. Each is up to three model calls, so this is a wall-clock
 * budget, not a throughput knob — the 300s ceiling is the real constraint.
 * A backlog drains over consecutive runs, which is fine: nothing here is
 * time-critical, and every letter is already waiting on a human today.
 */
const MAX_PER_RUN = 12;

/** Stop starting new packets past this, so the run finishes what it began. */
const TIME_GUARD_MS = 210_000;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const querySecret = request.nextUrl.searchParams.get("secret");
  const isAuthed =
    authHeader === `Bearer ${process.env.CRON_SECRET}` || querySecret === process.env.CRON_SECRET;
  if (!isAuthed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const dryRun = request.nextUrl.searchParams.get("dry_run") === "true";

  return withCronRun("benefits-navigator-packets", async () => {
    const db = getServiceClient();
    const startedAt = Date.now();

    const { data: pending, error } = await db
      .from("business_profiles")
      .select("id, email, state, care_types, metadata")
      .eq("type", "family")
      .eq("metadata->benefits_navigator->>status", "pending")
      .limit(500);
    if (error) throw error;

    const due = (pending ?? []).filter((row) =>
      packetNeedsBuild(readBenefitsNavigator(row.metadata as Record<string, unknown>)),
    );

    const counts = {
      pending: pending?.length ?? 0,
      due: due.length,
      built: 0,
      failed: 0,
      ask: 0,
      recompose: 0,
      review: 0,
      auto: 0,
    };
    if (dryRun) return counts;

    for (const row of due.slice(0, MAX_PER_RUN)) {
      if (Date.now() - startedAt > TIME_GUARD_MS) break;

      try {
        const nav = readBenefitsNavigator(row.metadata as Record<string, unknown>);
        const packet = await buildNavigatorPacket(
          {
            care_types: row.care_types as string[] | null,
            state: row.state as string | null,
            metadata: row.metadata as Record<string, unknown> | null,
          },
          nav,
        );

        // Building takes tens of seconds, so the row we loaded is stale by
        // now: TJ may have edited, scheduled, sent or dismissed the draft
        // mid-flight. Re-read and merge into FRESH metadata, and drop the
        // packet entirely if the draft stopped being pending — writing a
        // verdict onto a sent letter would resurrect it in the queue.
        const { data: fresh } = await db
          .from("business_profiles")
          .select("metadata")
          .eq("id", row.id)
          .maybeSingle();
        const freshMeta = (fresh?.metadata as Record<string, unknown> | null) ?? {};
        const freshNav = readBenefitsNavigator(freshMeta);
        if (freshNav.status !== "pending") continue;
        // Edited or recomposed during the build: the verdict describes text
        // that no longer exists. Leave it for the next run rather than
        // storing a judgment of a letter nobody will ever send.
        if (
          freshNav.edited_at !== nav.edited_at ||
          freshNav.recomposed_at !== nav.recomposed_at
        ) {
          continue;
        }

        await db
          .from("business_profiles")
          .update({
            metadata: { ...freshMeta, benefits_navigator: { ...freshNav, packet } },
          })
          .eq("id", row.id);

        counts.built++;
        counts[packet.route as PacketRoute]++;
      } catch (err) {
        counts.failed++;
        console.error("[benefits-navigator-packets] build failed:", row.id, err);
      }
    }

    // Only ping when something needs a person. A quiet run is the normal
    // case and does not deserve a notification.
    if (counts.recompose > 0 || counts.ask > 0 || counts.failed > 0) {
      try {
        const parts: string[] = [];
        if (counts.ask > 0) parts.push(`❓ ${counts.ask} need a question, not a program`);
        if (counts.recompose > 0) parts.push(`♻️ ${counts.recompose} picked a program the family's facts rule out`);
        if (counts.review > 0) parts.push(`👀 ${counts.review} waiting on your read`);
        if (counts.auto > 0) parts.push(`✅ ${counts.auto} clean`);
        if (counts.failed > 0) parts.push(`⚠️ ${counts.failed} failed to build`);
        await sendSlackAlert(`${parts.join(" · ")} → ${getSiteUrl()}/admin/benefits`);
      } catch (err) {
        console.error("[benefits-navigator-packets] Slack ping failed:", err);
      }
    }

    return counts;
  });
}
