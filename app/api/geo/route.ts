import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { US_STATES } from "@/lib/power-pages";

// Lightweight geo lookup. Reads Vercel's edge-injected headers and returns
// the visitor's US state (2-letter abbreviation) when resolvable, else null.
//
// Why this exists as an API route rather than inlined: editorial article
// pages are ISR-cached (revalidate=60). Reading headers in the server
// component would force dynamic rendering and tank TTFB on SEO-heavy pages.
// Instead, the article body stays cached and the EditorialBenefitsModule
// hits this endpoint client-side after mount.

// Force dynamic — header-derived response, no caching.
export const dynamic = "force-dynamic";

export async function GET() {
  const hdrs = await headers();
  const region = hdrs.get("x-vercel-ip-country-region");
  const country = hdrs.get("x-vercel-ip-country");
  const city = hdrs.get("x-vercel-ip-city");

  // Only return a state when (a) we're confident it's US (country missing
  // is treated as US for back-compat with local dev) and (b) the abbrev
  // is in our known-states list.
  const isUS = !country || country === "US";
  const state = isUS && region && US_STATES[region] ? region : null;
  const decodedCity = city ? decodeURIComponent(city) : null;

  return NextResponse.json({ state, city: decodedCity });
}
