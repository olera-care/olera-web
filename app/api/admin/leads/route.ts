import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient, logAuditAction } from "@/lib/admin";
import { providerResponded } from "@/lib/connection-temperature";

/**
 * GET /api/admin/leads
 *
 * List all connections with from/to profile info.
 * Query params: status, type, limit, offset, count_only
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
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const countOnly = searchParams.get("count_only") === "true";
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const search = searchParams.get("search")?.trim() || "";

    const db = getServiceClient();
    const needsEmail = searchParams.get("needs_email") === "true";
    const showArchived = searchParams.get("archived") === "true";
    const dateFrom = searchParams.get("date_from");
    const dateTo = searchParams.get("date_to");

    // If searching, find matching profile IDs first (fast indexed lookup)
    let searchProfileIds: string[] | null = null;
    if (search) {
      const { data: matchingProfiles } = await db
        .from("business_profiles")
        .select("id")
        .ilike("display_name", `%${search}%`)
        .limit(200);

      searchProfileIds = (matchingProfiles ?? []).map((p) => p.id);
      if (searchProfileIds.length === 0) {
        return NextResponse.json({ connections: [], total: 0 });
      }
    }

    // Build base filter helper
    // Note: needsEmail filter is applied in-memory after fetching (like Analytics)
    // because PostgREST doesn't support filtering on joined columns directly
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function applyFilters(q: any) {
      if (status) q = q.eq("status", status);
      if (type) q = q.eq("type", type);
      // Show archived OR non-archived
      if (showArchived) {
        q = q.contains("metadata", { archived: true });
      } else {
        // Exclude archived leads using NOT contains.
        // metadata defaults to '{}' so null is rare. For null metadata,
        // NOT(null @> ...) = NULL which Postgres treats as FALSE, excluding the row.
        // This is acceptable since null metadata means it's not archived anyway.
        // If needed, we can revisit with a raw SQL filter.
        q = q.not("metadata", "cs", JSON.stringify({ archived: true }));
      }
      if (dateFrom) q = q.gte("created_at", dateFrom);
      if (dateTo) q = q.lte("created_at", dateTo);
      if (searchProfileIds) {
        q = q.or(
          `from_profile_id.in.(${searchProfileIds.join(",")}),to_profile_id.in.(${searchProfileIds.join(",")})`
        );
      }
      return q;
    }

    // Helper to check if a connection's provider needs email
    // Matches Analytics approach exactly:
    // - Provider must be active
    // - Provider must have no email
    // - Provider must NOT have responded (goal already achieved if responded)
    const providerNeedsEmail = (conn: {
      to_profile_id?: string;
      to_profile: { email?: string | null; is_active?: boolean }[] | { email?: string | null; is_active?: boolean } | null;
      metadata?: Record<string, unknown>;
    }) => {
      // Supabase may return to_profile as array or single object depending on join
      const provider = Array.isArray(conn.to_profile) ? conn.to_profile[0] : conn.to_profile;
      // Skip if no provider profile (deleted) or inactive
      if (!provider || provider.is_active === false) return false;
      // Skip if provider already responded (goal achieved)
      if (providerResponded(conn)) return false;
      // Provider needs email if email is null or empty
      return !provider.email;
    };

    // When needsEmail filter is active, we must fetch all results and filter in memory
    // because PostgREST doesn't support filtering on joined columns
    if (needsEmail) {
      // Fetch all connections with profile data (up to reasonable limit)
      // Filter to inquiry/request types only (same as Analytics) for consistent counts
      let query = db
        .from("connections")
        .select(`
          id,
          type,
          status,
          message,
          metadata,
          created_at,
          to_profile_id,
          from_profile:business_profiles!connections_from_profile_id_fkey(id, display_name, type, email, phone, metadata, care_types),
          to_profile:business_profiles!connections_to_profile_id_fkey(id, display_name, type, slug, source_provider_id, email, is_active)
        `)
        .in("type", ["inquiry", "request"])
        .order("created_at", { ascending: false })
        .limit(10000);

      query = applyFilters(query);
      const { data: allConnections, error } = await query;

      if (error) {
        console.error("Failed to fetch leads:", error);
        return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 });
      }

      // Get source_provider_ids for providers without email in business_profiles
      // to check olera-providers as fallback (emails may exist there from legacy data)
      const sourceProviderIds = (allConnections ?? [])
        .map((c) => {
          const tp = Array.isArray(c.to_profile) ? c.to_profile[0] : c.to_profile;
          // Only look up if provider exists, is active, and has no email in business_profiles
          if (!tp || tp.is_active === false || tp.email) return null;
          return tp.source_provider_id;
        })
        .filter(Boolean) as string[];

      // Look up emails in olera-providers
      const oleraEmailMap = new Map<string, string>();
      if (sourceProviderIds.length > 0) {
        const { data: oleraProviders } = await db
          .from("olera-providers")
          .select("provider_id, email")
          .in("provider_id", sourceProviderIds)
          .not("deleted", "is", true);

        for (const p of oleraProviders ?? []) {
          if (p.email) {
            oleraEmailMap.set(p.provider_id, p.email);
          }
        }
      }

      // Enhanced filter that checks both business_profiles AND olera-providers for email
      const providerNeedsEmailEnhanced = (conn: typeof allConnections[number]) => {
        const provider = Array.isArray(conn.to_profile) ? conn.to_profile[0] : conn.to_profile;
        if (!provider || provider.is_active === false) return false;

        // Check if provider already responded
        if (providerResponded(conn)) return false;

        // Check business_profiles.email first
        if (provider.email) return false;

        // Check olera-providers.email as fallback
        if (provider.source_provider_id && oleraEmailMap.has(provider.source_provider_id)) {
          return false;
        }

        return true;
      };

      // Filter in memory for providers needing email
      const filtered = (allConnections ?? []).filter(providerNeedsEmailEnhanced);

      if (countOnly) {
        return NextResponse.json({ count: filtered.length });
      }

      // Apply pagination in memory
      const total = filtered.length;
      const paginatedConnections = filtered.slice(offset, offset + limit);

      // Enrich with provider engagement data (same as non-needsEmail path)
      let engagement: Record<string, { email_clicked: boolean; lead_opened: boolean; contact_revealed: boolean }> = {};
      try {
        const providerSlugs = [...new Set(
          paginatedConnections
            .map((c) => {
              const tp = c.to_profile as { slug?: string; source_provider_id?: string; id?: string } | null;
              return tp?.slug || tp?.source_provider_id || tp?.id || null;
            })
            .filter(Boolean) as string[]
        )];

        if (providerSlugs.length > 0) {
          const { data: events } = await db
            .from("provider_activity")
            .select("provider_id, event_type")
            .in("provider_id", providerSlugs)
            .in("event_type", ["email_click", "lead_opened", "contact_revealed"]);

          for (const slug of providerSlugs) {
            const providerEvents = (events ?? []).filter((e) => e.provider_id === slug);
            engagement[slug] = {
              email_clicked: providerEvents.some((e) => e.event_type === "email_click"),
              lead_opened: providerEvents.some((e) => e.event_type === "lead_opened"),
              contact_revealed: providerEvents.some((e) => e.event_type === "contact_revealed"),
            };
          }
        }
      } catch {
        // Non-blocking — engagement data is supplementary
      }

      return NextResponse.json({ connections: paginatedConnections, total, engagement });
    }

    if (countOnly) {
      let countQuery = db
        .from("connections")
        .select("*", { count: "exact", head: true })
        .in("type", ["inquiry", "request"]);
      countQuery = applyFilters(countQuery);
      const { count } = await countQuery;
      return NextResponse.json({ count: count ?? 0 });
    }

    // Get total count for pagination
    // Filter to inquiry/request types to match needsEmail path
    let totalQuery = db
      .from("connections")
      .select("*", { count: "exact", head: true })
      .in("type", ["inquiry", "request"]);
    totalQuery = applyFilters(totalQuery);
    const { count: total } = await totalQuery;

    // Fetch connections with joined profile names
    // Filter to inquiry/request types to match needsEmail path and counts
    let query = db
      .from("connections")
      .select(`
        id,
        type,
        status,
        message,
        metadata,
        created_at,
        from_profile:business_profiles!connections_from_profile_id_fkey(id, display_name, type, email, phone, metadata, care_types),
        to_profile:business_profiles!connections_to_profile_id_fkey(id, display_name, type, slug, source_provider_id, email, is_active)
      `)
      .in("type", ["inquiry", "request"])
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    query = applyFilters(query);

    const { data: connections, error } = await query;

    if (error) {
      console.error("Failed to fetch leads:", error);
      return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 });
    }

    // Enrich with provider engagement data (batch query)
    let engagement: Record<string, { email_clicked: boolean; lead_opened: boolean; contact_revealed: boolean }> = {};
    try {
      const providerSlugs = [...new Set(
        (connections ?? [])
          .map((c) => {
            const tp = c.to_profile as { slug?: string; source_provider_id?: string; id?: string } | null;
            return tp?.slug || tp?.source_provider_id || tp?.id || null;
          })
          .filter(Boolean) as string[]
      )];

      if (providerSlugs.length > 0) {
        const { data: events } = await db
          .from("provider_activity")
          .select("provider_id, event_type")
          .in("provider_id", providerSlugs)
          .in("event_type", ["email_click", "lead_opened", "contact_revealed"]);

        for (const slug of providerSlugs) {
          const providerEvents = (events ?? []).filter((e) => e.provider_id === slug);
          engagement[slug] = {
            email_clicked: providerEvents.some((e) => e.event_type === "email_click"),
            lead_opened: providerEvents.some((e) => e.event_type === "lead_opened"),
            contact_revealed: providerEvents.some((e) => e.event_type === "contact_revealed"),
          };
        }
      }
    } catch {
      // Non-blocking — engagement data is supplementary
    }

    return NextResponse.json({ connections: connections ?? [], total: total ?? 0, engagement });
  } catch (err) {
    console.error("Admin leads error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/leads
 *
 * Archive or unarchive connections.
 * Body: { ids: string[], action: "archive" | "unarchive", reason?: string }
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const adminUser = await getAdminUser(user.id);
    if (!adminUser) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const body = await request.json();
    const { ids, action, reason } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "ids array is required" }, { status: 400 });
    }
    if (action !== "archive" && action !== "unarchive") {
      return NextResponse.json({ error: "action must be 'archive' or 'unarchive'" }, { status: 400 });
    }

    const db = getServiceClient();

    // Fetch current metadata for each connection
    const { data: connections, error: fetchErr } = await db
      .from("connections")
      .select("id, metadata")
      .in("id", ids);

    if (fetchErr) {
      return NextResponse.json({ error: "Failed to fetch connections" }, { status: 500 });
    }

    let updated = 0;
    for (const conn of connections ?? []) {
      const meta = (conn.metadata || {}) as Record<string, unknown>;
      if (action === "archive") {
        meta.archived = true;
        meta.archive_reason = reason || null;
        meta.archived_at = new Date().toISOString();
      } else {
        delete meta.archived;
        delete meta.archive_reason;
        delete meta.archived_at;
      }

      const { error: updateErr } = await db
        .from("connections")
        .update({ metadata: meta })
        .eq("id", conn.id);

      if (!updateErr) updated++;
    }

    await logAuditAction({
      adminUserId: adminUser.id,
      action: action === "archive" ? "archive_leads" : "unarchive_leads",
      targetType: "connection",
      targetId: ids.length === 1 ? ids[0] : "bulk",
      details: { ids, reason: reason || null, count: updated },
    });

    return NextResponse.json({ success: true, updated });
  } catch (err) {
    console.error("Admin leads PATCH error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/leads
 *
 * Hard delete one or more connections by ID.
 * Body: { ids: string[] }
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const adminUser = await getAdminUser(user.id);
    if (!adminUser) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const body = await request.json();
    const ids: string[] = body.ids;
    const reason: string | undefined = body.reason;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "ids array is required" }, { status: 400 });
    }

    if (ids.length > 100) {
      return NextResponse.json({ error: "Cannot delete more than 100 leads at once" }, { status: 400 });
    }

    const db = getServiceClient();

    // Fetch connection details before deleting (for audit log)
    const { data: toDelete } = await db
      .from("connections")
      .select(`
        id,
        type,
        status,
        created_at,
        from_profile:business_profiles!connections_from_profile_id_fkey(display_name),
        to_profile:business_profiles!connections_to_profile_id_fkey(display_name)
      `)
      .in("id", ids);

    // Hard delete
    const { error: deleteError, count } = await db
      .from("connections")
      .delete({ count: "exact" })
      .in("id", ids);

    if (deleteError) {
      console.error("Admin leads delete error:", deleteError);
      return NextResponse.json({ error: "Failed to delete leads" }, { status: 500 });
    }

    // Audit log each deletion
    for (const conn of toDelete ?? []) {
      await logAuditAction({
        adminUserId: adminUser.id,
        action: "delete_lead",
        targetType: "connection",
        targetId: conn.id,
        details: {
          type: conn.type,
          status: conn.status,
          from: (conn.from_profile as unknown as { display_name: string } | null)?.display_name,
          to: (conn.to_profile as unknown as { display_name: string } | null)?.display_name,
          created_at: conn.created_at,
          reason: reason || null,
        },
      });
    }

    return NextResponse.json({ success: true, deleted: count ?? 0 });
  } catch (err) {
    console.error("Admin leads delete error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
