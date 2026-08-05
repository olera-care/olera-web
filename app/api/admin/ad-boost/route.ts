import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { countDeliveredByCampaign, countAdLandingsByCampaign, listLeadsByCampaign, getCampaignStats, getCampaignQuestions } from "@/lib/ad-boost/delivered.server";
import { getCampaignReceipt } from "@/lib/ad-boost/receipts.server";
import { sendAdBoostLifecycleEmail } from "@/lib/ad-boost/lifecycle-notifications.server";

/**
 * Admin concierge queue for Provider Ad Boost (managed lead-gen).
 *
 * GET    — list all campaign requests, newest first, for the /admin/ad-boost queue.
 * POST   — update one request: status lifecycle + campaign_tag / channel / note /
 *          setup week. Moving a request to `live` without a campaign_tag auto-sets
 *          it to the request id, so there's always a stable UTM tag to attribute
 *          delivered families against (Phase 3 ROI). The live flip emails the
 *          provider immediately unless launched_email_scheduled_at is set —
 *          then the hourly ad-boost-launch-scheduler cron owns the send
 *          (send_launch_email: true fires it now and clears the schedule).
 * DELETE — hard-delete one request by id (?id= or JSON body). Used to clear out
 *          test runs from the queue; real campaigns should be `cancelled`/`ended`
 *          via POST instead, but this is a deliberate scrub.
 *
 * Auth: admin only.
 */

const VALID_STATUSES = ["pending_profile", "requested", "scheduled", "live", "ended", "cancelled"];
const VALID_CHANNELS = ["google", "meta", "both"];
const AD_BOOST_EMAIL_TYPES = [
  "ad_boost_queued",
  "ad_boost_requested",
  "ad_boost_profile_reminder",
  "ad_boost_ready",
  "ad_boost_campaign_launched",
  "ad_boost_lead_delivered",
  "ad_boost_traction",
  "ad_boost_lead_outcome_check",
  "ad_boost_promo_complete",
];

