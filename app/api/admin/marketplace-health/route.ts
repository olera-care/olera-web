import { NextResponse } from "next/server";
import { getAdminUser, getAuthUser, getServiceClient } from "@/lib/admin";

type ActiveCareRequest = {
  id: string;
  created_at: string;
  metadata: Record<string, unknown> | null;
};

type ProviderOutreach = {
  to_profile_id: string;
  created_at: string;
};

function careRequestPublishedAt(request: ActiveCareRequest): number {
  const carePost = request.metadata?.care_post;
  if (carePost && typeof carePost === "object") {
    const publishedAt = (carePost as Record<string, unknown>).published_at;
    if (typeof publishedAt === "string") {
      const timestamp = Date.parse(publishedAt);
      if (!Number.isNaN(timestamp)) return timestamp;
    }
  }
  return Date.parse(request.created_at);
}

/** Current marketplace liquidity for Admin Overview. These are live-state metrics. */
export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const adminUser = await getAdminUser(user.id);
  if (!adminUser) return NextResponse.json({ error: "Access denied" }, { status: 403 });

  const db = getServiceClient();
  const { data, error } = await db
    .from("business_profiles")
    .select("id, created_at, metadata")
    .eq("type", "family")
    .eq("is_active", true)
    .contains("metadata", { care_post: { status: "active" } })
    .limit(50000);

  if (error) {
    console.error("[admin/marketplace-health] active care requests failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const activeRequests = (data ?? []) as ActiveCareRequest[];
  if (activeRequests.length === 0) {
    return NextResponse.json({
      activeCareRequests: 0,
      careRequestsReached: 0,
      careRequestReachRate: 0,
    });
  }

  const outreach: ProviderOutreach[] = [];
  const batchSize = 100;
  for (let index = 0; index < activeRequests.length; index += batchSize) {
    const familyIds = activeRequests.slice(index, index + batchSize).map((request) => request.id);
    const result = await db
      .from("connections")
      .select("to_profile_id, created_at")
      .eq("type", "request")
      .contains("metadata", { provider_initiated: true })
      .in("to_profile_id", familyIds)
      .limit(50000);

    if (result.error) {
      console.error("[admin/marketplace-health] provider outreach failed:", result.error);
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }
    outreach.push(...((result.data ?? []) as ProviderOutreach[]));
  }

  const outreachByFamily = new Map<string, number[]>();
  for (const row of outreach) {
    const timestamps = outreachByFamily.get(row.to_profile_id) ?? [];
    timestamps.push(Date.parse(row.created_at));
    outreachByFamily.set(row.to_profile_id, timestamps);
  }

  let careRequestsReached = 0;
  for (const request of activeRequests) {
    const publishedAt = careRequestPublishedAt(request);
    const receivedOutreach = (outreachByFamily.get(request.id) ?? []).some(
      (outreachAt) => !Number.isNaN(outreachAt) && outreachAt >= publishedAt,
    );
    if (receivedOutreach) careRequestsReached += 1;
  }

  const careRequestReachRate = Math.round(
    (careRequestsReached / activeRequests.length) * 1000,
  ) / 10;

  return NextResponse.json({
    activeCareRequests: activeRequests.length,
    careRequestsReached,
    careRequestReachRate,
  });
}
