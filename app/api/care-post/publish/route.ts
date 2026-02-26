import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";

/**
 * POST /api/care-post/publish
 *
 * Updates metadata.care_post on the user's business_profiles record.
 * Actions: "publish" | "deactivate"
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
    const { action } = body as { action: "publish" | "deactivate" };

    if (!action || !["publish", "deactivate"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

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
      .select("id, metadata, type")
      .eq("id", account.active_profile_id)
      .single();

    if (!profile || profile.type !== "family") {
      return NextResponse.json({ error: "Family profile required" }, { status: 400 });
    }

    const metadata = (profile.metadata || {}) as Record<string, unknown>;

    if (action === "publish") {
      metadata.care_post = {
        status: "active",
        published_at: new Date().toISOString(),
      };
    } else {
      metadata.care_post = {
        status: "paused",
        ...(typeof metadata.care_post === "object" && metadata.care_post !== null
          ? { published_at: (metadata.care_post as Record<string, unknown>).published_at }
          : {}),
      };
    }

    const { error: updateError } = await supabase
      .from("business_profiles")
      .update({ metadata })
      .eq("id", profile.id);

    if (updateError) {
      console.error("Care post update error:", updateError);
      return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }

    return NextResponse.json({ success: true, care_post: metadata.care_post });
  } catch (err) {
    console.error("Care post error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