const ROW_SELECT =
  "id, provider_id, provider_slug, display_name, requested_setup_week, completeness_at_submit, status, channel, intended_monthly_budget, campaign_tag, admin_note, created_at, updated_at, deleted_at, ad_spend_cents, ad_clicks, ad_impressions, flight_end_date, queued_email_sent_at, requested_email_sent_at, profile_reminder_email_sent_at, promotion_email_sent_at, launched_email_sent_at, launched_email_scheduled_at, traction_email_sent_at, promo_complete_email_sent_at, plan_status, plan_value, stripe_customer_id, stripe_subscription_id, subscribed_at";

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const adminUser = await getAdminUser(user.id);
  if (!adminUser) return NextResponse.json({ error: "Access denied" }, { status: 403 });

  const params = new URL(request.url).searchParams;
  const db = getServiceClient();

  // Current Ad Boost cohort for the admin Overview card. Count providers, not
  // request rows, because a provider can run more than one campaign over time.
  // A paid plan remains part of the program even if its introductory campaign
  // row has already moved to `ended`.
  if (params.get("program_count_only") === "true") {
    const { data: rows, error: programErr } = await db
      .from("ad_campaign_requests")
      .select("provider_id")
      .is("deleted_at", null)
      .or(
        "status.in.(pending_profile,requested,scheduled,live),plan_status.in.(active,past_due)",
      );
    if (programErr) {
      console.error("[admin/ad-boost] program count failed:", programErr);
      return NextResponse.json({ error: programErr.message }, { status: 500 });
    }
    const providers = new Set((rows ?? []).map((row) => row.provider_id)).size;
    return NextResponse.json({ providers });
  }

  // Revenue summary for admin surfaces that need subscription detail: paying
  // campaigns (active + past_due — past_due still bills while Stripe duns it)
  // and their combined monthly value.
  if (params.get("revenue_only") === "true") {
    const { data: rows, error: revErr } = await db
      .from("ad_campaign_requests")
      .select("plan_status, plan_value")
      .in("plan_status", ["active", "past_due"])
      .is("deleted_at", null);
    if (revErr) {
      console.error("[admin/ad-boost] revenue summary failed:", revErr);
      return NextResponse.json({ error: revErr.message }, { status: 500 });
    }
    const paying = rows?.length ?? 0;
    const mrr = (rows ?? []).reduce((sum, r) => sum + (r.plan_value ?? 0), 0);
    return NextResponse.json({ paying, mrr });
  }

  // Single-record fetch (?id=) for the detail page. Returns the one request with
  // its delivered count, regardless of archived state.
  const id = params.get("id");
  if (id) {
    const { data: row, error: rowErr } = await db
      .from("ad_campaign_requests")
      .select(ROW_SELECT)
      .eq("id", id)
      .maybeSingle();
    if (rowErr) {
      console.error("[admin/ad-boost] fetch one failed:", rowErr);
      return NextResponse.json({ error: rowErr.message }, { status: 500 });
    }
    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const tag = row.campaign_tag || row.id;
    const [delivered, leads, receipt, communicationResult] = await Promise.all([
      countDeliveredByCampaign(db, [tag]),
      listLeadsByCampaign(db, tag),
      getCampaignReceipt(db, row),
      db
        .from("email_log")
        .select("id, email_type, subject, status, created_at, delivered_at, metadata")
        .in("email_type", AD_BOOST_EMAIL_TYPES)
        .filter("metadata->>request_id", "eq", row.id)
        .order("created_at", { ascending: true })
        .limit(500),
    ]);

    if (communicationResult.error) {
      console.error("[admin/ad-boost] communication history failed:", communicationResult.error);
      return NextResponse.json({ error: communicationResult.error.message }, { status: 500 });
    }

    // Parity with the provider's own /provider/boost live view: the SAME real
    // visitors + leads + questions numbers Hilda sees, computed from the same
    // readers, so the admin queue mirrors the provider's signed-in view (not
    // the legacy benefits-only `delivered` count). Null until the campaign is
    // live or ended (ended keeps stats — the wrap-up leads with them).
    let campaignStats:
      | { visitors: number; leads: number; questions: { received: number; unanswered: number }; since: string }
      | null = null;
    if (row.status === "live" || row.status === "ended") {
      const since = new Date(
        row.requested_setup_week || row.created_at,
      ).toISOString();
      const providerIdVariants = [row.provider_slug, row.provider_id];
      const [stats, questions] = await Promise.all([
        getCampaignStats(db, { providerIdVariants, since }),
        getCampaignQuestions(db, { providerIdVariants, since }),
      ]);
      campaignStats = { ...stats, questions, since };
    }

    return NextResponse.json({
      request: { ...row, delivered: delivered[tag] ?? 0 },
      leads,
      communications: communicationResult.data ?? [],
      campaignStats,
      receipt: {
        google: receipt.google,
        engagement: receipt.engagement,
        outcomes: receipt.outcomes,
        expectedLeads: receipt.expectedLeads,
        week: receipt.week,
      },
    });
  }

  // Default view = the live queue (not archived). `?archived=1` returns only the
  // soft-deleted rows so the admin can review / restore / permanently delete them.
  // Sorted by setup week ascending so the soonest-due work surfaces first.
  const archived = params.get("archived") === "1";

  let query = db
    .from("ad_campaign_requests")
    .select(ROW_SELECT)
    .order("requested_setup_week", { ascending: true })
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
  const [delivered, adLandings] = await Promise.all([
    countDeliveredByCampaign(db, tags),
    countAdLandingsByCampaign(db, tags),
  ]);

  // Questions per campaign for the queue rows — same since-launch window the
  // provider-facing counter uses, batched as ONE query across all campaigns
  // (per-row getCampaignQuestions would be N round-trips). Pre-launch rows
  // read 0 and the UI renders a dash.
  const questionsByRequestId: Record<string, number> = {};
  {
    type ListRow = {
      id: string;
      provider_id: string | null;
      provider_slug: string | null;
      status: string;
      requested_setup_week: string | null;
      created_at: string;
      campaign_tag: string | null;
    };
    const launched = (requests as ListRow[]).filter(
      (r) => r.status === "live" || r.status === "ended",
    );
    if (launched.length > 0) {
      const sinceByRequest = new Map(
        launched.map((r) => [
          r.id,
          new Date(r.requested_setup_week || r.created_at).toISOString(),
        ]),
      );
      const variantToRequestIds = new Map<string, string[]>();
      for (const r of launched) {
        for (const v of [r.provider_slug, r.provider_id]) {
          if (!v) continue;
          const list = variantToRequestIds.get(v) ?? [];
          list.push(r.id);
          variantToRequestIds.set(v, list);
        }
      }
      const minSince = [...sinceByRequest.values()].sort()[0];
      const { data: qRows } = await db
        .from("provider_questions")
        .select("provider_id, status, created_at")
        .in("provider_id", [...variantToRequestIds.keys()])
        .gte("created_at", minSince)
        .limit(5000);
      for (const q of (qRows ?? []) as Array<{
        provider_id: string | null;
        status: string;
        created_at: string;
      }>) {
        if (!q.provider_id || q.status === "archived" || q.status === "rejected") continue;
        // Compare as epochs, not strings — Postgres returns "+00:00"-suffixed
        // timestamps while `since` is Z-format, and mixed-format lexicographic
        // comparison misjudges boundary rows.
        const qAt = new Date(q.created_at).getTime();
        for (const requestId of variantToRequestIds.get(q.provider_id) ?? []) {
          const since = sinceByRequest.get(requestId);
          if (since && qAt >= new Date(since).getTime()) {
            questionsByRequestId[requestId] = (questionsByRequestId[requestId] ?? 0) + 1;
          }
        }
      }
    }
  }

  const withRoi = requests.map((r: { id: string; campaign_tag: string | null }) => ({
    ...r,
    delivered: delivered[r.campaign_tag || r.id] ?? 0,
    ad_landings: adLandings[r.campaign_tag || r.id] ?? 0,
    questions_received: questionsByRequestId[r.id] ?? 0,
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
    ad_spend_cents?: unknown;
    ad_clicks?: unknown;
    ad_impressions?: unknown;
    flight_end_date?: unknown;
    launched_email_scheduled_at?: unknown;
    send_launch_email?: unknown;
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

  if (body.flight_end_date !== undefined) {
    if (body.flight_end_date === null) {
      update.flight_end_date = null;
    } else if (
      typeof body.flight_end_date !== "string" ||
      Number.isNaN(new Date(body.flight_end_date).getTime())
    ) {
      return NextResponse.json({ error: "flight_end_date must be a date string or null" }, { status: 400 });
    } else {
      update.flight_end_date = body.flight_end_date.slice(0, 10);
    }
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

  // Manual performance entry (spend in cents, click count, impressions). Any
  // may be null to clear it; otherwise must be a non-negative integer.
  for (const field of ["ad_spend_cents", "ad_clicks", "ad_impressions"] as const) {
    if (body[field] !== undefined) {
      const v = body[field];
      if (v === null) {
        update[field] = null;
      } else if (typeof v !== "number" || !Number.isInteger(v) || v < 0) {
        return NextResponse.json(
          { error: `${field} must be a non-negative integer or null` },
          { status: 400 },
        );
      } else {
        update[field] = v;
      }
    }
  }

  // Launch-email schedule (UTC ISO; the admin UI collects it as US Eastern).
  // A set time makes the live flip store the schedule instead of emailing the
  // provider immediately — the hourly ad-boost-launch-scheduler cron delivers
  // it once due. Null clears the schedule (the email then only goes out via
  // an explicit send_launch_email).
  if (body.launched_email_scheduled_at !== undefined) {
    if (body.launched_email_scheduled_at === null) {
      update.launched_email_scheduled_at = null;
    } else {
      if (typeof body.launched_email_scheduled_at !== "string") {
        return NextResponse.json(
          { error: "launched_email_scheduled_at must be an ISO timestamp or null" },
          { status: 400 },
        );
      }
      const at = new Date(body.launched_email_scheduled_at);
      if (Number.isNaN(at.getTime())) {
        return NextResponse.json(
          { error: "launched_email_scheduled_at is not a valid timestamp" },
          { status: 400 },
        );
      }
      if (at.getTime() < Date.now() - 60_000) {
        return NextResponse.json(
          { error: "Launch email time is in the past. Pick a future US Eastern time." },
          { status: 400 },
        );
      }
      if (at.getTime() > Date.now() + 30 * 24 * 60 * 60 * 1000) {
        return NextResponse.json(
          { error: "Launch email time is more than 30 days out" },
          { status: 400 },
        );
      }
      update.launched_email_scheduled_at = at.toISOString();
    }
  }

  if (body.send_launch_email !== undefined && body.send_launch_email !== true) {
    return NextResponse.json({ error: "send_launch_email must be true when present" }, { status: 400 });
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

  const { data: current, error: currentError } = await db
    .from("ad_campaign_requests")
    .select(ROW_SELECT)
    .eq("id", body.id)
    .maybeSingle();
  if (currentError) {
    console.error("[admin/ad-boost] current fetch failed:", currentError);
    return NextResponse.json({ error: currentError.message }, { status: 500 });
  }
  if (!current) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Scheduling and send-now only make sense while the launch email is unsent.
  // The idempotency marker would make a stray schedule harmless (the cron
  // filters on launched_email_sent_at IS NULL), but reject it here so the UI
  // can't show a scheduled time that will never fire.
  if (current.launched_email_sent_at) {
    if (typeof update.launched_email_scheduled_at === "string") {
      return NextResponse.json(
        { error: "Launch email already sent — nothing to schedule" },
        { status: 400 },
      );
    }
    if (body.send_launch_email === true) {
      return NextResponse.json({ error: "Launch email already sent" }, { status: 400 });
    }
  }

  const effectiveStatus = (update.status as string | undefined) ?? current.status;
  if (body.send_launch_email === true) {
    if (effectiveStatus !== "live") {
      return NextResponse.json(
        { error: "Campaign must be live to send the launch email" },
        { status: 400 },
      );
    }
    // Sending now supersedes any stored schedule.
    update.launched_email_scheduled_at = null;
  }

  // When launching (status -> live) with no tag yet, default the campaign_tag to
  // the request id so attribution always has a stable, persisted key. The admin
  // page always sends campaign_tag (null when the field is empty), so we resolve
  // the *effective* tag — what it'll be after this update, or the current value
  // if untouched — and only default when that's still empty.
  if (update.status === "live") {
    let effectiveTag = update.campaign_tag as string | null | undefined;
    if (effectiveTag === undefined) {
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

  const metricsWereSaved =
    body.ad_spend_cents !== undefined ||
    body.ad_clicks !== undefined ||
    body.ad_impressions !== undefined;
  // "Getting activity" should mean observable campaign activity, not merely
  // that an operator opened the metrics form and saved zero/partial values.
  // Impressions alone are not shown in the traction email; spend or clicks are.
  const hasMeaningfulTraction =
    (data.ad_spend_cents ?? 0) > 0 || (data.ad_clicks ?? 0) > 0;
  const lifecycleSends: Array<Promise<unknown>> = [];

  // Going live emails the provider immediately UNLESS a launch-email time is
  // in play (set in this save or already stored) — then the hourly cron owns
  // the send. `send_launch_email: true` is the explicit fire-now override.
  const launchEmailScheduled = data.launched_email_scheduled_at != null;
  const wentLive = data.status === "live" && current.status !== "live";
  if ((wentLive && !launchEmailScheduled) || body.send_launch_email === true) {
    lifecycleSends.push(sendAdBoostLifecycleEmail({ request: data, kind: "launched" }));
  }

  if (data.status === "live" && metricsWereSaved && hasMeaningfulTraction) {
    lifecycleSends.push(sendAdBoostLifecycleEmail({ request: data, kind: "traction" }));
  }

  if (data.status === "ended" && current.status !== "ended") {
    lifecycleSends.push(sendAdBoostLifecycleEmail({ request: data, kind: "promo_complete" }));
  }

  if (lifecycleSends.length > 0) {
    await Promise.all(lifecycleSends);
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
