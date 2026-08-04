/**
 * Benefits Care Navigator — the ONE send path for approved letters.
 *
 * Extracted from the admin per-family route so the scheduler cron and TJ's
 * "Send as TJ" button run byte-identical logic: same governance (the
 * benefits_first_step family caps, DNC, suppression — all inside sendEmail),
 * same cascade stamping (B2 keys off first_step_sent_at, so the check-in
 * schedules 3d after the REAL send), same consent-gated SMS companion.
 *
 * The only trigger-specific behavior is SMS quiet hours: TJ clicking the
 * button at 2pm needs no gate, but a scheduled fire can land at 9pm in the
 * recipient's timezone — the scheduler path parks the companion text in
 * sms_queue for the next window open (the email itself sends immediately;
 * email has no quiet-hours rule).
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
import { readBenefitsCascade } from "./benefits-cascade.server";
import {
  readBenefitsNavigator,
  renderNavigatorEmail,
  type BenefitsNavigatorMeta,
} from "./benefits-navigator.server";

export interface NavigatorSendOptions {
  profileId: string;
  /** Drawer overrides (the admin route passes TJ's live edits). Omitted →
   *  saved edits → AI original, in that order. */
  subject?: string | null;
  body?: string | null;
  sms?: string | null;
  /** admin = TJ's button (no SMS quiet-hours gate — he's awake, so are they,
   *  roughly); scheduler = the cron (companion text respects quiet hours). */
  trigger: "admin" | "scheduler";
}

export type NavigatorSendResult =
  | { ok: true; navigator: BenefitsNavigatorMeta }
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
  if (!profile.email) {
    return { ok: false, error: "Family has no email on file", conflict: true };
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

  // Stamp the cascade exactly as the old B1 rung did — B2 keys off
  // first_step_sent_at, so the check-in schedules 3d after the REAL send.
  const cascade = readBenefitsCascade(meta);
  const nextCascade: Record<string, unknown> = {
    ...cascade,
    first_step_sent_at: now,
    first_step_program_id: navigator.pick?.programId,
    first_step_state_id: navigator.pick?.stateId || undefined,
    first_step_program_name: navigator.pick?.shortName,
  };
  const nextNavigator: BenefitsNavigatorMeta = {
    ...navigator,
    status: "sent",
    sent_at: now,
    sent_via: opts.trigger,
    sent_subject: subject,
    sent_body: letter,
    scheduled_at: undefined,
    schedule_failed_at: undefined,
    schedule_failed_reason: undefined,
  };

  // Consent-gated SMS companion, same gate as the coordinator's cascade
  // mirror (phone + sms_consent + not opted out). Body preference mirrors the
  // letter: request edit, then saved edit, then the composed TJ-voiced draft,
  // then the old template. The composed text carries a {link} placeholder
  // (direct URL, not a magic link — SMS length budget) and the STOP suffix is
  // appended here so the model never writes compliance copy. Awaited: Vercel
  // kills pending promises after the response.
  const smsEligible =
    !!profile.phone && !!(meta as { sms_consent?: unknown }).sms_consent &&
    profile.phone_validity !== "opted_out";
  if (smsEligible && profile.phone && navigator.pick) {
    const smsPlanUrl = `${siteUrl}${planPath}`;
    const editedSms =
      typeof opts.sms === "string" && opts.sms.trim().length >= 20
        ? opts.sms.trim().slice(0, 400)
        : null;
    const draftSms = editedSms || navigator.edited_sms || navigator.sms || null;
    // Append the opt-out line only when it isn't already there (the model
    // is told not to write it, but a disobedient draft or a TJ edit that
    // includes it must not produce a doubled STOP line).
    const stopSuffix = draftSms && /reply stop/i.test(draftSms) ? "" : " Reply STOP to opt out.";
    const smsBody = draftSms
      ? `${draftSms.replace(/\{link\}/g, smsPlanUrl)}${stopSuffix}`
      : benefitsFirstStepSms({
          programShortName: navigator.pick.shortName,
          phone: navigator.pick.contactPhone,
          topDocs: navigator.pick.documents,
          url: `${siteUrl}${navigator.pick.programPath}`,
        });

    const quiet =
      opts.trigger === "scheduler"
        ? quietHoursCheck({ state: profile.state as string | null })
        : { allowed: true, sendAfter: null };
    if (quiet.allowed) {
      const sms = await sendSMS({
        to: profile.phone,
        body: smsBody,
        emailType: "benefits_first_step_sms",
        recipientType: "family",
        recipientLogProfileId: profileId,
      });
      if (sms.success && !sms.skipped) {
        nextCascade.first_step_sms_at = now;
        nextNavigator.sent_sms = smsBody;
      } else if (sms.error?.includes("21610")) {
        await db
          .from("business_profiles")
          .update({ phone_validity: "opted_out" })
          .eq("id", profileId);
      }
    } else {
      // Scheduled fire outside the recipient's 8am–8pm window: the email is
      // out, the text waits for morning. sms-queue-flush re-checks opt-out
      // and the daily throttle at delivery — a STOP overnight cancels it.
      const sendAfter = (quiet.sendAfter ?? new Date()).toISOString();
      const { error: qErr } = await db.from("sms_queue").insert({
        to_phone: profile.phone,
        body: smsBody,
        email_type: "benefits_first_step_sms",
        recipient_type: "family",
        family_profile_id: profileId,
        send_after: sendAfter,
      });
      if (!qErr) {
        nextCascade.first_step_sms_queued_for = sendAfter;
        nextNavigator.sent_sms = smsBody;
      } else {
        console.error("[navigator send] SMS quiet-hours enqueue failed:", qErr);
      }
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
    return { ok: false, error: "Email sent, but recording it failed. Refresh before retrying." };
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
