import { getServiceClient } from "@/lib/admin";
import { adBoostLeadOutcomeEmail } from "@/lib/email-templates";
import { appendTrackingParams, reserveEmailLogId, sendEmail } from "@/lib/email";
import { getSiteUrl } from "@/lib/site-url";
import { loadProviderRecipient } from "./lifecycle-notifications.server";

/**
 * Lead-outcome pings — the sensor behind the Ad Boost outcome receipt.
 *
 * For every campaign-attributed inquiry we ask the provider, at ~7 and ~21
 * days, "did this family become a client?" (one tap: client / talking / no).
 * Answers land on connections.metadata.provider_outcome and roll up into the
 * campaign receipt, which is what makes the wrap-up ask provable (the
 * Franchil lesson: a real paying client the platform never saw).
 *
 * Ping rules:
 *   - 7-day ping:  lead is >= 7 days old, no outcome yet, 7d marker unset.
 *   - 21-day ping: lead is >= 21 days old, no outcome OR outcome is
 *     "talking" (so they can upgrade it), 21d marker unset.
 *   - At most ONE outcome email per provider per run — the cron is daily, so
 *     a provider with several due leads gets them on consecutive days rather
 *     than a same-minute stack.
 *
 * Markers live on connections.metadata (provider_outcome_check_7d_sent_at /
 * _21d_sent_at), stamped BEFORE the send and rolled back if the send fails —
 * the same reservation-as-idempotency shape as the lifecycle emails.
 */

const PING_1_DAYS = 7;
const PING_2_DAYS = 21;
const DAY_MS = 24 * 60 * 60 * 1000;

interface CampaignRow {
  id: string;
  provider_id: string;
  provider_slug: string | null;
  display_name: string | null;
  campaign_tag: string | null;
}

interface ConnMeta {
  provider_outcome?: { value?: string };
  provider_outcome_check_7d_sent_at?: string;
  provider_outcome_check_21d_sent_at?: string;
  [key: string]: unknown;
}

export interface OutcomePingCounts {
  campaigns: number;
  due: number;
  sent: number;
  skipped_provider_capped: number;
  skipped_missing_email: number;
  skipped_unsubscribed: number;
  errors: number;
}

