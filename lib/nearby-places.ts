/**
 * Nearby Places Lookup — uses Overpass API (OpenStreetMap) to find
 * hospitals, pharmacies, grocery stores, etc. near a provider.
 *
 * Design:
 *  - One lookup per provider address (batch job, not on page load)
 *  - Returns the nearest 3–5 per category with name + distance
 *  - Results stored in DB with a "calculated_at" timestamp
 *  - Re-run only when address changes
 */

export interface NearbyPlaceResult {
  name: string;
  distance: string;
  lat: number;
  lng: number;
}

export interface NearbyCategoryResult {
  label: string;
  icon: "hospital" | "pharmacy" | "grocery" | "dining" | "parks" | "worship";
  places: NearbyPlaceResult[];
}

export interface NearbyPlacesData {
  categories: NearbyCategoryResult[];
  calculated_at: string;
  provider_lat: number;
  provider_lng: number;
}

// Category definitions for Overpass API queries
const CATEGORY_QUERIES: {
  label: string;
  icon: NearbyCategoryResult["icon"];
  overpassFilter: string;
  maxResults: number;
  maxRadiusKm: number;
}[] = [
  {
    label: "Hospital",
    icon: "hospital",
    overpassFilter: '["amenity"="hospital"]',
    maxResults: 3,
    maxRadiusKm: 15,
  },
  {
    label: "Pharmacy",
    icon: "pharmacy",
    overpassFilter: '["amenity"="pharmacy"]',
    maxResults: 3,
    maxRadiusKm: 10,
  },
  {
    label: "Grocery",
    icon: "grocery",
    overpassFilter: '["shop"="supermarket"]',
    maxResults: 3,
    maxRadiusKm: 10,
  },
  {
    label: "Dining",
    icon: "dining",
    overpassFilter: '["amenity"="restaurant"]',
    maxResults: 3,
    maxRadiusKm: 8,
  },
  {
    label: "Parks",
    icon: "parks",
    overpassFilter: '["leisure"="park"]',
    maxResults: 2,
    maxRadiusKm: 15,
  },
  {
    label: "Place of Worship",
    icon: "worship",
    overpassFilter: '["amenity"="place_of_worship"]',
    maxResults: 2,
    maxRadiusKm: 10,
  },
];

function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(miles: number): string {
  if (miles < 0.1) return "0.1 mi";
  if (miles < 10) return `${miles.toFixed(1)} mi`;
  return `${Math.round(miles)} mi`;
}

async function queryOverpass(
  lat: number,
  lng: number,
  filter: string,
  radiusMeters: number,
): Promise<{ name: string; lat: number; lon: number }[]> {
  const query = `
    [out:json][timeout:10];
    (
      node${filter}(around:${radiusMeters},${lat},${lng});
      way${filter}(around:${radiusMeters},${lat},${lng});
    );
    out center tags 50;
  `;

  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    body: `data=${encodeURIComponent(query)}`,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  if (!res.ok) {
    console.error(`Overpass API error: ${res.status}`);
    return [];
  }

  const data = await res.json();
  const results: { name: string; lat: number; lon: number }[] = [];

  for (const el of data.elements ?? []) {
    const name = el.tags?.name;
    if (!name) continue;
    // For ways/relations, use the center point
    const elLat = el.lat ?? el.center?.lat;
    const elLon = el.lon ?? el.center?.lon;
    if (elLat == null || elLon == null) continue;
    results.push({ name, lat: elLat, lon: elLon });
  }

  return results;
}

/**
 * Look up nearby places for a provider at the given coordinates.
 * Makes one Overpass query per category (6 total).
 * Rate-limited with a small delay between queries to be polite.
 */
export async function lookupNearbyPlaces(
  providerLat: number,
  providerLng: number,
): Promise<NearbyPlacesData> {
  const categories: NearbyCategoryResult[] = [];

  for (const cat of CATEGORY_QUERIES) {
    const radiusMeters = cat.maxRadiusKm * 1000;

    try {
      const raw = await queryOverpass(
        providerLat,
        providerLng,
        cat.overpassFilter,
        radiusMeters,
      );

      // Calculate distances and sort by nearest
      const withDistance = raw.map((p) => ({
        ...p,
        distMiles: haversineDistance(providerLat, providerLng, p.lat, p.lon),
      }));
      withDistance.sort((a, b) => a.distMiles - b.distMiles);

      // Deduplicate by name (keep closest)
      const seen = new Set<string>();
      const deduped = withDistance.filter((p) => {
        const key = p.name.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      const places: NearbyPlaceResult[] = deduped
        .slice(0, cat.maxResults)
        .map((p) => ({
          name: p.name,
          distance: formatDistance(p.distMiles),
          lat: p.lat,
          lng: p.lon,
        }));

      categories.push({
        label: cat.label,
        icon: cat.icon,
        places,
      });
    } catch (err) {
      console.error(`Failed to query ${cat.label}:`, err);
      categories.push({ label: cat.label, icon: cat.icon, places: [] });
    }

    // Small delay between queries (Overpass rate limiting)
    await new Promise((r) => setTimeout(r, 1200));
  }

  return {
    categories,
    calculated_at: new Date().toISOString(),
    provider_lat: providerLat,
    provider_lng: providerLng,
  };
}
