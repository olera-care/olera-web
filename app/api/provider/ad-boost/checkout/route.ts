import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";
import { loadAdBoostEligibility } from "@/lib/ad-boost/eligibility.server";
import { isStripeConfigured } from "@/lib/stripe";
import {
  PAID_PLAN_VALUES,
  createAdBoostCheckout,
} from "@/lib/ad-boost/billing.server";

/**
 * Ad Boost Phase 2 — the wrap-up payment moment.
 *
 * POST: the signed-in provider, at the post-intro wrap-up on /provider/boost,
 * picks a paid monthly plan and is sent to Stripe Checkout (subscription mode).
 * This is the ONLY payment ask in the system (plan of record 2026-07-06): no
 * card is ever collected at signup, and nothing rolls over silently — the
 * provider explicitly chooses here. Activation happens in the Stripe webhook.
 *
 * Auth: authenticated provider only (loadAdBoostEligibility); the campaign row
 * is looked up by the caller's own provider_id, so a provider can only ever
 * check out their own campaign.
 */

// A wrap-up conversion makes sense for a campaign that ran (live) or just
// finished (ended). Anything earlier has no results to convert on.
const CONVERTIBLE_STATUSES = ["live", "ended"];

export async function POST(request: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Payments are not configured" },
      { status: 503 },
    );
  }

  const elig = await loadAdBoostEligibility();
  if (!elig.ok) {
    return NextResponse.json({ error: elig.error }, { status: elig.status });
  }

  let body: { planValue?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (
    typeof body.planValue !== "number" ||
    !PAID_PLAN_VALUES.includes(body.planValue)
  ) {
    return NextResponse.json(
      { error: `planValue must be one of: ${PAID_PLAN_VALUES.join(", ")}` },
      { status: 400 },
    );
  }

  const db = getServiceClient();
  const { data: campaign } = await db
    .from("ad_campaign_requests")
    .select("id, status, plan_status, stripe_customer_id")
    .eq("provider_id", elig.profileId)
    .in("status", CONVERTIBLE_STATUSES)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!campaign) {
    return NextResponse.json(
      { error: "No campaign ready for a plan" },
      { status: 404 },
    );
  }
  if (campaign.plan_status === "active") {
    return NextResponse.json(
      { error: "This campaign already has an active plan" },
      { status: 409 },
    );
  }

  try {
    const { url } = await createAdBoostCheckout({
      requestId: campaign.id,
      providerId: elig.profileId,
      providerEmail: elig.email,
      stripeCustomerId: campaign.stripe_customer_id,
      planValue: body.planValue,
      origin: request.nextUrl.origin,
    });
    if (!url) {
      return NextResponse.json(
        { error: "Stripe did not return a checkout URL" },
        { status: 500 },
      );
    }
    return NextResponse.json({ url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Checkout failed";
    console.error("[ad-boost/checkout] session create failed:", message);
    return NextResponse.json({ error: "Checkout failed. Please try again." }, { status: 500 });
  }
}
