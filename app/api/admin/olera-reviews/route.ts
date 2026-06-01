import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

interface OleraReviewRow {
  id: string;
  provider_slug: string;
  reviewer_name: string;
  rating: number;
  review_text: string;
  flagged: boolean;
  flagged_at: string | null;
  flagged_reason: string | null;
  created_at: string;
}

interface BusinessProfileRow {
  slug: string;
  display_name: string;
  account_id: string;
}

interface AccountRow {
  id: string;
  user_id: string;
}

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const adminUser = await getAdminUser(user.id);
  if (!adminUser) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const search = searchParams.get("search") || "";
  const flagged = searchParams.get("flagged") || "all"; // all, flagged, not_flagged
  const limit = parseInt(searchParams.get("limit") || "100", 10);
  const offset = parseInt(searchParams.get("offset") || "0", 10);
  const fromDate = searchParams.get("from_date");
  const toDate = searchParams.get("to_date");

  const db = getServiceClient();

  try {
    // Build query
    let query = db
      .from("olera_reviews")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by flagged status
    if (flagged === "flagged") {
      query = query.eq("flagged", true);
    } else if (flagged === "not_flagged") {
      query = query.eq("flagged", false);
    }

    // Filter by date range
    if (fromDate) {
      query = query.gte("created_at", fromDate);
    }
    if (toDate) {
      query = query.lte("created_at", toDate);
    }

    // Search by reviewer name or provider slug
    if (search) {
      query = query.or(
        `reviewer_name.ilike.%${search}%,provider_slug.ilike.%${search}%`
      );
    }

    const { data: reviews, count, error } = await query;

    if (error) {
      console.error("Failed to fetch olera reviews:", error);
      return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
    }

    const typedReviews = (reviews || []) as OleraReviewRow[];

    // Get unique provider slugs
    const slugs = [...new Set(typedReviews.map((r) => r.provider_slug))];

    // Fetch provider profiles to get display names and account IDs
    const { data: profiles } = await db
      .from("business_profiles")
      .select("slug, display_name, account_id")
      .in("slug", slugs);

    const typedProfiles = (profiles || []) as BusinessProfileRow[];
    const profileBySlug = new Map<string, BusinessProfileRow>();
    for (const p of typedProfiles) {
      profileBySlug.set(p.slug, p);
    }

    // Get account user_ids for providers
    const accountIds = [...new Set(typedProfiles.map((p) => p.account_id).filter(Boolean))];
    const { data: accounts } = await db
      .from("accounts")
      .select("id, user_id")
      .in("id", accountIds);

    const typedAccounts = (accounts || []) as AccountRow[];
    const accountById = new Map<string, AccountRow>();
    for (const a of typedAccounts) {
      accountById.set(a.id, a);
    }

    // Fetch emails from auth.users for each unique user_id
    const userIds = [...new Set(typedAccounts.map((a) => a.user_id).filter(Boolean))];
    const emailByUserId = new Map<string, string>();

    for (const userId of userIds) {
      try {
        const { data: authUser } = await db.auth.admin.getUserById(userId);
        if (authUser?.user?.email) {
          emailByUserId.set(userId, authUser.user.email);
        }
      } catch {
        // Ignore errors for individual user lookups
      }
    }

    // Transform reviews with provider info
    const enrichedReviews = typedReviews.map((review) => {
      const profile = profileBySlug.get(review.provider_slug);
      const account = profile?.account_id ? accountById.get(profile.account_id) : null;
      const email = account?.user_id ? emailByUserId.get(account.user_id) : null;

      return {
        id: review.id,
        provider_slug: review.provider_slug,
        provider_name: profile?.display_name || formatSlug(review.provider_slug),
        provider_email: email || null,
        reviewer_name: review.reviewer_name,
        rating: review.rating,
        review_text: review.review_text,
        flagged: review.flagged,
        flagged_at: review.flagged_at,
        flagged_reason: review.flagged_reason,
        created_at: review.created_at,
      };
    });

    // Get flagged count for badge
    const { count: flaggedCount } = await db
      .from("olera_reviews")
      .select("*", { count: "exact", head: true })
      .eq("flagged", true);

    return NextResponse.json({
      reviews: enrichedReviews,
      total: count ?? 0,
      flagged_count: flaggedCount ?? 0,
    });
  } catch (err) {
    console.error("Olera reviews admin error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function formatSlug(slug: string): string {
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
