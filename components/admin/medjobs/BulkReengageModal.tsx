"use client";

/**
 * BulkReengageModal — bulk re-engagement launcher for Follow-up tab.
 *
 * Shows:
 *   - Header with prospect count
 *   - Summary of valid/invalid rows
 *   - Prospects list (scrollable)
 *   - Email/call preview by day
 *   - Launch button
 *
 * Uses the /api/admin/student-outreach/bulk-reengage endpoint:
 *   - dry_run=true for preview
 *   - dry_run=false for execution
 */

import { useEffect, useState } from "react";

interface ProspectPreview {
  id: string;
  organization_name: string;
  campus_name: string;
  email: string | null;
  first_name: string | null;
  valid: boolean;
  skip_reason: string | null;
}

interface EmailPreview {
  day_0: { subject: string; body: string };
  day_3_call: { script: string };
  day_7: { subject: string; body: string };
}

interface Props {
  outreachIds: string[];
  onClose: () => void;
  onSuccess: () => Promise<void> | void;
}

export function BulkReengageModal({ outreachIds, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(true);
  const [launching, setLaunching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewTab, setPreviewTab] = useState<"day_0" | "day_3" | "day_7">("day_0");

  // Preview data
  const [prospects, setProspects] = useState<ProspectPreview[]>([]);
  const [emails, setEmails] = useState<EmailPreview | null>(null);
  const [validCount, setValidCount] = useState(0);
  const [invalidCount, setInvalidCount] = useState(0);

  // Fetch preview on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/student-outreach/bulk-reengage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ outreach_ids: outreachIds, dry_run: true }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError(data.error ?? "Failed to load preview");
          return;
        }
        setProspects(data.prospects ?? []);
        setEmails(data.emails ?? null);
        setValidCount(data.valid ?? 0);
        setInvalidCount(data.invalid ?? 0);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load preview");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [outreachIds]);

  // Launch re-engagement
  const handleLaunch = async () => {
    if (validCount === 0) return;
    setLaunching(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/student-outreach/bulk-reengage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outreach_ids: outreachIds, dry_run: false }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Launch failed");
        return;
      }
      await onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Launch failed");
    } finally {
      setLaunching(false);
    }
  };

  // Escape to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !launching) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, launching]);

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const validProspects = prospects.filter((p) => p.valid);
  const invalidProspects = prospects.filter((p) => !p.valid);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <header className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              Launch Re-engagement Sequence
            </h3>
            <p className="mt-0.5 text-xs text-gray-500">
              {outreachIds.length} prospect{outreachIds.length === 1 ? "" : "s"} selected
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={launching}
            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 disabled:opacity-50"
            aria-label="Close"
          >
            <span aria-hidden>×</span>
          </button>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-primary-600" />
            </div>
          ) : error ? (
            <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          ) : (
            <div className="space-y-6">
              {/* Summary */}
              <div className="flex items-center gap-4 rounded-lg bg-gray-50 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-primary-600">{validCount}</span>
                  <span className="text-sm text-gray-600">valid</span>
                </div>
                {invalidCount > 0 && (
                  <>
                    <span className="text-gray-300">|</span>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-gray-400">{invalidCount}</span>
                      <span className="text-sm text-gray-500">skipped</span>
                    </div>
                  </>
                )}
              </div>

              {/* Prospects list */}
              {validProspects.length > 0 && (
                <div>
                  <h4 className="mb-2 text-sm font-medium text-gray-900">
                    Will be re-engaged ({validProspects.length})
                  </h4>
                  <div className="max-h-40 overflow-y-auto rounded-lg border border-gray-200">
                    <ul className="divide-y divide-gray-100">
                      {validProspects.map((p) => (
                        <li key={p.id} className="flex items-center justify-between px-3 py-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-gray-900">
                              {p.organization_name}
                            </p>
                            <p className="truncate text-xs text-gray-500">{p.campus_name}</p>
                          </div>
                          <span className="ml-2 shrink-0 text-xs text-gray-400">
                            {p.email ?? "no email"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {invalidProspects.length > 0 && (
                <div>
                  <h4 className="mb-2 text-sm font-medium text-gray-500">
                    Will be skipped ({invalidProspects.length})
                  </h4>
                  <div className="max-h-32 overflow-y-auto rounded-lg border border-gray-100 bg-gray-50">
                    <ul className="divide-y divide-gray-100">
                      {invalidProspects.map((p) => (
                        <li key={p.id} className="flex items-center justify-between px-3 py-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm text-gray-600">
                              {p.organization_name}
                            </p>
                          </div>
                          <span className="ml-2 shrink-0 text-xs text-red-500">
                            {p.skip_reason?.replace(/_/g, " ") ?? "invalid"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Email/Call Preview */}
              {emails && (
                <div>
                  <h4 className="mb-2 text-sm font-medium text-gray-900">Sequence Preview</h4>
                  <div className="rounded-lg border border-gray-200">
                    {/* Day tabs */}
                    <div className="flex border-b border-gray-200">
                      {[
                        { key: "day_0", label: "Day 0 · Email" },
                        { key: "day_3", label: "Day 3 · Call" },
                        { key: "day_7", label: "Day 7 · Email" },
                      ].map((t) => (
                        <button
                          key={t.key}
                          onClick={() => setPreviewTab(t.key as typeof previewTab)}
                          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                            previewTab === t.key
                              ? "border-b-2 border-primary-600 text-primary-600"
                              : "text-gray-500 hover:text-gray-700"
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                    {/* Preview content */}
                    <div className="p-4">
                      {previewTab === "day_0" && (
                        <div className="space-y-2">
                          <p className="text-sm">
                            <span className="font-medium text-gray-600">Subject:</span>{" "}
                            <span className="text-gray-900">{emails.day_0.subject}</span>
                          </p>
                          <div className="rounded-md bg-gray-50 p-3 text-sm text-gray-700 whitespace-pre-wrap">
                            {emails.day_0.body}
                          </div>
                        </div>
                      )}
                      {previewTab === "day_3" && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-600">Call Script:</p>
                          <div className="rounded-md bg-gray-50 p-3 text-sm text-gray-700 whitespace-pre-wrap">
                            {emails.day_3_call.script}
                          </div>
                        </div>
                      )}
                      {previewTab === "day_7" && (
                        <div className="space-y-2">
                          <p className="text-sm">
                            <span className="font-medium text-gray-600">Subject:</span>{" "}
                            <span className="text-gray-900">{emails.day_7.subject}</span>
                          </p>
                          <div className="rounded-md bg-gray-50 p-3 text-sm text-gray-700 whitespace-pre-wrap">
                            {emails.day_7.body}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-between gap-2 border-t border-gray-100 bg-gray-50 px-6 py-3">
          <p className="text-xs text-gray-500">
            {validCount > 0
              ? `${validCount} email${validCount === 1 ? "" : "s"} + ${validCount} call${validCount === 1 ? "" : "s"} will be scheduled`
              : "No valid prospects to re-engage"}
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              disabled={launching}
              className="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleLaunch}
              disabled={launching || validCount === 0 || loading}
              className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {launching ? "Launching…" : `Launch Re-engagement (${validCount})`}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
