import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { syncIntentToProfile } from "@/lib/sync-intent-to-profile";
import { normalizeUSPhone } from "@/lib/twilio";
import {
  captureFamilyPhoneAndTextResults,
  familyPhraseFromRelationship,
  benefitsSituationLine,
} from "@/lib/family-comms/benefits-cascade.server";
import { sendSlackAlert } from "@/lib/slack";

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
 *   (one-tap asks after the phone step, and the /m gap chips). Age bands
 *   store the same representative numbers as the email micro-quiz
 *   (60/70/80/87) so every facts reader sees one vocabulary. Values are
 *   allowlisted; writes are metadata-only with a quiz_answers provenance
 *   stamp. `source` labels where the tap happened ("benefits_enrichment"
 *   | "m_chips").
 */

const AGE_BAND_VALUES = new Set(["60", "70", "80", "87"]);
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
    };

    // "Not sure yet" is its own signal, never a payment_methods entry — the
    // family self-identifying as needing the benefits path IS the fact.
    const paymentUnsure = paymentMethod === "not_sure";
    const paymentReal = paymentMethod && !paymentUnsure ? paymentMethod : null;

    // Allowlisted facts only — a garbage value degrades to "not sent",
    // never a wrong fact on the profile.
    const factAge = ageBand && AGE_BAND_VALUES.has(ageBand) ? parseInt(ageBand, 10) : null;
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
    if (factAge || factMedicaid || factIncome || paymentUnsure) {
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
        meta.age = factAge;
        quizAnswers.age = { answer: String(factAge), at, via };
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
      meta.quiz_answers = quizAnswers;
      const { error: factsErr } = await admin
        .from("business_profiles")
        .update({ metadata: meta })
        .eq("id", profileId);
      if (factsErr) console.error("[update-enrichment] facts write failed:", factsErr);
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
        familyPhrase: familyPhraseFromRelationship(recipient),
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

    return NextResponse.json({ success: true, smsSent });
  } catch (err) {
    console.error("[update-enrichment] error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
