import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { syncIntentToProfile } from "@/lib/sync-intent-to-profile";
import { normalizeUSPhone } from "@/lib/twilio";
import {
  captureFamilyPhoneAndTextResults,
  benefitsSituationLine,
} from "@/lib/family-comms/benefits-cascade.server";
import { sendSlackAlert } from "@/lib/slack";
import { chipValueToAgeBand } from "@/lib/benefits/age";
import { isProgramCardFlow } from "@/lib/analytics/program-card-variant";

/**
 * PATCH /api/benefits/update-enrichment
 *
 * Updates a family profile with enrichment data collected after the initial
 * benefits intake (email submission). Called at the end of the 4-step
 * enrichment flow on the program benefits page.
 *
 * Auth: Either authenticated session OR benefits token (from save-results).
 *
 * Fields:
 * - recipient: Who needs care (self, parent, spouse, other)
 * - timeline: How soon (asap, within_month, few_months, researching)
 * - paymentMethod: How they'll pay (medicare, medicaid, private_insurance, etc.)
 * - phone: Optional mobile number from the "Want this by text?" step. Fills
 *   business_profiles.phone only when empty (mirror of save-results' caution),
 *   stamps metadata.sms_consent (what a 10DLC audit wants, and what the future
 *   SMS cascade rungs gate on), and IMMEDIATELY texts the results link
 *   (benefitsResultsSms) so the step's promise is kept in seconds.
 * - ageBand / medicaidStatus / incomeRange: Phase 3 real-situation facts
 *   (one-tap asks after the phone step, and the /m gap chips). Age chips
 *   store a BAND in metadata.age_band ("under_65" | "65_74" | "75_84" |
 *   "85_plus"), never a fake exact age; legacy "60"/"70"/"80"/"87" values
 *   are still accepted and mapped to their band. Values are
 *   allowlisted; writes are metadata-only with a quiz_answers provenance
 *   stamp. `source` labels where the tap happened ("benefits_enrichment"
 *   | "m_chips").
 * - householdSize / incomeVsLimit: the three_tap program-card flow
 *   (2026-09-24). householdSize is 1-4, where 4 means "4 or more", stored as
 *   metadata.household_size. incomeVsLimit is the family's yes/no/not-sure
 *   answer to "Is your income under $X a month?" against the entry program's
 *   own income table, stored as metadata.income_vs_limit {limit,
 *   household_size, answer, program_id, state_id, answered_at}. It is NOT
 *   mapped onto income_range: a yes/no against one limit is not a band, and
 *   fabricating one would feed the eligibility screen a number nobody gave.
 *   A failed write of either returns 500 so the card can say so.
 * - cardFlow: the program-card experiment arm, recorded on the
 *   profile_enriched activity row.
 */

const INCOME_VS_LIMIT_ANSWERS = new Set(["under", "over", "not_sure"]);

/** Validate the three_tap income answer; null when anything is off. */
function parseIncomeVsLimit(raw: unknown): {
  limit: number;
  household_size: number;
  answer: string;
  program_id: string;
  state_id: string;
} | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const limit = typeof r.limit === "number" && Number.isFinite(r.limit) && r.limit > 0 && r.limit < 100_000
    ? Math.round(r.limit)
    : null;
  const size = typeof r.householdSize === "number" && Number.isInteger(r.householdSize) && r.householdSize >= 1 && r.householdSize <= 4
    ? r.householdSize
    : null;
  const answer = typeof r.answer === "string" && INCOME_VS_LIMIT_ANSWERS.has(r.answer) ? r.answer : null;
  const programId = typeof r.programId === "string" && /^[a-z0-9-]{1,120}$/.test(r.programId) ? r.programId : null;
  const stateId = typeof r.stateId === "string" && /^[a-z-]{2,40}$/.test(r.stateId) ? r.stateId : null;
  if (limit == null || size == null || !answer || !programId || !stateId) return null;
  return { limit, household_size: size, answer, program_id: programId, state_id: stateId };
}

