import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendSlackAlert, slackNewLead } from "@/lib/slack";
import { sendLoopsEvent } from "@/lib/loops";
import { getSiteUrl } from "@/lib/site-url";
import { generateUniqueSlugFromName } from "@/lib/slug";
import { recordProviderEvent } from "@/lib/analytics/provider-events";

/**
 * POST /api/connections/compare-save
 *
 * Creates connections to multiple providers at once (for the compare CTA).
 * This is a simplified version of the guest connection flow that:
 * 1. Creates an account silently
 * 2. Creates connections to all compared providers
 * 3. Sends Slack alerts for each
 * 4. Returns session tokens for instant login
 * 5. Redirects to inbox (skipping welcome/onboarding)
 */

interface CompareProvider {
  id: string;
  slug: string;
  name: string;
}

interface RequestBody {
  email: string;
  providers: CompareProvider[];
  sessionId?: string;
}

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody;
    const { email, providers, sessionId } = body;

    // Validation
    if (!email || !providers || providers.length === 0) {
      return NextResponse.json(
        { error: "Email and providers are required." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const db = getAdminClient();
    if (!db) {
      return NextResponse.json(
        { error: "Server configuration error." },
        { status: 500 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const siteUrl = getSiteUrl();

    // ═══════════════════════════════════════════════════════════════════════════
    // RATE LIMITING
    // ═══════════════════════════════════════════════════════════════════════════
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: recentConnections } = await db
      .from("connections")
      .select("id")
      .eq("guest_email", normalizedEmail)
      .gte("created_at", oneHourAgo);

    if (recentConnections && recentConnections.length >= 10) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CHECK FOR PROVIDER EMAIL
    // ═══════════════════════════════════════════════════════════════════════════
    const { data: existingProviderProfile } = await db
      .from("business_profiles")
      .select("id, type")
      .eq("email", normalizedEmail)
      .in("type", ["organization", "caregiver", "student"])
      .limit(1)
      .maybeSingle();

    if (existingProviderProfile) {
      return NextResponse.json(
        {
          error: "This email is linked to a provider account. Please use a different email.",
          code: "PROVIDER_EMAIL",
        },
        { status: 409 }
      );
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CREATE OR GET ACCOUNT
    // ═══════════════════════════════════════════════════════════════════════════
    const { createClient: createAdminAuthClient } = await import("@supabase/supabase-js");
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: "Server configuration error." }, { status: 500 });
    }

    const authClient = createAdminAuthClient(supabaseUrl, serviceKey);

    let fromProfileId: string;
    let accountId: string;
    let userId: string;
    let accessToken: string | null = null;
    let refreshToken: string | null = null;
    let isNewUser = false;
    const displayName = "Care Seeker";

    // Try to create user
    const { data: newUser, error: createUserErr } = await authClient.auth.admin.createUser({
      email: normalizedEmail,
      email_confirm: false,
      user_metadata: { full_name: displayName },
    });

    if (createUserErr) {
      if (
        createUserErr.message?.includes("already been registered") ||
        createUserErr.message?.includes("already exists")
      ) {
        // User exists — look up existing profile
        const { data: existingProfile } = await db
          .from("business_profiles")
          .select("id, account_id")
          .eq("email", normalizedEmail)
          .eq("type", "family")
          .not("account_id", "is", null)
          .limit(1)
          .single();

        if (existingProfile && existingProfile.account_id) {
          fromProfileId = existingProfile.id;
          accountId = existingProfile.account_id;

          const { data: accountData } = await db
            .from("accounts")
            .select("user_id")
            .eq("id", accountId)
            .single();

          userId = accountData?.user_id || "";

          // Generate session for existing user
          const { data: linkData } = await authClient.auth.admin.generateLink({
            type: "magiclink",
            email: normalizedEmail,
            options: { redirectTo: `${siteUrl}/portal/inbox` },
          });

          if (linkData?.properties?.hashed_token) {
            try {
              const { data: verifyData, error: verifyError } = await authClient.auth.verifyOtp({
                token_hash: linkData.properties.hashed_token,
                type: "magiclink",
              });

              if (!verifyError && verifyData?.session) {
                accessToken = verifyData.session.access_token;
                refreshToken = verifyData.session.refresh_token;
              }
            } catch {
              // Non-fatal
            }
          }
        } else {
          // Auth user exists but no profile — create one
          const { data: linkData } = await authClient.auth.admin.generateLink({
            type: "magiclink",
            email: normalizedEmail,
            options: { redirectTo: `${siteUrl}/portal/inbox` },
          });

          if (linkData?.properties?.hashed_token) {
            try {
              const { data: verifyData } = await authClient.auth.verifyOtp({
                token_hash: linkData.properties.hashed_token,
                type: "magiclink",
              });

              if (verifyData?.session) {
                accessToken = verifyData.session.access_token;
                refreshToken = verifyData.session.refresh_token;
                userId = verifyData.session.user?.id || "";
              }
            } catch {
              // Non-fatal
            }
          }

          userId = userId! || "";
          const slug = await generateUniqueSlugFromName(db, displayName);
          const { data: newProfile, error: profileErr } = await db
            .from("business_profiles")
            .insert({
              account_id: null,
              email: normalizedEmail,
              slug,
              type: "family",
              display_name: displayName,
              care_types: [],
              claim_state: "unclaimed",
              verification_state: "unverified",
              source: "compare_save",
              metadata: {},
            })
            .select("id")
            .single();

          if (profileErr) {
            return NextResponse.json({ error: "Failed to create profile." }, { status: 500 });
          }
          fromProfileId = newProfile.id;
          accountId = "";
        }
      } else {
        console.error("Failed to create auth user:", createUserErr);
        return NextResponse.json({ error: "Failed to create account." }, { status: 500 });
      }
    } else {
      // New user created
      isNewUser = true;
      userId = newUser.user.id;

      // Create account
      const { data: newAccount, error: accountErr } = await db
        .from("accounts")
        .insert({
          user_id: userId,
          display_name: displayName,
          onboarding_completed: false,
        })
        .select("id")
        .single();

      if (accountErr) {
        return NextResponse.json({ error: "Failed to create account." }, { status: 500 });
      }
      accountId = newAccount.id;

      // Create family profile
      const slug = await generateUniqueSlugFromName(db, displayName);
      const { data: newProfile, error: profileErr } = await db
        .from("business_profiles")
        .insert({
          account_id: accountId,
          email: normalizedEmail,
          slug,
          type: "family",
          display_name: displayName,
          care_types: [],
          claim_state: "claimed",
          verification_state: "unverified",
          source: "compare_save",
          metadata: {},
        })
        .select("id")
        .single();

      if (profileErr) {
        return NextResponse.json({ error: "Failed to create profile." }, { status: 500 });
      }
      fromProfileId = newProfile.id;

      // Set as active profile
      await db.from("accounts").update({ active_profile_id: fromProfileId }).eq("id", accountId);

      // Generate session tokens
      const { data: linkData } = await authClient.auth.admin.generateLink({
        type: "magiclink",
        email: normalizedEmail,
        options: { redirectTo: `${siteUrl}/portal/inbox` },
      });

      if (linkData?.properties?.hashed_token) {
        try {
          const { data: verifyData } = await authClient.auth.verifyOtp({
            token_hash: linkData.properties.hashed_token,
            type: "magiclink",
          });

          if (verifyData?.session) {
            accessToken = verifyData.session.access_token;
            refreshToken = verifyData.session.refresh_token;
          }
        } catch {
          // Non-fatal
        }
      }

      // Loops: new account
      try {
        await sendLoopsEvent({
          email: normalizedEmail,
          eventName: "user_signup",
          audience: "seeker",
          eventProperties: { source: "compare_save" },
          contactProperties: { firstName: "", lastName: "" },
        });
      } catch {
        // Non-blocking
      }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CREATE CONNECTIONS FOR ALL PROVIDERS
    // ═══════════════════════════════════════════════════════════════════════════
    const connectionIds: string[] = [];
    const createdAt = new Date().toISOString();

    for (const provider of providers) {
      // Resolve provider profile ID
      let toProfileId: string;
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(provider.id);

      if (isUUID) {
        const { data: existing } = await db
          .from("business_profiles")
          .select("id")
          .eq("id", provider.id)
          .single();

        if (existing) {
          toProfileId = existing.id;
        } else {
          console.error(`Provider not found: ${provider.id}`);
          continue;
        }
      } else {
        // iOS provider lookup
        const { data: existing } = await db
          .from("business_profiles")
          .select("id")
          .eq("source_provider_id", provider.id)
          .limit(1)
          .single();

        if (existing) {
          toProfileId = existing.id;
        } else {
          // Create from olera-providers
          const { data: iosProvider } = await db
            .from("olera-providers")
            .select("provider_name, provider_category, city, state, phone, provider_logo, provider_images")
            .eq("provider_id", provider.id)
            .single();

          const providerImageUrl =
            iosProvider?.provider_logo ||
            (iosProvider?.provider_images as string | null)?.split(" | ")?.[0] ||
            null;

          const { data: newProvider, error: providerError } = await db
            .from("business_profiles")
            .insert({
              source_provider_id: provider.id,
              slug: provider.slug,
              type: "organization",
              category: iosProvider?.provider_category || null,
              display_name: provider.name,
              phone: iosProvider?.phone || null,
              city: iosProvider?.city || null,
              state: iosProvider?.state || null,
              image_url: providerImageUrl,
              care_types: iosProvider ? [iosProvider.provider_category] : [],
              claim_state: "unclaimed",
              verification_state: "unverified",
              source: "seeded",
              is_active: true,
              metadata: {},
            })
            .select("id")
            .single();

          if (providerError && providerError.code !== "23505") {
            console.error(`Failed to create provider profile for ${provider.id}:`, providerError);
            continue;
          }

          toProfileId = newProvider?.id;
          if (!toProfileId) {
            const { data: raceProvider } = await db
              .from("business_profiles")
              .select("id")
              .eq("source_provider_id", provider.id)
              .limit(1)
              .single();
            toProfileId = raceProvider?.id;
          }

          if (!toProfileId) {
            continue;
          }
        }
      }

      // Check for existing connection
      const { data: existingConnection } = await db
        .from("connections")
        .select("id")
        .eq("from_profile_id", fromProfileId)
        .eq("to_profile_id", toProfileId)
        .eq("type", "inquiry")
        .in("status", ["pending", "accepted"])
        .limit(1)
        .single();

      if (existingConnection) {
        connectionIds.push(existingConnection.id);
        continue;
      }

      // Build connection metadata with auto-reply
      const connectionMetadata = {
        auto_intro: `Interested in comparing care options.`,
        source: "compare_save",
        thread: [
          {
            from_profile_id: toProfileId,
            text: `Hello, thank you for reaching out. We're reviewing your request and will get back to you shortly. In the meantime, feel free to share any additional details.`,
            created_at: createdAt,
            is_auto_reply: true,
          },
        ],
      };

      // Build message payload
      const messagePayload = JSON.stringify({
        seeker_email: normalizedEmail,
        message: null,
        care_recipient: null,
        care_type: null,
        urgency: null,
        source: "compare_save",
      });

      // Insert connection
      const { data: newConnection, error: insertError } = await db
        .from("connections")
        .insert({
          from_profile_id: fromProfileId,
          to_profile_id: toProfileId,
          type: "inquiry",
          status: "pending",
          message: messagePayload,
          metadata: connectionMetadata,
          guest_email: normalizedEmail,
        })
        .select("id")
        .single();

      if (insertError) {
        console.error(`Failed to insert connection for ${provider.id}:`, insertError);
        continue;
      }

      connectionIds.push(newConnection.id);

      // Record analytics
      void recordProviderEvent({
        provider_id: provider.slug,
        event_type: "lead_received",
        profile_id: toProfileId,
        metadata: {
          connection_id: newConnection.id,
          guest: true,
          raw_provider_id: provider.id,
          session_id: sessionId || null,
          cta_variant: "compare",
          source: "compare_save",
        },
      });

      // Slack alert
      try {
        const alert = slackNewLead({
          familyName: "A family (compare)",
          providerName: provider.name,
          careType: null,
        });
        await sendSlackAlert(alert.text, alert.blocks);
      } catch {
        // Non-blocking
      }
    }

    // Loops event
    try {
      await sendLoopsEvent({
        email: normalizedEmail,
        eventName: "comparison_saved",
        audience: "seeker",
        eventProperties: {
          providerCount: providers.length,
          providerNames: providers.map((p) => p.name).join(", "),
        },
      });
    } catch {
      // Non-blocking
    }

    return NextResponse.json({
      status: "created",
      connectionIds,
      accessToken: accessToken || null,
      refreshToken: refreshToken || null,
      isNewUser,
    });
  } catch (err) {
    console.error("Compare save error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
