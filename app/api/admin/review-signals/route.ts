import { NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

interface SignalRow {
  provider_id: string;
  signal_count: number;
  last_signal_at: string;
}

interface BusinessProfileRow {
  slug: string;
  display_name: string;
}

/**
 * GET /api/admin/review-signals
 *
 * Fetches aggregated "review_no_email_signal" events from provider_activity.
 * Returns providers grouped by slug with click counts and last signal time.
 */
export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const adminUser = await getAdminUser(user.id);
  if (!adminUser) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = getServiceClient();

  try {
    // Aggregate signals by provider_id (slug)
    // Using raw SQL via RPC for aggregation since Supabase JS doesn't support GROUP BY directly
    // Limit to last 1000 events to prevent unbounded growth
    const { data: rawSignals, error: signalError } = await db
      .from("provider_activity")
      .select("provider_id, created_at")
      .eq("event_type", "review_no_email_signal")
      .order("created_at", { ascending: false })
      .limit(1000);

    if (signalError) {
      console.error("Failed to fetch review signals:", signalError);
      return NextResponse.json({ error: "Failed to fetch signals" }, { status: 500 });
    }

    if (!rawSignals || rawSignals.length === 0) {
      return NextResponse.json({ signals: [], total: 0 });
    }

    // Aggregate in JS since Supabase doesn't support GROUP BY
    const signalMap = new Map<string, { count: number; lastAt: string }>();
    for (const row of rawSignals) {
      const existing = signalMap.get(row.provider_id);
      if (existing) {
        existing.count++;
        // Keep the most recent timestamp
        if (new Date(row.created_at) > new Date(existing.lastAt)) {
          existing.lastAt = row.created_at;
        }
      } else {
        signalMap.set(row.provider_id, { count: 1, lastAt: row.created_at });
      }
    }

    // Get unique provider slugs
    const slugs = Array.from(signalMap.keys());

    // Fetch provider display names
    const { data: profiles } = await db
      .from("business_profiles")
      .select("slug, display_name")
      .in("slug", slugs);

    const typedProfiles = (profiles || []) as BusinessProfileRow[];
    const nameBySlug = new Map<string, string>();
    for (const p of typedProfiles) {
      nameBySlug.set(p.slug, p.display_name);
    }

    // Build response sorted by last signal (most recent first)
    const signals: SignalRow[] = [];
    signalMap.forEach((data, slug) => {
      signals.push({
        provider_id: slug,
        signal_count: data.count,
        last_signal_at: data.lastAt,
      });
    });

    // Sort by last_signal_at descending
    signals.sort((a, b) => new Date(b.last_signal_at).getTime() - new Date(a.last_signal_at).getTime());

    // Enrich with provider names
    const enrichedSignals = signals.map((s) => ({
      provider_id: s.provider_id,
      provider_name: nameBySlug.get(s.provider_id) || formatSlug(s.provider_id),
      signal_count: s.signal_count,
      last_signal_at: s.last_signal_at,
    }));

    return NextResponse.json({
      signals: enrichedSignals,
      total: rawSignals.length,
      unique_providers: enrichedSignals.length,
    });
  } catch (err) {
    console.error("Review signals admin error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function formatSlug(slug: string): string {
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
