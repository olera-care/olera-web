"use client";

/**
 * OfferCallModal — admin sends Logan's Calendly link to a stakeholder
 * who replied. They handle the actual reply in their email client; this
 * modal just gives them the link to copy and lets them mark that they
 * sent it (so we have a touchpoint in history).
 */

import { useEffect, useState } from "react";

const CALENDLY_URL = "https://calendly.com/caregivers979/olera-demo";

interface Props {
  organizationName: string;
  contactFirstName?: string;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}

export function OfferCallModal({
  organizationName,
  contactFirstName,
  onCancel,
  onConfirm,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const suggestedReply = [
    `Hi ${contactFirstName ?? "there"},`,
    ``,
    `Thanks for getting back to me! Happy to set up a quick 15-minute call so we can chat through the details.`,
    ``,
    `Grab any time that works for you here: ${CALENDLY_URL}`,
    ``,
    `It'll go right on Dr. Logan DuBose's calendar.`,
    ``,
    `Best,`,
  ].join("\n");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(suggestedReply);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(CALENDLY_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-xl bg-white shadow-2xl">
        <header className="border-b border-gray-100 px-6 py-4">
          <h3 className="text-base font-semibold text-gray-900">Offer a 15-min call</h3>
          <p className="mt-0.5 text-xs text-gray-500">
            Replying to <strong>{organizationName}</strong>. Copy the message below into
            your reply, or just send the Calendly link. Logan owns the meeting.
          </p>
        </header>

        <div className="flex-1 space-y-3 overflow-y-auto px-6 py-4">
          <div className="rounded-md border border-blue-100 bg-blue-50/60 p-3">
            <p className="text-xs font-medium text-blue-900">Calendly link (Logan's)</p>
            <div className="mt-1 flex items-center gap-2">
              <code className="flex-1 truncate rounded bg-white px-2 py-1 text-xs text-gray-800">{CALENDLY_URL}</code>
              <button
                onClick={copyLink}
                className="rounded-md border border-blue-200 bg-white px-2.5 py-1 text-xs font-medium text-blue-800 hover:bg-blue-50"
              >
                {copied ? "Copied!" : "Copy link"}
              </button>
            </div>
          </div>

          <div>
            <p className="mb-1 text-xs font-medium text-gray-700">Suggested reply</p>
            <pre className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs whitespace-pre-wrap text-gray-800">
{suggestedReply}
            </pre>
            <button
              onClick={copy}
              className="mt-2 rounded-md border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              {copied ? "Copied!" : "Copy whole message"}
            </button>
          </div>

          <p className="rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-700">
            Send the message from your email client, then click below so we record that
            you offered a call. <strong>Don't click yet</strong> if you haven't sent it.
          </p>
        </div>

        <footer className="flex justify-end gap-2 border-t border-gray-100 bg-gray-50 px-6 py-3">
          <button
            onClick={onCancel}
            disabled={submitting}
            className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              setSubmitting(true);
              try { await onConfirm(); } finally { setSubmitting(false); }
            }}
            disabled={submitting}
            className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {submitting ? "Saving…" : "I sent the link"}
          </button>
        </footer>
      </div>
    </div>
  );
}
