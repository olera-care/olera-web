"use client";

import { useState } from "react";
import Link from "next/link";
import Modal from "@/components/ui/Modal";
import type { ApprovalBlock } from "@/app/api/medjobs/check-approval/route";

interface ApprovalBlockModalProps {
  block: ApprovalBlock;
  onClose: () => void;
}

/**
 * ApprovalBlockModal — shown when a student tries to submit an interview request
 * but isn't yet approved. Shows specific guidance based on their state:
 * - no_edu: Link to update email
 * - needs_review: CTA to request approval
 * - pending_review: Info that it's under review
 * - rejected: Show reason + CTA to request again
 */
export default function ApprovalBlockModal({ block, onClose }: ApprovalBlockModalProps) {
  const [requesting, setRequesting] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleApiAction() {
    if (!block.action?.api) return;
    setRequesting(true);
    setError(null);

    try {
      const res = await fetch(block.action.api, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }
      setRequestSuccess(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setRequesting(false);
    }
  }

  // Success state after requesting review
  if (requestSuccess) {
    return (
      <Modal isOpen onClose={onClose} size="md" hideHeader>
        <div className="py-8 px-4 text-center">
          {/* Success icon */}
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Review Requested
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            We&apos;ll review your profile and email you when you&apos;re approved to apply.
          </p>

          <div className="space-y-3">
            <Link
              href="/portal/medjobs"
              className="block w-full py-3.5 bg-gray-900 hover:bg-gray-800 rounded-xl text-sm font-semibold text-white transition-colors text-center"
            >
              Go to Profile
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="block w-full py-3 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  // Icon and title based on block type
  const config = getBlockConfig(block.type);

  return (
    <Modal isOpen onClose={onClose} size="md" hideHeader>
      <div className="py-8 px-4 text-center">
        {/* Icon */}
        <div className={`w-16 h-16 ${config.iconBg} rounded-full flex items-center justify-center mx-auto mb-5`}>
          {config.icon}
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-2">
          {config.title}
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          {block.message}
        </p>

        {error && (
          <div className="mb-4 p-3 bg-error-50 border border-error-100 rounded-xl text-sm text-error-700">
            {error}
          </div>
        )}

        <div className="space-y-3">
          {/* Primary action */}
          {block.action?.href ? (
            <Link
              href={block.action.href}
              className="block w-full py-3.5 bg-gray-900 hover:bg-gray-800 rounded-xl text-sm font-semibold text-white transition-colors text-center"
            >
              {block.action.label}
            </Link>
          ) : block.action?.api ? (
            <button
              type="button"
              onClick={handleApiAction}
              disabled={requesting}
              className="w-full py-3.5 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-100 disabled:text-gray-400 rounded-xl text-sm font-semibold text-white transition-colors"
            >
              {requesting ? "Requesting..." : block.action.label}
            </button>
          ) : null}

          {/* Close button (for pending_review which has no action) */}
          <button
            type="button"
            onClick={onClose}
            className="block w-full py-3 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}

function getBlockConfig(type: ApprovalBlock["type"]) {
  switch (type) {
    case "no_edu":
      return {
        title: "University Email Required",
        iconBg: "bg-amber-100",
        icon: (
          <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
          </svg>
        ),
      };
    case "needs_review":
      return {
        title: "Request Profile Approval",
        iconBg: "bg-primary-100",
        icon: (
          <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        ),
      };
    case "pending_review":
      return {
        title: "Under Review",
        iconBg: "bg-blue-100",
        icon: (
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        ),
      };
    case "rejected":
      return {
        title: "Profile Not Approved",
        iconBg: "bg-red-100",
        icon: (
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
        ),
      };
  }
}
