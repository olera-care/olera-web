import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * GET /api/admin/provider-outreach/sequence-conversions
 *
 * Returns providers who claimed after going through the email sequence.
 *
 * Query params:
 *   - date_from (optional): Filter by claim date (ISO string, inclusive)
 *   - date_to (optional): Filter by claim date (ISO string, inclusive)
 *
 * Returns:
 *   - providers: Array of SequenceConversion
 *   - total: number of providers
 */

export interface SequenceConversion {
  provider_id: string;
  provider_name: string;
  city: string | null;
  claim_email: string;
  claimed_at: string;
  assigned_to: string | null;
  assigned_to_display_name: string | null;
}

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
    const dateFrom = searchParams.get("date_from");
    const dateTo = searchParams.get("date_to");

    const db = getServiceClient();

    // Step 1: Get all providers who went through the sequence (sequence_started_at IS NOT NULL)
    const { data: sequencedProviders, error: seqError } = await db
      .from("provider_outreach_tracking")
      .select("provider_id, assigned_to")
      .not("sequence_started_at", "is", null);

    if (seqError) {
      console.error("[sequence-conversions] Sequence query error:", seqError);
      return NextResponse.json({ error: "Failed to fetch sequence data" }, { status: 500 });
    }

    if (!sequencedProviders || sequencedProviders.length === 0) {
      return NextResponse.json({ providers: [], total: 0 });
    }

    const sequencedProviderIds = sequencedProviders.map((p) => p.provider_id);
    const assignedToMap = new Map(
      sequencedProviders.map((p) => [p.provider_id, p.assigned_to])
    );

    // Step 2: Get business_profiles that have claimed (account_id IS NOT NULL)
    // and are in our sequenced set
    let bpQuery = db
      .from("business_profiles")
      .select("source_provider_id, account_id, created_at")
      .in("source_provider_id", sequencedProviderIds)
      .not("account_id", "is", null)
      .order("created_at", { ascending: false });

    // Apply date filters on claim date (created_at)
    if (dateFrom) {
      bpQuery = bpQuery.gte("created_at", dateFrom);
    }
    if (dateTo) {
      // Add one day to make it inclusive
      const toDate = new Date(dateTo);
      toDate.setDate(toDate.getDate() + 1);
      bpQuery = bpQuery.lt("created_at", toDate.toISOString());
    }

    const { data: claimedBps, error: bpError } = await bpQuery;

    if (bpError) {
      console.error("[sequence-conversions] Business profiles query error:", bpError);
      return NextResponse.json({ error: "Failed to fetch claim data" }, { status: 500 });
    }

    if (!claimedBps || claimedBps.length === 0) {
      return NextResponse.json({ providers: [], total: 0 });
    }

    const providerIds = claimedBps.map((bp) => bp.source_provider_id);
    const accountIds = claimedBps.map((bp) => bp.account_id);

    // Step 3: Get provider details from provider_data
    const { data: providerData, error: pdError } = await db
      .from("provider_data")
      .select("provider_id, provider_name, city")
      .in("provider_id", providerIds);

    if (pdError) {
      console.error("[sequence-conversions] Provider data query error:", pdError);
      return NextResponse.json({ error: "Failed to fetch provider data" }, { status: 500 });
    }

    const providerMap = new Map<string, { name: string; city: string | null }>(
      (providerData || []).map((p: { provider_id: string; provider_name: string; city: string | null }) => [p.provider_id, { name: p.provider_name, city: p.city }])
    );

    // Step 4: Get account emails
    const { data: accounts, error: accError } = await db
      .from("accounts")
      .select("id, email")
      .in("id", accountIds);

    if (accError) {
      console.error("[sequence-conversions] Accounts query error:", accError);
      return NextResponse.json({ error: "Failed to fetch account data" }, { status: 500 });
    }

    const accountEmailMap = new Map<string, string>(
      (accounts || []).map((a: { id: string; email: string }) => [a.id, a.email])
    );

    // Step 5: Get admin display names for assigned_to
    const assignedToIds = Array.from(new Set(sequencedProviders.map((p) => p.assigned_to).filter((id): id is string => Boolean(id))));
    let adminNameMap = new Map<string, string>();

    if (assignedToIds.length > 0) {
      const { data: admins } = await db
        .from("admin_users")
        .select("id, display_name")
        .in("id", assignedToIds);

      adminNameMap = new Map(
        (admins || []).map((a: { id: string; display_name: string | null }) => [a.id, a.display_name || a.id])
      );
    }

    // Step 6: Build response
    const providers: SequenceConversion[] = claimedBps.map((bp) => {
      const providerInfo = providerMap.get(bp.source_provider_id);
      const assignedTo = assignedToMap.get(bp.source_provider_id);

      return {
        provider_id: bp.source_provider_id,
        provider_name: providerInfo?.name || "Unknown Provider",
        city: providerInfo?.city || null,
        claim_email: accountEmailMap.get(bp.account_id) || "Unknown",
        claimed_at: bp.created_at,
        assigned_to: assignedTo || null,
        assigned_to_display_name: assignedTo ? (adminNameMap.get(assignedTo) || assignedTo) : null,
      };
    });

    return NextResponse.json({
      providers,
      total: providers.length,
    });
  } catch (err) {
    console.error("[sequence-conversions] Error:", err);
    return NextResponse.json(
      { error: `Internal server error: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}
