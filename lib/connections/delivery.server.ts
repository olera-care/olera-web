import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * What actually happened to a family's request, for the family's card.
 * (Home Care Page plan, Phase 4: "Saved" until we know it was delivered.)
 *
 *   sending      we have an address; the alert is held up to 10 minutes while
 *                the family finishes telling us about their care
 *   sent         the agency was emailed
 *   unreachable  no address, the agency opted out of lead emails, or our sender
 *                refused the address (bounced, mailbox gone)
 *
 * Until 10 Oct 2026 every one of these read "Connected with …", including the
 * half of unclaimed-agency requests that reached no one.
 */
export type DeliveryState = "sending" | "sent" | "unreachable";

export interface DeliveryStatus {
  state: DeliveryState;
  /** The agency's listed phone, offered when we couldn't email them. */
  phone: string | null;
}

const LEAD_EMAIL_TYPES = ["connection_request", "ad_boost_lead_delivered", "first_lead_celebration"];

export async function getDeliveryStatus(
  db: SupabaseClient,
  connection: { id: string; to_profile_id: string; metadata?: Record<string, unknown> | null },
): Promise<DeliveryStatus> {
  const { data: provider } = await db
    .from("business_profiles")
    .select("email, phone, metadata, source_provider_id")
    .eq("id", connection.to_profile_id)
    .maybeSingle();
  const providerMeta = (provider?.metadata as Record<string, unknown> | null) ?? {};

  let directory: { email: string | null; phone: string | null } | null = null;
  if (provider?.source_provider_id) {
    const { data } = await db
      .from("olera-providers")
      .select("email, phone")
      .eq("provider_id", provider.source_provider_id)
      .maybeSingle();
    directory = data as { email: string | null; phone: string | null } | null;
  }
  const phone = provider?.phone?.trim() || directory?.phone?.trim() || null;

  const hasAddress =
    !providerMeta.leads_unsubscribed && !!(provider?.email?.trim() || directory?.email?.trim());
  if (!hasAddress) return { state: "unreachable", phone };

  const { data: emails } = await db
    .from("email_log")
    .select("status")
    .eq("metadata->>connection_id", connection.id)
    .in("email_type", LEAD_EMAIL_TYPES);
  const rows = (emails ?? []) as Array<{ status: string }>;
  if (rows.some((r) => r.status === "sent") || connection.metadata?.email_sent_at) {
    return { state: "sent", phone };
  }
  // Tried and refused: the address is dead.
  if (rows.length > 0) return { state: "unreachable", phone };
  // The sender has finished and nothing went out: the agency was never emailed
  // (the 22 Sep - 10 Oct gap left 51 such requests marked "sent").
  const notifyState = connection.metadata?.provider_notify_state;
  if (notifyState === "sent" || notifyState === "skipped" || notifyState === "failed") {
    return { state: "unreachable", phone };
  }
  return { state: "sending", phone };
}
