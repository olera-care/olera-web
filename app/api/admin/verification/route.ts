import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Claim journey data showing how a provider claimed and their pre-claim engagement
 */
interface ClaimJourney {
  claim_source: "email" | "page" | "unknown"; // How they claimed
  used_one_click: boolean; // Magic link sign-in
  pre_claim_engagement: {
    email_clicks: number; // Clicked email notifications
    inquiries_received: number; // Leads before claiming
    questions_answered: number; // Q&A before claiming
  };
  first_engagement_at: string | null; // When they first interacted
}

/**
 * Fetch claim journey data for a provider
 * Queries provider_activity, connections, and provider_questions tables
 */
async function getClaimJourney(
  db: SupabaseClient,
  slug: string | null,
  profileId: string
): Promise<ClaimJourney> {
  const result: ClaimJourney = {
    claim_source: "unknown",
    used_one_click: false,
    pre_claim_engagement: {
      email_clicks: 0,
      inquiries_received: 0,
      questions_answered: 0,
    },
    first_engagement_at: null,
  };

  try {
    // Fetch all relevant activity for this provider in one query
    const { data: activities } = await db
      .from("provider_activity")
      .select("event_type, metadata, created_at")
      .or(`profile_id.eq.${profileId}${slug ? `,provider_id.eq.${slug}` : ""}`)
      .order("created_at", { ascending: true });

    if (!activities || activities.length === 0) {
      return result;
    }

    // Find claim_completed event to determine source and claim date
    const claimEvent = activities.find((a) => a.event_type === "claim_completed");
    const claimDate = claimEvent?.created_at ? new Date(claimEvent.created_at) : null;

    if (claimEvent?.metadata?.source) {
      result.claim_source = claimEvent.metadata.source === "email" ? "email" : "page";
    }

    // Check for one_click_access event
    result.used_one_click = activities.some((a) => a.event_type === "one_click_access");

    // Only calculate pre-claim engagement if we have a claim date
    // Without a claim date, we can't meaningfully determine what's "pre-claim"
    if (claimDate) {
      // Count pre-claim email clicks from activity
      const preClaimActivities = activities.filter(
        (a) => new Date(a.created_at) < claimDate
      );

      result.pre_claim_engagement.email_clicks = preClaimActivities.filter(
        (a) => a.event_type === "email_click"
      ).length;

      // Find first engagement timestamp
      const firstEngagement = preClaimActivities[0];
      if (firstEngagement) {
        result.first_engagement_at = firstEngagement.created_at;
      }

      // Count pre-claim inquiries received (connections where to_profile_id = profileId)
      const { count: inquiryCount } = await db
        .from("connections")
        .select("*", { count: "exact", head: true })
        .eq("to_profile_id", profileId)
        .eq("type", "inquiry")
        .lt("created_at", claimDate.toISOString());

      result.pre_claim_engagement.inquiries_received = inquiryCount || 0;

      // Count pre-claim questions answered
      // Questions are linked to providers by slug (provider_id column)
      if (slug) {
        const { count: questionCount } = await db
          .from("provider_questions")
          .select("*", { count: "exact", head: true })
          .eq("provider_id", slug)
          .not("answer", "is", null)
          .lt("answered_at", claimDate.toISOString());

        result.pre_claim_engagement.questions_answered = questionCount || 0;
      }
    }

    return result;
  } catch (error) {
    console.error("Error fetching claim journey:", error);
    return result;
  }
}

