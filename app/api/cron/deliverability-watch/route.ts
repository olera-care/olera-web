import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";
import { withCronRun } from "@/lib/crons/run";
import { sendSlackAlert } from "@/lib/slack";
import {
  RESEND_BOUNCE_LIMIT,
  RESEND_BOUNCE_WARN,
  RESEND_COMPLAINT_LIMIT,
  RESEND_COMPLAINT_WARN,
} from "@/lib/email-thresholds";

/**
 * GET /api/cron/deliverability-watch
 *
 * The alert half of the deliverability system; the strip on /admin/automations is
 * the other half. Crossing Resend's AUP limits lets them suspend the account
 * WITHOUT WARNING, and that account carries auth, family and student mail — a
 * provider-acquisition bounce problem takes logins down with it. Nobody was
 * watching: the rates had been computed and dropped unrendered for months.
 *
 * Fires into Slack #notifications ON STATE CHANGE ONLY (ok → warn → danger, and
 * recoveries), never on a schedule. A number repeated every morning becomes
 * wallpaper inside a week, and that channel is already busy enough that a daily
 * line would be indistinguishable from noise by the time it mattered.
 *
 * Never alerts by email, deliberately: an email alert about email deliverability
 * cannot arrive precisely when it matters most.
 */
export const maxDuration = 60;

type Level = "ok" | "warn" | "danger";

/** Fraction of the hard limit at which we escalate ahead of suspension. */
const DANGER_FRACTION = 0.875;

const RANK: Record<Level, number> = { ok: 0, warn: 1, danger: 2 };

function levelFor(rate: number, warn: number, limit: number): Level {
  if (rate >= limit * DANGER_FRACTION) return "danger";
  if (rate >= warn) return "warn";
  return "ok";
}

interface PriorState {
  bounce: Level;
  complaint: Level;
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const { searchParams } = new URL(request.url);
  const querySecret = searchParams.get("secret");
  /** Announce current state even if unchanged. For manual verification. */
  const force = searchParams.get("force") === "true";
  const isAuthed =
    authHeader === `Bearer ${process.env.CRON_SECRET}` ||
    querySecret === process.env.CRON_SECRET;

