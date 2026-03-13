import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import { matchesLiveEmail } from "@/lib/email-templates";

/**
 * POST /api/care-post/activate-matches
 *
 * Activates the family's Matches profile and sends a confirmation email.
 * This is triggered from the Benefits Finder results page when a user
 * clicks "Yes, let providers find me".
 */
export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { city } = body as { city?: string };

    // Get user's family profile
    const { data: account } = await supabase
      .from("accounts")
      .select("active_profile_id")
      .eq("user_id", user.id)
      .single();

    if (!account?.active_profile_id) {
      return NextResponse.json({ error: "No active profile" }, { status: 400 });
    }

    const { data: profile } = await supabase
      .from("business_profiles")
      .select("id, metadata, type, display_name")
      .eq("id", account.active_profile_id)
      .single();

    if (!profile || profile.type !== "family") {
      return NextResponse.json({ error: "Family profile required" }, { status: 400 });
    }

    const metadata = (profile.metadata || {}) as Record<string, unknown>;

    // Check if already active
    const carePost = metadata.care_post as { status?: string } | undefined;
    if (carePost?.status === "active") {
      return NextResponse.json({ error: "Matches already active" }, { status: 400 });
    }

    // Ensure timeline is set (required for care post)
    if (!metadata.timeline) {
      metadata.timeline = "exploring";
    }

    // Publish the care post
    metadata.care_post = {
      status: "active",
      published_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabase
      .from("business_profiles")
      .update({ metadata })
      .eq("id", profile.id);

    if (updateError) {
      console.error("Matches activation error:", updateError);
      return NextResponse.json({ error: "Failed to activate" }, { status: 500 });
    }

    // Send confirmation email
    const userEmail = user.email;
    const familyName = profile.display_name || "there";
    const locationCity = city || "your area";
    const matchesUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://olera.care"}/portal/matches`;

    if (userEmail) {
      await sendEmail({
        to: userEmail,
        subject: "Your Matches profile is live",
        html: matchesLiveEmail({
          familyName,
          city: locationCity,
          matchesUrl,
        }),
      });
    }

    return NextResponse.json({
      success: true,
      care_post: metadata.care_post,
    });
  } catch (err) {
    console.error("Matches activation error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
