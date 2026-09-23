import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";
import { sendEmail, appendTrackingParams } from "@/lib/email";
import { buildingCareServicesEmail, type ProviderCategory } from "@/lib/email-templates";
import { withCronRun } from "@/lib/crons/run";
import { generateServicesUrls } from "@/lib/claim-tokens";
import { notificationBusinessHours } from "@/lib/provider-comms/notifications";
import { calculateProfileCompleteness } from "@/lib/profile-completeness";
import type { Profile } from "@/lib/types";

const EMAIL_TYPE = "building_care_services";

/**
 * Category-specific services map. 3 suggested services per provider category
 * based on what families search for most in each vertical.
 */
const CATEGORY_SERVICES: Record<string, string[]> = {
  home_health_agency: ["Skilled Nursing", "Physical Therapy", "Medication Management"],
  home_care_agency: ["Personal Care", "Companion Care", "Meal Preparation"],
  assisted_living: ["Personal Care", "Medication Management", "Respite Care"],
  memory_care: ["Dementia Care", "Medication Management", "Personal Care"],
  nursing_home: ["Skilled Nursing", "Rehabilitation", "Medication Management"],
  independent_living: ["Transportation", "Housekeeping", "Meal Preparation"],
};

/** 7 days after facility manager email. If skipped, 7 days after availability. */
const DELAY_MS = 7 * 24 * 3600_000;

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
  return withCronRun("building-care-services", async () => {
    const db = getServiceClient();
    const { data: config, error: configError } = await db.from("cron_config")
      .select("enabled").eq("job_id", "building-care-services").maybeSingle();
    if (configError || config?.enabled !== true) return { status: "held", reason: "Building care services email requires explicit enablement", dry_run: dryRun };
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
        .is("metadata->>building_care_services_attempt_id", null)
        // Must not be admin-archived
        .is("metadata->>admin_archived", null)
        .order("id").limit(100);
      if (cursor) query = query.gt("id", cursor);
      const { data: profiles, error } = await query;
      if (error) throw new Error(`Building care services candidates unavailable: ${error.message}`);
      if (!profiles?.length) break;
      for (const profile of profiles) {
        if (Date.now() - started >= 45_000 || counts.sent + counts.suppressed + counts.errors >= 100) break;
        cursor = profile.id;
        counts.processed++;
        const meta = (profile.metadata || {}) as Record<string, unknown>;

        // Gate: 7 days after facility manager email, or 7 days after availability if FM was skipped
        const fmAt = typeof meta.building_facility_manager_attempted_at === "string"
          ? meta.building_facility_manager_attempted_at : null;
        const availAt = typeof meta.building_availability_attempted_at === "string"
          ? meta.building_availability_attempted_at : null;
        const anchor = fmAt || availAt;
        if (!anchor) { skip("no_anchor_timestamp"); continue; }
        if (now.getTime() - new Date(anchor).getTime() < DELAY_MS) { skip("too_soon"); continue; }

        // Skip if care_types already populated
        if (Array.isArray(profile.care_types) && profile.care_types.length > 0) { skip("care_types_already_filled"); continue; }

        // Skip if profile completion is at or above 80%
        const completeness = calculateProfileCompleteness(profile as unknown as Profile, meta);
        if (completeness.overall >= COMPLETION_SKIP_THRESHOLD) { skip("profile_above_80_pct"); continue; }

        // Skip if no recognized category (can't suggest services)
        const category = profile.provider_category as string | null;
        if (!category || !CATEGORY_SERVICES[category]) { skip("unknown_category"); continue; }

        if (!notificationBusinessHours(now, profile.state)) { skip("outside_business_hours"); continue; }
        if (!profile.email) { skip("no_email"); continue; }
        if (dryRun) { counts.wouldSend++; continue; }

        // Reserve atomically
        const { data: emailLogId, error: reserveError } = await db.rpc("reserve_building_care_services", { p_profile_id: profile.id, p_email: profile.email });
        if (reserveError) throw new Error(`Building care services reservation failed: ${reserveError.message}`);
        if (!emailLogId) { skip("ineligible_or_digest_deferral"); continue; }
        try {
          const contactName = typeof meta.contact_name === "string" ? meta.contact_name : null;
          const firstName = contactName ? contactName.split(/\s+/)[0] : null;
          const services = CATEGORY_SERVICES[category];
          const urls = generateServicesUrls(profile.id, services, profile.email!, profile.slug);
          const confirmUrl = appendTrackingParams(urls.confirm, emailLogId);
          const editUrl = appendTrackingParams(urls.edit, emailLogId);
          const result = await sendEmail({
            to: profile.email!, subject: `Do you offer these services?`,
            html: buildingCareServicesEmail({
              firstName: firstName || null,
              providerName: profile.display_name || "your organization",
              services,
              category: category as ProviderCategory,
              confirmUrl,
              editUrl,
              providerSlug: profile.slug,
            }),
            emailType: EMAIL_TYPE, recipientType: "provider", providerId: profile.id,
            recipientProfileId: profile.id, emailLogId,
          });
          if (!result.success) counts.errors++;
          else if (result.skipped) counts.suppressed++;
          else {
            counts.sent++;
            // Check if confirming services would push profile to graduation threshold
            // (graduation happens when provider actually confirms via the landing page)
          }
        } catch (error) {
          console.error("[building-care-services] Attempt requires review:", emailLogId, error);
          counts.errors++;
        }
      }
      if (profiles.length < 100) break;
    }
    return { status: "ok", dry_run: dryRun, ...counts };
  });
}
