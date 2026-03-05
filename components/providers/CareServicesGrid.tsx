"use client";

import { useState } from "react";

interface CareServicesGridProps {
  services: string[];
  initialCount?: number;
}

export default function CareServicesGrid({
  services,
  initialCount = 12,
}: CareServicesGridProps) {
  const [expanded, setExpanded] = useState(false);
  const needsExpand = services.length > initialCount;
  const visible = needsExpand && !expanded ? services.slice(0, initialCount) : services;

  return (
    <div>
      <div className="flex flex-wrap gap-2.5">
        {visible.map((service) => (
          <span
            key={service}
            className="px-4 py-2 rounded-full text-sm text-gray-600 bg-white border border-gray-200 hover:border-primary-300 hover:text-gray-900 transition-colors cursor-default"
          >
            {service}
          </span>
        ))}
      </div>
      {needsExpand && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-4 text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors"
        >
          {expanded ? "Show less" : `Show all ${services.length} services`}
        </button>
      )}
    </div>
  );
}
