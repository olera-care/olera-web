import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getServiceDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

type UnsubscribeType = "leads" | "analytics_digest";

function flagForType(type: UnsubscribeType): { flag: string; at: string } {
  if (type === "analytics_digest") {
    return { flag: "analytics_digest_unsubscribed", at: "analytics_digest_unsubscribed_at" };
  }
  return { flag: "leads_unsubscribed", at: "leads_unsubscribed_at" };
}

/**
 * POST /api/providers/unsubscribe
 *
 * Opt a provider out of a specific email channel.
 * Body: { slug: string, type?: "leads" | "analytics_digest", unsubscribe?: boolean }
 *
 * Default type is "leads" (existing behavior, backward-compatible).
 * Default action is opt-out; pass unsubscribe=false to opt back in.
 *
 * GET /api/providers/unsubscribe?slug=xxx&type=leads
 *
 * Check unsubscribe status for a specific channel.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { slug } = body;
    const type: UnsubscribeType = body.type === "analytics_digest" ? "analytics_digest" : "leads";
    const { flag, at } = flagForType(type);

    if (!slug) {
      return NextResponse.json({ error: "slug is required" }, { status: 400 });
    }

    const db = getServiceDb();
    if (!db) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    // Find the provider by slug in business_profiles
    const { data: profile } = await db
      .from("business_profiles")
      .select("id, metadata")
      .eq("slug", slug)
      .in("type", ["organization", "caregiver"])
      .maybeSingle();

    if (!profile) {
      // Unclaimed provider path. olera-providers has no metadata column, so
      // the per-provider opt-out is stored in the sibling provider_unsubscribes
      // table (migration 084), keyed by lowercased email + channel. The digest
      // pre-fetches that set and treats it the same way as the metadata flag
      // on claimed providers.
      const { data: iosProvider } = await db
        .from("olera-providers")
        .select("provider_id, slug, email")
        .eq("slug", slug)
        .maybeSingle();

      if (!iosProvider) {
        return NextResponse.json({ error: "Provider not found" }, { status: 404 });
      }

      if (!iosProvider.email) {
        // No email on file = nothing to opt out. Treat as a no-op success so
        // the user-facing confirmation page still renders normally.
        return NextResponse.json({ success: true, unsubscribed: true, type, noop: "no_email_on_file" });
      }

      const emailKey = iosProvider.email.toLowerCase();
      const shouldUnsubscribe = body.unsubscribe !== false;

      if (shouldUnsubscribe) {
        const { error: upsertErr } = await db
          .from("provider_unsubscribes")
          .upsert(
            {
              email: emailKey,
              channel: type,
              unsubscribed_at: new Date().toISOString(),
              source_slug: iosProvider.slug ?? slug,
              source_provider_id: iosProvider.provider_id,
            },
            { onConflict: "email,channel" },
          );
        if (upsertErr) {
          console.error("Unsubscribe upsert failed:", upsertErr);
          return NextResponse.json({ error: "Internal server error" }, { status: 500 });
        }
      } else {
        const { error: deleteErr } = await db
          .from("provider_unsubscribes")
          .delete()
          .eq("email", emailKey)
          .eq("channel", type);
        if (deleteErr) {
          console.error("Resubscribe delete failed:", deleteErr);
          return NextResponse.json({ error: "Internal server error" }, { status: 500 });
        }
      }

      return NextResponse.json({ success: true, unsubscribed: shouldUnsubscribe, type });
    }

    // Update business_profiles metadata
    const meta = (profile.metadata as Record<string, unknown>) || {};
    const shouldUnsubscribe = body.unsubscribe !== false; // default true for backwards compat
    if (shouldUnsubscribe) {
      meta[flag] = true;
      meta[at] = new Date().toISOString();
    } else {
      delete meta[flag];
      delete meta[at];
    }

    await db
      .from("business_profiles")
      .update({ metadata: meta })
      .eq("id", profile.id);

    return NextResponse.json({ success: true, unsubscribed: shouldUnsubscribe, type });
  } catch (err) {
    console.error("Unsubscribe error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    const typeParam = searchParams.get("type");
    const type: UnsubscribeType = typeParam === "analytics_digest" ? "analytics_digest" : "leads";
    const { flag } = flagForType(type);

    if (!slug) {
      return NextResponse.json({ error: "slug is required" }, { status: 400 });
    }

    const db = getServiceDb();
    if (!db) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const { data: profile } = await db
      .from("business_profiles")
      .select("metadata")
      .eq("slug", slug)
      .in("type", ["organization", "caregiver"])
      .maybeSingle();

    if (profile) {
      const meta = (profile.metadata as Record<string, unknown>) || {};
      return NextResponse.json({ unsubscribed: !!meta[flag], type });
    }

    // No business_profiles row — fall through to the email-keyed
    // provider_unsubscribes table via olera-providers, mirroring POST.
    const { data: iosProvider } = await db
      .from("olera-providers")
      .select("email")
      .eq("slug", slug)
      .maybeSingle();

    if (!iosProvider?.email) {
      return NextResponse.json({ unsubscribed: false, type });
    }

    const { data: unsubRow } = await db
      .from("provider_unsubscribes")
      .select("email")
      .eq("email", iosProvider.email.toLowerCase())
      .eq("channel", type)
      .maybeSingle();

    return NextResponse.json({ unsubscribed: !!unsubRow, type });
  } catch (err) {
    console.error("Unsubscribe check error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
