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
          <section className="mb-8">
            <h4 className="text-base font-semibold text-gray-900 mb-4">
              General Rules
            </h4>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2">
              <p className="text-sm text-amber-900">
                <strong>Log every call.</strong> Every single call must be logged. Add notes to capture context — what was discussed, who you spoke with, next steps. Good notes mean anyone can pick up where you left off.
              </p>
              <p className="text-sm text-amber-900">
                <strong>Every call is a conversion opportunity.</strong> If a provider shows high interest AND you&apos;re speaking with a decision maker (someone with email access), send the claim link instantly and try to convert them on the call.
              </p>
              <p className="text-sm text-amber-900">
                <strong>No sequence without a call.</strong> A provider should never enter the email sequence without being called first. Confirm the email is correct before starting.
              </p>
              <p className="text-sm text-amber-900">
                <strong>If something is unclear, ask.</strong> Don&apos;t guess or assume — ask for clarification before taking action.
              </p>
            </div>
          </section>

          {/* Call & Confirm */}
          <section className="mb-8">
            <h4 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-sm">1</span>
              Call &amp; Confirm
            </h4>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <p className="text-sm text-gray-700">
                <strong>Purpose:</strong> Find emails for providers who don&apos;t have one, and confirm emails for those who do. Once confirmed, start the sequence.
              </p>
              <div className="text-sm text-gray-700">
                <strong>Process:</strong>
                <ol className="list-decimal list-inside mt-1 space-y-1 ml-2">
                  <li>Find email using web scraper and online research. <span className="text-gray-500">(Apollo can be used as a last resort when other methods fail.)</span></li>
                  <li>Call to confirm the email is correct — <span className="font-semibold">this is the most important step.</span></li>
                  <li><span className="font-semibold text-primary-700">Minimum 3 call attempts.</span> All calls must be logged.</li>
                </ol>
              </div>
              <div className="text-sm text-gray-700">
                <strong>After confirmation:</strong>
                <ol className="list-decimal list-inside mt-1 space-y-1 ml-2">
                  <li>If you&apos;re speaking with a decision maker (or someone with access to the email), send an instant email — customize it based on your conversation.</li>
                  <li>Start the sequence for the provider.</li>
                </ol>
              </div>
            </div>
          </section>

          {/* In Sequence */}
          <section className="mb-8">
            <h4 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-sm">2</span>
              In Sequence
            </h4>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <p className="text-sm text-gray-500 italic">No action required — automated email sequence runs here.</p>
              <p className="text-sm text-gray-700">
                <strong>Optional:</strong> If you have no Follow Up providers to work on, you can proactively call providers still in sequence. If they&apos;ve received 2+ emails but haven&apos;t claimed, give them a call to check if they&apos;re receiving the emails.
              </p>
            </div>
          </section>

          {/* Follow Up */}
          <section className="mb-8">
            <h4 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-sm">3</span>
              Follow Up
            </h4>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <p className="text-sm text-gray-700">
                <strong>Purpose:</strong> Follow up with providers who completed the email sequence and convert them.
              </p>
              <p className="text-sm text-gray-700">
                <strong>Goal:</strong> Convert the provider. Use the resend button to send the claim link — either while you have them on the phone or immediately after. Customize the email based on your conversation. <span className="font-semibold text-primary-700">Minimum 2 follow-up attempts.</span>
              </p>
              <div className="text-sm text-gray-700">
                <strong>Alternative channels:</strong> If the provider prefers a different method, use any of these:
                <ul className="list-disc list-inside mt-1 space-y-0.5 ml-2 text-gray-600">
                  <li>Resend link (email)</li>
                  <li>Fax</li>
                  <li>Contact form</li>
                  <li>Direct mail</li>
                </ul>
              </div>
              <p className="text-sm text-gray-700">
                <strong>Wrong email?</strong> Change the email, then send the resend link or use an alternative channel — this moves the provider to Alternative Channels.
              </p>
            </div>
          </section>

          {/* Alternative Channels */}
          <section className="mb-8">
            <h4 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-sm">4</span>
              Alternative Channels
            </h4>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <p className="text-sm text-gray-700">
                Providers move here after being contacted via resend email, fax, contact form, or direct mail.
              </p>
              <p className="text-sm text-gray-700">
                <strong>Wait 7 days</strong> for the provider to respond or claim. If they don&apos;t claim within 7 days, the system automatically moves them to the Call tab.
              </p>
            </div>
          </section>

          {/* Call */}
          <section className="mb-8">
            <h4 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-sm">5</span>
              Call
            </h4>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <p className="text-sm text-gray-700">
                <strong>Purpose:</strong> Final touchpoint after Alternative Channels (after 7-day wait). Confirm we have the right email.
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-semibold text-primary-700">Minimum 2 call attempts.</span>
              </p>
              <div className="text-sm text-gray-700">
                <strong>Main goal:</strong> Move the provider to City Broadcast. Before moving, confirm these conditions are met:
                <ul className="list-disc list-inside mt-1 space-y-0.5 ml-2 text-gray-600">
                  <li>At least one email has been delivered</li>
                  <li>No complaints on the email</li>
                  <li>No bounces on the email</li>
                  <li>All calls are logged — valid calls, not voicemails or no-answers</li>
                </ul>
              </div>
              <p className="text-sm text-gray-700">
                <strong>Need to change email?</strong> Edit the email, send a resend link, and confirm it&apos;s delivered before moving to Broadcast.
              </p>
              <p className="text-sm text-gray-700">
                <strong>Not interested?</strong> If the provider says they&apos;re not interested, mark as <strong>Not Interested</strong>.
              </p>
              <p className="text-sm text-gray-700">
                <strong>Out of business, closed, or angry?</strong> Mark as <strong>Archive</strong>.
              </p>
            </div>
          </section>

          {/* Not Interested */}
          <section className="mb-8">
            <h4 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-sm">6</span>
              Not Interested (Soft Terminal)
            </h4>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <p className="text-sm text-gray-700">
                <strong>Effect:</strong> Stops cold outreach only. Provider can still receive questions, leads, and other engagement.
              </p>
              <div className="text-sm text-gray-700">
                <strong>Mark as Not Interested when:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1 ml-2">
                  <li>Provider explicitly declines — they say they&apos;re not interested in Olera, the outreach, or claiming their account</li>
                  <li>Temporarily closed</li>
                  <li>In the Call tab but conditions for Broadcast don&apos;t pass (e.g., bounces, complaints)</li>
                  <li>All attempts exhausted (7+ calls across all stages) — they keep not answering, calls go to voicemail, and there&apos;s no other way to verify the email</li>
                </ul>
              </div>
              <p className="text-sm text-gray-500 italic">
                Notes and call logs must support the decision — document the decline or all attempts made.
              </p>
            </div>
          </section>

          {/* Archived */}
          <section>
            <h4 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-sm">7</span>
              Archived (Hard Terminal)
            </h4>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <p className="text-sm text-gray-700">
                <strong>Effect:</strong> Complete system block. Provider stops receiving ALL communication — emails, questions, leads, everything.
              </p>
              <div className="text-sm text-gray-700">
                <strong>Archive only when:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1 ml-2">
                  <li>Angry provider / threatening legal action</li>
                  <li>Permanently closed / out of business</li>
                  <li>Invalid provider (doesn&apos;t offer senior care services)</li>
                </ul>
              </div>
              <p className="text-sm text-gray-500 italic">
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
