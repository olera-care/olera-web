import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import {
  resolveWebsite,
  type ProviderContext,
} from "@/lib/medjobs/outreach-enrichment";

/**
 * POST /api/admin/provider-outreach/find-address
 *
 * Scrapes a provider's website contact/about page for a mailing address.
 *
 * Body: { provider_id: string }
 *
 * Returns: { address: string | null, source_url: string | null, website: string | null }
 */
export const runtime = "nodejs";
export const maxDuration = 30;

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const FETCH_TIMEOUT_MS = 12_000;
const MAX_HTML_BYTES = 500_000;

async function fetchHtml(url: string): Promise<string | null> {
  if (!/^https?:\/\//i.test(url)) return null;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: ctrl.signal,
      headers: { "User-Agent": UA },
    });
    if (!res.ok) return null;
    const ctype = res.headers.get("content-type") || "";
    if (ctype && !/text\/html|application\/xhtml/i.test(ctype)) return null;
    const raw = await res.text();
    return raw.length > MAX_HTML_BYTES ? raw.slice(0, MAX_HTML_BYTES) : raw;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Extract US mailing addresses from HTML.
 * Looks for patterns like: "123 Main St, City, ST 12345" or multi-line addresses.
 * Returns the best match (longest, most complete).
 */
function extractAddress(html: string): string | null {
  // Strip tags but preserve whitespace structure
  const text = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?(p|div|li|td|address|span)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#\d+;/g, " ")
    .replace(/\s+/g, " ");

  // US address pattern: street number + street name, city, STATE ZIP
  // Handles multi-line addresses that become spaces after stripping:
  //   "3320 Canoncita Ln. Plano, TX 75023-8106"
  //   "3901 W Park Blvd, Plano, TX 75075"
  //   "1940 N Stemmons Fwy Suite 2020, Dallas, TX 75207"
  // The comma between street and city is optional (multi-line addresses often omit it)
  const addressRe =
    /\d{1,5}\s+[A-Za-z0-9\s.,#-]{3,50}(?:St|Street|Ave|Avenue|Blvd|Boulevard|Dr|Drive|Rd|Road|Ln|Lane|Way|Ct|Court|Pl|Place|Pkwy|Parkway|Fwy|Freeway|Hwy|Highway|Cir|Circle)\.?(?:\s*(?:,\s*)?(?:Suite|Ste|Apt|Unit|Bldg|Floor|Fl|#)\s*\S+)?[,\s]+[A-Za-z\s]{2,25}[,\s]+[A-Z]{2}\s+\d{5}(?:-\d{4})?/gi;

  const matches = text.match(addressRe);
  if (matches && matches.length > 0) {
    const best = matches
      .map((m) => m.replace(/\s+/g, " ").trim())
      .sort((a, b) => b.length - a.length)[0];
    return best;
  }

  // Fallback: look for any text with a state abbreviation + ZIP pattern
  // More permissive — catches addresses without standard street suffixes
  const zipRe =
    /\d{1,5}\s+[A-Za-z0-9\s.,#-]{5,60}[,\s]+[A-Z]{2}\s+\d{5}(?:-\d{4})?/g;
  const zipMatches = text.match(zipRe);
  if (zipMatches && zipMatches.length > 0) {
    const best = zipMatches
      .map((m) => m.replace(/\s+/g, " ").trim())
      .filter((m) => m.length < 120)
      .sort((a, b) => b.length - a.length)[0];
    if (best) return best;
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const admin = await getAdminUser(user.id);
    if (!admin) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = (await request.json()) as {
      provider_id?: string;
      website?: string;
      city?: string;
      state?: string;
      place_id?: string;
    };
    const providerId = body.provider_id?.trim();
    const passedWebsite = body.website?.trim();
    const passedCity = body.city?.trim()?.toLowerCase();
    const passedPlaceId = body.place_id?.trim();

    if (!providerId) {
      return NextResponse.json(
        { error: "provider_id is required" },
        { status: 400 },
      );
    }

    const db = getServiceClient();

    // Fetch provider from DB (may not exist for demo providers)
    const { data: provider } = await db
      .from("olera-providers")
      .select("provider_id, provider_name, website, place_id, city, state, address, zip")
      .eq("provider_id", providerId)
      .maybeSingle();

    // If provider exists in DB and already has an address, return it
    if (provider?.address) {
      const parts = [
        provider.address,
        [provider.city, provider.state].filter(Boolean).join(", "),
        provider.zip,
      ].filter(Boolean);

      return NextResponse.json({
        address: parts.join(", "),
        source_url: null,
        website: provider.website || null,
        from_database: true,
      });
    }

    // Resolve website: use passed website, then DB provider website, then resolveWebsite
    let website = passedWebsite || provider?.website || null;

    if (!website && provider) {
      const ctx: ProviderContext = {
        name: provider.provider_name || null,
        website: provider.website || null,
        place_id: provider.place_id || null,
        city: provider.city || null,
        state: provider.state || null,
      };
      website = await resolveWebsite(ctx);
    }

    if (!website) {
      return NextResponse.json({
        address: null,
        source_url: null,
        website: null,
      });
    }

    const origin = new URL(website).origin;
    const city = passedCity || provider?.city?.toLowerCase() || null;

    // Build pages to check — include city-specific location pages for multi-location providers
    const pagesToCheck = [
      `${origin}/contact`,
      `${origin}/contact-us`,
      website,
      `${origin}/about`,
      `${origin}/about-us`,
      `${origin}/locations`,
    ];

    // Add city-specific location pages (common patterns for enterprise providers)
    if (city) {
      pagesToCheck.push(
        `${origin}/location/${city}`,
        `${origin}/locations/${city}`,
        `${origin}/${city}`,
        `${origin}/location/${city.replace(/\s+/g, "-")}`,
        `${origin}/locations/${city.replace(/\s+/g, "-")}`,
      );
    }

    // Dedupe
    const seen = new Set<string>();
    const uniquePages = pagesToCheck.filter((url) => {
      const key = url.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    for (const pageUrl of uniquePages) {
      if (pageUrl !== uniquePages[0]) {
        await new Promise((r) => setTimeout(r, 300));
      }

      const html = await fetchHtml(pageUrl);
      if (!html) continue;

      const address = extractAddress(html);
      if (address) {
        return NextResponse.json({
          address,
          source_url: pageUrl,
          website,
        });
      }
    }

    // Fallback: Google Places API (place_id → formatted_address)
    const placeId = passedPlaceId || provider?.place_id;
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;

    if (placeId && apiKey) {
      try {
        const placesRes = await fetch(
          `https://places.googleapis.com/v1/places/${placeId}?languageCode=en`,
          {
            headers: {
              "X-Goog-Api-Key": apiKey,
              "X-Goog-FieldMask": "formattedAddress,shortFormattedAddress",
            },
          },
        );
        if (placesRes.ok) {
          const placesData = await placesRes.json();
          const addr = placesData.formattedAddress || placesData.shortFormattedAddress;
          if (addr) {
            return NextResponse.json({
              address: addr,
              source_url: null,
              website,
              from_google: true,
            });
          }
        }
      } catch {
        // Google Places failed — fall through
      }
    }

    return NextResponse.json({
      address: null,
      source_url: null,
      website,
    });
  } catch (e) {
    console.error("[find-address] Error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Address lookup failed" },
      { status: 500 },
    );
  }
}
