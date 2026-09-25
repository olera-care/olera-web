import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient, logAuditAction } from "@/lib/admin";
import { sendEmail } from "@/lib/email";
import { medjobsProfileRevokedEmail } from "@/lib/medjobs-email-templates";
import { generateStudentPortalUrl } from "@/lib/claim-tokens";
import type { StudentMetadata } from "@/lib/types";

/**
 * POST /api/admin/caregivers/[caregiverId]/revoke
 *
 * Admin action to revoke a student's profile approval.
 * This sets is_active: false and clears application_completed,
 * making the profile no longer visible to providers.
 * The student can request review again to get re-approved.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ caregiverId: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const adminUser = await getAdminUser(user.id);
    if (!adminUser) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const { caregiverId: studentId } = await params;
    const db = getServiceClient();

    // Parse optional revocation reason from body
    let reason: string | undefined;
    try {
      const body = await request.json();
      reason = body.reason;
    } catch {
      // No body or invalid JSON is fine
    }

    // Fetch student profile
    const { data: student, error: fetchError } = await db
      .from("business_profiles")
      .select("id, slug, display_name, email, metadata")
      .eq("id", studentId)
      .eq("type", "student")
      .single();

    if (fetchError || !student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const meta = (student.metadata ?? {}) as StudentMetadata & {
      application_completed?: boolean;
      approved_at?: string;
      approved_by?: string;
      revoked_at?: string;
      revoked_by?: string;
      revocation_reason?: string;
    };

    // Verify the student was actually approved
    if (!meta.application_completed) {
      return NextResponse.json({ error: "Student is not currently approved" }, { status: 400 });
    }

    // Update: set is_active: false, clear application_completed and approved_by, record revocation
    // Clearing approved_by is critical - it prevents the student from calling /api/medjobs/go-live
    // to bypass the revocation. They must request review again and get re-approved.
    const nowIso = new Date().toISOString();
    const updatedMeta = {
      ...meta,
      application_completed: false,
      approved_by: null, // Clear so student can't bypass via go-live endpoint
      revoked_at: nowIso,
      revoked_by: adminUser.email || user.id,
      revocation_reason: reason || undefined,
    };

    const { error: updateError } = await db
      .from("business_profiles")
      .update({
        is_active: false,
        metadata: updatedMeta,
        updated_at: nowIso,
      })
      .eq("id", studentId);

    if (updateError) {
      console.error("[admin/caregivers/revoke] update error:", updateError);
      return NextResponse.json({ error: "Failed to revoke approval" }, { status: 500 });
    }

    // Log audit action
    await logAuditAction({
      adminUserId: user.id,
      action: "student_approval_revoked",
      targetType: "student",
      targetId: studentId,
      details: {
        studentName: student.display_name,
        studentEmail: student.email,
        reason,
      },
    });

    // Send revocation email to student with one-click magic link
    if (student.email) {
      try {
        const portalUrl = generateStudentPortalUrl(student.email, "/portal/medjobs");
        await sendEmail({
          to: student.email,
          subject: "Your MedJobs profile needs attention",
          html: medjobsProfileRevokedEmail({
            studentName: student.display_name || "there",
            reason,
            portalUrl,
          }),
          emailType: "medjobs_profile_revoked",
          recipientType: "student",
          recipientProfileId: studentId,
        });
      } catch (emailErr) {
        // Non-blocking - log but don't fail the revocation
        console.error("[admin/caregivers/revoke] email error:", emailErr);
      }
    }

    return NextResponse.json({
      ok: true,
      message: "Student approval revoked. Profile is no longer visible to providers.",
    });
  } catch (err) {
    console.error("[admin/caregivers/revoke] error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
