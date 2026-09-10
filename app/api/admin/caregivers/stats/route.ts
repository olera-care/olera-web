import { NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { calculateCompleteness } from "@/lib/medjobs-completeness";
import type { CaregiverMetadata, StudentMetadata } from "@/lib/types";

// Must match the threshold in the main route
const INCOMPLETE_THRESHOLD = 80;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DB = ReturnType<typeof getServiceClient>;

interface ProfileForCompleteness {
  id: string;
  type: "caregiver" | "student";
  display_name: string;
  image_url: string | null;
  city: string | null;
  state: string | null;
  metadata: StudentMetadata | CaregiverMetadata | null;
}

/**
 * Fetch all caregiver/student profiles to count incomplete ones.
 * We need type, display_name, image_url, city, state, and metadata to calculate completeness.
 */
async function fetchAllForIncompleteCount(db: DB): Promise<ProfileForCompleteness[]> {
  const PAGE_SIZE = 1000;
  const allProfiles: ProfileForCompleteness[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await db
      .from("business_profiles")
      .select("id, type, display_name, image_url, city, state, metadata")
      .in("type", ["caregiver", "student"])
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      console.error("fetchAllForIncompleteCount error:", error);
      break;
    }

    if (data && data.length > 0) {
      allProfiles.push(...(data as ProfileForCompleteness[]));
      offset += PAGE_SIZE;
      hasMore = data.length === PAGE_SIZE;
    } else {
      hasMore = false;
    }
  }

  return allProfiles;
}

/**
 * Calculate completeness for a regular caregiver (non-student).
 * Simpler formula based on CaregiverMetadata fields.
 */
function computeCaregiverCompleteness(
  profile: ProfileForCompleteness,
  meta: CaregiverMetadata
): number {
  const fields = [
    { filled: !!profile.display_name, weight: 20 },
    { filled: !!profile.image_url, weight: 15 },
    { filled: !!(profile.city && profile.state), weight: 15 },
    { filled: (meta.certifications?.length ?? 0) > 0, weight: 15 },
    { filled: meta.years_experience != null, weight: 10 },
    { filled: (meta.languages?.length ?? 0) > 0, weight: 10 },
    { filled: !!meta.availability, weight: 10 },
    { filled: meta.hourly_rate_min != null || meta.hourly_rate_max != null, weight: 5 },
  ];
  return fields.reduce((sum, f) => sum + (f.filled ? f.weight : 0), 0);
}

/**
 * Calculate profile completeness for a caregiver/student.
 * Uses different formulas based on profile type:
 * - Students: Comprehensive section-based calculation from medjobs-completeness
 * - Caregivers: Simpler formula based on CaregiverMetadata fields
 */
function computeProfileCompleteness(profile: ProfileForCompleteness): number {
  const meta = profile.metadata || {};

  // For students, use the comprehensive MedJobs completeness calculation
  if (profile.type === "student") {
    const studentMeta = meta as StudentMetadata;
    const hasPhoto = !!profile.image_url;
    const hasBasicInfo = {
      hasName: !!profile.display_name,
      hasUniversity: !!studentMeta.university,
      hasLocation: !!(profile.city && profile.state),
    };
    return calculateCompleteness(studentMeta, hasPhoto, hasBasicInfo);
  }

  // For regular caregivers, use a simpler formula
  return computeCaregiverCompleteness(profile, meta as CaregiverMetadata);
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

    // Count incomplete profiles using the live calculation
    let incompleteCount = 0;
    for (const profile of allProfiles) {
      const completeness = computeProfileCompleteness(profile);
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
