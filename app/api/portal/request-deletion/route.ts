import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { getServiceClient } from "@/lib/admin";

/**
 * POST /api/portal/request-deletion
 *
 * Provider requests deletion of their claimed listing.
 * Sets deletion_requested=true on business_profiles — does NOT delete anything.
 * Admin must approve from the admin dashboard before the listing is removed.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { profileId } = (await request.json()) as { profileId?: string };
    if (!profileId) {
      return NextResponse.json(
        { error: "Missing profileId" },
        { status: 400 }
      );
    }

    const admin = getServiceClient();

    // Get caller's account
    const { data: account, error: accountError } = await admin
      .from("accounts")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (accountError || !account) {
      return NextResponse.json(
        { error: "Account not found" },
        { status: 400 }
      );
    }

    // Fetch profile and verify ownership
    const { data: profile, error: profileError } = await admin
      .from("business_profiles")
      .select(
        "id, account_id, source_provider_id, type, deletion_requested, display_name"
      )
      .eq("id", profileId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    if (profile.account_id !== account.id) {
      return NextResponse.json(
        { error: "Not authorized" },
        { status: 403 }
      );
    }

    // Only organization/caregiver profiles can request deletion
    if (profile.type === "family") {
      return NextResponse.json(
        { error: "Family profiles cannot request listing deletion." },
        { status: 400 }
      );
    }

    // Prevent duplicate requests
    if (profile.deletion_requested) {
      return NextResponse.json(
        { error: "A deletion request is already pending for this listing." },
        { status: 409 }
      );
    }

    // Set deletion_requested flag
    const { error: updateError } = await admin
      .from("business_profiles")
      .update({
        deletion_requested: true,
        deletion_requested_at: new Date().toISOString(),
      })
      .eq("id", profileId);

    if (updateError) {
      console.error("[request-deletion] update failed:", updateError);
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[request-deletion] error:", err);
    return NextResponse.json(
      { error: "Failed to submit deletion request" },
      { status: 500 }
    );
  }
}
