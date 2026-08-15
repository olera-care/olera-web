import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";
import { withCronRun } from "@/lib/crons/run";
import {
  executeWarRoomDiscovery,
  queueWarRoomDiscovery,
} from "@/lib/war-room/discovery.server";

export const maxDuration = 300;

export async function GET(request: NextRequest) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return withCronRun("war-room-discovery", async () => {
    const queued = await queueWarRoomDiscovery(getServiceClient(), "scheduled", "cron");
    if (!queued.reused) {
      await executeWarRoomDiscovery(queued.run.id);
      const { data: finished, error } = await getServiceClient().from("war_room_discovery_runs")
        .select("status, proposal_count, error_message")
        .eq("id", queued.run.id)
        .single();
      if (error) throw error;
      if (finished.status === "failed") throw new Error(finished.error_message || "War Room discovery failed");
      return {
        ok: true,
        run_id: queued.run.id,
        reused: false,
        status: finished.status,
        proposals: finished.proposal_count,
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
