import { NextRequest, NextResponse } from "next/server";
import { getAdminUser, getAuthUser, getServiceClient } from "@/lib/admin";
import {
  getOrganicVisitors,
  REFERRER_INSTRUMENTATION_START,
  VISITOR_GEO_START,
} from "@/lib/operating-map/organic.server";

/**
 * GET /api/admin/operating-map/metrics?date_from&date_to
 *
 * The operating map's flow metrics — the nodes that count something over a
 * period, as opposed to the city list, which is a standing set.
 *
 * One node so far (CR2). The response is shaped as a map of node id to value
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

export interface OperatingMapNode {
  value: number | null;
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

    return NextResponse.json({ nodes });
  } catch (error) {
    console.error("[operating-map/metrics] Failed:", error);
    return NextResponse.json({ error: "Failed to load metrics" }, { status: 500 });
  }
}
