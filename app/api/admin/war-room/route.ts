import { after, NextRequest, NextResponse } from "next/server";
import {
  getAdminUser,
  getAuthUser,
  getServiceClient,
  logAuditAction,
} from "@/lib/admin";
import { buildWarRoomSnapshot } from "@/lib/war-room/snapshot.server";
import {
  buildWarRoomFactPack,
  generateWarRoomRun,
  WAR_ROOM_MODEL,
} from "@/lib/war-room/analyst.server";
import type { WarRoomRun } from "@/lib/war-room/types";

export const maxDuration = 300;

const RUN_SELECT = "id, status, window_days, model, briefing, citations, error_message, created_at, started_at, completed_at";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    if (!(await getAdminUser(user.id))) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
    const db = getServiceClient();
    const runId = request.nextUrl.searchParams.get("run_id");
    if (runId) {
      const { data, error } = await db.from("war_room_runs").select(RUN_SELECT).eq("id", runId).maybeSingle();
      if (error) return NextResponse.json({ error: "Could not load this analysis run." }, { status: 500 });
      if (!data) return NextResponse.json({ error: "Analysis run not found." }, { status: 404 });
      return NextResponse.json({ run: data as WarRoomRun });
    }
    const requestedDays = Number(request.nextUrl.searchParams.get("days") || 30);
    const days = [7, 30, 90].includes(requestedDays) ? requestedDays : 30;
    const [snapshot, latestRunResult] = await Promise.all([
      buildWarRoomSnapshot(db, days),
      db.from("war_room_runs").select(RUN_SELECT).eq("window_days", days).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    ]);
    snapshot.latestRun = latestRunResult.error ? null : latestRunResult.data as WarRoomRun | null;
    return NextResponse.json(snapshot);
  } catch (error) {
    console.error("[war-room] snapshot failed:", error);
    return NextResponse.json({ error: "War Room could not assemble the evidence." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const admin = await getAdminUser(user.id);
    if (!admin) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const body = await request.json() as {
      action?: string;
      days?: number;
      recommendationKey?: string;
      recommendationTitle?: string;
      decision?: string;
      note?: string;
    };
    const db = getServiceClient();
    if (body.action === "run") {
      const days = [7, 30, 90].includes(body.days ?? 0) ? body.days as 7 | 30 | 90 : 30;
      const activeSince = new Date(Date.now() - 10 * 60_000).toISOString();
      const { error: staleRunError } = await db.from("war_room_runs").update({
        status: "failed",
        error_message: "Analysis exceeded the 10-minute run lease.",
        completed_at: new Date().toISOString(),
      }).eq("window_days", days).in("status", ["queued", "running"]).lt("created_at", activeSince);
      if (staleRunError) throw staleRunError;

      const { data: activeRun } = await db.from("war_room_runs")
        .select(RUN_SELECT)
        .eq("window_days", days)
        .in("status", ["queued", "running"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (activeRun) return NextResponse.json({ run: activeRun as WarRoomRun, reused: true });

      const snapshot = await buildWarRoomSnapshot(db, days);
      const factPack = buildWarRoomFactPack(snapshot);
      const { data: run, error: runError } = await db.from("war_room_runs").insert({
        status: "queued",
        window_days: days,
        requested_by: admin.email,
        model: WAR_ROOM_MODEL,
        fact_pack: factPack,
        citations: factPack.evidenceCatalog,
      }).select(RUN_SELECT).single();
      if (runError?.code === "23505") {
        const { data: racedRun, error: racedRunError } = await db.from("war_room_runs")
          .select(RUN_SELECT)
          .eq("window_days", days)
          .in("status", ["queued", "running"])
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (racedRunError || !racedRun) throw runError;
        return NextResponse.json({ run: racedRun as WarRoomRun, reused: true });
      }
      if (runError) throw runError;
      after(() => generateWarRoomRun(run.id));
      await logAuditAction({
        adminUserId: admin.id,
        action: "war_room_run_started",
        targetType: "war_room_run",
        targetId: run.id,
        details: { window_days: days, model: WAR_ROOM_MODEL },
      });
      return NextResponse.json({ run: run as WarRoomRun }, { status: 202 });
    }
    if (!body.recommendationKey || !body.recommendationTitle || !["backed", "rejected", "completed"].includes(body.decision ?? "")) {
      return NextResponse.json({ error: "Invalid decision" }, { status: 400 });
    }

    const { data, error } = await db.from("war_room_decisions").insert({
      recommendation_key: body.recommendationKey,
      recommendation_title: body.recommendationTitle,
      decision: body.decision,
      note: body.note?.trim() || null,
      decided_by: admin.email,
    }).select("id, recommendation_key, recommendation_title, decision, note, decided_by, created_at").single();
    if (error) throw error;

    await logAuditAction({
      adminUserId: admin.id,
      action: "war_room_decision",
      targetType: "war_room_recommendation",
      targetId: body.recommendationKey,
      details: { decision: body.decision, title: body.recommendationTitle },
    });
    return NextResponse.json({ decision: data }, { status: 201 });
  } catch (error) {
    console.error("[war-room] write failed:", error);
    const rawMessage = error instanceof Error ? error.message : JSON.stringify(error);
    const message = /war_room_(?:decisions|runs)/.test(rawMessage)
      ? "Apply migration 176 before using War Room memory and AI runs."
      : "War Room could not save this request.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
