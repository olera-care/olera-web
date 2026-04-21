import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * POST /api/medjobs/check-email
 *
 * Checks if an email is already associated with a student profile.
 * Used to detect returning users early in the apply flow.
 *
 * Returns:
 * - { exists: false } - new user, continue with apply flow
 * - { exists: true, completed: false } - incomplete profile, continue with apply flow
 * - { exists: true, completed: true, displayName, slug } - completed profile, offer dashboard link
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email?.trim()) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const supabase = getSupabaseAdmin();

    const { data: profile } = await supabase
      .from("business_profiles")
      .select("id, slug, display_name, metadata")
      .eq("email", normalizedEmail)
      .eq("type", "student")
      .limit(1)
      .maybeSingle();

    if (!profile) {
      return NextResponse.json({ exists: false });
    }

    const metadata = (profile.metadata || {}) as Record<string, unknown>;
    const applicationCompleted = metadata.application_completed === true;

    if (!applicationCompleted) {
      // Incomplete profile - let them continue to fill out the form
      return NextResponse.json({ exists: true, completed: false });
    }

    // Completed profile - returning user
    return NextResponse.json({
      exists: true,
      completed: true,
      displayName: profile.display_name,
      slug: profile.slug,
    });
  } catch (err) {
    console.error("[medjobs/check-email] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
