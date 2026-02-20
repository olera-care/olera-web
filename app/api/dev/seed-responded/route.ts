import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";

/**
 * POST /api/dev/seed-responded
 *
 * DEV-ONLY: Seeds 3 "accepted" connections for the authenticated user so
 * the "Responded" tab has data for testing. Each connection points to a
 * real provider (organization) profile that has images, and includes a
 * realistic inquiry message and a sample conversation thread in metadata.
 *
 * Idempotent-ish: it will skip providers that already have an accepted
 * connection with the user.
 */
export async function POST() {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get user's active profile
    const { data: account } = await supabase
      .from("accounts")
      .select("active_profile_id")
      .eq("user_id", user.id)
      .single();

    if (!account?.active_profile_id) {
      return NextResponse.json(
        { error: "No active profile" },
        { status: 400 }
      );
    }

    const userProfileId = account.active_profile_id;

    // Find existing accepted connections so we can skip duplicates
    const { data: existingConnections } = await supabase
      .from("connections")
      .select("to_profile_id")
      .eq("from_profile_id", userProfileId)
      .eq("type", "inquiry")
      .eq("status", "accepted");

    const existingProviderIds = new Set(
      (existingConnections ?? []).map((c) => c.to_profile_id as string)
    );

    // Backfill contact info on any connected providers (any status) missing it
    const { data: allConnections } = await supabase
      .from("connections")
      .select("to_profile_id")
      .eq("from_profile_id", userProfileId)
      .eq("type", "inquiry");

    const allConnectedProviderIds = new Set(
      (allConnections ?? []).map((c) => c.to_profile_id as string)
    );

    let backfilledContactId: string | null = null;
    if (allConnectedProviderIds.size > 0) {
      const allIds = Array.from(allConnectedProviderIds);
      const { data: connectedProfiles } = await supabase
        .from("business_profiles")
        .select("id, display_name, phone, email, website")
        .in("id", allIds);

      // Force-set contact info on the first connected provider
      // (even if they have partial data from iOS import)
      const firstProfile = (connectedProfiles ?? [])[0];
      if (firstProfile) {
        const name = (firstProfile.display_name || "provider").toLowerCase().replace(/[^a-z0-9]/g, "");
        await supabase
          .from("business_profiles")
          .update({
            phone: "(713) 555-0142",
            email: `care@${name}.com`,
            website: `https://www.${name}.com`,
          })
          .eq("id", firstProfile.id);
        backfilledContactId = firstProfile.id;
      }
    }

    // Find provider profiles (type "organization")
    const { data: providers, error: providerError } = await supabase
      .from("business_profiles")
      .select("id, display_name, image_url, phone, email, website, source_provider_id")
      .eq("type", "organization")
      .limit(10);

    if (providerError) {
      console.error("Provider query error:", providerError);
      return NextResponse.json(
        { error: "Failed to query providers" },
        { status: 500 }
      );
    }

    // Filter to providers with no existing accepted connection
    const eligibleProviders = (providers ?? []).filter(
      (p) => !existingProviderIds.has(p.id)
    );

    const selectedProviders = eligibleProviders.slice(0, 3);

    if (selectedProviders.length === 0) {
      return NextResponse.json({
        status: "already_seeded",
        count: 0,
        connectionIds: [],
        backfilledContactId,
        message: backfilledContactId
          ? "No new connections needed. Contact info backfilled on one provider."
          : "All providers already have connections.",
      });
    }

    // Realistic seed data per connection
    const seedData = [
      {
        message: {
          care_type: "home_care_agency",
          care_recipient: "parent",
          urgency: "within_30_days",
          additional_notes:
            "Looking for help with daily activities and medication management for my mother.",
        },
        thread: [
          {
            text: "Hi, I'm interested in your home care services for my mother. She needs help with daily activities.",
            offsetDays: -5,
            fromUser: true,
          },
          {
            text: "Thank you for reaching out! We'd love to help. Could you share a bit more about your mother's specific needs?",
            offsetDays: -4,
            fromUser: false,
          },
          {
            text: "She needs assistance with bathing, meal prep, and medication reminders. She's 78 and mostly independent otherwise.",
            offsetDays: -3,
            fromUser: true,
          },
        ],
      },
      {
        message: {
          care_type: "assisted_living",
          care_recipient: "spouse",
          urgency: "within_60_days",
          additional_notes:
            "Exploring assisted living options for my husband who has early-stage dementia.",
        },
        thread: [
          {
            text: "We're looking into assisted living for my husband. Do you have memory care programs?",
            offsetDays: -7,
            fromUser: true,
          },
          {
            text: "Yes, we offer a specialized memory care program. I'd be happy to schedule a tour for you both.",
            offsetDays: -6,
            fromUser: false,
          },
        ],
      },
      {
        message: {
          care_type: "home_care_agency",
          care_recipient: "self",
          urgency: "immediately",
          additional_notes:
            "Recovering from hip surgery and need temporary in-home care assistance.",
        },
        thread: [
          {
            text: "I just had hip replacement surgery and need in-home help for the next few weeks.",
            offsetDays: -2,
            fromUser: true,
          },
          {
            text: "We can absolutely help with post-surgery recovery care. We have availability starting this week.",
            offsetDays: -2,
            fromUser: false,
          },
          {
            text: "That's great to hear. What does a typical daily schedule look like?",
            offsetDays: -1,
            fromUser: true,
          },
          {
            text: "We typically do 4-8 hour shifts covering mobility assistance, wound care reminders, meal prep, and light housekeeping. We'll customize it to your needs.",
            offsetDays: -1,
            fromUser: false,
          },
        ],
      },
    ];

    // Ensure the first provider has contact info for testing
    if (selectedProviders.length > 0) {
      const first = selectedProviders[0];
      if (!first.phone && !first.email && !first.website) {
        const { error: contactError } = await supabase
          .from("business_profiles")
          .update({
            phone: "(713) 555-0142",
            email: "care@" + (first.display_name || "provider").toLowerCase().replace(/[^a-z0-9]/g, "") + ".com",
            website: "https://www." + (first.display_name || "provider").toLowerCase().replace(/[^a-z0-9]/g, "") + ".com",
          })
          .eq("id", first.id);

        if (!contactError) {
          selectedProviders[0] = {
            ...first,
            phone: "(713) 555-0142",
            email: "care@" + (first.display_name || "provider").toLowerCase().replace(/[^a-z0-9]/g, "") + ".com",
            website: "https://www." + (first.display_name || "provider").toLowerCase().replace(/[^a-z0-9]/g, "") + ".com",
          };
        }
      }
    }

    const now = new Date();
    const insertedIds: string[] = [];

    for (let i = 0; i < selectedProviders.length; i++) {
      const provider = selectedProviders[i];
      const seed = seedData[i];

      // Build the thread with real profile IDs and timestamps
      const thread = seed.thread.map((entry) => {
        const createdAt = new Date(now);
        createdAt.setDate(createdAt.getDate() + entry.offsetDays);
        // Stagger within the day so ordering is sensible
        createdAt.setHours(9 + seed.thread.indexOf(entry), 0, 0, 0);

        return {
          from_profile_id: entry.fromUser
            ? userProfileId
            : provider.id,
          text: entry.text,
          created_at: createdAt.toISOString(),
        };
      });

      // Insert the connection
      const { data: inserted, error: insertError } = await supabase
        .from("connections")
        .insert({
          type: "inquiry",
          status: "accepted",
          from_profile_id: userProfileId,
          to_profile_id: provider.id,
          message: JSON.stringify(seed.message),
          metadata: { thread },
        })
        .select("id")
        .single();

      if (insertError) {
        console.error(
          `Insert error for provider ${provider.id}:`,
          insertError
        );
        continue;
      }

      if (inserted) {
        insertedIds.push(inserted.id);
      }
    }

    return NextResponse.json({
      status: "seeded",
      count: insertedIds.length,
      connectionIds: insertedIds,
      backfilledContactId,
      providers: selectedProviders.map((p) => ({
        profile_id: p.id,
        name: p.display_name,
      })),
    });
  } catch (err) {
    console.error("Seed responded error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
