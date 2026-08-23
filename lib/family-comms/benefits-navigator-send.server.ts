/**
 * Benefits Care Navigator — the ONE send path for approved letters.
 *
 * Extracted from the admin per-family route so the scheduler cron and TJ's
 * "Send as TJ" button run byte-identical logic: same governance (the
 * benefits_first_step family caps, DNC, suppression — all inside sendEmail),
 * same cascade stamping (B2 keys off first_step_sent_at, so the check-in
 * schedules 3d after the REAL send), same consent-gated SMS companion.
 *
 * SMS quiet hours apply to both trigger paths. A manual click is not proof
 * that it is a civil hour where the family lives; texts outside 8am–8pm park
 * in sms_queue for the next window (email still sends immediately).
 *
 * Timing/gates are mirrored in lib/family-comms/journey.ts (the admin
 * sequence timeline) — keep that in sync when this path changes.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";
import { careUnsubscribeUrl } from "@/lib/email-templates";
import { generateFamilyInboxUrl } from "@/lib/claim-tokens";
import { getSiteUrl } from "@/lib/site-url";
import { sendSMS } from "@/lib/twilio";
import { benefitsFirstStepSms } from "@/lib/sms/templates";
import { quietHoursCheck } from "@/lib/sms/quiet-hours";
import { withSmsSource } from "@/lib/sms/click-source";
import { readBenefitsCascade } from "./benefits-cascade.server";
import {
  readBenefitsNavigator,
  renderNavigatorEmail,
  type BenefitsNavigatorMeta,
} from "./benefits-navigator.server";

/**
 * Substitute the plan link, dropping any punctuation left flush against it.
 *
 * The link is the only tappable thing in the text, and some SMS clients pull a
 * trailing "." into the tapped URL, so the family lands on a 404 on the one
 * step we asked them to take. 78 of 130 pending drafts carried this on
 * 2026-08-23; every one of them followed the link with a space and a capital
 * letter, so dropping the period costs nothing readable and leaves whitespace
 * on both sides of the URL, which is what link detection needs.
 *
 * Fixing it here rather than in the prompt repairs every draft already sitting
 * in the queue, with no re-composition and no chance of altering a claim.
 */
export function substituteSmsLink(draft: string, url: string): string {
  return draft.replace(/\{link\}[.,;:!?]*\s*/g, `${url} `).trimEnd();
}

export interface NavigatorSendOptions {
  profileId: string;
  /** Drawer overrides (the admin route passes TJ's live edits). Omitted →
   *  saved edits → AI original, in that order. */
  subject?: string | null;
  body?: string | null;
  sms?: string | null;
  /** Who initiated the send. Both paths respect recipient SMS quiet hours. */
  trigger: "admin" | "scheduler";
}

export type NavigatorSendResult =
  | { ok: true; navigator: BenefitsNavigatorMeta; /** SMS-only delivery moved to the next legal window. */ deferred?: boolean }
  | { ok: false; error: string; /** true = state conflict (409-ish), not a transport failure */ conflict?: boolean };

