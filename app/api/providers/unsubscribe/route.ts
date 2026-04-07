import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getServiceDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

/**
 * POST /api/providers/unsubscribe
 *
 * Opt a provider out of lead notification emails.
 * Body: { slug: string }
 *
 * GET /api/providers/unsubscribe?slug=xxx
 *
 * Check unsubscribe status.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { slug } = body;

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
      // Try olera-providers
      const { data: iosProvider } = await db
        .from("olera-providers")
        .select("provider_id, metadata")
        .eq("slug", slug)
        .maybeSingle();

      if (!iosProvider) {
        return NextResponse.json({ error: "Provider not found" }, { status: 404 });
      }

      // Update olera-providers metadata
      const meta = (iosProvider.metadata as Record<string, unknown>) || {};
      meta.leads_unsubscribed = true;
      meta.leads_unsubscribed_at = new Date().toISOString();

      await db
        .from("olera-providers")
        .update({ metadata: meta })
        .eq("provider_id", iosProvider.provider_id);

      return NextResponse.json({ success: true, unsubscribed: true });
    }

    // Update business_profiles metadata
    const meta = (profile.metadata as Record<string, unknown>) || {};
    meta.leads_unsubscribed = true;
    meta.leads_unsubscribed_at = new Date().toISOString();

    await db
      .from("business_profiles")
      .update({ metadata: meta })
      .eq("id", profile.id);

    return NextResponse.json({ success: true, unsubscribed: true });
  } catch (err) {
    console.error("Unsubscribe error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

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
    return NextResponse.json({ unsubscribed: !!meta.leads_unsubscribed });
  } catch (err) {
    console.error("Unsubscribe check error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
