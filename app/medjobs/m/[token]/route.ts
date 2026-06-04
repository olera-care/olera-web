/**
 * Magic-link landing route — `/medjobs/m/[token]`. Phase 2+3 Bullet 3
 * (2026-06-04).
 *
 * Decodes the cold-provider outreach token, resolves auth identity (axis 1)
 * and account-to-profile linkage (axis 2a), emits the audit touchpoint
 * (Bullet 7), handles co-tenancy (Bullet 4), and redirects through the
 * Supabase admin magic-link to land the provider authenticated on the
 * candidate board in preview mode (which the board will gain in Bullet 8).
 *
 * ┌─ Flow ─────────────────────────────────────────────────────────────────┐
 * │ 1. Decode token. Bad/expired → redirect to /medjobs/m/expired          │
 * │ 2. JTI check (one-shot redemption via note_added touchpoint ledger).   │
 * │    Already used → /medjobs/m/used                                      │
 * │ 3. Resolve auth user (createUser if new, lookup if existing).          │
 * │ 4. Resolve account row (insert if new — accounts.user_id = auth user). │
 * │ 5. Resolve business_profile linkage (axis 2a only):                    │
 * │    - Outreach already links to a BP                                    │
 * │      - BP.account_id NULL → UPDATE with this account (axis 2a)         │
 * │      - BP.account_id matches → no-op                                   │
 * │      - BP.account_id mismatches → co-tenancy edge (Bullet 4)           │
 * │    - Outreach has no BP yet → defer BP creation to Phase 4+5           │
 * │      (the provider can still browse + accept terms; BP gets created    │
 * │       at terms-accept time)                                            │
 * │ 6. Emit audit: note_added(reason: "platform_visited", jti, user_id).   │
 * │ 7. If co-tenancy: also emit note_added(reason: "claim_conflict").      │
 * │ 8. Generate Supabase admin magiclink with redirectTo = welcome URL.    │
 * │ 9. Redirect to that admin URL — Supabase sets the session + redirects  │
 * │    to the welcome URL with `?welcome=1[&campus=...][&claim_conflict=1]`│
 * └────────────────────────────────────────────────────────────────────────┘
 *
 * Why a server Route Handler (not a client page): the JTI redemption check
 * + the account/profile mutations + the magiclink generation all need the
 * service role. A client page would have to round-trip through a server
 * action for each of these. A single GET handler is cleaner.
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyWelcomeToken } from "@/lib/medjobs/welcome-token";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token: rawToken } = await params;
  const token = decodeURIComponent(rawToken);
  const requestUrl = new URL(request.url);

  // ── 1. Token decode + verification ────────────────────────────────────
  const secret = process.env.MEDJOBS_MAGIC_LINK_SECRET;
  if (!secret) {
    console.error("[medjobs/m] MEDJOBS_MAGIC_LINK_SECRET not configured");
    return NextResponse.redirect(
      new URL("/medjobs/m/expired?reason=config", request.url),
    );
  }
  const verifyResult = verifyWelcomeToken(token, secret);
  if (!verifyResult.ok) {
    const reason = verifyResult.reason === "expired" ? "expired" : "invalid";
    return NextResponse.redirect(
      new URL(`/medjobs/m/expired?reason=${reason}`, request.url),
    );
  }
  const { outreach_id, email, jti } = verifyResult.payload;

  // ── 2. Service-role client ────────────────────────────────────────────
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.error("[medjobs/m] Supabase env not configured");
    return NextResponse.redirect(
      new URL("/medjobs/m/expired?reason=config", request.url),
    );
  }
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // ── 3. JTI ledger check (one-shot redemption) ────────────────────────
  const { data: existingRedemption } = await supabase
    .from("student_outreach_touchpoints")
    .select("id")
    .eq("outreach_id", outreach_id)
    .eq("touchpoint_type", "note_added")
    .filter("payload->>jti", "eq", jti)
    .limit(1)
    .maybeSingle();
  if (existingRedemption) {
    const usedUrl = new URL("/medjobs/m/used", request.url);
    usedUrl.searchParams.set("email", email);
    return NextResponse.redirect(usedUrl);
  }

  // ── 4. Outreach row + campus context ─────────────────────────────────
  const { data: outreachRowRaw } = await supabase
    .from("student_outreach")
    .select(
      "id, provider_business_profile_id, organization_name, campus_id, " +
        "campuses:campus_id ( slug )",
    )
    .eq("id", outreach_id)
    .maybeSingle();
  if (!outreachRowRaw) {
    return NextResponse.redirect(
      new URL("/medjobs/m/expired?reason=missing", request.url),
    );
  }
  const outreachRow = outreachRowRaw as unknown as {
    id: string;
    provider_business_profile_id: string | null;
    organization_name: string | null;
    campus_id: string | null;
    campuses: { slug: string | null } | null;
  };
  const campusSlug = outreachRow.campuses?.slug ?? null;

  // ── 5. Resolve auth.users ────────────────────────────────────────────
  let userId: string | undefined;
  const { data: createRes, error: createErr } = await supabase.auth.admin
    .createUser({ email, email_confirm: true });
  if (createErr) {
    const msg = createErr.message ?? "";
    if (
      msg.includes("already") ||
      msg.includes("registered") ||
      msg.includes("exists")
    ) {
      // Existing user — look up by email via the admin list. Page through
      // until we find the match. listUsers is paginated; for the cold-
      // provider flow we expect this to land in the first page.
      const { data: list } = await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 200,
      });
      const found = list?.users.find(
        (u) => u.email?.toLowerCase() === email.toLowerCase(),
      );
      userId = found?.id;
    } else {
      console.error("[medjobs/m] createUser failed:", createErr);
    }
  } else {
    userId = createRes.user?.id;
  }
  if (!userId) {
    return NextResponse.redirect(
      new URL("/medjobs/m/expired?reason=user", request.url),
    );
  }

  // ── 6. Resolve account row ───────────────────────────────────────────
  let accountId: string | undefined;
  {
    const { data: existing } = await supabase
      .from("accounts")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    if (existing) {
      accountId = existing.id as string;
    } else {
      const { data: newAcc, error: accErr } = await supabase
        .from("accounts")
        .insert({ user_id: userId, onboarding_completed: true })
        .select("id")
        .single();
      if (accErr || !newAcc) {
        console.error("[medjobs/m] account insert failed:", accErr);
        // Continue — account is convenient but not strictly required for
        // the audit touchpoint + redirect.
      } else {
        accountId = newAcc.id as string;
      }
    }
  }

  // ── 7. Resolve business_profile linkage (axis 2a only) ──────────────
  // Magic-link click does NOT set claim_state = "claimed" (axis 2b stays
  // unclaimed). Only the Phase 4+5 terms-acceptance flow advances 2b.
  let businessProfileId: string | null = null;
  let claimConflict = false;
  if (outreachRow.provider_business_profile_id) {
    const { data: bp } = await supabase
      .from("business_profiles")
      .select("id, account_id")
      .eq("id", outreachRow.provider_business_profile_id)
      .maybeSingle();
    if (bp) {
      businessProfileId = bp.id as string;
      const bpAccountId = (bp.account_id as string | null) ?? null;
      if (bpAccountId == null && accountId) {
        // Axis 2a advance: link this account. Leave claim_state alone.
        await supabase
          .from("business_profiles")
          .update({ account_id: accountId })
          .eq("id", bp.id);
      } else if (bpAccountId != null && accountId && bpAccountId !== accountId) {
        // Bullet 4: co-tenancy — DO NOT mutate account_id. Sign in
        // anyway so the user can browse, but flag the conflict.
        claimConflict = true;
      }
      // else: already linked to this account, no-op.
    }
  }
  // Outreach with no BP yet (cold provider, BP not yet created) — defer
  // BP creation to Phase 4+5 terms-acceptance. Provider still signs in
  // and can browse the board.

  // ── 8. Audit touchpoint(s) ───────────────────────────────────────────
  await supabase.from("student_outreach_touchpoints").insert({
    outreach_id,
    contact_id: null,
    touchpoint_type: "note_added",
    channel: null,
    outcome: null,
    notes: "Magic-link click — provider visited the candidate board.",
    payload: {
      reason: "platform_visited",
      jti,
      user_id: userId,
      business_profile_id: businessProfileId,
      account_id: accountId ?? null,
      via: "magic_link",
    },
    created_by: null,
  });
  if (claimConflict) {
    await supabase.from("student_outreach_touchpoints").insert({
      outreach_id,
      contact_id: null,
      touchpoint_type: "note_added",
      channel: null,
      outcome: null,
      notes:
        "Magic-link click on org already linked to another account. Read-only co-tenancy until reconciled.",
      payload: {
        reason: "claim_conflict",
        jti,
        user_id: userId,
        business_profile_id: businessProfileId,
        attempted_account_id: accountId ?? null,
      },
      created_by: null,
    });
  }

  // ── 9. Generate Supabase magiclink for session establishment ─────────
  const welcomeUrl = new URL("/medjobs/candidates", request.url);
  welcomeUrl.searchParams.set("welcome", "1");
  if (campusSlug) welcomeUrl.searchParams.set("campus", campusSlug);
  if (claimConflict) welcomeUrl.searchParams.set("claim_conflict", "1");

  const { data: linkData, error: linkErr } = await supabase.auth.admin
    .generateLink({
      type: "magiclink",
      email,
      options: { redirectTo: welcomeUrl.toString() },
    });
  if (linkErr || !linkData?.properties?.action_link) {
    console.error("[medjobs/m] generateLink failed:", linkErr);
    return NextResponse.redirect(
      new URL("/medjobs/m/expired?reason=link", request.url),
    );
  }

  // Final redirect — Supabase sets the auth cookies + redirects to the
  // welcome URL with the session established.
  return NextResponse.redirect(linkData.properties.action_link);
}

// Defensive: log any other method as 405. Prevents accidental POSTs from
// retry-prone Calendly-style webhooks from hitting this URL.
export async function POST() {
  return new NextResponse("Method Not Allowed", { status: 405 });
}
