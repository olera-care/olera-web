import { NextResponse, type NextRequest } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient, logAuditAction } from "@/lib/admin";
import {
  calculateFamilyCompleteness,
  calculateProviderCompleteness,
} from "@/lib/admin/profile-completeness";

/**
 * GET /api/admin/analytics/response-leads
 *
 * Paginated endpoint for the Provider Response Rates admin drill-in.
 * Returns a list of leads with response status, message preview, and
 * engagement signals. Supports filters for actionability tabs and CTA variant.
 *
 * Query params:
 *   date_from, date_to  - ISO timestamps (optional)
 *   filter              - "all" | "needs_attention" | "provider_nudged" | "family_nudged" | "responded" | "no_email" (default: "all")
 *   variant             - CTA variant filter, "all" for any (default: "all")
 *   limit               - 1-100, default 50
 *   offset              - >= 0, default 0
 *
 * Response includes `counts` object with totals for each filter category.
 */

interface ProfileCompleteness {
  percentage: number;
  missingFields: string[];
}

interface ResponseLead {
  connection_id: string;
  family_id: string;
  family_name: string;
  family_email: string | null;
  family_phone: string | null;
  family_completeness: ProfileCompleteness;
  family_is_published: boolean; // care_post.status === "active"
  family_nudged_at: string | null; // Nudged to complete profile
  family_publish_nudged_at: string | null; // Nudged to publish profile
  provider_id: string; // Profile UUID for linking to /admin/directory/[providerId]
  provider_name: string;
  provider_email: string | null;
  provider_phone: string | null;
  provider_slug: string;
  provider_completeness: ProfileCompleteness;
  provider_nudged_at: string | null;
  message_preview: string;
  created_at: string;
  age_hours: number;
  responded: boolean;
  response_time_hours: number | null;
  provider_response: string | null; // First non-auto-reply message from provider
  cta_variant: string | null;
  provider_status: "active" | "archived" | "deleted"; // Provider profile status
}

type ThreadMessage = {
  from_profile_id: string;
  text?: string;
  created_at: string;
  is_auto_reply?: boolean;
};

