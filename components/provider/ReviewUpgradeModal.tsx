"use client";

import { useState } from "react";

interface ReviewUpgradeModalProps {
  creditsUsed: number;
  onClose: () => void;
}

export default function ReviewUpgradeModal({ creditsUsed, onClose }: ReviewUpgradeModalProps) {
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
        {/* Icon */}
        <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-amber-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
          </svg>
        </div>

        <h2 className="text-lg font-semibold text-gray-900 mb-2">Build your reputation</h2>
        <p className="text-sm text-gray-500 mb-4">
          {creditsUsed >= 3
            ? "You've used your 3 free review requests. Upgrade to Pro to send unlimited requests and grow your Google reviews."
            : "Upgrade to Pro to send unlimited review requests and grow your online reputation."}
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
            Unlimited review requests
          </li>
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
            Resume downloads & LinkedIn
          </li>
        </ul>

        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

        <button type="button" onClick={handleUpgrade} disabled={loading}
          className="w-full px-4 py-3 bg-gray-900 hover:bg-gray-800 disabled:opacity-40 rounded-xl text-sm font-semibold text-white transition-colors mb-2">
          {loading ? "Redirecting to checkout..." : "Upgrade to Pro"}
        </button>
        <button type="button" onClick={onClose}
          className="w-full px-4 py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors">
          Not now
        </button>

        <p className="mt-4 text-xs text-gray-400">
          Questions?{" "}
          <a href="mailto:support@olera.care" className="underline hover:text-gray-600">
            Contact support
          </a>
        </p>
      </div>
    </div>
  );
}
