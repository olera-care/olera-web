/**
 * Cron endpoint: scan for due provider outreach email tasks and send them.
 *
 * Triggered by Vercel Cron (every 15 min — see vercel.json) or by an
 * admin curling locally with the CRON_SECRET bearer token.
 *
 * Auth: requires `Authorization: Bearer ${CRON_SECRET}`. Fails closed
 * (401) if CRON_SECRET is unset OR doesn't match — never publicly callable.
 *
 * Behavior:
 *   - Claim up to 10 due `outreach_email_send` tasks (small batch keeps
 *     us under Vercel function timeout).
 *   - Execute each via the provider outreach executor.
 *   - Return per-task results so manual curls can debug.
 *
 * Local testing:
 *   curl -H "Authorization: Bearer $CRON_SECRET" \
 *     http://localhost:3000/api/cron/provider-outreach-send
 */

import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";
import { executeProviderOutreachTask } from "@/lib/provider-outreach/auto-send-executor";
import { withCronRun } from "@/lib/crons/run";

const BATCH_SIZE = 10;
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

  return withCronRun("provider-outreach-send", async () => {
    const startedAt = Date.now();
    const db = getServiceClient();

    // Find due candidates (no claim here — executor does the atomic claim).
    const candidates = await selectDueTaskIds(db, BATCH_SIZE);

    const results: Array<{ task_id: string; outcome: string; error?: string }> = [];
    for (const id of candidates) {
      if (Date.now() - startedAt > MAX_RUNTIME_MS) break;
      try {
        const r = await executeProviderOutreachTask(id);
        results.push({ task_id: id, outcome: r.outcome });
      } catch (err) {
        results.push({
          task_id: id,
          outcome: "executor_error",
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return NextResponse.json({
      candidates: candidates.length,
      results,
      elapsed_ms: Date.now() - startedAt,
    });
  });
}

/**
 * SELECT due candidate task IDs without claiming. The atomic claim
 * happens inside `executeProviderOutreachTask` (UPDATE ... WHERE status='pending').
 *
 * Filters:
 *   - task_type = 'outreach_email_send'
 *   - status = 'pending'
 *   - due_at <= now()
 */
async function selectDueTaskIds(
  db: ReturnType<typeof getServiceClient>,
  limit: number
): Promise<string[]> {
  const { data, error } = await db
    .from("provider_outreach_tasks")
    .select("id")
    .eq("task_type", "outreach_email_send")
    .eq("status", "pending")
    .lte("due_at", new Date().toISOString())
    .order("due_at", { ascending: true })
    .limit(limit);

  if (error) {
    console.error("[provider-outreach-send] selectDueTaskIds error:", error);
    return [];
  }

  return (data ?? []).map((row) => row.id);
}
