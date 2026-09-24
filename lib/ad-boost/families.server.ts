/**
 * The families a provider's campaign produced, each with a status — server only.
 *
 * This is the list on a provider's campaign page and the single count of
 * "families" every provider-facing surface should show. Two doors feed it:
 *
 *   - Form leads: city leads from an ad that belongs to her campaign, once
 *     handed to her (city_leads.handed_request_id, see
 *     lib/city-ads/primary.server.ts).
 *   - Page inquiries: families who asked through her Olera page after arriving
 *     from one of her ads (a tagged lead_received with a connection).
 *
 * Every status is set by something the system knows, never by our opinion:
 *   replied        answered our text and the classifier reads a family seeking
 *                  care, or wrote to her through her page
 *   warming        our text reached them and they have not answered yet
 *   hard_to_reach  Twilio could not deliver our text (landline, phone off)
 * Screened-out leads (job seekers, spam) are never listed. They are counted, so
 * she can see we filtered them.
 *
 * No dollar figure is read or returned here, by design.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { BLOCKING_CATEGORIES } from "@/lib/city-ads/classify.server";

export type FamilyStatus = "replied" | "warming" | "hard_to_reach";
export type FamilyOutcome = "talking" | "client" | "no";

export interface CampaignFamily {
  /** city_leads.id for a form lead, connections.id for a page inquiry. */
  id: string;
  kind: "form" | "page";
  firstName: string;
  phone: string | null;
  email: string | null;
  arrivedAt: string;
  status: FamilyStatus;
  /** One plain sentence: what we know and what to do. */
  note: string;
  /** Where they came from, as she would say it. */
  source: string;
  outcome: FamilyOutcome | null;
}

export interface CampaignFamilies {
  families: CampaignFamily[];
  counts: Record<FamilyStatus, number>;
  screenedOut: number;
}

interface RequestForFamilies {
  id: string;
  campaign_tag: string | null;
  flight_start_date: string | null;
  requested_setup_week: string | null;
  created_at: string;
}

/** After this long without an answer, "warming" reads as "no reply yet". */
const QUIET_AFTER_MS = 3 * 24 * 60 * 60 * 1000;

function firstNameOf(raw: string | null | undefined): string {
  const first = String(raw ?? "").trim().split(/\s+/)[0] ?? "";
  return first ? first.charAt(0).toUpperCase() + first.slice(1) : "A family";
}

function excerpt(text: string, max = 140): string {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t;
}

