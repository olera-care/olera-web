import { NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { getCronJob } from "@/lib/crons/registry";

/**
 * GET /api/admin/automations/[id]/recipients?run=<runId>[&page=N][&status=...]
 *
 * Per-recipient table for one run of an automation. Reads email_log rows
 * stamped with that run's id (see lib/crons/run.ts:stampEmails — set at run-end,
 * needs migration 083). If the cron_run_id column isn't there yet, returns
 * { columnMissing: true } with an explanatory note rather than erroring.
 *
 * `status` filter: all (default) | delivered | opened | clicked | bounced |
 * complained | undelivered (no delivered_at and no bounce). Page size 100.
 */

const PAGE_SIZE = 100;
type StatusFilter = "all" | "delivered" | "opened" | "clicked" | "bounced" | "complained" | "undelivered";

interface RecipientRow {
  id: string;
  recipient: string;
  recipient_type: string | null;
  provider_id: string | null;
  subject: string;
  email_type: string;
  status: string;
  error_message: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  delivered_at: string | null;
  first_opened_at: string | null;
  first_clicked_at: string | null;
  bounced_at: string | null;
  complained_at: string | null;
  last_event_type: string | null;
  last_event_at: string | null;
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const admin = await getAdminUser(user.id);
  if (!admin) return NextResponse.json({ error: "Access denied" }, { status: 403 });

  const { id } = await params;
  const job = getCronJob(id);
  if (!job) return NextResponse.json({ error: "Unknown automation" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const runId = (searchParams.get("run") || "").trim();
  if (!runId) return NextResponse.json({ error: "Missing ?run=<runId>" }, { status: 400 });
  if (!/^[0-9a-fA-F-]{32,36}$/.test(runId)) return NextResponse.json({ error: "Malformed run id" }, { status: 400 });
  const page = Math.max(parseInt(searchParams.get("page") || "1", 10) || 1, 1);
  const status = (searchParams.get("status") || "all") as StatusFilter;

  const db = getServiceClient();

  // Confirm the run exists + belongs to this job (and grab its meta for the header).
  let run: { id: string; started_at: string; finished_at: string | null; status: string; summary: Record<string, unknown> | null; triggered_by: string } | null = null;
  try {
    const { data, error } = await db
      .from("cron_runs")
      .select("id, job_id, started_at, finished_at, status, summary, triggered_by")
      .eq("id", runId)
      .maybeSingle();
    if (error) return NextResponse.json({ error: "cron_runs unavailable — migration 082 not applied?" }, { status: 503 });
    if (!data) return NextResponse.json({ error: "Run not found" }, { status: 404 });
    if (data.job_id !== id) return NextResponse.json({ error: "Run does not belong to this automation" }, { status: 400 });
    run = { id: data.id, started_at: data.started_at, finished_at: data.finished_at, status: data.status, summary: data.summary, triggered_by: data.triggered_by };
  } catch {
    return NextResponse.json({ error: "cron_runs unavailable" }, { status: 503 });
  }

  // Per-run rollup across every linked email (bounded by the run's send count).
  const rollup = { sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0, complained: 0 };
  let columnMissing = false;
  try {
    const { data, error } = await db
      .from("email_log")
      .select("delivered_at, first_opened_at, first_clicked_at, bounced_at, complained_at")
      .eq("cron_run_id", runId)
      .limit(100000);
    if (error) {
      columnMissing = true; // cron_run_id column not present yet
    } else {
      for (const e of (data ?? []) as Array<Pick<RecipientRow, "delivered_at" | "first_opened_at" | "first_clicked_at" | "bounced_at" | "complained_at">>) {
        rollup.sent += 1;
        if (e.delivered_at) rollup.delivered += 1;
        if (e.first_opened_at) rollup.opened += 1;
        if (e.first_clicked_at) rollup.clicked += 1;
        if (e.bounced_at) rollup.bounced += 1;
        if (e.complained_at) rollup.complained += 1;
      }
    }
  } catch {
    columnMissing = true;
  }

  // Paginated recipient rows.
  let recipients: RecipientRow[] = [];
  let total = 0;
  if (!columnMissing) {
    try {
      let q = db
        .from("email_log")
        .select(
          "id, recipient, recipient_type, provider_id, subject, email_type, status, error_message, metadata, created_at, delivered_at, first_opened_at, first_clicked_at, bounced_at, complained_at, last_event_type, last_event_at",
          { count: "exact" },
        )
        .eq("cron_run_id", runId)
        .order("created_at", { ascending: true })
        .range((page - 1) * PAGE_SIZE, (page - 1) * PAGE_SIZE + PAGE_SIZE - 1);
      if (status === "delivered") q = q.not("delivered_at", "is", null);
      else if (status === "opened") q = q.not("first_opened_at", "is", null);
      else if (status === "clicked") q = q.not("first_clicked_at", "is", null);
      else if (status === "bounced") q = q.not("bounced_at", "is", null);
      else if (status === "complained") q = q.not("complained_at", "is", null);
      else if (status === "undelivered") q = q.is("delivered_at", null).is("bounced_at", null);
      const { data, count } = await q;
      recipients = (data ?? []) as RecipientRow[];
      total = count ?? 0;
    } catch {
      /* leave empty */
    }
  }

  return NextResponse.json({
    run,
    rollup,
    columnMissing,
    pageSize: PAGE_SIZE,
    page,
    status,
    total,
    recipients,
    note: columnMissing
      ? "email_log.cron_run_id (migration 083) isn't applied yet — per-recipient linkage will populate once it lands and a run fires."
      : null,
  });
}
