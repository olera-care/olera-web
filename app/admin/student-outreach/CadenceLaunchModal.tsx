"use client";

/**
 * CadenceLaunchModal — the review/launch screen for any cadence.
 *
 * Phase 1 of the activation system (2026-06-09). A clean, self-contained
 * sibling to PreFlightReviewModal: where that modal is wired to the cold
 * initial-outreach launch, this one takes ANY cadence key and renders its
 * plan — editable email steps + reviewable call scripts with timing — ending
 * in one Launch button. Launch IS the approval: nothing sends until the admin
 * clicks it.
 *
 * Built for the activation cadence first (launched from a warm reply / call /
 * meeting via the drawer's "Interested" button in Phase 2), but cadence-key
 * agnostic so the same component serves any future sequence.
 *
 * Mirrors PreFlightReviewModal's editing UX (collapsible cards, raw template
 * body with {placeholders} + a substitution preview) on purpose, so admins who
 * already use Pre-Flight find it immediately familiar.
 */

import { useEffect, useMemo, useState } from "react";
import {
  OUTREACH_DAYS_BY_TYPE,
  type CadenceKey,
  type OutreachDay,
  type TemplateKey,
} from "@/lib/student-outreach/cadence";
import { defaultCallScriptsFor, type EmailSnapshot, type CallScript } from "@/lib/student-outreach/sequencer";
import { getTemplate, substituteVars, firstNameOf } from "@/lib/student-outreach/templates";
import type { StakeholderType } from "@/lib/student-outreach/types";

interface EmailCard {
  day: number;
  template: TemplateKey;
  subject: string;
  body: string;
  title: string;
}

interface CallCard {
  day: number;
  title: string;
  script: string;
}

export interface CadenceLaunchSubmit {
  email_snapshots: EmailSnapshot[];
  call_scripts: CallScript[];
}

interface Props {
  /** Which cadence to render (e.g. "activation"). */
  cadenceKey: CadenceKey;
  organizationName: string;
  campusName: string;
  /** The single contact this cadence targets (for preview + first-name). */
  recipientName?: string | null;
  recipientEmail?: string | null;
  /** Optional day-0 email template override (e.g. the post-meeting opener). */
  introTemplateOverride?: TemplateKey;
  /** Header copy. Sensible activation defaults if omitted. */
  title?: string;
  introText?: string;
  submitLabel?: string;
  onCancel: () => void;
  onSubmit: (payload: CadenceLaunchSubmit) => Promise<void>;
}

