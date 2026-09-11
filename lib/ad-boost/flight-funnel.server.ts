import { getServiceClient } from "@/lib/admin";
import { getCampaignFunnels } from "@/lib/ad-boost/campaign-funnel.server";
import { countDeliveredByCampaign } from "@/lib/ad-boost/delivered.server";

/**
 * One provider's flights, as a funnel they can be shown.
 *
 * This composes three sources that each own a different part of the journey and
 * none of which can answer it alone:
 *
 *   saw / clicked   ad_campaign_requests, written hourly by the Google Ads
 *                   Script (metrics_source='script'). Only Google knows how many
 *                   people saw an ad.
 *   arrived/engaged getCampaignFunnels -- our own growth events, joined on
 *                   anonymous_id + visit_id because the tracker tags only
 *                   page_landed.
 *   called          countDeliveredByCampaign -- and NOT the funnel's own
 *                   lead_created. See below; this is the trap in this file.
 *
 * THE lead_created TRAP. campaign-funnel.server.ts scopes downstream events to
 * the SAME VISIT as the landing, which is correct for engagement and wrong for
 * conversion: a family who arrives from an ad, leaves, and inquires two days
 * later is a real delivered lead that the visit guard drops. Its own header says
 * so -- "a LOWER BOUND and must not be used as the lead count". It moved
 * Pacesetter from 2 attributed inquiries to 1. So the last stage here reads
 * countDeliveredByCampaign, which takes utm_campaign straight off the inquiry
 * and needs no join. Under-reporting a provider's leads to their face is the one
 * error in this file that would cost real trust.
 *
 * WHY TOP-OF-FUNNEL CAN BE ABSENT. Before 2026-09-11 these columns were typed by
 * hand and were wrong often enough to be unusable -- Edmonds Villa read
 * $0.00 / 4 impressions against a real $43.52 / 391. `trustedTop` is false for
 * anything not written by the script, and the UI must omit those stages rather
 * than draw them. A missing stage reads as "not measured"; a wrong one reads as
 * a lie about money the provider spent.
 */

/** Only the script writes numbers we will put in front of a provider. */
const TRUSTED_METRICS_SOURCE = "script";

export interface FlightFunnel {
  campaignTag: string;
  /** requested | live | ended -- decides tense and what the card asks for. */
  status: string;
  flightStart: string | null;
  flightEnd: string | null;

  /** Google's numbers. Null when never synced -- do not draw these stages. */
  impressions: number | null;
  clicks: number | null;
  spendCents: number | null;
  /** False when the figures above were hand-typed or absent. */
  trustedTop: boolean;
  metricsUpdatedAt: string | null;

  /** Ours. Distinct visits that arrived, and how many touched a CTA. */
  arrived: number;
  engaged: number;

  /** Canonical delivered inquiries. Never the funnel's lead_created. */
  called: number;
}

export async function getProviderFlightFunnels(
  providerId: string,
  opts: { since?: string } = {},
): Promise<FlightFunnel[]> {
  const db = getServiceClient();

  const { data: rows, error } = await db
    .from("ad_campaign_requests")
    .select(
      "campaign_tag, status, flight_start_date, flight_end_date, ad_impressions, ad_clicks, ad_spend_cents, metrics_source, metrics_updated_at",
    )
    .eq("provider_id", providerId)
    .is("deleted_at", null)
    .not("campaign_tag", "is", null)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`flight-funnel flights: ${error.message}`);
  const flights = rows ?? [];
  if (flights.length === 0) return [];

  const tags = flights
    .map((f) => f.campaign_tag as string | null)
    .filter((t): t is string => !!t);

  // Both of these are scoped to this provider's tags, so a provider can never be
  // shown another provider's traffic even if a tag were duplicated upstream.
  const [funnels, delivered] = await Promise.all([
    getCampaignFunnels(db, { campaigns: tags, since: opts.since }),
    countDeliveredByCampaign(db, tags),
  ]);

  const funnelByTag = new Map(funnels.map((f) => [f.campaign, f]));

  return flights.map((f) => {
    const tag = f.campaign_tag as string;
    const mine = funnelByTag.get(tag);
    const trusted = f.metrics_source === TRUSTED_METRICS_SOURCE;

    return {
      campaignTag: tag,
      status: (f.status as string) ?? "requested",
      flightStart: (f.flight_start_date as string | null) ?? null,
      flightEnd: (f.flight_end_date as string | null) ?? null,

      impressions: trusted ? ((f.ad_impressions as number | null) ?? null) : null,
      clicks: trusted ? ((f.ad_clicks as number | null) ?? null) : null,
      spendCents: trusted ? ((f.ad_spend_cents as number | null) ?? null) : null,
      trustedTop: trusted,
      metricsUpdatedAt: (f.metrics_updated_at as string | null) ?? null,

      arrived: mine?.landed ?? 0,
      engaged: mine?.cta_engaged ?? 0,

      called: delivered[tag] ?? 0,
    };
  });
}
