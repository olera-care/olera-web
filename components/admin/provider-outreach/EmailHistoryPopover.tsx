"use client";

import { useState, useRef, useEffect } from "react";

interface EmailHistoryEntry {
  email: string;
  source: "organization" | "decision_maker";
  changed_at: string;
  changed_by: string | null;
  change_type: "apollo_confirm" | "manual_edit" | "initial";
}

interface EmailHistoryPopoverProps {
  providerId: string;
  currentEmail: string | null;
}

export function EmailHistoryPopover({ providerId, currentEmail }: EmailHistoryPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<EmailHistoryEntry[]>([]);
  const [currentSource, setCurrentSource] = useState<"organization" | "decision_maker">("organization");
  const [error, setError] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  async function fetchHistory() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/provider-outreach/email-history?provider_id=${providerId}`);
      if (!res.ok) {
        throw new Error("Failed to fetch history");
      }
      const data = await res.json();
      setHistory(data.history || []);
      setCurrentSource(data.current_source || "organization");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load history");
    } finally {
      setLoading(false);
    }
  }

  function handleToggle(e: React.MouseEvent) {
    e.stopPropagation();
    if (!isOpen) {
      fetchHistory();
    }
    setIsOpen(!isOpen);
  }

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function formatAdminName(email: string | null): string {
    if (!email) return "System";
    // Extract name from email like "cchavez.olera@gmail.com" -> "cchavez.olera"
    const localPart = email.split("@")[0];
    return localPart || email;
  }

  // Don't show if no email
  if (!currentEmail) return null;

  return (
    <div className="relative inline-flex">
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className="p-0.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition"
        title="View email history"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          ref={popoverRef}
          className="absolute left-0 top-full mt-1 z-50 w-80 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
            <h4 className="text-sm font-medium text-gray-900">Email History</h4>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {loading ? (
              <div className="px-3 py-4 text-center">
                <div className="w-5 h-5 mx-auto border-2 border-gray-300 border-t-teal-500 rounded-full animate-spin" />
                <p className="mt-2 text-xs text-gray-500">Loading history...</p>
              </div>
            ) : error ? (
              <div className="px-3 py-4 text-center">
                <p className="text-sm text-amber-600">{error}</p>
              </div>
            ) : history.length === 0 ? (
              <div className="px-3 py-4">
                {/* Current email (no history) */}
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 w-5 h-5 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{currentEmail}</p>
                    <p className="text-xs text-gray-500">
                      {currentSource === "decision_maker" ? "Decision Maker" : "Organization"}
                      {" · "}
                      <span className="text-teal-600">Current</span>
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-xs text-gray-400 text-center">No previous emails on record</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {/* Current email */}
                <div className="px-3 py-2.5 flex items-start gap-2 bg-teal-50/50">
                  <div className="mt-0.5 w-5 h-5 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{currentEmail}</p>
                    <p className="text-xs text-gray-500">
                      {currentSource === "decision_maker" ? "Decision Maker" : "Organization"}
                      {" · "}
                      <span className="text-teal-600 font-medium">Current</span>
                    </p>
                  </div>
                </div>

                {/* History entries - these are previous emails (what email WAS before each change) */}
                {history.map((entry, index) => (
                  <div key={`${entry.changed_at}-${index}`} className="px-3 py-2.5 flex items-start gap-2">
                    <div className="mt-0.5 w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 truncate">{entry.email}</p>
                      <p className="text-xs text-gray-400">
                        {entry.source === "decision_maker" ? "Decision Maker" : "Organization"}
                        {" · "}
                        {formatDate(entry.changed_at)}
                        {" · "}
                        {formatAdminName(entry.changed_by)}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
