import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";
import { sendEmail } from "@/lib/email";
import { profileIncompleteNudgeEmail } from "@/lib/medjobs-email-templates";

/**
 * GET /api/cron/medjobs-nudge
 *
 * Runs daily at 10 AM CT (15:00 UTC).
 * Nudges students with incomplete profiles (< 70%) who signed up 48h+ ago
 * and haven't been nudged in the last 7 days.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getServiceClient();
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

    // Find incomplete student profiles created > 48h ago
    // Include inactive profiles — students who haven't submitted video yet need nudging most
    const { data: students, error } = await db
      .from("business_profiles")
      .select("id, slug, display_name, email, metadata, is_active")
      .eq("type", "student")
      .lte("created_at", twoDaysAgo)
      .not("email", "is", null);

    if (error) {
      console.error("[medjobs-nudge] query error:", error);
      return NextResponse.json({ error: "Query failed" }, { status: 500 });
    }

    let nudged = 0;

    for (const student of (students || [])) {
      const meta = student.metadata as Record<string, unknown>;
      const completeness = (meta.profile_completeness as number) ?? 0;

      // Skip if profile is already >= 70% complete
      if (completeness >= 70) continue;

      // Skip if nudged in last 7 days
      const lastNudge = meta.last_nudge_sent_at as string | undefined;
      if (lastNudge) {
        const daysSinceNudge = (Date.now() - new Date(lastNudge).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceNudge < 7) continue;
      }

      // Determine what's missing (required items first)
      const missingItems: string[] = [];
      if (meta.application_completed === false) missingItems.push("Finish your application");
      if (!meta.video_intro_url) missingItems.push("Submit your intro video (required)");
      if (!meta.drivers_license_url) missingItems.push("Upload driver's license (required)");
      if (!meta.car_insurance_url) missingItems.push("Upload car insurance (required)");
      if (!meta.resume_url) missingItems.push("Upload your resume");
      if (!meta.certifications || (meta.certifications as string[]).length === 0) missingItems.push("Add certifications (CNA, BLS, etc.)");
      if (!meta.availability_types || (meta.availability_types as string[]).length === 0) missingItems.push("Specify your availability");
      if (!meta.major) missingItems.push("Add your major");

      if (missingItems.length === 0) continue;

      try {
        await sendEmail({
          to: student.email!,
          subject: "Complete your MedJobs profile to get noticed",
          html: profileIncompleteNudgeEmail({
            studentName: student.display_name,
            completeness,
            missingItems: missingItems.slice(0, 4),
          }),
        });

        // Update last_nudge_sent_at
        await db
          .from("business_profiles")
          .update({
            metadata: {
              ...meta,
              last_nudge_sent_at: new Date().toISOString(),
            },
          })
          .eq("id", student.id);

        nudged++;
      } catch (err) {
        console.error(`[medjobs-nudge] error for ${student.email}:`, err);
      }
    }

    return NextResponse.json({ nudged });
  } catch (err) {
    console.error("[medjobs-nudge] unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
