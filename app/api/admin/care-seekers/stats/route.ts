import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { calculateFamilyCompleteness } from "@/lib/admin/profile-completeness";
import type { FamilyMetadata } from "@/lib/types";

// ── Nudge eligibility helpers (must match cron job configuration) ──

const COMPLETION_COOLDOWNS = [3, 5, 7, 7]; // days between nudges in active phase
const PUBLISH_COOLDOWNS = [1, 4, 5, 5];    // days between nudges in active phase
const MAINTENANCE_COOLDOWN = 30;           // days between maintenance nudges
const PROFILE_COMPLETE_THRESHOLD = 80;     // must match cron job

function daysSince(isoDate: string | undefined): number {
  if (!isoDate) return Infinity;
  return Math.floor((Date.now() - new Date(isoDate).getTime()) / (1000 * 60 * 60 * 24));
}

function isProfileComplete(seeker: SeekerData, email: string | null): boolean {
  const completeness = calculateFamilyCompleteness(seeker, email);
  return completeness.percentage >= PROFILE_COMPLETE_THRESHOLD;
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

function needsNudge(seeker: SeekerData): boolean {
  const meta = (seeker.metadata || {}) as FamilyMetadata;
  if (isPublished(meta)) return false;
  if (meta.nudges_unsubscribed === true) return false;
  const profileComplete = isProfileComplete(seeker, seeker.email);
  const seq = profileComplete
    ? (meta.publish_sequence ?? { nudge_count: 0, phase: "active" as const })
    : (meta.completion_sequence ?? { nudge_count: 0, phase: "active" as const });

  // Use the correct cooldown based on phase and nudge count
  const cooldowns = profileComplete ? PUBLISH_COOLDOWNS : COMPLETION_COOLDOWNS;
  const cooldownDays = seq.phase === "maintenance"
    ? MAINTENANCE_COOLDOWN
    : getCooldownForNudge(seq.nudge_count, cooldowns);

  const lastNudge = seq.last_nudge_at ?? seeker.created_at;
  return daysSince(lastNudge) >= cooldownDays;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DB = ReturnType<typeof getServiceClient>;

interface SeekerData {
  id: string;
  email: string | null;
  phone: string | null;
  image_url: string | null;
  city: string | null;
  state: string | null;
  description: string | null;
  care_types: string[] | null;
  metadata: FamilyMetadata | null;
  created_at: string;
}

/**
 * Fetch all family profiles in batches (handles >1000 rows).
 */
async function fetchAllSeekers(db: DB, fromDate: string, toDate: string): Promise<SeekerData[]> {
  const PAGE_SIZE = 1000;
  const allSeekers: SeekerData[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    let query = db
      .from("business_profiles")
      .select("id, email, phone, image_url, city, state, description, care_types, metadata, created_at")
      .eq("type", "family")
      .range(offset, offset + PAGE_SIZE - 1)
      .order("created_at", { ascending: false });

    if (fromDate) {
      query = query.gte("created_at", fromDate);
    }
    if (toDate) {
      query = query.lte("created_at", toDate);
    }

    const { data, error } = await query;

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
 * Supports optional date range filtering via from_date and to_date query params.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const adminUser = await getAdminUser(user.id);
    if (!adminUser) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const fromDate = searchParams.get("from_date")?.trim() || "";
    const toDate = searchParams.get("to_date")?.trim() || "";

    const db = getServiceClient();

    // Build base queries with optional date filtering
    let totalQuery = db
      .from("business_profiles")
      .select("id", { count: "exact", head: true })
      .eq("type", "family");

    let publishedQuery = db
      .from("business_profiles")
      .select("id", { count: "exact", head: true })
      .eq("type", "family")
      .eq("is_active", true)
      .contains("metadata", { care_post: { status: "active" } });

    let thisWeekQuery = db
      .from("business_profiles")
      .select("id", { count: "exact", head: true })
      .eq("type", "family")
      .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    // Apply date filters if provided
    if (fromDate) {
      totalQuery = totalQuery.gte("created_at", fromDate);
      publishedQuery = publishedQuery.gte("created_at", fromDate);
      thisWeekQuery = thisWeekQuery.gte("created_at", fromDate);
    }
    if (toDate) {
      totalQuery = totalQuery.lte("created_at", toDate);
      publishedQuery = publishedQuery.lte("created_at", toDate);
      thisWeekQuery = thisWeekQuery.lte("created_at", toDate);
    }

    // Run count queries and paginated fetch in parallel
    const [totalRes, publishedRes, thisWeekRes, allSeekers] = await Promise.all([
      totalQuery,
      publishedQuery,
      thisWeekQuery,
      fetchAllSeekers(db, fromDate, toDate),
    ]);

    // Log any query errors for debugging
    if (totalRes.error) console.error("Stats total query error:", totalRes.error);
    if (publishedRes.error) console.error("Stats published query error:", publishedRes.error);
    if (thisWeekRes.error) console.error("Stats thisWeek query error:", thisWeekRes.error);

    // Calculate unpublished as total - published (more reliable than complex OR query)
    const total = totalRes.count ?? 0;
    const published = publishedRes.count ?? 0;
    const unpublished = total - published;

    // Calculate needsNudge count (allSeekers is now from paginated fetch)
    let needsNudgeCount = 0;
    for (const seeker of allSeekers) {
      if (needsNudge(seeker)) {
        needsNudgeCount++;
      }
    }

    return NextResponse.json({
      total,
      published,
      unpublished,
      thisWeek: thisWeekRes.count ?? 0,
      needsNudge: needsNudgeCount,
    });
  } catch (err) {
    console.error("Admin care-seekers stats error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
