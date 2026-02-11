"use client";

import Link from "next/link";
import PhoneButton from "./PhoneButton";

interface ConfirmationStateProps {
  providerName: string;
  phone: string | null;
  responseTime: string | null;
  notificationEmail: string;
}

export default function ConfirmationState({
  providerName,
  phone,
  responseTime,
  notificationEmail,
}: ConfirmationStateProps) {
  return (
    <>
      {/* Success banner */}
      <div className="px-5 py-6 bg-gradient-to-b from-primary-50 to-primary-50/40 rounded-[10px] text-center mb-4 border border-primary-100">
        <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg
            width="24"
            height="24"
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
        <p className="text-base font-bold text-gray-900 mb-1.5">
          You&apos;re connected!
        </p>
        <p className="text-sm text-gray-600 leading-relaxed">
          Your request has been sent to {providerName}.
          {responseTime && (
            <>
              {" "}They usually respond within {responseTime}.
            </>
          )}
        </p>
        <p className="text-xs text-gray-500 mt-2">
          We&apos;ll notify you at {notificationEmail}
        </p>
      </div>

      {/* Phone — now fully revealed */}
      <PhoneButton phone={phone} revealed onReveal={() => {}} />

      {/* View connections */}
      <Link
        href="/portal/connections"
        className="block w-full mt-2 py-3 bg-primary-600 hover:bg-primary-500 rounded-[10px] text-sm font-semibold text-white text-center transition-colors"
      >
        View Your Connections
      </Link>

      {/* Browse similar */}
      <Link
        href="/browse"
        className="block w-full text-center text-sm text-primary-600 font-medium mt-3 hover:text-primary-500 transition-colors"
      >
        Browse similar providers nearby &rarr;
      </Link>
    </>
  );
}
