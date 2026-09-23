import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient, logAuditAction } from "@/lib/admin";
import { sendEmail } from "@/lib/email";
import { studentReturningEmail } from "@/lib/medjobs-email-templates";
import { generateStudentPortalUrl } from "@/lib/claim-tokens";

/**
 * POST /api/admin/caregivers/[caregiverId]/send-magic-link
 *
 * Email a student a one-click sign-in link, on demand, from the admin screen.
 *
 * Why this exists: a student who cannot receive Supabase's login code has no
 * way back into their own application, and the only workarounds were a curl
 * against the admin API or talking them through a form. This is the button to
 * press while you have them on the phone.
 *
 * It deliberately does NOT use Supabase's own email. Supabase auth mail goes
 * out through the SMTP sender configured in its dashboard, which is a separate
 * domain from the one the app sends on and is not visible in email_log. This
 * sends through lib/email like every other transactional message, so it uses
 * the domain with the delivery record and lands in the log where it can be
 * checked afterwards.
 *
 * The link is one of ours rather than a Supabase magic link: fifteen days
 * rather than one hour, which matters when the person you just called opens
 * their email tomorrow.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ caregiverId: string }> },
) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const adminUser = await getAdminUser(user.id);
    if (!adminUser) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const { caregiverId: studentId } = await params;
    const db = getServiceClient();

    const { data: student, error: fetchError } = await db
      .from("business_profiles")
      .select("id, slug, display_name, email")
      .eq("id", studentId)
      .eq("type", "student")
      .single();

    if (fetchError || !student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }
    if (!student.email) {
      return NextResponse.json(
        { error: "This student has no email address on file." },
        { status: 400 },
      );
    }

    // Signing in needs an auth user to sign in AS. A profile whose auth user
    // was never created, or was deleted, would take the link and drop them on
    // a signed-out page — which is the same silent dead end this button
    // exists to escape. Say it here, where somebody can act on it.
    //
    // generateLink resolves the user without sending anything; it is the same
    // call apply-partial uses to find an existing account.
    const { data: existing } = await db.auth.admin.generateLink({
      type: "magiclink",
      email: student.email,
    });
    if (!existing?.user?.id) {
      return NextResponse.json(
        {
          error:
            "No sign-in account exists for this email, so a link would not log them in. " +
            "The account needs creating first.",
        },
        { status: 409 },
      );
    }

    const portalUrl = generateStudentPortalUrl(student.email, "/portal/medjobs");

    const result = await sendEmail({
      to: student.email,
      subject: "Your Olera MedJobs sign-in link",
      html: studentReturningEmail({
        studentName: student.display_name || "there",
        profileSlug: student.slug || "",
        magicLink: portalUrl,
      }),
      emailType: "student_magic_link",
      recipientType: "student",
      recipientProfileId: studentId,
    });

    // Unlike the approval email, this one is the whole point of the request.
    // A silent failure here is how somebody tells a student on the phone that
    // it is on its way when it is not.
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "The email could not be sent." },
        { status: 502 },
      );
    }
    if (result.skipped) {
      return NextResponse.json(
        { error: `Not sent — ${result.skipReason ?? "suppressed"}.` },
        { status: 409 },
      );
    }

    await logAuditAction({
      adminUserId: user.id,
      action: "student_magic_link_sent",
      targetType: "student",
      targetId: studentId,
      details: { studentEmail: student.email, sentBy: adminUser.email || user.id },
    });

    return NextResponse.json({ ok: true, sentTo: student.email });
  } catch (err) {
    console.error("[admin/send-magic-link] error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
