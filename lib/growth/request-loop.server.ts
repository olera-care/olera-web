import type { SupabaseClient } from "@supabase/supabase-js";
import { providerResponded } from "@/lib/connection-temperature";
import type { GrowthLoopSide, GrowthRequestLoop } from "./types";

/**
 * Does a family who asks hear back? (Home Care Page plan, Phase 4.)
 *
 * The week's provider-page requests and questions, followed through each step
 * at collection time (Tuesday, so the newest are three days old):
 *
 *   saved -> emailed to the agency -> delivered -> opened -> answered
 *         -> family told (heard back, or told the agency hasn't replied)
 *
 * Split by claimed and unclaimed agency, because they fail differently.
 * `marked_sent_without_email` is the alarm: the request says the agency was
 * notified, the agency has an address, and no email went. From 22 Sep to
 * 10 Oct 2026 that was 51 requests and nobody saw it for 18 days.
 *
 * Test listings (slug "test-…") and archived requests are left out.
 */

// Any email that hands the agency this request. The first-lead celebration
// carries the same "see the request" link.
const LEAD_EMAIL_TYPES = ["connection_request", "ad_boost_lead_delivered", "first_lead_celebration"];
const CHUNK = 150;

function emptySide(): GrowthLoopSide {
  return { saved: 0, emailed: 0, delivered: 0, opened: 0, answered: 0, family_told: 0, no_address: 0 };
}

function chunks<T>(rows: T[]): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < rows.length; i += CHUNK) out.push(rows.slice(i, i + CHUNK));
  return out;
}

interface ConnectionRow {
  id: string;
  to_profile_id: string;
  metadata: Record<string, unknown> | null;
}

interface ProfileRow {
  id: string;
  slug: string | null;
  claim_state: string | null;
  email: string | null;
  source_provider_id: string | null;
  metadata: Record<string, unknown> | null;
}