export async function sendDueLeadOutcomePings(
  db: ReturnType<typeof getServiceClient>,
  opts: { dryRun?: boolean } = {},
): Promise<OutcomePingCounts> {
  const counts: OutcomePingCounts = {
    campaigns: 0,
    due: 0,
    sent: 0,
    skipped_provider_capped: 0,
    skipped_missing_email: 0,
    skipped_unsubscribed: 0,
    errors: 0,
  };

  const { data: campaigns, error: campaignErr } = await db
    .from("ad_campaign_requests")
    .select("id, provider_id, provider_slug, display_name, campaign_tag")
    .in("status", ["live", "ended"])
    .is("deleted_at", null)
    .limit(200);
  if (campaignErr) {
    console.error("[ad-boost/outcome-pings] campaign fetch failed:", campaignErr);
    throw campaignErr;
  }

  const rows = (campaigns ?? []) as CampaignRow[];
  counts.campaigns = rows.length;
  if (rows.length === 0) return counts;

  const now = Date.now();
  const siteUrl = getSiteUrl();
  const pingedProviders = new Set<string>();

  for (const campaign of rows) {
    const tag = campaign.campaign_tag || campaign.id;

    // Campaign-attributed inquiries (same filter countDeliveredByCampaign uses).
    const { data: leadRows } = await db
      .from("provider_activity")
      .select("created_at, metadata")
      .eq("event_type", "lead_received")
      .filter("metadata->>utm_source", "eq", "olera_managed")
      .filter("metadata->>utm_campaign", "eq", tag)
      .order("created_at", { ascending: true })
      .limit(500);

    const leads = ((leadRows ?? []) as Array<{
      created_at: string;
      metadata: { connection_id?: string; care_type?: string } | null;
    }>).filter((l) => !!l.metadata?.connection_id);
    if (leads.length === 0) continue;

    const connIds = leads.map((l) => l.metadata!.connection_id!) as string[];
    const { data: conns } = await db
      .from("connections")
      .select("id, metadata")
      .in("id", connIds);
    const connById = new Map(
      ((conns ?? []) as Array<{ id: string; metadata: ConnMeta | null }>).map((c) => [
        c.id,
        c.metadata || {},
      ]),
    );

    for (const lead of leads) {
      const connectionId = lead.metadata!.connection_id!;
      const meta = connById.get(connectionId);
      if (!meta) continue;

      const ageDays = (now - new Date(lead.created_at).getTime()) / DAY_MS;
      const outcome = meta.provider_outcome?.value;

      let marker: "provider_outcome_check_7d_sent_at" | "provider_outcome_check_21d_sent_at" | null =
        null;
      if (
        ageDays >= PING_2_DAYS &&
        !meta.provider_outcome_check_21d_sent_at &&
        (!outcome || outcome === "talking")
      ) {
        marker = "provider_outcome_check_21d_sent_at";
      } else if (
        // The early ping belongs to the 7-21 day window ONLY. Without the
        // upper bound, a lead that entered the system already past 21 days
        // would get the 21d ping, then the still-unstamped 7d ping the next
        // day — a stale third email. Two pings per lead is the ceiling.
        ageDays >= PING_1_DAYS &&
        ageDays < PING_2_DAYS &&
        !meta.provider_outcome_check_7d_sent_at &&
        !outcome
      ) {
        marker = "provider_outcome_check_7d_sent_at";
      }
      if (!marker) continue;

      counts.due++;
      if (pingedProviders.has(campaign.provider_id)) {
        counts.skipped_provider_capped++;
        continue;
      }

      if (opts.dryRun) {
        pingedProviders.add(campaign.provider_id);
        counts.sent++;
        continue;
      }

      try {
        const recipient = await loadProviderRecipient(db, campaign);
        if (!recipient.email) {
          counts.skipped_missing_email++;
          // Mark the provider so we don't re-resolve them for every lead this run.
          pingedProviders.add(campaign.provider_id);
          continue;
        }
        if (recipient.leadsUnsubscribed) {
          counts.skipped_unsubscribed++;
          pingedProviders.add(campaign.provider_id);
          continue;
        }

        // Reserve the marker before sending; roll back on failure.
        const reservedAt = new Date().toISOString();
        const reservedMeta = { ...meta, [marker]: reservedAt };
        const { error: stampErr } = await db
          .from("connections")
          .update({ metadata: reservedMeta })
          .eq("id", connectionId);
        if (stampErr) {
          counts.errors++;
          console.error("[ad-boost/outcome-pings] marker stamp failed:", stampErr);
          continue;
        }

        const emailType = "ad_boost_lead_outcome_check";
        const subject = "Did this family become a client?";
        const emailLogId = await reserveEmailLogId({
          to: recipient.email,
          subject,
          emailType,
          recipientType: "provider",
          providerId: recipient.slug,
          metadata: {
            request_id: campaign.id,
            campaign_tag: tag,
            connection_id: connectionId,
            ping: marker === "provider_outcome_check_7d_sent_at" ? "7d" : "21d",
          },
        });

        const outcomeUrl = (v: "client" | "talking" | "no") =>
          `${siteUrl}${appendTrackingParams(
            `/provider/lead-outcome?cid=${connectionId}&v=${v}`,
            emailLogId,
          )}`;

        const leadDate = new Date(lead.created_at).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
        });
        const html = adBoostLeadOutcomeEmail({
          providerName: recipient.name,
          careNeed: lead.metadata?.care_type ? humanizeCareType(lead.metadata.care_type) : null,
          leadDate,
          clientUrl: outcomeUrl("client"),
          talkingUrl: outcomeUrl("talking"),
          noUrl: outcomeUrl("no"),
          isFollowUp: marker === "provider_outcome_check_21d_sent_at",
        });

        const result = await sendEmail({
          to: recipient.email,
          subject,
          html,
          emailType,
          recipientType: "provider",
          providerId: recipient.slug,
          emailLogId: emailLogId ?? undefined,
          recipientProfileId: recipient.profileId,
          metadata: { request_id: campaign.id, connection_id: connectionId },
        });

        if (!result.success || result.skipped) {
          // Roll the marker back so a later run can retry.
          const rollback = { ...reservedMeta };
          delete (rollback as Record<string, unknown>)[marker];
          await db.from("connections").update({ metadata: rollback }).eq("id", connectionId);
          counts.errors++;
          console.warn("[ad-boost/outcome-pings] send did not complete:", result);
          continue;
        }

        pingedProviders.add(campaign.provider_id);
        counts.sent++;
      } catch (err) {
        counts.errors++;
        console.error("[ad-boost/outcome-pings] ping failed:", err);
      }
    }
  }

  return counts;
}

/** "home_care" → "Home care". Mirrors humanizeCareSlug in delivered.server.ts
 *  but kept tiny + local (that one is not exported). */
function humanizeCareType(slug: string): string {
  const cleaned = slug.replace(/[_-]+/g, " ").trim();
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
}
