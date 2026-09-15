"use client";

/**
 * EmailFollowUpCard — what the Emails tab shows when you open a row.
 *
 * The Emails tab is no longer an event feed fed by sending-tool webhooks.
 * Nothing tells us when a provider opens, clicks or replies any more, so
 * the tab is a reminder: here is who is due a follow-up, here is the copy
 * to send them, and here is where you record what came back.
 *
 * Two actions, both manual, because both now happen in the operator's own
 * email client:
 *   Log email sent  — opens the send module (copy, flyer, log)
 *   Log a reply     — opens the reply classifier
 *
 * The row card is unchanged; this is the drawer surface only.
 */

import { useState } from "react";
import type { DrawerContext } from "@/lib/student-outreach/types";
import { SendEmailModal } from "@/components/admin/medjobs/SendEmailModal";
import { EmailReplyModal } from "@/components/admin/medjobs/EmailReplyModal";

type ActionFn = (
  actionName: string,
  payload?: Record<string, unknown>,
) => Promise<DrawerContext>;

function Block({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="mt-0.5 text-[13px] leading-relaxed text-gray-700">{text}</p>
    </div>
  );
}

/** How many emails have already gone out on this row. */
function sentCount(ctx: DrawerContext): number {
  return ctx.touchpoints.filter((t) => t.touchpoint_type === "email_sent").length;
}

export function EmailFollowUpCard({
  ctx,
  action,
  setError,
}: {
  ctx: DrawerContext;
  action: ActionFn;
  setError: (msg: string | null) => void;
}) {
  const [showSend, setShowSend] = useState(false);
  const [showReply, setShowReply] = useState(false);

  // Newest landed reply, if one was ever logged. Null renders the modal's
  // "no reply yet" state, which is now the normal case: nothing captures
  // replies automatically any more.
  const latestReply =
    [...ctx.touchpoints]
      .filter((t) => t.touchpoint_type === "email_replied")
      .sort((a, b) => b.created_at.localeCompare(a.created_at))[0] ?? null;

  const already = sentCount(ctx);
  const ordinal = already === 0 ? "Intro email" : `Follow-up #${already}`;
  const isProvider = ctx.outreach.kind === "provider";

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <p className="text-sm font-semibold text-gray-900">{ordinal}</p>
        <p className="text-xs text-gray-500">
          {already === 0
            ? "Nothing sent yet"
            : `${already} sent so far`}
        </p>
      </div>

      <div className="space-y-3">
        <Block
          label="What this is"
          text={
            already === 0
              ? "The first email to this contact, sent by you from your own inbox."
              : "A nudge on a thread that has not come back yet, sent by you from your own inbox."
          }
        />
        <Block
          label="Why"
          text="Replies arrive in your own inbox, so nothing here knows about them until you record it. Logging keeps the row honest for whoever picks it up next."
        />
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            Steps
          </p>
          <ol className="mt-1 list-decimal space-y-1 pl-5 text-[13px] text-gray-700">
            <li>Open Log email sent, copy the copy, attach the flyer.</li>
            <li>Send it from your own email client.</li>
            <li>When they write back, come here and log the reply.</li>
          </ol>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setShowSend(true)}
          className="rounded-md bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700"
        >
          ✉ Log email sent
        </button>
        <button
          onClick={() => setShowReply(true)}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
        >
          Log a reply
        </button>
      </div>

      {showSend && (
        <SendEmailModal
          organizationName={ctx.outreach.organization_name}
          campusSlug={ctx.campus?.slug ?? null}
          campusProgramPdfUrl={ctx.campus?.program_pdf_url ?? null}
          preview={ctx.smartlead_preview}
          pdfAudience={isProvider ? "provider" : "student"}
          onCancel={() => setShowSend(false)}
          onSubmit={async () => {
            try {
              await action("log_email_sent");
              setShowSend(false);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Failed to log the send");
              throw e;
            }
          }}
        />
      )}

      {showReply && (
        <EmailReplyModal
          ctx={ctx}
          action={action}
          reply={latestReply}
          source="reply"
          onClose={() => setShowReply(false)}
          setError={setError}
        />
      )}
    </section>
  );
}
