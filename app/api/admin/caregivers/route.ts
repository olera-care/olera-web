import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { calculateCompleteness } from "@/lib/medjobs-completeness";
import type { CaregiverMetadata, StudentMetadata } from "@/lib/types";

// Incomplete threshold - profiles below this are considered incomplete
const INCOMPLETE_THRESHOLD = 80;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DB = ReturnType<typeof getServiceClient>;

interface CaregiverQueryResult {
  id: string;
  slug: string;
  type: "caregiver" | "student";
  display_name: string;
  email: string | null;
  phone: string | null;
  image_url: string | null;
  city: string | null;
  state: string | null;
  metadata: CaregiverMetadata | StudentMetadata | null;
  account_id: string | null;
  claim_state: string;
  verification_state: string;
  source: string;
  is_active: boolean;
  created_at: string;
}

/**
 * Calculate profile completeness for a caregiver/student.
 * Uses the comprehensive section-based calculation from medjobs-completeness.
 */
function computeProfileCompleteness(row: CaregiverQueryResult): number {
  const meta = (row.metadata || {}) as StudentMetadata;
  const hasPhoto = !!row.image_url;
  const hasBasicInfo = {
    hasName: !!row.display_name,
    hasUniversity: !!meta.university,
    hasLocation: !!(row.city && row.state),
  };

  // Use the comprehensive calculation from medjobs-completeness
  return calculateCompleteness(meta, hasPhoto, hasBasicInfo);
}

/**
 * Fetch all matching caregiver/student profiles in batches (handles >1000 rows).
 * Used when client-side filtering requires full dataset.
 */
async function fetchAllCaregiversWithFilters(
  db: DB,
  search: string,
  activeOnly: boolean,
  pausedOnly: boolean,
  cityFilter: string,
  typeFilter: string
): Promise<CaregiverQueryResult[]> {
  const PAGE_SIZE = 1000;
  const allCaregivers: CaregiverQueryResult[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    let query = db
      .from("business_profiles")
      .select(
        "id, slug, type, display_name, email, phone, image_url, city, state, metadata, account_id, claim_state, verification_state, source, is_active, created_at"
      )
      .in("type", ["caregiver", "student"])
      .order("created_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (typeFilter === "student" || typeFilter === "caregiver") {
      query = query.eq("type", typeFilter);
    }

    if (search) {
      query = query.or(`display_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    if (activeOnly) {
      query = query.eq("is_active", true);
    } else if (pausedOnly) {
      query = query.eq("is_active", false);
    }

    if (cityFilter === "__null__") {
      query = query.is("city", null);
    } else if (cityFilter) {
      query = query.eq("city", cityFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error("fetchAllCaregiversWithFilters error:", error);
      break;
    }

    if (data && data.length > 0) {
      allCaregivers.push(...(data as CaregiverQueryResult[]));
      offset += PAGE_SIZE;
      hasMore = data.length === PAGE_SIZE;
    } else {
      hasMore = false;
    }
  }

  return allCaregivers;
}

/**
 * GET /api/admin/caregivers
 *
 * List caregiver and student profiles with search, filters, and pagination.
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
    const activeOnly = searchParams.get("active_only") === "true";
    const pausedOnly = searchParams.get("paused_only") === "true";
    const incompleteOnly = searchParams.get("incomplete_only") === "true";
    const cityFilter = searchParams.get("city")?.trim() || "";
    const typeFilter = searchParams.get("type")?.trim() || "";

    const db = getServiceClient();

    // For incomplete filter, we need to fetch ALL data and filter client-side
    // because completeness is calculated on-the-fly from metadata fields
    const needsClientSideFilter = incompleteOnly;

    let data: CaregiverQueryResult[] | null;
    let count: number | null;
    let error: Error | null = null;

    if (!needsClientSideFilter) {
      // Standard DB pagination
      let query = db
        .from("business_profiles")
        .select(
          "id, slug, type, display_name, email, phone, image_url, city, state, metadata, account_id, claim_state, verification_state, source, is_active, created_at",
          { count: "exact" }
        )
        .in("type", ["caregiver", "student"])
        .order("created_at", { ascending: false });

      if (typeFilter === "student" || typeFilter === "caregiver") {
        query = query.eq("type", typeFilter);
      }

      if (search) {
        query = query.or(`display_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
      }

      if (activeOnly) {
        query = query.eq("is_active", true);
      } else if (pausedOnly) {
        query = query.eq("is_active", false);
      }

      if (cityFilter === "__null__") {
        query = query.is("city", null);
      } else if (cityFilter) {
        query = query.eq("city", cityFilter);
      }

      const from = (page - 1) * perPage;
      const to = from + perPage - 1;
      query = query.range(from, to);

      const result = await query;
      data = result.data as CaregiverQueryResult[] | null;
      count = result.count;
      error = result.error;
    } else {
      // Fetch ALL data for client-side filtering
      data = await fetchAllCaregiversWithFilters(db, search, activeOnly, pausedOnly, cityFilter, typeFilter);
      count = data.length;
    }

    if (error) {
      console.error("Admin caregivers list error:", error);
      return NextResponse.json({ error: `Failed to fetch caregivers: ${error.message}` }, { status: 500 });
    }

    // Transform data with computed fields - calculate completeness on-the-fly
    let caregivers = (data ?? []).map((row: CaregiverQueryResult) => {
      const meta = (row.metadata || {}) as StudentMetadata;
      const university = meta.university ?? null;
      // Calculate completeness using the comprehensive section-based formula
      const completeness = computeProfileCompleteness(row);

      return {
        ...row,
        profile_completeness: completeness,
        university,
      };
    });

    // Apply client-side filter for incomplete profiles
    if (incompleteOnly) {
      caregivers = caregivers.filter((c) => c.profile_completeness < INCOMPLETE_THRESHOLD);
    }

    // Calculate totals and pagination
    let total: number;
    let paginatedCaregivers: typeof caregivers;

    if (needsClientSideFilter) {
      // For client-side filtered data, paginate the filtered results
      total = caregivers.length;
      const from = (page - 1) * perPage;
      paginatedCaregivers = caregivers.slice(from, from + perPage);
    } else {
      // For DB-paginated data, use the DB count
      total = count ?? 0;
      paginatedCaregivers = caregivers;
    }

    const totalPages = Math.ceil(total / perPage);

    return NextResponse.json({
      caregivers: paginatedCaregivers,
      total,
      page,
      per_page: perPage,
      total_pages: totalPages,
    });
  } catch (err) {
    console.error("Admin caregivers list error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
