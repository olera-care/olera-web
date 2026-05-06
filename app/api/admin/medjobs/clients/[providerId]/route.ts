import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import {
  getClientStatus,
  type ProviderMetadata,
} from "@/lib/medjobs/clients";

/**
 * GET /api/admin/medjobs/clients/[providerId]
 *
 * Returns full management context for a single provider client — used
 * by the provider variant of the unified Drawer (v9.0 Phase 2).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ providerId: string }> },
) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const adminUser = await getAdminUser(user.id);
    if (!adminUser) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const { providerId } = await params;

    const db = getServiceClient();
    const { data, error } = await db
      .from("business_profiles")
      .select(
        "id, display_name, business_name, slug, email, phone, city, state, metadata, is_active, image_url, created_at, updated_at, type",
      )
      .eq("id", providerId)
      .in("type", ["organization", "caregiver"])
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message ?? "Provider not found" },
        { status: 404 },
      );
    }

    const metadata = (data.metadata ?? {}) as ProviderMetadata;
    const status = getClientStatus(metadata);

    // v9.0 Phase 2 Tier 3.7: pull interview history for the
    // Acknowledgement + Recent activity sections in the drawer.
    // The earliest proposed interview is what triggered T&C
    // capture (interview_terms_accepted_at). Recent interviews
    // give admin pilot-utilization context.
    type InterviewRow = {
      id: string;
      status: string;
      type: string;
      proposed_time: string;
      confirmed_time: string | null;
      created_at: string;
      student: { id: string; display_name: string | null } | { id: string; display_name: string | null }[] | null;
    };
    const { data: interviewsRaw } = await db
      .from("interviews")
      .select(
        "id, status, type, proposed_time, confirmed_time, created_at, student:business_profiles!interviews_student_profile_id_fkey(id, display_name)",
      )
      .eq("provider_profile_id", providerId)
      .order("created_at", { ascending: true })
      .limit(50);

    const interviews = (interviewsRaw ?? []) as InterviewRow[];

    const normalizeStudent = (s: InterviewRow["student"]) => {
      if (!s) return null;
      const single = Array.isArray(s) ? s[0] ?? null : s;
      return single ? { id: single.id, display_name: single.display_name } : null;
    };

    const interviewsList = interviews.map((i) => ({
      id: i.id,
      status: i.status,
      type: i.type,
      proposed_time: i.proposed_time,
      confirmed_time: i.confirmed_time,
      created_at: i.created_at,
      student: normalizeStudent(i.student),
    }));

    const firstInterview = interviewsList[0] ?? null;
    const recentInterviews = [...interviewsList].reverse().slice(0, 5);

    return NextResponse.json({
      id: data.id,
      display_name: data.business_name || data.display_name || "(unnamed provider)",
      slug: data.slug,
      email: data.email,
      phone: data.phone,
      city: data.city,
      state: data.state,
      image_url: data.image_url,
      is_active: data.is_active,
      created_at: data.created_at,
      updated_at: data.updated_at,
      stripe_customer_id: metadata.medjobs_stripe_customer_id ?? null,
      subscription_id: metadata.medjobs_subscription_id ?? null,
      subscription_active: !!metadata.medjobs_subscription_active,
      interview_terms_accepted_at: metadata.interview_terms_accepted_at ?? null,
      credits_used: metadata.medjobs_credits_used ?? 0,
      status: status.status,
      pilot_started_at: status.pilotStartedAt?.toISOString() ?? null,
      pilot_ends_at: status.pilotEndsAt?.toISOString() ?? null,
      days_remaining_in_pilot: status.daysRemainingInPilot,
      first_interview: firstInterview,
      recent_interviews: recentInterviews,
      total_interviews: interviewsList.length,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal error";
    console.error("[admin/medjobs/clients/[id]] error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
