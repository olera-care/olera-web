"use client";

/**
 * EmailComposerModal — review template, open mailto, confirm sent.
 *
 * Two-step pattern (per critique #5): admin clicks "Open in mail client",
 * then explicitly confirms whether the email was actually sent. Logging
 * happens only on confirm.
 *
 * Falls back to a "Copy body" button when the mailto: URL would be too
 * long for the browser, or when the admin prefers paste-into-Gmail.
 */

import { useEffect, useState } from "react";
import { buildMailto, type EmailDraft } from "@/lib/student-outreach/templates";

const MAILTO_SAFE_LEN = 1500;

interface Props {
  to: string;
  draft: EmailDraft;
  onCancel: () => void;
  onConfirmSent: (notes?: string) => void;
}

export function EmailComposerModal({ to, draft, onCancel, onConfirmSent }: Props) {
  const [recipient, setRecipient] = useState(to);
  const [subject, setSubject] = useState(draft.subject);
  const [body, setBody] = useState(draft.body);
  const [opened, setOpened] = useState(false);
  const [copied, setCopied] = useState(false);

  // Lock background scroll while modal is open.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const mailtoUrl = buildMailto(recipient, { subject, body });
  const tooLong = mailtoUrl.length > MAILTO_SAFE_LEN;

  const openMail = () => {
    setOpened(true);
    window.location.href = mailtoUrl;
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Compose email</h3>
            <p className="mt-0.5 text-xs text-gray-500">
              Edit the draft if needed, send from your own client, then confirm below.
            </p>
          </div>
          <button onClick={onCancel} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100" aria-label="Close">
            <span aria-hidden>×</span>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-600">To</span>
            <input
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="recipient@example.edu"
              className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm focus:border-gray-400 focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-600">Subject</span>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm focus:border-gray-400 focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-600">Body</span>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={14}
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm font-mono focus:border-gray-400 focus:outline-none"
            />
          </label>

          {tooLong && (
            <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
              This email is long enough that some browsers may truncate it via mailto:. Use "Copy body" then paste into your mail client.
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-2">
            <button
              onClick={openMail}
              disabled={!recipient.trim()}
              className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
            >
              Open in mail client
            </button>
            <button
              onClick={copy}
              className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {copied ? "Copied!" : "Copy body"}
            </button>
            {opened && (
              <span className="text-xs italic text-gray-500">
                Opened — finish in your mail client, then confirm below.
              </span>
            )}
          </div>
        </div>

        <footer className="flex items-center justify-between gap-2 border-t border-gray-100 bg-gray-50 px-6 py-3">
          <p className="text-xs text-gray-500">
            Did you actually send the email? We only log it when you confirm.
          </p>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Not yet
            </button>
            <button
              onClick={() => onConfirmSent()}
              className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Yes, log as sent
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
