import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { slackMedJobsProfileComplete } from "@/lib/slack";
import type { StudentMetadata } from "@/lib/types";

const SLACK_WEBHOOK = process.env.SLACK_MEDJOBS_WEBHOOK_URL;

function getAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * POST /api/medjobs/notify-completeness
 *
 * Called when a student profile might have reached 100% completeness.
 * Sends a one-time Slack notification so admins can proactively approve.
 */
export async function POST(req: NextRequest) {
  try {
    // Auth check - must be the profile owner
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const { profileId, completenessPercent } = body;

    if (!profileId || typeof completenessPercent !== "number") {
      return NextResponse.json({ error: "profileId and completenessPercent required" }, { status: 400 });
    }

    // Only proceed if 100% complete
    if (completenessPercent < 100) {
      return NextResponse.json({ notified: false, reason: "not_complete" });
    }

    const adminSb = getAdminSupabase();

    // Get the profile and verify ownership
    const { data: profile } = await adminSb
      .from("business_profiles")
      .select("id, display_name, city, state, metadata, account_id")
      .eq("id", profileId)
      .eq("type", "student")
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Verify the user owns this profile
    const { data: account } = await adminSb
      .from("accounts")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!account || profile.account_id !== account.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const meta = (profile.metadata || {}) as StudentMetadata;

    // Already notified? Skip
    if (meta.completeness_100_notified_at) {
      return NextResponse.json({ notified: false, reason: "already_notified" });
    }

    // Already requested review or approved? Skip (they'll get other notifications)
    if (meta.review_requested_at || meta.approved_by) {
      return NextResponse.json({ notified: false, reason: "review_in_progress" });
    }

    // Require webhook to be configured
    if (!SLACK_WEBHOOK) {
      console.warn("[notify-completeness] SLACK_MEDJOBS_WEBHOOK_URL not configured");
      return NextResponse.json({ notified: false, reason: "webhook_not_configured" });
    }

    // Send Slack notification
    const message = slackMedJobsProfileComplete({
      studentName: profile.display_name || "Unknown",
      studentId: profile.id,
      university: meta.university || "Unknown",
      location: [profile.city, profile.state].filter(Boolean).join(", ") || "Unknown",
    });

    const slackRes = await fetch(SLACK_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message),
    });

    if (!slackRes.ok) {
      console.error("[notify-completeness] Slack returned", slackRes.status);
      return NextResponse.json({ notified: false, reason: "slack_error" });
    }

    // Mark as notified
    const { error: updateError } = await adminSb
      .from("business_profiles")
      .update({
        metadata: {
          ...meta,
          completeness_100_notified_at: new Date().toISOString(),
        },
      })
      .eq("id", profileId);

    if (updateError) {
      // Slack was sent but flag wasn't set - log for debugging duplicate notifications
      console.error("[notify-completeness] Failed to mark as notified:", updateError);
    }

    return NextResponse.json({ notified: true });
  } catch (err) {
    console.error("[notify-completeness] error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
