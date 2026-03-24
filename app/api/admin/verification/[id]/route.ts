import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient, logAuditAction } from "@/lib/admin";
import { sendSlackAlert } from "@/lib/slack";
import { sendEmail } from "@/lib/email";
import { verificationDecisionEmail } from "@/lib/email-templates";
import { sendLoopsEvent } from "@/lib/loops";

/**
 * PATCH /api/admin/verification/[id]
 *
 * Approve or reject provider identity verification.
 * Body: { action: "approve" | "reject" }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const adminUser = await getAdminUser(user.id);
    if (!adminUser) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const action = body.action as string;

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'approve' or 'reject'." },
        { status: 400 }
      );
    }

    const newState = action === "approve" ? "verified" : "unverified";
    const db = getServiceClient();

    const { data: profile, error: updateError } = await db
      .from("business_profiles")
      .update({ verification_state: newState, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("id, display_name, verification_state, account_id, slug")
      .single();

    if (updateError) {
      console.error("Failed to update verification:", updateError);
      return NextResponse.json({ error: "Failed to update verification" }, { status: 500 });
    }

    // Log audit action
    await logAuditAction({
      adminUserId: adminUser.id,
      action: action === "approve" ? "approve_verification" : "reject_verification",
      targetType: "business_profile",
      targetId: id,
      details: {
        provider_name: profile?.display_name,
        new_state: newState,
      },
    });

    // Slack alert (fire-and-forget)
    try {
      const emoji = action === "approve" ? ":white_check_mark:" : ":x:";
      const text = `${emoji} *Verification ${action}d* — ${profile?.display_name || id} by ${user.email}`;
      await sendSlackAlert(text);
    } catch {
      // Non-blocking
    }

    // Email + Loops notification to provider (fire-and-forget)
    try {
      if (profile?.account_id) {
        const { data: account } = await db
          .from("accounts")
          .select("user_id")
          .eq("id", profile.account_id)
          .single();
        if (account?.user_id) {
          const { data: authUser } = await db.auth.admin.getUserById(account.user_id);
          const providerEmail = authUser?.user?.email;
          if (providerEmail) {
            const listingUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://olera.care"}/provider/${profile.slug || id}`;
            await sendEmail({
              to: providerEmail,
              subject: action === "approve"
                ? "Your Olera profile is now verified!"
                : "Your Olera verification needs attention",
              html: verificationDecisionEmail({
                providerName: profile.display_name || "Your organization",
                approved: action === "approve",
                listingUrl,
              }),
              emailType: "verification_decision",
              recipientType: "provider",
              providerId: id,
            });
            await sendLoopsEvent({
              email: providerEmail,
              eventName: action === "approve" ? "verification_approved" : "verification_rejected",
              audience: "provider",
              eventProperties: {
                providerName: profile.display_name || "",
              },
            });
          }
        }
      }
    } catch {
      // Non-blocking
    }

    return NextResponse.json({ profile });
  } catch (err) {
    console.error("Admin verification action error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