export async function GET(req: NextRequest) {
  // Admin auth check
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = await getAdminUser(user.id);
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = getServiceClient();

  // Parse query params
  const { searchParams } = new URL(req.url);
  const dateFrom = searchParams.get("date_from");
  const dateTo = searchParams.get("date_to");
  const filter = searchParams.get("filter") || "all";
  const variant = searchParams.get("variant") || "all";
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
  const offset = Math.max(0, parseInt(searchParams.get("offset") || "0", 10));

  // Build query for connections (leads)
  // We fetch comprehensive profile data to calculate completeness metrics
  let query = db
    .from("connections")
    .select(
      `
      id,
      from_profile_id,
      to_profile_id,
      message,
      metadata,
      created_at,
      from_profile:business_profiles!connections_from_profile_id_fkey(
        id,
        display_name,
        email,
        phone,
        image_url,
        city,
        description,
        care_types,
        metadata
      ),
      to_profile:business_profiles!connections_to_profile_id_fkey(
        id,
        display_name,
        email,
        phone,
        image_url,
        slug,
        source_provider_id,
        website,
        address,
        city,
        state,
        description,
        care_types,
        metadata,
        is_active
      )
    `,
      { count: "exact" }
    )
    .in("type", ["inquiry", "request"])
    .order("created_at", { ascending: false });

  // Date filters
  if (dateFrom) {
    query = query.gte("created_at", dateFrom);
  }
  if (dateTo) {
    query = query.lte("created_at", dateTo);
  }

  // Fetch all matching connections first (we need to process them to determine response status)
  // We'll apply filter/pagination in memory since response status requires thread analysis
  const { data: connectionsRaw, error: fetchError, count } = await query.limit(5000);

  if (fetchError) {
    console.error("[response-leads] Query error:", fetchError);
    return NextResponse.json(
      { error: "Failed to fetch leads" },
      { status: 500 }
    );
  }

  // Normalize joined relations
  const connections = (connectionsRaw ?? []).map((c) => ({
    ...c,
    from_profile: Array.isArray(c.from_profile) ? c.from_profile[0] ?? null : c.from_profile,
    to_profile: Array.isArray(c.to_profile) ? c.to_profile[0] ?? null : c.to_profile,
  }));

  // Process connections to determine response status and build leads list
  const allLeads: ResponseLead[] = [];

  for (const conn of connections) {
    const meta = (conn.metadata as Record<string, unknown>) ?? {};
    const thread = (meta.thread as ThreadMessage[]) || [];
    const ctaVariant = (meta.cta_variant as string) || null;

    // Apply variant filter (dynamic - works for any variant value)
    if (variant !== "all" && ctaVariant !== variant) {
      continue;
    }

    // Find first provider message (non-auto-reply)
    const providerMsg = thread.find(
      (m) => m.from_profile_id === conn.to_profile_id && m.is_auto_reply !== true
    );

    const responded = !!providerMsg;
    const responseTimeHours = providerMsg
      ? (new Date(providerMsg.created_at).getTime() - new Date(conn.created_at).getTime()) /
        (1000 * 60 * 60)
      : null;

    // Extract provider's response text (full - frontend truncates for display)
    const providerResponse: string | null = providerMsg?.text || null;

    // Extract message preview from the connection's message JSON or family's thread message
    // We want the FAMILY's message, not the provider's auto-reply
    let messagePreview = "";
    if (conn.message) {
      try {
        const msgJson = JSON.parse(String(conn.message));
        // Try common message fields in order of preference
        messagePreview = msgJson.additional_notes || msgJson.message || msgJson.notes || "";
      } catch {
        // If not JSON, use as-is (legacy format)
        messagePreview = String(conn.message);
      }
    }
    // Fall back to first FAMILY message in thread (skip provider auto-replies)
    if (!messagePreview && thread.length > 0) {
      const familyMessage = thread.find(
        (m) => m.from_profile_id === conn.from_profile_id && m.text && !m.is_auto_reply
      );
      if (familyMessage?.text) {
        messagePreview = familyMessage.text;
      }
    }
    // Truncate to 50 chars
    if (messagePreview.length > 50) {
      messagePreview = messagePreview.substring(0, 47) + "...";
    }

    const ageHours = (Date.now() - new Date(conn.created_at).getTime()) / (1000 * 60 * 60);

    // Parse nudge timestamps (separate for family profile, family publish, and provider)
    const providerNudgedAt = (meta.nudged_at as string) || null;
    const familyNudgedAt = (meta.family_nudged_at as string) || null;
    const familyPublishNudgedAt = (meta.family_publish_nudged_at as string) || null;

    // Calculate profile completeness for both parties
    const familyCompleteness = conn.from_profile
      ? calculateFamilyCompleteness(conn.from_profile, conn.from_profile.email)
      : { percentage: 0, missingFields: [] };

    const providerCompleteness = conn.to_profile
      ? calculateProviderCompleteness(conn.to_profile)
      : { percentage: 0, missingFields: [] };

    // Check if family profile is published (care_post.status === "active")
    const familyMeta = (conn.from_profile?.metadata as Record<string, unknown>) ?? {};
    const carePost = familyMeta.care_post as { status?: string } | undefined;
    const familyIsPublished = carePost?.status === "active";

    allLeads.push({
      connection_id: conn.id,
      family_id: conn.from_profile_id || "",
      family_name: conn.from_profile?.display_name || "Care Seeker",
      family_email: conn.from_profile?.email || null,
      family_phone: conn.from_profile?.phone || null,
      family_completeness: familyCompleteness,
      family_is_published: familyIsPublished,
      family_nudged_at: familyNudgedAt,
      family_publish_nudged_at: familyPublishNudgedAt,
      provider_id: conn.to_profile_id || "",
      provider_name: conn.to_profile?.display_name || "Unknown",
      provider_email: conn.to_profile?.email || null,
      provider_phone: conn.to_profile?.phone || null,
      provider_slug: conn.to_profile?.slug || conn.to_profile?.source_provider_id || "",
      provider_completeness: providerCompleteness,
      provider_nudged_at: providerNudgedAt,
      message_preview: messagePreview,
      created_at: conn.created_at,
      age_hours: ageHours,
      responded,
      response_time_hours: responseTimeHours ? Math.round(responseTimeHours * 10) / 10 : null,
      provider_response: providerResponse,
      cta_variant: ctaVariant,
      provider_status: !conn.to_profile ? "deleted" : conn.to_profile.is_active === false ? "archived" : "active",
    });
  }

  // Categorize leads for tab counts (computed once per lead)
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
  const now = Date.now();

  type Category = "needs_attention" | "provider_nudged" | "family_nudged" | "responded" | "no_email";

  const categorizedLeads = allLeads.map((lead) => {
    const hasProviderEmail = !!lead.provider_email;
    const providerNudgedRecently = lead.provider_nudged_at
      ? now - new Date(lead.provider_nudged_at).getTime() < SEVEN_DAYS_MS
      : false;

    // Check if family was nudged recently (either profile completion or publish nudge)
    const familyNudgedRecently =
      (lead.family_nudged_at
        ? now - new Date(lead.family_nudged_at).getTime() < SEVEN_DAYS_MS
        : false) ||
      (lead.family_publish_nudged_at
        ? now - new Date(lead.family_publish_nudged_at).getTime() < SEVEN_DAYS_MS
        : false);

    // Order matters: responded takes priority (goal achieved), then check actionability
    // Provider nudge takes priority over family nudge (waiting on provider response)
    let category: Category;
    if (lead.responded) category = "responded";
    else if (!hasProviderEmail) category = "no_email";
    else if (providerNudgedRecently) category = "provider_nudged";
    else if (familyNudgedRecently) category = "family_nudged";
    else category = "needs_attention";

    return { lead, category };
  });

  // Compute counts for each category
  const counts = {
    all: allLeads.length,
    needs_attention: 0,
    provider_nudged: 0,
    family_nudged: 0,
    responded: 0,
    no_email: 0,
  };

  for (const { category } of categorizedLeads) {
    counts[category]++;
  }

  // Apply filter
  const filteredLeads =
    filter === "all"
      ? allLeads
      : categorizedLeads.filter(({ category }) => category === filter).map(({ lead }) => lead);

  // Get total count after filtering
  const total = filteredLeads.length;

  // Apply pagination
  const paginatedLeads = filteredLeads.slice(offset, offset + limit);

  // Warn if we hit the query limit (data may be incomplete)
  const truncated = (connectionsRaw?.length ?? 0) >= 5000;

  return NextResponse.json({
    total,
    leads: paginatedLeads,
    counts,
    truncated,
  });
}

