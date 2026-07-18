/**
 * Recruitment Partner auth-start route — `/medjobs/partner/start/[token]`.
 *
 * The partner portal link points here (not straight at the portal page) so a
 * click both (a) lands them on the portal AND (b) creates/authenticates a real
 * Supabase account bound to their email + establishes a session — so the
 * partner can return later without the link.
 *
 * Mirrors the provider magic-link route (/medjobs/m) but simpler: partners have
 * no business_profile/board, so we create the auth user + account + bind the
 * outreach row to it, then hand off to the token-gated portal page with a
 * session established.
 *
 * Robustness rule: the portal link must ALWAYS work. Account creation + session
 * are best-effort layered on top — any failure still ends on the portal page
 * (which is token-gated and self-sufficient). Unlike the provider link, the
 * partner token is MULTI-USE (the same token rides every welcome-cadence email),
 * so we never burn a JTI here; createUser/account lookups are idempotent.
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyWelcomeToken } from "@/lib/medjobs/welcome-token";

const STAKEHOLDER_KINDS = ["advisor", "student_org", "dept_head", "professor"];

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token: rawToken } = await params;
  const token = decodeURIComponent(rawToken);
  // Where we always end up: the token-gated portal page (renders Expired on a
  // bad/expired token, the portal on a good one).
  const portalUrl = new URL(`/medjobs/partner/${encodeURIComponent(token)}`, request.url);

  const secret = process.env.MEDJOBS_MAGIC_LINK_SECRET;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  // Misconfigured env → just show the portal page (it surfaces "unavailable").
  if (!secret || !supabaseUrl || !serviceKey) {
    return NextResponse.redirect(portalUrl);
  }

  const verified = verifyWelcomeToken(token, secret);
  if (!verified.ok) {
    // Bad/expired token → portal page renders its Expired state.
    return NextResponse.redirect(portalUrl);
  }
  const { outreach_id, email, jti } = verified.payload;

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Confirm the row is a partner (defense in depth) + load it for binding.
  const { data: rowRaw } = await supabase
    .from("student_outreach")
    .select("id, kind, research_data")
    .eq("id", outreach_id)
    .maybeSingle();
  const row = rowRaw as { id: string; kind: string; research_data: Record<string, unknown> | null } | null;
  if (!row || !STAKEHOLDER_KINDS.includes(row.kind)) {
    return NextResponse.redirect(portalUrl);
  }

  // ── Resolve the Supabase auth user (idempotent) ──────────────────────────
  // createUser mints a new user; "already exists" resolves the id via
  // generateLink (no first-200 listUsers scan).
  let userId: string | undefined;
  const { data: createRes, error: createErr } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
  });
  if (createErr) {
    const { data: idLink } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo: portalUrl.origin },
    });
    userId = idLink?.user?.id;
  } else {
    userId = createRes.user?.id;
  }
  // No user → still land them on the token portal (degraded: no session).
  if (!userId) {
    return NextResponse.redirect(portalUrl);
  }

  // ── Resolve the account row (idempotent) ─────────────────────────────────
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
      const { data: newAcc } = await supabase
        .from("accounts")
        .insert({ user_id: userId, onboarding_completed: true })
        .select("id")
        .single();
      accountId = (newAcc as { id: string } | null)?.id;
    }
  }

  // ── Bind the partner row to the account (JSONB, no migration) ─────────────
  // Lets a session-based return path find the partner's org(s) by account.
  if (accountId) {
    const rd = (row.research_data ?? {}) as Record<string, unknown>;
    const prev = rd.partner_account as { account_id?: string } | undefined;
    if (prev?.account_id !== accountId) {
      await supabase
        .from("student_outreach")
        .update({
          research_data: {
            ...rd,
            partner_account: {
              account_id: accountId,
              user_id: userId,
              email,
              linked_at: new Date().toISOString(),
            },
          },
        })
        .eq("id", outreach_id);
    }
  }

  // ── Audit (multi-use: one note per click is fine; no JTI burn) ───────────
  await supabase.from("student_outreach_touchpoints").insert({
    outreach_id,
    contact_id: null,
    touchpoint_type: "note_added",
    channel: null,
    outcome: null,
    notes: "Partner portal magic-link click — account authenticated.",
    payload: { reason: "partner_portal_visited", jti, user_id: userId, account_id: accountId ?? null, via: "magic_link" },
    created_by: null,
  });

  // ── Establish a session, then land on the portal page ────────────────────
  // `next` keeps the global AuthProvider from hijacking the magic-link sign-in
  // to /portal/inbox (same D-ROUTE guard the provider link uses).
  const redirectTo = new URL(portalUrl.toString());
  redirectTo.searchParams.set("next", portalUrl.pathname);
  const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo: redirectTo.toString() },
  });
  if (linkErr || !linkData?.properties?.action_link) {
    // Session couldn't be minted → still land on the token portal (degraded).
    return NextResponse.redirect(portalUrl);
  }
  // Following the action_link sets the auth cookies, then redirects to the portal.
  return NextResponse.redirect(linkData.properties.action_link);
}

export async function POST() {
  return new NextResponse("Method Not Allowed", { status: 405 });
}
