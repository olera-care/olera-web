import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import type { FamilyMetadata, NudgeSequence } from "@/lib/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DB = ReturnType<typeof getServiceClient>;

interface SeekerQueryResult {
  id: string;
  slug: string;
  display_name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  care_types: string[] | null;
  metadata: FamilyMetadata | null;
  account_id: string | null;
  claim_state: string;
  source: string;
  created_at: string;
}

/**
 * Fetch all matching family profiles in batches (handles >1000 rows).
 * Used when client-side filtering requires full dataset.
 */
async function fetchAllSeekersWithFilters(
  db: DB,
  search: string,
  publishedOnly: boolean,
  unpublishedOnly: boolean,
  cityFilter: string,
  stateFilter: string,
): Promise<SeekerQueryResult[]> {
  const PAGE_SIZE = 1000;
  const allSeekers: SeekerQueryResult[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    let query = db
      .from("business_profiles")
      .select("id, slug, display_name, email, phone, city, state, care_types, metadata, account_id, claim_state, source, created_at")
      .eq("type", "family")
      .order("created_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (search) {
      query = query.or(`display_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    if (publishedOnly) {
      query = query
        .eq("is_active", true)
        .contains("metadata", { care_post: { status: "active" } });
    } else if (unpublishedOnly) {
      query = query.not("metadata", "cs", JSON.stringify({ care_post: { status: "active" } }));
    }

    if (cityFilter === "__null__") {
      query = query.is("city", null);
    } else if (cityFilter) {
      query = query.eq("city", cityFilter);
    }

    if (stateFilter) {
      query = query.eq("state", stateFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error("fetchAllSeekersWithFilters error:", error);
      break;
    }

    if (data && data.length > 0) {
      allSeekers.push(...(data as SeekerQueryResult[]));
      offset += PAGE_SIZE;
      hasMore = data.length === PAGE_SIZE;
    } else {
      hasMore = false;
    }
  }

  return allSeekers;
}

// ── Nudge eligibility helpers ──
// Cooldowns must match the cron job configuration exactly

const COMPLETION_COOLDOWNS = [3, 5, 7, 7]; // days between nudges in active phase
const PUBLISH_COOLDOWNS = [1, 4, 5, 5];    // days between nudges in active phase
const MAINTENANCE_COOLDOWN = 30;           // days between maintenance nudges

function daysSince(isoDate: string | undefined): number {
  if (!isoDate) return Infinity;
  return Math.floor((Date.now() - new Date(isoDate).getTime()) / (1000 * 60 * 60 * 24));
}

function isProfileComplete(meta: FamilyMetadata, careTypes: string[], city: string | null, state: string | null): boolean {
  const hasCareTypes = careTypes && careTypes.length > 0;
  const hasLocation = !!(city && state);
  return hasCareTypes && hasLocation;
}

function isPublished(meta: FamilyMetadata): boolean {
  return meta.care_post?.status === "active";
}

function getActiveSequence(meta: FamilyMetadata, profileComplete: boolean): NudgeSequence | null {
  // If profile is published, no sequence is active
  if (isPublished(meta)) return null;

  // If profile incomplete, use completion sequence
  if (!profileComplete) {
    return meta.completion_sequence ?? null;
  }

  // If profile complete but not published, use publish sequence
  return meta.publish_sequence ?? null;
}

function getNudgePhase(meta: FamilyMetadata, profileComplete: boolean): "none" | "active" | "maintenance" | "done" {
  if (isPublished(meta)) return "done";

  const seq = getActiveSequence(meta, profileComplete);
  if (!seq) return "none";

  return seq.phase;
}

function getCooldownForNudge(nudgeCount: number, cooldowns: number[]): number {
  if (nudgeCount < cooldowns.length) {
    return cooldowns[nudgeCount];
  }
  return MAINTENANCE_COOLDOWN;
}

function needsNudge(meta: FamilyMetadata, careTypes: string[], city: string | null, state: string | null, createdAt: string): boolean {
  // Skip if published or unsubscribed
  if (isPublished(meta)) return false;
  if (meta.nudges_unsubscribed === true) return false;

  const profileComplete = isProfileComplete(meta, careTypes, city, state);

  // Check which sequence applies
  const seq = profileComplete
    ? (meta.publish_sequence ?? { nudge_count: 0, phase: "active" as const })
    : (meta.completion_sequence ?? { nudge_count: 0, phase: "active" as const });

  // Use the correct cooldown based on phase and nudge count
  const cooldowns = profileComplete ? PUBLISH_COOLDOWNS : COMPLETION_COOLDOWNS;
  const cooldownDays = seq.phase === "maintenance"
    ? MAINTENANCE_COOLDOWN
    : getCooldownForNudge(seq.nudge_count, cooldowns);

  // Check if cooldown has passed
  const lastNudge = seq.last_nudge_at ?? createdAt;
  const daysSinceNudge = daysSince(lastNudge);

  return daysSinceNudge >= cooldownDays;
}

/**
 * GET /api/admin/care-seekers
 *
 * List family profiles with search, filters, and pagination.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const adminUser = await getAdminUser(user.id);
    if (!adminUser) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get("per_page") || "50", 10)));
    const publishedOnly = searchParams.get("published_only") === "true";
    const unpublishedOnly = searchParams.get("unpublished_only") === "true";
    const needsNudgeOnly = searchParams.get("needs_nudge") === "true";
    const cityFilter = searchParams.get("city")?.trim() || "";
    const stateFilter = searchParams.get("state")?.trim() || "";

    const db = getServiceClient();

    let query = db
      .from("business_profiles")
      .select("id, slug, display_name, email, phone, city, state, care_types, metadata, account_id, claim_state, source, created_at", { count: "exact" })
      .eq("type", "family")
      .order("created_at", { ascending: false });

    if (search) {
      query = query.or(`display_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    // Published status filters
    if (publishedOnly) {
      query = query
        .eq("is_active", true)
        .contains("metadata", { care_post: { status: "active" } });
    } else if (unpublishedOnly) {
      query = query.not("metadata", "cs", JSON.stringify({ care_post: { status: "active" } }));
    }

    if (cityFilter === "__null__") {
      query = query.is("city", null);
    } else if (cityFilter) {
      query = query.eq("city", cityFilter);
    }

    if (stateFilter) {
      query = query.eq("state", stateFilter);
    }

    // For nudge-related filters, we need to fetch ALL data and filter client-side
    // because these filters require metadata parsing that can't be done in SQL
    const needsClientSideFilter = needsNudgeOnly;

    let data: SeekerQueryResult[] | null;
    let count: number | null;
    let error: Error | null = null;

    if (!needsClientSideFilter) {
      // Standard DB pagination for non-nudge filters
      const from = (page - 1) * perPage;
      const to = from + perPage - 1;
      query = query.range(from, to);
      const result = await query;
      data = result.data as SeekerQueryResult[] | null;
      count = result.count;
      error = result.error;
    } else {
      // Fetch ALL data using paginated helper for client-side filtering
      data = await fetchAllSeekersWithFilters(db, search, publishedOnly, unpublishedOnly, cityFilter, stateFilter);
      count = data.length;
    }

    if (error) {
      console.error("Admin care-seekers list error:", error);
      return NextResponse.json({ error: `Failed to fetch care seekers: ${error.message}` }, { status: 500 });
    }

    // Get connection counts for all seekers
    const seekerIds = (data ?? []).map((s) => s.id);
    let connectionCounts: Record<string, number> = {};
    if (seekerIds.length > 0) {
      const { data: connections } = await db
        .from("connections")
        .select("from_profile_id")
        .in("from_profile_id", seekerIds)
        .eq("type", "inquiry");

      if (connections) {
        for (const conn of connections) {
          connectionCounts[conn.from_profile_id] = (connectionCounts[conn.from_profile_id] || 0) + 1;
        }
      }
    }

    // Transform data with computed fields
    let seekers = (data ?? []).map((seeker) => {
      const meta = (seeker.metadata || {}) as FamilyMetadata;
      const careTypes = (seeker.care_types || []) as string[];
      const profileComplete = isProfileComplete(meta, careTypes, seeker.city, seeker.state);
      const phase = getNudgePhase(meta, profileComplete);

      // Get current sequence for display
      const currentSeq = profileComplete ? meta.publish_sequence : meta.completion_sequence;

      return {
        ...seeker,
        connection_count: connectionCounts[seeker.id] || 0,
        profile_complete: profileComplete,
        nudge_phase: phase,
        current_sequence: currentSeq || null,
        sequence_type: profileComplete ? "publish" : "completion",
      };
    });

    // Apply nudge filter (client-side since it requires metadata parsing)
    if (needsNudgeOnly) {
      seekers = seekers.filter((s) => {
        const meta = (s.metadata || {}) as FamilyMetadata;
        return needsNudge(meta, s.care_types || [], s.city, s.state, s.created_at);
      });
    }

    // Calculate correct totals for client-side filtered results
    let total: number;
    let paginatedSeekers: typeof seekers;

    if (needsClientSideFilter) {
      // For client-side filtered data, paginate the filtered results
      total = seekers.length;
      const from = (page - 1) * perPage;
      paginatedSeekers = seekers.slice(from, from + perPage);
    } else {
      // For DB-paginated data, use the DB count
      total = count ?? 0;
      paginatedSeekers = seekers;
    }

    const totalPages = Math.ceil(total / perPage);

    return NextResponse.json({ seekers: paginatedSeekers, total, page, per_page: perPage, total_pages: totalPages });
  } catch (err) {
    console.error("Admin care-seekers list error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
