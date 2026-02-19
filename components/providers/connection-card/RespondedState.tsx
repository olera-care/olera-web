"use client";

import Link from "next/link";
import PhoneButton from "./PhoneButton";

interface RespondedStateProps {
  providerName: string;
  phone: string | null;
  requestDate: string | null;
}

export default function RespondedState({
  phone,
  requestDate,
}: RespondedStateProps) {
  const dateStr = requestDate
    ? new Date(requestDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : "recently";

  return (
    <>
      {/* Status banner */}
      <div className="flex items-center gap-3 px-4 py-4 bg-emerald-50 rounded-[10px] mb-4 border border-emerald-100">
        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-emerald-600"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">
            Connected &middot; {dateStr}
          </p>
          <p className="text-[13px] text-emerald-600 font-medium">
            Response received
          </p>
        </div>
      </div>

      {/* Phone — fully revealed */}
      <PhoneButton phone={phone} revealed onReveal={() => {}} />

      {/* View connections */}
      <Link
        href="/portal/inbox"
        className="block w-full mt-2 py-3 bg-primary-600 hover:bg-primary-500 rounded-[10px] text-sm font-semibold text-white text-center transition-colors"
      >
        Go to Messages
      </Link>
    </>
  );
}
