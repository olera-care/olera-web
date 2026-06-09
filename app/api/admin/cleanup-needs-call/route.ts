import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { PROVIDER_NEEDS_CALL_THRESHOLD_DAYS } from "@/lib/connection-engagement";

/**
 * POST /api/admin/cleanup-needs-call
 *
 * Cleans up corrupted connection metadata where needs_call=true
 * was incorrectly set on connections less than the threshold (14 days).
 *
 * Query params:
 *   - dry_run=true: Preview mode, shows what would be cleaned without changing data
 */
export async function POST(request: NextRequest) {
  // Verify admin authentication
  const authUser = await getAuthUser();
  if (!authUser) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const adminUser = await getAdminUser(authUser.id);
  if (!adminUser) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const dryRun = searchParams.get("dry_run") === "true";

  const db = getServiceClient();
  const now = Date.now();

  const counts = {
    total_checked: 0,
    incorrectly_flagged: 0,
    cleaned: 0,
    dry_run: dryRun,
    triggered_by: adminUser.email,
  };

  try {
    // Find all connections with needs_call in metadata
    const { data: connections, error: fetchError } = await db
      .from("connections")
      .select("id, created_at, metadata")
      .eq("type", "inquiry")
      .limit(5000);

    if (fetchError) {
      console.error("[admin/cleanup-needs-call] Fetch error:", fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    const toClean: Array<{ id: string; daysSince: number }> = [];

    for (const conn of connections || []) {
      const meta = (conn.metadata as Record<string, unknown>) || {};

      // Check if needs_call flag is set
      if (meta.needs_call === true || meta.followup_stopped_reason === "needs_call") {
        counts.total_checked++;

        // Calculate days since sequence started (email_sent_at if present, otherwise created_at)
        // This handles providers who got email added later - they start fresh from that date
        const sequenceStartDate = (meta.email_sent_at as string) || conn.created_at;
        const daysSince = Math.floor(
          (now - new Date(sequenceStartDate).getTime()) / (1000 * 60 * 60 * 24)
        );

        // If less than threshold days, this is incorrect
        if (daysSince < PROVIDER_NEEDS_CALL_THRESHOLD_DAYS) {
          counts.incorrectly_flagged++;
          toClean.push({ id: conn.id, daysSince });
        }
      }
    }

    if (toClean.length === 0) {
      return NextResponse.json({
        ...counts,
        message: "No incorrectly flagged connections found.",
      });
    }

    // Clean up the incorrect flags
    if (!dryRun) {
      for (const item of toClean) {
        const { data: conn } = await db
          .from("connections")
          .select("metadata")
          .eq("id", item.id)
          .single();

        if (conn) {
          const meta = (conn.metadata as Record<string, unknown>) || {};

          // Build cleaned metadata without the incorrect flags
          const cleanedMeta: Record<string, unknown> = { ...meta };

          // Remove needs_call flag
          delete cleanedMeta.needs_call;

          // Remove followup_stopped_reason if it was "needs_call"
          if (cleanedMeta.followup_stopped_reason === "needs_call") {
            delete cleanedMeta.followup_stopped_reason;
          }

          // Reset to appropriate stage based on age
          cleanedMeta.followup_stage = item.daysSince >= 14 ? 5 : (meta.followup_stage ?? 0);

          await db
            .from("connections")
            .update({ metadata: cleanedMeta })
            .eq("id", item.id);

          counts.cleaned++;
        }
      }
    } else {
      counts.cleaned = toClean.length; // Would clean this many
    }

    return NextResponse.json({
      ...counts,
      message: dryRun
        ? `Would clean ${counts.incorrectly_flagged} connections with incorrect needs_call flag`
        : `Cleaned ${counts.cleaned} connections with incorrect needs_call flag`,
      details: dryRun ? toClean.slice(0, 20) : undefined, // Show first 20 in dry run
    });
  } catch (err) {
    console.error("[admin/cleanup-needs-call] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
