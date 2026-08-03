import { NextRequest, NextResponse } from "next/server";
import { getAdminUser, getAuthUser, getServiceClient } from "@/lib/admin";

function parseBoundary(value: string | null): string | null | undefined {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

/** Lightweight, date-filtered network activity counts for Admin Overview. */
export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const adminUser = await getAdminUser(user.id);
  if (!adminUser) return NextResponse.json({ error: "Access denied" }, { status: 403 });

  const params = new URL(request.url).searchParams;
  const from = parseBoundary(params.get("date_from"));
  const to = parseBoundary(params.get("date_to"));
  if (from === undefined || to === undefined) {
    return NextResponse.json({ error: "Invalid date range" }, { status: 400 });
  }
  if (from && to && from >= to) {
    return NextResponse.json({ error: "date_from must be before date_to" }, { status: 400 });
  }

  const db = getServiceClient();
  let pageViewsQuery = db
    .from("provider_activity")
    .select("id", { count: "exact", head: true })
    .eq("event_type", "page_view")
    .not("metadata->>session_id", "is", null)
    .neq("metadata->>session_id", "");
  let leadsQuery = db
    .from("provider_activity")
    .select("id", { count: "exact", head: true })
    .eq("event_type", "lead_received");
  let benefitsQuery = db
    .from("seeker_activity")
    .select("id", { count: "exact", head: true })
    .eq("event_type", "benefits_completed");
  let claimsQuery = db
    .from("provider_activity")
    .select("id", { count: "exact", head: true })
    .eq("event_type", "claim_completed");

  if (from) {
    pageViewsQuery = pageViewsQuery.gte("created_at", from);
    leadsQuery = leadsQuery.gte("created_at", from);
    benefitsQuery = benefitsQuery.gte("created_at", from);
    claimsQuery = claimsQuery.gte("created_at", from);
  }
  if (to) {
    pageViewsQuery = pageViewsQuery.lt("created_at", to);
    leadsQuery = leadsQuery.lt("created_at", to);
    benefitsQuery = benefitsQuery.lt("created_at", to);
    claimsQuery = claimsQuery.lt("created_at", to);
  }

  const [pageViews, leads, benefits, claims] = await Promise.all([
    pageViewsQuery,
    leadsQuery,
    benefitsQuery,
    claimsQuery,
  ]);
  const error = pageViews.error ?? leads.error ?? benefits.error ?? claims.error;
  if (error) {
    console.error("[admin/network-health] count failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    providerPageViews: pageViews.count ?? 0,
    leadsReceived: leads.count ?? 0,
    benefitsRequested: benefits.count ?? 0,
    providerAccountsClaimed: claims.count ?? 0,
  });
}
