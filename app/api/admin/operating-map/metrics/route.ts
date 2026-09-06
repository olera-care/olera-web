import { NextRequest, NextResponse } from "next/server";
import { getAdminUser, getAuthUser, getServiceClient } from "@/lib/admin";
import {
  getOrganicVisitors,
  REFERRER_INSTRUMENTATION_START,
  VISITOR_GEO_START,
} from "@/lib/operating-map/organic.server";
import { getPageVisits } from "@/lib/operating-map/page-visits.server";
import { getConversions } from "@/lib/operating-map/conversions.server";

/**
 * GET /api/admin/operating-map/metrics?date_from&date_to
 *
 * The operating map's flow metrics — the nodes that count something over a
 * period, as opposed to the city list, which is a standing set.
 *
 * The response is shaped as a map of node id to value
 * so later nodes are added here rather than each growing its own endpoint and
 * its own round trip.
 *
 * Every node reports its own caveats. A number on this map is read as the
 * truth about a step of the funnel, so a node that is a floor, or that
 * ignores the city filter, has to say so in the payload instead of relying on
 * whoever reads the chart to remember.
 */

/** Authorized response — never handed to Next's shared cache. See cities/. */
export const dynamic = "force-dynamic";

/** A named part of a node's total, rendered on the card under its label. */
export interface OperatingMapBreakdown {
  label: string;
  value: number;
}

export interface OperatingMapNode {
  value: number | null;
  /** Parts that sum to `value`. Omitted when a node has no split. */
  breakdown?: OperatingMapBreakdown[];
  /**
   * A caveat that applies to this value right now — a range reaching back
   * past the instrumentation, a hit row ceiling. Shown only inside the
   * node's tooltip, never as text on the card.
   */
  caveat?: string | null;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const adminUser = await getAdminUser(user.id);
    if (!adminUser) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const from = searchParams.get("date_from");
    const to = searchParams.get("date_to");
    const city = searchParams.get("city");

    const db = getServiceClient();
    const nodes: Record<string, OperatingMapNode> = {};

    // A city filter over a range that starts before visitor geo was recorded
    // returns a structural zero, not a quiet market. Every city-scoped node
    // has to say so.
    const cityPredatesGeo =
      Boolean(city) && (!from || from < VISITOR_GEO_START);

    // Visitor geo rides on page views. Form submissions are written through
    // their own routes and carry none, so those nodes ignore the city filter
    // and must say so rather than look like a quiet market.
    const notCityScoped = city
      ? "Not scoped by city — city is only recorded on page views."
      : null;

    try {
      const organic = await getOrganicVisitors(db, { from, to }, city);
      const caveats: string[] = [];
      if (organic.partialCityData) {
        // Without this a city filter over an older range reads as no demand
        // when it is really no data.
        caveats.push(`City is only recorded from ${VISITOR_GEO_START}.`);
      }
      if (organic.partialInstrumentation) {
        // Without this the chart reads as a traffic collapse before August.
        caveats.push(`Search traffic is only identified from ${REFERRER_INSTRUMENTATION_START}.`);
      }
      if (organic.truncated) caveats.push("Row ceiling reached — this is a floor.");

      nodes.cr2 = {
        value: organic.value,
        caveat: caveats.length ? caveats.join(" ") : null,
      };
    } catch (error) {
      console.error("[operating-map/metrics] cr2 failed:", error);
      // One failed node must not blank the others. Null is rendered as
      // unavailable, never as zero.
      nodes.cr2 = { value: null, caveat: "This metric failed to load." };
    }

    try {
      const visits = await getPageVisits(db, { from, to }, city);
      nodes.cr4 = {
        value: visits.total,
        // Order matches the labels printed on the card.
        breakdown: [
          { label: "provider", value: visits.provider },
          { label: "editorial", value: visits.editorial },
          { label: "benefits", value: visits.benefit },
        ],
        caveat: cityPredatesGeo
          ? `City is only recorded from ${VISITOR_GEO_START}.`
          : null,
      };
    } catch (error) {
      console.error("[operating-map/metrics] cr4 failed:", error);
      nodes.cr4 = { value: null, caveat: "This metric failed to load." };
    }

    try {
      const c = await getConversions(db, { from, to });
      nodes.cr5 = { value: c.questions, caveat: notCityScoped };
      // No breakdown here: CR6a/b/c render as their own chips directly
      // below, so a split on the parent would print the same three numbers
      // twice.
      nodes.cr6 = { value: c.ctasTotal, caveat: notCityScoped };
      nodes.cr6a = { value: c.benefitsCtas, caveat: notCityScoped };
      nodes.cr6b = { value: c.connectionCtas, caveat: notCityScoped };
      nodes.cr6c = { value: c.profilesLive, caveat: notCityScoped };
    } catch (error) {
      console.error("[operating-map/metrics] cr5/cr6 failed:", error);
      const failed = { value: null, caveat: "This metric failed to load." };
      nodes.cr5 = failed;
      nodes.cr6 = failed;
      nodes.cr6a = failed;
      nodes.cr6b = failed;
      nodes.cr6c = failed;
    }

    return NextResponse.json({ nodes });
  } catch (error) {
    console.error("[operating-map/metrics] Failed:", error);
    return NextResponse.json({ error: "Failed to load metrics" }, { status: 500 });
  }
}
