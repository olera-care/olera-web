import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import {
  readBenefitsCascade,
  readBenefitsCase,
  type BenefitsCaseMeta,
} from "@/lib/family-comms/benefits-cascade.server";
import {
  readBenefitsNavigator,
  renderNavigatorEmail,
} from "@/lib/family-comms/benefits-navigator.server";
import { sendEmail } from "@/lib/email";
import { careUnsubscribeUrl } from "@/lib/email-templates";
import { generateFamilyInboxUrl } from "@/lib/claim-tokens";
import { getSiteUrl } from "@/lib/site-url";
import { sendSMS } from "@/lib/twilio";
import { benefitsFirstStepSms } from "@/lib/sms/templates";

/**
 * Per-family case endpoints for the Benefits caseload view
 * (plans/benefits-case-management.md).
 *
 * GET  → the case timeline: every touch in chronological order, assembled
 *        from data that already exists (seeker_activity, email_log, the
 *        benefits_cascade stamps, results-page views, case actions). The
 *        story of one family, and where it stopped.
 * POST → case actions: { action: "note", text } | { action: "contacted" } |
 *        { action: "resolved" } | { action: "reopen" }. Stored on
 *        metadata.benefits_case so casework leaves a record Cess can inherit.
 */

interface TimelineEvent {
  at: string;
  kind: string;
  label: string;
  detail?: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ profileId: string }> },
) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const adminUser = await getAdminUser(user.id);
    if (!adminUser) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const { profileId } = await params;
    const db = getServiceClient();

    const { data: profile } = await db
      .from("business_profiles")
      .select("id, email, metadata")
      .eq("id", profileId)
      .maybeSingle();
    if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const meta = (profile.metadata as Record<string, unknown>) || {};
    const cascade = readBenefitsCascade(meta);
    const caseMeta = readBenefitsCase(meta);
    const events: TimelineEvent[] = [];
    const push = (at: string | null | undefined, kind: string, label: string, detail?: string) => {
      if (at) events.push({ at, kind, label, detail });
    };

    // Activity events
    const { data: acts } = await db
      .from("seeker_activity")
      .select("event_type, created_at, metadata")
      .eq("profile_id", profileId)
      .in("event_type", ["benefits_completed", "profile_enriched", "benefits_outcome_reported"])
      .order("created_at");
    for (const a of acts ?? []) {
      const m = (a.metadata as Record<string, unknown>) || {};
      if (a.event_type === "benefits_completed") {
        push(a.created_at, "intake", "Completed benefits intake", `${m.match_count ?? "?"} programs matched · ${m.entry_source || "direct"}`);
      } else if (a.event_type === "profile_enriched") {
        const FIELD_LABELS: Record<string, string> = {
          relationship: "relationship",
          timeline: "timeline",
          payment_method: "payment",
          payment_unsure: "unsure how to pay",
          phone: "phone",
          age: "age",
          medicaid_status: "Medicaid",
          income_range: "income",
        };
        const fields = Array.isArray(m.enriched_fields)
          ? (m.enriched_fields as string[]).map((f) => FIELD_LABELS[f] || f).join(", ")
          : "";
        push(a.created_at, "enriched", "Answered follow-up questions", fields + (m.sms_sent ? " · results texted" : ""));
      } else {
        push(a.created_at, "outcome", `Check-in answer: ${String(m.value || "?").replace(/_/g, " ")}`);
      }
    }

    // Cascade emails + engagement
    if (profile.email) {
      const { data: logs } = await db
        .from("email_log")
        .select("email_type, created_at, first_opened_at, first_clicked_at, status")
        .eq("recipient", profile.email)
        .in("email_type", ["benefits_results_saved", "benefits_first_step", "benefits_check_in"])
        .order("created_at");
      const LABELS: Record<string, string> = {
        benefits_results_saved: "Results email",
        benefits_first_step: "First-step email (day 2-3)",
        benefits_check_in: "Check-in email (day 5-6)",
      };
      for (const l of logs ?? []) {
        push(l.created_at, "email", `${LABELS[l.email_type] || l.email_type} sent`);
        push(l.first_opened_at, "email_open", `${LABELS[l.email_type] || l.email_type} opened`);
        push(l.first_clicked_at, "email_click", `${LABELS[l.email_type] || l.email_type} clicked`);
      }
    }

    // Cascade stamps (SMS mirrors + journey acts)
    push(cascade.first_step_sms_at, "sms", "First-step text sent");
    push(cascade.check_sms_at, "sms", "Check-in text sent");

    // Inbound texts (webhook persists every reply — metadata.sms_inbound)
    const inbound = Array.isArray(meta.sms_inbound)
      ? (meta.sms_inbound as { at?: string; body?: string; keyword?: string | null }[])
      : [];
    for (const m of inbound) {
      push(
        m.at,
        "sms_in",
        m.keyword ? `Texted ${m.keyword}` : "Texted us back",
        m.keyword ? undefined : m.body,
      );
    }
    push(
      cascade.first_step_done_at,
      "acted",
      "Marked the call done on their plan",
      cascade.first_step_program_name || undefined,
    );

    // Plan views + checklist
    const { data: tokens } = await db
      .from("benefits_results_tokens")
      .select("last_viewed_at")
      .eq("profile_id", profileId);
    let latestView: string | null = null;
    for (const t of tokens ?? []) {
      push(t.last_viewed_at, "viewed", "Viewed their plan page (latest)");
      if (t.last_viewed_at && (!latestView || t.last_viewed_at > latestView)) latestView = t.last_viewed_at;
    }
    if (cascade.docs_checked?.length) {
      // docs_checked carries no per-doc timestamps; anchor to the best-known
      // moment they were on the page (call-done, else latest view) so the
      // entry doesn't re-date itself to "today" on every load.
      const docsAt = cascade.first_step_done_at || latestView;
      if (docsAt) {
        events.push({
          at: docsAt,
          kind: "docs",
          label: `Checked ${cascade.docs_checked.length} document${cascade.docs_checked.length === 1 ? "" : "s"} on their checklist`,
          detail: cascade.docs_checked.join("; "),
        });
      }
    }

    // Case actions
    for (const n of caseMeta.notes ?? []) push(n.at, "note", `Note by ${n.by}`, n.text);
    push(caseMeta.contacted_at, "case", "Marked contacted");
    push(caseMeta.resolved_at, "case", "Marked resolved");

    // Navigator letter lifecycle
    const navigator = readBenefitsNavigator(meta);
    push(navigator.composed_at, "navigator", "Navigator letter drafted", navigator.pick?.shortName);
    push(navigator.sent_at, "navigator", "Navigator letter sent by TJ");
    push(navigator.dismissed_at, "navigator", "Navigator draft dismissed");

    events.sort((a, b) => a.at.localeCompare(b.at));
    return NextResponse.json({ events, caseMeta, navigator });
  } catch (err) {
    console.error("Admin benefits timeline error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE — remove a family entirely (profile, account, auth user, tokens,
 * saved programs, activity). Built for test-data cleanup during heavy QA;
 * irreversible, so the UI requires typing "delete". Admin-only.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ profileId: string }> },
) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const adminUser = await getAdminUser(user.id);
    if (!adminUser) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const { profileId } = await params;
    const db = getServiceClient();
    const { data: profile } = await db
      .from("business_profiles")
      .select("id, type, account_id")
      .eq("id", profileId)
      .maybeSingle();
    if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (profile.type !== "family") {
      return NextResponse.json({ error: "Only family profiles can be deleted here" }, { status: 400 });
    }

    let userId: string | null = null;
    if (profile.account_id) {
      const { data: acct } = await db
        .from("accounts")
        .select("user_id")
        .eq("id", profile.account_id)
        .maybeSingle();
      userId = acct?.user_id ?? null;
    }

    const errors: string[] = [];
    const del = async (label: string, p: PromiseLike<{ error: { message: string } | null }>) => {
      const { error } = await p;
      if (error) errors.push(`${label}: ${error.message}`);
    };
    await del("activity", db.from("seeker_activity").delete().eq("profile_id", profileId));
    await del("tokens", db.from("benefits_results_tokens").delete().eq("profile_id", profileId));
    if (userId) await del("saved_programs", db.from("saved_programs").delete().eq("user_id", userId));
    await del("profile", db.from("business_profiles").delete().eq("id", profileId));

    // Only remove the account + auth user when NO other profile hangs off the
    // account — an auth user can own several profiles, and deleting it would
    // kill their sign-in for everything else they have.
    if (profile.account_id && errors.length === 0) {
      const { data: siblings } = await db
        .from("business_profiles")
        .select("id")
        .eq("account_id", profile.account_id)
        .limit(1);
      if (!siblings || siblings.length === 0) {
        await del("account", db.from("accounts").delete().eq("id", profile.account_id));
        if (userId) {
          const { error: authErr } = await db.auth.admin.deleteUser(userId);
          if (authErr) errors.push(`auth user: ${authErr.message}`);
        }
      }
    }

    if (errors.length) {
      console.error("[benefits delete] partial:", errors);
      return NextResponse.json({ success: false, errors }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Admin benefits delete error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ profileId: string }> },
) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const adminUser = await getAdminUser(user.id);
    if (!adminUser) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const { profileId } = await params;
    const body = await request.json();
    const action: string = body.action || "";
    if (
      !["note", "contacted", "resolved", "reopen", "navigator_send", "navigator_dismiss"].includes(
        action,
      )
    ) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const db = getServiceClient();
    const { data: profile } = await db
      .from("business_profiles")
      .select("id, email, phone, phone_validity, metadata")
      .eq("id", profileId)
      .maybeSingle();
    if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const meta = (profile.metadata as Record<string, unknown>) || {};

    // ── Navigator actions: send (through governance) or dismiss the draft ──
    if (action === "navigator_send" || action === "navigator_dismiss") {
      const navigator = readBenefitsNavigator(meta);
      if (navigator.status !== "pending" || !navigator.body) {
        return NextResponse.json({ error: "No pending draft for this family" }, { status: 409 });
      }
      const now = new Date().toISOString();

      if (action === "navigator_dismiss") {
        const next = { ...navigator, status: "dismissed" as const, dismissed_at: now };
        const { error: dErr } = await db
          .from("business_profiles")
          .update({ metadata: { ...meta, benefits_navigator: next } })
          .eq("id", profileId);
        if (dErr) return NextResponse.json({ error: "Save failed" }, { status: 500 });
        return NextResponse.json({ success: true, navigator: next });
      }

      // navigator_send — TJ may have edited subject/body in the drawer.
      if (!profile.email) {
        return NextResponse.json({ error: "Family has no email on file" }, { status: 409 });
      }
      const subject =
        typeof body.subject === "string" && body.subject.trim()
          ? body.subject.trim().slice(0, 150)
          : navigator.subject || "Your first step";
      const letter =
        typeof body.body === "string" && body.body.trim().length >= 40
          ? body.body.trim()
          : navigator.body;

      const siteUrl = getSiteUrl();
      // Link to the living plan (/m) with signed-in arrival, matching every
      // other cascade email since #1404.
      const { data: tokenRow } = await db
        .from("benefits_results_tokens")
        .select("token")
        .eq("profile_id", profileId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      const planPath = tokenRow?.token
        ? `/m/${tokenRow.token}`
        : navigator.pick?.programPath || "/benefits";
      const planUrl = generateFamilyInboxUrl(profile.email, planPath, siteUrl);

      const html = renderNavigatorEmail({
        body: letter,
        planUrl,
        unsubscribeUrl: careUnsubscribeUrl(profileId),
      });

      // Same governed type as the old B1 email: the family nudge caps, DNC
      // kill switch, and suppression checks all apply inside sendEmail.
      const result = await sendEmail({
        to: profile.email,
        subject,
        html,
        emailType: "benefits_first_step",
        recipientType: "family",
        recipientProfileId: profileId,
        replyTo: process.env.BENEFITS_NAVIGATOR_REPLY_TO || undefined,
        listUnsubscribeUrl: careUnsubscribeUrl(profileId),
        metadata: { navigator: true, program_id: navigator.pick?.programId || null },
      });
      if (!result.success || result.skipped) {
        return NextResponse.json(
          { error: `Send blocked: ${result.skipReason || result.error || "unknown"}` },
          { status: 409 },
        );
      }

      // Stamp the cascade exactly as the old B1 rung did — B2 keys off
      // first_step_sent_at, so the check-in schedules 3d after the REAL send.
      const cascade = readBenefitsCascade(meta);
      const nextCascade = {
        ...cascade,
        first_step_sent_at: now,
        first_step_program_id: navigator.pick?.programId,
        first_step_state_id: navigator.pick?.stateId || undefined,
        first_step_program_name: navigator.pick?.shortName,
      };
      const nextNavigator = {
        ...navigator,
        status: "sent" as const,
        sent_at: now,
        sent_subject: subject,
        sent_body: letter,
      };

      // Consent-gated SMS mirror, same rules as the coordinator's cascade
      // mirror (phone + sms_consent + not opted out). Awaited: Vercel kills
      // pending promises after the response.
      const smsEligible =
        !!profile.phone && !!meta.sms_consent && profile.phone_validity !== "opted_out";
      if (smsEligible && profile.phone && navigator.pick) {
        const sms = await sendSMS({
          to: profile.phone,
          body: benefitsFirstStepSms({
            programShortName: navigator.pick.shortName,
            phone: navigator.pick.contactPhone,
            topDocs: navigator.pick.documents,
            url: `${siteUrl}${navigator.pick.programPath}`,
          }),
          emailType: "benefits_first_step_sms",
          recipientType: "family",
          recipientLogProfileId: profileId,
        });
        if (sms.success && !sms.skipped) {
          (nextCascade as Record<string, unknown>).first_step_sms_at = now;
        } else if (sms.error?.includes("21610")) {
          await db
            .from("business_profiles")
            .update({ phone_validity: "opted_out" })
            .eq("id", profileId);
        }
      }

      const { error: sErr } = await db
        .from("business_profiles")
        .update({
          metadata: { ...meta, benefits_cascade: nextCascade, benefits_navigator: nextNavigator },
        })
        .eq("id", profileId);
      if (sErr) {
        // The email went out; a failed stamp must be visible, not silent.
        console.error("[navigator send] email sent but stamp failed:", sErr);
        return NextResponse.json(
          { error: "Email sent, but recording it failed. Refresh before retrying." },
          { status: 500 },
        );
      }
      return NextResponse.json({ success: true, navigator: nextNavigator });
    }
    const caseMeta = readBenefitsCase(meta);
    const now = new Date().toISOString();
    const by = adminUser.display_name || user.email || "admin";
    let next: BenefitsCaseMeta = caseMeta;

    if (action === "note") {
      const text = typeof body.text === "string" ? body.text.trim().slice(0, 1000) : "";
      if (!text) return NextResponse.json({ error: "Note text required" }, { status: 400 });
      next = { ...caseMeta, notes: [...(caseMeta.notes ?? []), { at: now, by, text }].slice(-20) };
    } else if (action === "contacted") {
      next = { ...caseMeta, contacted_at: now };
    } else if (action === "resolved") {
      next = { ...caseMeta, resolved_at: now };
    } else {
      next = { ...caseMeta, resolved_at: undefined, contacted_at: undefined };
    }

    const { error: updErr } = await db
      .from("business_profiles")
      .update({ metadata: { ...meta, benefits_case: next } })
      .eq("id", profileId);
    if (updErr) {
      console.error("Admin benefits case update failed:", updErr);
      return NextResponse.json({ error: "Save failed" }, { status: 500 });
    }
    return NextResponse.json({ success: true, caseMeta: next });
  } catch (err) {
    console.error("Admin benefits case error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
