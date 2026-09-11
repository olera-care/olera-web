import { NextResponse } from "next/server";
import { loadAdBoostEligibility } from "@/lib/ad-boost/eligibility.server";
import { getProviderFlightFunnels } from "@/lib/ad-boost/flight-funnel.server";

/**
 * A provider's own flights, as a funnel.
 *
 * Scoped by `loadAdBoostEligibility()`, the same gate every other
 * /api/provider/ad-boost route uses, so a provider can only ever read their own
 * campaigns. The provider id comes from the session, never from the request --
 * there is deliberately no `providerId` parameter to forge.
 *
 * GET so it can be opened in a browser to debug, per the house rule that admin
 * and ops endpoints stay reachable without a client.
 */

export const dynamic = "force-dynamic";

export async function GET() {
  const elig = await loadAdBoostEligibility();
  if (!elig.ok) {
    return NextResponse.json({ error: elig.error }, { status: elig.status });
  }

  try {
    const flights = await getProviderFlightFunnels(elig.profileId);
    return NextResponse.json({ ok: true, flights });
  } catch (err) {
    // Never leak a query error to a provider's screen; the card renders its own
    // empty state and the detail goes to the server log.
    console.error("[provider/ad-boost/funnel]", err);
    return NextResponse.json({ error: "Could not load your campaign results." }, { status: 500 });
  }
}
