"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface DemoState {
  exists: boolean;
  profile: {
    id: string;
    slug: string;
    display_name: string;
    claim_state: string | null;
    verification_state: string | null;
    claim_trust_level: string | null;
    account_id: string | null;
    source: string | null;
    email?: string | null;
  } | null;
  demoSlug: string;
}

export default function ResetDemoPage() {
  const [state, setState] = useState<DemoState | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [customEmail, setCustomEmail] = useState("");

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch("/api/dev/reset-demo");
      const data = await res.json();
      setState(data);
    } catch {
      setMessage({ type: "error", text: "Failed to fetch demo state" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  const handleAction = async (action: "reset" | "approve" | "set_pending" | "force_claim" | "set_restricted") => {
    setActionLoading(action);
    setMessage(null);

    // For reset, require an email with +suspicious
    if (action === "reset") {
      if (!customEmail.includes("+suspicious")) {
        setMessage({ type: "error", text: "Email must contain '+suspicious' to trigger low-trust scoring" });
        setActionLoading(null);
        return;
      }
    }

    try {
      const res = await fetch("/api/dev/reset-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, email: customEmail || undefined }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Action failed" });
      } else {
        setMessage({ type: "success", text: data.message });
        await fetchState();
      }
    } catch {
      setMessage({ type: "error", text: "Action failed" });
    } finally {
      setActionLoading(null);
    }
  };

  const getStateColor = (value: string | null) => {
    switch (value) {
      case "claimed":
        return "text-green-700 bg-green-50";
      case "unclaimed":
        return "text-gray-700 bg-gray-100";
      case "verified":
        return "text-green-700 bg-green-50";
      case "pending_verification":
        return "text-amber-700 bg-amber-50";
      case "pending":
        return "text-blue-700 bg-blue-50";
      case "low":
        return "text-red-700 bg-red-50";
      case "medium":
        return "text-amber-700 bg-amber-50";
      case "high":
        return "text-green-700 bg-green-50";
      default:
        return "text-gray-700 bg-gray-100";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-medium text-xs">
              DEV ONLY
            </span>
            <span>Verification Gating Demo</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Demo Control Panel</h1>
          <p className="mt-2 text-gray-600">
            Test the low-trust verification flow without affecting production data.
          </p>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-xl ${
              message.type === "success"
                ? "bg-green-50 border border-green-200 text-green-800"
                : "bg-red-50 border border-red-200 text-red-800"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Current State */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Current State</h2>

          {state?.exists && state.profile ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Provider</span>
                <span className="font-medium text-gray-900">{state.profile.display_name}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Claim State</span>
                <span className={`px-2.5 py-1 rounded-full text-sm font-medium ${getStateColor(state.profile.claim_state)}`}>
                  {state.profile.claim_state || "—"}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Verification State</span>
                <span className={`px-2.5 py-1 rounded-full text-sm font-medium ${getStateColor(state.profile.verification_state)}`}>
                  {state.profile.verification_state || "—"}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Trust Level</span>
                <span className={`px-2.5 py-1 rounded-full text-sm font-medium ${getStateColor(state.profile.claim_trust_level)}`}>
                  {state.profile.claim_trust_level || "—"}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-gray-600">Has Account</span>
                <span className="text-gray-900">{state.profile.account_id ? "Yes" : "No"}</span>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 italic">Demo provider not created yet. Click "Reset Demo" to create it.</p>
          )}
        </div>

        {/* Actions */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>

          <div className="space-y-4">
            {/* Reset Demo */}
            <div className="p-4 bg-gray-50 rounded-xl space-y-3">
              <div>
                <p className="font-medium text-gray-900">Reset Demo</p>
                <p className="text-sm text-gray-500">
                  Delete existing demo data and create fresh unclaimed provider
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your email (must contain +suspicious)
                </label>
                <input
                  type="email"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  placeholder="you+suspicious@gmail.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Use your real Gmail with +suspicious added. You&apos;ll receive the OTP there.
                </p>
              </div>
              <button
                onClick={() => handleAction("reset")}
                disabled={actionLoading !== null || !customEmail}
                className="w-full px-4 py-2 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 text-white font-medium rounded-lg transition-colors"
              >
                {actionLoading === "reset" ? "Resetting..." : "Reset Demo"}
              </button>
            </div>

            {/* Force Claim (Demo) - Skip OTP */}
            <div className="p-4 bg-purple-50 rounded-xl space-y-3">
              <div>
                <p className="font-medium text-gray-900">Force Claim (Demo)</p>
                <p className="text-sm text-gray-500">
                  Links demo provider to your account and sets restricted state. Skips OTP.
                </p>
              </div>
              <button
                onClick={() => handleAction("force_claim")}
                disabled={actionLoading !== null || !customEmail}
                className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white font-medium rounded-lg transition-colors"
              >
                {actionLoading === "force_claim" ? "Claiming..." : "Force Claim"}
              </button>
            </div>

            {/* Set to Restricted (Low Trust) */}
            <div className="flex items-center justify-between p-4 bg-amber-50 rounded-xl">
              <div>
                <p className="font-medium text-gray-900">Set to Restricted</p>
                <p className="text-sm text-gray-500">
                  Set to &quot;pending_verification&quot; — shows locked UI, banner, modal
                </p>
              </div>
              <button
                onClick={() => handleAction("set_restricted")}
                disabled={actionLoading !== null}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-300 text-white font-medium rounded-lg transition-colors"
              >
                {actionLoading === "set_restricted" ? "Setting..." : "Set Restricted"}
              </button>
            </div>

            {/* Simulate Admin Approval */}
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
              <div>
                <p className="font-medium text-gray-900">Simulate Admin Approval</p>
                <p className="text-sm text-gray-500">
                  Set verification_state to &quot;verified&quot; (unlocks full access)
                </p>
              </div>
              <button
                onClick={() => handleAction("approve")}
                disabled={actionLoading !== null}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-medium rounded-lg transition-colors"
              >
                {actionLoading === "approve" ? "Approving..." : "Approve"}
              </button>
            </div>

            {/* Set to Pending Review */}
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
              <div>
                <p className="font-medium text-gray-900">Set to Pending Review</p>
                <p className="text-sm text-gray-500">
                  Simulate verification form submission (still restricted)
                </p>
              </div>
              <button
                onClick={() => handleAction("set_pending")}
                disabled={actionLoading !== null || !state?.profile?.account_id}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-medium rounded-lg transition-colors"
              >
                {actionLoading === "set_pending" ? "Setting..." : "Set Pending"}
              </button>
            </div>
          </div>
        </div>

        {/* Demo Flow Guide */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Demo Flow</h2>

          <ol className="space-y-4">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-900 text-white text-sm flex items-center justify-center font-medium">
                1
              </span>
              <div>
                <p className="font-medium text-gray-900">Reset the demo</p>
                <p className="text-sm text-gray-500">Creates fresh unclaimed provider</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-900 text-white text-sm flex items-center justify-center font-medium">
                2
              </span>
              <div>
                <p className="font-medium text-gray-900">Visit the claim page</p>
                <p className="text-sm text-gray-500">
                  <Link
                    href={`/provider/${state?.demoSlug || "sunrise-care-demo"}/onboard`}
                    className="text-primary-600 hover:underline"
                  >
                    /provider/{state?.demoSlug || "sunrise-care-demo"}/onboard
                  </Link>
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-900 text-white text-sm flex items-center justify-center font-medium">
                3
              </span>
              <div>
                <p className="font-medium text-gray-900">Claim with your email</p>
                <p className="text-sm text-gray-500">
                  Use: <code className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-800">{state?.profile?.email || customEmail || "you+suspicious@gmail.com"}</code>
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500 text-white text-sm flex items-center justify-center font-medium">
                4
              </span>
              <div>
                <p className="font-medium text-gray-900">See restricted dashboard</p>
                <p className="text-sm text-gray-500">Banner + locked inbox state</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500 text-white text-sm flex items-center justify-center font-medium">
                5
              </span>
              <div>
                <p className="font-medium text-gray-900">Complete verification form</p>
                <p className="text-sm text-gray-500">Modal is mandatory, can&apos;t dismiss</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 text-white text-sm flex items-center justify-center font-medium">
                6
              </span>
              <div>
                <p className="font-medium text-gray-900">Simulate admin approval</p>
                <p className="text-sm text-gray-500">Use button above or come back here</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 text-white text-sm flex items-center justify-center font-medium">
                7
              </span>
              <div>
                <p className="font-medium text-gray-900">Refresh dashboard</p>
                <p className="text-sm text-gray-500">Full access unlocked!</p>
              </div>
            </li>
          </ol>
        </div>

        {/* Quick Links */}
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/provider/${state?.demoSlug || "sunrise-care-demo"}`}
            className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors"
          >
            View Public Listing →
          </Link>
          <Link
            href={`/provider/${state?.demoSlug || "sunrise-care-demo"}/onboard`}
            className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors"
          >
            Claim Page →
          </Link>
          {state?.profile?.account_id && (
            <Link
              href="/provider"
              className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors"
            >
              Provider Dashboard →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
