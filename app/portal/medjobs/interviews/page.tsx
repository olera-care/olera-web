"use client";

import Link from "next/link";
import { LifecycleProgress } from "@/components/medjobs/LifecycleProgress";

export default function InterviewsPage() {
  return (
    <main className="min-h-screen bg-[#FAFAF8]">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <LifecycleProgress currentPhase="interview" />

        <div className="mt-8 mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Interviews</h1>
          <p className="text-sm text-gray-500 mt-1">
            Scheduled interviews and preparation details will appear here.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <svg className="w-12 h-12 text-gray-200 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-500 mb-2">No interviews scheduled yet</p>
          <p className="text-sm text-gray-400 mb-6">
            Complete your profile and apply to providers to start getting interview requests.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/portal/medjobs" className="px-4 py-2 bg-gray-900 hover:bg-gray-800 rounded-lg text-sm font-medium text-white transition-colors">
              Complete your profile
            </Link>
            <Link href="/portal/medjobs/jobs" className="px-4 py-2 border border-gray-200 hover:border-gray-300 rounded-lg text-sm font-medium text-gray-700 transition-colors">
              Browse open jobs
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