const MEDICAID_VALUES = new Set(["alreadyHas", "applying", "notSure", "doesNotHave"]);
const INCOME_VALUES = new Set(["under1500", "under2500", "under4000", "over4000", "preferNotToSay"]);
export async function PATCH(request: Request) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body = await request.json();
    const {
      profileId,
      token,
      recipient,
      timeline,
      paymentMethod,
      phone,
      ageBand,
      medicaidStatus,
      incomeRange,
      source,
      sessionId,
      completedSteps,
      enrichmentComplete,
      householdSize,
      incomeVsLimit,
      cardFlow,
    } = body as {
      profileId?: string;
      token?: string;
      recipient?: string;
      timeline?: string;
      paymentMethod?: string;
      phone?: string;
      ageBand?: string;
      medicaidStatus?: string;
      incomeRange?: string;
      source?: string;
      sessionId?: string;
      completedSteps?: number[];
      /** Set by the client when the family reaches the end of the full
       *  enrichment flow — triggers the Slack summary ping. */
      enrichmentComplete?: boolean;
      householdSize?: number;
      incomeVsLimit?: unknown;
      cardFlow?: string;
    };
    const factHousehold =
      typeof householdSize === "number" && Number.isInteger(householdSize) && householdSize >= 1 && householdSize <= 4
        ? householdSize
        : null;
    const factIncomeVsLimit = parseIncomeVsLimit(incomeVsLimit);
    const flow = isProgramCardFlow(cardFlow) ? cardFlow : null;

    // "Not sure yet" is its own signal, never a payment_methods entry — the
    // family self-identifying as needing the benefits path IS the fact.
    const paymentUnsure = paymentMethod === "not_sure";
    const paymentReal = paymentMethod && !paymentUnsure ? paymentMethod : null;

    // Allowlisted facts only — a garbage value degrades to "not sent",
    // never a wrong fact on the profile.
    const factAge = ageBand ? chipValueToAgeBand(ageBand) : null;
    const factMedicaid = medicaidStatus && MEDICAID_VALUES.has(medicaidStatus) ? medicaidStatus : null;
    const factIncome = incomeRange && INCOME_VALUES.has(incomeRange) ? incomeRange : null;

    if (!profileId) {
      return NextResponse.json(
        { error: "profileId is required" },
        { status: 400 }
      );
    }

    // Need admin client for RLS bypass
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const admin = createClient(url, serviceKey);

    // Determine authorization — from authenticated user or benefits token
    let authorized = false;

    if (user) {
      // Check if user owns this profile via account
      const { data: account } = await admin
        .from("accounts")
        .select("active_profile_id")
        .eq("user_id", user.id)
        .single();

      if (account?.active_profile_id === profileId) {
        authorized = true;
      }
    }

    if (!authorized && token) {
      // Validate benefits token
      const { data: tokenRecord } = await admin
        .from("benefits_results_tokens")
        .select("profile_id")
        .eq("token", token)
        .single();

      if (tokenRecord?.profile_id === profileId) {
        authorized = true;
      }
    }

    if (!authorized) {
      return NextResponse.json(
        { error: "Not authorized" },
        { status: 401 }
      );
    }

    // Verify the profile exists and is a family profile
    const { data: profile, error: fetchError } = await admin
      .from("business_profiles")
      .select("id, type, email, phone")
      .eq("id", profileId)
      .single();

    if (fetchError || !profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    if (profile.type !== "family") {
      return NextResponse.json(
        { error: "Invalid profile type" },
        { status: 400 }
      );
    }

    // ── Chip answers → profile sync ─────────────────────────────────────
    if (recipient || timeline || paymentReal) {
      // Map enrichment values to syncIntentToProfile format
      const syncData = {
        careRecipient: recipient || null,
        urgency: timeline || null,
        paymentMethod: paymentReal,
      };

      await syncIntentToProfile(admin, profileId, syncData, profile.email);
    }

    // ── Phase 3 facts → metadata (age / medicaid_status / income_range) ─
    // Fresh read AFTER syncIntentToProfile so this merge can't clobber its
    // writes; the phone capture below re-reads again for the same reason.
    let threeTapWriteFailed = false;
    if (factAge || factMedicaid || factIncome || paymentUnsure || factHousehold || factIncomeVsLimit) {
      const { data: fresh } = await admin
        .from("business_profiles")
        .select("metadata")
        .eq("id", profileId)
        .single();
      const meta = (fresh?.metadata as Record<string, unknown>) || {};
      const quizAnswers = (meta.quiz_answers as Record<string, unknown>) || {};
      const via = source === "m_chips" ? "m_chips" : "enrichment";
      const at = new Date().toISOString();
      if (factAge) {
        // A band, not an age: metadata.age is reserved for a typed exact age.
        meta.age_band = factAge;
        delete meta.age;
        quizAnswers.age = { answer: factAge, at, via };
      }
      if (factMedicaid) {
        meta.medicaid_status = factMedicaid;
        quizAnswers.medicaid = { answer: factMedicaid, at, via };
      }
      if (factIncome) {
        meta.income_range = factIncome;
        quizAnswers.income = { answer: factIncome, at, via };
      }
      if (paymentUnsure) {
        meta.payment_unsure = { at, via };
      }
      if (factHousehold) {
        meta.household_size = factHousehold;
      }
      if (factIncomeVsLimit) {
        meta.income_vs_limit = { ...factIncomeVsLimit, answered_at: at };
      }
      meta.quiz_answers = quizAnswers;
      const { error: factsErr } = await admin
        .from("business_profiles")
        .update({ metadata: meta })
        .eq("id", profileId);
      if (factsErr) {
        console.error("[update-enrichment] facts write failed:", factsErr);
        // The three_tap card promises an inline error on a failed save;
        // the older fact taps keep their best-effort behavior.
        if (factHousehold || factIncomeVsLimit) threeTapWriteFailed = true;
      }
    }

    // ── Phone capture (step 4) ──────────────────────────────────────────
    // Fill-if-empty + consent stamp + immediate results-link SMS, all inside
    // the shared helper (which re-reads metadata so the consent merge can't
    // clobber syncIntentToProfile's writes above).
    let smsSent = false;
    const normalizedPhone = phone ? normalizeUSPhone(phone) : null;
    if (normalizedPhone) {
      const captured = await captureFamilyPhoneAndTextResults(admin, {
        profileId,
        rawPhone: normalizedPhone,
        source: "benefits_enrichment",
      });
      smsSent = captured.smsSent;
    }

    // ── Activity event ──────────────────────────────────────────────────
    const enrichedFields = [
      recipient && "relationship",
      timeline && "timeline",
      paymentReal && "payment_method",
      paymentUnsure && "payment_unsure",
      normalizedPhone && "phone",
      factAge && "age",
      factMedicaid && "medicaid_status",
      factIncome && "income_range",
      factHousehold && "household_size",
      factIncomeVsLimit && "income_vs_limit",
    ].filter(Boolean);

    if (enrichedFields.length > 0) {
      // Awaited — fire-and-forget promises die with the serverless response.
      const { error: actErr } = await admin.from("seeker_activity").insert({
        profile_id: profileId,
        event_type: "profile_enriched",
        metadata: {
          source: source === "m_chips" ? "m_chips" : "benefits_enrichment",
          enriched_fields: enrichedFields,
          completed_steps: completedSteps || [],
          session_id: sessionId || null,
          sms_sent: smsSent || undefined,
          card_flow: flow || undefined,
        },
      });
      if (actErr) console.error("[seeker_activity] profile_enriched insert failed:", actErr);
    }

    // ── Completion ping ─────────────────────────────────────────────────
    // Fired once, by the client's completion marker at the end of the full
    // flow. This PATCH rides the serialized client chain, so the profile
    // read here already includes every fact the family just gave. Awaited;
    // never fatal.
    if (enrichmentComplete === true) {
      try {
        const { data: done } = await admin
          .from("business_profiles")
          .select("display_name, state, phone, metadata")
          .eq("id", profileId)
          .single();
        const doneMeta = (done?.metadata as Record<string, unknown>) || {};
        const name = done?.display_name?.trim();
        const who = name && name.toLowerCase() !== "care seeker" ? name : "A family";
        const answered = Array.isArray(completedSteps) ? completedSteps.length : 0;
        const parts: string[] = [];
        const situation = benefitsSituationLine(doneMeta);
        if (situation) parts.push(situation);
        if (typeof doneMeta.timeline === "string" && doneMeta.timeline) parts.push(`timeline: ${doneMeta.timeline}`);
        const ivl = doneMeta.income_vs_limit as { answer?: string; limit?: number; program_id?: string } | undefined;
        if (ivl?.answer && ivl.limit) {
          const verdict = ivl.answer === "under" ? "under" : ivl.answer === "over" ? "over" : "not sure vs";
          parts.push(`${verdict} the $${ivl.limit.toLocaleString("en-US")}/mo ${ivl.program_id ?? "program"} limit`);
        }
        if (done?.phone) parts.push("phone on file");
        await sendSlackAlert(
          `🧩 ${who}${done?.state ? ` (${done.state})` : ""} finished the full benefits enrichment` +
            ` (${answered} ${answered === 1 ? "answer" : "answers"}). ` +
            (parts.length ? `${parts.join(", ")}. ` : "Nothing answered, all steps skipped. ") +
            `<${process.env.NEXT_PUBLIC_SITE_URL || "https://olera.care"}/admin/care-seekers/${profileId}|Open family>`,
        );
      } catch (slackErr) {
        console.error("[update-enrichment] completion ping failed:", slackErr);
      }
    }

    if (threeTapWriteFailed) {
      return NextResponse.json({ error: "Could not save your answer", smsSent }, { status: 500 });
    }
    return NextResponse.json({ success: true, smsSent });
  } catch (err) {
    console.error("[update-enrichment] error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
