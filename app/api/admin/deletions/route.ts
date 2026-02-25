import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * GET /api/admin/deletions
 *
 * Fetch deletion requests (pending) or deletion history (completed).
 * Query params: tab ("requests" | "history"), count_only
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const adminUser = await getAdminUser(user.id);
    if (!adminUser) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const tab = searchParams.get("tab") || "requests";
    const countOnly = searchParams.get("count_only") === "true";

    const db = getServiceClient();

    if (tab === "requests") {
      // Pending deletion requests from business_profiles
      if (countOnly) {
        const { count } = await db
          .from("business_profiles")
          .select("*", { count: "exact", head: true })
          .eq("deletion_requested", true);

        return NextResponse.json({ count: count ?? 0 });
      }

      const { data: profiles, error } = await db
        .from("business_profiles")
        .select(
          "id, display_name, type, category, city, state, email, phone, source_provider_id, claim_state, deletion_requested_at, account_id"
        )
        .eq("deletion_requested", true)
        .order("deletion_requested_at", { ascending: false });

      if (error) {
        console.error("Failed to fetch deletion requests:", error);
        return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 });
      }

      // Fetch account emails for each request
      const accountIds = [
        ...new Set(
          (profiles ?? [])
            .map((p) => p.account_id)
            .filter(Boolean)
        ),
      ];

      let accountEmails: Record<string, string> = {};
      if (accountIds.length > 0) {
        const { data: accounts } = await db
          .from("accounts")
          .select("id, user_id")
          .in("id", accountIds);

        if (accounts) {
          // Get auth user emails
          for (const acc of accounts) {
            const { data: authData } = await db.auth.admin.getUserById(acc.user_id);
            if (authData?.user?.email) {
              accountEmails[acc.id] = authData.user.email;
            }
          }
        }
      }

      const requests = (profiles ?? []).map((p) => ({
        ...p,
        requester_email: p.account_id ? accountEmails[p.account_id] ?? null : null,
      }));

      return NextResponse.json({ requests });
    }

    if (tab === "history") {
      // Deleted providers from olera-providers table
      const { data: deletedProviders, error: provError } = await db
        .from("olera-providers")
        .select(
          "provider_id, provider_name, provider_category, city, state, phone, deleted, deleted_at"
        )
        .eq("deleted", true)
        .order("deleted_at", { ascending: false })
        .limit(100);

      if (provError) {
        console.error("Failed to fetch deleted providers:", provError);
        return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
      }

      // Also get business_profiles that were deletion-approved (to link back)
      const { data: deletedProfiles } = await db
        .from("business_profiles")
        .select(
          "id, display_name, source_provider_id, deletion_approved_at, claim_state"
        )
        .not("deletion_approved_at", "is", null);

      // Build a map of source_provider_id -> profile info
      const profileMap: Record<string, { profile_id: string; display_name: string; deletion_approved_at: string }> = {};
      for (const p of deletedProfiles ?? []) {
        if (p.source_provider_id) {
          profileMap[p.source_provider_id] = {
            profile_id: p.id,
            display_name: p.display_name,
            deletion_approved_at: p.deletion_approved_at,
          };
        }
      }

      const history = (deletedProviders ?? []).map((p) => ({
        ...p,
        linked_profile: profileMap[p.provider_id] ?? null,
      }));

      const historyCount = deletedProviders?.length ?? 0;

      return NextResponse.json({ history, count: historyCount });
    }

    return NextResponse.json({ error: "Invalid tab parameter" }, { status: 400 });
  } catch (err) {
    console.error("Admin deletions error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
