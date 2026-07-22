import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * GET /api/admin/provider-outreach/unarchive-preview?provider_id=xxx
 *
 * Returns a preview of the cross-system impact of unarchiving a provider.
 * Used by the UI to show a confirmation dialog before unarchiving.
 *
 * Returns:
 *   - archived_questions_count: Number of archived questions that will be restored
 *   - connections_affected_count: Number of connections that will resume followups
 *   - provider_name: Provider name for display
 *   - is_system_archived: Whether provider is archived via system (admin_archived flag)
 *   - is_tracking_archived: Whether provider has tracking row with archived stage
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

    const providerId = request.nextUrl.searchParams.get("provider_id");

    if (!providerId) {
      return NextResponse.json({ error: "provider_id is required" }, { status: 400 });
    }

    const db = getServiceClient();

    // Get provider details
    const { data: provider, error: provError } = await db
      .from("olera-providers")
      .select("provider_id, provider_name, slug")
      .eq("provider_id", providerId)
      .maybeSingle();

    if (provError) {
      console.error("[unarchive-preview] Provider query error:", provError);
      return NextResponse.json({ error: "Failed to fetch provider" }, { status: 500 });
    }

    if (!provider) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    // Build variant set for this provider
    const variantSet = new Set<string>([providerId]);
    if (provider.slug) variantSet.add(provider.slug);

    // Check for linked business_profile
    let businessProfileId: string | null = null;
    let isSystemArchived = false;

    const { data: linkedBp } = await db
      .from("business_profiles")
      .select("id, slug, source_provider_id, metadata")
      .eq("source_provider_id", providerId)
      .maybeSingle();

    if (linkedBp) {
      businessProfileId = linkedBp.id;
      if (linkedBp.slug) variantSet.add(linkedBp.slug);
      if (linkedBp.source_provider_id) variantSet.add(linkedBp.source_provider_id);

      // Check if system-archived
      const meta = linkedBp.metadata as Record<string, unknown> | null;
      isSystemArchived = meta?.admin_archived === true;
    }

    const variants = Array.from(variantSet);

    // Check tracking table for archived stage
    const { data: trackingRow } = await db
      .from("provider_outreach_tracking")
      .select("stage")
      .eq("provider_id", providerId)
      .maybeSingle();

    // Only hard-archived providers need unarchive preview
    // not_interested is soft terminal - no system-wide archive to undo
    const isTrackingArchived = trackingRow?.stage === "archived";

    // Count archived questions (from archived_question_providers table)
    const { count: archivedQuestionsCount, error: aqpError } = await db
      .from("archived_question_providers")
      .select("*", { count: "exact", head: true })
      .in("provider_id", variants);

    if (aqpError) {
      console.error("[unarchive-preview] archived_question_providers count error:", aqpError);
    }

    // Count connections that will resume followups
    let connectionsAffectedCount = 0;

    if (businessProfileId) {
      const { count: connCount, error: connError } = await db
        .from("connections")
        .select("*", { count: "exact", head: true })
        .eq("to_profile_id", businessProfileId)
        .eq("type", "inquiry")
        .filter("metadata->>followup_stopped_reason", "eq", "provider_admin_archived");

      if (connError) {
        console.error("[unarchive-preview] connections count error:", connError);
      } else {
        connectionsAffectedCount = connCount || 0;
      }
    }

    return NextResponse.json({
      provider_id: providerId,
      provider_name: provider.provider_name,
      is_system_archived: isSystemArchived,
      is_tracking_archived: isTrackingArchived,
      archived_questions_count: archivedQuestionsCount || 0,
      connections_affected_count: connectionsAffectedCount,
    });
  } catch (err) {
    console.error("[unarchive-preview] Fatal error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
