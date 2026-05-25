import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { getServiceClient } from "@/lib/admin";
import { sendLoopsEventBoth } from "@/lib/loops";

export async function DELETE() {
  try {
    // Get authenticated user from cookies
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

    const admin = getServiceClient();

    // Get account ID first
    const { data: account } = await admin
      .from("accounts")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!account) {
      // No account found — just delete auth user
      const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
      if (deleteError) {
        console.error("[olera] deleteUser failed:", deleteError);
      }
      return NextResponse.json({ success: true });
    }

    // Get profiles with metadata to extract enrichment session IDs
    const { data: profiles } = await admin
      .from("business_profiles")
      .select("id, metadata")
      .eq("account_id", account.id);

    const profileIds = (profiles || []).map((p: { id: string }) => p.id);

    // Extract enrichment session IDs from profile metadata
    const sessionIds = (profiles || [])
      .map((p: { metadata?: { enrichment_session_id?: string } }) =>
        p.metadata?.enrichment_session_id
      )
      .filter((id): id is string => !!id);

    if (profileIds.length > 0) {
      // Delete connections
      await admin
        .from("connections")
        .delete()
        .or(
          profileIds
            .map(
              (id: string) =>
                `from_profile_id.eq.${id},to_profile_id.eq.${id}`
            )
            .join(",")
        );

      // Delete provider_activity records by profile_id (for non-anonymous events)
      await admin
        .from("provider_activity")
        .delete()
        .in("profile_id", profileIds);

      // Delete seeker_activity records
      await admin
        .from("seeker_activity")
        .delete()
        .in("profile_id", profileIds);
    }

    // Delete provider_activity records by session_id (for anonymous enrichment events)
    // These events have profile_id=null but can be linked via session_id in metadata
    if (sessionIds.length > 0) {
      for (const sessionId of sessionIds) {
        await admin
          .from("provider_activity")
          .delete()
          .filter("metadata->>session_id", "eq", sessionId);
      }
    }

    // Delete business profiles
    await admin
      .from("business_profiles")
      .delete()
      .eq("account_id", account.id);

    // Delete memberships
    await admin
      .from("memberships")
      .delete()
      .eq("account_id", account.id);

    // Delete account
    await admin.from("accounts").delete().eq("id", account.id);

    // Delete auth user
    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
    if (deleteError) {
      console.error("[olera] deleteUser failed:", deleteError);
      // Non-fatal — data is already cleaned up
    }

    // Loops: account deleted for suppression/cleanup (fire-and-forget)
    try {
      await sendLoopsEventBoth({
        email: user.email || "",
        eventName: "account_deleted",
      });
    } catch {
      // Non-blocking
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[olera] delete-account error:", err);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}
