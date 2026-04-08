import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { validateClaimToken } from "@/lib/claim-tokens";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***@***.com";
  const maskedLocal =
    local.length <= 2 ? "*".repeat(local.length) : local[0] + "***" + local[local.length - 1];
  return `${maskedLocal}@${domain}`;
}

/**
 * POST /api/claim/validate-token
 *
 * Validates a claim token from an email campaign link.
 * If valid, marks the session as pre-verified (skips code entry).
 *
 * Request body: { token: string, claimSession: string, action?: string, actionId?: string }
 * Returns: { valid: true, providerId, emailHint, providerName, notificationData? } or { valid: false, error }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, claimSession, action, actionId } = body;

    if (!token) {
      return NextResponse.json({ valid: false, error: "Token is required." }, { status: 400 });
    }

    if (!claimSession) {
      return NextResponse.json({ valid: false, error: "Claim session is required." }, { status: 400 });
    }

    // Validate the token
    const result = validateClaimToken(token);

    if (!result.valid) {
      return NextResponse.json({ valid: false, error: result.error }, { status: 400 });
    }

    const { providerId, email } = result;

    const db = getAdminClient();
    if (!db) {
      return NextResponse.json({ valid: false, error: "Server configuration error." }, { status: 500 });
    }

    // Verify provider still exists and email matches
    // Token providerId may be a slug (from notification emails) or a UUID (from campaign emails)
    // Check olera-providers first, then fall back to business_profiles
    let providerName: string | null = null;
    let providerSlug: string | null = null;
    let providerEmail: string | null = null;
    // Canonical ID used for claim_verification_codes — must match what finalize will use.
    // For olera-providers records this is the UUID provider_id.
    // For BP-only providers this is the BP id.
    let canonicalProviderId: string = providerId;
    let isBusinessProfile = false;

    // Try olera-providers by provider_id
    const { data: oleraProvider } = await db
      .from("olera-providers")
      .select("provider_id, email, provider_name, slug")
      .eq("provider_id", providerId)
      .maybeSingle();

    if (oleraProvider) {
      canonicalProviderId = oleraProvider.provider_id;
      providerName = oleraProvider.provider_name;
      providerSlug = oleraProvider.slug || providerId;
      providerEmail = oleraProvider.email;
    } else {
      // Try olera-providers by slug
      const { data: oleraBySlug } = await db
        .from("olera-providers")
        .select("provider_id, email, provider_name, slug")
        .eq("slug", providerId)
        .maybeSingle();

      if (oleraBySlug) {
        canonicalProviderId = oleraBySlug.provider_id;
        providerName = oleraBySlug.provider_name;
        providerSlug = oleraBySlug.slug || providerId;
        providerEmail = oleraBySlug.email;
      } else {
        // Try business_profiles by slug (BP-only providers)
        const { data: bp } = await db
          .from("business_profiles")
          .select("id, display_name, slug, email")
          .eq("slug", providerId)
          .in("type", ["organization", "caregiver"])
          .maybeSingle();

        if (bp) {
          canonicalProviderId = bp.id;
          providerName = bp.display_name;
          providerSlug = bp.slug || providerId;
          providerEmail = bp.email;
          isBusinessProfile = true;
        }
      }
    }

    if (!providerName) {
      return NextResponse.json({ valid: false, error: "Provider not found." }, { status: 404 });
    }

    // Email must still match (in case it was updated since token was generated)
    // For BP-only providers, the email in the token is what we sent to — trust it
    if (providerEmail && providerEmail.toLowerCase() !== email.toLowerCase() && !isBusinessProfile) {
      return NextResponse.json(
        { valid: false, error: "Provider email has changed. Please request a new link." },
        { status: 400 }
      );
    }

    // Check if already claimed
    const { data: existingProfile } = await db
      .from("business_profiles")
      .select("claim_state, account_id")
      .or(`source_provider_id.eq.${canonicalProviderId},slug.eq.${providerId}`)
      .maybeSingle();

    // For already-claimed listings, still return valid — the owner clicking their
    // own notification email is the expected case. The one-click flow on the client
    // will establish their session and redirect to the destination.
    const alreadyClaimed = existingProfile?.claim_state === "claimed" && !!existingProfile?.account_id;

    // Create a pre-verified record in claim_verification_codes.
    // Use canonicalProviderId (UUID/BP id) so it matches what finalize queries with.
    try {
      await db.from("claim_verification_codes").insert({
        provider_id: canonicalProviderId,
        claim_session: claimSession,
        code: "TOKEN",
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        verified_at: new Date().toISOString(),
      });
    } catch {
      // May fail if duplicate — that's fine
    }

    // Fetch notification data server-side (service role key bypasses RLS).
    // The browser client can't read connections/questions/reviews for
    // unauthenticated users, so the notification card would be empty.
    let notificationData: Record<string, unknown> | null = null;

    // For claim/signup, we don't need actionId - provider info IS the notification data
    if (action === "claim" || action === "signup") {
      try {
        notificationData = {
          type: action,
          id: canonicalProviderId,
          created_at: new Date().toISOString(),
          provider_name: providerName,
          provider_city: null as string | null,
          provider_state: null as string | null,
          provider_image: null as string | null,
        };

        // Try to fetch location/image from business_profiles first, then olera-providers
        const { data: bpInfo } = await db
          .from("business_profiles")
          .select("city, state, image_url")
          .eq("slug", providerSlug || providerId)
          .maybeSingle();

        if (bpInfo) {
          notificationData.provider_city = bpInfo.city;
          notificationData.provider_state = bpInfo.state;
          notificationData.provider_image = bpInfo.image_url;
        } else {
          const { data: opInfo } = await db
            .from("olera-providers")
            .select("city, state, provider_images")
            .eq("slug", providerSlug || providerId)
            .maybeSingle();

          if (opInfo) {
            notificationData.provider_city = opInfo.city;
            notificationData.provider_state = opInfo.state;
            notificationData.provider_image = opInfo.provider_images?.split("|")[0]?.trim() || null;
          }
        }
      } catch (err) {
        console.error("Failed to fetch claim/signup notification data:", err);
      }
    } else if (action && actionId) {
      // For lead/question/review/interview, we need actionId to fetch the specific record
      try {
        if (action === "lead" || action === "message") {
          const { data: conn } = await db
            .from("connections")
            .select("id, created_at, message, metadata, from_profile:business_profiles!connections_from_profile_id_fkey(display_name, city, state)")
            .eq("id", actionId)
            .single();
          if (conn) {
            let parsedMessage: Record<string, unknown> = {};
            try {
              if (conn.message && typeof conn.message === "string") {
                parsedMessage = JSON.parse(conn.message);
              }
            } catch { parsedMessage = { message: conn.message }; }
            const connMeta = conn.metadata as Record<string, unknown> | null;
            notificationData = {
              type: "lead",
              id: conn.id,
              created_at: conn.created_at,
              message: (parsedMessage.message as string) || (parsedMessage.additional_notes as string) || null,
              metadata: {
                care_type: (parsedMessage.care_type as string) || null,
                auto_intro: (connMeta?.auto_intro as string) || null,
              },
              from_profile: conn.from_profile,
            };
          }
        } else if (action === "question") {
          const { data: question } = await db
            .from("provider_questions")
            .select("id, question, asker_name, created_at")
            .eq("id", actionId)
            .single();
          if (question) {
            notificationData = {
              type: "question",
              id: question.id,
              created_at: question.created_at,
              question: question.question,
              asker_name: question.asker_name,
            };
          }
        } else if (action === "review") {
          const { data: review } = await db
            .from("reviews")
            .select("id, rating, comment, reviewer_name, created_at")
            .eq("id", actionId)
            .single();
          if (review) {
            notificationData = {
              type: "review",
              id: review.id,
              created_at: review.created_at,
              rating: review.rating,
              comment: review.comment,
              reviewer_name: review.reviewer_name,
            };
          }
        } else if (action === "interview") {
          const { data: interview } = await db
            .from("interviews")
            .select("id, type, proposed_time, notes, status, created_at, student:business_profiles!interviews_student_profile_id_fkey(display_name, image_url)")
            .eq("id", actionId)
            .single();
          if (interview) {
            const student = interview.student as unknown as { display_name: string; image_url: string | null } | null;
            notificationData = {
              type: "interview",
              id: interview.id,
              created_at: interview.created_at,
              candidate_name: student?.display_name || "A candidate",
              candidate_image: student?.image_url || null,
              interview_format: interview.type,
              proposed_time: interview.proposed_time,
              notes: interview.notes,
            };
          }
        }
      } catch (err) {
        console.error("Failed to fetch notification data:", err);
      }
    }

    return NextResponse.json({
      valid: true,
      providerId: canonicalProviderId,
      email,
      emailHint: maskEmail(email),
      providerName: providerName,
      providerSlug: providerSlug || providerId,
      alreadyClaimed,
      notificationData,
    });
  } catch (err) {
    console.error("Validate token error:", err);
    return NextResponse.json({ valid: false, error: "Internal server error" }, { status: 500 });
  }
}
