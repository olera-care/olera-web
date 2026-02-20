import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { getServiceClient } from "@/lib/admin";

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

    // Delete connections (both directions)
    const { data: profiles } = await admin
      .from("business_profiles")
      .select("id")
      .eq("account_id", (
        await admin
          .from("accounts")
          .select("id")
          .eq("user_id", user.id)
          .single()
      ).data?.id || "");

    const profileIds = (profiles || []).map((p: { id: string }) => p.id);

    if (profileIds.length > 0) {
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
    }

    // Delete business profiles
    const { data: account } = await admin
      .from("accounts")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (account) {
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
    }

    // Delete auth user
    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
    if (deleteError) {
      console.error("[olera] deleteUser failed:", deleteError);
      // Non-fatal — data is already cleaned up
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