export async function pullRequestLoop(db: SupabaseClient, from: string, to: string): Promise<GrowthRequestLoop> {
  // ── Requests ──
  const { data: rawConnections, error: connError } = await db
    .from("connections")
    .select("id, to_profile_id, metadata")
    .eq("type", "inquiry")
    .gte("created_at", from)
    .lt("created_at", to)
    .limit(20_000);
  if (connError) throw new Error(`Request loop query failed: ${connError.message}`);
  const connections = ((rawConnections || []) as ConnectionRow[]).filter((c) => {
    const meta = c.metadata || {};
    return meta.archived !== true && meta.lead_archived !== true;
  });

  const profileIds = [...new Set(connections.map((c) => c.to_profile_id))];
  const profiles = new Map<string, ProfileRow>();
  for (const ids of chunks(profileIds)) {
    const { data, error } = await db
      .from("business_profiles")
      .select("id, slug, claim_state, email, source_provider_id, metadata")
      .in("id", ids);
    if (error) throw new Error(`Request loop profiles query failed: ${error.message}`);
    for (const row of (data || []) as ProfileRow[]) profiles.set(row.id, row);
  }

  // Unclaimed agencies' addresses live on the directory row.
  const directoryIds = [...new Set([...profiles.values()]
    .filter((p) => !p.email?.trim() && p.source_provider_id)
    .map((p) => p.source_provider_id as string))];
  const directoryEmail = new Set<string>();
  for (const ids of chunks(directoryIds)) {
    const { data, error } = await db.from("olera-providers").select("provider_id, email").in("provider_id", ids);
    if (error) throw new Error(`Request loop directory query failed: ${error.message}`);
    for (const row of (data || []) as Array<{ provider_id: string; email: string | null }>) {
      if (row.email?.trim()) directoryEmail.add(row.provider_id);
    }
  }

  const live = connections.filter((c) => !(profiles.get(c.to_profile_id)?.slug || "").startsWith("test-"));
  const emails = new Map<string, Array<{ email_type: string; status: string; delivered_at: string | null; first_opened_at: string | null }>>();
  for (const ids of chunks(live.map((c) => c.id))) {
    const { data, error } = await db
      .from("email_log")
      .select("email_type, status, delivered_at, first_opened_at, metadata")
      .in("metadata->>connection_id", ids)
      .limit(20_000);
    if (error) throw new Error(`Request loop email query failed: ${error.message}`);
    for (const row of (data || []) as Array<{ email_type: string; status: string; delivered_at: string | null; first_opened_at: string | null; metadata: Record<string, unknown> | null }>) {
      const id = String(row.metadata?.connection_id || "");
      if (!id) continue;
      emails.set(id, [...(emails.get(id) || []), row]);
    }
  }

  const requests = { claimed: emptySide(), unclaimed: emptySide(), marked_sent_without_email: 0 };
  for (const c of live) {
    const profile = profiles.get(c.to_profile_id);
    const meta = c.metadata || {};
    const side = profile?.claim_state === "claimed" ? requests.claimed : requests.unclaimed;
    const hasAddress = !!profile?.email?.trim() || (!!profile?.source_provider_id && directoryEmail.has(profile.source_provider_id));
    const rows = emails.get(c.id) || [];
    const attempts = rows.filter((r) => LEAD_EMAIL_TYPES.includes(r.email_type));
    const leadEmails = attempts.filter((r) => r.status === "sent");
    // Staff "add email" catch-ups log without a connection id but stamp the request.
    const emailed = leadEmails.length > 0 || !!meta.email_sent_at;
    const answered = providerResponded({ metadata: meta, to_profile_id: c.to_profile_id });
    const toldWhyNot = rows.some((r) => r.email_type === "family_provider_silent" && r.status === "sent");

    side.saved += 1;
    if (emailed) side.emailed += 1;
    if (leadEmails.some((r) => r.delivered_at)) side.delivered += 1;
    if (leadEmails.some((r) => r.first_opened_at)) side.opened += 1;
    if (answered) side.answered += 1;
    // A reply reaches the family as a thread message and its notification.
    if (answered || toldWhyNot) side.family_told += 1;
    // An address our sender refuses (bounced, mailbox gone) is no address.
    if (!hasAddress || (!emailed && attempts.length > 0)) side.no_address += 1;
    if (
      !emailed &&
      attempts.length === 0 &&
      hasAddress &&
      meta.provider_notify_state === "sent" &&
      profile?.metadata?.leads_unsubscribed !== true
    ) {
      requests.marked_sent_without_email += 1;
    }
  }

  // ── Questions ──
  // One canonical row per question; repeat taps of the same topic are asks.
  const { data: rawQuestions, error: qError } = await db
    .from("provider_questions")
    .select("id, provider_id, status, metadata")
    .gte("created_at", from)
    .lt("created_at", to)
    .limit(50_000);
  if (qError) throw new Error(`Question loop query failed: ${qError.message}`);
  const questions = ((rawQuestions || []) as Array<{ id: string; provider_id: string | null; status: string | null; metadata: Record<string, unknown> | null }>)
    .filter((q) => !(q.provider_id || "").startsWith("test-") && q.status !== "archived");
  const answeredIds = new Set(questions.filter((q) => q.status === "answered").map((q) => q.id));

  let askersWithEmail = 0;
  let askersTold = 0;
  for (const ids of chunks([...answeredIds])) {
    const { data, error } = await db
      .from("provider_question_asks")
      .select("asker_email, answer_notified_at")
      .in("question_id", ids);
    if (error) throw new Error(`Question asks query failed: ${error.message}`);
    for (const ask of (data || []) as Array<{ asker_email: string | null; answer_notified_at: string | null }>) {
      if (!ask.asker_email?.trim()) continue;
      askersWithEmail += 1;
      if (ask.answer_notified_at) askersTold += 1;
    }
  }

  return {
    requests,
    questions: {
      asked: questions.length,
      no_address: questions.filter((q) => q.metadata?.needs_provider_email === true).length,
      answered: answeredIds.size,
      answered_askers_with_email: askersWithEmail,
      answered_askers_told: askersTold,
    },
  };
}
