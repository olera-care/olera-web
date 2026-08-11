import { NextRequest, NextResponse } from "next/server";
import { getAdminUser, getAuthUser, getServiceClient } from "@/lib/admin";
import type { GrowthSnapshot } from "@/lib/growth/types";

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (!(await getAdminUser(user.id))) return NextResponse.json({ error: "Access denied" }, { status: 403 });

  const requested = Number(request.nextUrl.searchParams.get("weeks") || 26);
  const weeks = Math.max(4, Math.min(104, Number.isFinite(requested) ? requested : 26));
  const { data, error } = await getServiceClient()
    .from("growth_metric_snapshots")
    .select("*")
    .order("week_start", { ascending: false })
    .limit(weeks);

  if (error) {
    console.error("[growth-analytics]", error);
    return NextResponse.json({ error: "Growth history is unavailable." }, { status: 500 });
  }

  return NextResponse.json({
    reporting_timezone: "America/Chicago",
    weeks: ((data || []) as GrowthSnapshot[]).reverse(),
  });
}
