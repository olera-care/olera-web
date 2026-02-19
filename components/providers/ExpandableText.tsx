"use client";

import { useState } from "react";

interface ExpandableTextProps {
  text: string;
  maxLength?: number;
  className?: string;
}

export default function ExpandableText({
  text,
  maxLength = 250,
  className = "",
}: ExpandableTextProps) {
  const [expanded, setExpanded] = useState(false);
  const needsTruncation = text.length > maxLength;

  const displayText =
    needsTruncation && !expanded ? text.slice(0, maxLength).trimEnd() + "..." : text;

  return (
    <div className={className}>
      <p className="text-gray-600 text-lg leading-relaxed">
        {displayText}
        {needsTruncation && (
          <>
            {" "}
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-primary-600 hover:text-primary-700 font-medium text-lg transition-colors"
            >
              {expanded ? "Show less" : "Read more"}
            </button>
          </>
        )}
      </p>
    </div>
  );
}
