import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { getCronJob } from "@/lib/crons/registry";

/**
 * GET /api/admin/automations/runs?job=<id>&limit=N
 *
 * Run-by-run history for one cron job, newest first. Lazy-loaded by
 * /admin/automations when a job row is expanded. `cron_runs` may not exist yet
 * (migration 082 not applied) — returns an empty list in that case.
 */
export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const admin = await getAdminUser(user.id);
  if (!admin) return NextResponse.json({ error: "Access denied" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get("job");
  if (!jobId || !getCronJob(jobId)) {
    return NextResponse.json({ error: "Unknown or missing ?job" }, { status: 400 });
  }
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "20", 10) || 20, 1), 100);

  const db = getServiceClient();
  try {
    const { data, error } = await db
      .from("cron_runs")
      .select("id, started_at, finished_at, status, summary, error, triggered_by")
      .eq("job_id", jobId)
      .order("started_at", { ascending: false })
      .limit(limit);
    if (error) {
      // Table likely not created yet — surface gently rather than 500.
      return NextResponse.json({ jobId, runs: [], note: "No run history available (cron_runs not found?)." });
    }
    return NextResponse.json({ jobId, runs: data ?? [] });
  } catch {
    return NextResponse.json({ jobId, runs: [], note: "No run history available." });
  }
}
