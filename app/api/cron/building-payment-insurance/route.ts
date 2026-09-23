import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";
import { sendEmail, appendTrackingParams } from "@/lib/email";
import { buildingPaymentInsuranceEmail } from "@/lib/email-templates";
import { withCronRun } from "@/lib/crons/run";
import { generateCompletionUrl } from "@/lib/claim-tokens";
import { notificationBusinessHours } from "@/lib/provider-comms/notifications";

const EMAIL_TYPE = "building_payment_insurance";

/** 5 days = 120 hours after notification_setup_nudge. */
const DELAY_MS = 5 * 24 * 3600_000;

export const maxDuration = 60;
export async function GET(request: NextRequest) {
  const params = new URL(request.url).searchParams;
  const secret = process.env.CRON_SECRET;
  if (!secret || (request.headers.get("authorization") !== `Bearer ${secret}` && params.get("secret") !== secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const dryRun = params.get("dry_run") === "true";
  return withCronRun("building-payment-insurance", async () => {
    const db = getServiceClient();
    const { data: config, error: configError } = await db.from("cron_config")
      .select("enabled").eq("job_id", "building-payment-insurance").maybeSingle();
    if (configError || config?.enabled !== true) return { status: "held", reason: "Building payment email requires explicit enablement", dry_run: dryRun };
    const now = new Date();
    const started = Date.now();
    const counts = { sent: 0, suppressed: 0, errors: 0, wouldSend: 0, processed: 0, skipped: {} as Record<string, number> };
    const skip = (reason: string) => { counts.skipped[reason] = (counts.skipped[reason] ?? 0) + 1; };
    let cursor = "";
    while (Date.now() - started < 45_000 && counts.sent + counts.suppressed + counts.errors < 100) {
      let query = db.from("business_profiles")
        .select("id,slug,type,email,metadata,state,display_name")
        .eq("type", "organization").not("account_id", "is", null)
        // Must have completed onboarding through notification nudge
        .not("metadata->>notification_nudge_attempt_id", "is", null)
        // Must not have already attempted this building email
        .is("metadata->>building_payment_insurance_attempt_id", null)
        // Must not be admin-archived
        .is("metadata->>admin_archived", null)
        .order("id").limit(100);
      if (cursor) query = query.gt("id", cursor);
      const { data: profiles, error } = await query;
      if (error) throw new Error(`Building payment candidates unavailable: ${error.message}`);
      if (!profiles?.length) break;
      for (const profile of profiles) {
        if (Date.now() - started >= 45_000 || counts.sent + counts.suppressed + counts.errors >= 100) break;
        cursor = profile.id;
        counts.processed++;
        const meta = (profile.metadata || {}) as Record<string, unknown>;
        // Gate: 5 days after notification nudge was attempted
        const nudgeAt = meta.notification_nudge_attempted_at;
        if (!nudgeAt || typeof nudgeAt !== "string") { skip("no_nudge_timestamp"); continue; }
        if (now.getTime() - new Date(nudgeAt).getTime() < DELAY_MS) { skip("too_soon_after_nudge"); continue; }
        // Skip if payment & insurance section is already completed (has accepted_payments)
        const acceptedPayments = Array.isArray(meta.accepted_payments) ? meta.accepted_payments : [];
        if (acceptedPayments.length > 0) { skip("payment_already_complete"); continue; }
        if (!notificationBusinessHours(now, profile.state)) { skip("outside_business_hours"); continue; }
        if (!profile.email) { skip("no_email"); continue; }
        if (dryRun) { counts.wouldSend++; continue; }
        // Reserve atomically
        const { data: emailLogId, error: reserveError } = await db.rpc("reserve_building_payment_insurance", { p_profile_id: profile.id, p_email: profile.email });
        if (reserveError) throw new Error(`Building payment reservation failed: ${reserveError.message}`);
        if (!emailLogId) { skip("ineligible_or_digest_deferral"); continue; }
        try {
          const contactName = typeof meta.contact_name === "string" ? meta.contact_name : null;
          const firstName = contactName ? contactName.split(/\s+/)[0] : null;
          const url = appendTrackingParams(generateCompletionUrl(profile.slug, profile.email!, "payment"), emailLogId);
          const result = await sendEmail({
            to: profile.email!, subject: "Get more qualified leads with Olera",
            html: buildingPaymentInsuranceEmail({
              firstName: firstName || null,
              providerName: profile.display_name || "your organization",
              paymentUrl: url,
              providerSlug: profile.slug,
            }),
            emailType: EMAIL_TYPE, recipientType: "provider", providerId: profile.id,
            recipientProfileId: profile.id, emailLogId,
          });
          if (!result.success) counts.errors++;
          else if (result.skipped) counts.suppressed++;
          else {
            counts.sent++;
            // Advance lifecycle stage to 'building' on successful send.
            await db.from("business_profiles")
              .update({ lifecycle_stage: "building" })
              .eq("id", profile.id);
          }
        } catch (error) {
          console.error("[building-payment-insurance] Attempt requires review:", emailLogId, error);
          counts.errors++;
        }
      }
      if (profiles.length < 100) break;
    }
    return { status: "ok", dry_run: dryRun, ...counts };
  });
}
