import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getServiceClient } from "@/lib/admin";
import { loadAdBoostEligibility } from "@/lib/ad-boost/eligibility.server";

/**
 * Marks a requested Ad Boost photo update ready for concierge re-review.
 * Called after the provider saves gallery changes from the signed-in Boost
 * experience. It never approves the photos or advances campaign status; the
 * human reviewer still owns the paid-traffic gate.
 */
export async function POST() {
  const elig = await loadAdBoostEligibility();
  if (!elig.ok) {
    return NextResponse.json({ error: elig.error }, { status: elig.status });
  }

  const db = getServiceClient();
  const submittedAt = new Date().toISOString();
  const { data: current, error: lookupError } = await db
    .from("ad_campaign_requests")
    .select("id")
    .eq("provider_id", elig.profileId)
    .eq("photo_readiness_status", "update_requested")
    .in("status", ["requested", "scheduled"])
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (lookupError) {
    console.error("[ad-boost/photo-review] lookup failed:", lookupError);
    return NextResponse.json({ error: "Failed to find the campaign photo review" }, { status: 500 });
  }
  if (!current) {
    return NextResponse.json(
      { error: "No photo update is currently waiting for this campaign" },
      { status: 409 },
    );
  }

  const { data, error } = await db
    .from("ad_campaign_requests")
    .update({
      photo_readiness_status: "review_requested",
      photo_update_submitted_at: submittedAt,
      updated_at: submittedAt,
    })
    .eq("id", current.id)
    .eq("photo_readiness_status", "update_requested")
    .select("id, photo_readiness_status, photo_update_submitted_at")
    .maybeSingle();

  if (error) {
    console.error("[ad-boost/photo-review] submit failed:", error);
    return NextResponse.json({ error: "Failed to submit photos for review" }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: "Photo review changed; refresh and try again" }, { status: 409 });

  // The family-facing provider page is ISR-cached for one hour. Invalidate it
  // after the gallery save so the concierge reviews—and later advertises—the
  // newly submitted photos rather than a stale landing page.
  revalidatePath(`/provider/${elig.slug}`);

  return NextResponse.json({ ok: true, request: data });
}
