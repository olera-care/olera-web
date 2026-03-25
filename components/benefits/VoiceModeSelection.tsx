"use client";

import { useState, useEffect } from "react";
import type { VoiceMode } from "@/hooks/use-benefits-state";

interface VoiceModeSelectionProps {
  onSelect: (mode: VoiceMode) => void;
}

export default function VoiceModeSelection({ onSelect }: VoiceModeSelectionProps) {
  const [speechAvailable, setSpeechAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    const available =
      typeof window !== "undefined" &&
      !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    setSpeechAvailable(available);
  }, []);

  return (
    <div className="w-full animate-step-in">
      {/* Header — no card, directly on page */}
      <div className="text-center mb-10">
        <div className="flex justify-center mb-4">
          <span className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-100 text-primary-700">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
        </div>
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-gray-900 leading-snug mb-3">
          Find Your Benefits<br />and Start Saving
        </h2>
        <p className="text-sm text-gray-500 max-w-md mx-auto mb-5">
          Most families miss out on thousands in benefits they never knew existed. Answer a few questions and we&apos;ll show you exactly what you qualify for.
        </p>
        <div className="flex items-center justify-center gap-2 text-xs font-medium">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-50 border border-primary-100 text-primary-700">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Free
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-50 border border-primary-100 text-primary-700">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            No signup required
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-50 border border-primary-100 text-primary-700">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Takes 2 minutes
          </span>
        </div>
      </div>

      {/* How would you like to get started? */}
      <p className="text-sm font-medium text-gray-500 mb-3">How would you like to get started?</p>

      <div className="flex flex-col gap-3">
        {/* Fill it out myself */}
        <button
          type="button"
          onClick={() => onSelect("off")}
          className="group flex items-center gap-4 w-full p-5 rounded-2xl border border-primary-200 bg-primary-25 hover:border-primary-400 hover:bg-primary-50 hover:shadow-md transition-all text-left cursor-pointer"
        >
          <span className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary-700 text-white group-hover:bg-primary-800 transition-colors flex-shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            <span className="text-base font-semibold text-gray-900 block">Fill it out myself</span>
            <span className="text-sm text-gray-500 block mt-0.5">
              Tap through the form at your own pace.
            </span>
          </div>
          <svg className="w-5 h-5 text-gray-300 group-hover:text-primary-600 transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Talk through it */}
        <button
          type="button"
          onClick={() => speechAvailable && onSelect("guided")}
          disabled={speechAvailable === false}
          className={`group flex items-center gap-4 w-full p-5 rounded-2xl border transition-all text-left ${
            speechAvailable === false
              ? "border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed"
              : "border-primary-200 bg-primary-25 hover:border-primary-400 hover:bg-primary-50 hover:shadow-md cursor-pointer"
          }`}
        >
          <span className={`flex items-center justify-center w-12 h-12 rounded-xl flex-shrink-0 transition-colors ${
            speechAvailable === false
              ? "bg-gray-300 text-white"
              : "bg-primary-700 text-white group-hover:bg-primary-800"
          }`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 1.5a3 3 0 00-3 3v7.5a3 3 0 006 0V4.5a3 3 0 00-3-3z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5a7.5 7.5 0 01-15 0" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75V22.5" />
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            <span className="text-base font-semibold text-gray-900 block">Talk through it</span>
            <span className="text-sm text-gray-500 block mt-0.5">
              {speechAvailable === false
                ? "Voice input requires Chrome or Edge browser."
                : "Answer a few questions by voice, like talking to a care advisor."}
            </span>
          </div>
          {speechAvailable !== false && (
            <svg className="w-5 h-5 text-gray-300 group-hover:text-primary-600 transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