export async function sendNavigatorLetter(
  db: SupabaseClient,
  opts: NavigatorSendOptions,
): Promise<NavigatorSendResult> {
  const { profileId } = opts;
  const { data: profile } = await db
    .from("business_profiles")
    .select("id, email, phone, phone_validity, state, metadata")
    .eq("id", profileId)
    .maybeSingle();
  if (!profile) return { ok: false, error: "Family not found", conflict: true };

  const meta = (profile.metadata as Record<string, unknown>) || {};
  const navigator = readBenefitsNavigator(meta);
  if (navigator.status !== "pending" || !navigator.body) {
    return { ok: false, error: "No pending draft for this family", conflict: true };
  }
  const smsEligible =
    !!profile.phone && !!(meta as { sms_consent?: unknown }).sms_consent &&
    profile.phone_validity !== "opted_out";
  if (!profile.email && !smsEligible) {
    return { ok: false, error: "Family has no reachable consented channel", conflict: true };
  }

  const now = new Date().toISOString();
  // Preference ladder: request edits → saved edits → AI original.
  const subject =
    typeof opts.subject === "string" && opts.subject.trim()
      ? opts.subject.trim().slice(0, 150)
      : navigator.edited_subject || navigator.subject || "Your first step";
  const letter =
    typeof opts.body === "string" && opts.body.trim().length >= 40
      ? opts.body.trim()
      : navigator.edited_body || navigator.body;

  const siteUrl = getSiteUrl();
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

  // #call-script lands the family on the opened script section — the letter
  // says "the script is written on your plan page", so the tap should keep
  // that promise, not drop them at the top to go hunting.
  let emailDelivered = false;
  if (profile.email) {
    const planUrl = generateFamilyInboxUrl(
      profile.email,
      tokenRow?.token ? `${planPath}#call-script` : planPath,
      siteUrl,
    );
    const html = renderNavigatorEmail({
      body: letter,
      planUrl,
      unsubscribeUrl: careUnsubscribeUrl(profileId),
      call: navigator.pick?.contactPhone ? { phone: navigator.pick.contactPhone } : null,
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
      metadata: {
        navigator: true,
        program_id: navigator.pick?.programId || null,
        scheduled: opts.trigger === "scheduler" || undefined,
      },
    });
    if (!result.success || result.skipped) {
      return { ok: false, error: result.skipReason || result.error || "unknown" };
    }
    emailDelivered = true;
  }

  // Stamp the cascade exactly as the old B1 rung did — B2 keys off
  // first_step_sent_at, so the check-in schedules 3d after the REAL send.
  const cascade = readBenefitsCascade(meta);
  const nextCascade: Record<string, unknown> = { ...cascade };
  let smsDelivered = false;
  let smsDeliveryAt = now;
  let sentSms: string | undefined;

  // Consent-gated SMS companion, same gate as the coordinator's cascade
  // mirror (phone + sms_consent + not opted out). Body preference mirrors the
  // letter: request edit, then saved edit, then the composed TJ-voiced draft,
  // then the old template. The composed text carries a {link} placeholder
  // (direct URL, not a magic link — SMS length budget) and the STOP suffix is
  // appended here so the model never writes compliance copy. Awaited: Vercel
  // kills pending promises after the response.
  if (smsEligible && profile.phone && navigator.pick) {
    // Tagged so an arrival on the plan page can be attributed to THIS text
    // rather than to the email carrying the same destination.
    const smsPlanUrl = withSmsSource(`${siteUrl}${planPath}`, "benefits_first_step_sms");
    const editedSms =
      typeof opts.sms === "string" && opts.sms.trim().length >= 20
        ? opts.sms.trim().slice(0, 400)
        : null;
    const draftSms = editedSms || navigator.edited_sms || navigator.sms || null;
    // Append the opt-out line only when it isn't already there (the model
    // is told not to write it, but a disobedient draft or a TJ edit that
    // includes it must not produce a doubled STOP line).
    // Older pending drafts predate structured replies. Upgrade them at send
    // time so every live B1 text has the same actionable contract.
    const progressSuffix =
      draftSms && !/\bCALLED\b/i.test(draftSms)
        ? " Reply CALLED, NO ANSWER, or STUCK."
        : "";
    const stopSuffix = draftSms && /reply stop/i.test(draftSms) ? "" : " Reply STOP to opt out.";
    const smsBody = draftSms
      ? `${substituteSmsLink(draftSms, smsPlanUrl)}${progressSuffix}${stopSuffix}`
      : benefitsFirstStepSms({
          programShortName: navigator.pick.shortName,
          phone: navigator.pick.contactPhone,
          topDocs: navigator.pick.documents,
          url: smsPlanUrl,
        });

    const quiet = quietHoursCheck({ state: profile.state as string | null });
    if (quiet.allowed) {
      const sms = await sendSMS({
        to: profile.phone,
        body: smsBody,
        emailType: "benefits_first_step_sms",
        recipientType: "family",
        recipientLogProfileId: profileId,
      });
      if (sms.success && !sms.skipped) {
        smsDelivered = true;
        nextCascade.first_step_sms_at = now;
        sentSms = smsBody;
      } else if (sms.error?.includes("21610")) {
        await db
          .from("business_profiles")
          .update({ phone_validity: "opted_out" })
          .eq("id", profileId);
      }
    } else {
      const sendAfter = (quiet.sendAfter ?? new Date()).toISOString();
      if (!profile.email) {
        // A queued companion may safely ride behind an email, but for a
        // text-only family the text IS B1. Keep the draft pending and move
        // its scheduler time to the next legal window so the admin never
        // claims delivery before Twilio has actually accepted the message.
        const deferredNavigator: BenefitsNavigatorMeta = {
          ...navigator,
          edited_subject: subject,
          edited_body: letter,
          edited_sms: draftSms,
          edited_at: now,
          scheduled_at: sendAfter,
          schedule_failed_at: undefined,
          schedule_failed_reason: undefined,
        };
        const { error: deferErr } = await db
          .from("business_profiles")
          .update({ metadata: { ...meta, benefits_navigator: deferredNavigator } })
          .eq("id", profileId);
        if (deferErr) return { ok: false, error: "Couldn't defer the text to the next send window" };
        return { ok: true, navigator: deferredNavigator, deferred: true };
      }
      // Scheduled fire outside the recipient's 8am–8pm window: the email is
      // out, the text waits for morning. sms-queue-flush re-checks opt-out
      // and the daily throttle at delivery — a STOP overnight cancels it.
      const { error: qErr } = await db.from("sms_queue").insert({
        to_phone: profile.phone,
        body: smsBody,
        email_type: "benefits_first_step_sms",
        recipient_type: "family",
        family_profile_id: profileId,
        send_after: sendAfter,
      });
      if (!qErr) {
        smsDelivered = true;
        smsDeliveryAt = sendAfter;
        nextCascade.first_step_sms_queued_for = sendAfter;
        sentSms = smsBody;
      } else {
        console.error("[navigator send] SMS quiet-hours enqueue failed:", qErr);
      }
    }
  }

  // For email families, SMS is a best-effort companion. For SMS-only
  // families it is the primary delivery, so a failed/skipped text must leave
  // the draft pending and retryable instead of pretending B1 was sent.
  if (!emailDelivered && !smsDelivered) {
    return { ok: false, error: "Navigator text could not be delivered" };
  }

  const firstStepAt = emailDelivered ? now : smsDeliveryAt;
  Object.assign(nextCascade, {
    first_step_sent_at: firstStepAt,
    first_step_program_id: navigator.pick?.programId,
    first_step_state_id: navigator.pick?.stateId || undefined,
    first_step_program_name: navigator.pick?.shortName,
  });
  const nextNavigator: BenefitsNavigatorMeta = {
    ...navigator,
    status: "sent",
    sent_at: firstStepAt,
    sent_via: opts.trigger,
    sent_subject: profile.email ? subject : undefined,
    sent_body: profile.email ? letter : undefined,
    sent_sms: sentSms,
    scheduled_at: undefined,
    schedule_failed_at: undefined,
    schedule_failed_reason: undefined,
  };

  const { error: sErr } = await db
    .from("business_profiles")
    .update({
      metadata: { ...meta, benefits_cascade: nextCascade, benefits_navigator: nextNavigator },
    })
    .eq("id", profileId);
  if (sErr) {
    // A delivery went out; a failed stamp must be visible, not silent.
    console.error("[navigator send] delivery succeeded but stamp failed:", sErr);
    return { ok: false, error: "Message sent, but recording it failed. Refresh before retrying." };
  }
  return { ok: true, navigator: nextNavigator };
}

/**
 * Record a blocked scheduled fire: clear the schedule (no hourly retry loops
 * into the same governance cap) and stamp the reason where the admin queue
 * shows it. The draft stays pending — TJ reschedules or sends manually.
 */
export async function markScheduleFailed(
  db: SupabaseClient,
  profileId: string,
  reason: string,
): Promise<void> {
  const { data: row } = await db
    .from("business_profiles")
    .select("metadata")
    .eq("id", profileId)
    .maybeSingle();
  const meta = (row?.metadata as Record<string, unknown> | null) || {};
  const navigator = readBenefitsNavigator(meta);
  if (navigator.status !== "pending") return;
  const next: BenefitsNavigatorMeta = {
    ...navigator,
    scheduled_at: undefined,
    schedule_failed_at: new Date().toISOString(),
    schedule_failed_reason: reason.slice(0, 300),
  };
  await db
    .from("business_profiles")
    .update({ metadata: { ...meta, benefits_navigator: next } })
    .eq("id", profileId);
}
