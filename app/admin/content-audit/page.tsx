"use client";

import { useState, useCallback } from "react";
import Badge from "@/components/ui/Badge";

type AuditStatus = "accurate" | "needs_review" | "likely_outdated";
type ContentType = "article" | "federal_program" | "state_program" | "page";
type Severity = "high" | "medium" | "low";

interface AuditIssue {
  flag: string;
  reason: string;
  severity: Severity;
  suggestion: string;
  source: string;
  source_url: string;
}

interface AuditResult {
  id: string;
  title: string;
  type: ContentType;
  slug?: string;
  status: AuditStatus;
  issues: (AuditIssue | string)[];
  summary: string;
  audited_at: string;
}

interface AuditSummary {
  accurate: number;
  needs_review: number;
  likely_outdated: number;
}

// Tracks which issues have been marked as fixed
// Key: `${resultId}-${issueIndex}`
type FixedMap = Record<string, boolean>;

// Tracks audit history per URL/page
interface AuditHistoryEntry {
  url: string;
  title: string;
  status: AuditStatus;
  issueCount: number;
  audited_at: string;
}

const statusVariant: Record<AuditStatus, "verified" | "pending" | "rejected"> = {
  accurate: "verified",
  needs_review: "pending",
  likely_outdated: "rejected",
};

const statusLabel: Record<AuditStatus, string> = {
  accurate: "Accurate",
  needs_review: "Needs Review",
  likely_outdated: "Likely Outdated",
};

const typeLabel: Record<ContentType, string> = {
  article: "Article",
  federal_program: "Federal Program",
  state_program: "State Program",
  page: "Page",
};

const severityConfig: Record<Severity, { label: string; color: string; bg: string; border: string }> = {
  high: { label: "High", color: "text-red-700", bg: "bg-red-50", border: "border-red-200" },
  medium: { label: "Medium", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
  low: { label: "Low", color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" },
};

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// Persist audit history in localStorage
function loadHistory(): AuditHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("content-audit-history") || "[]");
  } catch {
    return [];
  }
}

