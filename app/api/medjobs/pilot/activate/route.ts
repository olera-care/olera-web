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
import { resolveOrClaimProviderProfile } from "@/lib/medjobs/claim-provider-profile";

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

  // ── 2.5. Resolve (or create) the user's account ──────────────────────
  // The org owns the profile; this account is the owner. Magic-link sign-in
  // already creates the account, but we create-if-missing for robustness
  // (returning providers, direct visits).
  let accountId: string;
  {
    const { data: account } = await supabase
      .from("accounts")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (account) {
      accountId = (account as { id: string }).id;
    } else {
      const { data: newAcc, error: accErr } = await supabase
        .from("accounts")
        .insert({ user_id: user.id, onboarding_completed: true })
        .select("id")
        .single();
      if (accErr || !newAcc) {
        return NextResponse.json(
          { error: "Could not resolve account" },
          { status: 500 },
        );
      }
      accountId = (newAcc as { id: string }).id;
    }
  }

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
    // No explicit outreach_id (returning provider): resolve via the user's
    // already-claimed business_profile → most recent outreach. Cold providers
    // always arrive WITH an outreach_id (threaded from the magic link), so
    // this branch only serves returning/linked providers.
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

  // ── 4. Combined claim + trial (decision 2) ───────────────────────────
  // ONE act: claim the directory page AND enter the hiring pilot. The
  // shared primitive owns the dedup-by-source_provider_id + account_id +
  // unique-slug invariants (mirrors the directory claim; never duplicates).
  const nowIso = new Date().toISOString();
  const pilotActiveThroughIso = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 90);
    return d.toISOString();
  })();
  const pilotMetadata = {
    interview_terms_accepted_at: nowIso,
    pilot_active_through: pilotActiveThroughIso,
    terms_accepted_via: "self_serve",
  };

  const oleraProviderId = (
    outreachRow.research_data as { olera_provider_id?: string } | null
  )?.olera_provider_id;
  let businessProfileId = outreachRow.provider_business_profile_id;

  if (oleraProviderId) {
    // Directory-sourced provider (the cold path): resolve-or-claim by
    // source_provider_id. This also adopts an unowned row left by an admin
    // make_client, and reuses an existing same-account claim (idempotent).
    let result;
    try {
      result = await resolveOrClaimProviderProfile(supabase, {
        oleraProviderId,
        accountId,
        pilotMetadata,
        fallbackName: outreachRow.organization_name,
      });
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Claim failed" },
        { status: 500 },
      );
    }
    if (result.conflict) {
      // Co-tenancy (decision 3): org already owned by another account.
      // Never duplicate, never transfer — surface for reconciliation.
      await supabase.from("student_outreach_touchpoints").insert({
        outreach_id: outreachRow.id,
        contact_id: null,
        touchpoint_type: "note_added",
        channel: null,
        outcome: null,
        notes:
          "Pilot activation blocked — org already linked to another account (co-tenancy).",
        payload: {
          reason: "claim_conflict",
          existing_business_profile_id: result.business_profile_id,
          attempted_account_id: accountId,
          attempted_by_user: user.id,
        },
        created_by: null,
      });
      return NextResponse.json(
        {
          error:
            "This organization is already linked to another team member's account. Email logan@olera.care to be added to the existing team.",
          code: "CLAIM_CONFLICT",
        },
        { status: 409 },
      );
    }
    businessProfileId = result.business_profile_id;
  } else if (businessProfileId) {
    // Non-directory provider (already had a business_profile not sourced
    // from olera-providers): patch metadata + claim directly.
    const { data: bp } = await supabase
      .from("business_profiles")
      .select("metadata, account_id")
      .eq("id", businessProfileId)
      .maybeSingle();
    if (!bp) {
      return NextResponse.json(
        { error: "Linked business_profile not found" },
        { status: 500 },
      );
    }
    const bpAccountId = (bp as { account_id: string | null }).account_id ?? null;
    if (bpAccountId && bpAccountId !== accountId) {
      return NextResponse.json(
        {
          error:
            "This organization is already linked to another team member's account. Email logan@olera.care to be added to the existing team.",
          code: "CLAIM_CONFLICT",
        },
        { status: 409 },
      );
    }
    const existingMeta =
      ((bp as { metadata: Record<string, unknown> | null }).metadata) ?? {};
    const { error: bpErr } = await supabase
      .from("business_profiles")
      .update({
        metadata: { ...existingMeta, ...pilotMetadata },
        claim_state: "claimed",
        ...(bpAccountId ? {} : { account_id: accountId }),
        updated_at: nowIso,
      })
      .eq("id", businessProfileId);
    if (bpErr) {
      return NextResponse.json({ error: bpErr.message }, { status: 500 });
    }
  } else {
    return NextResponse.json(
      { error: "Outreach missing both business_profile and olera_provider_id" },
      { status: 500 },
    );
  }

  // Link the outreach row to the resolved profile.
  await supabase
    .from("student_outreach")
    .update({ provider_business_profile_id: businessProfileId })
    .eq("id", outreachRow.id);

  // ── 4b. Make the claim usable (mirror directory claim side-effects) ──
  // Free membership + active profile so the claimed org appears in the
  // provider portal. Best-effort: the canonical claim is already persisted.
  if (businessProfileId) {
    const { data: existingMembership } = await supabase
      .from("memberships")
      .select("id")
      .eq("account_id", accountId)
      .limit(1);
    if (!existingMembership || existingMembership.length === 0) {
      await supabase
        .from("memberships")
        .insert({ account_id: accountId, plan: "free", status: "free" });
    }
    await supabase
      .from("accounts")
      .update({ onboarding_completed: true, active_profile_id: businessProfileId })
      .eq("id", accountId);
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
