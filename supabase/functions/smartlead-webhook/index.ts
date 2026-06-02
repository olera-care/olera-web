// Smartlead webhook receiver — Supabase Edge Function (Deno). [D2]
//
// Routes Smartlead lifecycle events (sent / open / click / reply / bounce /
// unsubscribe) into the MedJobs CRM as touchpoints + row metadata, so a
// provider who replies to a cold campaign surfaces in the In-Basket Replies
// tab and a bounce surfaces as bounce_fix — the same operational state a
// manually-logged event produces.
//
// WHY an Edge Function (not a Vercel route): Vercel's Bot Protection edge
// layer 403s provider-origin webhook POSTs (the Resend + Stripe lesson;
// see supabase/functions/resend-webhook). Smartlead's webhooks hit the same
// wall, so this lives off Vercel.
//
// ── EVENT MAPPING ─────────────────────────────────────────────────────────
//   EMAIL_SENT       → email_sent touchpoint (contact_id from custom_fields)
//   EMAIL_REPLY      → email_replied touchpoint + status=engaged transition
//                       (if pre-engagement), reopen_at cleared on resurrection
//   EMAIL_BOUNCE     → email_bounced touchpoint
//   EMAIL_UNSUBSCRIBE → email_complained touchpoint + status=do_not_contact
//                       (compliance: cannot continue cadence — mirrors Resend)
//   EMAIL_OPEN       → research_data.smartlead.engagement.opens++ + timestamp
//                       (NO touchpoint — Apple Mail Privacy Protection inflates
//                        open counts; per-event timeline noise would be unhelpful)
//   EMAIL_CLICK      → research_data.smartlead.engagement.clicks++ + timestamp
//
// ── ARCHITECTURE NOTE — narrow, deliberate G4 exception ──────────────────
// The Operational Brief's G4 rule is "all mutations through route.ts action
// handlers." The original D2 plan was to have this webhook call
// log_email_replied / log_email_bounced. That isn't viable: the very reason
// this must be an Edge Function (Vercel WAF blocks external POSTs) also blocks
// an Edge→Vercel callback, and the admin route needs a session this has no way
// to mint. So this function writes via the service role directly — the ONLY
// non-route.ts writer of student_outreach state. It is kept faithful + minimal
// by leaning on the derived-state model (Brief §2.3): it replicates exactly
// what insertTouchpoint + handleLogReply/handleLogTouch do.
//
// ── INERT until activated ────────────────────────────────────────────────
// No SMARTLEAD_WEBHOOK_SECRET set → every request is a logged no-op (200).
// Nothing happens until the secret is set AND Smartlead is configured to POST
// here. Payload field names follow Smartlead's documented webhook shape and
// are parsed defensively — VERIFY against current Smartlead webhook docs before
// activating (harmless until then, since it's a no-op).
//
// ── IDEMPOTENCY ──────────────────────────────────────────────────────────
// Smartlead may retry on transient failures. Sent/reply/bounce/unsubscribe
// events are dedup'd by `payload->>smartlead_event_id` on the destination
// touchpoint type — if a touchpoint already exists for the same event id +
// type, this is a no-op. Open/click events update aggregated counters; we
// dedupe by event_id stored in research_data.smartlead.engagement so retries
// don't double-count.
//
// Environment (auto-injected by Supabase): SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// Environment (set via `supabase secrets set`): SMARTLEAD_WEBHOOK_SECRET
//
// Deploy: see ./README.md

import { createClient } from "jsr:@supabase/supabase-js@2";

const webhookSecret = Deno.env.get("SMARTLEAD_WEBHOOK_SECRET") ?? "";
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const supabase = createClient(supabaseUrl, serviceRoleKey);

// Statuses from which a reply promotes the row to engaged (mirrors
// handleLogReply in app/api/admin/student-outreach/[id]/route.ts).
const PROMOTE_ON_REPLY = new Set([
  "outreach_sent",
  "researched",
  "prospect",
  "no_response_closed",
]);

type Kind = "sent" | "open" | "click" | "reply" | "bounce" | "unsubscribe" | "ignore";

