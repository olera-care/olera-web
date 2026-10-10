import { NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { summarizeCheckpoints } from "@/lib/benefits/checkpoints";
import { CHECKPOINTS_FROM, loadCheckpointFamilies } from "@/lib/benefits/checkpoints.server";

/**
 * GET /api/admin/benefits/checkpoints
 *
 * The caseworker's five checkpoints (lib/benefits/checkpoints.ts), by week,
 * arm and state, since per-step tracking began. Backs /admin/benefits/checkpoints.
 */
export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const admin = await getAdminUser(user.id);
  if (!admin) return NextResponse.json({ error: "Access denied" }, { status: 403 });

  try {
    const { families, truncated } = await loadCheckpointFamilies(getServiceClient());
    return NextResponse.json({ from: CHECKPOINTS_FROM, truncated, ...summarizeCheckpoints(families) });
  } catch (err) {
    console.error("[admin/benefits/checkpoints]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to load" }, { status: 500 });
  }
}
