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
import { generateUniqueSlug } from "@/lib/slug";
import { resolveCampusUniversity } from "@/lib/medjobs/campus-university-bridge";

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

  // ── 3. JTI ledger check (audit-once, NOT one-shot) ───────────────────
  // The provider welcome link is MULTI-USE on purpose: Smartlead bakes ONE
  // welcome_url per lead and reuses it across the whole cold/activation
  // cadence (3 emails), and a provider may click without finishing the
  // eligibility screener and need to return from a later email. So we no
  // longer block a re-visit — we just avoid writing duplicate audit
  // touchpoints. (Mirrors the partner-portal token's multi-use rationale;
  // the token is still email-bound + 30-day TTL.)
  const { data: existingRedemption } = await supabase
    .from("student_outreach_touchpoints")
    .select("id")
    .eq("outreach_id", outreach_id)
    .eq("touchpoint_type", "note_added")
    .filter("payload->>jti", "eq", jti)
    .limit(1)
    .maybeSingle();
  const alreadyVisited = !!existingRedemption;

  // ── 4. Outreach row + campus context ─────────────────────────────────
  const { data: outreachRowRaw } = await supabase
    .from("student_outreach")
    .select(
      "id, provider_business_profile_id, organization_name, campus_id, " +
        "research_data, campuses:campus_id ( slug )",
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
    research_data: { olera_provider_id?: string } | null;
    campuses: { slug: string | null } | null;
  };
  const campusSlug = outreachRow.campuses?.slug ?? null;
  const oleraProviderId = outreachRow.research_data?.olera_provider_id ?? null;

  // ── 5. Resolve auth.users (deterministic, no pagination) ─────────────
  // createUser mints a new user; on "already exists" we resolve the id via
  // generateLink, which returns the user for an existing email. This avoids
  // the old first-200 listUsers scan that silently failed for established
  // provider accounts (D-IDENT).
  let userId: string | undefined;
  const { data: createRes, error: createErr } = await supabase.auth.admin
    .createUser({ email, email_confirm: true });
  if (createErr) {
    const { data: idLink } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo: requestUrl.origin },
    });
    userId = idLink?.user?.id;
    if (!userId) {
      console.error("[medjobs/m] user resolution failed:", createErr);
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

  // ── 7. Establish the provider identity (authed-but-UNCLAIMED) ────────
  // The magic-link recipient must land as a PROVIDER, not a generic/family
  // user. We resolve (or create) their provider org profile from the directory
  // listing, link it to their account, and make it ACTIVE — but we do NOT
  // claim it (claim_state stays "unclaimed"; the combined Terms acceptance is
  // what claims it + starts the pilot). If the org is already owned by a
  // DIFFERENT account → read-only co-tenancy (decision 3): no link, no create.
  // Canonical key is source_provider_id; provider_business_profile_id is a
  // legacy fallback for non-directory rows.
  let businessProfileId: string | null = null;
  let claimConflict = false;
  if (accountId) {
    let bp: { id: string; account_id: string | null } | null = null;
    if (oleraProviderId) {
      // Fetch-then-filter so a legacy NULL claim_state row is still found.
      const { data } = await supabase
        .from("business_profiles")
        .select("id, account_id, claim_state")
        .eq("source_provider_id", oleraProviderId)
        .order("created_at", { ascending: true });
      bp =
        ((data ?? []) as Array<{
          id: string;
          account_id: string | null;
          claim_state: string | null;
        }>).find((r) => r.claim_state !== "rejected") ?? null;
    }
    if (!bp && outreachRow.provider_business_profile_id) {
      const { data } = await supabase
        .from("business_profiles")
        .select("id, account_id")
        .eq("id", outreachRow.provider_business_profile_id)
        .maybeSingle();
      bp = (data as { id: string; account_id: string | null } | null) ?? null;
    }

    if (bp) {
      const bpAccountId = bp.account_id ?? null;
      if (bpAccountId && bpAccountId !== accountId) {
        // Owned by another account → co-tenancy. Don't link or activate.
        claimConflict = true;
      } else {
        businessProfileId = bp.id;
        // Adopt an unowned profile; never touch claim_state here (a previously
        // claimed profile stays claimed; an unclaimed one stays unclaimed).
        if (!bpAccountId) {
          await supabase
            .from("business_profiles")
            .update({ account_id: accountId })
            .eq("id", bp.id);
        }
      }
    } else if (oleraProviderId) {
      // No profile yet → create one UNCLAIMED from the directory listing so
      // the recipient is a real (if unclaimed) provider account.
      const { data: op } = await supabase
        .from("olera-providers")
        .select("provider_id, provider_name, city, state, email, phone, website, address, zipcode")
        .eq("provider_id", oleraProviderId)
        .maybeSingle();
      if (op) {
        const o = op as {
          provider_name: string | null;
          city: string | null;
          state: string | null;
          email: string | null;
          phone: string | null;
          website: string | null;
          address: string | null;
          zipcode: string | number | null;
        };
        const displayName = o.provider_name || outreachRow.organization_name || "Provider";
        const slug = await generateUniqueSlug(supabase, displayName, o.city || "", o.state || "");
        const { data: newBp } = await supabase
          .from("business_profiles")
          .insert({
            account_id: accountId,
            type: "organization",
            display_name: displayName,
            slug,
            city: o.city,
            state: o.state,
            email: o.email,
            phone: o.phone,
            website: o.website,
            address: o.address,
            zip: o.zipcode != null ? String(o.zipcode) : null,
            source_provider_id: oleraProviderId,
            source: "claimed_from_directory",
            claim_state: "unclaimed",
            verification_state: "unverified",
            is_active: true,
            metadata: {},
          })
          .select("id")
          .single();
        if (newBp) businessProfileId = (newBp as { id: string }).id;
      }
    }

    // Make the provider profile active so the app renders provider (not
    // family) chrome. Only when we resolved/created one without co-tenancy.
    if (businessProfileId && !claimConflict) {
      await supabase
        .from("accounts")
        .update({ active_profile_id: businessProfileId })
        .eq("id", accountId);
    }
  }

  // ── 8. Audit touchpoint(s) — once per link (first visit only) ────────
  if (!alreadyVisited) {
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
  }

  // ── 9. Generate Supabase magiclink for session establishment ─────────
  // Build the final board URL (welcome banner + campus + outreach_id so the
  // Terms modal can activate the right org). We ALSO pass `next` pointing at
  // that same board URL: the global AuthProvider honors `?next=` and would
  // otherwise hard-redirect every magic-link sign-in to /portal/inbox
  // (D-ROUTE). `next` keeps the provider on Hire Caregivers.
  // Resolve the campus → university id so the board lands filtered to the
  // provider's university (the dropdown default; persisted in their session).
  let universityId: string | null = null;
  if (campusSlug) {
    try {
      const resolved = await resolveCampusUniversity(supabase, campusSlug);
      universityId = resolved.university_id;
    } catch (e) {
      console.error("[medjobs/m] campus→university resolve failed:", e);
    }
  }

  const boardParams = new URLSearchParams();
  boardParams.set("welcome", "1");
  if (campusSlug) boardParams.set("campus", campusSlug);
  if (universityId) boardParams.set("university", universityId);
  boardParams.set("outreach_id", outreach_id);
  if (claimConflict) boardParams.set("claim_conflict", "1");
  // Activation-cadence links append ?a=1 to the magic-link URL → carry it
  // through to the board as ?activate=1 so Terms auto-opens on arrival.
  if (
    requestUrl.searchParams.get("a") === "1" ||
    requestUrl.searchParams.get("activate") === "1"
  ) {
    boardParams.set("activate", "1");
  }
  const boardPath = `/medjobs/candidates?${boardParams.toString()}`;

  const welcomeUrl = new URL("/medjobs/candidates", request.url);
  for (const [k, v] of boardParams) welcomeUrl.searchParams.set(k, v);
  welcomeUrl.searchParams.set("next", boardPath);

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
