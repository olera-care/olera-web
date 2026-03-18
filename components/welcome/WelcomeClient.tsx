"use client";

import { useState } from "react";
import Link from "next/link";

interface WelcomeClientProps {
  destination: string;
  initialProviders?: unknown[];
  initialCity?: string | null;
}

export default function WelcomeClient({ destination }: WelcomeClientProps) {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Welcome to Olera
        </h1>
        <p className="text-gray-600 mb-8">
          Static test page - no auth hooks.
        </p>
        <p className="text-sm text-gray-500 mb-4">
          Destination: {destination}
        </p>
        <p className="text-sm text-gray-500 mb-4">
          Counter: {count}
        </p>
        <div className="flex gap-4">
          <button
            onClick={() => setCount(c => c + 1)}
            className="px-4 py-2 bg-gray-200 rounded"
          >
            Increment
          </button>
          <Link
            href={destination}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Continue
          </Link>
        </div>
      </div>
    </div>
  );
}
