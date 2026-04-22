import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const DEMO_PROVIDER_SLUG = "sunrise-care-demo";
const DEMO_PROVIDER_NAME = "Sunrise Care Demo";
const DEMO_EMAIL = "esther+suspicious@gmail.com";

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
      "id, slug, display_name, claim_state, verification_state, claim_trust_level, account_id, source"
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
    // 0. Clean up any existing auth user with the demo email
    // This handles cases where the email was used in previous tests
    const { data: authUsers } = await db.auth.admin.listUsers();
    const demoAuthUser = authUsers?.users?.find(
      (u) => u.email === DEMO_EMAIL
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

    // 1. Find existing demo profile
    const { data: existingProfile } = await db
      .from("business_profiles")
      .select("id, account_id")
      .eq("slug", DEMO_PROVIDER_SLUG)
      .maybeSingle();

    // 2. Delete existing demo data
    if (existingProfile) {
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

    // 3. Create fresh unclaimed demo provider
    const { data: newProfile, error: insertErr } = await db
      .from("business_profiles")
      .insert({
        slug: DEMO_PROVIDER_SLUG,
        type: "organization",
        display_name: DEMO_PROVIDER_NAME,
        description:
          "A family-owned senior care facility providing compassionate care since 1985. We offer assisted living, memory care, and respite services in a warm, home-like environment.",
        city: "Austin",
        state: "TX",
        category: "Assisted Living",
        care_types: ["Assisted Living", "Memory Care", "Respite Care"],
        phone: "(512) 555-0123",
        email: "esther+suspicious@gmail.com", // Must match test email for claim to complete
        claim_state: "unclaimed",
        verification_state: "unverified",
        source: "demo",
        is_active: true,
        metadata: {
          demo: true,
          created_for: "verification-gating-demo",
        },
      })
      .select("id, slug")
      .single();

    if (insertErr) {
      return NextResponse.json(
        { error: "Failed to create demo provider: " + insertErr.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: "reset",
      message: "Demo reset complete. Provider is ready to be claimed.",
      profile: newProfile,
      claimUrl: `/provider/${DEMO_PROVIDER_SLUG}/onboard`,
    });
  } catch (err) {
    console.error("Reset demo error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
