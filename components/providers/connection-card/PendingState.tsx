"use client";

import Link from "next/link";
import PhoneButton from "./PhoneButton";

interface PendingStateProps {
  providerName: string;
  phone: string | null;
  requestDate: string | null;
}

export default function PendingState({
  providerName,
  phone,
  requestDate,
}: PendingStateProps) {
  const dateStr = requestDate
    ? new Date(requestDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : "recently";

  return (
    <>
      {/* Status banner */}
      <div className="px-4 py-5 bg-primary-50 rounded-[10px] text-center mb-4 border border-primary-100">
        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-primary-600"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-gray-900 mb-1">
          Request sent {dateStr}
        </p>
        <p className="text-[13px] text-gray-500">
          Waiting for {providerName} to respond
        </p>
      </div>

      {/* Phone — fully revealed (already connected) */}
      <PhoneButton phone={phone} revealed onReveal={() => {}} />

      {/* View connections */}
      <Link
        href="/portal/connections"
        className="block w-full mt-2 py-3 border border-gray-200 rounded-[10px] text-sm font-medium text-primary-600 text-center hover:bg-gray-50 transition-colors"
      >
        View Your Connections
      </Link>
    </>
  );
}
