/**
 * Cron endpoint: scan for due outreach email tasks and send them.
 *
 * Triggered by Vercel Cron (every 15 min — see vercel.json) or by an
 * admin curling locally with the CRON_SECRET bearer token.
 *
 * Auth: requires `Authorization: Bearer ${CRON_SECRET}`. Fails closed
 * (401) if CRON_SECRET is unset OR doesn't match — never publicly callable.
 *
 * Behavior:
 *   - Claim up to 5 due `outreach_email_send` tasks (small batch keeps
 *     us under Vercel function timeout even on cold-cache flyer fetches).
 *   - Execute each via the shared `executeEmailTask` helper.
 *   - Run the end-of-cadence sweep at the end (cheap query).
 *   - Return per-task results so manual curls can debug.
 *
 * Local testing:
 *   curl -H "Authorization: Bearer $CRON_SECRET" \
 *     http://localhost:3000/api/cron/student-outreach-send
 */

import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";
import { endOfCadenceSweep, executeEmailTask } from "@/lib/student-outreach/auto-send-executor";

const BATCH_SIZE = 5;
const MAX_RUNTIME_MS = 50_000; // Vercel default is 60s; leave headroom.

function authorize(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // fail closed if unset
  const header = req.headers.get("authorization") ?? "";
  return header === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  return runCron(req);
}

export async function POST(req: NextRequest) {
  // POST also accepted so Vercel Cron + manual curl both work.
  return runCron(req);
}

async function runCron(req: NextRequest) {
  if (!authorize(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = Date.now();
  const db = getServiceClient();

  // Find due candidates (no claim here — executor does the atomic claim).
  const candidates = await selectDueTaskIds(db, BATCH_SIZE);

  const results: Array<{ task_id: string; outcome: string; error?: string }> = [];
  for (const id of candidates) {
    if (Date.now() - startedAt > MAX_RUNTIME_MS) break;
    try {
      const r = await executeEmailTask(id);
      results.push({ task_id: id, outcome: r.outcome });
    } catch (err) {
      results.push({
        task_id: id,
        outcome: "executor_error",
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // End-of-cadence sweep at the end (cheap; idempotent).
  let sweep = { queued: 0 };
  try {
    sweep = await endOfCadenceSweep();
  } catch (err) {
    console.error("End-of-cadence sweep failed:", err);
  }

  return NextResponse.json({
    candidates: candidates.length,
    results,
    sweep,
    elapsed_ms: Date.now() - startedAt,
  });
}

/**
 * SELECT due candidate task IDs without claiming. The atomic claim
 * happens inside `executeEmailTask` (UPDATE ... WHERE status='pending'
 * RETURNING). If two cron runs race on the same candidate, the second
 * executor's claim returns null and outcome=task_already_taken — no
 * double-send. This keeps the claim authority in one place (the
 * executor), which is also called inline from schedule_sequence.
 */
async function selectDueTaskIds(
  db: ReturnType<typeof getServiceClient>,
  limit: number,
): Promise<string[]> {
  const nowIso = new Date().toISOString();
  const { data: candidates } = await db
    .from("student_outreach_tasks")
    .select("id")
    .eq("status", "pending")
    .eq("task_type", "outreach_email_send")
    .lte("due_at", nowIso)
    .order("due_at", { ascending: true })
    .limit(limit);
  return ((candidates ?? []) as Array<{ id: string }>).map((c) => c.id);
}
