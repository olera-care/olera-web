import { NextRequest, NextResponse } from "next/server";
import { getAdminUser, getAuthUser, getServiceClient } from "@/lib/admin";
import {
  countCanonicalProviders,
  fetchMeaningfulProviderActivity,
} from "@/lib/admin-provider-activity";
import { resolveCanonicalProviderKeys } from "@/lib/provider-id-variants";

type ReferralActivityRow = {
  profile_id: string | null;
  provider_id: string | null;
  event_type: string;
  metadata: Record<string, unknown> | null;
};

type ProfileEditRow = {
  provider_id: string | null;
  created_at: string;
};

async function fetchProfileEditRows(
  db: ReturnType<typeof getServiceClient>,
  from: string | null,
  to: string | null,
) {
  const pageSize = 1000;
  const maxRows = 100000;
  const data: ProfileEditRow[] = [];

  for (let offset = 0; offset < maxRows; offset += pageSize) {
    let query = db
      .from("provider_activity")
      .select("provider_id, created_at")
      .eq("event_type", "provider_profile_edited")
      .order("created_at", { ascending: true });
    if (from) query = query.gte("created_at", from);
    if (to) query = query.lt("created_at", to);

    const result = await query.range(offset, offset + pageSize - 1);
    if (result.error) {
      return { data: [], error: new Error(result.error.message), truncated: false };
    }
    const page = (result.data ?? []) as ProfileEditRow[];
    data.push(...page);
    if (page.length < pageSize) return { data, error: null, truncated: false };
  }

  return { data, error: null, truncated: true };
}

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
  let questionsAskedQuery = db
    .from("provider_questions")
    .select("id", { count: "exact", head: true });
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
  let emailClicksQuery = db
    .from("email_log")
    .select("id", { count: "exact", head: true })
    .eq("channel", "email")
    .not("first_clicked_at", "is", null);
  let reviewsQuery = db
    .from("reviews")
    .select("id", { count: "exact", head: true });
  let oleraReviewsQuery = db
    .from("olera_reviews")
    .select("id", { count: "exact", head: true });
  let referralActivityQuery = db
    .from("provider_activity")
    .select("profile_id, provider_id, event_type, metadata")
    .in("event_type", [
      "referral_source_viewed",
      "referral_call_clicked",
      "market_outreach_status_updated",
    ])
    .limit(10000);

  if (from) {
    pageViewsQuery = pageViewsQuery.gte("created_at", from);
    leadsQuery = leadsQuery.gte("created_at", from);
    questionsAskedQuery = questionsAskedQuery.gte("created_at", from);
    questionsAnsweredQuery = questionsAnsweredQuery.gte("answered_at", from);
    benefitsQuery = benefitsQuery.gte("created_at", from);
    claimsQuery = claimsQuery.gte("created_at", from);
    emailClicksQuery = emailClicksQuery.gte("first_clicked_at", from);
    reviewsQuery = reviewsQuery.gte("created_at", from);
    oleraReviewsQuery = oleraReviewsQuery.gte("created_at", from);
    referralActivityQuery = referralActivityQuery.gte("created_at", from);
  }
  if (to) {
    pageViewsQuery = pageViewsQuery.lt("created_at", to);
    leadsQuery = leadsQuery.lt("created_at", to);
    questionsAskedQuery = questionsAskedQuery.lt("created_at", to);
    questionsAnsweredQuery = questionsAnsweredQuery.lt("answered_at", to);
    benefitsQuery = benefitsQuery.lt("created_at", to);
    claimsQuery = claimsQuery.lt("created_at", to);
    emailClicksQuery = emailClicksQuery.lt("first_clicked_at", to);
    reviewsQuery = reviewsQuery.lt("created_at", to);
    oleraReviewsQuery = oleraReviewsQuery.lt("created_at", to);
    referralActivityQuery = referralActivityQuery.lt("created_at", to);
  }

  const [
    pageViews,
    leads,
    questionsAsked,
    questionsAnswered,
    benefits,
    claims,
    profileEdits,
    emailClicks,
    reviews,
    oleraReviews,
    referralActivity,
    providerActivity,
  ] = await Promise.all([
    pageViewsQuery,
    leadsQuery,
    questionsAskedQuery,
    questionsAnsweredQuery,
    benefitsQuery,
    claimsQuery,
    fetchProfileEditRows(db, from, to),
    emailClicksQuery,
    reviewsQuery,
    oleraReviewsQuery,
    referralActivityQuery,
    fetchMeaningfulProviderActivity(db, from, to),
  ]);
  const error = pageViews.error
    ?? leads.error
    ?? questionsAsked.error
    ?? questionsAnswered.error
    ?? benefits.error
    ?? claims.error
    ?? profileEdits.error
    ?? emailClicks.error
    ?? reviews.error
    ?? oleraReviews.error
    ?? referralActivity.error
    ?? providerActivity.error;
  if (error) {
    console.error("[admin/network-health] count failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // This is a provider business-development funnel, not a count of family
  // referrals. Reviews are deduped by provider + local source; call taps are
  // activity volume; gained partners are self-reported status outcomes.
  const reviewedSources = new Set<string>();
  let referralCallsStarted = 0;
  const gainedPartners = new Set<string>();
  for (const row of (referralActivity.data ?? []) as ReferralActivityRow[]) {
    const metadata = row.metadata ?? {};
    const targetId = typeof metadata.target_id === "string" ? metadata.target_id : null;
    const providerId = row.profile_id ?? row.provider_id;
    if (!providerId || !targetId) continue;

    const key = `${providerId}:${targetId}`;
    if (row.event_type === "referral_source_viewed") {
      reviewedSources.add(key);
      continue;
    }
    if (row.event_type === "referral_call_clicked") {
      referralCallsStarted += 1;
      continue;
    }

    const status = typeof metadata.status === "string" ? metadata.status : null;
    if (row.event_type === "market_outreach_status_updated" && status === "referring") {
      gainedPartners.add(key);
    }
  }

  const meaningfulProviders = await countCanonicalProviders(db, providerActivity.data);
  if (meaningfulProviders.error) {
    console.error("[admin/network-health] provider identity lookup failed:", meaningfulProviders.error);
    return NextResponse.json({ error: meaningfulProviders.error.message }, { status: 500 });
  }
  const askedCount = questionsAsked.count ?? 0;
  const answeredCount = questionsAnswered.count ?? 0;
  if (profileEdits.truncated) {
    console.error("[admin/network-health] profile edit count exceeded the 100,000-row safety cap");
    return NextResponse.json({ error: "Profile edit range is too large" }, { status: 500 });
  }
  const profileEditIds = profileEdits.data
    .map((row) => row.provider_id)
    .filter((providerId): providerId is string => Boolean(providerId));
  const canonicalProfileEditIds = await resolveCanonicalProviderKeys(db, profileEditIds);
  const distinctProfileEditors = new Set(
    profileEditIds.map((providerId) => canonicalProfileEditIds.get(providerId) ?? providerId),
  ).size;

  return NextResponse.json({
    providerPageViews: pageViews.count ?? 0,
    leadsReceived: leads.count ?? 0,
    questionsAsked: askedCount,
    questionsAnswered: answeredCount,
    meaningfullyActiveProviders: meaningfulProviders.count,
    benefitsRequested: benefits.count ?? 0,
    providerAccountsClaimed: claims.count ?? 0,
    providerProfileEdits: distinctProfileEditors,
    emailClicks: emailClicks.count ?? 0,
    reviewsReceived: (reviews.count ?? 0) + (oleraReviews.count ?? 0),
    referralSourcesReviewed: reviewedSources.size,
    referralCallsStarted,
    referralPartnersGained: gainedPartners.size,
  });
}
