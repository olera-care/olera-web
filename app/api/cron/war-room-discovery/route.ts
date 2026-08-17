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
