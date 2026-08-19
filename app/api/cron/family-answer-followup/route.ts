import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";
import { withCronRun } from "@/lib/crons/run";
import { sendSMS } from "@/lib/twilio";
import { quietHoursCheck } from "@/lib/sms/quiet-hours";
import { familyAnswerFollowupSms } from "@/lib/sms/templates";
import { isPhoneDoNotContact } from "@/lib/do-not-contact";
import { expireUnansweredFollowups } from "@/lib/family-answers/outcome.server";

/**
 * GET /api/cron/family-answer-followup
 *
 * Asks, seven days after we sent a researched answer, whether it got the family
 * anywhere. Runs daily.
 *
 * This exists because otherwise we are outcome-blind in exactly the way Ad
 * Boost was: we can see that a well-sourced draft went out and never learn
 * whether anyone's air conditioner got fixed. Every quality judgement about the
 * engine would then rest on how good the drafts look, which is the least
 * reliable signal available.
 *
 * The clock starts at `sent_at`, the last substantive reply, not at the first
 * inbound. A conversation that runs four days would otherwise get its follow-up
 * three days after it ended.
 *
 * This is a PROACTIVE send — we are initiating. So unlike the acknowledgement
 * it is opt-in territory, carries a STOP line, and is governed by the family
 * nudge caps. It cannot reuse sendReactiveFamilyAlert, which is transactional
 * only, so quiet hours and the deferred queue are handled the same way the
 * benefits cascade handles its proactive texts.
 */

export const maxDuration = 120;

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

interface DueJob {
  id: string;
  phone_last10: string;
  profile_id: string | null;
  sent_at: string;
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const { searchParams } = new URL(request.url);
  const querySecret = searchParams.get("secret");
  const dryRun = searchParams.get("dry_run") === "true";
  const limit = Math.min(100, parseInt(searchParams.get("limit") || "50", 10));

  const isAuthed =
    authHeader === `Bearer ${process.env.CRON_SECRET}` || querySecret === process.env.CRON_SECRET;
  if (!isAuthed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return withCronRun("family-answer-followup", async () => {
    const db = getServiceClient();
    const result = {
      due: 0,
      sent: 0,
      queued: 0,
      skipped_already_replied: 0,
      skipped_thread_active: 0,
      skipped_opted_out: 0,
      failed: 0,
      expired_no_response: 0,
    };

    // A family who never answered is data too: "we asked and heard nothing" is
    // a countable outcome, "we do not know" is not.
    result.expired_no_response = await expireUnansweredFollowups();

    const cutoff = new Date(Date.now() - SEVEN_DAYS_MS).toISOString();
    const { data: jobs, error } = await db
      .from("family_answer_jobs")
      .select("id, phone_last10, profile_id, sent_at")
      .eq("status", "sent")
      .is("followup_sent_at", null)
      .lte("sent_at", cutoff)
      .order("sent_at", { ascending: true })
      .limit(limit);

    if (error) {
      console.error("[family-answer-followup] Fetch failed:", error);
      return { ...result, error: error.message };
    }
    result.due = jobs?.length ?? 0;
    if (!jobs?.length) return result;
    if (dryRun) return { ...result, dryRun: true, ids: jobs.map((j) => j.id) };

    for (const job of jobs as DueJob[]) {
      try {
        const e164 = `+1${job.phone_last10}`;

        // ── Suppression, cheapest checks first ──────────────────────────

        // They already came back to us. Asking "did that help?" of someone
        // mid-conversation is noise, and the live thread will tell us more
        // than a keyword would.
        const { count: repliedSince } = await db
          .from("sms_inbound")
          .select("id", { count: "exact", head: true })
          .eq("phone_last10", job.phone_last10)
          .gt("created_at", job.sent_at);
        if (repliedSince && repliedSince > 0) {
          await db
            .from("family_answer_jobs")
            .update({ followup_sent_at: new Date().toISOString(), followup_skipped: "already_replied" })
            .eq("id", job.id);
          result.skipped_already_replied++;
          continue;
        }

        // A question is already in flight for this number. Do not interrupt it
        // with a retrospective about the last one.
        const { count: openJobs } = await db
          .from("family_answer_jobs")
          .select("id", { count: "exact", head: true })
          .eq("phone_last10", job.phone_last10)
          .in("status", ["pending", "running", "ready"]);
        if (openJobs && openJobs > 0) {
          await db
            .from("family_answer_jobs")
            .update({ followup_sent_at: new Date().toISOString(), followup_skipped: "thread_active" })
            .eq("id", job.id);
          result.skipped_thread_active++;
          continue;
        }

        // The cross-channel kill switch. sendSMS enforces it too, but a
        // proactive send should refuse before it gets that far.
        if (await isPhoneDoNotContact(job.phone_last10)) {
          await db
            .from("family_answer_jobs")
            .update({ followup_sent_at: new Date().toISOString(), followup_skipped: "opted_out" })
            .eq("id", job.id);
          result.skipped_opted_out++;
          continue;
        }

        // ── Send, or park until a civil hour ────────────────────────────
        let state: string | null = null;
        if (job.profile_id) {
          const { data: profile } = await db
            .from("business_profiles")
            .select("state, phone_validity")
            .eq("id", job.profile_id)
            .maybeSingle();
          if (profile?.phone_validity === "opted_out") {
            await db
              .from("family_answer_jobs")
              .update({ followup_sent_at: new Date().toISOString(), followup_skipped: "opted_out" })
              .eq("id", job.id);
            result.skipped_opted_out++;
            continue;
          }
          state = (profile?.state as string | null) ?? null;
        }

        const body = familyAnswerFollowupSms();
        const quiet = quietHoursCheck({ state });

        if (quiet.allowed) {
          const res = await sendSMS({
            to: e164,
            body,
            emailType: "family_answer_followup",
            recipientType: "family",
            recipientLogProfileId: job.profile_id ?? undefined,
          });
          if (res.success && !res.skipped) {
            await db
              .from("family_answer_jobs")
              .update({ followup_sent_at: new Date().toISOString() })
              .eq("id", job.id);
            result.sent++;
          } else {
            result.failed++;
          }
        } else {
          // sms-queue-flush re-checks opt-out and the daily throttle at
          // delivery, so a STOP overnight cancels this before it lands.
          const sendAfter = (quiet.sendAfter ?? new Date()).toISOString();
          const { error: qErr } = await db.from("sms_queue").insert({
            to_phone: e164,
            body,
            email_type: "family_answer_followup",
            recipient_type: "family",
            family_profile_id: job.profile_id,
            send_after: sendAfter,
          });
          if (qErr) {
            result.failed++;
          } else {
            // Stamped now rather than at flush: this row must not be picked up
            // again tomorrow while its text is still sitting in the queue.
            await db
              .from("family_answer_jobs")
              .update({ followup_sent_at: new Date().toISOString() })
              .eq("id", job.id);
            result.queued++;
          }
        }
      } catch (err) {
        result.failed++;
        console.error(`[family-answer-followup] Job ${job.id} threw:`, err);
      }
    }

    return result;
  });
}
