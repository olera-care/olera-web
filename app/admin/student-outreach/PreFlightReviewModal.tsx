"use client";

/**
 * PreFlightReviewModal — v4.
 *
 * Opens when admin clicks "Schedule outreach sequence" on a `researched`
 * row. Shows the entire email cadence as collapsible cards. Admin can
 * edit any subject/body once (one-off; not saved as templates) and
 * then clicks Schedule to commit.
 *
 * After submit: Day 0 auto-fires via the inline executor; later days
 * are queued and picked up by the cron.
 */

import { useEffect, useMemo, useState } from "react";
import {
  OUTREACH_DAYS_BY_TYPE,
  type OutreachDay,
  type TemplateKey,
} from "@/lib/student-outreach/cadence";
import {
  getTemplate,
  firstNameOf,
  salutationFor,
  substituteVars,
} from "@/lib/student-outreach/templates";
import type { CadenceKey } from "@/lib/student-outreach/cadence";
import type { Contact, StakeholderType } from "@/lib/student-outreach/types";

interface Snapshot {
  day: number;
  template: TemplateKey;
  subject: string;
  body: string;
  /** Static (non-editable) for context. */
  title: string;
}

interface Props {
  /**
   * Cadence template key. Stakeholder rows pass their stakeholder_type;
   * provider rows (kind='provider') pass 'provider'. The modal handles
   * both — provider rows borrow the student_org first-name salutation
   * pattern when constructing the template (no formal Dr./Prof.
   * honorific for agency owners).
   */
  stakeholderType: CadenceKey;
  organizationName: string;
  campusName: string;
  contacts: Contact[];
  onCancel: () => void;
  onSubmit: (snapshots: Array<Pick<Snapshot, "day" | "template" | "subject" | "body">>) => Promise<void>;
}