export function CadenceLaunchModal({
  cadenceKey,
  organizationName,
  campusName,
  recipientName,
  recipientEmail,
  introTemplateOverride,
  title,
  introText,
  submitLabel,
  onCancel,
  onSubmit,
}: Props) {
  const days: OutreachDay[] = OUTREACH_DAYS_BY_TYPE[cadenceKey];
  // Activation borrows the provider/student_org informal salutation pattern;
  // the kind-specific copy lives in the template body, not the salutation rule.
  const templateStakeholderType: StakeholderType =
    cadenceKey === "provider" || cadenceKey === "activation" ? "student_org" : cadenceKey;

  const [emailCards, setEmailCards] = useState<EmailCard[]>(() => {
    const result: EmailCard[] = [];
    for (const d of days) {
      for (const step of d.steps) {
        if (step.channel !== "email" || !step.template) continue;
        // Day-0 opener can be swapped (e.g. post-meeting flavor).
        const template =
          d.day === 0 && introTemplateOverride ? introTemplateOverride : step.template;
        const tpl = getTemplate(template, {
          stakeholder_type: templateStakeholderType,
          organization_name: organizationName,
          campus_name: campusName,
          variant: "named",
        });
        result.push({
          day: d.day,
          template,
          subject: tpl.subject,
          body: tpl.body,
          title: d.title,
        });
      }
    }
    return result;
  });

  const [callCards, setCallCards] = useState<CallCard[]>(() => {
    const scripts = defaultCallScriptsFor(cadenceKey);
    const byDay = new Map(scripts.map((s) => [s.day, s.script]));
    const result: CallCard[] = [];
    for (const d of days) {
      if (!d.steps.some((s) => s.channel === "phone")) continue;
      result.push({
        day: d.day,
        title: d.title,
        script: byDay.get(d.day) ?? "Follow-up call",
      });
    }
    return result;
  });

  const [openEmail, setOpenEmail] = useState<number | null>(0);
  const [openCall, setOpenCall] = useState<number | null>(null);
  const [previewIdx, setPreviewIdx] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const previewVars = useMemo(
    () => ({
      first_name: firstNameOf(recipientName),
      organization_name: organizationName,
      campus_name: campusName,
      admin_first_name: "Graize",
    }),
    [recipientName, organizationName, campusName],
  );

  const updateEmail = (idx: number, patch: Partial<EmailCard>) =>
    setEmailCards((cur) => cur.map((c, i) => (i === idx ? { ...c, ...patch } : c)));
  const updateCall = (idx: number, patch: Partial<CallCard>) =>
    setCallCards((cur) => cur.map((c, i) => (i === idx ? { ...c, ...patch } : c)));

  const submit = async () => {
    setErr(null);
    for (const c of emailCards) {
      if (!c.subject.trim() || !c.body.trim()) {
        setErr(`Day ${c.day} subject and body required`);
        return;
      }
    }
    setSubmitting(true);
    try {
      await onSubmit({
        email_snapshots: emailCards.map((c) => ({
          day: c.day,
          template: c.template,
          subject: c.subject.trim(),
          body: c.body.trim(),
        })),
        call_scripts: callCards.map((c) => ({ day: c.day, script: c.script.trim() })),
      });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Launch failed");
    } finally {
      setSubmitting(false);
    }
  };

  const headerTitle = title ?? "Launch activation cadence";
  const headerIntro =
    introText ??
    "Sends the link plus a meeting option, then nudges until they activate or book a time. Stops automatically on either. Every email is from Graize. Review and approve below.";
  const launchLabel = submitLabel ?? "Launch cadence";

  const stripDayPrefix = (t: string) => t.replace(/^Day \d+\s*·\s*/, "").replace(/^Now\s*·\s*/, "");

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">{headerTitle}</h3>
            <p className="mt-0.5 text-xs text-gray-500">{headerIntro}</p>
          </div>
          <button onClick={onCancel} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100" aria-label="Close">
            <span aria-hidden>×</span>
          </button>
        </header>

        <div className="flex-1 space-y-3 overflow-y-auto px-6 py-4">
          {err && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}

          {(recipientName || recipientEmail) && (
            <div className="rounded-md border border-gray-100 bg-gray-50 px-3 py-2 text-xs text-gray-700">
              Sends to{" "}
              <strong>{recipientName || recipientEmail}</strong>
              {recipientName && recipientEmail ? (
                <span className="text-gray-500"> ({recipientEmail})</span>
              ) : null}
            </div>
          )}

          {/* Email steps — editable */}
          {emailCards.map((c, idx) => {
            const isOpen = openEmail === idx;
            const subjectPreview = substituteVars(c.subject, previewVars);
            return (
              <div key={`e-${c.day}`} className="rounded-md border border-gray-200 bg-white">
                <button
                  type="button"
                  onClick={() => setOpenEmail(isOpen ? null : idx)}
                  className="flex w-full items-start justify-between gap-3 px-3 py-2.5 text-left hover:bg-gray-50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      ✉ {c.day === 0 ? "Now" : `Day ${c.day}`} · {stripDayPrefix(c.title)}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-gray-500">Subject: {subjectPreview}</p>
                  </div>
                  <span className="text-xs text-gray-400">{isOpen ? "▾" : "▸"}</span>
                </button>
                {isOpen && (
                  <div className="space-y-2 border-t border-gray-100 px-3 pb-3 pt-2">
                    <label className="block">
                      <span className="mb-1 block text-xs font-medium text-gray-700">Subject</span>
                      <input
                        value={c.subject}
                        onChange={(e) => updateEmail(idx, { subject: e.target.value })}
                        className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm focus:border-gray-400 focus:outline-none"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 flex items-center justify-between text-xs font-medium text-gray-700">
                        <span>Body</span>
                        <span className="font-normal text-gray-500">
                          Variables: <code>{"{first_name}"}</code> <code>{"{campus_name}"}</code>{" "}
                          <code>{"{welcome_url}"}</code> <code>{"{calendly_url}"}</code>
                        </span>
                      </span>
                      <textarea
                        value={c.body}
                        onChange={(e) => updateEmail(idx, { body: e.target.value })}
                        rows={10}
                        className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm font-mono focus:border-gray-400 focus:outline-none"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => setPreviewIdx(previewIdx === idx ? null : idx)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      {previewIdx === idx ? "Hide preview" : "Preview substitution"}
                    </button>
                    {previewIdx === idx && (
                      <div className="rounded-md border border-gray-100 bg-gray-50 p-2 text-xs">
                        <p className="font-medium text-gray-600">Subject:</p>
                        <p className="text-gray-800">{substituteVars(c.subject, previewVars)}</p>
                        <p className="mt-2 font-medium text-gray-600">Body:</p>
                        <pre className="mt-1 whitespace-pre-wrap text-gray-800">{substituteVars(c.body, previewVars)}</pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Call steps — reviewable script */}
          {callCards.map((c, idx) => {
            const isOpen = openCall === idx;
            const scriptPreview = substituteVars(c.script, previewVars).replace(
              /\{recipient_name\}/g,
              firstNameOf(recipientName),
            );
            return (
              <div key={`c-${c.day}`} className="rounded-md border border-gray-200 bg-white">
                <button
                  type="button"
                  onClick={() => setOpenCall(isOpen ? null : idx)}
                  className="flex w-full items-start justify-between gap-3 px-3 py-2.5 text-left hover:bg-gray-50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      ☎ Day {c.day} · {stripDayPrefix(c.title)}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-gray-500">Call script</p>
                  </div>
                  <span className="text-xs text-gray-400">{isOpen ? "▾" : "▸"}</span>
                </button>
                {isOpen && (
                  <div className="space-y-2 border-t border-gray-100 px-3 pb-3 pt-2">
                    <textarea
                      value={c.script}
                      onChange={(e) => updateCall(idx, { script: e.target.value })}
                      rows={5}
                      className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
                    />
                    <div className="rounded-md border border-gray-100 bg-gray-50 p-2 text-xs text-gray-700">
                      {scriptPreview}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <footer className="flex items-center justify-between gap-2 border-t border-gray-100 bg-gray-50 px-6 py-3">
          <p className="text-xs text-gray-500">
            {emailCards.length} email{emailCards.length === 1 ? "" : "s"}
            {callCards.length > 0 ? ` · ${callCards.length} call${callCards.length === 1 ? "" : "s"}` : ""}
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
              disabled={submitting}
              className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {submitting ? "Launching…" : launchLabel}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
