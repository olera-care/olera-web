"use client";

import Link from "next/link";

interface UpgradePromptProps {
  /** What the user was trying to do when they hit the paywall */
  context?: string;
}

export default function UpgradePrompt({
  context = "respond to inquiries and connect with families",
}: UpgradePromptProps) {
  return (
    <div className="bg-warm-50 border border-warm-200 rounded-xl p-6 text-center">
      <div className="w-12 h-12 bg-warm-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg
          className="w-6 h-6 text-warm-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Upgrade to Pro
      </h3>
      <p className="text-base text-gray-600 mb-4">
        Upgrade to {context}.
      </p>
      <div className="space-y-2">
        <Link
          href="/provider/pro"
          className="block w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors text-center min-h-[44px]"
        >
          Upgrade — $25/month
        </Link>
        <p className="text-sm text-gray-500">
          or $249/year (save 17%)
        </p>
      </div>
    </div>
  );
}
