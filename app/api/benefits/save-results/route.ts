import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail, reserveEmailLogId, appendTrackingParams } from "@/lib/email";
import { getSiteUrl } from "@/lib/site-url";
import { generateUniqueSlugFromName } from "@/lib/slug";
import { sendSlackAlert, slackBenefitsCompleted } from "@/lib/slack";

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
  firstName: string;
  email: string;
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

  const { careNeed, age, medicaidStatus, incomeRange, stateCode, firstName, email, matchedPrograms, matchCount } = payload;

  // Validate required fields
  if (!email || !firstName) {
    return NextResponse.json({ error: "First name and email are required." }, { status: 400 });
  }
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail.includes("@")) {
    return NextResponse.json({ error: "Invalid email." }, { status: 400 });
  }

  const db = getAdminClient();
  if (!db) {
    return NextResponse.json({ error: "Server configuration error." }, { status: 500 });
  }

  // Check if already authenticated AND check provider email block in parallel
  // (the provider check only matters if the user is anonymous — we'll skip it for logged-in users)
  const serverSupabase = await createServerClient();
  const [{ data: { user: currentUser } }, { data: existingProviderProfile }] = await Promise.all([
    serverSupabase.auth.getUser(),
    db.from("business_profiles")
      .select("id, type")
      .eq("email", normalizedEmail)
      .in("type", ["organization", "caregiver", "student"])
      .limit(1)
      .maybeSingle(),
  ]);
  mark("parallel_auth_and_provider_check");

  // Block provider emails (only matters for new user creation; logged-in users with
  // existing accounts have already been validated)
  if (!currentUser && existingProviderProfile) {
    return NextResponse.json(
      {
        error: "This email is linked to a provider account. Please use a different email.",
        code: "PROVIDER_EMAIL",
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
  const displayName = firstName.trim() || "Care Seeker";

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
  } else {
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

  const intakeMetadata: Record<string, unknown> = {
    age: age || undefined,
    care_needs: granularCareNeeds.length > 0 ? granularCareNeeds : undefined,
    income_range: incomeRange || undefined,
    medicaid_status: medicaidStatus || undefined,
    benefits_results: {
      answers: { careNeed, age, medicaidStatus, incomeRange, stateCode: stateAbbrev },
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
    const { error: updateErr } = await db
      .from("business_profiles")
      .update({
        metadata: mergedMetadata,
        ...(stateAbbrev ? { state: stateAbbrev } : {}),
      })
      .eq("id", familyProfileId);
    if (updateErr) console.error("[save-results] Failed to update family profile:", updateErr);
  } else {
    // Create new family profile
    const slug = await generateUniqueSlugFromName(db, displayName);
    const cleanedMetadata = Object.fromEntries(
      Object.entries(intakeMetadata).filter(([, v]) => v !== undefined)
    );
    const { data: newProfile, error: createErr } = await db
      .from("business_profiles")
      .insert({
        account_id: accountId,
        email: normalizedEmail,
        slug,
        type: "family",
        display_name: displayName,
        state: stateAbbrev,
        claim_state: "claimed",
        verification_state: "unverified",
        source: "benefits_intake",
        metadata: cleanedMetadata,
      })
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

    const alert = slackBenefitsCompleted({
      familyName: displayName,
      email: normalizedEmail,
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
  // 6. Send magic link email — TRULY fire-and-forget so the response
  //    doesn't wait on Resend (~500-1500ms) or another generateLink (~200-400ms)
  // ═══════════════════════════════════════════════════════════════════
  if (isNewUser) {
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
              <h2 style="font-size: 22px; margin: 0 0 16px;">Hi ${displayName},</h2>
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
  }

  // ═══════════════════════════════════════════════════════════════════
  // 7. Return session tokens so client can log in instantly
  // ═══════════════════════════════════════════════════════════════════
  mark("response_ready");
  console.log("[save-results][timings]", JSON.stringify({
    total_ms: Date.now() - t0,
    isNewUser,
    ...timings,
  }));
  return NextResponse.json({
    success: true,
    profileId: familyProfileId,
    userId,
    isNewUser,
    matchCount,
    programsSaved: matchedPrograms.length,
    session: accessToken && refreshToken ? { accessToken, refreshToken } : null,
  });
}
