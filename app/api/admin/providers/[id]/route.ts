import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient, logAuditAction } from "@/lib/admin";
import { sendSlackAlert, slackProviderAction } from "@/lib/slack";
import { sendEmail } from "@/lib/email";
import { claimDecisionEmail } from "@/lib/email-templates";
import { sendLoopsEvent } from "@/lib/loops";

/**
 * PATCH /api/admin/providers/[id]
 *
 * Approve or reject a provider claim.
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

    const newState = action === "approve" ? "claimed" : "rejected";
    const db = getServiceClient();

    const { data: profile, error: updateError } = await db
      .from("business_profiles")
      .update({ claim_state: newState, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("id, display_name, claim_state, account_id, slug")
      .single();

    if (updateError) {
      console.error("Failed to update provider:", updateError);
      return NextResponse.json({ error: "Failed to update provider" }, { status: 500 });
    }

    // Log audit action
    await logAuditAction({
      adminUserId: adminUser.id,
      action: action === "approve" ? "approve_provider" : "reject_provider",
      targetType: "business_profile",
      targetId: id,
      details: {
        provider_name: profile?.display_name,
        new_state: newState,
      },
    });

    // Slack alert (fire-and-forget)
    try {
      const alert = slackProviderAction({
        providerName: profile?.display_name || id,
        action: action === "approve" ? "approved" : "rejected",
        adminEmail: user.email || "admin",
      });
      await sendSlackAlert(alert.text, alert.blocks);
    } catch {
      // Non-blocking
    }

    // Email + Loops notification to provider (fire-and-forget)
    try {
      console.log("[admin] Email block: account_id =", profile?.account_id);
      if (profile?.account_id) {
        const { data: authUser, error: authError } = await db.auth.admin.getUserById(profile.account_id);
        console.log("[admin] getUserById result:", { email: authUser?.user?.email, error: authError?.message });
        const providerEmail = authUser?.user?.email;
        if (providerEmail) {
          const listingUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://olera.care"}/provider/${profile.slug || id}`;
          const emailResult = await sendEmail({
            to: providerEmail,
            subject: action === "approve"
              ? "Your Olera listing is live!"
              : "Your Olera claim needs attention",
            html: claimDecisionEmail({
              providerName: profile.display_name || "Your organization",
              approved: action === "approve",
              listingUrl,
            }),
          });
          console.log("[admin] Email send result:", emailResult);
          const loopsResult = await sendLoopsEvent({
            email: providerEmail,
            eventName: action === "approve" ? "provider_approved" : "provider_rejected",
            audience: "provider",
            eventProperties: {
              providerName: profile.display_name || "",
            },
          });
          console.log("[admin] Loops send result:", loopsResult);
        } else {
          console.warn("[admin] No email found for account_id:", profile.account_id);
        }
      } else {
        console.warn("[admin] No account_id on profile");
      }
    } catch (emailErr) {
      console.error("[admin] Email/Loops block error:", emailErr);
    }

    return NextResponse.json({ profile });
  } catch (err) {
    console.error("Admin provider action error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
