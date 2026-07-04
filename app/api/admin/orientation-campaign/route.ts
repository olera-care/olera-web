import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { sendEmail, reserveEmailLogId, appendTrackingParams } from "@/lib/email";
import { isTransientSkip } from "@/lib/email-governance";
import { getSiteUrl } from "@/lib/site-url";
import { generateFamilyInboxUrl, generateQuizToken, generateBriefToken } from "@/lib/claim-tokens";
import {
  familyBenefitsFacts,
  friendlyCareLabel,
  getProgramsForFamily,
  pickQuizQuestion,
} from "@/lib/family-comms/benefits-guidance.server";
import { familySelfReportedYes } from "@/lib/family-comms/outcome";
import { US_STATES } from "@/lib/us-states";
import { payingForCareEmail, orientationIntroSubject, careUnsubscribeUrl } from "@/lib/email-templates";

/**
 * GET /api/admin/orientation-campaign — the ONE-TIME orientation send to the
 * existing base (Orientation Everywhere plan, 2026-07-04). The paying_for_care
 * rung only reaches inquiries as they age through 72-96h; every family already
 * past the band would otherwise never be asked the self-sort. This delivers it
 * once, then the rung owns the forward flow.
 *
 * Admin-guarded GET, browser-triggerable (the WAF blocks curl). DRY BY
 * DEFAULT — nothing sends without mode=send, so loading the URL in a browser
 * is always safe. Batched via ?limit= so sends can be staged.
 *
 * Segment (?days=90): family profiles with an inquiry in the window that have
 * NO financial_path yet, minus: already-sent (one-shot stamp), self-reported
 * connected, nudge-unsubscribed, test seeds, no deliverable email. Every send
 * goes through sendEmail, so the daily/weekly caps, do-not-contact kill
 * switch, and bounce suppression all apply on top.
 */

export const maxDuration = 300;

const DAY = 24 * 60 * 60 * 1000;

interface ConnLite {
  id: string;
  from_profile_id: string;
  to_profile_id: string;
  created_at: string;
  metadata?: Record<string, unknown> | null;
}

