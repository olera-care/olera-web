import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getServiceDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

type UnsubscribeType = "leads" | "analytics_digest";

function flagForType(type: UnsubscribeType): { flag: string; at: string } {
  if (type === "analytics_digest") {
    return { flag: "analytics_digest_unsubscribed", at: "analytics_digest_unsubscribed_at" };
  }
  return { flag: "leads_unsubscribed", at: "leads_unsubscribed_at" };
}

/**
 * POST /api/providers/unsubscribe
 *
 * Opt a provider out of a specific email channel.
 * Body: { slug: string, type?: "leads" | "analytics_digest", unsubscribe?: boolean }
 *
 * Default type is "leads" (existing behavior, backward-compatible).
 * Default action is opt-out; pass unsubscribe=false to opt back in.
 *
 * GET /api/providers/unsubscribe?slug=xxx&type=leads
 *
 * Check unsubscribe status for a specific channel.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { slug } = body;
    const type: UnsubscribeType = body.type === "analytics_digest" ? "analytics_digest" : "leads";
    const { flag, at } = flagForType(type);

    if (!slug) {
      return NextResponse.json({ error: "slug is required" }, { status: 400 });
    }

    const db = getServiceDb();
    if (!db) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    // Find the provider by slug in business_profiles
    const { data: profile } = await db
      .from("business_profiles")
      .select("id, metadata")
      .eq("slug", slug)
      .in("type", ["organization", "caregiver"])
      .maybeSingle();

    if (!profile) {
      // Try olera-providers (only meaningful for the `leads` channel —
      // unclaimed providers don't receive analytics digests).
      const { data: iosProvider } = await db
        .from("olera-providers")
        .select("provider_id, metadata")
        .eq("slug", slug)
        .maybeSingle();

      if (!iosProvider) {
        return NextResponse.json({ error: "Provider not found" }, { status: 404 });
      }

      const meta = (iosProvider.metadata as Record<string, unknown>) || {};
      meta[flag] = true;
      meta[at] = new Date().toISOString();

      await db
        .from("olera-providers")
        .update({ metadata: meta })
        .eq("provider_id", iosProvider.provider_id);

      return NextResponse.json({ success: true, unsubscribed: true, type });
    }

    // Update business_profiles metadata
    const meta = (profile.metadata as Record<string, unknown>) || {};
    const shouldUnsubscribe = body.unsubscribe !== false; // default true for backwards compat
    if (shouldUnsubscribe) {
      meta[flag] = true;
      meta[at] = new Date().toISOString();
    } else {
      delete meta[flag];
      delete meta[at];
    }

    await db
      .from("business_profiles")
      .update({ metadata: meta })
      .eq("id", profile.id);

    return NextResponse.json({ success: true, unsubscribed: shouldUnsubscribe, type });
  } catch (err) {
    console.error("Unsubscribe error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    const typeParam = searchParams.get("type");
    const type: UnsubscribeType = typeParam === "analytics_digest" ? "analytics_digest" : "leads";
    const { flag } = flagForType(type);

    if (!slug) {
      return NextResponse.json({ error: "slug is required" }, { status: 400 });
    }

    const db = getServiceDb();
    if (!db) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const { data: profile } = await db
      .from("business_profiles")
      .select("metadata")
      .eq("slug", slug)
      .in("type", ["organization", "caregiver"])
      .maybeSingle();

    const meta = (profile?.metadata as Record<string, unknown>) || {};
    return NextResponse.json({ unsubscribed: !!meta[flag], type });
  } catch (err) {
    console.error("Unsubscribe check error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
