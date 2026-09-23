import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";
import { sendEmail, appendTrackingParams } from "@/lib/email";
import { buildingFacilityManagerEmail } from "@/lib/email-templates";
import { withCronRun } from "@/lib/crons/run";
import { generateCompletionUrl } from "@/lib/claim-tokens";
import { notificationBusinessHours } from "@/lib/provider-comms/notifications";
import { calculateProfileCompleteness } from "@/lib/profile-completeness";
import type { Profile } from "@/lib/types";

const EMAIL_TYPE = "building_facility_manager";

/** 5 days after the availability check email. */
const DELAY_MS = 5 * 24 * 3600_000;

/** Skip providers at or above this completion threshold. */
const COMPLETION_SKIP_THRESHOLD = 80;

export const maxDuration = 60;
export async function GET(request: NextRequest) {
  const params = new URL(request.url).searchParams;
  const secret = process.env.CRON_SECRET;
  if (!secret || (request.headers.get("authorization") !== `Bearer ${secret}` && params.get("secret") !== secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const dryRun = params.get("dry_run") === "true";
  return withCronRun("building-facility-manager", async () => {
    const db = getServiceClient();
    const { data: config, error: configError } = await db.from("cron_config")
      .select("enabled").eq("job_id", "building-facility-manager").maybeSingle();
    if (configError || config?.enabled !== true) return { status: "held", reason: "Building facility manager email requires explicit enablement", dry_run: dryRun };
    const now = new Date();
    const started = Date.now();
    const counts = { sent: 0, suppressed: 0, errors: 0, wouldSend: 0, processed: 0, skipped: {} as Record<string, number> };
    const skip = (reason: string) => { counts.skipped[reason] = (counts.skipped[reason] ?? 0) + 1; };
    let cursor = "";
    while (Date.now() - started < 45_000 && counts.sent + counts.suppressed + counts.errors < 100) {
      let query = db.from("business_profiles")
        .select("id,slug,type,email,metadata,state,display_name,city,provider_category,description,care_types,images,image")
        .eq("type", "organization").not("account_id", "is", null)
        // Must have received the availability email (every provider gets it)
        .not("metadata->>building_availability_attempt_id", "is", null)
        // Must not have already attempted this building email
        .is("metadata->>building_facility_manager_attempt_id", null)
        // Must not be admin-archived
        .is("metadata->>admin_archived", null)
        .order("id").limit(100);
      if (cursor) query = query.gt("id", cursor);
      const { data: profiles, error } = await query;
      if (error) throw new Error(`Building facility manager candidates unavailable: ${error.message}`);
      if (!profiles?.length) break;
      for (const profile of profiles) {
        if (Date.now() - started >= 45_000 || counts.sent + counts.suppressed + counts.errors >= 100) break;
        cursor = profile.id;
        counts.processed++;
        const meta = (profile.metadata || {}) as Record<string, unknown>;
        // Gate: 5 days after availability email was attempted
        const availAt = meta.building_availability_attempted_at;
        if (!availAt || typeof availAt !== "string") { skip("no_availability_timestamp"); continue; }
        if (now.getTime() - new Date(availAt).getTime() < DELAY_MS) { skip("too_soon_after_availability"); continue; }
        // Skip if facility manager section is already filled out (staff.name exists)
        const staff = meta.staff as { name?: string } | undefined;
        if (staff?.name) { skip("facility_manager_already_complete"); continue; }
        // Skip if profile completion is at or above 80%
        const completeness = calculateProfileCompleteness(profile as unknown as Profile, meta);
        if (completeness.overall >= COMPLETION_SKIP_THRESHOLD) { skip("profile_above_80_pct"); continue; }
        if (!notificationBusinessHours(now, profile.state)) { skip("outside_business_hours"); continue; }
        if (!profile.email) { skip("no_email"); continue; }
        if (dryRun) { counts.wouldSend++; continue; }
        // Reserve atomically
        const { data: emailLogId, error: reserveError } = await db.rpc("reserve_building_facility_manager", { p_profile_id: profile.id, p_email: profile.email });
        if (reserveError) throw new Error(`Building facility manager reservation failed: ${reserveError.message}`);
        if (!emailLogId) { skip("ineligible_or_digest_deferral"); continue; }
        try {
          const contactName = typeof meta.contact_name === "string" ? meta.contact_name : null;
          const firstName = contactName ? contactName.split(/\s+/)[0] : null;
          const url = appendTrackingParams(generateCompletionUrl(profile.slug, profile.email!, "owner"), emailLogId);
          const result = await sendEmail({
            to: profile.email!, subject: `Put a face behind ${profile.display_name || "your community"}`,
            html: buildingFacilityManagerEmail({
              firstName: firstName || null,
              providerName: profile.display_name || "your organization",
              ctaUrl: url,
              providerSlug: profile.slug,
            }),
            emailType: EMAIL_TYPE, recipientType: "provider", providerId: profile.id,
            recipientProfileId: profile.id, emailLogId,
          });
          if (!result.success) counts.errors++;
          else if (result.skipped) counts.suppressed++;
          else counts.sent++;
        } catch (error) {
          console.error("[building-facility-manager] Attempt requires review:", emailLogId, error);
          counts.errors++;
        }
      }
      if (profiles.length < 100) break;
    }
    return { status: "ok", dry_run: dryRun, ...counts };
  });
}
