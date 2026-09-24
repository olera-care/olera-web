import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { calculateCompleteness } from "@/lib/medjobs-completeness";
import type { StudentMetadata } from "@/lib/types";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export interface ApprovalBlock {
  type: "no_edu" | "needs_review" | "pending_review" | "rejected";
  message: string;
  action?: { label: string; href?: string; api?: string };
  rejectionReason?: string;
}

export interface CheckApprovalResponse {
  blocked: boolean;
  block?: ApprovalBlock;
}

/**
 * GET /api/medjobs/check-approval
 *
 * Check the student's approval status before allowing interview submission.
 * Called at the final step of the apply flow to give specific guidance.
 *
 * Returns:
 * - blocked: false if student can submit
 * - blocked: true + block info if student needs to take action
 */
export async function GET() {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = getAdminClient();

    const { data: account } = await admin
      .from("accounts")
      .select("id")
      .eq("user_id", user.id)
      .single();
    if (!account) {
      return NextResponse.json({ error: "No account" }, { status: 403 });
    }

    const { data: student } = await admin
      .from("business_profiles")
      .select("id, display_name, email, phone, city, state, image_url, is_active, metadata")
      .eq("account_id", account.id)
      .eq("type", "student")
      .single();
    if (!student) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
    }

    const meta = (student.metadata ?? {}) as StudentMetadata & {
      application_completed?: boolean;
      review_requested_at?: string;
      rejected_at?: string;
      rejection_reason?: string;
    };

    // Calculate completeness
    const hasPhoto = !!student.image_url;
    const hasBasicInfo = {
      hasName: !!student.display_name,
      hasEmail: !!student.email,
      hasPhone: !!student.phone,
      hasUniversity: !!meta.university,
      hasLocation: !!(student.city && student.state),
    };
    const completeness = calculateCompleteness(meta, hasPhoto, hasBasicInfo);

    // State 1: Profile incomplete (shouldn't reach here, but safety check)
    if (completeness < 100) {
      return NextResponse.json<CheckApprovalResponse>({
        blocked: true,
        block: {
          type: "needs_review", // Use generic type for incomplete profile
          message: "Complete your profile before applying.",
          action: { label: "Complete Profile", href: "/portal/medjobs" },
        },
      });
    }

    // State 6: Approved (application_completed set = admin approved)
    // Note: When admin approves, is_active is also set to true
    if (meta.application_completed) {
      return NextResponse.json<CheckApprovalResponse>({ blocked: false });
    }

    // State 2: No .edu email
    const email = student.email?.trim().toLowerCase() || "";
    if (!email.endsWith(".edu")) {
      return NextResponse.json<CheckApprovalResponse>({
        blocked: true,
        block: {
          type: "no_edu",
          message: "Add your university email (.edu) to get verified.",
          action: { label: "Update Email", href: "/portal/medjobs" },
        },
      });
    }

    // State 5: Rejected — check if rejection happened AFTER the review request
    // (rejected_at > review_requested_at means admin reviewed and rejected)
    if (meta.rejected_at) {
      const rejectedAfterRequest = !meta.review_requested_at ||
        new Date(meta.rejected_at) > new Date(meta.review_requested_at);

      if (rejectedAfterRequest) {
        return NextResponse.json<CheckApprovalResponse>({
          blocked: true,
          block: {
            type: "rejected",
            message: meta.rejection_reason || "Your profile was not approved. Update your profile and request approval again.",
            action: { label: "Request Approval Again", api: "/api/medjobs/request-review" },
            rejectionReason: meta.rejection_reason,
          },
        });
      }
    }

    // State 4: Pending review (has review_requested_at that's newer than any rejection)
    if (meta.review_requested_at) {
      return NextResponse.json<CheckApprovalResponse>({
        blocked: true,
        block: {
          type: "pending_review",
          message: "Your profile is being reviewed. We'll email you when you're approved to start applying to providers.",
        },
      });
    }

    // State 3: Hasn't requested review yet (has .edu, 100% complete, no request)
    return NextResponse.json<CheckApprovalResponse>({
      blocked: true,
      block: {
        type: "needs_review",
        message: "Your profile is 100% complete! Request approval to start applying to providers.",
        action: { label: "Request Approval", api: "/api/medjobs/request-review" },
      },
    });
  } catch (err) {
    console.error("[medjobs/check-approval] GET error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
