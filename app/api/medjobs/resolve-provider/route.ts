/**
 * POST /api/medjobs/resolve-provider — materialize-on-request.
 *
 * A student requesting an interview with a directory-only provider needs a
 * business_profiles.id (what ScheduleInterviewModal targets). Directory rows
 * (olera-providers) don't have one. This resolves the target: returns an
 * existing business_profile if one already represents the directory provider,
 * else creates a minimal unclaimed `organization` profile from the directory
 * row and returns its id. Student demand is what pulls the provider in.
 *
 * Auth: any signed-in user (the requester). Only reads the public directory
 * and creates an unclaimed shell — no sensitive write.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getServiceClient } from "@/lib/admin";
import { SUPABASE_CAT_TO_PROFILE_CATEGORY } from "@/lib/types/provider";

function genSlug(base: string): string {
  const root = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  return `${root || "provider"}-${Math.random().toString(36).slice(2, 6)}`;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

    const body = (await request.json()) as { slug?: string; providerId?: string };
    const slug = body.slug?.trim();
    const providerId = body.providerId?.trim();
    if (!slug && !providerId) {
      return NextResponse.json({ error: "slug or providerId required" }, { status: 400 });
    }

    const db = getServiceClient();

    // Look up the directory provider.
    let q = db
      .from("olera-providers")
      .select(
        "provider_id, provider_name, city, state, provider_category, provider_description, slug, phone, website, email",
      )
      .or("deleted.is.null,deleted.eq.false")
      .limit(1);
    q = providerId ? q.eq("provider_id", providerId) : q.eq("slug", slug!);
    const { data: provider } = await q.maybeSingle();

    if (!provider) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    const pid = (provider as { provider_id: string }).provider_id;

    // Already materialized? (matched by source_provider_id, then slug.)
    const { data: bySource } = await db
      .from("business_profiles")
      .select("id")
      .filter("metadata->>source_provider_id", "eq", pid)
      .maybeSingle();
    if (bySource) {
      return NextResponse.json({ providerProfileId: (bySource as { id: string }).id });
    }

    const oleraSlug = (provider as { slug: string | null }).slug;
    if (oleraSlug) {
      const { data: bySlug } = await db
        .from("business_profiles")
        .select("id")
        .eq("slug", oleraSlug)
        .in("type", ["organization", "caregiver"])
        .maybeSingle();
      if (bySlug) {
        return NextResponse.json({ providerProfileId: (bySlug as { id: string }).id });
      }
    }

    // Create a minimal unclaimed organization shell from the directory row.
    const p = provider as {
      provider_name: string | null;
      city: string | null;
      state: string | null;
      provider_category: string | null;
      provider_description: string | null;
      phone: string | null;
      website: string | null;
      email: string | null;
    };
    const category = p.provider_category
      ? SUPABASE_CAT_TO_PROFILE_CATEGORY[p.provider_category] ?? null
      : null;

    const { data: created, error } = await db
      .from("business_profiles")
      .insert({
        slug: genSlug(p.provider_name || oleraSlug || "provider"),
        type: "organization",
        display_name: p.provider_name || "Local provider",
        description: p.provider_description ?? null,
        email: p.email ?? null,
        phone: p.phone ?? null,
        city: p.city ?? null,
        state: p.state ?? null,
        category,
        metadata: { source_provider_id: pid, source: "medjobs_request" },
        claim_state: "unclaimed",
        verification_state: "unverified",
        source: "seeded",
        is_active: false,
      })
      .select("id")
      .single();

    if (error || !created) {
      console.error("[resolve-provider] insert error:", error);
      return NextResponse.json({ error: "Failed to resolve provider" }, { status: 500 });
    }

    return NextResponse.json({ providerProfileId: (created as { id: string }).id });
  } catch (err) {
    console.error("[resolve-provider] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
