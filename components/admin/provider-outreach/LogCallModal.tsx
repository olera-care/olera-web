"use client";

import { useCallback, useRef, useState } from "react";

export type CallOutcome =
  | "confirmed"
  | "meeting_booked"
  | "no_answer"
  | "voicemail"
  | "not_interested"
  | "claimed"
  | "interested_following_up"
  | "couldnt_reach"
  | "custom_email";

export interface CallLog {
  providerId: string;
  outcome: CallOutcome;
  notes: string;
  timestamp: string;
  completed?: boolean;
  emailFired?: boolean;
  followUpEmail?: { templateKey: string; subject: string; body: string } | null;
  attemptNumber?: number;
  movedToBacklog?: boolean;
}

export type LogCallVariant = "default" | "lead";

interface LogCallModalProps {
  providerName: string;
  providerLocation: string;
  providerId: string;
  onLog: (log: CallLog) => void;
  onCancel: () => void;
  /** "lead" shows simplified lead-specific outcomes. Default is the worklist outcomes. */
  variant?: LogCallVariant;
  /** Extra context line shown under the provider name (e.g. their engagement). */
  context?: string;
  /** Provider email address for sending follow-up emails via the API. */
  providerEmail?: string | null;
}

const CALL_LOG_KEY = "provider-outreach-call-logs";
const WORKLIST_CALL_LOG_KEY = "provider-outreach-call-log";

interface OutcomeOption {
  key: CallOutcome;
  label: string;
  description: string;
}

const DEFAULT_OUTCOMES: OutcomeOption[] = [
  {
    key: "claimed",
    label: "Claimed account",
    description: "Sends a welcome email, moves to In Basket, and starts the Provider Outreach sequence.",
  },
  {
    key: "confirmed",
    label: "Confirmed / spoke",
    description: "Sends a follow-up email, moves to In Basket, and starts the Provider Outreach sequence.",
  },
  {
    key: "no_answer",
    label: "No answer",
    description: "Marks this call done; the next cadence call stays scheduled.",
  },
  {
    key: "voicemail",
    label: "Voicemail",
    description: "Left a message; the next cadence call stays scheduled.",
  },
  {
    key: "not_interested",
    label: "Not interested",
    description: "Remove from Olera. Sends a removal confirmation and closes the row.",
  },
  {
    key: "custom_email",
    label: "Send custom email",
    description: "Write and send a custom email for any situation.",
  },
];

const LEAD_OUTCOMES: OutcomeOption[] = [
  {
    key: "claimed",
    label: "They claimed it",
    description: "Done. Closes the lead and stops all outreach.",
  },
  {
    key: "interested_following_up",
    label: "Interested, following up",
    description: "Stays a lead. Set a date and it comes back to you then.",
  },
  {
    key: "couldnt_reach",
    label: "Couldn't reach them",
    description: "No answer or voicemail. Stays a lead, try again tomorrow.",
  },
  {
    key: "not_interested",
    label: "Not interested",
    description: "Closes the lead and cancels the rest of the sequence.",
  },
];

interface EmailTemplate {
  key: string;
  label: string;
  subject: string;
  body: string;
}

function getEmailTemplates(providerName: string): EmailTemplate[] {
  const firstName = providerName.split(/\s+/)[0];
  return [
    {
      key: "intro",
      label: "Introduction follow-up",
      subject: `Great speaking with you, ${firstName}`,
      body: `Hi ${firstName},\n\nThank you for taking the time to speak with me today. As discussed, Olera connects families actively searching for senior care with providers like ${providerName}.\n\nI have set up your provider page and you can start receiving inquiries right away. Here is a link to view and claim your profile.\n\nLooking forward to working together.\n\nBest,\nChantel`,
    },
    {
      key: "meeting",
      label: "Meeting confirmation",
      subject: `Meeting confirmed - ${providerName} + Olera`,
      body: `Hi ${firstName},\n\nThank you for the great conversation. I am looking forward to our meeting to walk you through the Olera platform and how it can help ${providerName} connect with more families.\n\nIn the meantime, feel free to check out your provider page on Olera. You can claim it at any time.\n\nTalk soon.\n\nBest,\nChantel`,
    },
    {
      key: "info",
      label: "Send more info",
      subject: `More info about Olera for ${providerName}`,
      body: `Hi ${firstName},\n\nAs promised, here is a bit more information about Olera and how we help senior care providers grow.\n\nOlera is a free directory where families search for and compare senior care providers. Your listing is already live and families in your area can find you today.\n\nClaiming your page takes 30 seconds and gives you full control over your profile, photos, and inquiries.\n\nLet me know if you have any questions.\n\nBest,\nChantel`,
    },
  ];
}

