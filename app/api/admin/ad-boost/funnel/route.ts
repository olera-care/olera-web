import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { getCampaignFunnels } from "@/lib/ad-boost/campaign-funnel.server";

/**
 * Campaign-level funnel for managed ads.
 *
 * GET — where each flight actually loses people, not just whether it delivered.
 *
 *   /api/admin/ad-boost/funnel
 *   /api/admin/ad-boost/funnel?since=2026-07-22
 *   /api/admin/ad-boost/funnel?campaign=graceful-concord-nextdoor-aug26
 *
 * GET on purpose: an operator opens this in a browser, and the WAF blocks curl.
 *
 * Auth: admin only.
 */

/** Tagged landing tracking began on this date. Earlier flights have inquiries
 *  with no landings, so a funnel over them is meaningless rather than empty. */
const LANDING_TRACKING_START = "2026-07-22";

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const adminUser = await getAdminUser(user.id);
  if (!adminUser) return NextResponse.json({ error: "Access denied" }, { status: 403 });

  const params = new URL(request.url).searchParams;
  const since = params.get("since") ?? undefined;
  const campaign = params.get("campaign");

  try {
    const funnels = await getCampaignFunnels(getServiceClient(), {
      since,
      campaigns: campaign ? [campaign] : undefined,
    });

    const totals = funnels.reduce(
      (a, f) => ({
        landed: a.landed + f.landed,
        cta_visible: a.cta_visible + f.cta_visible,
        cta_engaged: a.cta_engaged + f.cta_engaged,
        lead_started: a.lead_started + f.lead_started,
        lead_created: a.lead_created + f.lead_created,
      }),
      { landed: 0, cta_visible: 0, cta_engaged: 0, lead_started: 0, lead_created: 0 },
    );

    return NextResponse.json({
      totals: {
        ...totals,
        engagement_rate: totals.landed ? totals.cta_engaged / totals.landed : null,
        inquiry_rate: totals.landed ? totals.lead_created / totals.landed : null,
      },
      campaigns: funnels,
      notes: [
        `Tagged landing tracking began ${LANDING_TRACKING_START}. Flights that ran earlier show inquiries without landings; do not read those as funnels.`,
        "Attribution is scoped to the visit that arrived from the ad (anonymous_id + visit_id). Without that guard one long browsing session inflates cta_visible by orders of magnitude.",
        "Internally-classified traffic (referrer_class=olera_internal) is excluded, which is what keeps these counts agreeing with the ad platforms.",
        "lead_started and lead_created here are a LOWER BOUND: same-visit scoping drops a family who returns days later to inquire. For the real delivered count use countDeliveredByCampaign, which reads utm_campaign off the inquiry itself. Read this endpoint for funnel shape and engagement rate, not for lead totals.",
      ],
    });
  } catch (err) {
    console.error("[ad-boost/funnel]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Funnel query failed" },
      { status: 500 },
    );
  }
}
