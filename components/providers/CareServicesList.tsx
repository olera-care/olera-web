"use client";

import { useState } from "react";

interface CareServicesListProps {
  services: string[];
  initialCount?: number;
}

export default function CareServicesList({
  services,
  initialCount = 15,
}: CareServicesListProps) {
  const [expanded, setExpanded] = useState(false);
  const needsExpand = services.length > initialCount;
  const visible =
    needsExpand && !expanded ? services.slice(0, initialCount) : services;

  return (
    <div>
      <div className={`grid gap-y-5 gap-x-8 ${services.length <= 3 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-2 md:grid-cols-3"}`}>
        {visible.map((service) => (
          <div key={service} className="flex items-center gap-3">
            <svg
              className="w-5 h-5 text-primary-600 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className="text-sm text-gray-700">{service}</span>
          </div>
        ))}
      </div>
      {needsExpand && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-primary-600 hover:text-primary-700 font-medium text-sm mt-4 transition-colors"
        >
          {expanded ? "Show less" : "View more"}
        </button>
      )}
    </div>
  );
}
