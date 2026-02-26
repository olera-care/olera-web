"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled error:", error);
  }, [error]);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-16 px-4">
      <div className="text-center max-w-md">
        <p className="text-6xl font-bold text-red-500 mb-4">500</p>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Something went wrong
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          An unexpected error occurred. Please try again.
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center justify-center px-6 py-3 text-lg font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors min-h-[44px]"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
