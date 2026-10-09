import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";
import { withCronRun } from "@/lib/crons/run";
import { pollOncallCases } from "@/lib/war-room/oncall.server";

/**
 * Cortex on call: every ten minutes, post the pull request each running build
 * opened into its Slack thread, and say when TJ merges it. See
 * lib/war-room/oncall.ts.
 */
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return withCronRun("cortex-oncall", async () => {
    const result = await pollOncallCases(getServiceClient());
    return { ok: true, ...result };
  });
}
