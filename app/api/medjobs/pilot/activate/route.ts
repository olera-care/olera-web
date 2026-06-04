/**
 * POST /api/medjobs/pilot/activate — Phase 4+5 Bullet 1 (2026-06-04).
 *
 * Self-serve mirror of the admin `make_client` action. Runs the same
 * atomic state transition (set `interview_terms_accepted_at` +
 * `pilot_active_through = now+90d` + `claim_state = "claimed"` +
 * `terms_accepted_via = "self_serve"` + transition outreach to
 * `active_partner` + cancel pending tasks + emit `stage_change`) but
 * via an authenticated user session, not an admin route.
 *
 * Mirrors `handleMakeClient` in
 * `app/api/admin/student-outreach/[id]/route.ts:3122`. Any future change
 * to one MUST be mirrored in the other to keep admin-driven and
 * self-serve paths producing identical state (Q1 lock — master plan
 * § 9.2). Two callers, one outcome.
 *
 * Auth flow:
 *   - Reads the session via the existing server Supabase helper
 *   - 401 if no session
 *   - Resolves the outreach row from either an explicit `outreach_id`
 *     body field OR the user's most recent active outreach
 *   - Service-role mutations via the admin client (same shape as
 *     handleMakeClient — admin operations require service role)
 *
 * Triggered by:
 *   - The welcome banner's "Activate the pilot →" CTA (Phase 4+5 Bullet 4)
 *   - Future Invite-to-interview / Save / See-contact action gates
 *     once those exist
 */

