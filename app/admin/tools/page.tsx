"use client";

import { useState } from "react";

interface BackfillStats {
  total_profiles_without_email: number;
  profiles_with_olera_email: number;
  processed: number;
  synced: number;
  lead_notifications_sent: number;
  question_notifications_sent: number;
  errors: number;
  dry_run: boolean;
}

interface BackfillResult {
  profileId: string;
  providerName: string;
  email: string;
  leadsSent: number;
  questionsSent: number;
  error?: string;
}

interface BackfillResponse {
  success: boolean;
  stats: BackfillStats;
  results: BackfillResult[];
  error?: string;
}

export default function AdminToolsPage() {
  const [previewData, setPreviewData] = useState<BackfillResponse | null>(null);
  const [runData, setRunData] = useState<BackfillResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"idle" | "previewing" | "previewed" | "running" | "done">("idle");

  async function runPreview() {
    setLoading(true);
    setError(null);
    setStep("previewing");
    try {
      const res = await fetch("/api/admin/backfill-provider-emails?dry_run=true", {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setPreviewData(data);
        setStep("previewed");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to run preview");
        setStep("idle");
      }
    } catch {
      setError("Network error");
      setStep("idle");
    } finally {
      setLoading(false);
    }
  }

  async function runBackfill() {
    setLoading(true);
    setError(null);
    setStep("running");
    try {
      const res = await fetch("/api/admin/backfill-provider-emails", {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setRunData(data);
        setStep("done");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to run backfill");
        setStep("previewed");
      }
    } catch {
      setError("Network error");
      setStep("previewed");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setPreviewData(null);
    setRunData(null);
    setError(null);
    setStep("idle");
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Admin Tools</h1>
        <p className="mt-1 text-sm text-gray-500">One-time operations and maintenance tasks</p>
      </div>

      {/* Backfill Provider Emails Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-2xl">
        <h2 className="text-lg font-medium text-gray-900">Backfill Provider Emails</h2>
        <p className="mt-2 text-sm text-gray-600">
          Sync emails from legacy provider records to business profiles, then send pending lead and question notifications to those providers.
        </p>

        {error && (
          <div className="mt-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Idle state - show preview button */}
        {step === "idle" && (
          <div className="mt-6">
            <button
              onClick={runPreview}
              disabled={loading}
              className="px-4 py-2.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {loading ? "Loading..." : "Preview Changes"}
            </button>
            <p className="mt-2 text-xs text-gray-400">
              This will show what would happen without making any changes.
            </p>
          </div>
        )}

        {/* Previewing state */}
        {step === "previewing" && (
          <div className="mt-6 flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin" />
            <span className="text-sm text-gray-600">Running preview...</span>
          </div>
        )}

        {/* Preview results */}
        {step === "previewed" && previewData && (
          <div className="mt-6 space-y-4">
            <div className="px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-medium text-blue-900">Preview Results (No changes made)</p>
              <div className="mt-2 text-sm text-blue-800 space-y-1">
                <p>Providers without email in business_profiles: <strong>{previewData.stats.total_profiles_without_email}</strong></p>
                <p>Providers with email in legacy records: <strong>{previewData.stats.profiles_with_olera_email}</strong></p>
              </div>
            </div>

            {previewData.stats.profiles_with_olera_email === 0 ? (
              <div className="px-4 py-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">No providers need backfill. All emails are already synced.</p>
              </div>
            ) : (
              <>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Providers to sync ({previewData.results.length})
                    </p>
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
                    {previewData.results.map((r) => (
                      <div key={r.profileId} className="px-4 py-2.5 text-sm">
                        <p className="font-medium text-gray-900">{r.providerName}</p>
                        <p className="text-gray-500">{r.email}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={runBackfill}
                    disabled={loading}
                    className="px-4 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? "Running..." : "Confirm & Send Notifications"}
                  </button>
                  <button
                    onClick={reset}
                    disabled={loading}
                    className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
                <p className="text-xs text-gray-400">
                  This will sync emails and send notifications to providers with pending leads/questions.
                </p>
              </>
            )}
          </div>
        )}

        {/* Running state */}
        {step === "running" && (
          <div className="mt-6 flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-gray-200 border-t-primary-500 rounded-full animate-spin" />
            <span className="text-sm text-gray-600">Syncing emails and sending notifications...</span>
          </div>
        )}

        {/* Done state */}
        {step === "done" && runData && (
          <div className="mt-6 space-y-4">
            <div className="px-4 py-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-medium text-green-900">Backfill Complete</p>
              <div className="mt-2 text-sm text-green-800 space-y-1">
                <p>Providers synced: <strong>{runData.stats.synced}</strong></p>
                <p>Lead notifications sent: <strong>{runData.stats.lead_notifications_sent}</strong></p>
                <p>Question notifications sent: <strong>{runData.stats.question_notifications_sent}</strong></p>
                {runData.stats.errors > 0 && (
                  <p className="text-amber-700">Errors: <strong>{runData.stats.errors}</strong></p>
                )}
              </div>
            </div>

            {runData.results.length > 0 && (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Results (first 20)
                  </p>
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
                  {runData.results.map((r) => (
                    <div key={r.profileId} className="px-4 py-2.5 text-sm">
                      <p className="font-medium text-gray-900">{r.providerName}</p>
                      <p className="text-gray-500">
                        {r.email} &middot; {r.leadsSent} leads, {r.questionsSent} questions sent
                        {r.error && <span className="text-red-600 ml-2">Error: {r.error}</span>}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={reset}
              className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