function getOutcomeEmailTemplate(providerName: string, outcome: CallOutcome): EmailTemplate | null {
  const firstName = providerName.split(/\s+/)[0];
  if (outcome === "claimed") {
    return {
      key: "claimed_welcome",
      label: "Claimed - welcome",
      subject: `Congrats, ${providerName} is officially claimed on Olera`,
      body: `Hi ${firstName},\n\nThanks for taking my call today, it was great speaking with you.\n\n${providerName} is officially claimed.\n\nOne step left, set your password and you're in:\n\n[Set your password →]\n\nFrom there you can add photos, correct anything we got wrong, and tell families what makes you different. Takes about three minutes.\n\nAny questions, reply here or call me at [number].`,
    };
  }
  if (outcome === "confirmed") {
    return {
      key: "confirmed_follow_up",
      label: "Confirmed / spoke - follow-up",
      subject: `What claiming ${providerName} on Olera gets you`,
      body: `Hi ${firstName},\n\nGreat talking with you today.\n\nOlera is a free directory families use when they're looking at senior care in their area. We've already created a page for ${providerName}, and there's probably some details that need your personal touch.\n\n[See your page →]\n\nClaiming it is free and takes about three minutes. Once it's yours you can correct anything that's off, add photos and tell your story, and answer families when they ask you something.\n\nAnd when a family does reach out, they come straight to you. No referral fee, nothing passed along to anyone else.\n\nHave a look and let me know what you think. If you'd rather I just walk you through it, call me at [number] and I'll do it with you.`,
    };
  }
  if (outcome === "not_interested") {
    return {
      key: "removal_confirmation",
      label: "Removal confirmation",
      subject: `Your page on Olera has been removed`,
      body: `Hi ${firstName},\n\nThanks for taking my call today.\n\nJust confirming that ${providerName}'s page has been removed from Olera. If anything changes down the line, just let me know and I'm happy to put it back up. And if any questions come up in the meantime, you can reach us at [number].`,
    };
  }
  return null;
}

const MAX_ATTEMPTS = 3;

function getAttemptCount(providerId: string): number {
  try {
    const raw = localStorage.getItem(CALL_LOG_KEY);
    const all: CallLog[] = raw ? JSON.parse(raw) : [];
    return all.filter(
      (l) => l.providerId === providerId && (l.outcome === "no_answer" || l.outcome === "voicemail"),
    ).length;
  } catch {
    return 0;
  }
}

