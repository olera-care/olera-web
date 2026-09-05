import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { isDeadImageUrl, DEAD_IMAGE_REDIRECT_PATH } from "@/lib/images/dead-hosts";

// v1.0 category slugs — used for pattern-based redirects
const V1_CATEGORY_SLUGS = new Set([
  "senior-communities",
  "nursing-home",
  "assisted-living",
  "home-health-care",
  "independent-living",
  "memory-care",
  "home-care",
  "home-care-non-medical",
  "elder-law-attorney",
  "financial-legal-other-services",
]);

// v2 canonical category slugs (subset of V1 that have real power pages)
const V2_CATEGORY_SLUGS = new Set([
  "assisted-living",
  "memory-care",
  "nursing-home",
  "home-care",
  "home-health-care",
  "independent-living",
]);

// State abbreviation → URL slug (e.g. "FL" → "florida", "NY" → "new-york")
const STATE_ABBREV_TO_SLUG: Record<string, string> = {
  AL: "alabama", AK: "alaska", AZ: "arizona", AR: "arkansas",
  CA: "california", CO: "colorado", CT: "connecticut", DE: "delaware",
  FL: "florida", GA: "georgia", HI: "hawaii", ID: "idaho",
  IL: "illinois", IN: "indiana", IA: "iowa", KS: "kansas",
  KY: "kentucky", LA: "louisiana", ME: "maine", MD: "maryland",
  MA: "massachusetts", MI: "michigan", MN: "minnesota", MS: "mississippi",
  MO: "missouri", MT: "montana", NE: "nebraska", NV: "nevada",
  NH: "new-hampshire", NJ: "new-jersey", NM: "new-mexico", NY: "new-york",
  NC: "north-carolina", ND: "north-dakota", OH: "ohio", OK: "oklahoma",
  OR: "oregon", PA: "pennsylvania", RI: "rhode-island", SC: "south-carolina",
  SD: "south-dakota", TN: "tennessee", TX: "texas", UT: "utah",
  VT: "vermont", VA: "virginia", WA: "washington", WV: "west-virginia",
  WI: "wisconsin", WY: "wyoming", DC: "district-of-columbia",
};

/** Check if a URL segment is a 2-letter state abbreviation (case-insensitive) */
function resolveStateAbbrev(segment: string): string | null {
  return STATE_ABBREV_TO_SLUG[segment.toUpperCase()] ?? null;
}

export async function middleware(request: NextRequest) {
  // ── Dead image sources through the optimizer ──
  // /_next/image?url=https://cdn-api.olera.care/... would 502 because the
  // upstream host is gone. Google keeps re-fetching image URLs it learned months
  // ago, so this has to be answered at the request, not just removed from HTML.
  // Redirect to a static stock image so the URL returns 200. Every other
  // optimizer request passes straight through without touching the session.
  if (request.nextUrl.pathname === "/_next/image") {
    const source = request.nextUrl.searchParams.get("url");
    if (isDeadImageUrl(source)) {
      const url = request.nextUrl.clone();
      url.pathname = DEAD_IMAGE_REDIRECT_PATH;
      url.search = "";
      return NextResponse.redirect(url, 307);
    }
    return NextResponse.next();
  }

  const segments = request.nextUrl.pathname.split("/").filter(Boolean);

  // ── v1.0 provider canonical URLs ──
  // /[category]/[state]/[city]/[slug] → /provider/[slug]
  if (segments.length === 4 && V1_CATEGORY_SLUGS.has(segments[0])) {
    const providerSlug = segments[3];
    const url = request.nextUrl.clone();
    url.pathname = `/provider/${providerSlug}`;
    return NextResponse.redirect(url, 301);
  }

  // ── v1.0 state abbreviation redirects ──
  // /[category]/[stateAbbrev] → /[category]/[stateSlug]
  // /[category]/[stateAbbrev]/[city] → /[category]/[stateSlug]/[city]
  if (
    (segments.length === 2 || segments.length === 3) &&
    V2_CATEGORY_SLUGS.has(segments[0])
  ) {
    const stateSlug = resolveStateAbbrev(segments[1]);
    if (stateSlug && segments[1] !== stateSlug) {
      const url = request.nextUrl.clone();
      url.pathname =
        segments.length === 3
          ? `/${segments[0]}/${stateSlug}/${segments[2]}`
          : `/${segments[0]}/${stateSlug}`;
      return NextResponse.redirect(url, 301);
    }
  }

  // ── v1.0 pagination suffix ──
  // /[category]/[state]/[city]/page/[n] → /[category]/[state]/[city]
  if (
    segments.length === 5 &&
    V1_CATEGORY_SLUGS.has(segments[0]) &&
    segments[3] === "page"
  ) {
    const stateSlug = resolveStateAbbrev(segments[1]) ?? segments[1];
    const url = request.nextUrl.clone();
    url.pathname = `/${segments[0]}/${stateSlug}/${segments[2]}`;
    return NextResponse.redirect(url, 301);
  }

  // ── v1.0 category-scoped caregiver-support articles ──
  // /[category]/caregiver-support/[slug] → /caregiver-support/[slug]
  if (
    segments.length >= 2 &&
    V1_CATEGORY_SLUGS.has(segments[0]) &&
    segments[1] === "caregiver-support"
  ) {
    const url = request.nextUrl.clone();
    url.pathname = `/${segments.slice(1).join("/")}`;
    return NextResponse.redirect(url, 301);
  }

  // ── v1.0 category-scoped caregiver-forum ──
  // /[category]/caregiver-forum/* → /community
  if (
    segments.length >= 2 &&
    V1_CATEGORY_SLUGS.has(segments[0]) &&
    segments[1] === "caregiver-forum"
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/community";
    return NextResponse.redirect(url, 301);
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon)
     * - public folder assets
     * - api/stripe/webhook (Stripe sends raw POST with no cookies)
     */
    "/((?!_next/static|_next/image|favicon.ico|api/stripe/webhook|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    // Deliberately matched: dead-host image sources are redirected before the
    // optimizer can 502 on them (see the top of `middleware`).
    "/_next/image",
  ],
};
