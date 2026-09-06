import { NextRequest, NextResponse } from "next/server";
import { getAdminUser, getAuthUser, getServiceClient } from "@/lib/admin";
import { getOrganicVisitors } from "@/lib/operating-map/organic.server";

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
  /** Short note the UI shows next to the value. Null when unqualified. */
  note: string | null;
  /** True when this node ignores the selected city. */
  allCities?: boolean;
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

    const db = getServiceClient();
    const nodes: Record<string, OperatingMapNode> = {};

    try {
      const organic = await getOrganicVisitors(db, { from, to });
      const notes: string[] = [];
      if (organic.partialInstrumentation) {
        // Without this the chart reads as a traffic collapse before August.
        notes.push("partly before referrer tracking");
      }
      if (organic.truncated) notes.push("floor — row ceiling hit");

      nodes.cr2 = {
        value: organic.value,
        note: notes.length ? notes.join(" · ") : null,
        // Most organic traffic lands on benefits and editorial pages, which
        // carry no city. Scoping only the provider share would change the
        // meaning of the number depending on the filter.
        allCities: true,
      };
    } catch (error) {
      console.error("[operating-map/metrics] cr2 failed:", error);
      // One failed node must not blank the others. Null is rendered as
      // unavailable, never as zero.
      nodes.cr2 = { value: null, note: "unavailable", allCities: true };
    }

    return NextResponse.json({ nodes });
  } catch (error) {
    console.error("[operating-map/metrics] Failed:", error);
    return NextResponse.json({ error: "Failed to load metrics" }, { status: 500 });
  }
}