  if (!isAuthed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return withCronRun("deliverability-watch", async () => {
    const db = getServiceClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://olera.care";
    const since = new Date(Date.now() - 30 * 86_400_000).toISOString();

    // ── Rates ────────────────────────────────────────────────────────────────
    // These MUST match app/api/admin/automations/route.ts line-for-line, or the
    // alert and the panel it links to will contradict each other. Three details
    // are easy to get wrong and all three change the verdict:
    //
    //   1. The denominator is EVERY non-SMS email_log row, including rows we
    //      suppressed or failed. Filtering to status='sent' shrinks it and
    //      inflates both rates (measured: 3.29% vs the panel's 3.04%).
    //   2. Bounce and complaint counts come from email_events, NOT from
    //      email_log.bounced_at / complained_at. email_events is account-wide,
    //      which is the scope Resend's AUP actually applies to.
    //   3. Complaints divide by DELIVERED (you can only complain about mail you
    //      received); bounces divide by SENT (a bounce is never delivered).
    //
    // Getting #1 and #2 wrong put the complaint rate on opposite sides of the
    // warn line from the panel: 0.0323% (green) against the panel's 0.0485% (red).
    const countRows = async (
      table: "email_log" | "email_events",
      apply: (q: ReturnType<ReturnType<typeof getServiceClient>["from"]>) => unknown,
    ): Promise<number> => {
      const { count, error } = (await apply(db.from(table))) as unknown as {
        count: number | null;
        error: { message: string } | null;
      };
      // A watchdog that cannot read its own inputs must NOT report "ok" — a soft
      // failure here would publish a false all-clear, which is worse than no
      // watchdog. Throwing marks the run errored and visible in the console.
      if (error) throw new Error(`${table} count failed: ${error.message}`);
      return count ?? 0;
    };

    const [sent, delivered, bounceEvents, complaintEvents] = await Promise.all([
      countRows("email_log", (q) =>
        q.select("id", { count: "exact", head: true }).neq("channel", "sms").gte("created_at", since)),
      countRows("email_log", (q) =>
        q.select("id", { count: "exact", head: true }).neq("channel", "sms").not("delivered_at", "is", null).gte("created_at", since)),
      countRows("email_events", (q) =>
        q.select("id", { count: "exact", head: true }).eq("event_type", "bounced").gte("occurred_at", since)),
      countRows("email_events", (q) =>
        q.select("id", { count: "exact", head: true }).eq("event_type", "complained").gte("occurred_at", since)),
    ]);

    const bounceRate = sent ? bounceEvents / sent : 0;
    const complaintRate = delivered ? complaintEvents / delivered : 0;
    const bounceLevel = levelFor(bounceRate, RESEND_BOUNCE_WARN, RESEND_BOUNCE_LIMIT);
    const complaintLevel = levelFor(complaintRate, RESEND_COMPLAINT_WARN, RESEND_COMPLAINT_LIMIT);

    // ── What Slack has actually been told ────────────────────────────────────
    // Deliberately the last ANNOUNCED state, not the last OBSERVED state. If a
    // Slack post fails, the announced state does not advance, so the next run
    // still sees a change and retries. Storing the observed level instead would
    // let one failed webhook swallow the alert permanently — the same
    // silent-failure class this whole system exists to catch.
    // A missing prior run reads as "ok", which can re-announce a standing
    // problem after a gap. That is the safe direction to be wrong in.
    let prior: PriorState = { bounce: "ok", complaint: "ok" };
    try {
      const { data: prev } = await db
        .from("cron_runs")
        .select("summary")
        .eq("job_id", "deliverability-watch")
        .eq("status", "ok")
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      const s = prev?.summary as { announcedBounceLevel?: Level; announcedComplaintLevel?: Level } | null;
      if (s?.announcedBounceLevel) prior.bounce = s.announcedBounceLevel;
      if (s?.announcedComplaintLevel) prior.complaint = s.announcedComplaintLevel;
    } catch (err) {
      console.error("[cron/deliverability-watch] prior state unreadable, assuming ok:", err);
    }

    const changed = bounceLevel !== prior.bounce || complaintLevel !== prior.complaint;
    const worst: Level = RANK[bounceLevel] >= RANK[complaintLevel] ? bounceLevel : complaintLevel;
    const recovering =
      RANK[bounceLevel] < RANK[prior.bounce] || RANK[complaintLevel] < RANK[prior.complaint];

    let alerted = false;
    let alertError: string | null = null;

    if (changed || force) {
      const pct = (r: number, digits: number) => `${(r * 100).toFixed(digits)}%`;
      const headline =
        worst === "ok"
          ? recovering
            ? "Email deliverability recovered"
            : "Email deliverability is within limits"
          : worst === "danger"
            ? "Email deliverability — close to account suspension"
            : "Email deliverability — past the warning line";

      const body = [
        `*${headline}*`,
        `Bounce ${pct(bounceRate, 2)} of ${sent.toLocaleString()} sends · warn ${pct(RESEND_BOUNCE_WARN, 2)} · suspend ${pct(RESEND_BOUNCE_LIMIT, 2)} · _${bounceLevel}_`,
        `Complaint ${pct(complaintRate, 3)} of ${delivered.toLocaleString()} delivered · warn ${pct(RESEND_COMPLAINT_WARN, 3)} · suspend ${pct(RESEND_COMPLAINT_LIMIT, 3)} · _${complaintLevel}_`,
        worst === "ok"
          ? "Both rates are back inside Resend's limits."
          : "Crossing a limit lets Resend suspend the account without warning. Auth, family and student mail share it.",
        `<${siteUrl}/admin/automations|Open the deliverability panel →>`,
      ].join("\n");

      // sendSlackAlert fails soft when SLACK_WEBHOOK_URL is unset. Capture that:
      // an alert that silently did not fire is exactly the failure this system
      // exists to remove, so it belongs in the run summary, not just a log line.
      const res = await sendSlackAlert(body);
      alerted = res.success;
      if (!res.success) {
        alertError = res.error ?? "unknown";
        console.error("[cron/deliverability-watch] Slack alert did NOT send:", alertError);
      }
    }

    // Announced state advances only on a delivered alert (or when nothing needed
    // saying). A forced re-announce that fails must not move it either.
    const announcedBounceLevel = changed && !alerted ? prior.bounce : bounceLevel;
    const announcedComplaintLevel = changed && !alerted ? prior.complaint : complaintLevel;

    return {
      ok: true,
      windowDays: 30,
      sent,
      delivered,
      bounceEvents,
      complaintEvents,
      bounceRate,
      complaintRate,
      bounceLevel,
      complaintLevel,
      priorBounceLevel: prior.bounce,
      priorComplaintLevel: prior.complaint,
      announcedBounceLevel,
      announcedComplaintLevel,
      changed,
      alerted,
      alertError,
    };
  }, { triggeredBy: "cron" });
}
