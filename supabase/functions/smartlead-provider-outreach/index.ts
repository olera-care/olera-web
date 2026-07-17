// Provider Outreach SmartLead webhook receiver — Supabase Edge Function (Deno).
//
// Routes SmartLead lifecycle events for Provider Outreach cold campaigns:
//   EMAIL_REPLY       → stage=needs_call (they responded, time to call)
//   EMAIL_UNSUBSCRIBE → stage=archived with reason
//   EMAIL_CLICK       → track in sequence_metadata (claim link clicked)
//   EMAIL_OPEN        → track open count (lightweight engagement)
//
// NOTE: EMAIL_BOUNCE is NOT supported by SmartLead's webhook API (see lib/smartlead.ts).
// Bounce handler exists defensively but won't receive events in practice.
//
// WHY an Edge Function (not a Vercel route): Vercel's Bot Protection edge
// layer 403s external webhook POSTs. Same issue as MedJobs/Resend webhooks.
//
// ── RESOLUTION ──────────────────────────────────────────────────────────────
// Events carry campaign_id and lead email. We resolve the tracking row by:
//   1. smartlead_campaign_id match
//   2. Lead email match against olera-providers
//
// ── IDEMPOTENCY ─────────────────────────────────────────────────────────────
// Events are dedup'd by event_id stored in sequence_metadata.seen_events[].
//
// Environment (auto-injected): SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// Environment (set via `supabase secrets set`): SMARTLEAD_PROVIDER_WEBHOOK_SECRET
//
// Deploy: supabase functions deploy smartlead-provider-outreach

import { createClient } from "jsr:@supabase/supabase-js@2";

const webhookSecret = Deno.env.get("SMARTLEAD_PROVIDER_WEBHOOK_SECRET") ?? "";
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const supabase = createClient(supabaseUrl, serviceRoleKey);

type EventKind = "reply" | "bounce" | "unsubscribe" | "click" | "open" | "sent" | "ignore";

/** Classify SmartLead event type to our coarse kind. */
function classify(raw: unknown): EventKind {
  const r = raw as Record<string, unknown>;
  const ev = String(r?.event_type ?? r?.event ?? "").toUpperCase();

  if (ev.includes("UNSUBSCRIBE") || ev.includes("COMPLAIN")) return "unsubscribe";
  if (ev.includes("REPLY") || ev.includes("REPLIED")) return "reply";
  if (ev.includes("BOUNCE")) return "bounce";
  if (ev.includes("CLICK")) return "click";
  if (ev.includes("OPEN")) return "open";
  if (ev.includes("SENT") || ev.includes("DELIVER")) return "sent";
  return "ignore";
}

interface EventExtract {
  campaignId?: number;
  leadEmail?: string;
  eventId?: string;
  eventAt?: string;
  clickUrl?: string;
  replyPreview?: string;
  bounceReason?: string;
}

/** Extract relevant fields from SmartLead webhook payload. */
function extractEvent(raw: unknown, kind: EventKind): EventExtract {
  const r = raw as Record<string, unknown>;
  const lead = (r.lead ?? r.lead_data ?? r) as Record<string, unknown>;

  // Campaign ID
  const campaignIdRaw = r.campaign_id ?? (r.campaign as Record<string, unknown> | undefined)?.id;
  const campaignId = campaignIdRaw != null && !Number.isNaN(Number(campaignIdRaw))
    ? Number(campaignIdRaw)
    : undefined;

  // Lead email - replies use sl_lead_email, others use lead.email
  const leadEmail = (
    kind === "reply"
      ? String(r.sl_lead_email ?? r.to_email ?? "")
      : String(lead.email ?? r.sl_lead_email ?? r.to_email ?? lead.to_email ?? "")
  ).trim().toLowerCase() || undefined;

  // Event ID for dedup
  const eventIdRaw = r.id ?? r.event_id ?? r.message_id;
  const eventId = eventIdRaw != null ? String(eventIdRaw) : undefined;

  // Event timestamp
  const eventAtRaw = r.timestamp ?? r.event_timestamp ?? r.occurred_at;
  const eventAt = eventAtRaw != null ? String(eventAtRaw) : new Date().toISOString();

  // Click URL (for click events)
  const clickUrlRaw = r.link_url ?? r.clicked_url ?? r.url;
  const clickUrl = clickUrlRaw != null ? String(clickUrlRaw) : undefined;

  // Reply preview
  const replyPreviewRaw = r.preview_text ?? r.sent_message ?? r.snippet;
  const replyPreview = replyPreviewRaw != null ? String(replyPreviewRaw) : undefined;

  // Bounce reason
  const bounceReasonRaw = r.bounce_reason ?? r.reason ?? r.error;
  const bounceReason = bounceReasonRaw != null ? String(bounceReasonRaw) : undefined;

  return { campaignId, leadEmail, eventId, eventAt, clickUrl, replyPreview, bounceReason };
}

