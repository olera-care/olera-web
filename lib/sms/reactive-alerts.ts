/**
 * Reactive care-seeker SMS alerts — the Tier-1 "a provider got back to you" text.
 *
 * These fire when something real happens TO a family that initiated an inquiry
 * (a provider replied / reached out). They are TRANSACTIONAL: cap-exempt, no
 * express-written consent required (the family started the thread). The only
 * gates are: a usable phone, not opted out, a per-day safety throttle, and
 * quiet hours. A send that lands outside 8am–8pm recipient-local is enqueued to
 * sms_queue and delivered at the next window open by the sms-queue-flush cron —
 * the family still gets the email immediately.
 *
 * Deep links in the body MUST be stable (a sign-in path or guest token), never a
 * 1-hour magic link — a queued text could be delivered the next morning.
 */

import { getServiceClient } from "@/lib/admin";
import { sendSMS, normalizeUSPhone } from "@/lib/twilio";
import { quietHoursCheck } from "./quiet-hours";
import { isTransactionalSms } from "./channel-policy";
import { readBenefitsCascade } from "@/lib/family-comms/benefits-cascade.server";

/** Safety ceiling on reactive texts to one number per (UTC) day. Replies are low-volume; this only catches a storm. */
export const DAILY_SMS_SAFETY_CAP = 6;

export interface ReactiveAlertOptions {
  /** business_profiles.id of the family (for logging + opt-out re-check at flush). */
  familyProfileId: string;
  phone?: string | null;
  /** Family's US state (2-letter) for quiet-hours timezone. */
  state?: string | null;
  /** business_profiles.phone_validity — 'opted_out' hard-blocks SMS. */
  phoneValidity?: string | null;
  /** Must be an sms_reactive type in the channel policy (else skipped). */
  emailType: string;
  /** Rendered SMS body. Keep ≤160 chars; use a STABLE link, not a magic link. */
  body: string;
  /** Injectable clock for tests. */
  now?: Date;
}

export type ReactiveAlertResult =
  | { status: "sent" }
  | { status: "queued"; sendAfter: Date }
  | { status: "skipped"; reason: string };

function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/** True when `phone` has already hit the daily reactive-SMS safety cap. */
async function isOverDailyThrottle(
  db: ReturnType<typeof getServiceClient>,
  phone: string,
  now: Date
): Promise<boolean> {
  const { count, error } = await db
    .from("email_log")
    .select("id", { count: "exact", head: true })
    .eq("channel", "sms")
    .eq("recipient", phone)
    .eq("status", "sent")
    .gte("created_at", startOfUtcDay(now).toISOString());
  if (error) return false; // fail open — a real reply alert shouldn't be lost to a count error
  return typeof count === "number" && count >= DAILY_SMS_SAFETY_CAP;
}

/**
 * Send (or queue) a reactive reply-alert SMS to a family. Safe to await in a
 * route — never throws; returns a status the caller can log.
 */
export async function sendReactiveFamilyAlert(opts: ReactiveAlertOptions): Promise<ReactiveAlertResult> {
  try {
    if (!isTransactionalSms(opts.emailType)) {
      return { status: "skipped", reason: "not_reactive_type" };
    }
    const phone = opts.phone ? normalizeUSPhone(opts.phone) : null;
    if (!phone) return { status: "skipped", reason: "no_phone" };
    if (opts.phoneValidity === "opted_out") return { status: "skipped", reason: "opted_out" };

    const now = opts.now ?? new Date();
    const db = getServiceClient();

    if (await isOverDailyThrottle(db, phone, now)) {
      return { status: "skipped", reason: "daily_throttle" };
    }

    const quiet = quietHoursCheck({ now, state: opts.state });
    if (quiet.allowed) {
      const res = await sendSMS({
        to: phone,
        body: opts.body,
        emailType: opts.emailType,
        recipientType: "family",
        recipientLogProfileId: opts.familyProfileId,
        metadata: { reactive: true },
      });
      return res.success
        ? { status: "sent" }
        : { status: "skipped", reason: res.error ?? "send_failed" };
    }

    // Outside the recipient's quiet-hours window — defer to the next window open.
    const sendAfter = quiet.sendAfter ?? now;
    await db.from("sms_queue").insert({
      to_phone: phone,
      body: opts.body,
      email_type: opts.emailType,
      recipient_type: "family",
      family_profile_id: opts.familyProfileId,
      send_after: sendAfter.toISOString(),
    });
    return { status: "queued", sendAfter };
  } catch (err) {
    console.error("[reactive-sms] Error:", err);
    return { status: "skipped", reason: "error" };
  }
}

const MAX_FLUSH_ATTEMPTS = 3;

export type FlushResult = {
  considered: number;
  sent: number;
  canceled: number;
  failed: number;
  requeued: number;
};

const BENEFITS_QUEUED_TYPES = new Set([
  "benefits_first_step_sms",
  "benefits_check_in_sms",
]);

async function stampBenefitsQueueDelivery(
  db: ReturnType<typeof getServiceClient>,
  profileId: string,
  emailType: string,
  at: string,
): Promise<void> {
  if (!BENEFITS_QUEUED_TYPES.has(emailType)) return;
  const { data: profile } = await db
    .from("business_profiles")
    .select("metadata")
    .eq("id", profileId)
    .maybeSingle();
  if (!profile) return;
  const metadata = (profile.metadata as Record<string, unknown> | null) || {};
  const cascade = readBenefitsCascade(metadata);
  const nextCascade = { ...cascade };
  if (emailType === "benefits_first_step_sms") {
    nextCascade.first_step_sms_at = at;
    delete nextCascade.first_step_sms_queued_for;
  } else {
    nextCascade.check_sms_at = at;
    nextCascade.check_sent_at ||= at;
    delete nextCascade.check_sms_queued_for;
  }
  const { error } = await db
    .from("business_profiles")
    .update({ metadata: { ...metadata, benefits_cascade: nextCascade } })
    .eq("id", profileId);
  if (error) console.error("[sms-queue] Benefits delivery stamp failed:", error);
}

