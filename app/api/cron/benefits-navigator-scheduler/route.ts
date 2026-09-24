import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";
import { withCronRun } from "@/lib/crons/run";
import { getSiteUrl } from "@/lib/site-url";
import { sendSlackAlert } from "@/lib/slack";
import { readBenefitsNavigator } from "@/lib/family-comms/benefits-navigator.server";
import {
  sendNavigatorLetter,
  markScheduleFailed,
} from "@/lib/family-comms/benefits-navigator-send.server";
import { runNavigatorAutopilot } from "@/lib/family-comms/benefits-navigator-autopilot.server";
import { sweepBenefitsHelpCases } from "@/lib/family-comms/benefits-help-cases.server";

/**
 * GET /api/cron/benefits-navigator-scheduler
 *
 * Fires navigator letters TJ scheduled from /admin/benefits. Hourly: a
 * scheduled time means "within the hour", which is what the UI promises.
 * Each due letter goes through the SAME send path as the manual button
 * (lib/family-comms/benefits-navigator-send.server.ts) — governance caps,
 * DNC, and suppression are re-checked at fire time, and the consent-gated
 * SMS companion respects the recipient's quiet hours. A companion to email
 * parks in sms_queue; a text-only B1 stays pending and is rescheduled to the
 * next legal window so queued is never mistaken for delivered.
 *
 * A blocked fire NEVER retries silently into the same cap: the schedule is
 * cleared, the reason is stamped on the draft (visible in the admin queue),
 * and Slack gets a ping. The draft stays pending for TJ to reschedule or
 * send by hand.
 *
 * Two more jobs ride this hourly slot (2026-09-24):
 *  - The navigator AUTOPILOT (lib/family-comms/benefits-navigator-autopilot.server.ts)
 *    sends letters whose verdict routed `auto` and recomposes stale or
 *    ruled-out ones. Before it, every send waited on TJ scheduling a batch,
 *    and the queue stalled at 140 after the last batch on Sep 14.
 *  - The HELP-CASE sweep (lib/family-comms/benefits-help-cases.server.ts)
 *    gives every "I'd like help" / STUCK an owner and a due time, and
 *    escalates once when it goes overdue.
 *
 * ?dry_run=true reports what all three would do and changes nothing.
 */

export const maxDuration = 300;

