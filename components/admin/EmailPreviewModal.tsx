"use client";

import { useState } from "react";

interface EmailPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  from: string;
  to: string;
  subject: string;
  html: string;
  sending: boolean;
}

export default function EmailPreviewModal({
  isOpen,
  onClose,
  onConfirm,
  from,
  to,
  subject,
  html,
  sending,
}: EmailPreviewModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
          <h3 className="font-semibold text-gray-900">Email Preview</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={sending}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Email Headers */}
        <div className="px-6 py-4 border-b bg-white space-y-2 text-sm">
          <div className="flex">
            <span className="font-medium text-gray-700 w-16">From:</span>
            <span className="text-gray-900">{from}</span>
          </div>
          <div className="flex">
            <span className="font-medium text-gray-700 w-16">To:</span>
            <span className="text-gray-900">{to}</span>
          </div>
          <div className="flex">
            <span className="font-medium text-gray-700 w-16">Subject:</span>
            <span className="text-gray-900">{subject}</span>
          </div>
        </div>

        {/* Email Body (in iframe for safe rendering) */}
        <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <div className="bg-white rounded-lg shadow-sm">
            <iframe
              srcDoc={html}
              className="w-full h-[500px] border-0"
              title="Email Preview"
              sandbox="allow-same-origin"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            disabled={sending}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={sending}
            className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50"
          >
            {sending ? "Sending..." : "Send Nudge"}
          </button>
        </div>
      </div>
    </div>
  );
}
