import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * POST /api/admin/provider-outreach/sync-mail-status
 *
 * Polls PostGrid for the latest status of all tracked postcards and updates
 * the tracking table. Called on-demand from the re-engagement page.
 *
 * Body: { postgrid_ids: string[] }  (optional — syncs all if omitted)
 *
 * Returns: { updated: number, statuses: Record<string, string> }
 */
export const runtime = "nodejs";
export const maxDuration = 30;

const POSTGRID_API_URL = "https://api.postgrid.com/print-mail/v1/postcards";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const admin = await getAdminUser(user.id);
    if (!admin) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const apiKey = process.env.POSTGRID_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "PostGrid not configured" }, { status: 503 });
    }

    const db = getServiceClient();

    // Get all tracking rows that have a PostGrid ID
    const { data: rows, error } = await db
      .from("provider_outreach_tracking")
      .select("provider_id, mail_postgrid_id, mail_status")
      .not("mail_postgrid_id", "is", null);

    if (error) {
      console.error("[sync-mail-status] DB error:", error);
      return NextResponse.json({ error: "Failed to fetch tracking data" }, { status: 500 });
    }

    if (!rows || rows.length === 0) {
      return NextResponse.json({ updated: 0, statuses: {} });
    }

    // Optionally filter to specific IDs
    const body = await request.json().catch(() => ({}));
    const filterIds = (body as { postgrid_ids?: string[] }).postgrid_ids;

    const toSync = filterIds
      ? rows.filter((r) => filterIds.includes(r.mail_postgrid_id))
      : rows;

    let updated = 0;
    const statuses: Record<string, string> = {};

    // Poll PostGrid for each postcard (sequential to avoid rate limits)
    for (const row of toSync) {
      try {
        const res = await fetch(`${POSTGRID_API_URL}/${row.mail_postgrid_id}`, {
          headers: { "x-api-key": apiKey },
        });

        if (!res.ok) {
          console.warn(`[sync-mail-status] PostGrid ${row.mail_postgrid_id}: ${res.status}`);
          continue;
        }

        const pgData = await res.json();
        const newStatus = pgData.status;

        if (newStatus && newStatus !== row.mail_status) {
          const updateFields: Record<string, unknown> = {
            mail_status: newStatus,
          };

          if (newStatus === "delivered" && pgData.deliveredDate) {
            updateFields.mail_delivered_at = pgData.deliveredDate;
          }

          await db
            .from("provider_outreach_tracking")
            .update(updateFields)
            .eq("provider_id", row.provider_id);

          updated++;
        }

        statuses[row.provider_id] = newStatus || row.mail_status;
      } catch (e) {
        console.warn(`[sync-mail-status] Error fetching ${row.mail_postgrid_id}:`, e);
      }
    }

    return NextResponse.json({ updated, statuses });
  } catch (e) {
    console.error("[sync-mail-status] Error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Sync failed" },
      { status: 500 },
    );
  }
}