import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  // ── 1. Session check ─────────────────────────────────────────────────
  const supabaseUser = await createServerClient();
  const {
    data: { user },
  } = await supabaseUser.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  let body: { outreach_id?: string } = {};
  try {
    body = (await request.json()) as { outreach_id?: string };
  } catch {
    // No body / non-JSON body is OK — we'll resolve outreach from the session.
  }

  // ── 2. Service-role client for mutations ─────────────────────────────
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 },
    );
  }
  const supabase = createServiceClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // ── 3. Resolve outreach row ──────────────────────────────────────────
  interface OutreachRowShape {
    id: string;
    kind: string | null;
    organization_name: string | null;
    provider_business_profile_id: string | null;
    research_data: Record<string, unknown> | null;
    status: string;
  }
  let outreachRow: OutreachRowShape | null = null;

  if (body.outreach_id) {
    const { data } = await supabase
      .from("student_outreach")
      .select(
        "id, kind, organization_name, provider_business_profile_id, research_data, status",
      )
      .eq("id", body.outreach_id)
      .maybeSingle();
    outreachRow = (data as unknown) as OutreachRowShape | null;
  } else {
    // Resolve via user's account → business_profile → most recent outreach.
    const { data: account } = await supabase
      .from("accounts")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!account) {
      return NextResponse.json(
        { error: "No account context for this user" },
        { status: 404 },
      );
    }
    const accountId = (account as { id: string }).id;
    const { data: bps } = await supabase
      .from("business_profiles")
      .select("id")
      .eq("account_id", accountId);
    const bpIds = ((bps ?? []) as Array<{ id: string }>).map((b) => b.id);
    if (bpIds.length === 0) {
      return NextResponse.json(
        { error: "No linked provider profile" },
        { status: 404 },
      );
    }
    const { data: outreaches } = await supabase
      .from("student_outreach")
      .select(
        "id, kind, organization_name, provider_business_profile_id, research_data, status",
      )
      .in("provider_business_profile_id", bpIds)
      .order("last_edited_at", { ascending: false })
      .limit(1);
    outreachRow = (((outreaches ?? [])[0] ?? null) as unknown) as OutreachRowShape | null;
  }

  if (!outreachRow) {
    return NextResponse.json(
      { error: "No outreach row to activate" },
      { status: 404 },
    );
  }
  if (outreachRow.kind !== "provider") {
    return NextResponse.json(
      { error: "Pilot activation only valid for provider outreach rows" },
      { status: 400 },
    );
  }
  if (outreachRow.status === "active_partner") {
    return NextResponse.json(
      { error: "Already activated", outreach_id: outreachRow.id },
      { status: 409 },
    );
  }

  // ── 4. Atomic state transition (mirrors handleMakeClient) ────────────
  const nowIso = new Date().toISOString();
  const pilotActiveThroughIso = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 90);
    return d.toISOString();
  })();
  let businessProfileId = outreachRow.provider_business_profile_id;

  // Path A — no business_profile yet: create one from the olera-providers row.
  if (!businessProfileId) {
    const oleraProviderId = (
      outreachRow.research_data as { olera_provider_id?: string } | null
    )?.olera_provider_id;
    if (!oleraProviderId) {
      return NextResponse.json(
        { error: "Outreach missing both business_profile and olera_provider_id" },
        { status: 500 },
      );
    }
    const { data: oleraProvider } = await supabase
      .from("olera-providers")
      .select(
        "provider_id, provider_name, city, state, email, phone, website, slug, address, zipcode",
      )
      .eq("provider_id", oleraProviderId)
      .maybeSingle();
    if (!oleraProvider) {
      return NextResponse.json(
        { error: `olera-providers entry not found: ${oleraProviderId}` },
        { status: 500 },
      );
    }
    const op = oleraProvider as {
      provider_id: string;
      provider_name: string | null;
      city: string | null;
      state: string | null;
      email: string | null;
      phone: string | null;
      website: string | null;
      slug: string | null;
      address: string | null;
      zipcode: string | number | null;
    };
    const { data: newBp, error: createErr } = await supabase
      .from("business_profiles")
      .insert({
        type: "organization",
        display_name: op.provider_name || outreachRow.organization_name,
        city: op.city,
        state: op.state,
        email: op.email,
        phone: op.phone,
        website: op.website,
        slug: op.slug,
        address: op.address,
        zip: op.zipcode != null ? String(op.zipcode) : null,
        metadata: {
          interview_terms_accepted_at: nowIso,
          pilot_active_through: pilotActiveThroughIso,
          terms_accepted_via: "self_serve",
        },
        claim_state: "claimed",
        verification_state: "unverified",
        source_provider_id: oleraProviderId,
        created_at: nowIso,
        updated_at: nowIso,
      })
      .select("id")
      .single();
    if (createErr || !newBp) {
      return NextResponse.json(
        {
          error: `Failed to create business_profiles: ${createErr?.message ?? "unknown"}`,
        },
        { status: 500 },
      );
    }
    businessProfileId = (newBp as { id: string }).id;
    await supabase
      .from("student_outreach")
      .update({ provider_business_profile_id: businessProfileId })
      .eq("id", outreachRow.id);
  } else {
    // Path B — business_profile exists: patch metadata + advance claim_state.
    const { data: bp } = await supabase
      .from("business_profiles")
      .select("metadata, claim_state")
      .eq("id", businessProfileId)
      .maybeSingle();
    if (!bp) {
      return NextResponse.json(
        { error: "Linked business_profile not found" },
        { status: 500 },
      );
    }
    const existingMeta =
      ((bp as { metadata: Record<string, unknown> | null }).metadata as
        | Record<string, unknown>
        | null) ?? {};
    const newMeta = {
      ...existingMeta,
      interview_terms_accepted_at: nowIso,
      pilot_active_through: pilotActiveThroughIso,
      terms_accepted_via: "self_serve",
    };
    const { error: bpErr } = await supabase
      .from("business_profiles")
      .update({
        metadata: newMeta,
        // Axis 2b advances: the pilot signature IS the formal "I represent
        // this org" identification per master plan § P1.E (Q9 lock).
        claim_state: "claimed",
        updated_at: nowIso,
      })
      .eq("id", businessProfileId);
    if (bpErr) {
      return NextResponse.json({ error: bpErr.message }, { status: 500 });
    }
  }

  // ── 5. stage_change touchpoint ───────────────────────────────────────
  await supabase.from("student_outreach_touchpoints").insert({
    outreach_id: outreachRow.id,
    contact_id: null,
    touchpoint_type: "stage_change",
    channel: null,
    outcome: null,
    notes: "Pilot activated (self-serve, magic-link conversion)",
    payload: {
      to: "client",
      via: "self_serve_activation",
      activated_by_user: user.id,
    },
    created_by: null,
  });

  // ── 6. Outreach row → active_partner ─────────────────────────────────
  const { error: srErr } = await supabase
    .from("student_outreach")
    .update({
      status: "active_partner",
      last_edited_by: null, // system / self-serve origin
      last_edited_at: nowIso,
    })
    .eq("id", outreachRow.id);
  if (srErr) {
    return NextResponse.json({ error: srErr.message }, { status: 500 });
  }

  // ── 7. Cancel pending tasks (cadence is moot post-conversion) ────────
  await supabase
    .from("student_outreach_tasks")
    .update({
      status: "cancelled",
      completed_at: nowIso,
      completed_by: null,
    })
    .eq("outreach_id", outreachRow.id)
    .eq("status", "pending");

  return NextResponse.json({
    ok: true,
    outreach_id: outreachRow.id,
    business_profile_id: businessProfileId,
    pilot_active_through: pilotActiveThroughIso,
  });
}

export async function GET() {
  return NextResponse.json(
    { error: "Method Not Allowed" },
    { status: 405 },
  );
}
