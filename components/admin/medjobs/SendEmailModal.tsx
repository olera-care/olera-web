"use client";

/**
 * SendEmailModal — the outreach plan, after Smartlead.
 *
 * Replaces the multi-day campaign builder. Outreach
 * is no longer scheduled or sent by us: the operator copies the email,
 * sends it from their own client with the flyer attached, and logs that
 * they did. One action, no cadence editor, no per-day variants.
 *
 * The copy is unchanged — it reads the same rendered intro step the
 * campaign builder previewed (day 0 of the cadence), so the words that
 * go out are the words the team already approved.
 */

import { useState } from "react";
import {
  resolveProgramPdfConfig,
  type PdfAudience,
} from "@/lib/program-pdf/configs";
import type { SmartleadPreviewSnapshot } from "@/lib/student-outreach/types";
import { CallScriptBlock } from "@/components/admin/medjobs/CallScriptBlock";

/** Rendered email HTML → plain text good enough to paste anywhere. */
export function htmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/(div|tr|li|h[1-6])>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<a[^>]+href="([^"]+)"[^>]*>(.*?)<\/a>/gi, "$2 ($1)")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function CopyButton({
  text,
  html,
  label = "Copy",
}: {
  text: string;
  html?: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      // Rich copy keeps links and paragraphs when pasted into Gmail or
      // Outlook. Falls back to plain text wherever ClipboardItem is absent.
      if (html && typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/html": new Blob([html], { type: "text/html" }),
            "text/plain": new Blob([text], { type: "text/plain" }),
          }),
        ]);
      } else {
        await navigator.clipboard.writeText(text);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — the text is on screen to select by hand */
    }
  };
  return (
    <button
      onClick={copy}
      className="shrink-0 rounded-md border border-gray-300 bg-white px-2 py-0.5 text-[11px] font-semibold text-gray-700 hover:bg-gray-50"
    >
      {copied ? "✓ Copied" : label}
    </button>
  );
}

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

export function SendEmailModal({
  organizationName,
  campusSlug,
  campusProgramPdfUrl,
  preview,
  pdfAudience = "provider",
  onCancel,
  onSubmit,
}: {
  organizationName: string;
  campusSlug?: string | null;
  campusProgramPdfUrl?: string | null;
  /** Rendered intro copy. Named for the old provider; it is just the
   *  cadence's day-0 subject + body, with sample vars substituted. */
  preview: SmartleadPreviewSnapshot | null;
  pdfAudience?: PdfAudience;
  onCancel: () => void;
  onSubmit: () => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);

  const recipients = preview?.recipients ?? [];
  const toLine = recipients.map((r) => r.email).filter(Boolean).join(", ");

  // Day 0 is the intro. Fall back to the first step for cadences that
  // start later.
  const intro =
    preview?.steps.find((s) => s.cadence_day === 0) ?? preview?.steps[0] ?? null;
  const subject = intro?.subject_preview ?? "";
  const bodyHtml = intro?.body_html_preview ?? "";
  const bodyText = bodyHtml ? htmlToPlainText(bodyHtml) : "";

  // Same resolution order the send path used: campus upload → campus
  // config → the generic floor. A flyer always resolves.
  const flyer = (() => {
    if (campusProgramPdfUrl) {
      const filename =
        decodeURIComponent(campusProgramPdfUrl.split("/").pop() ?? "").split("?")[0] ||
        "program.pdf";
      return { filename, url: campusProgramPdfUrl };
    }
    const config = resolveProgramPdfConfig(campusSlug, pdfAudience);
    if (!config) return null;
    return {
      filename: `${config.slug}-${pdfAudience === "student" ? "student-program" : "student-caregiver-program"}.pdf`,
      url: `/api/medjobs/program-pdf?university=${config.slug}&audience=${pdfAudience}`,
    };
  })();

  const canLog = recipients.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
      <div className="mt-8 w-full max-w-2xl rounded-lg bg-white shadow-xl">
        <div className="border-b border-gray-200 px-5 py-3">
          <h2 className="text-sm font-semibold text-gray-900">Send the intro email</h2>
          <p className="mt-0.5 text-xs text-gray-500">{organizationName}</p>
        </div>

        <div className="space-y-4 px-5 py-4">
          <Block
            label="What this is"
            text="The first email to this provider, sent by you from your own inbox."
          />
          <Block
            label="Why"
            text="It comes from a real person at a real address, so replies land in your inbox and nothing depends on a sending tool."
          />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Step
            </p>
            <ol className="mt-1 list-decimal space-y-1 pl-5 text-[13px] text-gray-700">
              <li>Copy the email below and paste it into your email client.</li>
              <li>Download the flyer and attach it.</li>
              <li>Send it, then log it here.</li>
            </ol>
          </div>

          <section className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  To
                </p>
                <p className="mt-0.5 break-words text-[12px] text-gray-700">
                  {toLine || "No email on file — add one in the drawer first."}
                </p>
              </div>
              {toLine && <CopyButton text={toLine} />}
            </div>
          </section>

          {subject && (
            <section className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                    Subject
                  </p>
                  <p className="mt-0.5 break-words text-[12px] text-gray-700">{subject}</p>
                </div>
                <CopyButton text={subject} />
              </div>
            </section>
          )}

          {bodyText ? (
            <div>
              <div className="mb-1 flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  Email body
                </p>
                <CopyButton text={bodyText} html={bodyHtml} label="Copy email" />
              </div>
              <CallScriptBlock label="" script={bodyText} />
            </div>
          ) : (
            <p className="rounded-md border border-dashed border-gray-300 px-3 py-4 text-center text-xs text-gray-400">
              No email copy on file for this cadence.
            </p>
          )}

          {flyer && (
            <section className="flex items-center justify-between gap-3 rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5">
              <p className="min-w-0 truncate text-[12px] text-gray-700">
                📎 {flyer.filename}
              </p>
              <a
                href={flyer.url}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="shrink-0 rounded-md border border-gray-300 bg-white px-2 py-0.5 text-[11px] font-semibold text-gray-700 hover:bg-gray-50"
              >
                Download
              </a>
            </section>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-5 py-3">
          <button
            onClick={onCancel}
            disabled={saving}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              setSaving(true);
              try {
                await onSubmit();
              } finally {
                setSaving(false);
              }
            }}
            disabled={saving || !canLog}
            title={canLog ? undefined : "Add a recipient email first."}
            className="rounded-md bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Logging…" : "Log email sent"}
          </button>
        </div>
      </div>
    </div>
  );
}
