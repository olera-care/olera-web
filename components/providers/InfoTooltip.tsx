"use client";

import { useState } from "react";

interface InfoTooltipProps {
  content: string;
}

export default function InfoTooltip({ content }: InfoTooltipProps) {
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-4 h-4 text-gray-400 hover:text-gray-500 transition-colors"
        aria-label="More info"
      >
        <svg fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
        </svg>
      </button>
      {open && (
        <span className="absolute left-5 top-0 z-10 w-64 rounded-lg bg-gray-800 text-white text-xs leading-relaxed px-3 py-2 shadow-lg">
          {content}
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute top-1 right-2 text-gray-400 hover:text-white"
            aria-label="Close"
          >
            &times;
          </button>
        </span>
      )}
    </span>
  );
}
