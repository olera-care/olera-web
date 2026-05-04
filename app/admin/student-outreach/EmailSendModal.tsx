"use client";

/**
 * EmailSendModal — v3.
 *
 * Replaces the v2 mailto: composer. Multi-recipient picker, editable
 * subject + body (placeholders intact), one click to send via Resend
 * with the PDF flyer auto-attached. One personalized email per
 * recipient is sent server-side.
 */

import { useEffect, useMemo, useState } from "react";
import type { Contact } from "@/lib/student-outreach/types";
import type { EmailDraft } from "@/lib/student-outreach/templates";
import type { StepId, TemplateKey } from "@/lib/student-outreach/cadence";
import { firstNameOf, substituteVars } from "@/lib/student-outreach/templates";

interface Props {
  /** All contacts on the outreach row (modal will filter to emailable ones). */
  contacts: Contact[];
  /** Initial subject/body — usually the rendered template. */
  draft: EmailDraft;
  /** What the admin is sending. Logged with the touchpoint. */
  cadenceDay: number;
  stepId: StepId;
  template: TemplateKey;
  /** For preview substitution. */
  organizationName: string;
  campusName: string;
  /** Closes the modal without sending. */
  onCancel: () => void;
  /** Submits the send. Receives the resolved fields; modal closes on success. */
  onSubmit: (payload: {
    recipient_contact_ids: string[];
    subject: string;
    body: string;
    cadence_day: number;
    step_id: StepId;
    template: TemplateKey;
  }) => Promise<void>;
}

export function EmailSendModal({
  contacts,
  draft,
  cadenceDay,
  stepId,
  template,
  organizationName,
  campusName,
  onCancel,
  onSubmit,
}: Props) {
  const eligible = useMemo(
    () => contacts.filter((c) => c.status === "active" && c.email && c.email.trim().length > 0),
    [contacts],
  );
  const [selected, setSelected] = useState<Set<string>>(() => new Set(eligible.map((c) => c.id)));
  const [subject, setSubject] = useState(draft.subject);
  const [body, setBody] = useState(draft.body);
  const [previewFor, setPreviewFor] = useState<string | null>(eligible[0]?.id ?? null);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const selectAll = () => setSelected(new Set(eligible.map((c) => c.id)));
  const selectNone = () => setSelected(new Set());

  const previewContact = eligible.find((c) => c.id === previewFor) ?? null;
  const previewVars = {
    first_name: firstNameOf(previewContact?.name),
    organization_name: organizationName,
    campus_name: campusName,
    admin_first_name: "{admin_first_name}",
  };
  const previewSubject = substituteVars(subject, previewVars);
  const previewBody = substituteVars(body, previewVars);

  const submit = async () => {
    setErr(null);
    if (selected.size === 0) return setErr("Pick at least one recipient");
    if (!subject.trim() || !body.trim()) return setErr("Subject and body required");
    setSubmitting(true);
    try {
      await onSubmit({
        recipient_contact_ids: Array.from(selected),
        subject: subject.trim(),
        body: body.trim(),
        cadence_day: cadenceDay,
        step_id: stepId,
        template,
      });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Send failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Send outreach email</h3>
            <p className="mt-0.5 text-xs text-gray-500">
              One personalized email per selected recipient · PDF flyer attached automatically
            </p>
          </div>
          <button onClick={onCancel} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100" aria-label="Close">
            <span aria-hidden>×</span>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {err && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}

          {eligible.length === 0 ? (
            <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
              No active contacts with email addresses on file. Add a contact with an email
              before sending.
            </p>
          ) : (
            <>
              {/* Recipients */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-700">
                    To ({selected.size}/{eligible.length} selected)
                  </span>
                  <div className="flex gap-2 text-[11px]">
                    <button onClick={selectAll} className="text-blue-600 hover:underline">All</button>
                    <button onClick={selectNone} className="text-gray-500 hover:underline">None</button>
                  </div>
                </div>
                <div className="max-h-44 space-y-1 overflow-y-auto rounded-md border border-gray-200 bg-white p-2">
                  {eligible.map((c) => {
                    const checked = selected.has(c.id);
                    return (
                      <label
                        key={c.id}
                        className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggle(c.id)}
                        />
                        <span className="flex-1 text-sm">
                          <span className="font-medium text-gray-900">{c.name}</span>
                          {c.role && <span className="ml-1 text-gray-500">— {c.role}</span>}
                          <span className="ml-2 text-xs text-gray-500">{c.email}</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Subject */}
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-gray-700">Subject</span>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm focus:border-gray-400 focus:outline-none"
                />
              </label>

              {/* Body */}
              <label className="block">
                <span className="mb-1 flex items-center justify-between text-xs font-medium text-gray-700">
                  <span>Body</span>
                  <span className="font-normal text-gray-500">
                    Variables: <code>{"{first_name}"}</code> <code>{"{organization_name}"}</code> <code>{"{campus_name}"}</code>
                  </span>
                </span>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={12}
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm font-mono focus:border-gray-400 focus:outline-none"
                />
              </label>

              {/* Preview */}
              {selected.size > 0 && (
                <details className="rounded-md border border-gray-100 bg-gray-50 p-3 text-xs">
                  <summary className="cursor-pointer font-medium text-gray-700">
                    Preview substitution for{" "}
                    <select
                      value={previewFor ?? ""}
                      onChange={(e) => setPreviewFor(e.target.value || null)}
                      className="ml-1 rounded border border-gray-200 bg-white px-1.5 py-0.5 text-xs"
                    >
                      {eligible
                        .filter((c) => selected.has(c.id))
                        .map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                  </summary>
                  <div className="mt-2 space-y-2">
                    <div>
                      <p className="font-medium text-gray-600">Subject:</p>
                      <p className="text-gray-800">{previewSubject}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-600">Body:</p>
                      <pre className="whitespace-pre-wrap text-gray-800">{previewBody}</pre>
                    </div>
                  </div>
                </details>
              )}

              <p className="rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-900">
                📎 The Olera student-outreach flyer (PDF) is attached automatically.
              </p>
            </>
          )}
        </div>

        <footer className="flex items-center justify-between gap-2 border-t border-gray-100 bg-gray-50 px-6 py-3">
          <p className="text-xs text-gray-500">
            {selected.size > 0 && `Will send ${selected.size} email${selected.size === 1 ? "" : "s"} via Resend`}
          </p>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              disabled={submitting}
              className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={submitting || selected.size === 0 || eligible.length === 0}
              className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {submitting ? "Sending…" : `Send via Resend → ${selected.size}`}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
