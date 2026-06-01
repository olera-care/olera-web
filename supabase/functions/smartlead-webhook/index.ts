// Smartlead webhook receiver — Supabase Edge Function (Deno). [D2]
//
// Routes Smartlead reply/bounce events into the MedJobs CRM as touchpoints,
// so a provider who replies to a cold campaign surfaces in the In-Basket
// Replies tab (and a bounce surfaces as bounce_fix) — the same operational
// state a manually-logged reply produces.
//
// WHY an Edge Function (not a Vercel route): Vercel's Bot Protection edge
// layer 403s provider-origin webhook POSTs (the Resend + Stripe lesson;
// see supabase/functions/resend-webhook). Smartlead's webhooks hit the same
// wall, so this lives off Vercel.
//
// ── ARCHITECTURE NOTE — narrow, deliberate G4 exception ──────────────────
// The Operational Brief's G4 rule is "all mutations through route.ts action
// handlers." The original D2 plan was to have this webhook call
// log_email_replied / log_email_bounced. That isn't viable: the very reason
// this must be an Edge Function (Vercel WAF blocks external POSTs) also blocks
// an Edge→Vercel callback, and the admin route needs a session this has no way
// to mint. So this function writes via the service role directly — the ONLY
// non-route.ts writer of student_outreach state.
//
// It is kept faithful + minimal by leaning on the derived-state model
// (Brief §2.3 "state derives from touchpoints"): it replicates exactly what
// insertTouchpoint + handleLogReply/handleLogTouch do —
//   reply  → insert email_replied touchpoint, reset viewed_at, and (if the row
//            is pre-engagement) set status=engaged, clearing reopen_at when the
//            row was archived. (Skips transitionStage's manual_followup task —
//            the one documented divergence; the row still surfaces in Replies
//            via derived state.)
//   bounce → insert email_bounced touchpoint, reset viewed_at. The bounce_fix
//            stage derives from the touchpoint (matches handleLogTouch exactly).
//
// ── INERT until activated ────────────────────────────────────────────────
// No SMARTLEAD_WEBHOOK_SECRET set → every request is a logged no-op (200).
// Nothing happens until the secret is set AND Smartlead is configured to POST
// here. Payload field names follow Smartlead's documented webhook shape and
// are parsed defensively — VERIFY against current Smartlead webhook docs before
// activating (harmless until then, since it's a no-op).
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

type Kind = "reply" | "bounce" | "ignore";

/** Map a Smartlead event payload to our coarse kind. Smartlead uses event_type
 *  values like EMAIL_REPLY / EMAIL_BOUNCE; we also accept a few aliases
 *  defensively since the exact casing/name should be re-verified before launch. */
function classify(raw: unknown): Kind {
  const ev = String(
    (raw as { event_type?: unknown; event?: unknown })?.event_type ??
      (raw as { event?: unknown })?.event ??
      "",
  ).toUpperCase();
  if (ev.includes("REPLY")) return "reply";
  if (ev.includes("BOUNCE")) return "bounce";
  return "ignore";
}

/** Pull our CRM join key (custom_fields.outreach_id) out of the lead, however
 *  Smartlead nests it; fall back to the lead email for a research_data lookup. */
function extractLead(raw: unknown): { outreachId?: string; email?: string } {
  const r = raw as Record<string, unknown>;
  const lead = (r.lead ?? r.lead_data ?? r) as Record<string, unknown>;
  const cf = (lead.custom_fields ?? r.custom_fields ?? {}) as Record<string, unknown>;
  const outreachId = cf.outreach_id != null ? String(cf.outreach_id) : undefined;
  const email = String(
    (lead.email ?? r.to_email ?? r.to ?? lead.to_email ?? "") as string,
  ).trim().toLowerCase();
  return { outreachId, email: email || undefined };
}

/** Resolve the student_outreach row id + current status from the join key or
 *  email. Returns null if we can't map the event to a row. */
async function resolveRow(
  outreachId: string | undefined,
  email: string | undefined,
): Promise<{ id: string; status: string; reopen: boolean } | null> {
  if (outreachId) {
    const { data } = await supabase
      .from("student_outreach")
      .select("id, status")
      .eq("id", outreachId)
      .maybeSingle();
    if (data) return { id: data.id as string, status: data.status as string, reopen: false };
  }
  if (email) {
    // Match by the lead email stored in the row's smartlead linkage.
    const { data } = await supabase
      .from("student_outreach")
      .select("id, status, research_data")
      .eq("research_data->smartlead->>lead_email", email)
      .limit(1);
    const row = (data ?? [])[0] as { id: string; status: string } | undefined;
    if (row) return { id: row.id, status: row.status, reopen: false };
  }
  return null;
}

/** Insert a touchpoint + reset viewed_at — mirrors insertTouchpoint exactly. */
async function insertTouchpoint(
  outreachId: string,
  type: "email_replied" | "email_bounced",
  payload: Record<string, unknown>,
) {
  await supabase.from("student_outreach_touchpoints").insert({
    outreach_id: outreachId,
    contact_id: null,
    touchpoint_type: type,
    channel: "email",
    outcome: null,
    notes: null,
    payload,
    created_by: null, // system / webhook origin
  });
  await supabase.from("student_outreach").update({ viewed_at: null }).eq("id", outreachId);
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

    const { outreachId, email } = extractLead(raw);
    const row = await resolveRow(outreachId, email);
    if (!row) {
      console.warn("[smartlead-webhook] could not map event to a row", { outreachId, email, kind });
      return new Response("ok (unmatched)", { status: 200 });
    }

    const eventId =
      (raw as { id?: unknown; event_id?: unknown }).id ??
      (raw as { event_id?: unknown }).event_id ??
      null;

    if (kind === "reply") {
      await insertTouchpoint(row.id, "email_replied", { source: "smartlead", event_id: eventId });
      if (PROMOTE_ON_REPLY.has(row.status)) {
        const patch: Record<string, unknown> = { status: "engaged" };
        if (row.status === "no_response_closed") patch.reopen_at = null;
        await supabase.from("student_outreach").update(patch).eq("id", row.id);
      }
    } else {
      // bounce
      await insertTouchpoint(row.id, "email_bounced", { source: "smartlead", event_id: eventId });
    }

    return new Response("ok", { status: 200 });
  } catch (err) {
    console.error("[smartlead-webhook] handler error:", err instanceof Error ? err.message : err);
    return new Response("ok (error logged)", { status: 200 });
  }
});
