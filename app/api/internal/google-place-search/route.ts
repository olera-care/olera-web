import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/internal/google-place-search?q=business+name
 *
 * Server-side proxy for Google Places Text Search API.
 * Keeps the API key private (not exposed to client).
 * Returns up to 5 matching places with name, address, rating, place_id.
 */
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");
  if (!q || q.length < 3) {
    return NextResponse.json({ results: [] });
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ results: [] });
  }

  try {
    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.rating",
      },
      body: JSON.stringify({
        textQuery: q,
        languageCode: "en",
        maxResultCount: 5,
      }),
    });

    if (!res.ok) {
      console.error("[google-place-search] API error:", res.status);
      return NextResponse.json({ results: [] });
    }

    const data = await res.json();
    const results = (data.places ?? []).map((p: {
      id: string;
      displayName: { text: string };
      formattedAddress: string;
      rating?: number;
    }) => ({
      place_id: p.id,
      name: p.displayName.text,
      formatted_address: p.formattedAddress,
      rating: p.rating ?? null,
    }));

    return NextResponse.json({ results });
  } catch (err) {
    console.error("[google-place-search] Error:", err);
    return NextResponse.json({ results: [] });
  }
}