/** Map a Smartlead event payload to our coarse kind. Smartlead uses event_type
 *  values like EMAIL_SENT / EMAIL_REPLY / EMAIL_BOUNCE / EMAIL_OPEN /
 *  EMAIL_CLICK / EMAIL_UNSUBSCRIBE; we accept aliases defensively since the
 *  exact casing/name should be re-verified before launch. */
function classify(raw: unknown): Kind {
  const ev = String(
    (raw as { event_type?: unknown; event?: unknown })?.event_type ??
      (raw as { event?: unknown })?.event ??
      "",
  ).toUpperCase();
  // Order matters: REPLY/BOUNCE/UNSUBSCRIBE/CLICK/OPEN/SENT — REPLY can contain
  // "SENT" in some Smartlead variants, and BOUNCE matches before generic SENT.
  if (ev.includes("UNSUBSCRIBE") || ev.includes("COMPLAIN")) return "unsubscribe";
  if (ev.includes("REPLY") || ev.includes("REPLIED")) return "reply";
  if (ev.includes("BOUNCE")) return "bounce";
  if (ev.includes("CLICK")) return "click";
  if (ev.includes("OPEN")) return "open";
  if (ev.includes("SENT") || ev.includes("DELIVER")) return "sent";
  return "ignore";
}

interface LeadExtract {
  outreachId?: string;
  email?: string;
  contactId?: string | null;
  recipientKind?: string;
  role?: string;
  sequenceStep?: number;
  eventId?: string;
  eventAt?: string;
}

/** Pull our CRM join keys (custom_fields.outreach_id, contact_id, etc.) out of
 *  the lead, however Smartlead nests it; fall back to the lead email for a
 *  research_data lookup. */
function extractLead(raw: unknown): LeadExtract {
  const r = raw as Record<string, unknown>;
  const lead = (r.lead ?? r.lead_data ?? r) as Record<string, unknown>;
  const cf = (lead.custom_fields ?? r.custom_fields ?? {}) as Record<string, unknown>;

  const outreachId = cf.outreach_id != null ? String(cf.outreach_id) : undefined;
  const contactIdRaw = cf.contact_id != null ? String(cf.contact_id) : "";
  // Empty string custom_field = General Contact (synthetic, contact_id=null
  // on touchpoint); non-empty = Named Contact (use as touchpoint.contact_id).
  const contactId = contactIdRaw ? contactIdRaw : null;
  const recipientKind = cf.recipient_kind != null ? String(cf.recipient_kind) : undefined;
  const role = cf.role != null ? String(cf.role) : undefined;

  const email = String(
    (lead.email ?? r.to_email ?? r.to ?? lead.to_email ?? "") as string,
  ).trim().toLowerCase();

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

  return {
    outreachId,
    email: email || undefined,
    contactId,
    recipientKind,
    role,
    sequenceStep,
    eventId,
    eventAt,
  };
}

interface ResolvedRow {
  id: string;
  status: string;
  research_data: Record<string, unknown> | null;
}

/** Resolve the student_outreach row id + current status from the join key or
 *  email. Returns null if we can't map the event to a row. */
async function resolveRow(
  outreachId: string | undefined,
  email: string | undefined,
): Promise<ResolvedRow | null> {
  if (outreachId) {
    const { data } = await supabase
      .from("student_outreach")
      .select("id, status, research_data")
      .eq("id", outreachId)
      .maybeSingle();
    if (data) {
      return {
        id: data.id as string,
        status: data.status as string,
        research_data: (data.research_data as Record<string, unknown> | null) ?? null,
      };
    }
  }
  if (email) {
    // Match by the lead email stored in the row's smartlead linkage.
    const { data } = await supabase
      .from("student_outreach")
      .select("id, status, research_data")
      .eq("research_data->smartlead->>lead_email", email)
      .limit(1);
    const row = (data ?? [])[0] as
      | { id: string; status: string; research_data: Record<string, unknown> | null }
      | undefined;
    if (row) return { id: row.id, status: row.status, research_data: row.research_data ?? null };
  }
  return null;
}

