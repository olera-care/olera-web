/**
 * Primary-provider routing — server only.
 *
 * An ad can belong to a provider's campaign (`city_campaigns.request_id`). A
 * lead from such an ad is the provider's by construction: she paid for the ad,
 * so the family goes to her rather than into the city pool, where she would
 * have to race other agencies for her own lead.
 *
 * What changes versus the pool:
 *   - No 30-minute offer and no Take/Pass. The lead appears on her campaign
 *     page with a status that says what we know about it.
 *   - Nobody on our side calls. We screen by text; she makes the calls.
 *   - Speed beats qualification. A lead that has not answered the qualifying
 *     text after HANDOVER_AFTER_MS is handed over as "warming" rather than
 *     paged to a person. One the classifier files as a job seeker or spam is
 *     never handed over.
 *
 * Deliberately NOT a `connections` row. Ten crons act on inquiry connections
 * (unread reminders, nudges, family outcome checks), and a handed lead must not
 * start emailing the provider or the family on their schedule. The campaign
 * page reads city_leads directly.
 *
 * Secondary routing (offering the lead to other pool providers when the
 * primary does not act) is intentionally not wired. An admin can still send a
 * handed lead anywhere with "Offer to…".
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { recordProviderEvent } from "@/lib/analytics/provider-events";
import { sendSlackAlert } from "@/lib/slack";
import { getCityConfig } from "@/lib/city-ads/config";

/**
 * How long a lead from a provider's own ad waits for its qualifying reply
 * before it is handed over anyway. The confirmation text goes out within about
 * five minutes of the form, so a family who is going to answer usually has.
 */
export const HANDOVER_AFTER_MS = 60 * 60 * 1000;

export interface PrimaryCampaign {
  requestId: string;
  providerId: string;
  providerSlug: string | null;
  providerName: string | null;
  campaignTag: string | null;
}

interface LeadForRouting {
  id: string;
  slug: string;
  first_name?: string | null;
  capture_method?: string | null;
  meta_campaign_id?: string | null;
}

/**
 * Which provider campaign, if any, this lead's ad belongs to.
 *
 * Matched on the ad itself first (a Meta lead carries its campaign id). A lead
 * without one falls back to its city, but only when every linked ad in that
 * city belongs to the same campaign; two campaigns in one city is ambiguous and
 * returns null, which keeps the lead in the pool.
 */
export async function resolvePrimaryCampaign(
  db: SupabaseClient,
  lead: LeadForRouting,
): Promise<PrimaryCampaign | null> {
  let requestIds: string[] = [];
  if (lead.meta_campaign_id) {
    const { data } = await db
      .from("city_campaigns")
      .select("request_id")
      .eq("platform_campaign_id", lead.meta_campaign_id)
      .not("request_id", "is", null);
    requestIds = (data ?? []).map((r) => r.request_id as string);
  }
  if (requestIds.length === 0) {
    const { data } = await db
      .from("city_campaigns")
      .select("request_id")
      .eq("slug", lead.slug)
      .not("request_id", "is", null);
    requestIds = (data ?? []).map((r) => r.request_id as string);
  }
  const distinct = Array.from(new Set(requestIds));
  if (distinct.length !== 1) return null;

  const { data: request } = await db
    .from("ad_campaign_requests")
    .select("id, provider_id, campaign_tag, deleted_at")
    .eq("id", distinct[0])
    .maybeSingle();
  if (!request || request.deleted_at || !request.provider_id) return null;

  const { data: provider } = await db
    .from("business_profiles")
    .select("id, slug, display_name")
    .eq("id", request.provider_id)
    .maybeSingle();

  return {
    requestId: request.id as string,
    providerId: request.provider_id as string,
    providerSlug: (provider?.slug as string | null) ?? null,
    providerName: (provider?.display_name as string | null) ?? null,
    campaignTag: (request.campaign_tag as string | null) ?? null,
  };
}

/**
 * Hand a lead to its ad's primary provider. Idempotent: the conditional update
 * on handed_at IS NULL means two overlapping sweeps hand it over once.
 */
export async function handToPrimary(
  db: SupabaseClient,
  lead: LeadForRouting,
  primary: PrimaryCampaign,
  reason: "replied" | "timer" | "admin",
): Promise<boolean> {
  const now = new Date().toISOString();
  const { data: stamped, error } = await db
    .from("city_leads")
    .update({ handed_at: now, handed_request_id: primary.requestId, next_offer_at: null, updated_at: now })
    .eq("id", lead.id)
    .is("handed_at", null)
    .is("archived_at", null)
    .select("id");
  if (error) {
    console.error("[city-ads] handover write failed", error);
    return false;
  }
  if (!stamped?.length) return false;

  // The receipt, so the family counts on her campaign the moment it is hers.
  // Same shape as the accepted-offer receipt in offers.server.ts: slug space,
  // no connection_id (there is no connection row).
  if (primary.campaignTag) {
    await recordProviderEvent({
      provider_id: primary.providerSlug ?? primary.providerId,
      event_type: "lead_received",
      profile_id: primary.providerId,
      metadata: {
        utm_source: "olera_managed",
        utm_campaign: primary.campaignTag,
        city_lead_id: lead.id,
        capture_method: lead.capture_method ?? null,
        raw_provider_id: primary.providerId,
        source: "ad_handover",
      },
    });
  }

  const city = getCityConfig(lead.slug)?.city ?? lead.slug;
  const who = String(lead.first_name ?? "").trim().split(/\s+/)[0] || "A family";
  const why =
    reason === "replied"
      ? "answered our text as a family looking for care"
      : reason === "admin"
        ? "handed over by hand"
        : "no reply to our text after an hour, so handed over as warming";
  await sendSlackAlert(
    `📬 City lead ${lead.id.slice(0, 8)} (${city}): ${who} is now on ${primary.providerName ?? "the provider"}'s campaign page, from their own ad (${why}). Nobody on our side calls; they do. /admin/city-ads`,
  );
  return true;
}
