import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  scoreClaimTrust,
  extractDomainFromWebsite,
  type ClaimTrustResult,
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
 * Also scores the email↔provider trust and returns the level/reason so the
 * client can propagate it to the subsequent /api/activity/track call (the
 * admin feed renders a trust badge from that metadata).
 */
export async function POST(request: Request) {
  try {
    const { email: bodyEmail, claimSession } = await request.json();

    if (!claimSession) {
      return NextResponse.json(
        { error: "Claim session is required" },
        { status: 400 }
      );
    }

    if (!UUID_RE.test(claimSession)) {
      return NextResponse.json({ error: "Invalid claim session" }, { status: 400 });
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
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://olera.care";

    // ── SECURITY: derive the email from the VERIFIED claim session, never the
    // request body. The stored email is the one that actually received and
    // passed verification (written by validate-token / send-code). Minting a
    // session for a caller-supplied email is account takeover — see migration
    // 107_claim_codes_email.sql.
    const { data: verifiedRow } = await supabaseAdmin
      .from("claim_verification_codes")
      .select("email, verified_at")
      .eq("claim_session", claimSession)
      .not("verified_at", "is", null)
      .not("email", "is", null)
      .gt("expires_at", new Date().toISOString())
      .order("verified_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!verifiedRow?.email) {
      console.warn(
        "[auto-sign-in] no verified email for claim session — refusing to mint session"
      );
      return NextResponse.json({ error: "Verification required" }, { status: 403 });
    }

    const normalizedEmail = (verifiedRow.email as string).trim().toLowerCase();

    // A mismatch between the caller-supplied email and the verified one is a
    // tampering signal. Log it, but only ever act on the verified email.
    if (
      bodyEmail &&
      typeof bodyEmail === "string" &&
      bodyEmail.trim().toLowerCase() !== normalizedEmail
    ) {
      console.warn(
        "[auto-sign-in] request email does not match verified email — using verified email"
      );
    }

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

    // Score the sign-in. Returns trust result; fire-and-forget 🚩 Slack on low.
    let trustResult: ClaimTrustResult = { level: "medium", reason: "not_scored" };
    try {
      console.log("[auto-sign-in] scoring trust:", {
        email: normalizedEmail,
        claimSession,
      });
      trustResult = await scoreAndMaybeAlert({
        db: supabaseAdmin,
        email: normalizedEmail,
        claimSession,
      });
      console.log("[auto-sign-in] scored:", trustResult);
    } catch (err) {
      console.error("[auto-sign-in] trust scoring failed:", err);
    }

    return NextResponse.json({
      tokenHash: signInLink.properties.hashed_token,
      userId,
      trustLevel: trustResult.level,
      trustReason: trustResult.reason,
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
 * Score the trust and fire a 🚩 Suspicious Claim Slack alert on low
 * (with 24h dedup against prior one_click_access events for the same
 * provider+email so repeat sign-ins don't spam). Returns the trust result
 * so the caller can surface it in the sign-in response.
 */
async function scoreAndMaybeAlert(params: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any;
  email: string;
  claimSession: string;
}): Promise<ClaimTrustResult> {
  const { db, email, claimSession } = params;
  const neutral: ClaimTrustResult = { level: "medium", reason: "not_scored" };

  if (!UUID_RE.test(claimSession)) return neutral;

  const { data: verif } = await db
    .from("claim_verification_codes")
    .select("provider_id")
    .eq("claim_session", claimSession)
    .limit(1)
    .maybeSingle();

  const providerId: string | undefined = verif?.provider_id;
  if (!providerId) return neutral;

  let providerName: string | null = null;
  let providerCity: string | null = null;
  let providerState: string | null = null;
  let providerWebsite: string | null = null;
  let providerSlug: string = providerId;

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
  } else {
    const { data: op } = await db
      .from("olera-providers")
      .select("provider_name, city, state, website, slug")
      .eq("provider_id", providerId)
      .maybeSingle();
    if (!op) return neutral;
    providerName = op.provider_name;
    providerCity = op.city;
    providerState = op.state;
    providerWebsite = op.website;
    providerSlug = op.slug || providerId;
  }

  if (!providerName) return neutral;

  const result = await scoreClaimTrust({
    email,
    providerName,
    providerCity,
    providerState,
    providerDomain: extractDomainFromWebsite(providerWebsite),
  });

  if (result.level !== "low") return result;

  // 🚩 escalation: separate Slack alert for low trust, deduped per provider+email per 24h.
  // Dedup only matches PRIOR low-trust one_click_access rows — so a provider who
  // signed in legitimately before can still trigger a fresh alert if a bad actor
  // uses the same email today with a low-trust outcome.
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: existing } = await db
    .from("provider_activity")
    .select("id")
    .eq("provider_id", providerSlug)
    .eq("event_type", "one_click_access")
    .gte("created_at", oneDayAgo)
    .contains("metadata", { email, trust_level: "low" })
    .limit(1)
    .maybeSingle();
  if (existing) {
    console.log("[auto-sign-in] skip low-trust Slack: prior low-trust event within 24h");
    return result;
  }

  try {
    const alert = slackSuspiciousClaim({
      providerName,
      providerSlug,
      claimedByEmail: email,
      trustLevel: result.level,
      trustReason: result.reason,
    });
    const slackResult = await sendSlackAlert(alert.text, alert.blocks);
    console.log("[auto-sign-in] suspicious_claim Slack:", slackResult);
  } catch (slackErr) {
    console.error("[auto-sign-in] suspicious_claim Slack failed:", slackErr);
  }

  return result;
}
