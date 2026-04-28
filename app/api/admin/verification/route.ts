import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * GET /api/admin/verification
 *
 * List business profiles with badge requests.
 * Query params: status (default: "pending"), limit, offset
 *
 * Status filters:
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

    const db = getServiceClient();

    // Fetch profiles that need verification review
    // We need to check for:
    // 1. Old flow: verification_submission exists
    // 2. New flow: verification_attempts exists OR email_otp_attempt exists
    // 3. Any profile with verification_state = "pending"
    // Using JS filtering since Supabase JSONB OR queries are unreliable
    const { data: allProviders, error } = await db
      .from("business_profiles")
      .select("id, display_name, type, category, city, state, verification_state, metadata, created_at, updated_at, email, phone, image_url, slug")
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

    if (status === "pending") {
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
      // Include both admin-approved (badge_approved) and self-verified (verification_state)
      // Exclude providers whose badge was revoked (badge_rejected)
      filtered = filtered.filter((p) => {
        const meta = p.metadata as ProfileMetadata | null;
        const isApproved = meta?.badge_approved === true || p.verification_state === "verified";
        const isRevoked = meta?.badge_rejected === true;
        return isApproved && !isRevoked;
      });
    } else if (status === "rejected") {
      filtered = filtered.filter((p) => {
        const meta = p.metadata as ProfileMetadata | null;
        return meta?.badge_rejected === true;
      });
    }

    // Apply pagination after filtering
    const paginated = filtered.slice(offset, offset + limit);

    return NextResponse.json({ providers: paginated });
  } catch (err) {
    console.error("Admin badge requests error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
