import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const DEMO_PROVIDER_SLUG = "sunrise-care-demo";
const DEMO_PROVIDER_NAME = "Sunrise Care Demo";
const DEMO_EMAIL = "esther+suspicious@gmail.com";
const DEMO_FAMILY_SLUG = "demo-family-thompson";

// Demo data for realistic testing
const DEMO_PROFILE_DATA = {
  slug: DEMO_PROVIDER_SLUG,
  type: "organization" as const,
  display_name: DEMO_PROVIDER_NAME,
  description: "A family-owned senior care facility providing compassionate care since 1985. We offer assisted living, memory care, and respite services in a warm, home-like environment. Our dedicated staff ensures each resident receives personalized attention and the highest quality of care. Located in the heart of Austin, we're proud to serve families across Central Texas.",
  city: "Austin",
  state: "TX",
  category: "Assisted Living",
  care_types: ["Assisted Living", "Memory Care", "Respite Care"],
  phone: "(512) 555-0123",
  claim_state: "unclaimed" as const,
  verification_state: "unverified",
  source: "seeded" as const,
  is_active: true,
  image_url: "https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=400&h=400&fit=crop",
  metadata: {
    demo: true,
    created_for: "verification-gating-demo",
    amenities: ["24/7 Staff", "Memory Care Unit", "Physical Therapy", "Garden Access", "Chef-Prepared Meals"],
    images: [
      "https://images.unsplash.com/photo-1586105251261-72a756497a11?w=800",
      "https://images.unsplash.com/photo-1559526324-593bc073d938?w=800",
      "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800",
    ],
  },
};

const DEMO_FAMILY_DATA = {
  slug: DEMO_FAMILY_SLUG,
  type: "family" as const,
  display_name: "Margaret Thompson",
  city: "Austin",
  state: "TX",
  email: "margaret.t@example.com",
  phone: "(512) 555-8901",
  is_active: true,
  metadata: {
    demo: true,
    care_recipient: "parent",
    care_type_needed: "memory_care",
  },
};

const DEMO_INBOX_MESSAGE = {
  seeker_name: "Margaret Thompson",
  seeker_email: "margaret.t@example.com",
  seeker_phone: "(512) 555-8901",
  care_type: "memory_care",
  care_recipient: "parent",
  looking_in_city: "Austin",
  looking_in_state: "TX",
  urgency: "within_month",
  message: "Hi, I'm looking for memory care for my mother who has early-stage dementia. She's 78 and still fairly mobile but needs supervision throughout the day. Can you tell me more about your memory care program and visiting hours? We'd also like to schedule a tour if possible.",
};

const DEMO_REVIEW = {
  reviewer_name: "John M.",
  rating: 5,
  title: "Excellent care for my father",
  comment: "The staff at Sunrise Care Demo have been absolutely wonderful. My father has been here for 6 months now and his quality of life has improved remarkably. The memory care unit is top-notch, and the nurses are so patient and caring. I especially appreciate the weekly updates and how they involve us in his care plan. Highly recommend to anyone looking for quality senior care in Austin.",
  relationship: "Family member",
  status: "published",
};

const DEMO_QUESTION = {
  asker_name: "Sarah W.",
  question: "What is your staff-to-resident ratio, and do you have RNs on site 24/7? Also, what activities do you offer for memory care residents?",
  status: "pending",
  is_public: true,
};

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

/**
 * GET /api/dev/reset-demo
 *
 * Returns the current state of the demo provider
 */
