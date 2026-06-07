import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getServiceDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

/**
 * Family (care-seeker) unsubscribe.
 *
 * Mirrors /api/providers/unsubscribe but keyed by the family profile id (the
 * business_profiles row, type=family) rather than a slug. Care-seekers arrive
 * as guests with no login, so the unsubscribe affordance in their emails has to
 * work without an authenticated session — hence the unguessable profile UUID in
 * the link instead of a settings page behind auth.
 *
 * Scope: this only sets `nudges_unsubscribed`, which the family nudge crons
 * (family-nudges, lead-family-nudge) check before sending lifecycle/marketing
 * drip emails. It deliberately does NOT touch `notification_prefs` — a family
 * mid-conversation with a provider should keep getting their actual message and
 * match notifications. Those are governed separately in /account/settings.
 *
 * POST /api/families/unsubscribe   body: { id: string, unsubscribe?: boolean }
 * GET  /api/families/unsubscribe?id=xxx   -> { unsubscribed: boolean }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const id: string | undefined = body.id;
    const shouldUnsubscribe = body.unsubscribe !== false; // default: opt out

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const db = getServiceDb();
    if (!db) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const { data: profile } = await db
      .from("business_profiles")
      .select("id, metadata")
      .eq("id", id)
      .eq("type", "family")
      .maybeSingle();

    if (!profile) {
      // Unknown / non-family id. Treat as a no-op success so the confirmation
      // page renders normally and we don't leak which ids exist.
      return NextResponse.json({ success: true, unsubscribed: shouldUnsubscribe, noop: "not_found" });
    }

    const meta = (profile.metadata as Record<string, unknown>) || {};
    if (shouldUnsubscribe) {
      meta.nudges_unsubscribed = true;
      meta.nudges_unsubscribed_at = new Date().toISOString();
      meta.nudges_unsubscribed_source = "email_link";
    } else {
      delete meta.nudges_unsubscribed;
      delete meta.nudges_unsubscribed_at;
      delete meta.nudges_unsubscribed_source;
    }

    const { error: updErr } = await db
      .from("business_profiles")
      .update({ metadata: meta })
      .eq("id", profile.id);

    if (updErr) {
      console.error("Family unsubscribe update failed:", updErr);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    return NextResponse.json({ success: true, unsubscribed: shouldUnsubscribe });
  } catch (err) {
    console.error("Family unsubscribe error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const db = getServiceDb();
    if (!db) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const { data: profile } = await db
      .from("business_profiles")
      .select("metadata")
      .eq("id", id)
      .eq("type", "family")
      .maybeSingle();

    const meta = (profile?.metadata as Record<string, unknown>) || {};
    return NextResponse.json({ unsubscribed: !!meta.nudges_unsubscribed });
  } catch (err) {
    console.error("Family unsubscribe check error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
