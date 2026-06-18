import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { generateUniqueSlug } from "@/lib/slug";
import {
  ELIGIBILITY_COMPLETED_KEY,
  DEMAND_PROFILE_KEY,
  type DemandProfile,
} from "@/lib/medjobs/eligibility";

/**
 * POST /api/provider/guest
 *
 * Provisions a MedJobs "guest" provider for an already-established ANONYMOUS
 * Supabase session (the client calls supabase.auth.signInAnonymously() first,
 * which sets the auth cookies). We verify the caller really is anonymous from
 * those cookies, then service-role-create their account + a guest
 * business_profile so they can use the Hire Caregivers board immediately.
 *
 * SAFETY: the profile is created is_active=false + claim_state="unclaimed" with
 * metadata.is_guest=true, so every existing visibility filter (power pages need
 * claimed+active; families feed/sitemaps need active) hides it. "Finish setup"
 * later links a real email + flips these. A TTL cron purges stale guests.
 *
 * Body: { demandProfile?: DemandProfile, orgName?: string }
 * Returns: 200 { profileId } | 401 not signed in | 403 not anonymous | 500
 */
export async function POST(request: Request) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
      console.error("[provider/guest] Missing SUPABASE_SERVICE_ROLE_KEY");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    // 1. The caller must be a freshly anonymous user (read from cookies, not
    //    trusted from the body — prevents provisioning for an arbitrary user).
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }
    if (!user.is_anonymous) {
      return NextResponse.json(
        { error: "This endpoint is only for guest (anonymous) sessions." },
        { status: 403 },
      );
    }

    const body = (await request.json().catch(() => ({}))) as {
      demandProfile?: DemandProfile;
      orgName?: string;
    };
    const orgName = (body.orgName || "").trim();
    const displayName = orgName || "Guest";

    const admin = createAdminClient(url, serviceKey);

    // 2. Get or create the account for this anonymous user (idempotent).
    let accountId: string;
    const { data: existingAccount } = await admin
      .from("accounts")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingAccount) {
      accountId = existingAccount.id;
    } else {
      // Account display_name = "Guest" so the nav avatar/menu reads "Guest"
      // (the nav keys off account.display_name). The typed org name lives on
      // the profile and gets promoted on "Finish setup".
      const { data: newAccount, error: accErr } = await admin
        .from("accounts")
        .insert({ user_id: user.id, display_name: "Guest", onboarding_completed: true })
        .select("id")
        .single();
      if (accErr || !newAccount) {
        console.error("[provider/guest] account creation error:", accErr);
        return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
      }
      accountId = newAccount.id;
    }

    // 3. Idempotent: if this account already has a provider profile, reuse it.
    const { data: existingProfile } = await admin
      .from("business_profiles")
      .select("id")
      .eq("account_id", accountId)
      .in("type", ["organization", "caregiver"])
      .limit(1)
      .maybeSingle();

    if (existingProfile) {
      await admin
        .from("accounts")
        .update({ active_profile_id: existingProfile.id })
        .eq("id", accountId);
      return NextResponse.json({ profileId: existingProfile.id });
    }

    // 4. Build eligible-guest metadata so the board treats them like a provider
    //    who completed the screener (match labels + banner), nothing more.
    const metadata: Record<string, unknown> = {
      is_guest: true,
      [ELIGIBILITY_COMPLETED_KEY]: new Date().toISOString(),
    };
    if (body.demandProfile) metadata[DEMAND_PROFILE_KEY] = body.demandProfile;

    const slug = await generateUniqueSlug(admin, orgName || "guest", "", "");

    // 5. Create the guest profile — INACTIVE + UNCLAIMED so existing filters
    //    keep it out of the directory, student feeds, sitemaps, and outreach.
    const { data: profile, error: insertErr } = await admin
      .from("business_profiles")
      .insert({
        account_id: accountId,
        slug,
        type: "organization",
        display_name: displayName,
        claim_state: "unclaimed",
        verification_state: "unverified",
        source: "medjobs_guest",
        is_active: false,
        metadata,
      } as Record<string, unknown>)
      .select("id")
      .single();

    if (insertErr || !profile) {
      console.error("[provider/guest] profile creation error:", insertErr);
      return NextResponse.json({ error: "Failed to create guest profile" }, { status: 500 });
    }

    // 6. Membership (free) + set as the active profile.
    const { data: existingMembership } = await admin
      .from("memberships")
      .select("id")
      .eq("account_id", accountId)
      .limit(1);
    if (!existingMembership || existingMembership.length === 0) {
      await admin.from("memberships").insert({ account_id: accountId, plan: "free", status: "free" });
    }

    await admin
      .from("accounts")
      .update({ active_profile_id: profile.id, onboarding_completed: true })
      .eq("id", accountId);

    return NextResponse.json({ profileId: profile.id });
  } catch (err) {
    console.error("[provider/guest] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