/**
 * GET /api/admin/verification
 *
 * List business profiles with badge requests.
 * Query params: status (default: "pending"), limit, offset
 *
 * Status filters:
 * - unverified_claims: Claimed profile with no verification submissions (for admin proactive verification)
 * - pending: Has verification_submission OR verification_attempts OR email_otp_attempt, but no badge_approved/badge_rejected
 * - approved: badge_approved = true
 * - rejected: badge_rejected = true
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const adminUser = await getAdminUser(user.id);
    if (!adminUser) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "pending";
    const countsOnly = searchParams.get("counts_only") === "true";
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const search = searchParams.get("search")?.toLowerCase().trim() || "";
    const stateParam = searchParams.get("state") || "";
    const typeParam = searchParams.get("type") || "";
    const trustParam = searchParams.get("trust_level") || "";

    const db = getServiceClient();

    // Fetch profiles that need verification review
    // We need to check for:
    // 1. Old flow: verification_submission exists
    // 2. New flow: verification_attempts exists OR email_otp_attempt exists
    // 3. Any profile with verification_state = "pending"
    // Using JS filtering since Supabase JSONB OR queries are unreliable
    // Note: claim_trust_reason requires migration 062 to be run
    // Using * to gracefully handle columns that may not exist yet
    const { data: allProviders, error } = await db
      .from("business_profiles")
      .select("*")
      .in("type", ["organization", "caregiver"])
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch badge requests:", error);
      return NextResponse.json({ error: "Failed to fetch badge requests" }, { status: 500 });
    }

    // Filter by badge status in JavaScript for reliability
    type ProfileMetadata = {
      badge_approved?: boolean | null;
      badge_rejected?: boolean | null;
      verification_submission?: unknown;
      verification_attempts?: unknown[];
      email_otp_attempt?: unknown;
      auto_verified?: boolean;
    };

    /**
     * Check if a profile has any verification data that needs review
     * This includes:
     * - Old flow: verification_submission exists
     * - New flow: verification_attempts array has items OR email_otp_attempt exists
     * - Any profile with verification_state = "pending"
     */
    // Reusable filter predicates for each status
    const hasVerificationData = (p: typeof allProviders[number]) => {
      const meta = p.metadata as ProfileMetadata | null;
      const hasOldSubmission = !!meta?.verification_submission;
      const hasNewAttempts = Array.isArray(meta?.verification_attempts) && meta.verification_attempts.length > 0;
      const hasEmailOtpAttempt = !!meta?.email_otp_attempt;
      const isPendingState = p.verification_state === "pending";
      return hasOldSubmission || hasNewAttempts || hasEmailOtpAttempt || isPendingState;
    };

    const isPending = (p: typeof allProviders[number]) => {
      const meta = p.metadata as ProfileMetadata | null;
      const notApproved = !meta?.badge_approved;
      const notRejected = !meta?.badge_rejected;
      const notAlreadyVerified = p.verification_state !== "verified";
      return hasVerificationData(p) && notApproved && notRejected && notAlreadyVerified;
    };

    const isApproved = (p: typeof allProviders[number]) => {
      const meta = p.metadata as ProfileMetadata | null;
      const approved =
        meta?.badge_approved === true ||
        p.verification_state === "verified" ||
        p.verification_state === "not_required";
      const isRevoked = meta?.badge_rejected === true;
      return approved && !isRevoked;
    };

    const isRejected = (p: typeof allProviders[number]) => {
      const meta = p.metadata as ProfileMetadata | null;
      return meta?.badge_rejected === true;
    };

    // Check if provider is in the "In Progress" outreach state
    // Must be AFTER other predicates since it excludes providers who have moved to other states
    const isInProgress = (p: typeof allProviders[number]) => {
      const meta = p.metadata as ProfileMetadata & { outreach_state?: string } | null;
      const hasOutreachState = meta?.outreach_state === "in_progress";
      // Exclude if they've moved to another state (approved, rejected, or has pending failed verification)
      return hasOutreachState && !isApproved(p) && !isRejected(p) && !isPending(p);
    };

    const isUnverifiedClaim = (p: typeof allProviders[number]) => {
      const meta = p.metadata as ProfileMetadata | null;
      const claimState = (p as { claim_state?: string }).claim_state;
      const isClaimedOrPending = claimState === "claimed" || claimState === "pending";
      const isUnverified = p.verification_state === "unverified";
      const hasNoSubmissions =
        !meta?.verification_submission &&
        (!Array.isArray(meta?.verification_attempts) || meta.verification_attempts.length === 0) &&
        !meta?.email_otp_attempt;
      const needsReviewStandard = isClaimedOrPending && isUnverified && hasNoSubmissions;
      const pendingSlipThrough = claimState === "pending" && p.verification_state !== "verified" && p.verification_state !== "not_required" && hasNoSubmissions;
      // Exclude providers that are already in progress
      const notInProgress = !isInProgress(p);
      return (needsReviewStandard || pendingSlipThrough) && notInProgress;
    };

    // If counts_only, return counts for all statuses
    if (countsOnly) {
      const providers = allProviders ?? [];
      return NextResponse.json({
        counts: {
          unverified_claims: providers.filter(isUnverifiedClaim).length,
          in_progress: providers.filter(isInProgress).length,
          pending: providers.filter(isPending).length,
          approved: providers.filter(isApproved).length,
          rejected: providers.filter(isRejected).length,
        },
      });
    }

    let filtered = allProviders ?? [];

    if (status === "unverified_claims") {
      filtered = filtered.filter(isUnverifiedClaim);
    } else if (status === "in_progress") {
      filtered = filtered.filter(isInProgress);
    } else if (status === "pending") {
      filtered = filtered.filter(isPending);
    } else if (status === "approved") {
      filtered = filtered.filter(isApproved);
    } else if (status === "rejected") {
      filtered = filtered.filter(isRejected);
    }

    // Cache for claimer emails - populated during search and reused for display
    const accountEmailMap = new Map<string, string>();

    // Apply state, type, and trust level filters
    if (stateParam) {
      filtered = filtered.filter((p) => (p as { state?: string }).state === stateParam);
    }
    if (typeParam) {
      filtered = filtered.filter((p) => p.type === typeParam);
    }
    if (trustParam) {
      if (trustParam === "none") {
        filtered = filtered.filter((p) => (p as { claim_trust_level?: string | null }).claim_trust_level == null);
      } else {
        filtered = filtered.filter((p) => (p as { claim_trust_level?: string }).claim_trust_level === trustParam);
      }
    }

    // Apply search filter if provided
    if (search) {
      // For email searches, find matching account IDs first
      let matchingAccountIds = new Set<string>();
      if (search.includes("@")) {
        // Get all accounts for filtered providers
        const allAccountIds = filtered
          .map((p) => (p as { account_id?: string }).account_id)
          .filter((id): id is string => Boolean(id));

        if (allAccountIds.length > 0) {
          const { data: accounts } = await db
            .from("accounts")
            .select("id, user_id")
            .in("id", allAccountIds);

          if (accounts) {
            // Check each account's auth email and cache it
            const emailChecks = await Promise.all(
              accounts.map(async (account) => {
                try {
                  const { data: authUser } = await db.auth.admin.getUserById(account.user_id);
                  const email = authUser?.user?.email || "";
                  // Cache the email for later use (avoid duplicate lookups)
                  if (email) {
                    accountEmailMap.set(account.id, email);
                  }
                  if (email.toLowerCase().includes(search)) {
                    return account.id;
                  }
                } catch {
                  // Ignore errors
                }
                return null;
              })
            );
            matchingAccountIds = new Set(emailChecks.filter((id): id is string => id !== null));
          }
        }
      }

      // Filter by display_name OR matching account_id (for email search)
      filtered = filtered.filter((p) => {
        const displayName = ((p as { display_name?: string }).display_name || "").toLowerCase();
        const accountId = (p as { account_id?: string }).account_id;
        const nameMatches = displayName.includes(search);
        const emailMatches = accountId ? matchingAccountIds.has(accountId) : false;
        return nameMatches || emailMatches;
      });
    }

    // Apply pagination
    const paginated = filtered.slice(offset, offset + limit);

    // Fetch claimer emails only for accounts not already cached
    const accountIds = [...new Set(paginated
      .map((p) => (p as { account_id?: string }).account_id)
      .filter((id): id is string => Boolean(id))
      .filter((id) => !accountEmailMap.has(id)))];

    if (accountIds.length > 0) {
      const { data: accounts } = await db
        .from("accounts")
        .select("id, user_id")
        .in("id", accountIds);

      if (accounts) {
        // Fetch auth emails in parallel for better performance
        const emailResults = await Promise.all(
          accounts.map(async (account) => {
            try {
              const { data: authUser } = await db.auth.admin.getUserById(account.user_id);
              return { accountId: account.id, email: authUser?.user?.email || null };
            } catch {
              return { accountId: account.id, email: null };
            }
          })
        );

        for (const result of emailResults) {
          if (result.email) {
            accountEmailMap.set(result.accountId, result.email);
          }
        }
      }
    }

    // Fetch claim journey data for all providers in parallel
    const claimJourneyPromises = paginated.map(
      (p: { id: string; slug?: string | null }) =>
        getClaimJourney(db, p.slug || null, p.id)
    );
    const claimJourneys = await Promise.all(claimJourneyPromises);

    // Add claimer_email and claim_journey to each provider
    const providersWithData = paginated.map(
      (p: { account_id?: string }, index: number) => ({
        ...p,
        claimer_email: p.account_id ? accountEmailMap.get(p.account_id) || null : null,
        claim_journey: claimJourneys[index],
      })
    );

    return NextResponse.json({ providers: providersWithData, total: filtered.length });
  } catch (err) {
    console.error("Admin badge requests error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