export async function GET() {
  const db = getAdminClient();
  if (!db) {
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  const { data: profile } = await db
    .from("business_profiles")
    .select(
      "id, slug, display_name, claim_state, verification_state, claim_trust_level, account_id, source, email"
    )
    .eq("slug", DEMO_PROVIDER_SLUG)
    .maybeSingle();

  return NextResponse.json({
    exists: !!profile,
    profile: profile || null,
    demoSlug: DEMO_PROVIDER_SLUG,
  });
}

/**
 * POST /api/dev/reset-demo
 *
 * Resets the demo to initial state:
 * 1. Deletes any existing demo provider business_profile
 * 2. Deletes associated account if it was created for demo
 * 3. Creates a fresh unclaimed demo provider
 */
export async function POST(request: Request) {
  const db = getAdminClient();
  if (!db) {
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const action = body.action as string | undefined;
  const customEmail = (body.email as string | undefined) || DEMO_EMAIL;

  // Action: approve - simulate admin approval
  if (action === "approve") {
    const { data: profile, error: findErr } = await db
      .from("business_profiles")
      .select("id, verification_state")
      .eq("slug", DEMO_PROVIDER_SLUG)
      .maybeSingle();

    if (findErr || !profile) {
      return NextResponse.json(
        { error: "Demo provider not found" },
        { status: 404 }
      );
    }

    const { error: updateErr } = await db
      .from("business_profiles")
      .update({ verification_state: "verified" })
      .eq("id", profile.id);

    if (updateErr) {
      return NextResponse.json(
        { error: "Failed to approve: " + updateErr.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: "approved",
      message: "Demo provider verification approved. Refresh the dashboard to see full access.",
    });
  }

  // Action: force_claim - skip OTP and directly set up restricted state for demo
  // This creates/finds the user, links the profile to their account, and sets restricted state
  if (action === "force_claim") {
    try {
      // Trim and validate email
      const email = customEmail?.trim()?.toLowerCase();
      if (!email) {
        return NextResponse.json(
          { error: "Email is required for Force Claim" },
          { status: 400 }
        );
      }

      // Basic email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: "Invalid email format. Please enter a valid email address." },
          { status: 400 }
        );
      }

      // Find the demo profile
      const { data: profile, error: findErr } = await db
        .from("business_profiles")
        .select("id, account_id")
        .eq("slug", DEMO_PROVIDER_SLUG)
        .maybeSingle();

      if (findErr || !profile) {
        return NextResponse.json(
          { error: "Demo provider not found. Please reset demo first." },
          { status: 404 }
        );
      }

      // Step 1: Find or create auth user
      let authUserId: string;
      const { data: existingUsers } = await db.auth.admin.listUsers({ perPage: 1000 });
      const existingUser = existingUsers?.users?.find((u) => u.email === email);

      if (existingUser) {
        authUserId = existingUser.id;
      } else {
        // Create the auth user
        const { data: newUser, error: createUserErr } = await db.auth.admin.createUser({
          email: email,
          email_confirm: true,
        });
        if (createUserErr || !newUser.user) {
          return NextResponse.json(
            { error: "Failed to create user: " + createUserErr?.message },
            { status: 500 }
          );
        }
        authUserId = newUser.user.id;
      }

      // Step 2: Find or create account for this user
      let accountId: string;
      const { data: existingAccount } = await db
        .from("accounts")
        .select("id")
        .eq("user_id", authUserId)
        .maybeSingle();

      if (existingAccount) {
        accountId = existingAccount.id;
      } else {
        // Create account
        const { data: newAccount, error: createAccErr } = await db
          .from("accounts")
          .insert({ user_id: authUserId })
          .select("id")
          .single();

        if (createAccErr || !newAccount) {
          return NextResponse.json(
            { error: "Failed to create account: " + createAccErr?.message },
            { status: 500 }
          );
        }
        accountId = newAccount.id;
      }

      // Step 3: Link profile to account and set restricted state
      const { error: updateErr } = await db
        .from("business_profiles")
        .update({
          account_id: accountId,
          claim_state: "claimed",
          verification_state: "pending_verification",
          claim_trust_level: "low",
        })
        .eq("id", profile.id);

      if (updateErr) {
        return NextResponse.json(
          { error: "Failed to claim: " + updateErr.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        status: "force_claimed",
        message: "Demo provider linked to your account and set to restricted state. Sign in with " + email + " and go to /provider to see the restricted UI.",
      });
    } catch (err) {
      return NextResponse.json(
        { error: "Force claim failed: " + (err instanceof Error ? err.message : String(err)) },
        { status: 500 }
      );
    }
  }

  // Action: set_restricted - set to pending_verification (low-trust restricted state)
  if (action === "set_restricted") {
    const { data: profile, error: findErr } = await db
      .from("business_profiles")
      .select("id")
      .eq("slug", DEMO_PROVIDER_SLUG)
      .maybeSingle();

    if (findErr || !profile) {
      return NextResponse.json({ error: "Demo provider not found" }, { status: 404 });
    }

    const { error: updateErr } = await db
      .from("business_profiles")
      .update({
        verification_state: "pending_verification",
        claim_trust_level: "low",
      })
      .eq("id", profile.id);

    if (updateErr) {
      return NextResponse.json({ error: "Failed: " + updateErr.message }, { status: 500 });
    }

    return NextResponse.json({
      status: "restricted",
      message: "Demo provider set to RESTRICTED state. Refresh the dashboard to see the locked UI.",
    });
  }

  // Action: set_pending - simulate form submission (set to pending review)
  if (action === "set_pending") {
    const { data: profile, error: findErr } = await db
      .from("business_profiles")
      .select("id")
      .eq("slug", DEMO_PROVIDER_SLUG)
      .maybeSingle();

    if (findErr || !profile) {
      return NextResponse.json(
        { error: "Demo provider not found" },
        { status: 404 }
      );
    }

    const { error: updateErr } = await db
      .from("business_profiles")
      .update({ verification_state: "pending" })
      .eq("id", profile.id);

    if (updateErr) {
      return NextResponse.json(
        { error: "Failed to set pending: " + updateErr.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: "pending",
      message: "Demo provider set to pending review state.",
    });
  }

  // Default action: reset
  try {
    // 0. Try to clean up any existing auth user with the provided email
    // This handles cases where the email was used in previous tests
    // Wrapped in try-catch because listUsers can fail on large user bases
    try {
      const { data: authUsers } = await db.auth.admin.listUsers({ perPage: 1000 });
      const demoAuthUser = authUsers?.users?.find(
        (u) => u.email === customEmail
      );
      if (demoAuthUser) {
        // Find and clean up their account
        const { data: existingAccount } = await db
          .from("accounts")
          .select("id")
          .eq("user_id", demoAuthUser.id)
          .maybeSingle();

        if (existingAccount) {
          // Unlink any business_profiles from this account (don't delete them)
          await db
            .from("business_profiles")
            .update({ account_id: null, claim_state: "unclaimed" })
            .eq("account_id", existingAccount.id);

          // Delete the account
          await db.from("accounts").delete().eq("id", existingAccount.id);
        }

        // Delete the auth user
        await db.auth.admin.deleteUser(demoAuthUser.id);
      }
    } catch (authCleanupErr) {
      console.warn("Auth cleanup failed (non-fatal):", authCleanupErr);
      // Continue with reset even if auth cleanup fails
    }

    // 1. Find existing demo profile
    const { data: existingProfile } = await db
      .from("business_profiles")
      .select("id, account_id")
      .eq("slug", DEMO_PROVIDER_SLUG)
      .maybeSingle();

    // 2. Delete existing demo data
    if (existingProfile) {
      // Clean up connections TO or FROM the demo provider first (before deleting profile)
      await db
        .from("connections")
        .delete()
        .or(`from_profile_id.eq.${existingProfile.id},to_profile_id.eq.${existingProfile.id}`);

      // Delete the business_profile
      await db.from("business_profiles").delete().eq("id", existingProfile.id);

      // If there's an associated account with no other profiles, delete it too
      if (existingProfile.account_id) {
        const { data: otherProfiles } = await db
          .from("business_profiles")
          .select("id")
          .eq("account_id", existingProfile.account_id)
          .limit(1);

        if (!otherProfiles || otherProfiles.length === 0) {
          // Get the user_id to delete auth user
          const { data: account } = await db
            .from("accounts")
            .select("user_id")
            .eq("id", existingProfile.account_id)
            .maybeSingle();

          // Delete the account
          await db.from("accounts").delete().eq("id", existingProfile.account_id);

          // Delete auth user if exists
          if (account?.user_id) {
            await db.auth.admin.deleteUser(account.user_id);
          }
        }
      }
    }

    // Also clean up any claim verification codes for this demo
    await db
      .from("claim_verification_codes")
      .delete()
      .eq("provider_id", DEMO_PROVIDER_SLUG);

    // Clean up demo family profile and its connections
    const { data: oldFamilyProfile } = await db
      .from("business_profiles")
      .select("id")
      .eq("slug", DEMO_FAMILY_SLUG)
      .maybeSingle();

    if (oldFamilyProfile) {
      await db
        .from("connections")
        .delete()
        .or(`from_profile_id.eq.${oldFamilyProfile.id},to_profile_id.eq.${oldFamilyProfile.id}`);

      await db
        .from("business_profiles")
        .delete()
        .eq("id", oldFamilyProfile.id);
    }

    // Clean up demo reviews (by provider slug)
    await db
      .from("reviews")
      .delete()
      .eq("provider_id", DEMO_PROVIDER_SLUG);

    // Clean up demo questions (by provider slug)
    await db
      .from("provider_questions")
      .delete()
      .eq("provider_id", DEMO_PROVIDER_SLUG);

    // 3. Create fresh unclaimed demo provider with full data
    const { data: newProfile, error: insertErr } = await db
      .from("business_profiles")
      .insert({
        ...DEMO_PROFILE_DATA,
        email: customEmail, // Must match test email for claim to complete
      })
      .select("id, slug")
      .single();

    if (insertErr) {
      return NextResponse.json(
        { error: "Failed to create demo provider: " + insertErr.message },
        { status: 500 }
      );
    }

    // 4. Create demo family profile (for inbox message sender)
    const { data: familyProfile } = await db
      .from("business_profiles")
      .insert(DEMO_FAMILY_DATA)
      .select("id")
      .single();

    // 5. Create demo connection/inquiry (inbox message)
    if (familyProfile && newProfile) {
      await db.from("connections").insert({
        type: "inquiry",
        status: "pending",
        from_profile_id: familyProfile.id,
        to_profile_id: newProfile.id,
        message: JSON.stringify(DEMO_INBOX_MESSAGE),
        metadata: {
          demo: true,
          auto_intro: "Looking for memory care for parent",
          thread: [
            {
              from_profile_id: familyProfile.id,
              text: DEMO_INBOX_MESSAGE.message,
              created_at: new Date().toISOString(),
              type: "initial_inquiry",
            },
          ],
        },
      });
    }

    // 6. Create demo review
    await db.from("reviews").insert({
      ...DEMO_REVIEW,
      provider_id: DEMO_PROVIDER_SLUG,
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
    });

    // 7. Create demo Q&A question
    await db.from("provider_questions").insert({
      ...DEMO_QUESTION,
      provider_id: DEMO_PROVIDER_SLUG,
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    });

    return NextResponse.json({
      status: "reset",
      message: "Demo reset complete with seeded data. Provider is ready to be claimed.",
      profile: newProfile,
      claimUrl: `/provider/${DEMO_PROVIDER_SLUG}/onboard`,
      seededData: {
        inboxMessage: "1 message from Margaret Thompson",
        review: "1 review from John M. (5 stars)",
        question: "1 Q&A question from Sarah W.",
      },
    });
  } catch (err) {
    console.error("Reset demo error:", err);
    return NextResponse.json(
      { error: "Internal server error: " + (err instanceof Error ? err.message : String(err)) },
      { status: 500 }
    );
  }
}
