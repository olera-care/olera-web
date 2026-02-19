"use client";

import { useState } from "react";

export default function ReportListingLink() {
  const [reported, setReported] = useState(false);

  const handleReport = () => {
    setReported(true);
    setTimeout(() => setReported(false), 3000);
  };

  return (
    <div className="flex items-center justify-center gap-1.5 mt-4">
      {reported ? (
        <span className="text-xs text-gray-400">
          Thanks, we&apos;ll review this listing
        </span>
      ) : (
        <button
          type="button"
          onClick={handleReport}
          className="flex items-center gap-1.5 text-xs font-medium text-gray-400 underline underline-offset-2 decoration-gray-300 hover:text-gray-600 hover:decoration-gray-400 transition-colors"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
            <line x1="4" y1="22" x2="4" y2="15" />
          </svg>
          Report this listing
        </button>
      )}
    </div>
  );
}
