import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";
import { sendEmail, appendTrackingParams } from "@/lib/email";
import { buildingPhotosEmail, buildingPhotosSubject } from "@/lib/email-templates";
import { monthlyPageViews } from "@/lib/provider-comms/page-views";
import { withCronRun } from "@/lib/crons/run";
import { resolveBuildingCategory, isFacilityCategory } from "@/lib/provider-comms/category";
import { generateCompletionUrl } from "@/lib/claim-tokens";
import { notificationBusinessHours } from "@/lib/provider-comms/notifications";
import type { Profile } from "@/lib/types";
import { calculateProfileCompleteness } from "@/lib/profile-completeness";

const EMAIL_TYPE = "building_photos";


/** 7 days after care services email (or previous anchor if skipped). */
const DELAY_MS = 7 * 24 * 3600_000;

/** Providers with this many photos or more are already complete. */
const PHOTO_SKIP_THRESHOLD = 3;

export const maxDuration = 60;
export async function GET(request: NextRequest) {
  const params = new URL(request.url).searchParams;
  const secret = process.env.CRON_SECRET;
  if (!secret || (request.headers.get("authorization") !== `Bearer ${secret}` && params.get("secret") !== secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const dryRun = params.get("dry_run") === "true";
  return withCronRun("building-photos", async () => {
    const db = getServiceClient();
    const { data: config, error: configError } = await db.from("cron_config")
      .select("enabled").eq("job_id", "building-photos").maybeSingle();
    // A dry run reserves and sends nothing, so it may run while paused.
    if (!dryRun && (configError || config?.enabled !== true)) return { status: "held", reason: "Building photos email requires explicit enablement", dry_run: dryRun };
    const now = new Date();
    const started = Date.now();
    const counts = { sent: 0, suppressed: 0, errors: 0, wouldSend: 0, processed: 0, skipped: {} as Record<string, number> };
    const skip = (reason: string) => { counts.skipped[reason] = (counts.skipped[reason] ?? 0) + 1; };
    let cursor = "";
    while (Date.now() - started < 45_000 && counts.sent + counts.suppressed + counts.errors < 100) {
      let query = db.from("business_profiles")
        .select("id,slug,type,email,metadata,state,display_name,city,address,category,description,care_types,image_url,source_provider_id")
        .eq("type", "organization").not("account_id", "is", null)
        // Must have received the availability email (every provider gets it)
        .not("metadata->>building_availability_attempt_id", "is", null)
        // Must not have already attempted this building email
        .is("metadata->>building_photos_attempt_id", null)
        // Must not be admin-archived
        .is("metadata->>admin_archived", null)
        .order("id").limit(100);
      if (cursor) query = query.gt("id", cursor);
      const { data: profiles, error } = await query;
      if (error) throw new Error(`Building photos candidates unavailable: ${error.message}`);
      if (!profiles?.length) break;
      for (const profile of profiles) {
        if (Date.now() - started >= 45_000 || counts.sent + counts.suppressed + counts.errors >= 100) break;
        cursor = profile.id;
        counts.processed++;
        const meta = (profile.metadata || {}) as Record<string, unknown>;

        // Only facility-based categories
        const category = await resolveBuildingCategory(db, profile);
        if (!isFacilityCategory(category)) { skip("not_facility_category"); continue; }

        // Gate: 7 days after care services, facility manager, or availability (whichever is most recent)
        const careAt = typeof meta.building_care_services_attempted_at === "string"
          ? meta.building_care_services_attempted_at : null;
        const fmAt = typeof meta.building_facility_manager_attempted_at === "string"
          ? meta.building_facility_manager_attempted_at : null;
        const availAt = typeof meta.building_availability_attempted_at === "string"
          ? meta.building_availability_attempted_at : null;
        // An earlier email with no attempt only counts as skipped when its own
        // skip rule applies; otherwise it is still due, and photos waits.
        const completeness = calculateProfileCompleteness(profile as unknown as Profile, meta);
        const below80 = completeness.overall < 80;
        const staff = meta.staff as { name?: string } | undefined;
        const hasServices = Array.isArray(profile.care_types) && profile.care_types.length > 0;
        if (!fmAt && !staff?.name && below80) { skip("waiting_for_owner_email"); continue; }
        if (!careAt && !hasServices && below80) { skip("waiting_for_services_email"); continue; }
        const anchor = careAt || fmAt || availAt;
        if (!anchor) { skip("no_anchor_timestamp"); continue; }
        if (now.getTime() - new Date(anchor).getTime() < DELAY_MS) { skip("too_soon"); continue; }

        // Skip if already has enough photos
        const images = Array.isArray(meta.images) ? meta.images : [];
        if (images.length >= PHOTO_SKIP_THRESHOLD) { skip("enough_photos"); continue; }

        if (!notificationBusinessHours(now, profile.state)) { skip("outside_business_hours"); continue; }
        if (!profile.email) { skip("no_email"); continue; }
        if (dryRun) { counts.wouldSend++; continue; }

        // Reserve atomically
        const providerName = profile.display_name || "your community";
        const subject = buildingPhotosSubject(providerName);
        const { data: emailLogId, error: reserveError } = await db.rpc("reserve_building_photos", { p_profile_id: profile.id, p_email: profile.email, p_subject: subject });
        if (reserveError) throw new Error(`Building photos reservation failed: ${reserveError.message}`);
        if (!emailLogId) { skip("ineligible_or_digest_deferral"); continue; }
        try {
          const contactName = typeof meta.contact_name === "string" ? meta.contact_name : null;
          const firstName = contactName ? contactName.split(/\s+/)[0] : null;
          const photoCount = images.length;
          const monthlyViews = await monthlyPageViews(db, [profile.id, profile.slug, profile.source_provider_id as string | null]);
          const url = appendTrackingParams(generateCompletionUrl(profile.slug, profile.email!, "gallery"), emailLogId);
          const result = await sendEmail({
            to: profile.email!, subject,
            html: buildingPhotosEmail({
              firstName: firstName || null,
              providerName,
              photoCount,
              monthlyViews,
              ctaUrl: url,
              providerSlug: profile.slug,
            }),
            emailType: EMAIL_TYPE, recipientType: "provider", providerId: profile.id,
            recipientProfileId: profile.id, emailLogId,
          });
          if (!result.success) counts.errors++;
          else if (result.skipped) counts.suppressed++;
          else {
            counts.sent++;
            // Graduate provider to growth stage — this is the final building email
            await db.from("business_profiles")
              // The stage is a column (migration 197), and only the column: a
              // metadata write here would also put back the copy read before
              // reserve_building_photos stamped the once-only flag, erasing it.
              .update({ lifecycle_stage: "growth" })
              .eq("id", profile.id)
              .then(({ error: gradError }) => {
                if (gradError) console.error("[building-photos] Graduation error:", profile.id, gradError);
                else console.log("[building-photos] Provider graduated to growth:", profile.id);
              });
          }
        } catch (error) {
          console.error("[building-photos] Attempt requires review:", emailLogId, error);
          counts.errors++;
        }
      }
      if (profiles.length < 100) break;
    }
    return { status: "ok", dry_run: dryRun, ...counts };
  }, { ignorePause: dryRun });
}
