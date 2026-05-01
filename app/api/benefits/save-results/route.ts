import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient as createSSRServerClient } from "@supabase/ssr";
import { sendEmail, reserveEmailLogId, appendTrackingParams } from "@/lib/email";
import { sendSMS, normalizeUSPhone } from "@/lib/twilio";
import { getSiteUrl } from "@/lib/site-url";
import { generateUniqueSlugFromName } from "@/lib/slug";
import { sendSlackAlert, slackBenefitsCompleted } from "@/lib/slack";
import { validateEmailStrict } from "@/lib/email-validation";
import { generateBenefitsToken } from "@/lib/benefits-token";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getAdminClient(): any {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

// UI care need categories → granular PrimaryNeed[] from lib/types/benefits.ts
const CARE_NEED_MAP: Record<string, string[]> = {
  stayingAtHome: ["personalCare", "householdTasks", "mobilityHelp"],
  payingForCare: ["financialHelp"],
  memoryHealth: ["memoryCare", "healthManagement"],
  companionship: ["companionship"],
};

interface SavedProgramInput {
  programId: string;
  stateId: string;
  name: string;
  shortName?: string;
  programType?: string;
  savingsRange?: string;
}

interface SaveResultsPayload {
  // Intake answers
  careNeed: "stayingAtHome" | "payingForCare" | "memoryHealth" | "companionship" | null;
  age: number | null;
  medicaidStatus: "alreadyHas" | "applying" | "notSure" | "doesNotHave" | null;
  incomeRange: "under1500" | "under2500" | "under4000" | "over4000" | "preferNotToSay" | null;
  stateCode: string | null; // 2-letter (TX, MI, etc.)

  // Save payload
  firstName?: string;
  email?: string;                         // V3: optional — required only when contactChannel='email'
  phone?: string;                         // V3: required when contactChannel='sms'
  contactChannel?: "email" | "sms";       // V3: defaults to 'email' for back-compat with V2 5-step
  providerSlug?: string;                  // V3: provider page they came from, for tie-in copy on /m/{token}
  matchedPrograms: SavedProgramInput[];
  matchCount: number;
}

export async function POST(req: Request) {
  const t0 = Date.now();
  const timings: Record<string, number> = {};
  const mark = (label: string) => {
    timings[label] = Date.now() - t0;
  };

  let payload: SaveResultsPayload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  mark("parse_body");

  const {
    careNeed,
    age,
    medicaidStatus,
    incomeRange,
    stateCode,
    firstName,
    email,
    phone,
    contactChannel = "email",
    providerSlug,
    matchedPrograms,
    matchCount,
  } = payload;

  // Channel-dependent contact validation. The V3 2-step flow lets the user
  // pick email or SMS at submit; legacy V2 5-step always sent email.
  let normalizedEmail = "";
  let normalizedPhone = "";

  if (contactChannel === "sms") {
    if (!phone) {
      return NextResponse.json({ error: "Phone number is required." }, { status: 400 });
    }
    const e164 = normalizeUSPhone(phone);
    if (!e164) {
      return NextResponse.json({ error: "Please enter a valid US phone number." }, { status: 400 });
    }
    normalizedPhone = e164;
    // Email is optional on SMS path. If provided, still validate (so a stray
    // junk address doesn't pollute the profile), but don't require it.
    if (email) {
      const v = validateEmailStrict(email);
      if (v.valid) normalizedEmail = email.trim().toLowerCase();
    }
  } else {
    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }
    const v = validateEmailStrict(email);
    if (!v.valid) {
      return NextResponse.json(
        {
          error: v.error || "Please enter a valid email address.",
          suggestion: v.suggestion,
          suggestedEmail: v.suggestedEmail,
        },
        { status: 400 },
      );
    }
    normalizedEmail = email.trim().toLowerCase();
  }

  const db = getAdminClient();
  if (!db) {
    return NextResponse.json({ error: "Server configuration error." }, { status: 500 });
  }

  // Check if already authenticated AND check provider email/phone block in parallel.
  // Provider check only matters for anonymous users; authenticated users have
  // already been validated. We check by whichever contact channel was provided.
  const serverSupabase = await createServerClient();
  const providerCheckQuery = normalizedEmail
    ? db.from("business_profiles")
        .select("id, type")
        .eq("email", normalizedEmail)
        .in("type", ["organization", "caregiver", "student"])
        .limit(1)
        .maybeSingle()
    : db.from("business_profiles")
        .select("id, type")
        .eq("phone", normalizedPhone)
        .in("type", ["organization", "caregiver", "student"])
        .limit(1)
        .maybeSingle();

  const [{ data: { user: currentUser } }, { data: existingProviderProfile }] = await Promise.all([
    serverSupabase.auth.getUser(),
    providerCheckQuery,
  ]);
  mark("parallel_auth_and_provider_check");

  // Block provider emails/phones (only matters for new user creation; logged-in
  // users with existing accounts have already been validated)
  if (!currentUser && existingProviderProfile) {
    const channelLabel = normalizedEmail ? "email" : "phone number";
    return NextResponse.json(
      {
        error: `This ${channelLabel} is linked to a provider account. Please use a different ${channelLabel}.`,
        code: normalizedEmail ? "PROVIDER_EMAIL" : "PROVIDER_PHONE",
      },
      { status: 409 }
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "Server configuration error." }, { status: 500 });
  }
  const authClient = createClient(supabaseUrl, serviceKey);
  const siteUrl = getSiteUrl();

  let userId: string = "";
  let accountId: string | null = null;
  let familyProfileId: string = "";
  let accessToken: string | null = null;
  let refreshToken: string | null = null;
  let isNewUser = false;
  const hasRealName = !!firstName?.trim();
  const displayName = hasRealName ? firstName!.trim() : "Care Seeker";

  // ═══════════════════════════════════════════════════════════════════
  // 1. Resolve user: already logged in → use their account
  //    Else → create or look up by email, generate magic link session
  // ═══════════════════════════════════════════════════════════════════
  if (currentUser) {
    userId = currentUser.id;

    // Find their account (if it exists — may be null for fresh auth users)
    const { data: account } = await db
      .from("accounts")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (account) accountId = account.id;
  } else if (contactChannel === "sms") {
    // ── Anonymous SMS path ───────────────────────────────────────────────
    // Phone-based user creation. Simpler than the email path: no magic-link
    // session/cookie flow because:
    //   - The in-session overlay receives match data directly (no need to
    //     authenticate against Supabase to render it).
    //   - The user's later access via /m/{token} uses the token as auth, not
    //     a Supabase session.
    //   - SMS users can sign in fully later via standard phone OTP if they
    //     decide to engage with /portal — out of scope for v1.
    const tCreate = Date.now();
    const { data: newUser, error: createUserErr } = await authClient.auth.admin.createUser({
      phone: normalizedPhone,
      phone_confirm: false,
      user_metadata: { full_name: displayName, contact_channel: "sms" },
    });
    timings["create_user"] = Date.now() - tCreate;

    if (!createUserErr && newUser?.user) {
      userId = newUser.user.id;
      isNewUser = true;
    } else if (
      createUserErr?.message?.includes("already") ||
      createUserErr?.message?.includes("exists")
    ) {
      // Phone already has a user — for v1 we ask them to use a different
      // number or sign in. Reconciling cross-channel identities is
      // structurally complex; deferring until we see real demand.
      return NextResponse.json(
        {
          error: "This phone number is already linked to an Olera account. Please use a different number or sign in.",
          code: "PHONE_EXISTS",
        },
        { status: 409 },
      );
    } else {
      console.error("[save-results] Failed to create user (phone):", createUserErr);
      return NextResponse.json({ error: "Failed to create account." }, { status: 500 });
    }
  } else {
    // ── Anonymous email path (legacy V2 + V3 email default) ────────────
    // Try to create user
    const tCreate = Date.now();
    const { data: newUser, error: createUserErr } = await authClient.auth.admin.createUser({
      email: normalizedEmail,
      email_confirm: false,
      user_metadata: { full_name: displayName },
    });
    timings["create_user"] = Date.now() - tCreate;

    if (!createUserErr && newUser?.user) {
      userId = newUser.user.id;
      isNewUser = true;
    } else if (createUserErr?.message?.includes("already been registered") ||
               createUserErr?.message?.includes("already exists")) {
      // User exists — generate magic link to get session
      const { data: linkData } = await authClient.auth.admin.generateLink({
        type: "magiclink",
        email: normalizedEmail,
        options: { redirectTo: `${siteUrl}/portal` },
      });
      if (linkData?.properties?.hashed_token) {
        const { data: verifyData } = await authClient.auth.verifyOtp({
          token_hash: linkData.properties.hashed_token,
          type: "magiclink",
        });
        if (verifyData?.session) {
          accessToken = verifyData.session.access_token;
          refreshToken = verifyData.session.refresh_token;
          userId = verifyData.session.user?.id || "";
        }
      }
    } else {
      console.error("[save-results] Failed to create user:", createUserErr);
      return NextResponse.json({ error: "Failed to create account." }, { status: 500 });
    }

    // For new users, also generate a magic link + session so they're logged in instantly
    if (isNewUser && userId) {
      const tLink = Date.now();
      const { data: linkData } = await authClient.auth.admin.generateLink({
        type: "magiclink",
        email: normalizedEmail,
        options: { redirectTo: `${siteUrl}/portal` },
      });
      timings["generate_link_new"] = Date.now() - tLink;
      if (linkData?.properties?.hashed_token) {
        const tVerify = Date.now();
        const { data: verifyData } = await authClient.auth.verifyOtp({
          token_hash: linkData.properties.hashed_token,
          type: "magiclink",
        });
        timings["verify_otp_new"] = Date.now() - tVerify;
        if (verifyData?.session) {
          accessToken = verifyData.session.access_token;
          refreshToken = verifyData.session.refresh_token;
        }
      }
    }
  }
  mark("auth_resolved");

  if (!userId) {
    return NextResponse.json({ error: "Failed to resolve user." }, { status: 500 });
  }

  // ═══════════════════════════════════════════════════════════════════
  // 2. Ensure an `accounts` row exists for this userId.
  //    Mirror /api/connections/request: create with user_id, display_name,
  //    onboarding_completed. No email column on accounts.
  // ═══════════════════════════════════════════════════════════════════
  if (!accountId) {
    const { data: existingAccount } = await db
      .from("accounts")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (existingAccount) {
      accountId = existingAccount.id;
    } else {
      const { data: newAccount, error: accountErr } = await db
        .from("accounts")
        .insert({
          user_id: userId,
          display_name: displayName,
          onboarding_completed: false,
        })
        .select("id")
        .single();
      if (accountErr || !newAccount) {
        console.error("[save-results] Failed to create account:", accountErr);
        return NextResponse.json({ error: "Failed to create account." }, { status: 500 });
      }
      accountId = newAccount.id;
    }
  }
  mark("account_resolved");

  // ═══════════════════════════════════════════════════════════════════
  // 3. Resolve or create family profile, merge intake metadata
  // ═══════════════════════════════════════════════════════════════════
  const granularCareNeeds = careNeed ? CARE_NEED_MAP[careNeed] || [] : [];
  const stateAbbrev = stateCode?.toUpperCase() || null;

  // Sibling P2 cleanup: previously stored a duplicate `benefits_results.answers`
  // blob alongside flat metadata fields (age, care_needs, income_range,
  // medicaid_status). Nothing read it — flat fields are the canonical source
  // for /portal/profile and the welcome page. Now keeping only matchCount +
  // completed_at, which the welcome page DOES read for hero copy + funnel
  // timestamps.
  const intakeMetadata: Record<string, unknown> = {
    age: age || undefined,
    care_needs: granularCareNeeds.length > 0 ? granularCareNeeds : undefined,
    income_range: incomeRange || undefined,
    medicaid_status: medicaidStatus || undefined,
    benefits_results: {
      matchCount,
      completed_at: new Date().toISOString(),
    },
  };

  // Look up family profile by account_id
  const { data: existingFamilyProfile } = await db
    .from("business_profiles")
    .select("id, metadata")
    .eq("account_id", accountId)
    .eq("type", "family")
    .maybeSingle();

  if (existingFamilyProfile) {
    familyProfileId = existingFamilyProfile.id;
    // Merge metadata — new fields win, preserve existing ones
    const mergedMetadata = {
      ...(existingFamilyProfile.metadata || {}),
      ...Object.fromEntries(
        Object.entries(intakeMetadata).filter(([, v]) => v !== undefined)
      ),
    };
    const profileUpdate: Record<string, unknown> = {
      metadata: mergedMetadata,
      preferred_contact_channel: contactChannel,
    };
    if (stateAbbrev) profileUpdate.state = stateAbbrev;
    // Don't overwrite an existing email/phone — only fill in if missing.
    // (Caller may have submitted a different email than what's on file from
    // a prior provider-claim or save-nudge flow; preserve original to avoid
    // surprising the user.)
    if (normalizedEmail) profileUpdate.email = normalizedEmail;
    if (normalizedPhone) profileUpdate.phone = normalizedPhone;
    const { error: updateErr } = await db
      .from("business_profiles")
      .update(profileUpdate)
      .eq("id", familyProfileId);
    if (updateErr) console.error("[save-results] Failed to update family profile:", updateErr);
  } else {
    // Create new family profile
    const slug = await generateUniqueSlugFromName(db, displayName);
    const cleanedMetadata = Object.fromEntries(
      Object.entries(intakeMetadata).filter(([, v]) => v !== undefined)
    );
    const profileInsert: Record<string, unknown> = {
      account_id: accountId,
      slug,
      type: "family",
      display_name: displayName,
      state: stateAbbrev,
      claim_state: "claimed",
      verification_state: "unverified",
      source: "benefits_intake",
      metadata: cleanedMetadata,
      preferred_contact_channel: contactChannel,
    };
    if (normalizedEmail) profileInsert.email = normalizedEmail;
    if (normalizedPhone) profileInsert.phone = normalizedPhone;
    const { data: newProfile, error: createErr } = await db
      .from("business_profiles")
      .insert(profileInsert)
      .select("id")
      .single();
    if (createErr || !newProfile) {
      console.error("[save-results] Failed to create family profile:", createErr);
      return NextResponse.json({ error: "Failed to create profile." }, { status: 500 });
    }
    familyProfileId = newProfile.id;
  }
  mark("profile_resolved");

  // ═══════════════════════════════════════════════════════════════════
  // 3.5. Issue a benefits-results token for /m/{token} addressable access.
  //      Token is the auth — anyone with the URL can see this profile's
  //      matches. Used by the post-submit overlay (in-session) AND by the
  //      welcome email/SMS magic link (post-session). Skipped when we
  //      don't have enough info to render the page (no careNeed or state).
  // ═══════════════════════════════════════════════════════════════════
  let benefitsToken: string | null = null;
  if (careNeed && stateAbbrev) {
    benefitsToken = generateBenefitsToken();
    const { error: tokenErr } = await db.from("benefits_results_tokens").insert({
      token: benefitsToken,
      profile_id: familyProfileId,
      care_need: careNeed,
      state_code: stateAbbrev,
      provider_slug: providerSlug || null,
      match_count: matchCount,
    });
    if (tokenErr) {
      // Token issuance is best-effort — the in-session overlay still works
      // because it has match data passed directly. We log and continue.
      console.error("[save-results] Token issuance failed:", tokenErr);
      benefitsToken = null;
    }
  }
  mark("token_issued");

  // ═══════════════════════════════════════════════════════════════════
  // 4. Parallelize: set active profile + batch-save matching programs
  //    Both depend on familyProfileId/userId but not on each other.
  // ═══════════════════════════════════════════════════════════════════
  const programInserts = matchedPrograms.map((p) => ({
    user_id: userId,
    program_id: p.programId,
    state_id: p.stateId,
    name: p.name,
    short_name: p.shortName || null,
    program_type: p.programType || null,
    savings_range: p.savingsRange || null,
  }));

  const isNewProfile = !existingFamilyProfile;
  const [, savedProgramsResult] = await Promise.all([
    // Set active profile only if we just created one
    isNewProfile
      ? db.from("accounts").update({ active_profile_id: familyProfileId }).eq("id", accountId)
      : Promise.resolve(null),
    // Batch save programs (skip if empty)
    matchedPrograms.length > 0
      ? db.from("saved_programs").upsert(programInserts, { onConflict: "user_id,program_id", ignoreDuplicates: true })
      : Promise.resolve({ error: null }),
  ]);

  if (savedProgramsResult && "error" in savedProgramsResult && savedProgramsResult.error) {
    console.error("[save-results] Failed to batch save programs:", savedProgramsResult.error);
  }
  mark("saved_programs_done");

  // ═══════════════════════════════════════════════════════════════════
  // 5. Log seeker activity event + fire Slack alert (fire-and-forget)
  // ═══════════════════════════════════════════════════════════════════
  db.from("seeker_activity").insert({
    profile_id: familyProfileId,
    event_type: "benefits_completed",
    metadata: {
      match_count: matchCount,
      programs_saved: matchedPrograms.length,
      state: stateAbbrev,
      care_need: careNeed,
      is_new_user: isNewUser,
      top_program: matchedPrograms[0]?.shortName || matchedPrograms[0]?.name || null,
      top_savings: matchedPrograms[0]?.savingsRange || null,
    },
  }).then(({ error }: { error: { message: string } | null }) => {
    if (error) console.error("[seeker_activity] benefits_completed insert failed:", error);
  });

  // Fire Slack alert for real-time visibility
  if (matchCount > 0) {
    // Map careNeed to display label (mirrors the UI categories)
    const careNeedLabels: Record<string, string> = {
      stayingAtHome: "Staying at home",
      payingForCare: "Paying for care",
      memoryHealth: "Memory & health care",
      companionship: "Companionship & support",
    };
    const careNeedLabel = careNeed ? careNeedLabels[careNeed] || null : null;

    // Extract top savings as "Up to $X/yr" from the range string
    const topSavingsRaw = matchedPrograms[0]?.savingsRange;
    const topSavings = (() => {
      if (!topSavingsRaw) return null;
      const matches = topSavingsRaw.match(/\$[\d,]+/g);
      if (!matches || matches.length === 0) return null;
      return `up to ${matches[matches.length - 1]}/yr`;
    })();

    // Slack alert lists the actual contact (email if email-path, phone if SMS).
    // The helper's `email` field is the contact display — we pass whichever
    // channel the user chose. Refining the helper to know about channel is
    // out of scope for this PR.
    const alert = slackBenefitsCompleted({
      familyName: displayName,
      email: normalizedEmail || normalizedPhone || "(no contact)",
      stateCode: stateAbbrev,
      careNeedLabel,
      age: age || null,
      medicaidStatus: medicaidStatus || null,
      incomeRange: incomeRange || null,
      matchCount,
      topProgramName: matchedPrograms[0]?.shortName || matchedPrograms[0]?.name || null,
      topSavings,
      isNewUser,
    });
    sendSlackAlert(alert.text, alert.blocks).catch((err) => {
      console.error("[save-results] Slack alert failed:", err);
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // 6. Send welcome notification — TRULY fire-and-forget so the response
  //    doesn't wait on Resend (~500-1500ms) / Twilio (~200-800ms).
  //
  //    Channel selection follows what the user picked at submit:
  //      - 'email' → Resend magic-link email (existing pattern)
  //      - 'sms'   → Twilio SMS with /m/{token} short link
  //
  //    For SMS users without a token (rare — careNeed or state missing),
  //    we skip the SMS rather than send a broken link.
  //
  //    Email body content upgrade (state-filtered starter list) is Phase 6
  //    of the plan — for now we keep the existing generic body.
  // ═══════════════════════════════════════════════════════════════════
  if (isNewUser && contactChannel === "email" && normalizedEmail) {
    (async () => {
      try {
        const { data: linkData } = await authClient.auth.admin.generateLink({
          type: "magiclink",
          email: normalizedEmail,
          options: { redirectTo: `${siteUrl}/portal` },
        });
        const actionLink = linkData?.properties?.action_link;
        if (!actionLink) return;

        const emailLogId = await reserveEmailLogId({
          to: normalizedEmail,
          subject: "Your Olera benefits results are saved",
          emailType: "benefits_results_saved",
          recipientType: "family",
        });
        const trackedLink = appendTrackingParams(actionLink, emailLogId);
        await sendEmail({
          to: normalizedEmail,
          subject: "Your Olera benefits results are saved",
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
              <h2 style="font-size: 22px; margin: 0 0 16px;">Hi ${hasRealName ? displayName : "there"},</h2>
              <p style="font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                You just explored benefits programs your family may qualify for on Olera. We saved ${matchCount} matching ${matchCount === 1 ? "program" : "programs"} to your profile.
              </p>
              <p style="font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Click below to come back anytime:
              </p>
              <a href="${trackedLink}" style="display: inline-block; background: #111827; color: white; padding: 12px 24px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 15px;">
                View my saved benefits →
              </a>
              <p style="font-size: 13px; color: #6b7280; margin-top: 32px;">
                This link will log you in instantly — no password needed. It works for 24 hours.
              </p>
            </div>
          `,
          emailLogId: emailLogId ?? undefined,
        });
      } catch (emailErr) {
        console.error("[save-results] Failed to send welcome email:", emailErr);
      }
    })();
  } else if (isNewUser && contactChannel === "sms" && normalizedPhone && benefitsToken) {
    (async () => {
      const programWord = matchCount === 1 ? "program" : "programs";
      const url = `${siteUrl}/m/${benefitsToken}`;
      const body = `Olera: We found ${matchCount} care benefit ${programWord} for your family. View: ${url} Reply STOP to opt out.`;
      const result = await sendSMS({ to: normalizedPhone, body });
      if (!result.success) {
        console.error("[save-results] SMS send failed:", result.error);
        // Twilio error 21610 = recipient texted STOP previously. Update profile.
        if (result.error?.includes("21610")) {
          await db
            .from("business_profiles")
            .update({ phone_validity: "opted_out" })
            .eq("id", familyProfileId);
        }
      }
    })();
  }

  // ═══════════════════════════════════════════════════════════════════
  // 7. Write session cookies to the response so the client is instantly
  //    authenticated without a client-side setSession() network call.
  //
  //    Client-side setSession() hits the Supabase auth endpoint to verify
  //    the token (via GET /auth/v1/user). From the user's browser this
  //    can take 5-6 seconds (Brave shields, regional latency, etc). By
  //    doing it server-side we leverage the fast Vercel↔Supabase region
  //    path and the cookies are already set when the welcome page loads.
  // ═══════════════════════════════════════════════════════════════════
  const response = NextResponse.json({
    success: true,
    profileId: familyProfileId,
    userId,
    isNewUser,
    matchCount,
    programsSaved: matchedPrograms.length,
    token: benefitsToken,
    contactChannel,
  });

  if (accessToken && refreshToken) {
    const tCookies = Date.now();
    try {
      const cookieWriter = createSSRServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll: () => [],
            setAll: (cookiesToSet: { name: string; value: string; options: Record<string, unknown> }[]) => {
              cookiesToSet.forEach((c) => {
                response.cookies.set(c.name, c.value, c.options);
              });
            },
          },
        }
      );
      await cookieWriter.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      timings["write_session_cookies"] = Date.now() - tCookies;
    } catch (err) {
      console.error("[save-results] Failed to write session cookies:", err);
      timings["write_session_cookies"] = Date.now() - tCookies;
    }
  }

  mark("response_ready");
  console.log("[save-results][timings]", JSON.stringify({
    total_ms: Date.now() - t0,
    isNewUser,
    ...timings,
  }));
  return response;
}
