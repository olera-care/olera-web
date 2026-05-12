import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { getProvidersInCatchment } from "@/lib/medjobs/catchment";
import { getClientStatus } from "@/lib/medjobs/clients";

/**
 * POST /api/admin/medjobs/provider-prospects/materialize
 *
 * Body: { provider_id: string, campus_id: string }
 *
 * Materializes a virtual provider prospect into a real student_outreach
 * row with kind='provider'. Validates that the provider is genuinely in
 * the campus's catchment, isn't already a client, and isn't already
 * materialized for this campus.
 *
 * Returns the new student_outreach row id so the caller can open the
 * drawer for it.
 *
 * Requires migration 073 (relaxes stakeholder_type to allow NULL when
 * kind='provider').
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const adminUser = await getAdminUser(user.id);
    if (!adminUser) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const body = (await request.json()) as { provider_id?: string; campus_id?: string };
    const providerId = body.provider_id?.trim();
    const campusId = body.campus_id?.trim();

    if (!providerId || !campusId) {
      return NextResponse.json(
        { error: "provider_id and campus_id required" },
        { status: 400 },
      );
    }

    const db = getServiceClient();

    // Resolve campus (need slug for catchment + name for organization_name fallback).
    const { data: campus, error: campusErr } = await db
      .from("student_outreach_campuses")
      .select("id, slug, name")
      .eq("id", campusId)
      .eq("is_active", true)
      .maybeSingle();

    if (campusErr || !campus) {
      return NextResponse.json(
        { error: campusErr?.message ?? "Campus not found or inactive" },
        { status: 404 },
      );
    }

    // Verify provider exists + is a provider type. Pull email + phone
    // too — v9 mirrors them into student_outreach_contacts so the
    // unified cadence path (schedule_sequence + executeEmailTask) finds
    // a recipient without a provider-specific code branch.
    const { data: provider, error: providerErr } = await db
      .from("business_profiles")
      .select("id, display_name, city, state, metadata, type, email, phone")
      .eq("id", providerId)
      .in("type", ["organization", "caregiver"])
      .maybeSingle();

    if (providerErr || !provider) {
      return NextResponse.json(
        { error: providerErr?.message ?? "Provider not found" },
        { status: 404 },
      );
    }

    // Verify provider is NOT already a client.
    const status = getClientStatus(provider.metadata);
    if (status.isClient) {
      return NextResponse.json(
        { error: "Provider is already a client. Materialization is for prospects only." },
        { status: 400 },
      );
    }

    // Verify provider is genuinely in the campus's catchment (defense
    // against caller passing arbitrary provider × campus pairs).
    const inCatchment = await getProvidersInCatchment(campus.slug);
    const isInCatchment = inCatchment.some((p) => p.id === provider.id);
    if (!isInCatchment) {
      return NextResponse.json(
        { error: "Provider is not in this campus's catchment" },
        { status: 400 },
      );
    }

    // Verify uniqueness — no existing student_outreach row for this
    // provider × campus pair. This protects against double-clicks and
    // stale UI state.
    const { data: existing } = await db
      .from("student_outreach")
      .select("id")
      .eq("kind", "provider")
      .eq("provider_business_profile_id", provider.id)
      .eq("campus_id", campus.id)
      .maybeSingle();

    if (existing) {
      // Idempotent: return the existing row id rather than erroring.
      return NextResponse.json({ id: existing.id, already_materialized: true });
    }

    const orgName = provider.display_name || "(unnamed provider)";

    const { data: inserted, error: insertErr } = await db
      .from("student_outreach")
      .insert({
        campus_id: campus.id,
        kind: "provider",
        // stakeholder_type is NULL for kind='provider' (per migration 073).
        stakeholder_type: null,
        provider_business_profile_id: provider.id,
        organization_name: orgName,
        status: "researched",
        programs: [],
        research_data: {},
        cadence_day: 0,
        contact_permission: "not_yet",
      })
      .select("id")
      .single();

    if (insertErr || !inserted) {
      const msg = insertErr?.message ?? "Insert failed";
      console.error("[materialize] insert error:", msg);
      // The most likely cause if migration 073 hasn't run yet is a
      // CHECK violation on stakeholder_type. Surface a clear message.
      const hint = msg.toLowerCase().includes("stakeholder_type")
        ? " — run migration 073_student_outreach_provider_kind.sql in Supabase."
        : "";
      return NextResponse.json({ error: `${msg}${hint}` }, { status: 500 });
    }

    // v9 (final architecture): no auto-mirroring. The provider's
    // directory email + phone live as the "General Contact" on the
    // outreach row itself (effective = business_profiles fields with
    // research_data.general_contact overrides on top). Specific
    // Contacts (student_outreach_contacts) are reserved for NAMED
    // individuals admin discovers — owner, hiring manager, etc.
    // Mixing the two systems was confusing operationally; keeping
    // them separate is the explicit user requirement.

    return NextResponse.json({ id: inserted.id, already_materialized: false });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal error";
    console.error("[materialize] error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
