"use client";

import { useEffect } from "react";

interface WorkflowGuideModalProps {
  onClose: () => void;
}

export function WorkflowGuideModal({ onClose }: WorkflowGuideModalProps) {
  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Workflow Guide</h3>
              <p className="text-sm text-gray-500 mt-0.5">Provider Cold Outreach process</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5 overflow-y-auto">
          {/* General Rules */}
          <section className="mb-6">
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs">★</span>
              General Rules
            </h4>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2">
              <p className="text-sm text-amber-900">
                <strong>Take detailed notes</strong> on every call/action — so anyone can pick up where you left off.
              </p>
              <p className="text-sm text-amber-900">
                <strong>Every call is a conversion opportunity</strong> — if a provider shows high interest AND you&apos;re speaking with a decision maker (someone with email access), send the claim link instantly and try to convert them on the call.
              </p>
            </div>
          </section>

          {/* Call & Confirm */}
          <section className="mb-6">
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs">1</span>
              Call &amp; Confirm
            </h4>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <p className="text-sm text-gray-700">
                <strong>Purpose:</strong> Confirm emails are valid before sequence starts.
              </p>
              <div className="text-sm text-gray-700">
                <strong>Process:</strong>
                <ol className="list-decimal list-inside mt-1 space-y-1 ml-2">
                  <li>Find email using web scraper → Apollo → own research</li>
                  <li>Call to confirm the email is correct</li>
                  <li><span className="font-semibold text-primary-700">Minimum 3 call attempts</span> before marking as confirmed</li>
                </ol>
              </div>
              <p className="text-sm text-gray-700">
                <strong>To confirm:</strong> Click the blue checkmark — but only after proper due diligence. Notes should support the confirmation.
              </p>
            </div>
          </section>

          {/* In Sequence */}
          <section className="mb-6">
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs">2</span>
              In Sequence
            </h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500 italic">No action required — automated email sequence runs here.</p>
            </div>
          </section>

          {/* Follow Up */}
          <section className="mb-6">
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs">3</span>
              Follow Up
            </h4>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <p className="text-sm text-gray-700">
                <strong>Purpose:</strong> Convert providers OR get corrected emails.
              </p>
              <p className="text-sm text-gray-700">
                <strong>Goal:</strong> Get provider to claim on the call. <span className="font-semibold text-primary-700">Minimum 2 follow-up attempts.</span>
              </p>
              <div className="text-sm text-gray-700">
                <strong>If provider prefers alternative channels:</strong>
                <ul className="list-disc list-inside mt-1 space-y-0.5 ml-2 text-gray-600">
                  <li>Resend link (email)</li>
                  <li>Fax</li>
                  <li>Contact form</li>
                  <li>Direct mail</li>
                </ul>
              </div>
              <p className="text-sm text-gray-700">
                <strong>Wrong email?</strong> Change email → move back to Ready.
              </p>
            </div>
          </section>

          {/* Alternative Channels */}
          <section className="mb-6">
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs">4</span>
              Alternative Channels
            </h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                Providers moved here after using fax, contact form, or direct mail. Wait for response before next action.
              </p>
            </div>
          </section>

          {/* Call */}
          <section className="mb-6">
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-xs">5</span>
              Call
            </h4>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <p className="text-sm text-gray-700">
                <strong>Purpose:</strong> Final touch point after Alternative Channels (after 7-day wait).
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-semibold text-primary-700">Minimum 2 final call attempts.</span>
              </p>
              <p className="text-sm text-gray-700">
                After attempts: Mark as <strong>Not Interested</strong> or <strong>Archive</strong> based on the situation.
              </p>
            </div>
          </section>

          {/* Not Interested */}
          <section className="mb-6">
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs">!</span>
              Not Interested (Soft Terminal)
            </h4>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
              <p className="text-sm text-amber-900">
                <strong>Effect:</strong> Stops cold outreach only. Provider can still receive questions, leads, and other engagement.
              </p>
              <div className="text-sm text-amber-900">
                <strong>Mark as Not Interested when:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1 ml-2">
                  <li>Provider explicitly declines (soft refusal)</li>
                  <li>Temporarily closed</li>
                  <li>All attempts exhausted with no claim:
                    <ul className="list-disc list-inside ml-4 mt-1 text-amber-800">
                      <li>Call &amp; Confirm: 3 calls</li>
                      <li>Email sequence completed</li>
                      <li>Follow Up: 2 calls</li>
                      <li>Alternative Channels: 7-day wait</li>
                      <li>Call (final): 2 calls</li>
                      <li className="font-semibold">Total: 7+ calls minimum</li>
                    </ul>
                  </li>
                </ul>
              </div>
              <p className="text-sm text-amber-800 italic">
                Notes must support the decision — document decline or all attempts made.
              </p>
            </div>
          </section>

          {/* Archived */}
          <section>
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-xs">✕</span>
              Archived (Hard Terminal)
            </h4>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
              <p className="text-sm text-red-900">
                <strong>Effect:</strong> Complete system block. Provider stops receiving ALL communication — emails, questions, leads, everything.
              </p>
              <div className="text-sm text-red-900">
                <strong>Archive only when:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1 ml-2">
                  <li>Angry provider / threatening legal action</li>
                  <li>Permanently closed / out of business</li>
                  <li>Invalid provider (doesn&apos;t offer senior care services)</li>
                </ul>
              </div>
              <p className="text-sm text-red-800 font-medium">
                ⚠️ Use with caution — this is irreversible in normal workflow.
              </p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 shrink-0 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
