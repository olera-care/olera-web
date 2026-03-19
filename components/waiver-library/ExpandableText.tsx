"use client";

import { useRef, useState, useEffect } from "react";

interface ExpandableTextProps {
  text: string;
}

function splitAfterSecondSentence(text: string): [string, string] {
  const regex = /[.!?]\s+/g;
  let count = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    count++;
    if (count === 2) {
      const splitIndex = match.index + match[0].length;
      return [text.slice(0, splitIndex).trim(), text.slice(splitIndex).trim()];
    }
  }
  return [text, ""];
}

export function ExpandableText({ text }: ExpandableTextProps) {
  const [expanded, setExpanded] = useState(false);
  const [collapsedHeight, setCollapsedHeight] = useState<number | null>(null);
  const previewRef = useRef<HTMLSpanElement>(null);
  const fullRef = useRef<HTMLDivElement>(null);
  const [preview, remainder] = splitAfterSecondSentence(text);

  useEffect(() => {
    if (previewRef.current) {
      setCollapsedHeight(previewRef.current.offsetHeight);
    }
  }, [preview]);

  if (!remainder) {
    return <p className="text-gray-700 leading-relaxed">{text}</p>;
  }

  return (
    <div>
      {/* Hidden measurement span */}
      <span
        ref={previewRef}
        className="text-gray-700 leading-relaxed"
        style={{ position: "absolute", visibility: "hidden", left: "-9999px", width: "inherit" }}
        aria-hidden="true"
      >
        {preview}
      </span>

      {/* Full text always in DOM for SEO — clipped via CSS when collapsed */}
      <div
        ref={fullRef}
        className="text-gray-700 leading-relaxed overflow-hidden transition-[max-height] duration-300 ease-in-out"
        style={{
          maxHeight: expanded
            ? `${fullRef.current?.scrollHeight ?? 1000}px`
            : collapsedHeight !== null
              ? `${collapsedHeight}px`
              : undefined,
        }}
      >
        <p>{text}</p>
      </div>

      <button
        onClick={() => setExpanded(!expanded)}
        className="mt-2 text-sm font-medium text-primary-600 hover:text-primary-500 transition-colors"
      >
        {expanded ? "Read less \u2191" : "Read more \u2193"}
      </button>
    </div>
  );
}