/** Check whether a touchpoint of `type` already exists for this row with the
 *  same Smartlead event id. Smartlead retries are rare but the dedupe guard
 *  keeps the timeline clean and prevents double status transitions. */
async function alreadyProcessed(
  outreachId: string,
  type: "email_sent" | "email_replied" | "email_bounced" | "email_complained",
  eventId: string | undefined,
): Promise<boolean> {
  if (!eventId) return false;
  const { data } = await supabase
    .from("student_outreach_touchpoints")
    .select("id")
    .eq("outreach_id", outreachId)
    .eq("touchpoint_type", type)
    .filter("payload->>smartlead_event_id", "eq", eventId)
    .limit(1);
  return (data ?? []).length > 0;
}

/** Insert a touchpoint — mirrors insertTouchpoint(auto-send-executor.ts) +
 *  resets viewed_at on reply/bounce/complain so the row resurfaces in the
 *  admin's inbox. */
async function insertTouchpoint(
  outreachId: string,
  type: "email_sent" | "email_replied" | "email_bounced" | "email_complained",
  contactId: string | null,
  payload: Record<string, unknown>,
  options: { resetViewedAt?: boolean } = {},
) {
  await supabase.from("student_outreach_touchpoints").insert({
    outreach_id: outreachId,
    contact_id: contactId,
    touchpoint_type: type,
    channel: "email",
    outcome: type === "email_sent" ? "sent" : null,
    notes: null,
    payload,
    created_by: null, // system / webhook origin
  });
  if (options.resetViewedAt) {
    await supabase.from("student_outreach").update({ viewed_at: null }).eq("id", outreachId);
  }
}

async function handleSent(row: ResolvedRow, extract: LeadExtract) {
  if (await alreadyProcessed(row.id, "email_sent", extract.eventId)) return;
  await insertTouchpoint(row.id, "email_sent", extract.contactId ?? null, {
    source: "smartlead",
    smartlead_event_id: extract.eventId ?? null,
    recipient_email: extract.email ?? null,
    recipient_kind: extract.recipientKind === "named" ? "specific" : "general",
    role: extract.role ?? null,
    sequence_step: extract.sequenceStep ?? null,
    occurred_at: extract.eventAt,
    outcome: "sent",
    success: true,
  });
}

async function handleReply(row: ResolvedRow, extract: LeadExtract) {
  if (await alreadyProcessed(row.id, "email_replied", extract.eventId)) return;
  await insertTouchpoint(row.id, "email_replied", extract.contactId ?? null, {
    source: "smartlead",
    smartlead_event_id: extract.eventId ?? null,
    recipient_email: extract.email ?? null,
    recipient_kind: extract.recipientKind === "named" ? "specific" : "general",
    role: extract.role ?? null,
    sequence_step: extract.sequenceStep ?? null,
    occurred_at: extract.eventAt,
  }, { resetViewedAt: true });

  if (PROMOTE_ON_REPLY.has(row.status)) {
    const patch: Record<string, unknown> = { status: "engaged" };
    // Clear reopen_at when reviving a row that was archived (no_response_closed).
    if (row.status === "no_response_closed") patch.reopen_at = null;
    await supabase.from("student_outreach").update(patch).eq("id", row.id);
  }
}

async function handleBounce(row: ResolvedRow, extract: LeadExtract) {
  if (await alreadyProcessed(row.id, "email_bounced", extract.eventId)) return;
  await insertTouchpoint(row.id, "email_bounced", extract.contactId ?? null, {
    source: "smartlead",
    smartlead_event_id: extract.eventId ?? null,
    recipient_email: extract.email ?? null,
    recipient_kind: extract.recipientKind === "named" ? "specific" : "general",
    role: extract.role ?? null,
    sequence_step: extract.sequenceStep ?? null,
    occurred_at: extract.eventAt,
  }, { resetViewedAt: true });
  // No pending-task cancellation: Smartlead owns the email cadence, so there
  // are no outreach_email_send tasks in the CRM to cancel for Smartlead rows
  // (the engine branch in schedule_sequence queues only call tasks).
}

