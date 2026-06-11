import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { parseAdminOverride } from "@/lib/connection-engagement";

/**
 * GET /api/admin/provider-fact-sheet?provider_id={slug|source_provider_id|id}
 *
 * Returns a fact sheet for a provider with:
 * - Provider contact info
 * - All leads (connections where provider is to_profile)
 * - Unanswered questions (pending/approved status)
 *
 * Used by the Fact Sheet modal in the Needs Call tab to give customer reps
 * context before calling unresponsive providers.
 */

const CARE_TYPE_LABELS: Record<string, string> = {
  home_care: "Home Care",
  home_health: "Home Health Care",
  assisted_living: "Assisted Living",
  memory_care: "Memory Care",
};

function daysSince(isoDate: string | null): number {
  if (!isoDate) return 0;
  const created = new Date(isoDate).getTime();
  const now = Date.now();
  return Math.floor((now - created) / (1000 * 60 * 60 * 24));
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const admin = await getAdminUser(user.id);
    if (!admin) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get("provider_id");

    if (!providerId) {
      return NextResponse.json({ error: "provider_id required" }, { status: 400 });
    }

    const db = getServiceClient();

    // Step 1: Find the provider's business_profile
    // The providerId could be a slug, source_provider_id, or profile id
    let providerProfile: {
      id: string;
      display_name: string | null;
      email: string | null;
      phone: string | null;
      slug: string | null;
      source_provider_id: string | null;
    } | null = null;

    // Try by slug first
    const { data: bySlug } = await db
      .from("business_profiles")
      .select("id, display_name, email, phone, slug, source_provider_id")
      .eq("slug", providerId)
      .maybeSingle();

    if (bySlug) {
      providerProfile = bySlug;
    } else {
      // Try by source_provider_id
      const { data: bySourceId } = await db
        .from("business_profiles")
        .select("id, display_name, email, phone, slug, source_provider_id")
        .eq("source_provider_id", providerId)
        .maybeSingle();

      if (bySourceId) {
        providerProfile = bySourceId;
      } else {
        // Try by id
        const { data: byId } = await db
          .from("business_profiles")
          .select("id, display_name, email, phone, slug, source_provider_id")
          .eq("id", providerId)
          .maybeSingle();

        if (byId) {
          providerProfile = byId;
        }
      }
    }

    if (!providerProfile) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    // Fetch fallback email from olera-providers if needed
    let providerEmail = providerProfile.email?.trim() || null;
    if (!providerEmail && providerProfile.source_provider_id) {
      const { data: iosProvider } = await db
        .from("olera-providers")
        .select("email")
        .eq("provider_id", providerProfile.source_provider_id)
        .not("deleted", "is", true)
        .maybeSingle();
      providerEmail = iosProvider?.email?.trim() || null;
    }

    // Step 2: Fetch all leads (connections) for this provider
    // Provider is to_profile for inbound inquiries
    const { data: connections } = await db
      .from("connections")
      .select(`
        id, type, status, message, metadata, created_at,
        from_profile:business_profiles!connections_from_profile_id_fkey(
          id, display_name, email, phone, care_types
        )
      `)
      .eq("to_profile_id", providerProfile.id)
      .eq("type", "inquiry")
      .not("metadata", "cs", JSON.stringify({ archived: true }))
      .order("created_at", { ascending: false })
      .limit(50);

    // Step 2b: Fetch provider engagement events to determine engagement level per lead
    // Engagement is stored in provider_activity, not connection metadata
    const providerActivityKeys = [
      providerProfile.slug,
      providerProfile.source_provider_id,
      providerProfile.id,
    ].filter(Boolean) as string[];

    const connectionIds = (connections ?? []).map((c) => c.id);

    // Build per-connection engagement map
    const connectionEngagement = new Map<string, { viewed: boolean }>();
    for (const id of connectionIds) {
      connectionEngagement.set(id, { viewed: false });
    }

    if (providerActivityKeys.length > 0 && connectionIds.length > 0) {
      const { data: activityEvents } = await db
        .from("provider_activity")
        .select("event_type, metadata")
        .in("provider_id", providerActivityKeys)
        .in("event_type", ["lead_opened", "contact_revealed"]);

      for (const event of activityEvents ?? []) {
        const eventMeta = event.metadata as Record<string, unknown> | null;
        const eventConnectionId = eventMeta?.connection_id as string | undefined;

        if (eventConnectionId && connectionEngagement.has(eventConnectionId)) {
          const current = connectionEngagement.get(eventConnectionId)!;
          // Both lead_opened and contact_revealed count as "viewed" (passive interest)
          if (event.event_type === "lead_opened" || event.event_type === "contact_revealed") {
            current.viewed = true;
          }
        }
      }
    }

    // Map connections to lead format
    const leads = (connections ?? []).map((c) => {
      const family = Array.isArray(c.from_profile) ? c.from_profile[0] : c.from_profile;
      const meta = (c.metadata ?? {}) as Record<string, unknown>;

      // Parse care type from message or family profile
      let careType: string | null = null;
      if (c.message) {
        try {
          const msgJson = JSON.parse(String(c.message));
          careType = msgJson.care_type ? (CARE_TYPE_LABELS[msgJson.care_type] || msgJson.care_type) : null;
        } catch {
          // Not JSON, ignore
        }
      }
      if (!careType && family?.care_types?.length) {
        careType = CARE_TYPE_LABELS[family.care_types[0]] || family.care_types[0];
      }

      // Determine engagement level from thread (connected) and provider_activity (viewed)
      // Check admin override first (highest priority)
      let engagementLevel = "new";
      const adminOverride = meta.admin_override ? parseAdminOverride(meta.admin_override) : null;
      const thread = (meta.thread as Array<{ from_profile_id?: string; text?: string; is_auto_reply?: boolean }>) || [];
      const providerMessaged = thread.some(
        (m) => m.from_profile_id === providerProfile!.id && m.is_auto_reply !== true && !!m.text?.trim()
      );

      const engagement = connectionEngagement.get(c.id);

      // Priority: Admin override > Automatic tracking
      if (adminOverride?.status === "connected") {
        engagementLevel = "connected";
      } else if (adminOverride?.status === "viewed") {
        engagementLevel = "viewed";
      } else if (providerMessaged) {
        engagementLevel = "connected";
      } else if (engagement?.viewed) {
        engagementLevel = "viewed";
      }

      return {
        id: c.id,
        familyName: family?.display_name || "Unknown",
        familyEmail: family?.email || null,
        familyPhone: family?.phone || null,
        careType,
        createdAt: c.created_at,
        daysSinceInquiry: daysSince(c.created_at),
        engagementLevel,
      };
    });

    // Step 3: Fetch unanswered questions for this provider
    // Use provider slug for provider_questions lookup (that's how they're stored)
    const providerSlug = providerProfile.slug || providerProfile.source_provider_id || providerProfile.id;

    const { data: questions } = await db
      .from("provider_questions")
      .select("id, question, asker_name, created_at, status")
      .eq("provider_id", providerSlug)
      .in("status", ["pending", "approved"])
      .order("created_at", { ascending: false })
      .limit(20);

    const formattedQuestions = (questions ?? []).map((q) => ({
      id: q.id,
      question: q.question,
      askerName: q.asker_name,
      createdAt: q.created_at,
      daysSinceAsked: daysSince(q.created_at),
    }));

    return NextResponse.json({
      provider: {
        name: providerProfile.display_name || "Unknown Provider",
        email: providerEmail,
        phone: providerProfile.phone || null,
        totalLeads: leads.length,
        totalUnansweredQuestions: formattedQuestions.length,
      },
      leads,
      questions: formattedQuestions,
    });
  } catch (err) {
    console.error("[provider-fact-sheet] fatal:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