function parseJson(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === "object") return raw as Record<string, unknown>;
  if (typeof raw !== "string") return {};
  try {
    const v = JSON.parse(raw);
    return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function str(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

function asOutcome(v: unknown): FamilyOutcome | null {
  return v === "talking" || v === "client" || v === "no" ? v : null;
}

export async function getCampaignFamilies(
  db: SupabaseClient,
  request: RequestForFamilies,
  providerIdVariants: string[],
): Promise<CampaignFamilies> {
  const families: CampaignFamily[] = [];

  // ── Form leads handed to this campaign ──────────────────────────────────
  const { data: handed } = await db
    .from("city_leads")
    .select(
      "id, first_name, phone, email, created_at, handed_at, archived_at, qualification_verdict, qualification_reply, outcome, is_test",
    )
    .eq("handed_request_id", request.id)
    .eq("is_test", false)
    .is("archived_at", null)
    .order("created_at", { ascending: false });
  const leads = (handed ?? []) as Array<{
    id: string;
    first_name: string | null;
    phone: string | null;
    email: string | null;
    created_at: string;
    qualification_verdict: string | null;
    qualification_reply: string | null;
    outcome: string | null;
  }>;

  // What happened to the texts we sent each of them. Twilio's delivery
  // receipts land in email_log (app/api/sms/status), keyed by lead_id.
  const delivery = new Map<string, { delivered: number; failed: number; code: string | null }>();
  if (leads.length) {
    const { data: logs } = await db
      .from("email_log")
      .select("metadata, status, delivered_at, error_message, email_type")
      .like("email_type", "city_lead%")
      .like("recipient", "+%")
      .in(
        "metadata->>lead_id",
        leads.map((l) => l.id),
      );
    for (const row of (logs ?? []) as Array<{
      metadata: Record<string, unknown> | null;
      status: string | null;
      delivered_at: string | null;
      error_message: string | null;
    }>) {
      const leadId = str(row.metadata?.lead_id);
      if (!leadId) continue;
      const d = delivery.get(leadId) ?? { delivered: 0, failed: 0, code: null };
      if (row.delivered_at) d.delivered++;
      if (row.status === "failed") {
        d.failed++;
        const m = /error (\d{5})/.exec(row.error_message ?? "");
        if (m) d.code = m[1];
      }
      delivery.set(leadId, d);
    }
  }

  const now = Date.now();
  for (const l of leads) {
    const d = delivery.get(l.id);
    let status: FamilyStatus;
    let note: string;
    if (l.qualification_verdict === "care_seeker") {
      status = "replied";
      note = l.qualification_reply
        ? `Answered our text: “${excerpt(l.qualification_reply)}”`
        : "Answered our text as a family looking for care.";
    } else if (d && d.failed > 0 && d.delivered === 0) {
      status = "hard_to_reach";
      note =
        d.code === "30006"
          ? "Landline. Texts don't reach it, so call."
          : l.email
            ? "Our texts didn't reach this phone. Try a call, or email."
            : "Our texts didn't reach this phone. Try a call.";
    } else {
      status = "warming";
      const quiet = now - new Date(l.created_at).getTime() > QUIET_AFTER_MS;
      note = quiet
        ? "No reply to our texts yet. Worth a call."
        : d && d.delivered > 0
          ? "We texted to confirm what they need. No reply yet. Their number works."
          : "We texted to confirm what they need. No reply yet.";
    }
    families.push({
      id: l.id,
      kind: "form",
      firstName: firstNameOf(l.first_name),
      phone: l.phone,
      email: l.email,
      arrivedAt: l.created_at,
      status,
      note,
      source: "Filled in your Facebook form",
      outcome: asOutcome(l.outcome),
    });
  }

  // ── Page inquiries from her ads ─────────────────────────────────────────
  const tag = request.campaign_tag || request.id;
  const since = new Date(
    request.flight_start_date || request.requested_setup_week || request.created_at,
  ).toISOString();
  const { data: events } = await db
    .from("provider_activity")
    .select("metadata, created_at")
    .in("provider_id", providerIdVariants)
    .eq("event_type", "lead_received")
    .eq("metadata->>utm_campaign", tag)
    .gte("created_at", since);
  const connectionIds = Array.from(
    new Set(
      ((events ?? []) as Array<{ metadata: Record<string, unknown> | null }>)
        .map((e) => str(e.metadata?.connection_id))
        .filter((id): id is string => !!id),
    ),
  );
  if (connectionIds.length) {
    const { data: conns } = await db
      .from("connections")
      .select("id, from_profile_id, message, metadata, created_at")
      .in("id", connectionIds);
    for (const c of (conns ?? []) as Array<{
      id: string;
      from_profile_id: string | null;
      message: unknown;
      metadata: Record<string, unknown> | null;
      created_at: string;
    }>) {
      const msg = parseJson(c.message);
      const thread = Array.isArray(c.metadata?.thread) ? (c.metadata!.thread as Array<Record<string, unknown>>) : [];
      const familyWrote =
        !!str(msg.message) ||
        thread.some((t) => t.from_profile_id === c.from_profile_id && !t.type && !!str(t.text));
      const phone = str(msg.seeker_phone);
      const email = str(msg.seeker_email);
      const providerOutcome = parseJson(c.metadata?.provider_outcome);
      families.push({
        id: c.id,
        kind: "page",
        firstName: firstNameOf(str(msg.seeker_first_name) ?? null),
        phone,
        email,
        arrivedAt: c.created_at,
        status: familyWrote ? "replied" : "warming",
        note: familyWrote
          ? "Wrote to you through your Olera page. Their message is in Messages."
          : phone
            ? "Asked through your Olera page. No message yet."
            : "Asked through your Olera page. Left an email, no phone.",
        source: "Asked on your Olera page",
        outcome: asOutcome(providerOutcome.value),
      });
    }
  }

  // ── Screened out: from her ads, filed as not a family ───────────────────
  let screenedOut = 0;
  const { data: ads } = await db
    .from("city_campaigns")
    .select("platform_campaign_id")
    .eq("request_id", request.id)
    .not("platform_campaign_id", "is", null);
  const adIds = (ads ?? []).map((a) => a.platform_campaign_id as string);
  if (adIds.length) {
    const { count } = await db
      .from("city_leads")
      .select("id", { count: "exact", head: true })
      .eq("is_test", false)
      .in("meta_campaign_id", adIds)
      .in("archive_reason", BLOCKING_CATEGORIES as unknown as string[]);
    screenedOut = count ?? 0;
  }

  const order: Record<FamilyStatus, number> = { replied: 0, warming: 1, hard_to_reach: 2 };
  families.sort(
    (a, b) => order[a.status] - order[b.status] || +new Date(b.arrivedAt) - +new Date(a.arrivedAt),
  );
  const counts: Record<FamilyStatus, number> = { replied: 0, warming: 0, hard_to_reach: 0 };
  for (const f of families) counts[f.status]++;
  return { families, counts, screenedOut };
}
