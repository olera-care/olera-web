// Provider SmartLead webhook receiver — Supabase Edge Function (Deno).
//
// Routes SmartLead lifecycle events (sent / open / click / reply / bounce /
// unsubscribe) into the provider outreach CRM as touchpoints + stage changes.
//
// WHY an Edge Function (not a Vercel route): Vercel's Bot Protection edge
// layer 403s provider-origin webhook POSTs. SmartLead's webhooks hit the same
// wall, so this lives off Vercel (same pattern as medjobs smartlead-webhook).
//
// ── EVENT MAPPING ─────────────────────────────────────────────────────────
//   EMAIL_SENT       → email_sent touchpoint
//   EMAIL_REPLY      → email_replied touchpoint + stage=needs_call
//   EMAIL_BOUNCE     → email_bounced touchpoint (flag for attention)
//   EMAIL_UNSUBSCRIBE → stage=not_interested (compliance: stop all outreach)
//   EMAIL_OPEN       → UPDATE matching email_sent touchpoint (open_count)
//   EMAIL_CLICK      → UPDATE matching email_sent touchpoint (click_count)
//
// Environment (auto-injected by Supabase): SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// Environment (set via `supabase secrets set`): SMARTLEAD_WEBHOOK_SECRET
//
// Deploy: supabase functions deploy provider-smartlead-webhook

import { createClient } from "jsr:@supabase/supabase-js@2";

const webhookSecret = Deno.env.get("SMARTLEAD_WEBHOOK_SECRET") ?? "";
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const supabase = createClient(supabaseUrl, serviceRoleKey);

type Kind = "sent" | "open" | "click" | "reply" | "bounce" | "unsubscribe" | "ignore";

/** Map a SmartLead event payload to our coarse kind. */
function classify(raw: unknown): Kind {
  const ev = String(
    (raw as { event_type?: unknown; event?: unknown })?.event_type ??
      (raw as { event?: unknown })?.event ??
      "",
  ).toUpperCase();
  if (ev.includes("UNSUBSCRIBE") || ev.includes("COMPLAIN")) return "unsubscribe";
  if (ev.includes("REPLY") || ev.includes("REPLIED")) return "reply";
  if (ev.includes("BOUNCE")) return "bounce";
  if (ev.includes("CLICK")) return "click";
  if (ev.includes("OPEN")) return "open";
  if (ev.includes("SENT") || ev.includes("DELIVER")) return "sent";
  return "ignore";
}

interface LeadExtract {
  trackingId?: string;
  providerId?: string;
  email?: string;
  campaignId?: number;
  sequenceStep?: number;
  eventId?: string;
  eventAt?: string;
  clickUrl?: string;
  replyBody?: string;
  replyPreview?: string;
  replySubject?: string;
  fromEmail?: string;
}

