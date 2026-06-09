import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { updateSession } from "@/lib/supabase/middleware";

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

// Provider slugs / provider_ids are kebab-case alphanumerics, sometimes with a
// period (e.g. "st.-helens-or-1234"). Guarding the value before it goes into a
// PostgREST .or() filter both prevents filter-breakage and closes the
// injection surface — anything outside this set just falls through to the page.
const SAFE_PROVIDER_SLUG = /^[A-Za-z0-9._-]+$/;

function supabaseConfigured(): boolean {
  return (
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://your-project-id.supabase.co"
  );
}

// Read-only Supabase client for middleware-side lookups. Mirrors the anon
// client the provider page uses, but never writes cookies (setAll is a no-op)
// since this path only reads public provider data.
function readOnlyClient(request: NextRequest) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {
          /* no-op — read-only */
        },
      },
    }
  );
}

// Decide whether /provider/[slug] should return HTTP 410 Gone. True only when
// the page would otherwise hit its hard-removal branch: the slug resolves ONLY
// to soft-deleted iOS rows, at least one removed at the provider's request
// (deletion_reason = 'provider_request'), and no active web profile overrides
// it. Precedence mirrors app/provider/[slug]/page.tsx exactly:
//   1. an active olera-providers row (by slug OR provider_id) wins → not gone
//   2. an active business_profiles row (by slug) wins → not gone
//   3. all matches deleted + provider_request → gone (410)
//   4. all matches deleted, other reasons → not gone (page issues a 301)
async function isProviderGone(request: NextRequest, slug: string): Promise<boolean> {
  try {
    const supabase = readOnlyClient(request);

    // One query covers both active and deleted matches by slug OR provider_id.
    const { data: rows } = await supabase
      .from("olera-providers")
      .select("deleted, deletion_reason")
      .or(`slug.eq.${slug},provider_id.eq.${slug}`)
      .limit(5);

    // No iOS row at all → let the page resolve (web profile, or a true 404).
    if (!rows || rows.length === 0) return false;

    // An active iOS row with this slug/id always wins (page step 1).
    if (rows.some((r) => r.deleted !== true)) return false;

    // Every match is soft-deleted. Only a provider-requested removal is 410;
    // data_sweep/duplicate/out_of_scope/other get a 301 from the page.
    const hardRemoved = rows.some(
      (r) => r.deleted === true && r.deletion_reason === "provider_request"
    );
    if (!hardRemoved) return false;

    // An active claimed web profile overrides a soft-deleted iOS row (page
    // step 2) — render it instead of 410ing.
    const { data: bp } = await supabase
      .from("business_profiles")
      .select("id")
      .eq("slug", slug)
      .eq("is_active", true)
      .in("type", ["organization", "caregiver"])
      .limit(1)
      .maybeSingle();

    return !bp;
  } catch {
    // Supabase unreachable from the edge — fall through. The page still runs
    // and serves its 404 fallback for the hard-removal case.
    return false;
  }
}

// Friendly 410 body. App Router pages can't emit 410 (Next's HTTP-access
// fallback only allows 401/403/404), so the status and markup are produced
// here. Inline styles keep it self-contained on the edge.
function providerGoneResponse(): NextResponse {
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Listing removed · Olera</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body {
    margin: 0; min-height: 100vh; display: flex; align-items: center;
    justify-content: center; padding: 24px; background: #F9F6F2; color: #314f4f;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  .card { max-width: 30rem; text-align: center; }
  .eyebrow { font-size: .75rem; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: #4d8a8a; margin: 0 0 12px; }
  h1 { font-size: 1.6rem; line-height: 1.25; margin: 0 0 12px; color: #1a3030; }
  p { font-size: 1.05rem; line-height: 1.6; color: #417272; margin: 0 0 28px; }
  .actions { display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; }
  a.btn { display: inline-flex; align-items: center; justify-content: center; min-height: 44px; padding: 12px 24px; border-radius: 10px; font-size: 1rem; font-weight: 600; text-decoration: none; transition: background .15s, border-color .15s; }
  a.primary { background: #4d8a8a; color: #fff; }
  a.primary:hover { background: #417272; }
  a.ghost { background: #fff; color: #417272; border: 2px solid #4d8a8a; }
  a.ghost:hover { background: #edf7f7; }
</style>
</head>
<body>
  <main class="card">
    <p class="eyebrow">Listing removed</p>
    <h1>This provider listing is no longer available</h1>
    <p>The page you&rsquo;re looking for has been permanently removed. You can still find senior care providers near you.</p>
    <div class="actions">
      <a class="btn primary" href="/browse">Browse care options</a>
      <a class="btn ghost" href="/">Go to homepage</a>
    </div>
  </main>
</body>
</html>`;
  return new NextResponse(html, {
    status: 410,
    headers: {
      "content-type": "text/html; charset=utf-8",
      // A 410 is the deindex signal; allow crawlers/CDN to cache the removal.
      "cache-control": "public, max-age=3600",
    },
  });
}

export async function middleware(request: NextRequest) {
  const segments = request.nextUrl.pathname.split("/").filter(Boolean);

  // ── Removed-provider 410 Gone ──
  // /provider/[slug] for a provider hard-removed at the provider's request
  // returns 410 (not 404) so Google deindexes it quickly instead of retrying
  // for weeks. Scoped to the exact /provider/[slug] shape — /provider/[slug]/
  // onboard and everything else fall through. Active providers, other deletion
  // reasons (301 to power page), and true typos (404) are all still handled by
  // the page; only the hard-removal case is intercepted here.
  if (
    segments.length === 2 &&
    segments[0] === "provider" &&
    SAFE_PROVIDER_SLUG.test(segments[1]) &&
    supabaseConfigured()
  ) {
    if (await isProviderGone(request, segments[1])) {
      return providerGoneResponse();
    }
  }

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
  ],
};
