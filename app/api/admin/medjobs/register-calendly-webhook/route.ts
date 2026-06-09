/**
 * POST /api/admin/medjobs/register-calendly-webhook
 *
 * One-click "Connect Calendly" — registers our meeting webhook on Dr. DuBose's
 * Calendly org so booked/canceled meetings flow into the Meetings tab. The
 * admin pastes a Calendly personal access token + the webhook secret (the same
 * value set as CALENDLY_WEBHOOK_SECRET on the edge function). The org URI is
 * resolved from the token automatically.
 *
 * Auth: admin-only.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import { calendlyCurrentOrg, calendlyCreateWebhook } from "@/lib/calendly";

export async function POST(request: Request): Promise<Response> {
  const supaUser = await createClient();
  const { data: { user } } = await supaUser.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (!(await isAdmin(user.id))) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    return NextResponse.json({ error: "Server configuration error (Supabase env)" }, { status: 500 });
  }

  let token = "";
  let secret = "";
  try {
    const body = (await request.json()) as { token?: string; secret?: string };
    token = (body.token ?? "").trim();
    secret = (body.secret ?? "").trim();
  } catch {
    // fall through to validation
  }
  if (!token) return NextResponse.json({ error: "Paste your Calendly access token." }, { status: 400 });
  if (!secret) {
    return NextResponse.json(
      { error: "Paste your webhook secret (the same value you set in Supabase)." },
      { status: 400 },
    );
  }

  const org = await calendlyCurrentOrg(token);
  if (!org.ok || !org.data) {
    return NextResponse.json({ error: org.error ?? "Could not read your Calendly organization." }, { status: 400 });
  }

  const url = `${supabaseUrl.replace(/\/+$/, "")}/functions/v1/calendly-webhook`;
  const res = await calendlyCreateWebhook({
    token,
    url,
    orgUri: org.data.orgUri,
    signingKey: secret,
  });
  if (!res.ok) {
    return NextResponse.json({ error: res.error ?? "Calendly rejected the webhook." }, { status: 400 });
  }

  return NextResponse.json({ ok: true, subscription: res.data?.uri ?? null });
}
