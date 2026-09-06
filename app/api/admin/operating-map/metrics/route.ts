import { NextRequest, NextResponse } from "next/server";
import { getAdminUser, getAuthUser, getServiceClient } from "@/lib/admin";
import {
  getOrganicVisitors,
  REFERRER_INSTRUMENTATION_START,
  VISITOR_GEO_START,
} from "@/lib/operating-map/organic.server";
import { getPageVisits } from "@/lib/operating-map/page-visits.server";

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

    return NextResponse.json({ nodes });
  } catch (error) {
    console.error("[operating-map/metrics] Failed:", error);
    return NextResponse.json({ error: "Failed to load metrics" }, { status: 500 });
  }
}
