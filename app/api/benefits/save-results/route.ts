import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient as createSSRServerClient } from "@supabase/ssr";
import { sendEmail, reserveEmailLogId, appendTrackingParams } from "@/lib/email";
import { sendSMS, normalizeUSPhone } from "@/lib/twilio";
import { benefitsResultsSms } from "@/lib/sms/templates";
import { getSiteUrl } from "@/lib/site-url";
import { generateUniqueSlugFromName } from "@/lib/slug";
import { sendSlackAlert, slackBenefitsCompleted } from "@/lib/slack";
import { validateEmailStrict } from "@/lib/email-validation";
import { generateBenefitsToken } from "@/lib/benefits-token";
import { getStateSlug } from "@/lib/program-data";
import { calculateFamilyCompleteness } from "@/lib/admin/profile-completeness";
import { emailReturningUserSignInLink } from "@/lib/auth/returning-user";

// ─── Email + SMS body helpers ────────────────────────────────────────────
//
// Pulled out of the route handler so the welcome-message construction is
// readable. All pure string-building — no DB or network.

const CARE_NEED_LABEL_FOR_COPY: Record<string, string> = {
  stayingAtHome: "in-home care",
  payingForCare: "paying for care",
  memoryHealth: "memory & medical care",
  companionship: "caregiver & social support",
};

function relationshipFamilyPhrase(rel: string | null | undefined): string {
  switch (rel) {
    case "my-parent":
      return "your parent";
    case "my-spouse":
      return "your spouse";
    case "myself":
      return "you";
    case "other-family":
      return "your family member";
    default:
      return "your family";
  }
}

function relationshipPossessive(rel: string | null | undefined): string {
  switch (rel) {
    case "my-parent":
      return "Your parent's";
    case "my-spouse":
      return "Your spouse's";
    case "myself":
      return "Your";
    case "other-family":
      return "Your family's";
    default:
      return "Your";
  }
}

/** Convert the V3 enum to a natural-language value compatible with the
 *  existing FamilyMetadata.relationship_to_recipient field. The /portal/profile
 *  page, admin/care-seekers view, CarePostSidebar, ProfileEditWizard, etc.
 *  all read this field for the "Who needs care" display. Writing here keeps
 *  V3 family profiles visually complete on the existing UI without touching
 *  any consumer. */
function relationshipDisplayName(rel: string | null | undefined): string | null {
  switch (rel) {
    case "my-parent":
      return "Parent";
    case "my-spouse":
      return "Spouse";
    case "myself":
      return "Self";
    case "other-family":
      return "Family member";
    default:
      return null;
  }
}

/** Derive a display state name from a 2-letter abbreviation. Falls back to
 *  the abbreviation itself when the slug lookup fails (rare — covers
 *  territories or invalid input). */
function stateDisplayName(stateAbbrev: string | null): string {
  if (!stateAbbrev) return "your state";
  const slug = getStateSlug(stateAbbrev);
  if (!slug) return stateAbbrev;
  return slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " ");
}

/** Pull the upper-bound dollar string from a savingsRange like
 *  "$10,000 – $30,000/year" → "$30,000/year". Returns null when no $ found. */
