import { getServiceClient } from "@/lib/admin";
import {
  adBoostPhotoUpdateEmail,
  adBoostPhotosReadyEmail,
} from "@/lib/email-templates";
import {
  appendTrackingParams,
  reserveEmailLogId,
  sendEmail,
} from "@/lib/email";
import { getSiteUrl } from "@/lib/site-url";
import { loadProviderRecipient } from "./lifecycle-notifications.server";

export type AdBoostPhotoEmailKind = "update_requested" | "reminder" | "ready";

const SENT_COLUMN: Record<AdBoostPhotoEmailKind, string> = {
  update_requested: "photo_nudge_email_sent_at",
  reminder: "photo_reminder_email_sent_at",
  ready: "photo_ready_email_sent_at",
};

const EMAIL_TYPE: Record<AdBoostPhotoEmailKind, string> = {
  update_requested: "ad_boost_photo_update",
  reminder: "ad_boost_photo_reminder",
  ready: "ad_boost_photos_ready",
};

const SUBJECT: Record<AdBoostPhotoEmailKind, string> = {
  update_requested: "One photo update before we launch your Ad Boost",
  reminder: "Your Ad Boost request is waiting on photos",
  ready: "Your photos are ready — campaign setup continues",
};

type PhotoCampaignRow = {
  id: string;
  provider_id: string;
  provider_slug: string | null;
  display_name: string | null;
  requested_setup_week?: string | null;
  channel?: string | null;
};

export async function sendAdBoostPhotoEmail(opts: {
  request: PhotoCampaignRow;
  kind: AdBoostPhotoEmailKind;
}): Promise<{ sent: boolean; skipped?: string; error?: string }> {
  const db = getServiceClient();
  const recipient = await loadProviderRecipient(db, opts.request);
  if (!recipient.email) return { sent: false, skipped: "missing_email" };

  const sentColumn = SENT_COLUMN[opts.kind];
  const requiredPhotoStatus = opts.kind === "ready" ? "ready" : "update_requested";
  const reservedAt = new Date().toISOString();
  const { data: reservation, error: reservationError } = await db
    .from("ad_campaign_requests")
    .update({ [sentColumn]: reservedAt })
    .eq("id", opts.request.id)
    // Close the query/send race: if the provider submits photos after the cron
    // selected the row, a stale reminder must not reserve or send. The same
    // guard prevents an initial/resolution email after an admin changes course.
    .eq("photo_readiness_status", requiredPhotoStatus)
    .is(sentColumn, null)
    .select("id")
    .maybeSingle();

  if (reservationError) {
    console.error("[ad-boost/photo-email] reservation failed:", reservationError);
    return { sent: false, skipped: "reservation_failed", error: reservationError.message };
  }
  if (!reservation) return { sent: false, skipped: "already_sent" };

  const emailType = EMAIL_TYPE[opts.kind];
  const subject = SUBJECT[opts.kind];
  const metadata = {
    request_id: opts.request.id,
    ad_boost_photo_email_kind: opts.kind,
    setup_week: opts.request.requested_setup_week ?? null,
    channel: opts.request.channel ?? null,
  };
  const emailLogId = await reserveEmailLogId({
    to: recipient.email,
    subject,
    emailType,
    recipientType: "provider",
    providerId: recipient.slug,
    metadata,
  });

  const destination = opts.kind === "ready" ? "/provider/boost" : "/provider?edit=gallery";
  const ctaUrl = appendTrackingParams(`${getSiteUrl()}${destination}`, emailLogId);
  const html = opts.kind === "ready"
    ? adBoostPhotosReadyEmail({ providerName: recipient.name, ctaUrl })
    : adBoostPhotoUpdateEmail({
        providerName: recipient.name,
        ctaUrl,
        reminder: opts.kind === "reminder",
      });

  const result = await sendEmail({
    to: recipient.email,
    subject,
    html,
    emailType,
    recipientType: "provider",
    providerId: recipient.slug,
    metadata,
    emailLogId: emailLogId ?? undefined,
    recipientProfileId: recipient.profileId,
  });

  if (!result.success || result.skipped) {
    await db
      .from("ad_campaign_requests")
      .update({ [sentColumn]: null })
      .eq("id", opts.request.id)
      .eq(sentColumn, reservedAt);
    return { sent: false, skipped: result.skipReason ?? result.error ?? "send_failed" };
  }
  return { sent: true };
}
