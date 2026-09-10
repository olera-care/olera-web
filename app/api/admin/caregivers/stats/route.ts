import { NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import type { StudentMetadata } from "@/lib/types";

// Must match the threshold in the main route
const INCOMPLETE_THRESHOLD = 80;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DB = ReturnType<typeof getServiceClient>;

interface ProfileWithMetadata {
  id: string;
  metadata: StudentMetadata | null;
}

/**
 * Fetch all caregiver/student profiles to count incomplete ones.
 * Profile completeness is stored in JSONB metadata, so we need to check client-side.
 */
async function fetchAllForIncompleteCount(db: DB): Promise<ProfileWithMetadata[]> {
  const PAGE_SIZE = 1000;
  const allProfiles: ProfileWithMetadata[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await db
      .from("business_profiles")
      .select("id, metadata")
      .in("type", ["caregiver", "student"])
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      console.error("fetchAllForIncompleteCount error:", error);
      break;
    }

    if (data && data.length > 0) {
      allProfiles.push(...(data as ProfileWithMetadata[]));
      offset += PAGE_SIZE;
      hasMore = data.length === PAGE_SIZE;
    } else {
      hasMore = false;
    }
  }

  return allProfiles;
}

/**
 * GET /api/admin/caregivers/stats
 *
 * Returns counts for caregiver filter tabs.
 */
export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const adminUser = await getAdminUser(user.id);
    if (!adminUser) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const db = getServiceClient();

    // Run count queries and fetch for incomplete count in parallel
    const [totalRes, activeRes, pausedRes, thisWeekRes, studentsRes, caregiversRes, allProfiles] = await Promise.all([
      // Total caregivers + students
      db
        .from("business_profiles")
        .select("id", { count: "exact", head: true })
        .in("type", ["caregiver", "student"]),

      // Active (is_active = true)
      db
        .from("business_profiles")
        .select("id", { count: "exact", head: true })
        .in("type", ["caregiver", "student"])
        .eq("is_active", true),

      // Paused (is_active = false)
      db
        .from("business_profiles")
        .select("id", { count: "exact", head: true })
        .in("type", ["caregiver", "student"])
        .eq("is_active", false),

      // New this week
      db
        .from("business_profiles")
        .select("id", { count: "exact", head: true })
        .in("type", ["caregiver", "student"])
        .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),

      // Students only
      db
        .from("business_profiles")
        .select("id", { count: "exact", head: true })
        .eq("type", "student"),

      // Caregivers only
      db
        .from("business_profiles")
        .select("id", { count: "exact", head: true })
        .eq("type", "caregiver"),

      // Fetch all for incomplete count
      fetchAllForIncompleteCount(db),
    ]);

    // Log any query errors for debugging
    if (totalRes.error) console.error("Stats total query error:", totalRes.error);
    if (activeRes.error) console.error("Stats active query error:", activeRes.error);
    if (pausedRes.error) console.error("Stats paused query error:", pausedRes.error);
    if (thisWeekRes.error) console.error("Stats thisWeek query error:", thisWeekRes.error);

    // Count incomplete profiles (completeness < threshold)
    let incompleteCount = 0;
    for (const profile of allProfiles) {
      const completeness = (profile.metadata as StudentMetadata)?.profile_completeness ?? 0;
      if (completeness < INCOMPLETE_THRESHOLD) {
        incompleteCount++;
      }
    }

    return NextResponse.json({
      total: totalRes.count ?? 0,
      active: activeRes.count ?? 0,
      paused: pausedRes.count ?? 0,
      incomplete: incompleteCount,
      thisWeek: thisWeekRes.count ?? 0,
      students: studentsRes.count ?? 0,
      caregivers: caregiversRes.count ?? 0,
    });
  } catch (err) {
    console.error("Admin caregivers stats error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
