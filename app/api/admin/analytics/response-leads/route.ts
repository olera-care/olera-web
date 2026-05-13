import { NextResponse, type NextRequest } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient, logAuditAction } from "@/lib/admin";

/**
 * GET /api/admin/analytics/response-leads
 *
 * Paginated endpoint for the Provider Response Rates admin drill-in.
 * Returns a list of leads with response status, message preview, and
 * engagement signals. Supports filters for responded/awaiting status
 * and CTA variant.
 *
 * Query params:
 *   date_from, date_to  - ISO timestamps (optional)
 *   filter              - "all" | "awaiting" | "responded" (default: "all")
 *   variant             - "legacy" | "compare" | "all" (default: "all")
 *   limit               - 1-100, default 50
 *   offset              - >= 0, default 0
 */

interface ResponseLead {
  connection_id: string;
  family_name: string;
  family_email: string | null;
  provider_name: string;
  provider_slug: string;
  message_preview: string;
  created_at: string;
  age_hours: number;
  responded: boolean;
  response_time_hours: number | null;
  provider_response: string | null; // First non-auto-reply message from provider
  cta_variant: string | null;
  nudged_at: string | null;
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
      from_profile:business_profiles!connections_from_profile_id_fkey(display_name, email),
      to_profile:business_profiles!connections_to_profile_id_fkey(display_name, slug, source_provider_id, email)
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

    // Apply variant filter
    if (variant !== "all") {
      if (variant === "legacy" && ctaVariant !== "legacy") continue;
      if (variant === "compare" && ctaVariant !== "compare") continue;
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

    // Extract provider's response text (truncated for preview)
    let providerResponse: string | null = null;
    if (providerMsg?.text) {
      providerResponse = providerMsg.text;
      if (providerResponse.length > 80) {
        providerResponse = providerResponse.substring(0, 77) + "...";
      }
    }

    // Apply filter
    if (filter === "awaiting" && responded) continue;
    if (filter === "responded" && !responded) continue;

    // Extract message preview from the connection's message JSON or first thread message
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
    // Fall back to first thread message if no direct message
    if (!messagePreview && thread.length > 0 && thread[0].text) {
      messagePreview = thread[0].text;
    }
    // Truncate to 50 chars
    if (messagePreview.length > 50) {
      messagePreview = messagePreview.substring(0, 47) + "...";
    }

    const ageHours = (Date.now() - new Date(conn.created_at).getTime()) / (1000 * 60 * 60);

    const nudgedAt = (meta.nudged_at as string) || null;

    allLeads.push({
      connection_id: conn.id,
      family_name: conn.from_profile?.display_name || "Care Seeker",
      family_email: conn.from_profile?.email || null,
      provider_name: conn.to_profile?.display_name || "Unknown",
      provider_slug: conn.to_profile?.slug || conn.to_profile?.source_provider_id || "",
      message_preview: messagePreview,
      created_at: conn.created_at,
      age_hours: ageHours,
      responded,
      response_time_hours: responseTimeHours ? Math.round(responseTimeHours * 10) / 10 : null,
      provider_response: providerResponse,
      cta_variant: ctaVariant,
      nudged_at: nudgedAt,
    });
  }

  // Get total count after filtering
  const total = allLeads.length;

  // Apply pagination
  const paginatedLeads = allLeads.slice(offset, offset + limit);

  // Warn if we hit the query limit (data may be incomplete)
  const truncated = (connectionsRaw?.length ?? 0) >= 5000;

  return NextResponse.json({
    total,
    leads: paginatedLeads,
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
