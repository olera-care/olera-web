"use client";

/**
 * FollowUpDrawerBody — the Follow-ups tab drawer, rounds 2-7.
 *
 * One screen for one round: check the inbox, and if nothing came back, call
 * and email. Both channels sit here together because they are one round of
 * work, not two queues — which is why the Calls and Emails tabs collapsed
 * into this one.
 *
 * "They replied, and I responded" is the only way out of the loop.
 */

import { useState } from "react";
import type { DrawerContext } from "@/lib/student-outreach/types";
import { roundStateFrom } from "@/lib/student-outreach/rounds";
import { CallScriptBlock } from "@/components/admin/medjobs/CallScriptBlock";
import { SendEmailModal } from "@/components/admin/medjobs/SendEmailModal";
import { RepliedModal } from "@/components/admin/medjobs/RepliedModal";
import { CallOutcomeModal, type OutcomeChoice } from "@/components/admin/medjobs/CallOutcomeModal";

type ActionFn = (
  actionName: string,
  payload?: Record<string, unknown>,
) => Promise<DrawerContext>;

const CALL_OUTCOMES: OutcomeChoice[] = [
  { key: "no_answer", label: "No answer", blurb: "Nobody picked up. The round still counts as worked.", tone: "neutral" },
  { key: "voicemail", label: "Left a voicemail", blurb: "Message left. The round still counts as worked.", tone: "neutral" },
  { key: "spoke", label: "Spoke to someone", blurb: "Got through. Log what they said with They replied below if it moves things on.", tone: "happy" },
  { key: "not_interested", label: "Not interested", blurb: "They said no. Rounds stop and the row closes.", tone: "close" },
];

function Block({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-0.5 text-[13px] leading-relaxed text-gray-700">{text}</p>
    </div>
  );
}

function Dots({ done, total }: { done: number; total: number }) {
  return (
    <span className="inline-flex items-center gap-1" aria-label={`${done} of ${total} rounds done`}>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`inline-block h-1.5 w-1.5 rounded-full ${
            i < done ? "bg-primary-600" : "bg-gray-300"
          }`}
        />
      ))}
    </span>
  );
}

export function FollowUpDrawerBody({
  ctx,
  action,
  setError,
}: {
  ctx: DrawerContext;
  action: ActionFn;
  setError: (msg: string | null) => void;
}) {
  const [showCall, setShowCall] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [showReplied, setShowReplied] = useState(false);

  const rs = roundStateFrom(ctx.pending_tasks ?? []);
  const gc = ctx.outreach.research_data?.general_contact ?? {};
  const phone = gc.phone ?? ctx.provider_business_profile?.phone ?? null;

  // Carried forward from the reply that started this set, so whoever works the
  // row has the context without digging through the timeline.
  const carried =
    typeof ctx.outreach.research_data?.set_context === "string"
      ? (ctx.outreach.research_data.set_context as string)
      : null;

  const script =
    (typeof rs.task?.payload?.script === "string" ? rs.task.payload.script : null) ??
    `"Hi, this is [your name] from Dr. DuBose's office. I emailed about the Student Caregiver Program at ${ctx.campus?.name ?? "the university"} — did that reach the right person?"`;

  // Halves of one task. Logging one stamps the payload; logging both
  // completes the task, which is what advances the round.
  const callDone = rs.callLogged;
  const emailDone = rs.emailLogged;

  const logHalf = async (half: "call" | "email") => {
    if (!rs.task) return;
    await action("log_contact_half", { task_id: rs.task.id, half });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-semibold text-gray-900">
          {rs.set > 1 ? `Set ${rs.set} · ` : ""}Round {rs.round} of {rs.totalRounds}
        </p>
        <Dots done={rs.completedRounds} total={rs.totalRounds} />
      </div>

      {carried && (
        <section className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            From the last set
          </p>
          <p className="mt-0.5 whitespace-pre-wrap text-[13px] leading-relaxed text-gray-700">
            {carried}
          </p>
        </section>
      )}

      <section className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
        <Block label="What this is" text="The 2-day check on this provider." />
        <Block label="Why" text="No reply yet." />
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Steps</p>
          <ol className="mt-1 list-decimal space-y-1 pl-5 text-[13px] text-gray-700">
            <li>Check your inbox.</li>
            <li>Reply → log it and respond.</li>
            <li>No reply → call, then email.</li>
          </ol>
        </div>
        <button
          onClick={() => setShowReplied(true)}
          className="w-full rounded-md bg-primary-600 px-3 py-2 text-xs font-semibold text-white hover:bg-primary-700"
        >
          They replied, and I responded
        </button>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="mb-2 flex items-baseline justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Call</p>
          {callDone && <span className="text-[11px] font-medium text-primary-700">✓ logged</span>}
        </div>
        <CallScriptBlock label={`Round ${rs.round} script`} script={script} />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowCall(true)}
            disabled={callDone}
            className="rounded-md bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            📞 Log call
          </button>
          {phone ? (
            <a
              href={`tel:${String(phone).replace(/[^\d+]/g, "")}`}
              className="text-xs font-medium text-primary-700 underline-offset-2 hover:underline"
            >
              {String(phone)}
            </a>
          ) : (
            <span className="text-xs text-gray-400">No number on file</span>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="mb-2 flex items-baseline justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Email</p>
          {emailDone && <span className="text-[11px] font-medium text-primary-700">✓ logged</span>}
        </div>
        <p className="text-[13px] text-gray-700">
          Copy the round {rs.round} email, attach the flyer, send it from your own inbox.
        </p>
        <button
          onClick={() => setShowEmail(true)}
          disabled={emailDone}
          className="mt-3 rounded-md bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          ✉ Open email
        </button>
      </section>

      {showCall && (
        <CallOutcomeModal
          title={`Log round ${rs.round} call`}
          subtitle={ctx.outreach.organization_name}
          outcomes={CALL_OUTCOMES}
          notesPlaceholder="Anything worth knowing next round?"
          onCancel={() => setShowCall(false)}
          onSubmit={async (outcomeKey, notes) => {
            setError(null);
            try {
              if (outcomeKey === "not_interested") {
                await action("log_call_outcome", { outcome: "connected_not_interested", notes });
              } else {
                await action("log_call_outcome", { outcome: outcomeKey, notes });
              }
              await logHalf("call");
              setShowCall(false);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Failed to log the call");
            }
          }}
        />
      )}

      {showEmail && (
        <SendEmailModal
          organizationName={ctx.outreach.organization_name}
          campusSlug={ctx.campus?.slug ?? null}
          campusProgramPdfUrl={ctx.campus?.program_pdf_url ?? null}
          preview={ctx.smartlead_preview}
          pdfAudience={ctx.outreach.kind === "provider" ? "provider" : "student"}
          onCancel={() => setShowEmail(false)}
          onSubmit={async () => {
            await action("log_email_sent");
            await logHalf("email");
            setShowEmail(false);
          }}
        />
      )}

      {showReplied && (
        <RepliedModal
          ctx={ctx}
          action={action}
          onClose={() => setShowReplied(false)}
          setError={setError}
        />
      )}
    </div>
  );
}
