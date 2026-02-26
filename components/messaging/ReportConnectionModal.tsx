"use client";

import { useState } from "react";

const REPORT_REASONS = [
  { value: "spam", label: "Spam or scam" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "fake_profile", label: "Fake or misleading profile" },
  { value: "harassment", label: "Harassment" },
  { value: "other", label: "Other" },
];

interface ReportConnectionModalProps {
  connectionId: string;
  onClose: () => void;
  onSubmit: (connectionId: string, reason: string, details: string) => void;
}

export default function ReportConnectionModal({
  connectionId,
  onClose,
  onSubmit,
}: ReportConnectionModalProps) {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!selectedReason) return;
    setSubmitting(true);
    onSubmit(connectionId, selectedReason, details.trim());
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Report Conversation</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Let us know why you&apos;re reporting this conversation.
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-3">
          {REPORT_REASONS.map((reason) => (
            <button
              key={reason.value}
              type="button"
              onClick={() => setSelectedReason(reason.value)}
              className={`w-full text-left px-4 py-3 rounded-xl text-[15px] border transition-all flex items-center gap-3 ${
                selectedReason === reason.value
                  ? "bg-red-50 border-red-200 text-red-800"
                  : "bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <span
                className={`w-[18px] h-[18px] rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
                  selectedReason === reason.value
                    ? "border-red-500 bg-red-500"
                    : "border-gray-300"
                }`}
              >
                {selectedReason === reason.value && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                )}
              </span>
              {reason.label}
            </button>
          ))}

          {/* Details text area — shows when a reason is selected */}
          {selectedReason && (
            <div className="pt-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Additional details
                <span className="text-gray-400 font-normal ml-1">(optional)</span>
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Tell us more about what happened..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-gray-300 focus:ring-1 focus:ring-gray-200 resize-none transition-all"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedReason || submitting}
            className="px-5 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
          >
            {submitting ? "Reporting..." : "Submit Report"}
          </button>
        </div>
      </div>
    </div>
  );
}