/**
 * DELETE /api/admin/analytics/response-leads
 *
 * Hard-deletes a connection (lead) from the database.
 * Used for cleaning up test data that would otherwise pollute metrics.
 *
 * Body: { connection_id: string }
 *
 * Deletes the connection record entirely. This is permanent.
 */
export async function DELETE(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = await getAdminUser(user.id);
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { connection_id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { connection_id } = body;
  if (!connection_id) {
    return NextResponse.json(
      { error: "connection_id is required" },
      { status: 400 }
    );
  }

  const db = getServiceClient();

  // Fetch connection details for audit log before deleting
  const { data: connection, error: fetchError } = await db
    .from("connections")
    .select(
      `
      id,
      type,
      created_at,
      from_profile:business_profiles!connections_from_profile_id_fkey(display_name, email),
      to_profile:business_profiles!connections_to_profile_id_fkey(display_name, slug)
    `
    )
    .eq("id", connection_id)
    .single();

  if (fetchError || !connection) {
    return NextResponse.json(
      { error: "Connection not found" },
      { status: 404 }
    );
  }

  // Normalize joined relations for audit details
  const fromProfile = Array.isArray(connection.from_profile)
    ? connection.from_profile[0]
    : connection.from_profile;
  const toProfile = Array.isArray(connection.to_profile)
    ? connection.to_profile[0]
    : connection.to_profile;

  // Delete the connection
  const { error: deleteError } = await db
    .from("connections")
    .delete()
    .eq("id", connection_id);

  if (deleteError) {
    console.error("[response-leads DELETE] Failed:", deleteError);
    await logAuditAction({
      adminUserId: admin.id,
      action: "connection_delete_failed",
      targetType: "connection",
      targetId: connection_id,
      details: {
        error: deleteError.message,
        family: fromProfile?.display_name,
        provider: toProfile?.display_name,
      },
    });
    return NextResponse.json(
      { error: "Failed to delete connection" },
      { status: 500 }
    );
  }

  // Log successful deletion
  await logAuditAction({
    adminUserId: admin.id,
    action: "connection_deleted",
    targetType: "connection",
    targetId: connection_id,
    details: {
      type: connection.type,
      created_at: connection.created_at,
      family_name: fromProfile?.display_name,
      family_email: fromProfile?.email,
      provider_name: toProfile?.display_name,
      provider_slug: toProfile?.slug,
      deleted_by: user.email,
    },
  });

  return NextResponse.json({
    ok: true,
    deleted: {
      connection_id,
      family: fromProfile?.display_name,
      provider: toProfile?.display_name,
    },
  });
}