/** Compliance: an unsubscribe / complaint MUST stop the cadence — set the row
 *  to do_not_contact to mirror the Resend `complained` path. Emits an
 *  email_complained touchpoint (existing enum value, G1-compliant). */
async function handleUnsubscribe(row: ResolvedRow, extract: LeadExtract) {
  if (await alreadyProcessed(row.id, "email_complained", extract.eventId)) return;
  await insertTouchpoint(row.id, "email_complained", extract.contactId ?? null, {
    source: "smartlead",
    smartlead_event_id: extract.eventId ?? null,
    recipient_email: extract.email ?? null,
    recipient_kind: extract.recipientKind === "named" ? "specific" : "general",
    role: extract.role ?? null,
    sequence_step: extract.sequenceStep ?? null,
    occurred_at: extract.eventAt,
    reason: "unsubscribe",
  }, { resetViewedAt: true });
  // Compliance: cannot continue any cadence — set the row to do_not_contact.
  if (row.status !== "do_not_contact") {
    await supabase.from("student_outreach").update({ status: "do_not_contact" }).eq("id", row.id);
  }
}

/** Open and click events update aggregated counters on the row instead of
 *  emitting per-event touchpoints. We dedupe by event_id stored alongside the
 *  counters so Smartlead retries don't double-count. */
async function handleEngagement(
  row: ResolvedRow,
  type: "open" | "click",
  extract: LeadExtract,
) {
  const research = (row.research_data ?? {}) as Record<string, unknown>;
  const smartlead = (research.smartlead ?? {}) as Record<string, unknown>;
  const engagement = (smartlead.engagement ?? {}) as Record<string, unknown>;
  const seen = (engagement.seen_event_ids as string[] | undefined) ?? [];

  if (extract.eventId && seen.includes(extract.eventId)) {
    // Already counted this retry — no-op.
    return;
  }

  const opens = Number(engagement.opens ?? 0);
  const clicks = Number(engagement.clicks ?? 0);
  const nextEngagement: Record<string, unknown> = {
    ...engagement,
    opens: type === "open" ? opens + 1 : opens,
    clicks: type === "click" ? clicks + 1 : clicks,
    [type === "open" ? "last_opened_at" : "last_clicked_at"]: extract.eventAt,
    // Cap the dedupe ring so research_data doesn't grow unbounded. 200 ids
    // covers a campaign's lifetime of opens; older retries are unlikely.
    seen_event_ids: extract.eventId
      ? [extract.eventId, ...seen].slice(0, 200)
      : seen,
  };

  await supabase
    .from("student_outreach")
    .update({
      research_data: {
        ...research,
        smartlead: { ...smartlead, engagement: nextEngagement },
      },
    })
    .eq("id", row.id);
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  // Inert until configured: no secret set → logged no-op so a stray/test POST
  // can never mutate the CRM before we intend it to.
  if (!webhookSecret) {
    console.log("[smartlead-webhook] no SMARTLEAD_WEBHOOK_SECRET set — ignoring (inert).");
    return new Response("ok (inert)", { status: 200 });
  }

  // Shared-secret check (header or ?secret= query param).
  const url = new URL(req.url);
  const provided =
    req.headers.get("x-smartlead-secret") ?? url.searchParams.get("secret") ?? "";
  if (provided !== webhookSecret) {
    return new Response("Unauthorized", { status: 401 });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return new Response("Bad Request", { status: 400 });
  }

  // From here on, always return 200 even on internal failure so Smartlead
  // doesn't retry forever (the resend-webhook convention).
  try {
    const kind = classify(raw);
    if (kind === "ignore") return new Response("ok (ignored)", { status: 200 });

    const extract = extractLead(raw);
    const row = await resolveRow(extract.outreachId, extract.email);
    if (!row) {
      console.warn("[smartlead-webhook] could not map event to a row", {
        outreachId: extract.outreachId,
        email: extract.email,
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
    console.error("[smartlead-webhook] handler error:", err instanceof Error ? err.message : err);
    return new Response("ok (error logged)", { status: 200 });
  }
});