const MAX_SENDS_PER_RUN = 20;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const querySecret = request.nextUrl.searchParams.get("secret");
  const isAuthed =
    authHeader === `Bearer ${process.env.CRON_SECRET}` || querySecret === process.env.CRON_SECRET;
  if (!isAuthed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dryRun = request.nextUrl.searchParams.get("dry_run") === "true";

  return withCronRun("benefits-navigator-scheduler", async () => {
    const db = getServiceClient();
    const startedAt = Date.now();
    const nowIso = new Date(startedAt).toISOString();

    // ISO-8601 UTC strings compare lexicographically, so lte on the JSON
    // path is a correct due-time filter. Status must still be pending —
    // sent/dismissed drafts keep their history but never fire.
    const { data: due, error } = await db
      .from("business_profiles")
      .select("id, display_name, email")
      .eq("type", "family")
      .eq("metadata->benefits_navigator->>status", "pending")
      .not("metadata->benefits_navigator->>scheduled_at", "is", null)
      .lte("metadata->benefits_navigator->>scheduled_at", nowIso)
      .limit(MAX_SENDS_PER_RUN);
    if (error) throw error;

    const counts = { due: due?.length ?? 0, sent: 0, deferred: 0, blocked: 0 };
    const blockedLines: string[] = [];

    for (const row of dryRun ? [] : due ?? []) {
      // Re-read inside the send (it loads fresh) — but double-check the
      // schedule here too so a just-canceled schedule doesn't fire on a
      // stale list row.
      const { data: fresh } = await db
        .from("business_profiles")
        .select("metadata")
        .eq("id", row.id)
        .maybeSingle();
      const nav = readBenefitsNavigator(
        (fresh?.metadata as Record<string, unknown> | null) || {},
      );
      if (nav.status !== "pending" || !nav.scheduled_at || nav.scheduled_at > nowIso) continue;

      try {
        const result = await sendNavigatorLetter(db, { profileId: row.id, trigger: "scheduler" });
        if (result.ok) {
          if (result.deferred) counts.deferred++;
          else counts.sent++;
        } else {
          counts.blocked++;
          await markScheduleFailed(db, row.id, result.error);
          blockedLines.push(`${row.display_name || row.email || row.id}: ${result.error}`);
        }
      } catch (err) {
        // Transport-level failure (API down, timeout): keep the schedule so
        // the next hourly run retries — this is NOT a governance block.
        counts.blocked++;
        console.error("[benefits-navigator-scheduler] send threw:", row.id, err);
        blockedLines.push(`${row.display_name || row.email || row.id}: transport error (will retry)`);
      }
    }

    // ── Autopilot: `auto` letters send, stale / ruled-out letters recompose ──
    const autopilot = await runNavigatorAutopilot(db, { startedAt, dryRun });
    // ── Help cases: owner + due time for every "I'd like help" / STUCK ──
    const siteUrl = getSiteUrl();
    const help = await sweepBenefitsHelpCases(db, { dryRun, siteUrl });

    if (dryRun) {
      return { dry_run: true, scheduled: counts, autopilot: autopilot.counts, help };
    }

    if (help.lines.length > 0) {
      // Loud and separate from the send summary: a family asked for a person.
      try {
        await sendSlackAlert(
          `${help.lines.join("\n")}\nOpen the case, then log "I contacted them": ${siteUrl}/admin/benefits`,
        );
      } catch (err) {
        console.error("[benefits-navigator-scheduler] help-case Slack ping failed:", err);
      }
    }

    const a = autopilot.counts;
    if (a.sent > 0 || a.deferred > 0 || a.recomposed > 0 || autopilot.blockedLines.length > 0) {
      try {
        const parts: string[] = [];
        if (a.sent > 0) {
          const byProgram = new Map<string, number>();
          for (const p of autopilot.sentLines) byProgram.set(p, (byProgram.get(p) ?? 0) + 1);
          parts.push(
            `🤖 ${a.sent} first-step letter${a.sent === 1 ? "" : "s"} sent automatically (verdict clean): ${[...byProgram].map(([p, n]) => (n > 1 ? `${p} ×${n}` : p)).join(", ")}`,
          );
        }
        if (a.deferred > 0)
          parts.push(`🌙 ${a.deferred} text-only letter${a.deferred === 1 ? "" : "s"} moved to the family's morning`);
        if (a.recomposed > 0)
          parts.push(`♻️ ${a.recomposed} recomposed for a fresh verdict: ${autopilot.recomposeLines.join("; ")}`);
        if (autopilot.blockedLines.length > 0)
          parts.push(`⚠️ ${autopilot.blockedLines.length} need a person: ${autopilot.blockedLines.join("; ")}`);
        const waiting = a.sendable - a.sent - a.deferred - a.blocked - a.retry_later;
        if (waiting > 0) parts.push(`${waiting} more clean letter${waiting === 1 ? "" : "s"} queued for the next run`);
        await sendSlackAlert(`${parts.join(" · ")} → ${siteUrl}/admin/benefits`);
      } catch (err) {
        console.error("[benefits-navigator-scheduler] autopilot Slack ping failed:", err);
      }
    }

    if (counts.sent > 0 || counts.deferred > 0 || blockedLines.length > 0) {
      try {
        const parts: string[] = [];
        if (counts.sent > 0)
          parts.push(`⏱ ${counts.sent} scheduled navigator guidance send${counts.sent === 1 ? "" : "s"} delivered`);
        if (counts.deferred > 0)
          parts.push(`🌙 ${counts.deferred} text-only send${counts.deferred === 1 ? "" : "s"} moved to the next recipient window`);
        if (blockedLines.length > 0)
          parts.push(`⚠️ ${blockedLines.length} blocked: ${blockedLines.join("; ")}`);
        await sendSlackAlert(`${parts.join(" · ")} → ${siteUrl}/admin/benefits`);
      } catch (err) {
        console.error("[benefits-navigator-scheduler] Slack ping failed:", err);
      }
    }

    return { ...counts, autopilot: a, help: { opened: help.opened, escalated: help.escalated } };
  });
}
