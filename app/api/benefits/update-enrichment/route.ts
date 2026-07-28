import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { syncIntentToProfile } from "@/lib/sync-intent-to-profile";
import { normalizeUSPhone } from "@/lib/twilio";
import {
  captureFamilyPhoneAndTextResults,
  familyPhraseFromRelationship,
} from "@/lib/family-comms/benefits-cascade.server";

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
 */
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
      sessionId,
      completedSteps,
    } = body as {
      profileId?: string;
      token?: string;
      recipient?: string;
      timeline?: string;
      paymentMethod?: string;
      phone?: string;
      sessionId?: string;
      completedSteps?: number[];
    };

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
    if (recipient || timeline || paymentMethod) {
      // Map enrichment values to syncIntentToProfile format
      const syncData = {
        careRecipient: recipient || null,
        urgency: timeline || null,
        paymentMethod: paymentMethod || null,
      };

      await syncIntentToProfile(admin, profileId, syncData, profile.email);
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
      paymentMethod && "payment_method",
      normalizedPhone && "phone",
    ].filter(Boolean);

    if (enrichedFields.length > 0) {
      // Awaited — fire-and-forget promises die with the serverless response.
      const { error: actErr } = await admin.from("seeker_activity").insert({
        profile_id: profileId,
        event_type: "profile_enriched",
        metadata: {
          source: "benefits_enrichment",
          enriched_fields: enrichedFields,
          completed_steps: completedSteps || [],
          session_id: sessionId || null,
          sms_sent: smsSent || undefined,
        },
      });
      if (actErr) console.error("[seeker_activity] profile_enriched insert failed:", actErr);
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
