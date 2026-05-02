import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * GET /api/admin/disputes
 *
 * Fetch disputes with optional status filter.
 * Query params: status ("pending" | "resolved" | "rejected" | "all")
 *
 * Returns disputes joined with business_profiles to get current claimer info.
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
    const status = searchParams.get("status") || "pending";

    const db = getServiceClient();

    // Fetch disputes
    let query = db
      .from("disputes")
      .select("*")
      .order("created_at", { ascending: false });

    if (status !== "all") {
      query = query.eq("status", status);
    }

    const { data: disputes, error } = await query;

    if (error) {
      console.error("Fetch disputes error:", error);
      return NextResponse.json({ error: "Failed to fetch disputes" }, { status: 500 });
    }

    // Get provider IDs to fetch claimer info
    const providerIds = [...new Set((disputes ?? []).map((d) => d.provider_id))];

    // Fetch business profiles to get current claimer info
    let profilesMap: Record<string, { claimer_email: string | null; claim_trust_level: string | null; slug: string | null }> = {};
    if (providerIds.length > 0) {
      // First try business_profiles (for claimed providers)
      const { data: profiles } = await db
        .from("business_profiles")
        .select(`
          id,
          slug,
          claim_trust_level,
          account_id
        `)
        .in("id", providerIds);

      // Get account emails for profiles with account_id
      const accountIds = (profiles ?? [])
        .filter((p) => p.account_id)
        .map((p) => p.account_id);

      let accountEmails: Record<string, string> = {};
      if (accountIds.length > 0) {
        const { data: accounts } = await db
          .from("accounts")
          .select("id, user_id")
          .in("id", accountIds);

        // Get emails from auth.users (parallel)
        if (accounts && accounts.length > 0) {
          const emailResults = await Promise.all(
            accounts.map(async (account) => {
              try {
                const { data: authData } = await db.auth.admin.getUserById(account.user_id);
                return { accountId: account.id, email: authData?.user?.email || null };
              } catch {
                return { accountId: account.id, email: null };
              }
            })
          );
          for (const result of emailResults) {
            if (result.email) {
              accountEmails[result.accountId] = result.email;
            }
          }
        }
      }

      // Build profiles map
      for (const profile of profiles ?? []) {
        profilesMap[profile.id] = {
          claimer_email: profile.account_id ? (accountEmails[profile.account_id] || null) : null,
          claim_trust_level: profile.claim_trust_level,
          slug: profile.slug,
        };
      }
    }

    // Enrich disputes with claimer info
    const enrichedDisputes = (disputes ?? []).map((dispute) => ({
      ...dispute,
      current_claimer_email: profilesMap[dispute.provider_id]?.claimer_email || null,
      claim_trust_level: profilesMap[dispute.provider_id]?.claim_trust_level || null,
      provider_slug: profilesMap[dispute.provider_id]?.slug || null,
    }));

    return NextResponse.json({ disputes: enrichedDisputes });
  } catch (err) {
    console.error("Admin disputes route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
