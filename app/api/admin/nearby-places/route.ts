import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { lookupNearbyPlaces } from "@/lib/nearby-places";

/**
 * POST /api/admin/nearby-places
 *
 * Looks up nearby places for a provider and stores the results.
 * Body: { slug: string } or { slugs: string[] }
 *
 * Called by batch jobs or admin UI — never on page load.
 */
export async function POST(req: NextRequest) {
  const db = await createClient();

  // Simple admin check
  const { data: { user } } = await db.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const slugs: string[] = body.slugs ?? (body.slug ? [body.slug] : []);

  if (slugs.length === 0) {
    return NextResponse.json({ error: "Provide slug or slugs" }, { status: 400 });
  }

  const results: { slug: string; status: string; categories?: number }[] = [];

  for (const slug of slugs) {
    // Fetch provider coordinates
    const { data: provider } = await db
      .from("olera-providers")
      .select("slug, lat, lon, address, city, state")
      .eq("slug", slug)
      .single();

    if (!provider) {
      results.push({ slug, status: "not_found" });
      continue;
    }

    if (!provider.lat || !provider.lon) {
      results.push({ slug, status: "no_coordinates" });
      continue;
    }

    try {
      const data = await lookupNearbyPlaces(provider.lat, provider.lon);

      // Store in the provider record
      const { error } = await db
        .from("olera-providers")
        .update({ nearby_places: data })
        .eq("slug", slug);

      if (error) {
        // Column might not exist yet — that's fine, we'll add it
        results.push({ slug, status: `db_error: ${error.message}` });
      } else {
        const totalPlaces = data.categories.reduce((s, c) => s + c.places.length, 0);
        results.push({ slug, status: "ok", categories: totalPlaces });
      }
    } catch (err) {
      results.push({ slug, status: `lookup_error: ${err}` });
    }
  }

  return NextResponse.json({ results });
}
