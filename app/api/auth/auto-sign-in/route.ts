import { NextResponse } from "next/server";
import { after } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  scoreClaimTrust,
  extractDomainFromWebsite,
} from "@/lib/claim-trust";
import { sendSlackAlert, slackSuspiciousClaim } from "@/lib/slack";

export const maxDuration = 30;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * POST /api/auth/auto-sign-in
 *
 * Creates or resolves an auth user for an already-verified email and returns
 * a magic-link token hash for client-side session establishment.
 *
 * Used by the provider onboarding flow after OTP verification so the provider
 * doesn't have to sign in a second time through the auth modal.
 *
 * Request body: { email: string, claimSession: string }
 * Returns: { tokenHash: string } or error
 */
export async function POST(request: Request) {
  try {
    const { email, claimSession } = await request.json();

    if (!email || !claimSession) {
      return NextResponse.json(
        { error: "Email and claim session are required" },
        { status: 400 }
      );
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(url, serviceKey);
    const normalizedEmail = email.trim().toLowerCase();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://olera.care";

    // Try to create the user first (no-op if already exists)
    let userId: string | undefined;
    const { data: newUser, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email: normalizedEmail,
        email_confirm: true,
      });

    if (createError) {
      if (
        createError.message?.includes("already been registered") ||
        createError.message?.includes("already exists")
      ) {
        // User exists — resolve via generateLink
        const { data: linkData } =
          await supabaseAdmin.auth.admin.generateLink({
            type: "magiclink",
            email: normalizedEmail,
            options: { redirectTo: `${siteUrl}/provider` },
          });
        userId = linkData?.user?.id;
      } else {
        console.error("Auto-sign-in: createUser failed:", createError.message);
        return NextResponse.json(
          { error: "Failed to create account" },
          { status: 500 }
        );
      }
    } else {
      userId = newUser?.user?.id;
    }

    if (!userId) {
      return NextResponse.json(
        { error: "Could not resolve user" },
        { status: 500 }
      );
    }

    // Generate a magic link token for client-side session establishment
    const { data: signInLink, error: linkError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email: normalizedEmail,
        options: { redirectTo: `${siteUrl}/provider` },
      });

    if (linkError || !signInLink?.properties?.hashed_token) {
      console.error("Auto-sign-in: generateLink failed:", linkError?.message);
      return NextResponse.json(
        { error: "Failed to generate sign-in token" },
        { status: 500 }
      );
    }

    // Score this sign-in for trust + flag if suspicious.
    // Runs post-response via `after()` so sign-in latency is unaffected.
    after(async () => {
      try {
        await flagSuspiciousAutoSignIn({
          db: supabaseAdmin,
          email: normalizedEmail,
          claimSession,
        });
      } catch (err) {
        console.error("[auto-sign-in] trust flag failed:", err);
      }
    });

    return NextResponse.json({
      tokenHash: signInLink.properties.hashed_token,
      userId,
    });
  } catch (err) {
    console.error("Auto-sign-in error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Score the email↔provider match for this one-click sign-in. If low-trust,
 * write a provider_activity row and send a Slack alert (deduped per
 * provider+email per 24h so repeated sign-ins don't spam).
 */
async function flagSuspiciousAutoSignIn(params: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any;
  email: string;
  claimSession: string;
}) {
  const { db, email, claimSession } = params;

  if (!UUID_RE.test(claimSession)) return;

  const { data: verif } = await db
    .from("claim_verification_codes")
    .select("provider_id")
    .eq("claim_session", claimSession)
    .limit(1)
    .maybeSingle();

  const providerId: string | undefined = verif?.provider_id;
  if (!providerId) return;

  // Resolve provider context — prefer business_profiles, fall back to olera-providers.
  let providerName: string | null = null;
  let providerCity: string | null = null;
  let providerState: string | null = null;
  let providerWebsite: string | null = null;
  let providerSlug: string = providerId;
  let profileId: string | null = null;

  let bp = await db
    .from("business_profiles")
    .select("id, slug, display_name, city, state, website")
    .eq("source_provider_id", providerId)
    .maybeSingle()
    .then(
      (r: {
        data: {
          id: string;
          slug: string;
          display_name: string | null;
          city: string | null;
          state: string | null;
          website: string | null;
        } | null;
      }) => r.data
    );

  if (!bp && UUID_RE.test(providerId)) {
    bp = await db
      .from("business_profiles")
      .select("id, slug, display_name, city, state, website")
      .eq("id", providerId)
      .in("type", ["organization", "caregiver"])
      .maybeSingle()
      .then(
        (r: {
          data: {
            id: string;
            slug: string;
            display_name: string | null;
            city: string | null;
            state: string | null;
            website: string | null;
          } | null;
        }) => r.data
      );
  }

  if (bp) {
    providerName = bp.display_name;
    providerCity = bp.city;
    providerState = bp.state;
    providerWebsite = bp.website;
    providerSlug = bp.slug;
    profileId = bp.id;
  } else {
    const { data: op } = await db
      .from("olera-providers")
      .select("provider_name, city, state, website, slug")
      .eq("provider_id", providerId)
      .maybeSingle();
    if (!op) return;
    providerName = op.provider_name;
    providerCity = op.city;
    providerState = op.state;
    providerWebsite = op.website;
    providerSlug = op.slug || providerId;
  }

  if (!providerName) return;

  const result = await scoreClaimTrust({
    email,
    providerName,
    providerCity,
    providerState,
    providerDomain: extractDomainFromWebsite(providerWebsite),
  });

  if (result.level !== "low") return;

  // Dedup: skip if we already flagged this provider+email in the last 24h.
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: existing } = await db
    .from("provider_activity")
    .select("id")
    .eq("provider_id", providerSlug)
    .eq("event_type", "suspicious_claim")
    .gte("created_at", oneDayAgo)
    .contains("metadata", { claimed_by_email: email })
    .limit(1)
    .maybeSingle();

  if (existing) return;

  const { error: insertErr } = await db.from("provider_activity").insert({
    provider_id: providerSlug,
    profile_id: profileId,
    event_type: "suspicious_claim",
    metadata: {
      claimed_by_email: email,
      trust_level: result.level,
      trust_reason: result.reason,
      source: "auto_sign_in",
    },
  });
  if (insertErr) {
    console.error(
      "[auto-sign-in] suspicious_claim activity insert failed:",
      insertErr
    );
    return;
  }

  try {
    const alert = slackSuspiciousClaim({
      providerName,
      providerSlug,
      claimedByEmail: email,
      trustLevel: result.level,
      trustReason: result.reason,
    });
    await sendSlackAlert(alert.text, alert.blocks);
  } catch {
    // Non-blocking
  }
}
