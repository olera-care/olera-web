"use client";

import { useEffect, useState, useCallback } from "react";

type Verdict = {
  email: string;
  status: "valid" | "invalid" | "risky" | "unknown";
  subStatus: string | null;
  checkedAt: string | null;
  fromCache: boolean;
};

const STATUS_STYLE: Record<string, string> = {
  valid: "bg-green-50 text-green-700 border-green-200",
  invalid: "bg-red-50 text-red-700 border-red-200",
  risky: "bg-amber-50 text-amber-700 border-amber-200",
  unknown: "bg-gray-50 text-gray-500 border-gray-200",
};

const STATUS_LABEL: Record<string, string> = {
  valid: "Valid",
  invalid: "Invalid",
  risky: "Risky",
  unknown: "Unknown",
};

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function parseEmails(input: string): string[] {
  return input.split(/[\s,;]+/).map((e) => e.trim()).filter(Boolean);
}

export default function EmailVerifierPage() {
  const [input, setInput] = useState("");
  const [results, setResults] = useState<Verdict[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [credits, setCredits] = useState<number | null>(null);

  const loadCredits = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/verify-email");
      if (res.ok) {
        const d = await res.json();
        setCredits(typeof d.credits === "number" ? d.credits : null);
      }
    } catch {
      /* ignore — credits are informational */
    }
  }, []);

  useEffect(() => {
    loadCredits();
  }, [loadCredits]);

  async function handleCheck() {
    const emails = parseEmails(input);
    if (emails.length === 0) {
      setError("Enter at least one email address.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Verification failed.");
      } else {
        setResults(data.results || []);
        if (typeof data.credits === "number") setCredits(data.credits);
      }
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  const count = parseEmails(input).length;

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="flex items-start justify-between mb-1">
        <h1 className="text-xl font-semibold text-gray-900">Email Verifier</h1>
        <div className="text-xs text-gray-400 mt-1">
          {credits === null ? (
            "credits —"
          ) : (
            <>
              <span className={credits < 200 ? "text-red-600 font-medium" : "text-gray-700 font-medium"}>
                {credits.toLocaleString()}
              </span>{" "}
              ZeroBounce credits left
            </>
          )}
        </div>
      </div>
      <p className="text-sm text-gray-500 mb-5">
        Check whether an email address is deliverable before using it. Results are cached for 90 days,
        so re-checking the same address is free.
      </p>

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="provider@example.com — paste one or several (comma, space, or newline separated)"
        rows={4}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 resize-y"
        disabled={loading}
      />
      <div className="flex items-center gap-3 mt-2">
        <button
          onClick={handleCheck}
          disabled={loading || count === 0}
          className="px-4 py-1.5 rounded-lg text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 transition-colors disabled:opacity-50"
        >
          {loading ? "Checking…" : count > 1 ? `Check ${count} addresses` : "Check"}
        </button>
        {count > 25 && <span className="text-xs text-red-600">Max 25 at a time.</span>}
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>

      {results.length > 0 && (
        <div className="mt-6 border border-gray-100 rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-400 text-xs">
              <tr>
                <th className="text-left font-medium px-4 py-2">Email</th>
                <th className="text-left font-medium px-4 py-2">Result</th>
                <th className="text-left font-medium px-4 py-2">Reason</th>
                <th className="text-left font-medium px-4 py-2">Checked</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.email} className="border-t border-gray-50">
                  <td className="px-4 py-2.5 text-gray-900 break-all">{r.email}</td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded border ${STATUS_STYLE[r.status]}`}>
                      {STATUS_LABEL[r.status]}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-gray-400 text-xs">{r.subStatus || "—"}</td>
                  <td className="px-4 py-2.5 text-gray-400 text-xs">
                    {fmtDate(r.checkedAt)}
                    {r.fromCache && <span className="ml-1 text-gray-300">(cached)</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 text-xs text-gray-400 leading-relaxed">
        <span className="font-medium text-green-700">Valid</span> = deliverable.{" "}
        <span className="font-medium text-red-700">Invalid</span> = will bounce, don&apos;t use it.{" "}
        <span className="font-medium text-amber-700">Risky</span> = catch-all domain, usually deliverable.{" "}
        <span className="font-medium text-gray-500">Unknown</span> = couldn&apos;t check, try again.
      </p>
    </div>
  );
}
