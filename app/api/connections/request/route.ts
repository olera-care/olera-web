import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getAdminClient(): any {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const suffix = Math.random().toString(36).substring(2, 6);
  return `family-${base}-${suffix}`;
}

/**
 * POST /api/connections/request
 *
 * Creates a connection request from the authenticated user to a provider.
 * Handles:
 * - Ensuring user has a family profile
 * - Ensuring the target provider exists in business_profiles
 *   (creates a record for iOS olera-providers if needed)
 * - Inserting the connection with proper FK references
 */
export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const {
      providerId,
      providerName,
      providerSlug,
      intentData,
    } = body as {
      providerId: string;
      providerName: string;
      providerSlug: string;
      intentData: {
        careRecipient: string | null;
        careType: string | null;
        careTypeOtherText?: string;
        urgency: string | null;
        additionalNotes?: string;
      };
    };

    if (!providerId || !providerName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const admin = getAdminClient();
    const db = admin || supabase;

    // 1. Get user's account
    const { data: account } = await db
      .from("accounts")
      .select("id, display_name, active_profile_id")
      .eq("user_id", user.id)
      .single();

    if (!account) {
      return NextResponse.json(
        { error: "Account not found. Please try again." },
        { status: 404 }
      );
    }

    // 2. Ensure user has a family profile
    let fromProfileId: string;

    const { data: existingFamily } = await db
      .from("business_profiles")
      .select("id")
      .eq("account_id", account.id)
      .eq("type", "family")
      .limit(1)
      .single();

    if (existingFamily) {
      fromProfileId = existingFamily.id;
    } else {
      const displayName =
        account.display_name || user.email?.split("@")[0] || "Family";
      const slug = generateSlug(displayName);

      const { data: newProfile, error: profileError } = await db
        .from("business_profiles")
        .insert({
          account_id: account.id,
          slug,
          type: "family",
          category: null,
          display_name: displayName,
          care_types: [],
          claim_state: "claimed",
          verification_state: "unverified",
          source: "user_created",
          metadata: {},
        })
        .select("id")
        .single();

      if (profileError) {
        console.error("Failed to create family profile:", profileError);
        return NextResponse.json(
          { error: "Failed to create your profile." },
          { status: 500 }
        );
      }

      fromProfileId = newProfile.id;

      // Set as active profile if user doesn't have one
      if (!account.active_profile_id) {
        await db
          .from("accounts")
          .update({
            active_profile_id: newProfile.id,
            onboarding_completed: true,
          })
          .eq("id", account.id);
      }
    }

    // 3. Ensure target provider exists in business_profiles
    let toProfileId: string;

    // Check if providerId is a valid UUID (business_profiles record)
    const isUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        providerId
      );

    if (isUUID) {
      // Verify it exists
      const { data: existing } = await db
        .from("business_profiles")
        .select("id")
        .eq("id", providerId)
        .single();

      if (existing) {
        toProfileId = existing.id;
      } else {
        return NextResponse.json(
          { error: "Provider not found." },
          { status: 404 }
        );
      }
    } else {
      // iOS provider — look up by source_provider_id or create
      const { data: existing } = await db
        .from("business_profiles")
        .select("id")
        .eq("source_provider_id", providerId)
        .limit(1)
        .single();

      if (existing) {
        toProfileId = existing.id;
      } else {
        // Look up in olera-providers to get full data
        let providerCity: string | null = null;
        let providerState: string | null = null;
        let providerPhone: string | null = null;
        let providerCategory: string | null = null;
        let providerCareTypes: string[] = [];

        const { data: iosProvider } = await db
          .from("olera-providers")
          .select(
            "provider_name, provider_category, main_category, city, state, phone"
          )
          .eq("provider_id", providerId)
          .single();

        if (iosProvider) {
          providerCity = iosProvider.city;
          providerState = iosProvider.state;
          providerPhone = iosProvider.phone;
          providerCategory = iosProvider.provider_category;
          providerCareTypes = [iosProvider.provider_category];
          if (
            iosProvider.main_category &&
            iosProvider.main_category !== iosProvider.provider_category
          ) {
            providerCareTypes.push(iosProvider.main_category);
          }
        }

        const { data: newProvider, error: providerError } = await db
          .from("business_profiles")
          .insert({
            source_provider_id: providerId,
            slug: providerSlug || providerId,
            type: "organization",
            category: providerCategory,
            display_name: providerName,
            phone: providerPhone,
            city: providerCity,
            state: providerState,
            care_types: providerCareTypes,
            claim_state: "unclaimed",
            verification_state: "unverified",
            source: "seeded",
            is_active: true,
            metadata: {},
          })
          .select("id")
          .single();

        if (providerError) {
          // Handle race condition — another request may have created it
          if (providerError.code === "23505") {
            const { data: raceProvider } = await db
              .from("business_profiles")
              .select("id")
              .eq("source_provider_id", providerId)
              .limit(1)
              .single();

            if (raceProvider) {
              toProfileId = raceProvider.id;
            } else {
              console.error(
                "Failed to create provider profile:",
                providerError
              );
              return NextResponse.json(
                { error: "Failed to register provider." },
                { status: 500 }
              );
            }
          } else {
            console.error(
              "Failed to create provider profile:",
              providerError
            );
            return NextResponse.json(
              { error: "Failed to register provider." },
              { status: 500 }
            );
          }
        } else {
          toProfileId = newProvider.id;
        }
      }
    }

    // 4. Check for existing active connection (prevent duplicates)
    // Only pending/accepted connections block reconnection.
    // Expired (withdrawn/ended) and declined connections allow a fresh request.
    const { data: existingConnection } = await db
      .from("connections")
      .select("id, created_at")
      .eq("from_profile_id", fromProfileId)
      .eq("to_profile_id", toProfileId)
      .eq("type", "inquiry")
      .in("status", ["pending", "accepted"])
      .limit(1)
      .single();

    if (existingConnection) {
      return NextResponse.json({
        status: "duplicate",
        created_at: existingConnection.created_at,
      });
    }

    // 5. Build message payload
    const nameParts = (account.display_name || "").trim().split(/\s+/);
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    const messagePayload = JSON.stringify({
      care_recipient: intentData?.careRecipient || null,
      care_type: intentData?.careType || null,
      care_type_other: intentData?.careTypeOtherText || null,
      urgency: intentData?.urgency || null,
      additional_notes: intentData?.additionalNotes || null,
      contact_preference: null,
      seeker_phone: null,
      seeker_email: user.email || "",
      seeker_first_name: firstName,
      seeker_last_name: lastName,
    });

    // 6. Insert connection
    const { error: insertError } = await db.from("connections").insert({
      from_profile_id: fromProfileId,
      to_profile_id: toProfileId,
      type: "inquiry",
      status: "pending",
      message: messagePayload,
    });

    if (insertError) {
      console.error("Failed to insert connection:", insertError);
      return NextResponse.json(
        { error: "Failed to send request." },
        { status: 500 }
      );
    }

    return NextResponse.json({ status: "created" });
  } catch (err) {
    console.error("Connection request error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
