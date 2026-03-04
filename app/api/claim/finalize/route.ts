import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { generateProviderSlug } from "@/lib/slugify";
import { sendEmail } from "@/lib/email";
import { claimNotificationEmail } from "@/lib/email-templates";
import { sendSlackAlert, slackProviderClaimed } from "@/lib/slack";
import { sendLoopsEvent } from "@/lib/loops";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

/**
 * POST /api/claim/finalize
 *
 * Finalizes a provider claim after verification.
 * Requires authentication — links the verified provider to the user's account.
 *
 * Request body: { providerId: string, claimSession: string }
 * Returns: { success: true, profileSlug: string } or error
 */
export async function POST(request: Request) {
  try {
    // Require authentication
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { providerId, claimSession } = body;

    if (!providerId || !claimSession) {
      return NextResponse.json(
        { error: "Provider ID and claim session are required." },
        { status: 400 }
      );
    }

    if (!UUID_RE.test(claimSession)) {
      return NextResponse.json({ error: "Invalid claim session." }, { status: 400 });
    }

    const db = getAdminClient();
    if (!db) {
      return NextResponse.json({ error: "Server configuration error." }, { status: 500 });
    }

    // 1. Verify that a valid, verified claim_session exists
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: verifiedCode } = await db
      .from("claim_verification_codes")
      .select("id")
      .eq("provider_id", providerId)
      .eq("claim_session", claimSession)
      .not("verified_at", "is", null)
      .gt("verified_at", oneHourAgo)
      .limit(1)
      .maybeSingle();

    if (!verifiedCode) {
      return NextResponse.json(
        { error: "Verification required or expired. Please verify again." },
        { status: 403 }
      );
    }

    // 2. Ensure user has an account
    let { data: account } = await db
      .from("accounts")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!account) {
      const { data: newAccount, error: accountErr } = await db
        .from("accounts")
        .insert({
          user_id: user.id,
          display_name: user.email?.split("@")[0] || "",
          onboarding_completed: false,
        })
        .select("id")
        .single();

      if (accountErr) {
        // Handle race condition
        if (accountErr.code === "23505") {
          const { data: raceAccount } = await db
            .from("accounts")
            .select("id")
            .eq("user_id", user.id)
            .single();
          account = raceAccount;
        }
        if (!account) {
          console.error("Failed to create account:", accountErr);
          return NextResponse.json({ error: "Failed to create account." }, { status: 500 });
        }
      } else {
        account = newAccount;
      }
    }

    const accountId = account!.id as string;

    // Ensure baseline family profile exists
    const { data: existingFamily } = await db
      .from("business_profiles")
      .select("id")
      .eq("account_id", accountId)
      .eq("type", "family")
      .limit(1)
      .maybeSingle();

    if (!existingFamily) {
      await db.from("business_profiles").insert({
        account_id: accountId,
        slug: `family-${accountId.slice(0, 8)}`,
        type: "family",
        display_name: user.email?.split("@")[0] || "My Family",
        claim_state: "claimed",
        visibility: false,
      });
    }

    // 3. Check if business_profile already exists for this provider
    const { data: existingProfile } = await db
      .from("business_profiles")
      .select("id, claim_state, account_id, slug")
      .eq("source_provider_id", providerId)
      .maybeSingle();

    let profileSlug: string;

    if (existingProfile) {
      if (existingProfile.claim_state === "claimed" && existingProfile.account_id) {
        return NextResponse.json(
          { error: "This listing has already been claimed." },
          { status: 409 }
        );
      }
      // Update existing unclaimed profile
      const { error: updateErr } = await db
        .from("business_profiles")
        .update({ account_id: accountId, claim_state: "claimed" })
        .eq("id", existingProfile.id);

      if (updateErr) {
        console.error("Failed to update profile:", updateErr);
        return NextResponse.json({ error: "Failed to claim listing." }, { status: 500 });
      }
      profileSlug = existingProfile.slug;
    } else {
      // Create new business_profile from olera-providers data
      const { data: provider } = await db
        .from("olera-providers")
        .select("*")
        .eq("provider_id", providerId)
        .single();

      if (!provider) {
        return NextResponse.json({ error: "Provider not found." }, { status: 404 });
      }

      profileSlug =
        provider.slug || generateProviderSlug(provider.provider_name, provider.state);

      const { error: insertErr } = await db.from("business_profiles").insert({
        account_id: accountId,
        source_provider_id: providerId,
        slug: profileSlug,
        type: "organization",
        display_name: provider.provider_name,
        description: provider.provider_description,
        image_url: provider.hero_image_url || provider.provider_logo,
        phone: provider.phone,
        email: provider.email,
        website: provider.website,
        address: provider.address,
        city: provider.city,
        state: provider.state,
        zip: provider.zipcode?.toString() || null,
        claim_state: "claimed",
        verification_state: "verified",
        source: "seeded",
        is_active: true,
      });

      if (insertErr) {
        console.error("Failed to create profile:", insertErr);
        return NextResponse.json({ error: "Failed to create listing." }, { status: 500 });
      }
    }

    // 4. Mark account onboarding as completed
    await db
      .from("accounts")
      .update({ onboarding_completed: true })
      .eq("id", accountId);

    // 5. Clean up verification codes
    await db
      .from("claim_verification_codes")
      .delete()
      .eq("provider_id", providerId)
      .eq("claim_session", claimSession);

    // 6. Notify admin team about the claim (fire-and-forget)
    try {
      const { data: claimedProfile } = await db
        .from("business_profiles")
        .select("display_name")
        .eq("source_provider_id", providerId)
        .single();

      const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
      if (adminEmail) {
        await sendEmail({
          to: adminEmail,
          subject: `Provider claimed: ${claimedProfile?.display_name || providerId}`,
          html: claimNotificationEmail({
            providerName: claimedProfile?.display_name || providerId,
            providerSlug: profileSlug,
            claimedByEmail: user.email || "unknown",
          }),
        });
      }
    } catch (emailErr) {
      console.error("[claim/finalize] admin notification failed:", emailErr);
    }

    // 6b. Slack alert (fire-and-forget)
    try {
      const { data: claimedBp } = await db
        .from("business_profiles")
        .select("display_name")
        .eq("source_provider_id", providerId)
        .single();

      const alert = slackProviderClaimed({
        providerName: claimedBp?.display_name || providerId,
        claimedByEmail: user.email || "unknown",
        providerSlug: profileSlug,
      });
      await sendSlackAlert(alert.text, alert.blocks);
    } catch {
      // Non-blocking
    }

    // 6c. Loops: provider claimed (fire-and-forget)
    try {
      const { data: loopsBp } = await db
        .from("business_profiles")
        .select("display_name")
        .eq("source_provider_id", providerId)
        .single();

      sendLoopsEvent({
        email: user.email || "",
        eventName: "provider_claimed",
        audience: "provider",
        eventProperties: {
          providerName: loopsBp?.display_name || providerId,
        },
        contactProperties: {
          userType: "provider",
        },
      });
    } catch {
      // Non-blocking
    }

    return NextResponse.json({ success: true, profileSlug });
  } catch (err) {
    console.error("Finalize claim error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
