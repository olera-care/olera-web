import { type NextRequest, NextResponse } from "next/server";
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

export async function middleware(request: NextRequest) {
  // ── Tier 2: v1.0 provider canonical URLs ──
  // /[category]/[state]/[city]/[slug] → /provider/[slug]
  const segments = request.nextUrl.pathname.split("/").filter(Boolean);
  if (segments.length === 4 && V1_CATEGORY_SLUGS.has(segments[0])) {
    const providerSlug = segments[3];
    const url = request.nextUrl.clone();
    url.pathname = `/provider/${providerSlug}`;
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
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