interface TrackingRow {
  id: string;
  provider_id: string;
  stage: string;
  sequence_metadata: Record<string, unknown>;
}

/** Resolve tracking row from campaign_id or lead email. */
async function resolveTrackingRow(
  campaignId: number | undefined,
  leadEmail: string | undefined,
): Promise<TrackingRow | null> {
  // Try by campaign_id first
  if (campaignId) {
    // Don't use .limit(1) here — multiple providers can share a campaign (city-based).
    // We need all rows to disambiguate by email if provided.
    const { data } = await supabase
      .from("provider_outreach_tracking")
      .select("id, provider_id, stage, sequence_metadata")
      .eq("smartlead_campaign_id", campaignId);

    if (data && data.length > 0) {
      // If we have email, disambiguate by looking up the provider
      if (leadEmail) {
        const { data: provider } = await supabase
          .from("olera-providers")
          .select("provider_id")
          .ilike("email", leadEmail)
          .maybeSingle();

        if (provider) {
          const match = data.find((r) => r.provider_id === provider.provider_id);
          if (match) {
            return {
              id: match.id as string,
              provider_id: match.provider_id as string,
              stage: match.stage as string,
              sequence_metadata: (match.sequence_metadata as Record<string, unknown>) ?? {},
            };
          }
        }
      }

      // Fallback: return first match only if there's exactly one provider in the campaign
      if (data.length === 1) {
        const row = data[0];
        return {
          id: row.id as string,
          provider_id: row.provider_id as string,
          stage: row.stage as string,
          sequence_metadata: (row.sequence_metadata as Record<string, unknown>) ?? {},
        };
      }

      // Multiple providers, no email to disambiguate — can't resolve
      console.warn("[provider-outreach-webhook] multiple providers in campaign, no email to disambiguate", {
        campaignId,
        providerCount: data.length,
      });
    }
  }

  // Try by email directly
  if (leadEmail) {
    const { data: provider } = await supabase
      .from("olera-providers")
      .select("provider_id")
      .ilike("email", leadEmail)
      .maybeSingle();

    if (provider) {
      const { data: tracking } = await supabase
        .from("provider_outreach_tracking")
        .select("id, provider_id, stage, sequence_metadata")
        .eq("provider_id", provider.provider_id)
        .maybeSingle();

      if (tracking) {
        return {
          id: tracking.id as string,
          provider_id: tracking.provider_id as string,
          stage: tracking.stage as string,
          sequence_metadata: (tracking.sequence_metadata as Record<string, unknown>) ?? {},
        };
      }
    }
  }

  return null;
}

/** Check if event was already processed (dedup). */
function wasProcessed(metadata: Record<string, unknown>, eventId: string | undefined): boolean {
  if (!eventId) return false;
  const seen = (metadata.seen_events as string[] | undefined) ?? [];
  return seen.includes(eventId);
}

/** Add event to seen list. */
function markProcessed(
  metadata: Record<string, unknown>,
  eventId: string | undefined,
): Record<string, unknown> {
  if (!eventId) return metadata;
  const seen = (metadata.seen_events as string[] | undefined) ?? [];
  return {
    ...metadata,
    seen_events: [eventId, ...seen].slice(0, 100), // Cap at 100 events
  };
}

/** Handle reply: move to needs_call stage. */
async function handleReply(row: TrackingRow, extract: EventExtract) {
  if (wasProcessed(row.sequence_metadata, extract.eventId)) return;

  const metadata = markProcessed(row.sequence_metadata, extract.eventId);
  metadata.last_reply_at = extract.eventAt;
  metadata.reply_preview = extract.replyPreview ?? null;

  // Only move to needs_call if currently in_sequence
  const newStage = row.stage === "in_sequence" ? "needs_call" : row.stage;

  await supabase
    .from("provider_outreach_tracking")
    .update({
      stage: newStage,
      stage_changed_at: newStage !== row.stage ? new Date().toISOString() : undefined,
      sequence_metadata: metadata,
    })
    .eq("id", row.id);

  console.log(`[provider-outreach-webhook] reply: ${row.provider_id} → ${newStage}`);
}