async function clearBenefitsQueuePending(
  db: ReturnType<typeof getServiceClient>,
  profileId: string,
  emailType: string,
): Promise<void> {
  if (!BENEFITS_QUEUED_TYPES.has(emailType)) return;
  const { data: profile } = await db
    .from("business_profiles")
    .select("metadata")
    .eq("id", profileId)
    .maybeSingle();
  if (!profile) return;
  const metadata = (profile.metadata as Record<string, unknown> | null) || {};
  const cascade = readBenefitsCascade(metadata);
  const nextCascade = { ...cascade };
  if (emailType === "benefits_first_step_sms") {
    delete nextCascade.first_step_sms_queued_for;
  } else {
    // Older builds prematurely copied the queue due time into check_sent_at.
    // Remove that synthetic stamp only when it matches the queued value.
    if (
      nextCascade.check_sms_queued_for &&
      nextCascade.check_sent_at === nextCascade.check_sms_queued_for
    ) {
      delete nextCascade.check_sent_at;
    }
    delete nextCascade.check_sms_queued_for;
  }
  const { error } = await db
    .from("business_profiles")
    .update({ metadata: { ...metadata, benefits_cascade: nextCascade } })
    .eq("id", profileId);
  if (error) console.error("[sms-queue] Benefits pending-stamp cleanup failed:", error);
}

/**
 * Deliver due rows from sms_queue. Called by the sms-queue-flush cron. Re-checks
 * opt-out and the daily throttle at delivery time (state changed since enqueue),
 * so a family who texted STOP overnight is never sent the held message.
 */
export async function flushDueSmsQueue(now?: Date): Promise<FlushResult> {
  const at = now ?? new Date();
  const db = getServiceClient();
  const result: FlushResult = { considered: 0, sent: 0, canceled: 0, failed: 0, requeued: 0 };

  const { data: due, error } = await db
    .from("sms_queue")
    .select("id, to_phone, body, email_type, recipient_type, family_profile_id, attempts")
    .eq("status", "pending")
    .lte("send_after", at.toISOString())
    .order("send_after", { ascending: true })
    .limit(200);
  if (error || !due) return result;

  for (const row of due) {
    result.considered++;

    // Re-check opt-out against the family profile (it may have changed since enqueue).
    if (row.family_profile_id) {
      const { data: prof } = await db
        .from("business_profiles")
        .select("phone_validity, metadata")
        .eq("id", row.family_profile_id)
        .maybeSingle();
      if (prof?.phone_validity === "opted_out") {
        await db.from("sms_queue").update({ status: "canceled", last_error: "opted_out" }).eq("id", row.id);
        await clearBenefitsQueuePending(db, row.family_profile_id, row.email_type);
        result.canceled++;
        continue;
      }
      if (
        BENEFITS_QUEUED_TYPES.has(row.email_type) &&
        !(prof?.metadata as { sms_consent?: unknown } | null)?.sms_consent
      ) {
        await db.from("sms_queue").update({ status: "canceled", last_error: "consent_removed" }).eq("id", row.id);
        await clearBenefitsQueuePending(db, row.family_profile_id, row.email_type);
        result.canceled++;
        continue;
      }
    }

    // Re-check the daily safety throttle.
    if (await isOverDailyThrottle(db, row.to_phone, at)) {
      await db.from("sms_queue").update({ status: "canceled", last_error: "daily_throttle" }).eq("id", row.id);
      if (row.family_profile_id) {
        await clearBenefitsQueuePending(db, row.family_profile_id, row.email_type);
      }
      result.canceled++;
      continue;
    }

    const res = await sendSMS({
      to: row.to_phone,
      body: row.body,
      emailType: row.email_type,
      recipientType: (row.recipient_type as "family" | undefined) ?? "family",
      recipientLogProfileId: row.family_profile_id ?? undefined,
      metadata: { reactive: isTransactionalSms(row.email_type), queued: true },
    });

    if (res.success && !res.skipped) {
      const sentAt = at.toISOString();
      await db.from("sms_queue").update({
        status: "sent", sent_at: sentAt, attempts: (row.attempts ?? 0) + 1,
      }).eq("id", row.id);
      if (row.family_profile_id) {
        await stampBenefitsQueueDelivery(db, row.family_profile_id, row.email_type, sentAt);
      }
      result.sent++;
    } else if (res.skipped) {
      await db.from("sms_queue").update({
        status: "canceled", attempts: (row.attempts ?? 0) + 1, last_error: "suppressed",
      }).eq("id", row.id);
      if (row.family_profile_id) {
        await clearBenefitsQueuePending(db, row.family_profile_id, row.email_type);
      }
      result.canceled++;
    } else {
      const attempts = (row.attempts ?? 0) + 1;
      const failed = attempts >= MAX_FLUSH_ATTEMPTS;
      await db.from("sms_queue").update({
        status: failed ? "failed" : "pending", attempts, last_error: res.error ?? "send_failed",
      }).eq("id", row.id);
      if (failed) {
        if (row.family_profile_id) {
          await clearBenefitsQueuePending(db, row.family_profile_id, row.email_type);
        }
        result.failed++;
      }
      else result.requeued++;
    }
  }

  return result;
}
