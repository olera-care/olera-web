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

// Maps for building the auto-intro message
const CARE_TYPE_DISPLAY: Record<string, string> = {
  home_care: "Home Care",
  home_health: "Home Health Care",
  assisted_living: "Assisted Living",
  memory_care: "Memory Care",
};

const RECIPIENT_DISPLAY: Record<string, string> = {
  self: "myself",
  Myself: "myself",
  parent: "my parent",
  "My parent": "my parent",
  spouse: "my spouse",
  "My spouse": "my spouse",
  other: "my loved one",
  "Someone else": "my loved one",
  // Backward compat
  "A loved one": "my loved one",
};

const TIMELINE_DISPLAY: Record<string, string> = {
  asap: "I need care as soon as possible.",
  immediate: "I need care as soon as possible.",
  within_month: "I'm hoping to get started within a month.",
  within_1_month: "I'm hoping to get started within a month.",
  few_months: "I'm hoping to get started within a few months.",
  within_3_months: "I'm hoping to get started within a few months.",
  researching: "I'm currently researching options.",
  exploring: "I'm currently researching options.",
};

/**
 * Build a natural intro message from the care seeker's profile + intent data.
 * Uses intentData (CTA) when available, falls back to profile fields (matches).
 */
function buildIntroMessage(
  profileCareTypes: string[],
  providerCareTypes: string[],
  relationship: string | undefined,
  timeline: string | undefined,
  intentCareType: string | null | undefined,
  intentRecipient: string | null | undefined,
  intentUrgency: string | null | undefined,
): string {
  // Resolve care type: prefer intent → match provider → first from profile
  let careType: string | null = null;
  if (intentCareType) {
    careType = CARE_TYPE_DISPLAY[intentCareType] || intentCareType;
  } else if (profileCareTypes.length > 0) {
    const match = profileCareTypes.find(ct =>
      providerCareTypes.some(pct => pct.toLowerCase() === ct.toLowerCase())
    );
    careType = match || profileCareTypes[0];
  }

  // Resolve recipient: prefer intent → profile
  let recipientPhrase: string | null = null;
  const recipientKey = intentRecipient || relationship;
  if (recipientKey) {
    recipientPhrase = RECIPIENT_DISPLAY[recipientKey] || recipientKey.toLowerCase();
  }

  // Resolve timeline: prefer intent → profile
  const timelineKey = intentUrgency || timeline;
  const timelinePhrase = timelineKey ? TIMELINE_DISPLAY[timelineKey] || null : null;

  // Build the looking-for clause
  let lookingFor: string;
  if (careType && recipientPhrase) {
    lookingFor = `I'm looking for ${careType} for ${recipientPhrase}.`;
  } else if (careType) {
    lookingFor = `I'm looking for ${careType}.`;
  } else if (recipientPhrase) {
    lookingFor = `I'm looking for care for ${recipientPhrase}.`;
  } else {
    lookingFor = `I'd love to learn more about your services.`;
  }

  // Assemble
  const parts = [`Hi, ${lookingFor}`];
  if (timelinePhrase) parts.push(timelinePhrase);
  if (careType || recipientPhrase) {
    parts.push("I'd love to learn more about your services.");
  }

  return parts.join(" ");
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

    // 6. Build auto-intro message from profile + intent data
    let autoIntro: string | null = null;
    try {
      const [{ data: familyProfile }, { data: providerProfile }] = await Promise.all([
        db.from("business_profiles").select("care_types, metadata").eq("id", fromProfileId).single(),
        db.from("business_profiles").select("care_types").eq("id", toProfileId).single(),
      ]);

      const familyMeta = (familyProfile?.metadata || {}) as Record<string, string | undefined>;
      autoIntro = buildIntroMessage(
        familyProfile?.care_types || [],
        providerProfile?.care_types || [],
        familyMeta.relationship_to_recipient,
        familyMeta.timeline,
        intentData?.careType,
        intentData?.careRecipient,
        intentData?.urgency,
      );
    } catch {
      // Non-blocking — connection creation should not fail if intro generation fails
    }

    // 7. Insert connection
    const { error: insertError } = await db.from("connections").insert({
      from_profile_id: fromProfileId,
      to_profile_id: toProfileId,
      type: "inquiry",
      status: "pending",
      message: messagePayload,
      metadata: autoIntro ? { auto_intro: autoIntro } : {},
    });

    if (insertError) {
      console.error("Failed to insert connection:", insertError);
      return NextResponse.json(
        { error: "Failed to send request." },
        { status: 500 }
      );
    }

    // 8. Sync intent data back to user's family profile
    if (intentData) {
      try {
        const { data: currentProfile } = await db
          .from("business_profiles")
          .select("metadata, care_types")
          .eq("id", fromProfileId)
          .single();

        if (currentProfile) {
          const currentMeta = (currentProfile.metadata || {}) as Record<string, unknown>;
          const currentCareTypes: string[] = currentProfile.care_types || [];
          const updates: Record<string, unknown> = {};

          // Map CTA recipient → profile relationship_to_recipient
          const recipientMap: Record<string, string> = {
            self: "Myself",
            parent: "My parent",
            spouse: "My spouse",
            other: "Someone else",
          };
          if (intentData.careRecipient && recipientMap[intentData.careRecipient]) {
            currentMeta.relationship_to_recipient = recipientMap[intentData.careRecipient];
          }

          // Map CTA urgency → profile timeline
          const timelineMap: Record<string, string> = {
            asap: "immediate",
            within_month: "within_1_month",
            few_months: "within_3_months",
            researching: "exploring",
          };
          if (intentData.urgency && timelineMap[intentData.urgency]) {
            currentMeta.timeline = timelineMap[intentData.urgency];
          }

          updates.metadata = currentMeta;

          // Map CTA careType → profile care_types display name
          const careTypeMap: Record<string, string> = {
            home_care: "Home Care",
            home_health: "Home Health Care",
            assisted_living: "Assisted Living",
            memory_care: "Memory Care",
          };
          if (intentData.careType && careTypeMap[intentData.careType]) {
            const displayName = careTypeMap[intentData.careType];
            if (!currentCareTypes.includes(displayName)) {
              updates.care_types = [...currentCareTypes, displayName];
            }
          }

          await db
            .from("business_profiles")
            .update(updates)
            .eq("id", fromProfileId);
        }
      } catch (syncErr) {
        // Non-blocking — connection was created, profile sync is best-effort
        console.error("Failed to sync intent to profile:", syncErr);
      }
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
