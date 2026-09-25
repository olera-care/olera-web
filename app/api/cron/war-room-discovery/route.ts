import { NextRequest, NextResponse } from "next/server";
import { start } from "workflow/api";
import { getServiceClient } from "@/lib/admin";
import { withCronRun } from "@/lib/crons/run";
import {
  failWarRoomDiscovery,
  queueWarRoomDiscovery,
} from "@/lib/war-room/discovery.server";
import { warRoomDiscoveryWorkflow } from "@/workflows/war-room-discovery";

export const maxDuration = 300;

export async function GET(request: NextRequest) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return withCronRun("war-room-discovery", async () => {
    // Full scans run on WAR_ROOM_SWEEP_DAYS (default Mon, Wed, Fri, US Eastern).
    // Every other day still sends the brief, built from live data: provider
    // emails, approvals and the paying provider's renewal are time-sensitive
    // and are checked daily. Only the model passes are skipped. Manual scans
    // do not come through here and run on any day.
    const { deliverWarRoomBrief, isSweepDay, easternDay } = await import("@/lib/war-room/brief-delivery.server");
    if (!isSweepDay()) {
      const brief = await deliverWarRoomBrief(getServiceClient(), { briefOnly: true });
      return { ok: true, brief_only: true, day: easternDay().date, ...brief };
    }
    const queued = await queueWarRoomDiscovery(getServiceClient(), "scheduled", "cron");
    if (!queued.reused) {
      let workflowRun;
      try {
        workflowRun = await start(warRoomDiscoveryWorkflow, [queued.run.id]);
      } catch (startError) {
        await failWarRoomDiscovery(
          queued.run.id,
          startError instanceof Error ? startError.message : "Durable workflow could not start",
        );
        throw startError;
      }
      return {
        ok: true,
        run_id: queued.run.id,
        workflow_run_id: workflowRun.runId,
        reused: false,
        status: "queued",
      };
    }
    return {
      ok: true,
      run_id: queued.run.id,
      reused: true,
      status: queued.run.status,
    };
  });
}
