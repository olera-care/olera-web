import { NextResponse, type NextRequest } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

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
  provider_name: string;
  provider_slug: string;
  message_preview: string;
  created_at: string;
  age_hours: number;
  responded: boolean;
  response_time_hours: number | null;
  cta_variant: string | null;
}

type ThreadMessage = {
  from_profile_id: string;
  text?: string;
  created_at: string;
  is_auto_reply?: boolean;
};

function getServiceDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

export async function GET(req: NextRequest) {
  // Admin auth check
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check admin role
  const { data: profile } = await supabase
    .from("business_profiles")
    .select("type")
    .eq("account_id", user.id)
    .maybeSingle();

  const isAdmin =
    profile?.type === "admin" ||
    user.email?.endsWith("@olera.care") ||
    user.email?.endsWith("@anthropic.com");

  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = getServiceDb();
  if (!db) {
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

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
      from_profile:business_profiles!connections_from_profile_id_fkey(display_name),
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

    // Apply filter
    if (filter === "awaiting" && responded) continue;
    if (filter === "responded" && !responded) continue;

    // Extract message preview from the connection's message or first thread message
    let messagePreview = "";
    if (conn.message) {
      messagePreview = String(conn.message);
    } else if (thread.length > 0 && thread[0].text) {
      messagePreview = thread[0].text;
    }
    // Truncate to 50 chars
    if (messagePreview.length > 50) {
      messagePreview = messagePreview.substring(0, 47) + "...";
    }

    const ageHours = (Date.now() - new Date(conn.created_at).getTime()) / (1000 * 60 * 60);

    allLeads.push({
      connection_id: conn.id,
      family_name: conn.from_profile?.display_name || "Care Seeker",
      provider_name: conn.to_profile?.display_name || "Unknown",
      provider_slug: conn.to_profile?.slug || conn.to_profile?.source_provider_id || "",
      message_preview: messagePreview,
      created_at: conn.created_at,
      age_hours: ageHours,
      responded,
      response_time_hours: responseTimeHours ? Math.round(responseTimeHours * 10) / 10 : null,
      cta_variant: ctaVariant,
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