export function LogCallModal({
  providerName,
  providerLocation,
  providerId,
  onLog,
  onCancel,
  variant = "default",
  context,
  providerEmail,
}: LogCallModalProps) {
  const [step, setStep] = useState<"outcome" | "email">("outcome");
  const [outcome, setOutcome] = useState<CallOutcome | null>(null);
  const [notes, setNotes] = useState("");
  const [sendToEmail, setSendToEmail] = useState(providerEmail || "");

  const priorAttempts = getAttemptCount(providerId);
  const nextAttempt = priorAttempts + 1;
  const willBacklog = nextAttempt >= MAX_ATTEMPTS;

  const OUTCOMES = variant === "lead" ? LEAD_OUTCOMES : DEFAULT_OUTCOMES;

  // Email step state
  const templates = getEmailTemplates(providerName);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [editSubject, setEditSubject] = useState("");
  const [editBody, setEditBody] = useState("");

  const canSubmitOutcome = outcome !== null || notes.trim().length > 0;

  // contentEditable ref for email body
  const editorRef = useRef<HTMLDivElement>(null);

  /** CTA markers that get rendered as styled buttons in the email preview */
  const CTA_BUTTONS: { marker: string; label: string }[] = [
    { marker: "[Set your password →]", label: "Set your password →" },
    { marker: "[See your page →]", label: "See your page →" },
  ];

  /** Convert plain text body → HTML for contentEditable (CTA markers become styled buttons) */
  const bodyToHtml = useCallback((text: string) => {
    return text
      .split("\n\n")
      .map((para) => {
        const ctaMatch = CTA_BUTTONS.find((c) => para.includes(c.marker));
        if (ctaMatch) {
          return `<div class="py-1.5" contenteditable="false" data-cta="${ctaMatch.marker}"><span style="display:inline-block;border-radius:6px;background:#198087;padding:6px 14px;font-size:12px;font-weight:500;color:#fff;">${ctaMatch.label}</span></div>`;
        }
        const escaped = para.replace(/\n/g, "<br>");
        return `<p>${escaped}</p>`;
      })
      .join("");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Extract plain text from contentEditable HTML, restoring the CTA markers */
  const htmlToBody = useCallback((el: HTMLDivElement) => {
    const parts: string[] = [];
    el.childNodes.forEach((node) => {
      if (node instanceof HTMLElement && node.getAttribute("data-cta")) {
        parts.push(node.getAttribute("data-cta")!);
      } else if (node instanceof HTMLElement) {
        const inner = node.innerHTML.replace(/<br\s*\/?>/gi, "\n");
        const text = new DOMParser().parseFromString(inner, "text/html").body.textContent || "";
        parts.push(text);
      } else if (node.nodeType === Node.TEXT_NODE) {
        parts.push(node.textContent || "");
      }
    });
    return parts.join("\n\n");
  }, []);

  function selectTemplate(key: string | null) {
    setSelectedTemplate(key);
    if (key) {
      const tpl = templates.find((t) => t.key === key);
      if (tpl) {
        setEditSubject(tpl.subject);
        setEditBody(tpl.body);
      }
    } else {
      setEditSubject("");
      setEditBody("");
    }
  }

  function handleLogCall() {
    if (variant === "lead") {
      if (outcome === "claimed" || outcome === "not_interested") {
        // These outcomes need a follow-up email
        const tpl = getOutcomeEmailTemplate(providerName, outcome!);
        if (tpl) {
          setSelectedTemplate(tpl.key);
          setEditSubject(tpl.subject);
          setEditBody(tpl.body);
        }
        setStep("email");
      } else {
        // interested_following_up / couldnt_reach skip email
        finishLog(null);
      }
      return;
    }
    if (outcome === "custom_email") {
      // Blank slate — agent writes from scratch
      setSelectedTemplate(null);
      setEditSubject("");
      setEditBody("");
      setStep("email");
    } else if (outcome === "claimed" || outcome === "not_interested" || outcome === "confirmed") {
      // Pre-fill the appropriate email template
      const tpl = getOutcomeEmailTemplate(providerName, outcome!);
      if (tpl) {
        setSelectedTemplate(tpl.key);
        setEditSubject(tpl.subject);
        setEditBody(tpl.body);
      }
      setStep("email");
    } else {
      // no_answer / voicemail — no email needed
      finishLog(null);
    }
  }

  const [sending, setSending] = useState(false);

  async function handleSendEmail() {
    let followUpEmail: CallLog["followUpEmail"] = null;

    if (editSubject.trim()) {
      followUpEmail = { templateKey: selectedTemplate || "custom", subject: editSubject.trim(), body: editBody.trim() };
    }

    // Send via the API if we have an email address
    if (sendToEmail && followUpEmail) {
      setSending(true);
      try {
        await fetch("/api/admin/provider-outreach/send-follow-up-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            provider_id: providerId,
            provider_name: providerName,
            to: sendToEmail,
            subject: followUpEmail.subject,
            body: followUpEmail.body,
            outcome: outcome || "confirmed",
          }),
        });
      } catch {
        // Log locally even if API fails
      } finally {
        setSending(false);
      }
    }

    finishLog(followUpEmail);
  }

  function handleSkipEmail() {
    finishLog(null);
  }

  function finishLog(followUpEmail: CallLog["followUpEmail"]) {
    const isCompletionOutcome = outcome === "confirmed" || outcome === "meeting_booked" || outcome === "claimed";
    const isNotInterested = outcome === "not_interested";
    const isClosedOutcome = isCompletionOutcome || isNotInterested;
    const isRetryOutcome = outcome === "no_answer" || outcome === "voicemail";
    const movedToBacklog = isRetryOutcome && willBacklog;

    const log: CallLog = {
      providerId,
      outcome: outcome || "confirmed",
      notes: notes.trim(),
      timestamp: new Date().toISOString(),
      completed: isClosedOutcome || movedToBacklog,
      emailFired: !!followUpEmail,
      followUpEmail,
      attemptNumber: isRetryOutcome ? nextAttempt : undefined,
      movedToBacklog: movedToBacklog || undefined,
    };

    // Persist to localStorage
    try {
      const raw = localStorage.getItem(CALL_LOG_KEY);
      const all: CallLog[] = raw ? JSON.parse(raw) : [];
      all.unshift(log);
      localStorage.setItem(CALL_LOG_KEY, JSON.stringify(all));
    } catch {}

    // Update worklist call record
    try {
      const raw = localStorage.getItem(WORKLIST_CALL_LOG_KEY);
      const records: Record<string, Record<string, unknown>> = raw ? JSON.parse(raw) : {};
      const existing = records[providerId] || { attempts: [], round: 1 };
      if (isNotInterested) {
        // Not interested → do not contact, remove from all sequences
        records[providerId] = { ...existing, status: "do_not_contact", sequence: null };
      } else if (isCompletionOutcome) {
        // Move to In Basket and enroll in Provider Outreach sequence
        records[providerId] = {
          ...existing,
          status: "in_basket",
          sequence: "provider_outreach",
          sequenceStep: 1,
          sequenceStartedAt: new Date().toISOString(),
          enrolledVia: outcome,
        };
      } else if (movedToBacklog) {
        records[providerId] = { ...existing, status: "backlog" };
      }
      localStorage.setItem(WORKLIST_CALL_LOG_KEY, JSON.stringify(records));
    } catch {}

    onLog(log);
  }


  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-xl mx-4 max-h-[90vh] flex flex-col overflow-hidden">
        {step === "outcome" ? (
          <>
            <div className="overflow-y-auto flex-1">
              {/* Header */}
              <div className="px-6 pt-6 pb-4">
                <h2 className="text-lg font-bold text-gray-900">Log call</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {providerName}
                  {providerLocation ? `, ${providerLocation}` : ""}
                </p>
                {context && (
                  <p className="text-xs text-primary-600 mt-1">{context}</p>
                )}
              </div>

              {/* Attempt badge */}
              {priorAttempts > 0 && (
                <div className="px-6 pb-2">
                  <div className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium ${
                    willBacklog
                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                      : "bg-gray-100 text-gray-600"
                  }`}>
                    <span className="tabular-nums">{priorAttempts} prior attempt{priorAttempts === 1 ? "" : "s"}</span>
                    {willBacklog && <span> -- next moves to backlog</span>}
                  </div>
                </div>
              )}

              {/* Outcome options */}
              <div className="px-6 space-y-2.5">
                {OUTCOMES.map((o) => {
                  const selected = outcome === o.key;
                  const isRetryOutcome = o.key === "no_answer" || o.key === "voicemail";
                  let desc = o.description;
                  if (isRetryOutcome) {
                    desc = willBacklog
                      ? `Attempt ${nextAttempt} of ${MAX_ATTEMPTS}. Moves to backlog.`
                      : `Attempt ${nextAttempt} of ${MAX_ATTEMPTS}. ${MAX_ATTEMPTS - nextAttempt} more before backlog.`;
                  }
                  return (
                    <button
                      key={o.key}
                      onClick={() => setOutcome(selected ? null : o.key)}
                      className={`w-full flex items-start gap-3 rounded-xl border px-4 py-3.5 text-left transition-all ${
                        selected
                          ? "border-primary-400 bg-primary-50/40"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                          selected
                            ? "border-primary-500 bg-primary-500"
                            : "border-gray-300"
                        }`}
                      >
                        {selected && (
                          <span className="block h-2 w-2 rounded-full bg-white" />
                        )}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {o.key === "claimed" && "\u2705 "}
                          {o.key === "custom_email" && "\u2709\uFE0F "}
                          {o.label}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Notes */}
              <div className="px-6 mt-4 pb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Notes (a note alone logs the call)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Context for this call - what was said, the next step."
                  rows={3}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500 outline-none resize-y"
                />
              </div>
            </div>

            {/* Footer - sticky */}
            <div className="shrink-0 border-t border-gray-100 px-6 py-4">
              {variant === "lead" && (
                <p className="text-xs text-gray-400 mb-3">The outcome sets the stage. No extra tagging.</p>
              )}
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={onCancel}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogCall}
                  disabled={!canSubmitOutcome}
                  className="rounded-lg bg-gray-900 px-5 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Log call
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Scrollable content */}
            <div className="overflow-y-auto flex-1">
              {/* Email follow-up step */}
              <div className="px-6 pt-6 pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full ${outcome === "not_interested" ? "bg-red-100" : "bg-emerald-100"}`}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className={outcome === "not_interested" ? "text-red-600" : "text-emerald-600"}>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                  <span className={`text-sm font-medium ${outcome === "not_interested" ? "text-red-700" : "text-emerald-700"}`}>Call logged</span>
                </div>
                <h2 className="text-lg font-bold text-gray-900 mt-2">
                  {outcome === "custom_email"
                    ? "Write your email"
                    : outcome === "claimed"
                      ? "Send welcome email"
                      : outcome === "not_interested"
                        ? "Send removal confirmation"
                        : outcome === "confirmed"
                          ? "Send follow-up email"
                          : "Next step: follow-up email"}
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {outcome === "custom_email"
                    ? `Write a custom email to ${providerName}.`
                    : outcome === "claimed"
                      ? `Let ${providerName} know what they can do with their page.`
                      : outcome === "not_interested"
                        ? `Confirm to ${providerName} that their page has been removed.`
                        : outcome === "confirmed"
                          ? `Show ${providerName} what claiming their page gets them.`
                          : `Pick a template to send to ${providerName}, or write your own.`}
                </p>
              </div>

              {/* Template picker — hidden when email is pre-filled (lead variant, or specific outcome templates) */}
              {variant !== "lead" && outcome !== "claimed" && outcome !== "not_interested" && outcome !== "confirmed" && outcome !== "custom_email" && (
              <div className="px-6 space-y-2.5">
                {templates.map((tpl) => {
                  const selected = selectedTemplate === tpl.key;
                  return (
                    <button
                      key={tpl.key}
                      onClick={() => selectTemplate(tpl.key)}
                      className={`w-full flex items-start gap-3 rounded-xl border px-4 py-3.5 text-left transition-all ${
                        selected
                          ? "border-primary-400 bg-primary-50/40"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                          selected
                            ? "border-primary-500 bg-primary-500"
                            : "border-gray-300"
                        }`}
                      >
                        {selected && (
                          <span className="block h-2 w-2 rounded-full bg-white" />
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{tpl.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">{tpl.subject}</p>
                      </div>
                    </button>
                  );
                })}

                {/* Write your own */}
                <button
                  onClick={() => selectTemplate(null)}
                  className={`w-full flex items-start gap-3 rounded-xl border px-4 py-3.5 text-left transition-all ${
                    selectedTemplate === null && editSubject
                      ? "border-primary-400 bg-primary-50/40"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                      selectedTemplate === null && editSubject
                        ? "border-primary-500 bg-primary-500"
                        : "border-gray-300"
                    }`}
                  >
                    {selectedTemplate === null && editSubject && (
                      <span className="block h-2 w-2 rounded-full bg-white" />
                    )}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Write your own</p>
                    <p className="text-xs text-gray-500 mt-0.5">Start from scratch</p>
                  </div>
                </button>
              </div>
              )}

              {/* Editable email -- shows for any selection, or always when pre-filled */}
              {(outcome === "custom_email" || outcome === "claimed" || outcome === "not_interested" || outcome === "confirmed" || selectedTemplate || editSubject) && (
                <div className="px-6 mt-4 pb-4 space-y-3">
                  <div>
                    <label className="block text-[11px] font-medium uppercase tracking-wider text-gray-400 mb-1.5">To</label>
                    <input
                      type="email"
                      value={sendToEmail}
                      onChange={(e) => setSendToEmail(e.target.value)}
                      placeholder="recipient@example.com"
                      className={`w-full rounded-lg border px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                        sendToEmail ? "border-gray-200" : "border-red-300 bg-red-50/30"
                      }`}
                    />
                    {!sendToEmail && (
                      <p className="text-xs text-red-500 mt-1">Enter the email you got from the call</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium uppercase tracking-wider text-gray-400 mb-1.5">Subject</label>
                    <input
                      type="text"
                      value={editSubject}
                      onChange={(e) => setEditSubject(e.target.value)}
                      placeholder="Subject line"
                      className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium uppercase tracking-wider text-gray-400 mb-1.5">Email preview</label>
                    <div className="rounded-xl border border-gray-200 bg-white">
                      {/* Olera header */}
                      <div className="px-5 pt-5 pb-3">
                        <span className="text-base font-bold text-primary-600 tracking-tight">Olera</span>
                      </div>

                      {/* Editable body — single contentEditable div, CTA button is non-editable inline */}
                      <div
                        ref={editorRef}
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={() => {
                          if (editorRef.current) {
                            setEditBody(htmlToBody(editorRef.current));
                          }
                        }}
                        dangerouslySetInnerHTML={{ __html: bodyToHtml(editBody) }}
                        className="px-5 pb-3 text-sm text-gray-700 leading-relaxed outline-none [&>p]:mb-4 [&>p]:last:mb-0"
                      />

                      {/* Signature: Best, Graize + photo block */}
                      <div className="px-5 pt-2 pb-4">
                        <p className="text-sm text-gray-700 mb-0.5">Best,</p>
                        <p className="text-sm text-gray-700 mb-3">Graize</p>
                        <div className="flex items-center gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src="https://ocaabzfiiikjcgqwhbwr.supabase.co/storage/v1/object/public/content-images/team/grazie.png" alt="Graize Belandres" width={48} height={48} className="rounded-lg" />
                          <div>
                            <p className="text-sm font-semibold text-gray-900">Graize Belandres</p>
                            <p className="text-xs text-gray-500">Assistant to Dr. Logan DuBose</p>
                          </div>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="mx-5 border-t border-gray-200" />

                      {/* Approved by + Logan */}
                      <div className="px-5 py-4">
                        <p className="text-xs text-gray-400 mb-3">Message Approved by Dr. Logan DuBose, MD/MBA</p>
                        <div className="flex items-center gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src="https://ocaabzfiiikjcgqwhbwr.supabase.co/storage/v1/object/public/content-images/team/logan.jpg" alt="Dr. Logan DuBose" width={48} height={48} className="rounded-lg" />
                          <div>
                            <p className="text-sm font-semibold text-gray-900">Dr. Logan DuBose, MD, MBA</p>
                            <p className="text-xs text-gray-500">CRO, Olera · NIH SBIR Researcher</p>
                            <p className="text-xs text-gray-500">Texas A&M College of Medicine</p>
                          </div>
                        </div>
                      </div>

                      {/* Email footer */}
                      <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 rounded-b-xl">
                        <p className="text-[11px] text-gray-400">&copy; 2026 Olera · olera.care</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer - sticky */}
            <div className="shrink-0 border-t border-gray-100 flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setStep("outcome")}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors flex items-center gap-1"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                  Back
                </button>
                <button
                  onClick={handleSkipEmail}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors"
                >
                  Skip, no email
                </button>
              </div>
              <button
                onClick={handleSendEmail}
                disabled={!editSubject.trim() || !sendToEmail.trim() || sending}
                className="rounded-lg bg-gray-900 px-5 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {sending ? "Sending..." : "Send email"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
