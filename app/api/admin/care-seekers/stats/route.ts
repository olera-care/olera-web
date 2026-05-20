import { NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import type { FamilyMetadata } from "@/lib/types";

// ── Nudge eligibility helpers (must match cron job configuration) ──

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

function getCooldownForNudge(nudgeCount: number, cooldowns: number[]): number {
  if (nudgeCount < cooldowns.length) {
    return cooldowns[nudgeCount];
  }
  return MAINTENANCE_COOLDOWN;
}

function needsNudge(meta: FamilyMetadata, careTypes: string[], city: string | null, state: string | null, createdAt: string): boolean {
  if (isPublished(meta)) return false;
  if (meta.nudges_unsubscribed === true) return false;
  const profileComplete = isProfileComplete(meta, careTypes, city, state);
  const seq = profileComplete
    ? (meta.publish_sequence ?? { nudge_count: 0, phase: "active" as const })
    : (meta.completion_sequence ?? { nudge_count: 0, phase: "active" as const });

  // Use the correct cooldown based on phase and nudge count
  const cooldowns = profileComplete ? PUBLISH_COOLDOWNS : COMPLETION_COOLDOWNS;
  const cooldownDays = seq.phase === "maintenance"
    ? MAINTENANCE_COOLDOWN
    : getCooldownForNudge(seq.nudge_count, cooldowns);

  const lastNudge = seq.last_nudge_at ?? createdAt;
  return daysSince(lastNudge) >= cooldownDays;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DB = ReturnType<typeof getServiceClient>;

interface SeekerData {
  id: string;
  city: string | null;
  state: string | null;
  care_types: string[] | null;
  metadata: FamilyMetadata | null;
  created_at: string;
}

/**
 * Fetch all family profiles in batches (handles >1000 rows).
 */
async function fetchAllSeekers(db: DB): Promise<SeekerData[]> {
  const PAGE_SIZE = 1000;
  const allSeekers: SeekerData[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await db
      .from("business_profiles")
      .select("id, city, state, care_types, metadata, created_at")
      .eq("type", "family")
      .range(offset, offset + PAGE_SIZE - 1)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Stats fetchAllSeekers error:", error);
      break;
    }

    if (data && data.length > 0) {
      allSeekers.push(...(data as SeekerData[]));
      offset += PAGE_SIZE;
      hasMore = data.length === PAGE_SIZE;
    } else {
      hasMore = false;
    }
  }

  return allSeekers;
}

/**
 * GET /api/admin/care-seekers/stats
 *
 * Returns counts for care seeker filter tabs.
 */
export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const adminUser = await getAdminUser(user.id);
    if (!adminUser) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const db = getServiceClient();

    // Run count queries and paginated fetch in parallel
    const [totalRes, publishedRes, thisWeekRes, allSeekers, connectionsRes] = await Promise.all([
      // Total count
      db
        .from("business_profiles")
        .select("id", { count: "exact", head: true })
        .eq("type", "family"),

      // Published count (active care post)
      db
        .from("business_profiles")
        .select("id", { count: "exact", head: true })
        .eq("type", "family")
        .eq("is_active", true)
        .contains("metadata", { care_post: { status: "active" } }),

      // New this week
      db
        .from("business_profiles")
        .select("id", { count: "exact", head: true })
        .eq("type", "family")
        .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),

      // All seekers for nudge-related counts (paginated fetch)
      fetchAllSeekers(db),

      // All family connections for has_leads count
      db
        .from("connections")
        .select("from_profile_id")
        .eq("type", "inquiry"),
    ]);

    // Log any query errors for debugging
    if (totalRes.error) console.error("Stats total query error:", totalRes.error);
    if (publishedRes.error) console.error("Stats published query error:", publishedRes.error);
    if (thisWeekRes.error) console.error("Stats thisWeek query error:", thisWeekRes.error);
    if (connectionsRes.error) console.error("Stats connections query error:", connectionsRes.error);

    // Calculate unpublished as total - published (more reliable than complex OR query)
    const total = totalRes.count ?? 0;
    const published = publishedRes.count ?? 0;
    const unpublished = total - published;

    // Calculate needsNudge count (allSeekers is now from paginated fetch)
    let needsNudgeCount = 0;
    for (const seeker of allSeekers) {
      const meta = (seeker.metadata || {}) as FamilyMetadata;
      const careTypes = (seeker.care_types || []) as string[];
      if (needsNudge(meta, careTypes, seeker.city, seeker.state, seeker.created_at)) {
        needsNudgeCount++;
      }
    }

    // Calculate has_leads count (seekers with at least one connection)
    const connections = connectionsRes.data ?? [];
    const seekersWithLeads = new Set<string>();
    for (const conn of connections) {
      seekersWithLeads.add(conn.from_profile_id);
    }
    const familyIds = new Set(allSeekers.map((s) => s.id));
    const hasLeadsCount = [...seekersWithLeads].filter((id) => familyIds.has(id)).length;

    return NextResponse.json({
      total,
      published,
      unpublished,
      thisWeek: thisWeekRes.count ?? 0,
      needsNudge: needsNudgeCount,
      hasLeads: hasLeadsCount,
    });
  } catch (err) {
    console.error("Admin care-seekers stats error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