function saveHistory(history: AuditHistoryEntry[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem("content-audit-history", JSON.stringify(history));
}

export default function ContentAuditPage() {
  const [results, setResults] = useState<AuditResult[]>([]);
  const [summary, setSummary] = useState<AuditSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pageUrl, setPageUrl] = useState("");
  const [fixedIssues, setFixedIssues] = useState<FixedMap>({});
  const [auditHistory, setAuditHistory] = useState<AuditHistoryEntry[]>(loadHistory);
  const [showHistory, setShowHistory] = useState(false);

  const toggleFixed = useCallback((resultId: string, issueIndex: number) => {
    const key = `${resultId}-${issueIndex}`;
    setFixedIssues((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  async function runAudit(url?: string) {
    setLoading(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {};
      if (url) payload.url = url;

      const res = await fetch("/api/admin/content-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        const newResults: AuditResult[] = data.results ?? [];
        setResults(newResults);
        setSummary(data.summary ?? null);
        setFixedIssues({});
        setExpandedId(null);

        // Save to audit history
        const now = new Date().toISOString();
        const newEntries: AuditHistoryEntry[] = newResults.map((r) => ({
          url: url || r.slug || r.id,
          title: r.title,
          status: r.status,
          issueCount: r.issues.length,
          audited_at: now,
        }));
        const updated = [...newEntries, ...auditHistory].slice(0, 50);
        setAuditHistory(updated);
        saveHistory(updated);
      } else {
        const errData = await res.json().catch(() => ({}));
        setError(errData.error || `API error ${res.status}`);
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  // Count fixed vs total for progress
  const totalIssues = results.reduce((acc, r) => acc + r.issues.length, 0);
  const fixedCount = Object.values(fixedIssues).filter(Boolean).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Content Audit</h1>
          <p className="text-lg text-gray-600 mt-1">
            {summary
              ? `${results.length} item${results.length !== 1 ? "s" : ""} audited`
              : "Audit content for accuracy and outdated information"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="px-4 py-2.5 bg-white border border-gray-300 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Audit History
          </button>
          <button
            onClick={() => runAudit()}
            disabled={loading}
            className="px-4 py-2.5 bg-gray-100 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
          >
            Audit All
          </button>
        </div>
      </div>

      {/* Accuracy Score */}
      {summary && results.length > 0 && (() => {
        // Score: accurate=100, needs_review=50, likely_outdated=0
        const score = results.length > 0
          ? Math.round(
              results.reduce((acc, r) => acc + (r.status === "accurate" ? 100 : r.status === "needs_review" ? 50 : 0), 0) / results.length
            )
          : 0;
        const color = score >= 80 ? "text-green-600" : score >= 50 ? "text-amber-600" : "text-red-600";
        const bg = score >= 80 ? "bg-green-50 border-green-200" : score >= 50 ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200";
        const ring = score >= 80 ? "stroke-green-500" : score >= 50 ? "stroke-amber-500" : "stroke-red-500";
        return (
          <div className={`rounded-xl border p-5 mb-6 flex items-center gap-5 ${bg}`}>
            <div className="relative w-16 h-16 flex-shrink-0">
              <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15.5" fill="none"
                  className={ring}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${score * 0.974} 100`}
                />
              </svg>
              <span className={`absolute inset-0 flex items-center justify-center text-lg font-bold ${color}`}>
                {score}%
              </span>
            </div>
            <div>
              <p className={`text-xl font-bold ${color}`}>
                {score >= 80 ? "Good" : score >= 50 ? "Needs Attention" : "Critical Issues"}
              </p>
              <p className="text-sm text-gray-600 mt-0.5">
                Content accuracy score based on {results.length} audited page{results.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        );
      })()}

      {/* URL input for single page audit */}
      <div className="mb-6">
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Paste a page URL to audit (e.g. https://olera.care/texas/medicaid)"
            value={pageUrl}
            onChange={(e) => setPageUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && pageUrl.trim()) runAudit(pageUrl.trim());
            }}
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          />
          <button
            onClick={() => pageUrl.trim() && runAudit(pageUrl.trim())}
            disabled={loading || !pageUrl.trim()}
            className="px-4 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors inline-flex items-center gap-2 whitespace-nowrap"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Auditing...
              </>
            ) : (
              "Audit Page"
            )}
          </button>
        </div>
      </div>

      {/* Audit History Panel */}
      {showHistory && (
        <div className="bg-white rounded-xl border border-gray-200 mb-6 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Audit History</h3>
            {auditHistory.length > 0 && (
              <button
                onClick={() => {
                  setAuditHistory([]);
                  saveHistory([]);
                }}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors"
              >
                Clear History
              </button>
            )}
          </div>
          {auditHistory.length === 0 ? (
            <p className="px-6 py-4 text-sm text-gray-400">No pages audited yet.</p>
          ) : (
            <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
              {auditHistory.map((entry, i) => (
                <div key={i} className="px-6 py-3 flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{entry.title}</p>
                    <p className="text-xs text-gray-400 truncate">{entry.url}</p>
                  </div>
                  <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                    <Badge variant={statusVariant[entry.status]}>
                      {statusLabel[entry.status]}
                    </Badge>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {entry.issueCount} issue{entry.issueCount !== 1 ? "s" : ""}
                    </span>
                    <span className="text-xs text-gray-300 whitespace-nowrap">
                      {formatDate(entry.audited_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Summary Cards */}
      {summary && (() => {
        const highCount = results.reduce((acc, r) => acc + r.issues.filter((i) => typeof i !== "string" && i.severity === "high").length, 0);
        const medCount = results.reduce((acc, r) => acc + r.issues.filter((i) => typeof i !== "string" && i.severity === "medium").length, 0);
        const lowCount = results.reduce((acc, r) => acc + r.issues.filter((i) => typeof i !== "string" && i.severity === "low").length, 0);
        const strCount = results.reduce((acc, r) => acc + r.issues.filter((i) => typeof i === "string").length, 0);
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            <div className="p-5 rounded-xl border bg-white border-gray-200">
              <p className="text-sm text-gray-500 mb-1">Total Issues</p>
              <p className="text-3xl font-bold text-gray-900">{totalIssues}</p>
              <p className="text-sm text-gray-500 mt-1">{results.length} page{results.length !== 1 ? "s" : ""} scanned</p>
            </div>
            <div className="p-5 rounded-xl border bg-white border-gray-200">
              <p className="text-sm text-gray-500 mb-1">High Severity</p>
              <p className="text-3xl font-bold text-red-600">{highCount}</p>
              <p className="text-sm text-gray-500 mt-1">{medCount} medium, {lowCount + strCount} low</p>
            </div>
            <div className="p-5 rounded-xl border bg-white border-gray-200">
              <p className="text-sm text-gray-500 mb-1">Pages Status</p>
              <p className="text-3xl font-bold text-gray-900">{summary.accurate + summary.needs_review + summary.likely_outdated}</p>
              <p className="text-sm text-gray-500 mt-1">
                <span className="text-green-600">{summary.accurate} clean</span>
                {summary.needs_review > 0 && <>, <span className="text-amber-600">{summary.needs_review} review</span></>}
                {summary.likely_outdated > 0 && <>, <span className="text-red-600">{summary.likely_outdated} outdated</span></>}
              </p>
            </div>
            <div className="p-5 rounded-xl border bg-white border-gray-200">
              <p className="text-sm text-gray-500 mb-1">Fix Progress</p>
              <p className="text-3xl font-bold text-gray-900">
                {fixedCount}/{totalIssues}
              </p>
              <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-600 rounded-full transition-all duration-300"
                  style={{ width: totalIssues > 0 ? `${(fixedCount / totalIssues) * 100}%` : "0%" }}
                />
              </div>
            </div>
          </div>
        );
      })()}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <svg className="animate-spin h-8 w-8 text-primary-600 mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-lg text-gray-500">Auditing content with Claude...</p>
          <p className="text-sm text-gray-400 mt-1">This may take a minute depending on how much content there is.</p>
        </div>
      ) : results.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-gray-500 mb-1">No audit results yet.</p>
          <p className="text-sm text-gray-400">
            Paste a URL above and click &ldquo;Audit Page&rdquo; to check a specific page, or click &ldquo;Audit All&rdquo; to scan everything.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {results.map((result) => {
            const isExpanded = expandedId === result.id;
            return (
              <div key={result.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* Row header */}
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : result.id)}
                  className="w-full px-6 py-4 flex items-center justify-between gap-4 text-left hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{result.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {result.slug && (
                          <p className="text-xs text-gray-400 truncate">{result.slug}</p>
                        )}
                        <span className="text-xs text-gray-300">
                          {typeLabel[result.type]}
                        </span>
                        <span className="text-xs text-gray-300">
                          {formatDate(result.audited_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <Badge variant={statusVariant[result.status]}>
                      {statusLabel[result.status]}
                    </Badge>
                    {result.issues.length > 0 && (
                      <span className="text-sm text-amber-600 font-medium">
                        {result.issues.length} issue{result.issues.length !== 1 ? "s" : ""}
                      </span>
                    )}
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className={`text-gray-400 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </div>
                </button>

                {/* Expanded issues */}
                {isExpanded && (
                  <div className="border-t border-gray-200 bg-gray-50 px-6 py-5">
                    <p className="text-sm text-gray-600 mb-4">{result.summary}</p>

                    {result.issues.length > 0 && (
                      <div className="space-y-3">
                        {result.issues.map((issue, i) => {
                          const issueKey = `${result.id}-${i}`;
                          const isFixed = fixedIssues[issueKey] ?? false;

                          // Handle old string format
                          if (typeof issue === "string") {
                            return (
                              <div key={i} className={`rounded-lg border p-4 ${isFixed ? "bg-green-50 border-green-200 opacity-60" : "bg-white border-gray-200"}`}>
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex items-start gap-2">
                                    <span className="text-amber-500 mt-0.5 flex-shrink-0">&#9888;</span>
                                    <p className="text-sm text-gray-700">{issue}</p>
                                  </div>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); toggleFixed(result.id, i); }}
                                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors flex-shrink-0 ${
                                      isFixed
                                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    }`}
                                  >
                                    {isFixed ? "Fixed" : "Mark Fixed"}
                                  </button>
                                </div>
                              </div>
                            );
                          }

                          const sev = severityConfig[issue.severity] || severityConfig.medium;

                          return (
                            <div key={i} className={`rounded-lg border p-4 ${isFixed ? "bg-green-50 border-green-200 opacity-60" : "bg-white border-gray-200"}`}>
                              <div className="flex items-start justify-between gap-3 mb-2">
                                <div className="flex items-start gap-2 min-w-0">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-0.5 flex-shrink-0 ${sev.bg} ${sev.color} border ${sev.border}`}>
                                    {sev.label}
                                  </span>
                                  <p className="text-sm font-medium text-gray-900">{issue.flag}</p>
                                </div>
                                <button
                                  onClick={(e) => { e.stopPropagation(); toggleFixed(result.id, i); }}
                                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors flex-shrink-0 ${
                                    isFixed
                                      ? "bg-green-100 text-green-700 hover:bg-green-200"
                                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                  }`}
                                >
                                  {isFixed ? "Fixed" : "Mark Fixed"}
                                </button>
                              </div>

                              <p className="text-sm text-gray-600 ml-[52px] mb-2">{issue.reason}</p>

                              {/* Suggestion */}
                              {issue.suggestion && (
                                <div className="ml-[52px] mb-2 bg-primary-25 border border-primary-100 rounded-lg px-3 py-2">
                                  <p className="text-xs font-medium text-primary-700 mb-0.5">Suggested fix:</p>
                                  <p className="text-sm text-gray-700">{issue.suggestion}</p>
                                </div>
                              )}

                              {/* Source link */}
                              <div className="ml-[52px] flex items-center gap-2 text-xs">
                                <span className="text-gray-400">Verify at:</span>
                                <a
                                  href={issue.source_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-primary-600 hover:text-primary-700 underline font-medium"
                                >
                                  {issue.source}
                                </a>
                                <span className="text-gray-300">&#8599;</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {result.issues.length === 0 && (
                      <p className="text-sm text-green-600 flex items-center gap-2">
                        <span>&#10003;</span> No issues found — content appears accurate and up to date.
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