/** Extract CRM join keys from SmartLead lead custom_fields. */
function extractLead(raw: unknown, kind: Kind): LeadExtract {
  const r = raw as Record<string, unknown>;
  const lead = (r.lead ?? r.lead_data ?? r) as Record<string, unknown>;
  const cf = (lead.custom_fields ?? r.custom_fields ?? {}) as Record<string, unknown>;

  const trackingId = cf.tracking_id != null ? String(cf.tracking_id) : undefined;
  const providerId = cf.provider_id != null ? String(cf.provider_id) : undefined;

  // Lead email for resolution (replies use sl_lead_email)
  const email = (
    kind === "reply"
      ? String((r.sl_lead_email ?? r.to_email ?? r.to ?? "") as string)
      : String(
          (lead.email ?? r.sl_lead_email ?? r.to_email ?? r.to ?? lead.to_email ?? "") as string,
        )
  )
    .trim()
    .toLowerCase();

  const campaignIdRaw =
    r.campaign_id ?? (r.campaign as Record<string, unknown> | undefined)?.id;
  const campaignId =
    campaignIdRaw != null && !Number.isNaN(Number(campaignIdRaw))
      ? Number(campaignIdRaw)
      : undefined;

  const sequenceStepRaw =
    (r.sequence_step ?? r.step ?? r.seq_number ?? (r.sequence as Record<string, unknown> | undefined)?.step) as
      | number
      | string
      | undefined;
  const sequenceStep =
    sequenceStepRaw != null && !Number.isNaN(Number(sequenceStepRaw))
      ? Number(sequenceStepRaw)
      : undefined;

  const eventIdRaw = r.id ?? r.event_id ?? r.message_id ?? r.smartlead_event_id;
  const eventId = eventIdRaw != null ? String(eventIdRaw) : undefined;

  const eventAtRaw = r.timestamp ?? r.event_timestamp ?? r.occurred_at ?? r.time;
  const eventAt = eventAtRaw != null ? String(eventAtRaw) : new Date().toISOString();

  // Click URL
  const clickUrlRaw =
    r.link_url ?? r.clicked_url ?? r.url ?? (r.link as Record<string, unknown> | undefined)?.url;
  const clickUrl = clickUrlRaw != null ? String(clickUrlRaw) : undefined;

  // Reply payload
  const reply = (r.reply ?? {}) as Record<string, unknown>;
  const replyBodyRaw =
    r.reply_body ?? r.sent_message_body ?? r.reply_message ?? r.email_body ?? r.body_html ?? reply.body ?? reply.html;
  const replyBody = replyBodyRaw != null ? String(replyBodyRaw) : undefined;
  const replyPreviewRaw = r.preview_text ?? r.sent_message ?? r.reply_preview ?? r.snippet ?? reply.preview_text;
  const replyPreview = replyPreviewRaw != null ? String(replyPreviewRaw) : undefined;
  const replySubjectRaw = r.subject ?? r.reply_subject ?? reply.subject;
  const replySubject = replySubjectRaw != null ? String(replySubjectRaw) : undefined;
  const fromEmailRaw = r.from_email ?? r.from ?? reply.from_email ?? reply.from;
  const fromEmail = fromEmailRaw != null ? String(fromEmailRaw).trim().toLowerCase() : undefined;

  return {
    trackingId,
    providerId,
    email: email || undefined,
    campaignId,
    sequenceStep,
    eventId,
    eventAt,
    clickUrl,
    replyBody,
    replyPreview,
    replySubject,
    fromEmail,
  };
}

interface ResolvedRow {
  id: string;
  provider_id: string;
  stage: string;
  smartlead_data: Record<string, unknown> | null;
}

/** Resolve the provider_outreach_tracking row from tracking_id or email lookup. */
async function resolveRow(
  trackingId: string | undefined,
  email: string | undefined,
): Promise<ResolvedRow | null> {
  // Try by tracking_id first (most reliable)
  if (trackingId) {
    const { data } = await supabase
      .from("provider_outreach_tracking")
      .select("id, provider_id, stage, smartlead_data")
      .eq("id", trackingId)
      .maybeSingle();
    if (data) {
      return {
        id: data.id as string,
        provider_id: data.provider_id as string,
        stage: data.stage as string,
        smartlead_data: (data.smartlead_data as Record<string, unknown> | null) ?? null,
      };
    }
  }

  // Fall back to email lookup via smartlead_data.lead_email
  if (email) {
    const { data } = await supabase
      .from("provider_outreach_tracking")
      .select("id, provider_id, stage, smartlead_data")
      .ilike("smartlead_data->>lead_email", email)
      .limit(1);
    const row = (data ?? [])[0] as
      | { id: string; provider_id: string; stage: string; smartlead_data: Record<string, unknown> | null }
      | undefined;
    if (row) {
      return { id: row.id, provider_id: row.provider_id, stage: row.stage, smartlead_data: row.smartlead_data ?? null };
    }
  }

  return null;
}

/** Check if touchpoint already exists for this event (idempotency). */
async function alreadyProcessed(
  providerId: string,
  type: "email_sent" | "email_replied" | "email_bounced" | "email_complained",
  eventId: string | undefined,
): Promise<boolean> {
  if (!eventId) return false;
  const { data } = await supabase
    .from("provider_outreach_touchpoints")
    .select("id")
    .eq("provider_id", providerId)
    .eq("touchpoint_type", type)
    .filter("details->>smartlead_event_id", "eq", eventId)
    .limit(1);
  return (data ?? []).length > 0;
}