function topSavingsCopy(range: string | undefined): string | null {
  if (!range) return null;
  const matches = range.match(/\$[\d,]+/g);
  if (!matches || matches.length === 0) return null;
  const top = matches[matches.length - 1];
  const period = /\bmo\b|month/i.test(range) ? "/mo" : "/yr";
  return `Up to ${top}${period}`;
}

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
  phone?: string;                         // V3: required when contactChannel='sms'; optional bonus on email path
  contactChannel?: "email" | "sms";       // V3: defaults to 'email' for back-compat with V2 5-step
  providerSlug?: string;                  // V3: provider page they came from, for tie-in copy on /m/{token}
  /** V3: who care is for. Drives personalization on /m/{token} + welcome
   *  email + downstream re-engagement copy. Optional — falls back to
   *  generic copy when missing. */
  relationship?: "my-parent" | "my-spouse" | "myself" | "other-family";
  /** Path of the page where the user submitted the intake. Editorial mounts
   *  pass `/caregiver-support/{slug}`; provider-page mounts leave undefined.
   *  Persisted to accounts.signup_source so downstream conversion analysis
   *  can segment by entry page. */
  entrySource?: string;
  /** Anonymous session id from lib/analytics/session.ts. Persisted to
   *  accounts.session_id so the admin Family Intake drill-in can join an
   *  account back to its impression / started events on provider_activity. */
  sessionId?: string;
  /** UTM attribution from a managed-ads landing link
   *  (`utm_source=olera_managed&utm_campaign=<tag>`). Persisted to the
   *  benefits_completed event metadata so families delivered by a paid Ad Boost
   *  campaign can be attributed back to it (see /admin/ad-boost). */
  utmSource?: string;
  utmCampaign?: string;
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
    relationship,
    entrySource,
    sessionId,
    utmSource,
    utmCampaign,
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
    // V3 email path also accepts an optional phone — captures bonus signal
    // and enables a follow-up SMS if the user wants both. Validate format
    // only when provided; ignore silently if it doesn't normalize (don't
    // 400 the whole submission for a bad bonus field).
    if (phone) {
      const e164 = normalizeUSPhone(phone);
      if (e164) normalizedPhone = e164;
    }
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
  let existingUser = false;
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
      // SECURITY: existing account. Never mint a session for a caller-supplied
      // email (account takeover). Email a magic link instead; the saved results
      // still attach to their account via the resolved userId.
      const { userId: existingUserId } = await emailReturningUserSignInLink(authClient, {
        email: normalizedEmail,
        nextPath: "/portal",
      });
      userId = existingUserId || "";
      existingUser = true;
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
          signup_source: entrySource || null,
          session_id: sessionId || null,
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

  // Sibling P2 cleanup (partial): previously stored a duplicate
  // `benefits_results.answers` blob with age/medicaidStatus/incomeRange/
  // stateCode that all had flat-metadata equivalents — those are dropped.
  //
  // We keep a MINIMAL answers blob with just `careNeed` because:
  //   - The UI care-need bucket ('payingForCare', 'stayingAtHome', etc.) has
  //     NO flat-metadata equivalent (top-level care_needs is the granular
  //     array we map TO from careNeed).
  //   - components/welcome/WelcomeClient.tsx reads benefits_results.answers
  //     .careNeed for the careNeedLabel switch and the
  //     careNeedProviderCategory mapping. Removing it entirely broke the
  //     welcome page for V3 users who arrive via the "See full list" CTA.
  //
  // Storing it ONCE here (not at top level) keeps a single source of truth
  // and matches the V2-era schema, so existing V2 family profiles continue
  // to render correctly without backfill.
  // Mirror the V3 enum to the existing free-form display field so every
  // existing consumer of `relationship_to_recipient` (the /portal/profile
  // "Who needs care" row, admin/care-seekers view, CarePostSidebar,
  // ProfileEditWizard, completeness scorer) lights up with V3 data —
  // no consumer changes needed. We keep `relationship` (enum) too for
  // our internal personalization logic; the display field is downstream.
  const relationshipDisplay = relationshipDisplayName(relationship);

  const intakeMetadata: Record<string, unknown> = {
    age: age || undefined,
    care_needs: granularCareNeeds.length > 0 ? granularCareNeeds : undefined,
    income_range: incomeRange || undefined,
    medicaid_status: medicaidStatus || undefined,
    // V3 enum — internal use (welcome email phrases, /m/{token} hero copy)
    relationship: relationship || undefined,
    // Display value — what /portal/profile and admin pages render
    relationship_to_recipient: relationshipDisplay || undefined,
    benefits_results: {
      answers: careNeed ? { careNeed } : undefined,
      matchCount,
      completed_at: new Date().toISOString(),
    },
  };

  // Look up family profile by account_id (include fields needed for completeness calculation)
  const { data: existingFamilyProfile } = await db
    .from("business_profiles")
    .select("id, metadata, display_name, image_url, city, phone, email, description, care_types")
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

    // Calculate profile completeness with merged data
    const completeness = calculateFamilyCompleteness(
      {
        display_name: existingFamilyProfile.display_name,
        image_url: existingFamilyProfile.image_url,
        city: existingFamilyProfile.city,
        phone: normalizedPhone || existingFamilyProfile.phone,
        description: existingFamilyProfile.description,
        care_types: existingFamilyProfile.care_types,
        metadata: mergedMetadata,
      },
      normalizedEmail || existingFamilyProfile.email
    );
    mergedMetadata.profile_completeness = completeness.percentage;

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

    // Calculate profile completeness for new profile
    const completeness = calculateFamilyCompleteness(
      {
        display_name: displayName,
        image_url: null,
        city: null,
        phone: normalizedPhone,
        description: null,
        care_types: null,
        metadata: cleanedMetadata,
      },
      normalizedEmail
    );
    cleanedMetadata.profile_completeness = completeness.percentage;

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
      // Attribution — where the intake was submitted from. Surfaced in the
      // admin Activity Center + the Slack alert so leads are traceable to
      // the page that produced them (program page, article, provider page).
      entry_source: entrySource || null,
      provider_slug: providerSlug || null,
      // Managed-ads attribution: which paid campaign (if any) drove this family.
      utm_source: utmSource || null,
      utm_campaign: utmCampaign || null,
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
      entrySource: entrySource || null,
      providerSlug: providerSlug || null,
    });
    // Awaited via Promise.allSettled — fire-and-forget gets killed by
    // Vercel's serverless runtime once the response goes out (cost a 7h
    // diagnosis on the agent-outreach route, 2026-05-03). Adds ~200-400ms
    // latency but guarantees the alert lands. allSettled so a Slack
    // failure doesn't abort the response — the canonical accounts row is
    // already in the DB at this point.
    const [slackResult] = await Promise.allSettled([
      sendSlackAlert(alert.text, alert.blocks),
    ]);
    if (slackResult.status === "rejected") {
      console.error("[save-results] Slack alert failed:", slackResult.reason);
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // 6. Send welcome notifications — TRULY fire-and-forget so the response
  //    doesn't wait on Resend (~500-1500ms) / Twilio (~200-800ms).
  //
  //    V3 design: email is always primary (and required on the new flow);
  //    if the user also gave a phone, we ALSO send an SMS. Both fire in
  //    parallel for new users.
  //
  //    Email body delivers REAL value — top 5 matched programs as a
  //    state-filtered starter list, personalized for relationship, primary
  //    CTA goes to /m/{token} (token IS the auth — no magic-link redirect
  //    indirection). This is the bar TJ set in the task: "real value before
  //    we capture at scale" — 95% of users won't engage with email, so when
  //    one does, the email needs to be worth their time.
  // ═══════════════════════════════════════════════════════════════════
  if (isNewUser && normalizedEmail) {
    (async () => {
      try {
        const stateNameForEmail = stateDisplayName(stateAbbrev);
        const careLabel = careNeed ? CARE_NEED_LABEL_FOR_COPY[careNeed] || "care" : "care";
        const familyPhrase = relationshipFamilyPhrase(relationship);
        const possessive = relationshipPossessive(relationship);

        // Top 5 programs for the starter list. Limit chosen for inbox
        // scannability — anything past 5 in an email feels like a wall.
        // Full list lives at /m/{token} via the CTA below.
        const topMatches = matchedPrograms.slice(0, 5);
        const programsHtml = topMatches
          .map((p) => {
            const programLink = `${siteUrl}/benefits/${p.stateId}/${p.programId}`;
            const savings = topSavingsCopy(p.savingsRange);
            const name = p.shortName || p.name;
            return `
              <a href="${programLink}" style="display: block; text-decoration: none; color: inherit; border-top: 1px solid #f3f4f6; padding: 16px 0;">
                <div style="font-family: 'Caslon', 'Playfair Display', Georgia, serif; font-size: 17px; font-weight: 600; color: #111827; margin-bottom: 4px;">
                  ${name}
                </div>
                ${savings
                  ? `<div style="font-size: 13px; color: #047857; font-weight: 500;">${savings}</div>`
                  : ""}
              </a>
            `;
          })
          .join("");

        const matchesUrl = benefitsToken
          ? `${siteUrl}/m/${benefitsToken}`
          : `${siteUrl}/portal`;

        // Subject — personalized when relationship known, falls back cleanly.
        const subject =
          matchCount > 0
            ? `${possessive} ${matchCount} care benefit ${matchCount === 1 ? "match" : "matches"} in ${stateNameForEmail}`
            : `Care benefit programs in ${stateNameForEmail}`;

        const emailType = "benefits_results_saved";
        const emailLogId = await reserveEmailLogId({
          to: normalizedEmail,
          subject,
          emailType,
          recipientType: "family",
        });
        const trackedMatchesUrl = appendTrackingParams(matchesUrl, emailLogId);

        // Hero copy adapts to whether we found matches.
        const heroLine =
          matchCount > 0
            ? `We found <strong>${matchCount} ${matchCount === 1 ? "program" : "programs"}</strong> in ${stateNameForEmail} that may help with ${careLabel} for ${familyPhrase}.`
            : `We saved your search. We'll keep an eye out for ${stateNameForEmail} programs that may help with ${careLabel}.`;

        await sendEmail({
          to: normalizedEmail,
          subject,
          html: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #111827; background: #ffffff;">

  <p style="font-size: 15px; line-height: 1.6; margin: 0 0 16px; color: #6b7280;">
    Hi ${hasRealName ? displayName : "there"},
  </p>

  <h1 style="font-family: 'Caslon', 'Playfair Display', Georgia, serif; font-size: 24px; line-height: 1.3; margin: 0 0 16px; color: #111827; font-weight: 700;">
    ${heroLine}
  </h1>

  ${topMatches.length > 0
    ? `
  <p style="font-size: 15px; line-height: 1.6; margin: 0 0 24px; color: #6b7280;">
    Here are the top ${topMatches.length} matches we saved for you. Tap any program to see eligibility and how to apply:
  </p>

  <div style="margin: 0 0 32px;">
    ${programsHtml}
  </div>
  `
    : ""}

  <a href="${trackedMatchesUrl}" style="display: inline-block; background: #111827; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 999px; font-weight: 600; font-size: 15px;">
    View ${matchCount > 0 ? `all ${matchCount} ` : ""}matches →
  </a>

  <p style="font-size: 12px; color: #9ca3af; margin: 40px 0 0; line-height: 1.6; border-top: 1px solid #f3f4f6; padding-top: 20px;">
    Olera helps families find care benefits they're eligible for in their state. We never sell your info.
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

  // Bonus SMS — fires in parallel with email when the user provided a phone
  // (V3 phone-as-optional). Either channel can fail without affecting the
  // other; both are best-effort. Body is relationship-aware where helpful
  // (160-char SMS budget caps how much personalization we can fit).
  if (isNewUser && normalizedPhone && benefitsToken) {
    (async () => {
      const body = benefitsResultsSms({
        matchCount,
        familyPhrase: relationshipFamilyPhrase(relationship),
        url: `${siteUrl}/m/${benefitsToken}`,
      });
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
    // When true, no session is minted — an existing account was found and a
    // sign-in link was emailed. The client should show "check your email"
    // instead of treating the user as logged in (security: prevents takeover).
    existingUser,
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
