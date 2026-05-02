import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

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
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const search = searchParams.get("search")?.toLowerCase().trim() || "";

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
    const hasVerificationData = (p: typeof allProviders[number]) => {
      const meta = p.metadata as ProfileMetadata | null;
      const hasOldSubmission = !!meta?.verification_submission;
      const hasNewAttempts = Array.isArray(meta?.verification_attempts) && meta.verification_attempts.length > 0;
      const hasEmailOtpAttempt = !!meta?.email_otp_attempt;
      const isPendingState = p.verification_state === "pending";
      return hasOldSubmission || hasNewAttempts || hasEmailOtpAttempt || isPendingState;
    };

    let filtered = allProviders ?? [];

    if (status === "unverified_claims") {
      // Profiles needing verification — either claimed listings or new profiles with low-trust emails
      // Includes both claim_state "claimed" (claimed existing listing) and "pending" (created new profile)
      // Also catches claims that slipped through with verification_state="verified" but claim_state="pending"
      filtered = filtered.filter((p) => {
        const meta = p.metadata as ProfileMetadata | null;
        const claimState = (p as { claim_state?: string }).claim_state;
        const isClaimedOrPending = claimState === "claimed" || claimState === "pending";
        const isUnverified = p.verification_state === "unverified";
        const hasNoSubmissions =
          !meta?.verification_submission &&
          (!Array.isArray(meta?.verification_attempts) || meta.verification_attempts.length === 0) &&
          !meta?.email_otp_attempt;
        // Standard case: claimed/pending + unverified + no submissions
        const needsReviewStandard = isClaimedOrPending && isUnverified && hasNoSubmissions;
        // Edge case: pending claims that slipped through with verification_state != "unverified"
        // These should still appear for review since claim_state="pending" means admin needs to act
        // Must also have no submissions - otherwise they belong in "Awaiting Review" tab
        const pendingSlipThrough = claimState === "pending" && p.verification_state !== "verified" && p.verification_state !== "not_required" && hasNoSubmissions;
        return needsReviewStandard || pendingSlipThrough;
      });
    } else if (status === "pending") {
      // Has verification data but not yet approved or rejected
      // Also exclude providers who are already verified (they auto-verified after initial failure)
      filtered = filtered.filter((p) => {
        const meta = p.metadata as ProfileMetadata | null;
        const notApproved = !meta?.badge_approved;
        const notRejected = !meta?.badge_rejected;
        const notAlreadyVerified = p.verification_state !== "verified";
        return hasVerificationData(p) && notApproved && notRejected && notAlreadyVerified;
      });
    } else if (status === "approved") {
      // Include all verified providers:
      // - badge_approved = true (admin or Claude AI auto-approved)
      // - verification_state = "verified" (self-verified via email/linkedin/website/document)
      // - verification_state = "not_required" (high-trust email at claim time, instant access)
      // Exclude providers whose badge was revoked (badge_rejected)
      filtered = filtered.filter((p) => {
        const meta = p.metadata as ProfileMetadata | null;
        const isApproved =
          meta?.badge_approved === true ||
          p.verification_state === "verified" ||
          p.verification_state === "not_required";
        const isRevoked = meta?.badge_rejected === true;
        return isApproved && !isRevoked;
      });
    } else if (status === "rejected") {
      filtered = filtered.filter((p) => {
        const meta = p.metadata as ProfileMetadata | null;
        return meta?.badge_rejected === true;
      });
    }

    // Cache for claimer emails - populated during search and reused for display
    const accountEmailMap = new Map<string, string>();

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
      .filter((id): id is string => Boolean(id) && !accountEmailMap.has(id)))];

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

    // Add claimer_email to each provider
    const providersWithEmail = paginated.map((p: { account_id?: string }) => ({
      ...p,
      claimer_email: p.account_id ? accountEmailMap.get(p.account_id) || null : null,
    }));

    return NextResponse.json({ providers: providersWithEmail, total: filtered.length });
  } catch (err) {
    console.error("Admin badge requests error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
