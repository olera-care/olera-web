"use client";

import { useState } from "react";

interface UpgradeModalProps {
  interviewsUsed: number;
  onClose: () => void;
}

export default function UpgradeModal({ interviewsUsed, onClose }: UpgradeModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleUpgrade = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/medjobs/checkout", { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to start checkout."); return; }
      if (data.url) window.location.href = data.url;
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center" onClick={(e) => e.stopPropagation()}>
        <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-primary-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
        </div>

        <h2 className="text-lg font-semibold text-gray-900 mb-2">Unlock unlimited interviews</h2>
        <p className="text-sm text-gray-500 mb-4">
          {interviewsUsed > 0
            ? "You\u2019ve used your free interview and experienced MedJobs firsthand. Keep hiring the best student caregivers."
            : "Upgrade to schedule interviews with top student caregivers."}
        </p>

        <div className="bg-gray-50 rounded-xl p-4 mb-5">
          <p className="text-2xl font-bold text-gray-900">$49<span className="text-sm font-normal text-gray-500">/month</span></p>
          <p className="text-xs text-gray-400 mt-1">Cancel anytime</p>
        </div>

        <ul className="text-left text-sm text-gray-600 space-y-2 mb-5">
          <li className="flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Unlimited interview scheduling
          </li>
          <li className="flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Full candidate contact info
          </li>
          <li className="flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Resume downloads & LinkedIn access
          </li>
          <li className="flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Full candidate names
          </li>
        </ul>

        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

        <button type="button" onClick={handleUpgrade} disabled={loading}
          className="w-full px-4 py-3 bg-gray-900 hover:bg-gray-800 disabled:opacity-40 rounded-xl text-sm font-semibold text-white transition-colors mb-2">
          {loading ? "Redirecting to checkout..." : "Unlock Now"}
        </button>
        <button type="button" onClick={onClose}
          className="w-full px-4 py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors">
          Not now
        </button>

        <p className="mt-4 text-xs text-gray-400">
          Had a bad experience with your free interview?{" "}
          <a href="mailto:support@olera.care" className="underline hover:text-gray-600">
            Contact support
          </a>{" "}
          for another free credit.
        </p>
      </div>
    </div>
  );
}
