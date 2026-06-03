import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient, logAuditAction } from "@/lib/admin";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Detailed inquiry information for the verification modal
 */
interface InquiryDetail {
  id: string;
  from_name: string;
  from_email: string | null;
  message: string | null;
  care_type: string | null;
  timeline: string | null;
  created_at: string;
  provider_responded: boolean; // True if provider sent a message in the thread
  response_count: number; // Number of messages in thread
}

/**
 * Detailed question information for the verification modal
 */
interface QuestionDetail {
  id: string;
  question_text: string;
  asker_name: string | null;
  asker_email: string | null;
  answer: string | null;
  status: string; // 'pending', 'approved', 'answered', 'rejected', 'flagged'
  created_at: string;
  answered_at: string | null;
}

/**
 * All leads and questions for a provider (shown in verification modal)
 */
interface ProviderEngagement {
  inquiries: InquiryDetail[];
  questions: QuestionDetail[];
}

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
  // All engagement (not just pre-claim) for the details modal
  all_engagement?: ProviderEngagement;
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
 * Fetch ALL inquiries and questions for a provider (not just pre-claim)
 * Used to show detailed leads in the verification modal
 */
async function getProviderEngagement(
  db: SupabaseClient,
  slug: string | null,
  profileId: string
): Promise<ProviderEngagement> {
  const result: ProviderEngagement = {
    inquiries: [],
    questions: [],
  };

  try {
    // Fetch all inquiries (connections where to_profile_id = profileId)
    const { data: connections } = await db
      .from("connections")
      .select("id, from_profile_id, message, metadata, created_at")
      .eq("to_profile_id", profileId)
      .eq("type", "inquiry")
      .order("created_at", { ascending: false })
      .limit(20); // Limit to most recent 20

    if (connections && connections.length > 0) {
      // Get all from_profile_ids to fetch seeker details
      const fromProfileIds = connections
        .map((c) => c.from_profile_id)
        .filter((id): id is string => Boolean(id));

      // Fetch seeker profiles (including account_id for email lookup)
      const { data: seekerProfiles } = await db
        .from("business_profiles")
        .select("id, display_name, email, account_id")
        .in("id", fromProfileIds);

      // Family emails are in auth.users, not business_profiles
      // We need to look up: business_profiles.account_id → accounts.user_id → auth.users.email
      const seekerEmailMap = new Map<string, string>();
      const accountIds = (seekerProfiles || [])
        .map((p) => p.account_id)
        .filter((id): id is string => Boolean(id));

      if (accountIds.length > 0) {
        const { data: accounts } = await db
          .from("accounts")
          .select("id, user_id")
          .in("id", accountIds);

        if (accounts) {
          // Fetch emails from auth.users in parallel
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
              seekerEmailMap.set(result.accountId, result.email);
            }
          }
        }
      }

      const seekerMap = new Map(
        (seekerProfiles || []).map((p) => [p.id, { ...p, resolvedEmail: p.account_id ? seekerEmailMap.get(p.account_id) : p.email }])
      );

      // Build inquiry details
      result.inquiries = connections.map((conn) => {
        const seeker = seekerMap.get(conn.from_profile_id);

        // Parse message JSON if it exists
        let messageText: string | null = null;
        let careType: string | null = null;
        let timeline: string | null = null;
        let msgSeekerName: string | null = null;
        let msgSeekerEmail: string | null = null;

        if (conn.message) {
          try {
            const parsed = JSON.parse(conn.message);
            messageText = parsed.message || parsed.additional_notes || null;
            careType = parsed.care_type || null;
            timeline = parsed.urgency || null;
            // Message JSON also contains seeker info - use as fallback
            msgSeekerName = parsed.seeker_name || null;
            msgSeekerEmail = parsed.seeker_email || null;
          } catch {
            messageText = conn.message;
          }
        }

        // Check metadata for auto_intro and thread messages
        interface ThreadMessage {
          from_profile_id: string;
          text: string;
          created_at: string;
        }
        const meta = conn.metadata as {
          auto_intro?: string;
          thread?: ThreadMessage[];
        } | null;

        if (!messageText && meta?.auto_intro) {
          messageText = meta.auto_intro;
        }

        // Check if provider has responded in the thread
        const thread = Array.isArray(meta?.thread) ? meta.thread : [];
        const providerResponded = thread.some(
          (msg) => msg.from_profile_id === profileId
        );

        // Use profile data first, fall back to message JSON data
        return {
          id: conn.id,
          from_name: seeker?.display_name || msgSeekerName || "Anonymous",
          from_email: seeker?.resolvedEmail || msgSeekerEmail || null,
          message: messageText,
          care_type: careType,
          timeline: timeline,
          created_at: conn.created_at,
          provider_responded: providerResponded,
          response_count: thread.length,
        };
      });
    }

    // Fetch all questions for this provider (by slug)
    if (slug) {
      const { data: questions } = await db
        .from("provider_questions")
        .select("id, question, answer, asker_name, asker_email, status, created_at, answered_at")
        .eq("provider_id", slug)
        .order("created_at", { ascending: false })
        .limit(20); // Limit to most recent 20

      if (questions) {
        result.questions = questions.map((q) => ({
          id: q.id,
          question_text: q.question,
          asker_name: q.asker_name || null,
          asker_email: q.asker_email || null,
          answer: q.answer || null,
          status: q.status || "pending",
          created_at: q.created_at,
          answered_at: q.answered_at || null,
        }));
      }
    }

    return result;
  } catch (error) {
    console.error("Error fetching provider engagement:", error);
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
    const engagementParam = searchParams.get("engagement") || ""; // has_leads, has_questions, has_any

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

    // Apply engagement filter (has_leads, has_questions, has_any)
    // We only need to know presence (has at least 1), not exact counts
    if (engagementParam) {
      const profileIds = filtered.map((p) => p.id);

      // Track which providers have leads or questions (using Sets for efficiency)
      const providersWithLeads = new Set<string>();
      const providersWithQuestions = new Set<string>();

      if (profileIds.length > 0) {
        // Find providers with at least one inquiry
        // Select distinct to_profile_id values only
        const { data: leadData } = await db
          .from("connections")
          .select("to_profile_id")
          .in("to_profile_id", profileIds)
          .eq("type", "inquiry")
          .limit(5000); // Safety limit

        if (leadData) {
          for (const conn of leadData) {
            providersWithLeads.add(conn.to_profile_id);
          }
        }

        // Find providers with at least one question (by slug)
        // Build slug -> profile id map first
        const slugToId = new Map<string, string>();
        for (const p of filtered) {
          const slug = (p as { slug?: string | null }).slug;
          if (slug) slugToId.set(slug, p.id);
        }

        const slugs = [...slugToId.keys()];

        if (slugs.length > 0) {
          const { data: questionData } = await db
            .from("provider_questions")
            .select("provider_id")
            .in("provider_id", slugs)
            .limit(5000); // Safety limit

          if (questionData) {
            for (const q of questionData) {
              const profileId = slugToId.get(q.provider_id);
              if (profileId) {
                providersWithQuestions.add(profileId);
              }
            }
          }
        }
      }

      // Filter based on engagement type
      filtered = filtered.filter((p) => {
        const hasLeads = providersWithLeads.has(p.id);
        const hasQuestions = providersWithQuestions.has(p.id);

        if (engagementParam === "has_leads") return hasLeads;
        if (engagementParam === "has_questions") return hasQuestions;
        if (engagementParam === "has_any") return hasLeads || hasQuestions;
        return true;
      });
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

    // Fetch claim journey and engagement data for all providers in parallel
    const claimJourneyPromises = paginated.map(
      (p: { id: string; slug?: string | null }) =>
        getClaimJourney(db, p.slug || null, p.id)
    );
    const engagementPromises = paginated.map(
      (p: { id: string; slug?: string | null }) =>
        getProviderEngagement(db, p.slug || null, p.id)
    );
    const [claimJourneys, engagements] = await Promise.all([
      Promise.all(claimJourneyPromises),
      Promise.all(engagementPromises),
    ]);

    // Add claimer_email, claim_journey, and engagement to each provider
    const providersWithData = paginated.map(
      (p: { account_id?: string }, index: number) => ({
        ...p,
        claimer_email: p.account_id ? accountEmailMap.get(p.account_id) || null : null,
        claim_journey: {
          ...claimJourneys[index],
          all_engagement: engagements[index],
        },
      })
    );

    return NextResponse.json({ providers: providersWithData, total: filtered.length });
  } catch (err) {
    console.error("Admin badge requests error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/verification
 *
 * Bulk delete providers from verification lists.
 * Body: { ids: string[] }
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const adminUser = await getAdminUser(user.id);
    if (!adminUser) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await request.json();
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "ids array is required" }, { status: 400 });
    }

    const db = getServiceClient();

    // Fetch names before deleting for audit
    const { data: toDelete } = await db
      .from("business_profiles")
      .select("id, display_name")
      .in("id", ids);

    const { error: deleteError, count } = await db
      .from("business_profiles")
      .delete({ count: "exact" })
      .in("id", ids)
      .in("type", ["organization", "caregiver"]);

    if (deleteError) {
      console.error("Bulk verification delete error:", deleteError);
      return NextResponse.json({ error: "Failed to delete providers" }, { status: 500 });
    }

    // Clear active_profile_id for accounts that referenced deleted profiles
    await db
      .from("accounts")
      .update({ active_profile_id: null, updated_at: new Date().toISOString() })
      .in("active_profile_id", ids);

    // Log audit action - use singular/plural based on count
    const deletedCount = count ?? ids.length;
    await logAuditAction({
      adminUserId: adminUser.id,
      action: deletedCount === 1 ? "delete_provider" : "delete_providers",
      targetType: "business_profile",
      targetId: deletedCount === 1 ? ids[0] : "bulk",
      details: {
        ids,
        names: toDelete?.map((p) => p.display_name) || [],
        count: deletedCount,
        source: "verification",
      },
    });

    return NextResponse.json({ success: true, deleted: count ?? ids.length });
  } catch (err) {
    console.error("Bulk verification delete error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