export function PreFlightReviewModal({
  stakeholderType,
  organizationName,
  campusName,
  contacts,
  onCancel,
  onSubmit,
}: Props) {
  const eligible = useMemo(
    () => contacts.filter((c) => c.status === "active" && c.email && c.email.trim().length > 0),
    [contacts],
  );

  const days: OutreachDay[] = OUTREACH_DAYS_BY_TYPE[stakeholderType];
  // Template functions branch on a StakeholderType (for salutation
  // formality). Provider rows borrow student_org's first-name pattern;
  // the kind-specific copy lives in the template body, not the
  // salutation rule.
  const templateStakeholderType: StakeholderType =
    stakeholderType === "provider" || stakeholderType === "activation"
      ? "student_org"
      : stakeholderType;

  // Read-only previews of the canonical copy. MedJobs emails are sent by
  // Smartlead from one shared per-campus campaign sequence, so per-launch
  // edits don't propagate — this modal shows exactly what will send.
  const snapshots = useMemo<Snapshot[]>(() => {
    const result: Snapshot[] = [];
    for (const d of days) {
      for (const step of d.steps) {
        if (step.channel !== "email" || !step.template) continue;
        const tpl = getTemplate(step.template, {
          stakeholder_type: templateStakeholderType,
          organization_name: organizationName,
          campus_name: campusName,
          contacts,
        });
        result.push({
          day: d.day,
          template: step.template,
          subject: tpl.subject,
          body: tpl.body,
          title: d.title,
        });
      }
    }
    return result;
  }, [days, templateStakeholderType, organizationName, campusName, contacts]);

  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const submit = async () => {
    setErr(null);
    if (eligible.length === 0) {
      setErr("No active contacts with email — add one before scheduling");
      return;
    }
    for (const s of snapshots) {
      if (!s.subject.trim() || !s.body.trim()) {
        setErr(`Day ${s.day} subject and body required`);
        return;
      }
    }
    setSubmitting(true);
    try {
      await onSubmit(snapshots.map((s) => ({
        day: s.day,
        template: s.template,
        subject: s.subject.trim(),
        body: s.body.trim(),
      })));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Schedule failed");
    } finally {
      setSubmitting(false);
    }
  };

  const previewContact = eligible[0] ?? null;
  // v8.7.1: prefer the explicit first_name column over firstNameOf(name)
  // — same logic the email-send pipeline uses, so the preview matches
  // what actually gets sent.
  const previewFirstName =
    (previewContact?.first_name && previewContact.first_name.trim()) ||
    firstNameOf(previewContact?.name);
  const previewSalutation = salutationFor(
    templateStakeholderType,
    previewFirstName,
    previewContact?.last_name ?? null,
    previewContact?.title ?? null,
  );
  const previewVars = {
    first_name: previewFirstName,
    salutation: previewSalutation,
    organization_name: organizationName,
    campus_name: campusName,
    admin_first_name: "the Olera team",
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Confirm outreach plan</h3>
            <p className="mt-0.5 text-xs text-gray-500">
              First email goes out now. Follow-ups send themselves; calls land in the Calls tab; replies show up in Replies.
            </p>
          </div>
          <button onClick={onCancel} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100" aria-label="Close">
            <span aria-hidden>×</span>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {err && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}

          {/* Recipient summary */}
          <div className="rounded-md border border-gray-100 bg-gray-50 px-3 py-2 text-xs">
            {eligible.length === 0 ? (
              <p className="text-amber-700">
                ⚠ No active contacts with email yet. Cancel and add one before scheduling.
              </p>
            ) : (
              <p className="text-gray-700">
                Will send to <strong>{eligible.length}</strong> active contact{eligible.length === 1 ? "" : "s"}:{" "}
                <span className="text-gray-500">
                  {eligible.map((c) => {
                    const display = [c.first_name, c.last_name].filter(Boolean).join(" ") || c.name;
                    return `${display} (${c.email})`;
                  }).join(" · ")}
                </span>
              </p>
            )}
          </div>

          {/* v8.10.4: phone-call task nudge removed. The Calls tab is the
              dedicated surface for phone work; this modal is focused on
              confirming research + starting the email outreach only. */}

          {/* Email cards */}
          {snapshots.map((s, idx) => {
            const isOpen = openIdx === idx;
            const subjectPreview = substituteVars(s.subject, previewVars);
            return (
              <div key={s.day} className="rounded-md border border-gray-200 bg-white">
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="flex w-full items-start justify-between gap-3 px-3 py-2.5 text-left hover:bg-gray-50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      Day {s.day} · {s.title.replace(/^Day \d+\s*·\s*/, "")}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-gray-500">
                      Subject: {subjectPreview}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400">{isOpen ? "▾" : "▸"}</span>
                </button>
                {isOpen && (
                  <div className="border-t border-gray-100 px-3 pb-3 pt-2">
                    <pre className="whitespace-pre-wrap font-sans text-[12px] leading-relaxed text-gray-700">
                      {substituteVars(s.body, previewVars)}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}

          {/* v8.10.4: clickable flyer preview. URL comes from
              NEXT_PUBLIC_STUDENT_OUTREACH_FLYER_URL — same Supabase
              storage object that the server-side STUDENT_OUTREACH_FLYER_URL
              attaches to every send. Set both to the same URL in env so
              what admins preview matches what stakeholders receive. */}
          <p className="rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-900">
            📎{" "}
            {process.env.NEXT_PUBLIC_STUDENT_OUTREACH_FLYER_URL ? (
              <>
                <a
                  href={process.env.NEXT_PUBLIC_STUDENT_OUTREACH_FLYER_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:no-underline"
                  title="Open the flyer in a new tab to preview what stakeholders receive."
                >
                  The Olera flyer (PDF)
                </a>{" "}
                is attached automatically to every send.
              </>
            ) : (
              <>The Olera flyer (PDF) is attached automatically to every send.</>
            )}
          </p>
        </div>

        <footer className="flex items-center justify-between gap-2 border-t border-gray-100 bg-gray-50 px-6 py-3">
          <p className="text-xs text-gray-500">
            {snapshots.length} email{snapshots.length === 1 ? "" : "s"} ready
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
              disabled={submitting || eligible.length === 0}
              className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {submitting ? "Starting…" : "Start outreach"}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
