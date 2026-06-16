import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { countDeliveredByCampaign } from "@/lib/ad-boost/delivered.server";

/**
 * Admin concierge queue for Provider Ad Boost (managed lead-gen).
 *
 * GET    — list all campaign requests, newest first, for the /admin/ad-boost queue.
 * POST   — update one request: status lifecycle + campaign_tag / channel / note /
 *          setup week. Moving a request to `live` without a campaign_tag auto-sets
 *          it to the request id, so there's always a stable UTM tag to attribute
 *          delivered families against (Phase 3 ROI).
 * DELETE — hard-delete one request by id (?id= or JSON body). Used to clear out
 *          test runs from the queue; real campaigns should be `cancelled`/`ended`
 *          via POST instead, but this is a deliberate scrub.
 *
 * Auth: admin only.
 */

const VALID_STATUSES = ["pending_profile", "requested", "scheduled", "live", "ended", "cancelled"];
const VALID_CHANNELS = ["google", "meta", "both"];

const ROW_SELECT =
  "id, provider_id, provider_slug, display_name, requested_setup_week, completeness_at_submit, status, channel, campaign_tag, admin_note, created_at, updated_at, deleted_at";

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const adminUser = await getAdminUser(user.id);
  if (!adminUser) return NextResponse.json({ error: "Access denied" }, { status: 403 });

  // Default view = the live queue (not archived). `?archived=1` returns only the
  // soft-deleted rows so the admin can review / restore / permanently delete them.
  const archived = new URL(request.url).searchParams.get("archived") === "1";

  const db = getServiceClient();
  let query = db
    .from("ad_campaign_requests")
    .select(ROW_SELECT)
    .order("created_at", { ascending: false })
    .limit(500);
  query = archived
    ? query.not("deleted_at", "is", null)
    : query.is("deleted_at", null);
  const { data, error } = await query;

  if (error) {
    console.error("[admin/ad-boost] list failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const requests = data ?? [];

  // Attach the ROI signal: families delivered per campaign (benefits_completed
  // events tagged with the campaign's utm_campaign). The effective tag is
  // `campaign_tag || id` — the same value the copy-URL and ad links use — so
  // counting stays correct even before a campaign_tag is explicitly persisted.
  const tags = requests.map(
    (r: { id: string; campaign_tag: string | null }) => r.campaign_tag || r.id,
  );
  const delivered = await countDeliveredByCampaign(db, tags);

  const withRoi = requests.map((r: { id: string; campaign_tag: string | null }) => ({
    ...r,
    delivered: delivered[r.campaign_tag || r.id] ?? 0,
  }));

  // Tab counts (active vs archived) so both tabs show a number regardless of
  // which view is loaded. Cheap head-only count queries.
  const [{ count: activeCount }, { count: archivedCount }] = await Promise.all([
    db.from("ad_campaign_requests").select("*", { count: "exact", head: true }).is("deleted_at", null),
    db.from("ad_campaign_requests").select("*", { count: "exact", head: true }).not("deleted_at", "is", null),
  ]);

  return NextResponse.json({
    requests: withRoi,
    counts: { active: activeCount ?? 0, archived: archivedCount ?? 0 },
  });
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const adminUser = await getAdminUser(user.id);
  if (!adminUser) return NextResponse.json({ error: "Access denied" }, { status: 403 });

  let body: {
    id?: unknown;
    status?: unknown;
    campaign_tag?: unknown;
    channel?: unknown;
    admin_note?: unknown;
    requested_setup_week?: unknown;
    archived?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body.id !== "string" || !body.id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (body.status !== undefined) {
    if (typeof body.status !== "string" || !VALID_STATUSES.includes(body.status)) {
      return NextResponse.json(
        { error: `status must be one of: ${VALID_STATUSES.join(", ")}` },
        { status: 400 },
      );
    }
    update.status = body.status;
  }

  if (body.channel !== undefined) {
    if (body.channel === null) {
      update.channel = null;
    } else if (typeof body.channel !== "string" || !VALID_CHANNELS.includes(body.channel)) {
      return NextResponse.json(
        { error: `channel must be one of: ${VALID_CHANNELS.join(", ")}` },
        { status: 400 },
      );
    } else {
      update.channel = body.channel;
    }
  }

  if (body.campaign_tag !== undefined) {
    update.campaign_tag =
      typeof body.campaign_tag === "string" && body.campaign_tag.trim()
        ? body.campaign_tag.trim()
        : null;
  }

  if (body.admin_note !== undefined) {
    update.admin_note =
      typeof body.admin_note === "string" ? body.admin_note : null;
  }

  if (body.requested_setup_week !== undefined) {
    if (typeof body.requested_setup_week !== "string") {
      return NextResponse.json({ error: "requested_setup_week must be a date string" }, { status: 400 });
    }
    const parsed = new Date(body.requested_setup_week);
    if (Number.isNaN(parsed.getTime())) {
      return NextResponse.json({ error: "requested_setup_week is not a valid date" }, { status: 400 });
    }
    update.requested_setup_week = body.requested_setup_week.slice(0, 10);
  }

  // Soft delete (archive) / restore. `archived: true` sets deleted_at = now() so
  // the request drops out of the default queue but the record is kept; `false`
  // clears it (restore). Hard delete is the separate DELETE handler.
  if (body.archived !== undefined) {
    if (typeof body.archived !== "boolean") {
      return NextResponse.json({ error: "archived must be a boolean" }, { status: 400 });
    }
    update.deleted_at = body.archived ? new Date().toISOString() : null;
  }

  const db = getServiceClient();

  // When launching (status -> live) with no tag yet, default the campaign_tag to
  // the request id so attribution always has a stable, persisted key. The admin
  // page always sends campaign_tag (null when the field is empty), so we resolve
  // the *effective* tag — what it'll be after this update, or the current value
  // if untouched — and only default when that's still empty.
  if (update.status === "live") {
    let effectiveTag = update.campaign_tag as string | null | undefined;
    if (effectiveTag === undefined) {
      const { data: current } = await db
        .from("ad_campaign_requests")
        .select("campaign_tag")
        .eq("id", body.id)
        .maybeSingle();
      effectiveTag = current?.campaign_tag ?? null;
    }
    if (!effectiveTag) {
      update.campaign_tag = body.id;
    }
  }

  const { data, error } = await db
    .from("ad_campaign_requests")
    .update(update)
    .eq("id", body.id)
    .select(ROW_SELECT)
    .single();

  if (error || !data) {
    console.error("[admin/ad-boost] update failed:", error);
    return NextResponse.json({ error: error?.message ?? "Update failed" }, { status: 500 });
  }

  return NextResponse.json({ request: data });
}

export async function DELETE(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const adminUser = await getAdminUser(user.id);
  if (!adminUser) return NextResponse.json({ error: "Access denied" }, { status: 403 });

  // Accept the id from the query string (?id=) or a JSON body, so this works
  // from the admin UI fetch as well as a manual browser/cURL scrub.
  let id = new URL(request.url).searchParams.get("id");
  if (!id) {
    try {
      const body = await request.json();
      if (typeof body?.id === "string") id = body.id;
    } catch {
      /* no body — fall through to the missing-id error */
    }
  }
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const db = getServiceClient();
  const { error } = await db.from("ad_campaign_requests").delete().eq("id", id);

  if (error) {
    console.error("[admin/ad-boost] delete failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
