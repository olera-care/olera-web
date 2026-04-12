import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail, reserveEmailLogId, appendTrackingParams } from "@/lib/email";
import { getSiteUrl } from "@/lib/site-url";
import { generateUniqueSlugFromName } from "@/lib/slug";

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
  let payload: SaveResultsPayload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

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

  // Block provider emails from being used as family accounts
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

  // Check if already authenticated
  const serverSupabase = await createServerClient();
  const { data: { user: currentUser } } = await serverSupabase.auth.getUser();

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

    // Find their account
    const { data: account } = await db
      .from("accounts")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (account) accountId = account.id;
  } else {
    // Try to create user
    const { data: newUser, error: createUserErr } = await authClient.auth.admin.createUser({
      email: normalizedEmail,
      email_confirm: false,
      user_metadata: { full_name: displayName },
    });

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
        }
      }
    }
  }

  if (!userId) {
    return NextResponse.json({ error: "Failed to resolve user." }, { status: 500 });
  }

  // ═══════════════════════════════════════════════════════════════════
  // 2. Resolve account: if not found, create one
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
        .insert({ user_id: userId, email: normalizedEmail, display_name: displayName })
        .select("id")
        .single();
      if (accountErr || !newAccount) {
        console.error("[save-results] Failed to create account:", accountErr);
        return NextResponse.json({ error: "Failed to create account." }, { status: 500 });
      }
      accountId = newAccount.id;
    }
  }

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

  // ═══════════════════════════════════════════════════════════════════
  // 4. Batch-save matching programs to saved_programs
  // ═══════════════════════════════════════════════════════════════════
  if (matchedPrograms.length > 0) {
    const inserts = matchedPrograms.map((p) => ({
      user_id: userId,
      program_id: p.programId,
      state_id: p.stateId,
      name: p.name,
      short_name: p.shortName || null,
      program_type: p.programType || null,
      savings_range: p.savingsRange || null,
    }));
    const { error: saveErr } = await db
      .from("saved_programs")
      .upsert(inserts, { onConflict: "user_id,program_id", ignoreDuplicates: true });
    if (saveErr) console.error("[save-results] Failed to batch save programs:", saveErr);
  }

  // ═══════════════════════════════════════════════════════════════════
  // 5. Log seeker activity event (fire-and-forget)
  // ═══════════════════════════════════════════════════════════════════
  db.from("seeker_activity").insert({
    profile_id: familyProfileId,
    event_type: "benefits_intake_completed",
    metadata: {
      match_count: matchCount,
      programs_saved: matchedPrograms.length,
      state: stateAbbrev,
      care_need: careNeed,
      is_new_user: isNewUser,
    },
  }).then(({ error }: { error: { message: string } | null }) => {
    if (error) console.error("[seeker_activity] benefits_intake_completed insert failed:", error);
  });

  // ═══════════════════════════════════════════════════════════════════
  // 6. Send magic link email so they can come back (fire-and-forget)
  // ═══════════════════════════════════════════════════════════════════
  if (isNewUser) {
    try {
      const { data: linkData } = await authClient.auth.admin.generateLink({
        type: "magiclink",
        email: normalizedEmail,
        options: { redirectTo: `${siteUrl}/portal` },
      });
      const actionLink = linkData?.properties?.action_link;
      if (actionLink) {
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
      }
    } catch (emailErr) {
      console.error("[save-results] Failed to send welcome email:", emailErr);
      // Non-fatal — save succeeded
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // 7. Return session tokens so client can log in instantly
  // ═══════════════════════════════════════════════════════════════════
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
