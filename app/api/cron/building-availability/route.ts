import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";
import { sendEmail, appendTrackingParams } from "@/lib/email";
import { buildingAvailabilityEmail } from "@/lib/email-templates";
import { withCronRun } from "@/lib/crons/run";
import { generateAvailabilityUrls } from "@/lib/claim-tokens";
import { notificationBusinessHours } from "@/lib/provider-comms/notifications";

const EMAIL_TYPE = "building_availability";

/**
 * 5 days after the previous building email (payment & insurance).
 *
 * Two paths depending on whether the provider got the payment email:
 *   1. Got it  → 5 days after building_payment_insurance_attempted_at
 *   2. Skipped → 10 days after notification_nudge_attempted_at (same window)
 *
 * Universal — no skip condition. Availability isn't currently a feature
 * providers can set in the portal, so every provider needs this email.
 */
const DELAY_MS = 5 * 24 * 3600_000;

export const maxDuration = 60;
export async function GET(request: NextRequest) {
  const params = new URL(request.url).searchParams;
  const secret = process.env.CRON_SECRET;
  if (!secret || (request.headers.get("authorization") !== `Bearer ${secret}` && params.get("secret") !== secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const dryRun = params.get("dry_run") === "true";
  return withCronRun("building-availability", async () => {
    const db = getServiceClient();
    const { data: config, error: configError } = await db.from("cron_config")
      .select("enabled").eq("job_id", "building-availability").maybeSingle();
    if (configError || config?.enabled !== true) return { status: "held", reason: "Building availability email requires explicit enablement", dry_run: dryRun };
    const now = new Date();
    const started = Date.now();
    const counts = { sent: 0, suppressed: 0, errors: 0, wouldSend: 0, processed: 0, skipped: {} as Record<string, number> };
    const skip = (reason: string) => { counts.skipped[reason] = (counts.skipped[reason] ?? 0) + 1; };
    let cursor = "";
    while (Date.now() - started < 45_000 && counts.sent + counts.suppressed + counts.errors < 100) {
      let query = db.from("business_profiles")
        .select("id,slug,type,email,metadata,state,display_name,city")
        .eq("type", "organization").not("account_id", "is", null)
        // Must have completed onboarding through notification nudge
        .not("metadata->>notification_nudge_attempt_id", "is", null)
        // Must not have already attempted this building email
        .is("metadata->>building_availability_attempt_id", null)
        // Must not be admin-archived
        .is("metadata->>admin_archived", null)
        .order("id").limit(100);
      if (cursor) query = query.gt("id", cursor);
      const { data: profiles, error } = await query;
      if (error) throw new Error(`Building availability candidates unavailable: ${error.message}`);
      if (!profiles?.length) break;
      for (const profile of profiles) {
        if (Date.now() - started >= 45_000 || counts.sent + counts.suppressed + counts.errors >= 100) break;
        cursor = profile.id;
        counts.processed++;
        const meta = (profile.metadata || {}) as Record<string, unknown>;
        // Gate: 5 days after the payment email, or 10 days after the notification
        // nudge if the provider skipped payment (already had accepted_payments).
        const paymentAt = typeof meta.building_payment_insurance_attempted_at === "string"
          ? meta.building_payment_insurance_attempted_at : null;
        const nudgeAt = typeof meta.notification_nudge_attempted_at === "string"
          ? meta.notification_nudge_attempted_at : null;
        const anchor = paymentAt || nudgeAt;
        if (!anchor) { skip("no_anchor_timestamp"); continue; }
        const elapsed = now.getTime() - new Date(anchor).getTime();
        // If anchored on payment email: 5 days. If anchored on nudge (skipped payment): 10 days.
        const requiredDelay = paymentAt ? DELAY_MS : DELAY_MS * 2;
        if (elapsed < requiredDelay) { skip("too_soon"); continue; }
        if (!notificationBusinessHours(now, profile.state)) { skip("outside_business_hours"); continue; }
        if (!profile.email) { skip("no_email"); continue; }
        if (dryRun) { counts.wouldSend++; continue; }
        // Reserve atomically
        const { data: emailLogId, error: reserveError } = await db.rpc("reserve_building_availability", { p_profile_id: profile.id, p_email: profile.email });
        if (reserveError) throw new Error(`Building availability reservation failed: ${reserveError.message}`);
        if (!emailLogId) { skip("ineligible_or_digest_deferral"); continue; }
        try {
          const contactName = typeof meta.contact_name === "string" ? meta.contact_name : null;
          const firstName = contactName ? contactName.split(/\s+/)[0] : null;
          const urls = generateAvailabilityUrls(profile.id, profile.email!);
          const yesUrl = appendTrackingParams(urls.yes, emailLogId);
          const noUrl = appendTrackingParams(urls.no, emailLogId);
          const result = await sendEmail({
            to: profile.email!, subject: "Are you accepting new clients?",
            html: buildingAvailabilityEmail({
              firstName: firstName || null,
              providerName: profile.display_name || "your organization",
              city: profile.city || null,
              yesUrl,
              noUrl,
              providerSlug: profile.slug,
            }),
            emailType: EMAIL_TYPE, recipientType: "provider", providerId: profile.id,
            recipientProfileId: profile.id, emailLogId,
          });
          if (!result.success) counts.errors++;
          else if (result.skipped) counts.suppressed++;
          else counts.sent++;
        } catch (error) {
          console.error("[building-availability] Attempt requires review:", emailLogId, error);
          counts.errors++;
        }
      }
      if (profiles.length < 100) break;
    }
    return { status: "ok", dry_run: dryRun, ...counts };
  });
}