/** Insert a touchpoint. */
async function insertTouchpoint(
  providerId: string,
  type: string,
  details: Record<string, unknown>,
  adminUserId: string | null = null,
) {
  await supabase.from("provider_outreach_touchpoints").insert({
    provider_id: providerId,
    touchpoint_type: type,
    details,
    admin_user_id: adminUserId,
  });
}

async function handleSent(row: ResolvedRow, extract: LeadExtract) {
  if (await alreadyProcessed(row.provider_id, "email_sent", extract.eventId)) return;
  await insertTouchpoint(row.provider_id, "email_sent", {
    source: "smartlead",
    smartlead_event_id: extract.eventId ?? null,
    recipient_email: extract.email ?? null,
    sequence_step: extract.sequenceStep ?? null,
    occurred_at: extract.eventAt,
    campaign_id: extract.campaignId ?? null,
  });
}

async function handleReply(row: ResolvedRow, extract: LeadExtract) {
  if (await alreadyProcessed(row.provider_id, "email_replied", extract.eventId)) return;

  await insertTouchpoint(row.provider_id, "email_replied", {
    source: "smartlead",
    smartlead_event_id: extract.eventId ?? null,
    recipient_email: extract.email ?? null,
    sequence_step: extract.sequenceStep ?? null,
    occurred_at: extract.eventAt,
    reply_body: extract.replyBody ?? null,
    preview_text: extract.replyPreview ?? null,
    reply_subject: extract.replySubject ?? null,
    from_email: extract.fromEmail ?? extract.email ?? null,
  });

  // Cancel any pending tasks (SmartLead owns scheduling now, but just in case)
  await supabase
    .from("provider_outreach_tasks")
    .update({ status: "superseded", completed_at: new Date().toISOString() })
    .eq("provider_id", row.provider_id)
    .eq("status", "pending");

  // Move to needs_call stage (they replied, need follow-up)
  if (row.stage === "in_sequence") {
    await supabase
      .from("provider_outreach_tracking")
      .update({ stage: "needs_call", stage_changed_at: new Date().toISOString() })
      .eq("id", row.id);

    // Log stage change touchpoint
    await insertTouchpoint(row.provider_id, "stage_changed", {
      from_stage: row.stage,
      to_stage: "needs_call",
      reason: "smartlead_reply",
      occurred_at: extract.eventAt,
    });
  }
}

async function handleBounce(row: ResolvedRow, extract: LeadExtract) {
  if (await alreadyProcessed(row.provider_id, "email_bounced", extract.eventId)) return;

  await insertTouchpoint(row.provider_id, "email_bounced", {
    source: "smartlead",
    smartlead_event_id: extract.eventId ?? null,
    recipient_email: extract.email ?? null,
    sequence_step: extract.sequenceStep ?? null,
    occurred_at: extract.eventAt,
    needs_attention: true,
  });

  // Could optionally move to a "bounce_fix" stage here
  // For now, just log the touchpoint for admin attention
}

async function handleUnsubscribe(row: ResolvedRow, extract: LeadExtract) {
  // Don't check alreadyProcessed for unsubscribe - always process for compliance

  await insertTouchpoint(row.provider_id, "email_complained", {
    source: "smartlead",
    smartlead_event_id: extract.eventId ?? null,
    recipient_email: extract.email ?? null,
    occurred_at: extract.eventAt,
    reason: "unsubscribe",
  });

  // Compliance: move to not_interested (stop all outreach)
  if (row.stage !== "not_interested") {
    await supabase
      .from("provider_outreach_tracking")
      .update({ stage: "not_interested", stage_changed_at: new Date().toISOString() })
      .eq("id", row.id);

    await insertTouchpoint(row.provider_id, "stage_changed", {
      from_stage: row.stage,
      to_stage: "not_interested",
      reason: "smartlead_unsubscribe",
      occurred_at: extract.eventAt,
    });
  }

  // Cancel any pending tasks
  await supabase
    .from("provider_outreach_tasks")
    .update({ status: "cancelled", completed_at: new Date().toISOString() })
    .eq("provider_id", row.provider_id)
    .eq("status", "pending");
}

