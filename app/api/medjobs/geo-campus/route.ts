/**
 * Geo-campus inference — `/api/medjobs/geo-campus`.
 *
 * Best-effort guess of the nearest active MedJobs university from the request's
 * IP geolocation, so a logged-out provider who lands on the public candidate
 * board with no `?university=` / `?campus=` in the URL can be auto-filtered to
 * the campus closest to them.
 *
 * Vercel injects geo headers on every edge/serverless request:
 *   x-vercel-ip-country-region  state/region code (e.g. "TX")
 *   x-vercel-ip-city            URL-encoded city name
 *   x-vercel-ip-latitude        request latitude (string)
 *   x-vercel-ip-longitude       request longitude (string)
 * Locally these are absent, so the route degrades to the default beachhead.
 *
 * All location data (id, name, slug, city, state, lat, lng) lives on
 * `medjobs_universities` — the SAME table the board's University dropdown reads,
 * and whose `id` is exactly what the board's `universityId` filter expects. So
 * one read of that table covers geo + state + default. (`student_outreach_campuses`
 * has no lat/lng, so it is not used here.)
 *
 * Matching waterfall:
 *   1. geo     — request has lat/lng AND a university has lat/lng → nearest by haversine.
 *   2. state   — request region matches an active university's state → first by name.
 *   3. default — active "Texas A&M" (College Station beachhead), else first by name.
 *   4. none    — nothing found / any failure (always status 200, never throws).
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

interface UniversityRow {
  id: string;
  name: string;
  slug: string | null;
  state: string | null;
  lat: number | null;
  lng: number | null;
}

interface GeoCampusResponse {
  universityId: string | null;
  campusSlug: string | null;
  name: string | null;
  source: "geo" | "state" | "default" | "none";
}

const EMPTY: GeoCampusResponse = {
  universityId: null,
  campusSlug: null,
  name: null,
  source: "none",
};

// Lazy init to avoid build-time errors when env vars are absent (mirrors the
// neighboring candidates route). Anon key is enough — the universities table
// has a public-read RLS policy ("Anyone can read active universities").
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

// Great-circle distance in km between two lat/lng points.
function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371; // Earth radius (km)
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function parseCoord(value: string | null): number | null {
  if (!value) return null;
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

function respond(
  row: UniversityRow | null,
  source: GeoCampusResponse["source"],
): NextResponse {
  if (!row) return NextResponse.json(EMPTY);
  const body: GeoCampusResponse = {
    universityId: row.id,
    campusSlug: row.slug ?? null,
    name: row.name ?? null,
    source,
  };
  return NextResponse.json(body);
}

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const headers = request.headers;
    const region = headers.get("x-vercel-ip-country-region"); // e.g. "TX"
    const lat = parseCoord(headers.get("x-vercel-ip-latitude"));
    const lng = parseCoord(headers.get("x-vercel-ip-longitude"));

    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("medjobs_universities")
      .select("id, name, slug, state, lat, lng")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error || !data || data.length === 0) {
      if (error) console.error("[medjobs/geo-campus] query error:", error);
      return NextResponse.json(EMPTY);
    }

    const universities = data as UniversityRow[];

    // 1. Geo — nearest by haversine when both the request and a university have
    //    coordinates.
    if (lat !== null && lng !== null) {
      let nearest: UniversityRow | null = null;
      let nearestKm = Infinity;
      for (const u of universities) {
        if (u.lat === null || u.lng === null) continue;
        const km = haversineKm(lat, lng, u.lat, u.lng);
        if (km < nearestKm) {
          nearestKm = km;
          nearest = u;
        }
      }
      if (nearest) return respond(nearest, "geo");
    }

    // 2. State — first active university (alphabetical) in the request's region.
    if (region) {
      const target = region.trim().toUpperCase();
      const byState = universities.find(
        (u) => (u.state ?? "").trim().toUpperCase() === target,
      );
      if (byState) return respond(byState, "state");
    }

    // 3. Default — the Texas A&M (College Station) beachhead, else first by name.
    const beachhead = universities.find((u) =>
      (u.name ?? "").toLowerCase().includes("texas a&m"),
    );
    return respond(beachhead ?? universities[0], "default");
  } catch (err) {
    // Never surface an error to the client — the board falls back gracefully.
    console.error("[medjobs/geo-campus] unexpected error:", err);
    return NextResponse.json(EMPTY);
  }
}
