import { NextRequest, NextResponse } from "next/server";
import { getAdminUser, getAuthUser, getServiceClient } from "@/lib/admin";

type ReferralActivityRow = {
  profile_id: string | null;
  provider_id: string | null;
  metadata: Record<string, unknown> | null;
};

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
  let questionsAnsweredQuery = db
    .from("provider_questions")
    .select("id", { count: "exact", head: true })
    .not("answered_at", "is", null)
    .not("answer", "is", null)
    .neq("answer", "");
  let benefitsQuery = db
    .from("seeker_activity")
    .select("id", { count: "exact", head: true })
    .eq("event_type", "benefits_completed");
  let claimsQuery = db
    .from("provider_activity")
    .select("id", { count: "exact", head: true })
    .eq("event_type", "claim_completed");
  let referralActivityQuery = db
    .from("provider_activity")
    .select("profile_id, provider_id, metadata")
    .eq("event_type", "market_outreach_status_updated")
    .limit(10000);

  if (from) {
    pageViewsQuery = pageViewsQuery.gte("created_at", from);
    leadsQuery = leadsQuery.gte("created_at", from);
    questionsAnsweredQuery = questionsAnsweredQuery.gte("answered_at", from);
    benefitsQuery = benefitsQuery.gte("created_at", from);
    claimsQuery = claimsQuery.gte("created_at", from);
    referralActivityQuery = referralActivityQuery.gte("created_at", from);
  }
  if (to) {
    pageViewsQuery = pageViewsQuery.lt("created_at", to);
    leadsQuery = leadsQuery.lt("created_at", to);
    questionsAnsweredQuery = questionsAnsweredQuery.lt("answered_at", to);
    benefitsQuery = benefitsQuery.lt("created_at", to);
    claimsQuery = claimsQuery.lt("created_at", to);
    referralActivityQuery = referralActivityQuery.lt("created_at", to);
  }

  const [pageViews, leads, questionsAnswered, benefits, claims, referralActivity] = await Promise.all([
    pageViewsQuery,
    leadsQuery,
    questionsAnsweredQuery,
    benefitsQuery,
    claimsQuery,
    referralActivityQuery,
  ]);
  const error = pageViews.error ?? leads.error ?? questionsAnswered.error ?? benefits.error ?? claims.error ?? referralActivity.error;
  if (error) {
    console.error("[admin/network-health] count failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Your Market records status transitions, not individual family referrals.
  // Count the first meaningful outreach to each source and the sources newly
  // marked "They'll refer me" without double-counting subsequent status edits.
  const contactedSources = new Set<string>();
  const gainedPartners = new Set<string>();
  for (const row of (referralActivity.data ?? []) as ReferralActivityRow[]) {
    const metadata = row.metadata ?? {};
    const targetId = typeof metadata.target_id === "string" ? metadata.target_id : null;
    const status = typeof metadata.status === "string" ? metadata.status : null;
    const previousStatus = typeof metadata.previous_status === "string" ? metadata.previous_status : null;
    const providerId = row.profile_id ?? row.provider_id;
    if (!providerId || !targetId || !status) continue;

    const key = `${providerId}:${targetId}`;
    const isFirstOutreach = previousStatus === null || previousStatus === "to_contact";
    if (isFirstOutreach && ["contacted", "responded", "referring"].includes(status)) {
      contactedSources.add(key);
    }
    if (status === "referring") gainedPartners.add(key);
  }

  return NextResponse.json({
    providerPageViews: pageViews.count ?? 0,
    leadsReceived: leads.count ?? 0,
    questionsAnswered: questionsAnswered.count ?? 0,
    benefitsRequested: benefits.count ?? 0,
    providerAccountsClaimed: claims.count ?? 0,
    referralSourcesContacted: contactedSources.size,
    referralPartnersGained: gainedPartners.size,
  });
}