interface FamilyLite {
  id: string;
  display_name?: string | null;
  email?: string | null;
  city?: string | null;
  state?: string | null;
  care_types?: string[] | null;
  account_id?: string | null;
  metadata?: Record<string, unknown> | null;
}

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const admin = await getAdminUser(user.id);
  if (!admin) return NextResponse.json({ error: "Access denied" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const days = Math.min(365, Math.max(1, parseInt(searchParams.get("days") || "90", 10)));
  const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
  const send = searchParams.get("mode") === "send";

  const db = getServiceClient();
  const siteUrl = getSiteUrl();
  const cutoffISO = new Date(Date.now() - days * DAY).toISOString();

  try {
    // 1. Inquiries in the window → candidate family ids (+ their inquiries,
    //    for the self-reported-yes stop).
    const { data: connRows, error: connErr } = await db
      .from("connections")
      .select("id, from_profile_id, to_profile_id, created_at, metadata")
      .eq("type", "inquiry")
      .gte("created_at", cutoffISO)
      .order("created_at", { ascending: false })
      .limit(8000);
    if (connErr) throw new Error(`inquiry fetch: ${connErr.message}`);

    const byFamily = new Map<string, ConnLite[]>();
    for (const c of (connRows as ConnLite[]) || []) {
      const list = byFamily.get(c.from_profile_id) || [];
      list.push(c);
      byFamily.set(c.from_profile_id, list);
    }

    // 2. Their family profiles, chunked.
    const familyIds = [...byFamily.keys()];
    const profiles: FamilyLite[] = [];
    for (let i = 0; i < familyIds.length; i += 200) {
      const { data, error } = await db
        .from("business_profiles")
        .select("id, display_name, email, city, state, care_types, account_id, metadata")
        .eq("type", "family")
        .in("id", familyIds.slice(i, i + 200));
      if (error) throw new Error(`profile fetch: ${error.message}`);
      profiles.push(...((data as FamilyLite[]) || []));
    }

    // 3. Segment filters, with per-stop counts for the dry-run report.
    const stops: Record<string, number> = {
      already_sorted: 0,
      already_sent: 0,
      self_reported_connected: 0,
      unsubscribed: 0,
      test_seed: 0,
      no_email: 0,
    };
    const candidates: FamilyLite[] = [];
    for (const p of profiles) {
      const meta = (p.metadata as Record<string, unknown>) || {};
      const inquiries = byFamily.get(p.id) || [];
      if (meta.financial_path) { stops.already_sorted++; continue; }
      if (meta.orientation_intro_sent_at) { stops.already_sent++; continue; }
      if (meta.nudges_unsubscribed) { stops.unsubscribed++; continue; }
      if (meta.test_seed === true) { stops.test_seed++; continue; }
      if (familySelfReportedYes(inquiries)) { stops.self_reported_connected++; continue; }
      if (!p.email && !p.account_id) { stops.no_email++; continue; }
      candidates.push(p);
    }

    const sample = candidates.slice(0, 20).map((p) => ({
      id: p.id,
      city: p.city || null,
      state: p.state || null,
      careTypes: p.care_types || [],
      inquiryAgeDays: Math.round(
        (Date.now() - new Date((byFamily.get(p.id) || [])[0]?.created_at || Date.now()).getTime()) / DAY,
      ),
    }));

    if (!send) {
      return NextResponse.json({
        ok: true,
        mode: "dry",
        windowDays: days,
        inquiriesInWindow: (connRows || []).length,
        familiesWithInquiry: profiles.length,
        stops,
        candidates: candidates.length,
        wouldSendThisBatch: Math.min(limit, candidates.length),
        sample,
        hint: "Add &mode=send&limit=N to send. Sends are one-shot stamped and governed (caps + kill switch).",
      });
    }

    // 4. SEND — reserve → build → send → stamp, mirroring the coordinator.
    const results = { sent: 0, skipped_transient: 0, suppressed: 0, failed: 0, no_email: 0 };
    for (const p of candidates.slice(0, limit)) {
      const meta = (p.metadata as Record<string, unknown>) || {};

      // Resolve deliverable email (direct, then auth-admin fallback).
      let recipient = p.email || null;
      let authEmail = p.email || null;
      if (p.account_id) {
        const { data: acct } = await db.from("accounts").select("user_id").eq("id", p.account_id).single();
        if (acct?.user_id) {
          const {
            data: { user: authUser },
          } = await db.auth.admin.getUserById(acct.user_id);
          if (authUser?.email) {
            authEmail = authUser.email;
            if (!recipient) recipient = authUser.email;
          }
        }
      }
      if (!recipient) { results.no_email++; continue; }
      const authEmailFinal = authEmail || recipient;

      const facts = familyBenefitsFacts(p);
      const programs = await getProgramsForFamily(db, facts, 3);
      if (programs.length === 0) { results.failed++; continue; }
      const ask = pickQuizQuestion(facts);
      const careLabel = friendlyCareLabel(facts.careTypes[0]);
      const stateName = US_STATES.find((s) => s.value === (facts.state || ""))?.label || null;
      const subject = orientationIntroSubject(careLabel);

      const emailLogId = await reserveEmailLogId({
        to: recipient,
        subject,
        emailType: "orientation_intro",
        recipientType: "family",
        metadata: { campaign: "orientation_intro_2026_07", quiz_question: ask?.question || null },
      });

      const briefTok = generateBriefToken(p.id, authEmailFinal);
      const html = payingForCareEmail({
        familyName: p.display_name || "there",
        careType: careLabel || null,
        city: p.city || null,
        stateName,
        opening: `A while back you reached out about ${careLabel || "care"}${p.city ? ` in ${p.city}` : ""}. However that search is going, there's a part of it nobody hands you a guide for: how to pay for it.`,
        programs: programs.map((pr) => ({
          name: pr.name,
          savingsRange: pr.savingsRange,
          blurb: pr.blurb,
          url: generateFamilyInboxUrl(
            authEmailFinal,
            appendTrackingParams(`/family/program/${pr.id}?tok=${briefTok}`, emailLogId),
            siteUrl,
          ),
        })),
        quiz: ask
          ? {
              prompt: ask.prompt,
              leads: ask.question === "path",
              chips: ask.chips.map((ch) => ({
                label: ch.label,
                url: generateFamilyInboxUrl(
                  authEmailFinal,
                  appendTrackingParams(
                    `/family/quiz-answer?tok=${generateQuizToken(p.id, ask.question, ch.answer, authEmailFinal)}`,
                    emailLogId,
                  ),
                  siteUrl,
                ),
              })),
            }
          : null,
        fullPictureUrl: generateFamilyInboxUrl(
          authEmailFinal,
          appendTrackingParams("/benefits/finder", emailLogId),
          siteUrl,
        ),
        unsubscribeId: p.id,
      });

      const { success, skipped, skipReason } = await sendEmail({
        to: recipient,
        subject,
        html,
        emailType: "orientation_intro",
        recipientType: "family",
        metadata: { campaign: "orientation_intro_2026_07" },
        emailLogId: emailLogId ?? undefined,
        listUnsubscribeUrl: careUnsubscribeUrl(p.id),
      });
      if (!success) { results.failed++; continue; }
      // Transient skips (frequency caps) do NOT burn the one-shot stamp — the
      // family stays in the segment for the next batch. Terminal skips
      // (do-not-contact / bounce suppression) stamp as handled, same as the
      // coordinator, so the segment drains instead of retrying forever.
      if (skipped && isTransientSkip(skipReason)) { results.skipped_transient++; continue; }
      // Refetch metadata before stamping: the segment snapshot is minutes old
      // by late in a batch, and a stale spread would clobber anything written
      // meanwhile (a chip tap's financial_path, the 17:00 coordinator stamp).
      const stampAt = new Date().toISOString();
      const { data: freshProfile } = await db
        .from("business_profiles")
        .select("metadata")
        .eq("id", p.id)
        .maybeSingle();
      const freshMeta = (freshProfile?.metadata as Record<string, unknown>) || meta;
      await db
        .from("business_profiles")
        .update({ metadata: { ...freshMeta, orientation_intro_sent_at: stampAt } })
        .eq("id", p.id);
      if (skipped) { results.suppressed++; continue; }
      results.sent++;
    }

    return NextResponse.json({
      ok: true,
      mode: "send",
      windowDays: days,
      batchLimit: limit,
      results,
      remainingCandidates: Math.max(0, candidates.length - limit),
    });
  } catch (e) {
    console.error("[orientation-campaign] error:", e instanceof Error ? e.message : e);
    return NextResponse.json({ ok: false, error: "internal" }, { status: 500 });
  }
}
