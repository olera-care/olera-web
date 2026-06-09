"use client";

/**
 * CadenceLaunchModal — the review/launch screen for the activation cadence.
 *
 * Honest model: MedJobs emails are delivered by Smartlead from ONE shared
 * per-campus campaign sequence built from the canonical templates, so the
 * email copy is NOT per-launch editable — this screen shows it READ-ONLY, as a
 * preview of exactly what will send. Call scripts ARE editable (calls are
 * CRM-queued tasks, so per-launch edits take effect). Launch is the approval:
 * nothing sends until the admin clicks it.
 *
 * Opened by `ActivationActions` (Interested on a reply / call / meeting) with
 * cadenceKey="activation".
 */

import { useEffect, useMemo, useState } from "react";
import {
  OUTREACH_DAYS_BY_TYPE,
  type CadenceKey,
  type OutreachDay,
} from "@/lib/student-outreach/cadence";
import { defaultCallScriptsFor, type CallScript } from "@/lib/student-outreach/sequencer";
import { getTemplate, substituteVars, firstNameOf } from "@/lib/student-outreach/templates";
import type { StakeholderType } from "@/lib/student-outreach/types";

interface EmailCard {
  day: number;
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
  title,
  introText,
  submitLabel,
  onCancel,
  onSubmit,
}: Props) {
  const days: OutreachDay[] = OUTREACH_DAYS_BY_TYPE[cadenceKey];
  const templateStakeholderType: StakeholderType =
    cadenceKey === "provider" || cadenceKey === "activation" ? "student_org" : cadenceKey;

  // Email steps — read-only previews of the canonical copy Smartlead will send.
  const emailCards = useMemo<EmailCard[]>(() => {
    const result: EmailCard[] = [];
    for (const d of days) {
      for (const step of d.steps) {
        if (step.channel !== "email" || !step.template) continue;
        const tpl = getTemplate(step.template, {
          stakeholder_type: templateStakeholderType,
          organization_name: organizationName,
          campus_name: campusName,
          variant: "named",
        });
        result.push({ day: d.day, subject: tpl.subject, body: tpl.body, title: d.title });
      }
    }
    return result;
  }, [days, templateStakeholderType, organizationName, campusName]);

  // Call steps — editable (calls are CRM tasks; edits take effect).
  const [callCards, setCallCards] = useState<CallCard[]>(() => {
    const byDay = new Map(defaultCallScriptsFor(cadenceKey).map((s) => [s.day, s.script]));
    const result: CallCard[] = [];
    for (const d of days) {
      if (!d.steps.some((s) => s.channel === "phone")) continue;
      result.push({ day: d.day, title: d.title, script: byDay.get(d.day) ?? "Follow-up call" });
    }
    return result;
  });

  const [openEmail, setOpenEmail] = useState<number | null>(0);
  const [openCall, setOpenCall] = useState<number | null>(null);
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

  const updateCall = (idx: number, patch: Partial<CallCard>) =>
    setCallCards((cur) => cur.map((c, i) => (i === idx ? { ...c, ...patch } : c)));

  const submit = async () => {
    setErr(null);
    setSubmitting(true);
    try {
      await onSubmit({ call_scripts: callCards.map((c) => ({ day: c.day, script: c.script.trim() })) });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Launch failed");
    } finally {
      setSubmitting(false);
    }
  };

  const headerTitle = title ?? "Launch activation cadence";
  const headerIntro =
    introText ??
    "Sends the link plus a meeting option, then nudges until they activate or book. Stops automatically on either. Emails send as written (our standard activation copy); edit the call scripts if you like.";
  const launchLabel = submitLabel ?? "Launch cadence";

  const stripDayPrefix = (t: string) =>
    t.replace(/^Day \d+\s*·\s*/, "").replace(/^Now\s*·\s*/, "");

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
              Sends to <strong>{recipientName || recipientEmail}</strong>
              {recipientName && recipientEmail ? (
                <span className="text-gray-500"> ({recipientEmail})</span>
              ) : null}
            </div>
          )}

          {/* Email steps — read-only previews of what sends */}
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
                  <div className="border-t border-gray-100 px-3 pb-3 pt-2">
                    <pre className="whitespace-pre-wrap font-sans text-[12px] leading-relaxed text-gray-700">
                      {substituteVars(c.body, previewVars)}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}

          {/* Call steps — editable script */}
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
                    <p className="mt-0.5 truncate text-xs text-gray-500">Call script (editable)</p>
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
