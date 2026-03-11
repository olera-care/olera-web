"use client";

import type { VoiceMode } from "@/hooks/use-benefits-state";

interface VoiceModeSelectionProps {
  onSelect: (mode: VoiceMode) => void;
}

export default function VoiceModeSelection({ onSelect }: VoiceModeSelectionProps) {
  return (
    <div className="w-full animate-step-in">
      <h2 className="font-display text-display-sm font-medium text-gray-900 mb-2 leading-snug tracking-tight">
        Find benefits &amp; programs
      </h2>
      <p className="text-sm text-gray-500 mb-8">
        We&apos;ll match you with programs based on a few quick questions.
      </p>

      <div className="flex flex-col gap-3">
        {/* Talk through it */}
        <button
          type="button"
          onClick={() => onSelect("guided")}
          className="group flex items-start gap-4 w-full p-5 rounded-2xl border border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm transition-all text-left cursor-pointer"
        >
          <span className="flex items-center justify-center w-11 h-11 rounded-full bg-primary-50 text-primary-600 flex-shrink-0 mt-0.5">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 1.5a3 3 0 00-3 3v7.5a3 3 0 006 0V4.5a3 3 0 00-3-3z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5a7.5 7.5 0 01-15 0" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75V22.5" />
            </svg>
          </span>
          <div className="min-w-0">
            <span className="text-base font-medium text-gray-900 block">Talk through it</span>
            <span className="text-sm text-gray-500 block mt-0.5">
              Answer a few questions by voice — like talking to a care advisor.
            </span>
          </div>
        </button>

        {/* Fill it out myself */}
        <button
          type="button"
          onClick={() => onSelect("off")}
          className="group flex items-start gap-4 w-full p-5 rounded-2xl border border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm transition-all text-left cursor-pointer"
        >
          <span className="flex items-center justify-center w-11 h-11 rounded-full bg-gray-50 text-gray-500 flex-shrink-0 mt-0.5">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
            </svg>
          </span>
          <div className="min-w-0">
            <span className="text-base font-medium text-gray-900 block">Fill it out myself</span>
            <span className="text-sm text-gray-500 block mt-0.5">
              Tap through the form at your own pace.
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}