/** Handle open/click by updating the matching email_sent touchpoint payload. */
async function handleEngagement(
  row: ResolvedRow,
  type: "open" | "click",
  extract: LeadExtract,
) {
  // Find the matching email_sent touchpoint
  let query = supabase
    .from("provider_outreach_touchpoints")
    .select("id, details")
    .eq("provider_id", row.provider_id)
    .eq("touchpoint_type", "email_sent");

  if (extract.sequenceStep != null) {
    query = query.filter("details->>sequence_step", "eq", String(extract.sequenceStep));
  }

  const { data } = await query.order("created_at", { ascending: false }).limit(1);
  const touchpoint = (data ?? [])[0] as
    | { id: string; details: Record<string, unknown> | null }
    | undefined;
  if (!touchpoint) return;

  const details = (touchpoint.details ?? {}) as Record<string, unknown>;

  // Check for duplicate event
  const seenEvents = (details.seen_engagement_events as string[] | undefined) ?? [];
  if (extract.eventId && seenEvents.includes(extract.eventId)) {
    return; // Already processed
  }

  let patch: Record<string, unknown>;
  if (type === "open") {
    const openCount = Number(details.open_count ?? 0);
    patch = {
      ...details,
      open_count: openCount + 1,
      last_opened_at: extract.eventAt,
      first_opened_at: details.first_opened_at ?? extract.eventAt,
    };
  } else {
    const clickCount = Number(details.click_count ?? 0);
    const prevCtas = (details.clicked_ctas as string[] | undefined) ?? [];
    const nextCtas = extract.clickUrl ? [...prevCtas, extract.clickUrl].slice(-10) : prevCtas;
    patch = {
      ...details,
      click_count: clickCount + 1,
      last_clicked_at: extract.eventAt,
      first_clicked_at: details.first_clicked_at ?? extract.eventAt,
      clicked_ctas: nextCtas,
    };
  }

  patch.seen_engagement_events = extract.eventId
    ? [...seenEvents, extract.eventId].slice(-100)
    : seenEvents;

  await supabase
    .from("provider_outreach_touchpoints")
    .update({ details: patch })
    .eq("id", touchpoint.id);
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  // Inert until configured
  if (!webhookSecret) {
    console.log("[provider-smartlead-webhook] no SMARTLEAD_WEBHOOK_SECRET set — ignoring.");
    return new Response("ok (inert)", { status: 200 });
  }

  // Auth check
  const url = new URL(req.url);
  const provided = req.headers.get("x-smartlead-secret") ?? url.searchParams.get("secret") ?? "";
  if (provided !== webhookSecret) {
    return new Response("Unauthorized", { status: 401 });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return new Response("Bad Request", { status: 400 });
  }

  // Always return 200 to prevent SmartLead retry storms
  try {
    const kind = classify(raw);

    const rr = raw as Record<string, unknown>;
    console.log("[provider-smartlead-webhook] received", {
      kind,
      event: rr?.event_type ?? rr?.event ?? null,
      keys: raw && typeof raw === "object" ? Object.keys(rr) : typeof raw,
      campaign_id: rr?.campaign_id ?? null,
    });

    if (kind === "ignore") return new Response("ok (ignored)", { status: 200 });

    const extract = extractLead(raw, kind);
    let row = await resolveRow(extract.trackingId, extract.email);

    // Reply fallback: try from_email if lead email didn't match
    if (!row && kind === "reply" && extract.fromEmail && extract.fromEmail !== extract.email) {
      row = await resolveRow(undefined, extract.fromEmail);
      if (row) extract.email = extract.fromEmail;
    }

    if (!row) {
      console.warn("[provider-smartlead-webhook] could not map event to a row", {
        trackingId: extract.trackingId,
        email: extract.email,
        campaignId: extract.campaignId,
        kind,
      });
      return new Response("ok (unmatched)", { status: 200 });
    }

    switch (kind) {
      case "sent":
        await handleSent(row, extract);
        break;
      case "reply":
        await handleReply(row, extract);
        break;
      case "bounce":
        await handleBounce(row, extract);
        break;
      case "unsubscribe":
        await handleUnsubscribe(row, extract);
        break;
      case "open":
      case "click":
        await handleEngagement(row, kind, extract);
        break;
    }

    return new Response("ok", { status: 200 });
  } catch (err) {
    console.error("[provider-smartlead-webhook] handler error:", err instanceof Error ? err.message : err);
    return new Response("ok (error logged)", { status: 200 });
  }
});