/** Handle bounce: flag for email fix in metadata. */
async function handleBounce(row: TrackingRow, extract: EventExtract) {
  if (wasProcessed(row.sequence_metadata, extract.eventId)) return;

  const metadata = markProcessed(row.sequence_metadata, extract.eventId);
  metadata.bounce_detected_at = extract.eventAt;
  metadata.bounce_reason = extract.bounceReason ?? "unknown";
  metadata.needs_email_fix = true;

  await supabase
    .from("provider_outreach_tracking")
    .update({ sequence_metadata: metadata })
    .eq("id", row.id);

  console.log(`[provider-outreach-webhook] bounce: ${row.provider_id}`);
}

/** Handle unsubscribe: move to archived. */
async function handleUnsubscribe(row: TrackingRow, extract: EventExtract) {
  if (wasProcessed(row.sequence_metadata, extract.eventId)) return;

  const metadata = markProcessed(row.sequence_metadata, extract.eventId);
  metadata.unsubscribed_at = extract.eventAt;

  await supabase
    .from("provider_outreach_tracking")
    .update({
      stage: "archived",
      stage_changed_at: new Date().toISOString(),
      notes: "Unsubscribed via email",
      sequence_metadata: metadata,
    })
    .eq("id", row.id);

  console.log(`[provider-outreach-webhook] unsubscribe: ${row.provider_id} → archived`);
}

/** Handle click: track engagement. */
async function handleClick(row: TrackingRow, extract: EventExtract) {
  if (wasProcessed(row.sequence_metadata, extract.eventId)) return;

  const metadata = markProcessed(row.sequence_metadata, extract.eventId);
  const clicks = (metadata.clicks as number | undefined) ?? 0;
  metadata.clicks = clicks + 1;
  metadata.last_clicked_at = extract.eventAt;

  // Track if claim link was clicked
  if (extract.clickUrl?.includes("/onboard")) {
    metadata.claim_link_clicked = true;
    metadata.claim_link_clicked_at = extract.eventAt;
  }

  await supabase
    .from("provider_outreach_tracking")
    .update({ sequence_metadata: metadata })
    .eq("id", row.id);

  console.log(`[provider-outreach-webhook] click: ${row.provider_id}`);
}

/** Handle open: track engagement (lightweight, no stage change). */
async function handleOpen(row: TrackingRow, extract: EventExtract) {
  if (wasProcessed(row.sequence_metadata, extract.eventId)) return;

  const metadata = markProcessed(row.sequence_metadata, extract.eventId);
  const opens = (metadata.opens as number | undefined) ?? 0;
  metadata.opens = opens + 1;
  metadata.last_opened_at = extract.eventAt;

  await supabase
    .from("provider_outreach_tracking")
    .update({ sequence_metadata: metadata })
    .eq("id", row.id);
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  // Inert until secret is configured
  if (!webhookSecret) {
    console.log("[provider-outreach-webhook] no secret set — ignoring (inert).");
    return new Response("ok (inert)", { status: 200 });
  }

  // Verify webhook secret
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

  // Always return 200 to prevent SmartLead retries
  try {
    const kind = classify(raw);
    const r = raw as Record<string, unknown>;

    console.log("[provider-outreach-webhook] received", {
      kind,
      event: r?.event_type ?? r?.event ?? null,
      campaign_id: r?.campaign_id ?? null,
      lead_email: r?.sl_lead_email ?? r?.to_email ?? null,
    });

    if (kind === "ignore" || kind === "sent") {
      return new Response("ok (ignored)", { status: 200 });
    }

    const extract = extractEvent(raw, kind);
    const row = await resolveTrackingRow(extract.campaignId, extract.leadEmail);

    if (!row) {
      console.warn("[provider-outreach-webhook] could not resolve tracking row", {
        campaignId: extract.campaignId,
        leadEmail: extract.leadEmail,
        kind,
      });
      return new Response("ok (unmatched)", { status: 200 });
    }

    switch (kind) {
      case "reply":
        await handleReply(row, extract);
        break;
      case "bounce":
        await handleBounce(row, extract);
        break;
      case "unsubscribe":
        await handleUnsubscribe(row, extract);
        break;
      case "click":
        await handleClick(row, extract);
        break;
      case "open":
        await handleOpen(row, extract);
        break;
    }

    return new Response("ok", { status: 200 });
  } catch (err) {
    console.error("[provider-outreach-webhook] error:", err instanceof Error ? err.message : err);
    return new Response("ok (error logged)", { status: 200 });
  }
});
