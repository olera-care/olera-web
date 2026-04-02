"use client";

import { useState, useEffect, useCallback } from "react";

interface Reference {
  id: string;
  referee_name: string | null;
  referee_title: string | null;
  referee_organization: string | null;
  referee_email: string;
  relationship: string;
  recommendation: string | null;
  token: string;
  status: "requested" | "completed";
  created_at: string;
}

const RELATIONSHIP_LABELS: Record<string, string> = {
  professor: "Professor",
  employer: "Employer",
  supervisor: "Supervisor",
  colleague: "Colleague",
  other: "Other",
};

export default function ReferencesSection({ profileId }: { profileId: string }) {
  const [references, setReferences] = useState<Reference[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState("");
  const [relationship, setRelationship] = useState("professor");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchRefs = useCallback(async () => {
    try {
      const res = await fetch(`/api/medjobs/references?studentProfileId=${profileId}`);
      const data = await res.json();
      if (res.ok) setReferences(data.references || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [profileId]);

  useEffect(() => { fetchRefs(); }, [fetchRefs]);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/medjobs/references", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refereeEmail: email, relationship }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to create request"); return; }
      setEmail("");
      setShowForm(false);
      fetchRefs();
    } catch { setError("Network error"); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (referenceId: string) => {
    try {
      const res = await fetch("/api/medjobs/references", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referenceId }),
      });
      if (res.ok) fetchRefs();
    } catch { /* ignore */ }
  };

  const copyLink = (token: string, id: string) => {
    const url = `${window.location.origin}/medjobs/reference/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) return null;

  return (
    <div className="mt-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">References</h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
          >
            + Request
          </button>
        )}
      </div>

      {/* Request form */}
      {showForm && (
        <form onSubmit={handleRequest} className="p-4 rounded-xl border border-gray-200 mb-4">
          <p className="text-sm text-gray-500 mb-3">
            Enter your referee&apos;s email and we&apos;ll generate a link for them to write a recommendation.
          </p>
          <div className="space-y-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="referee@example.com"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none"
            />
            <select
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none bg-white"
            >
              <option value="professor">Professor</option>
              <option value="employer">Employer</option>
              <option value="supervisor">Supervisor</option>
              <option value="colleague">Colleague</option>
              <option value="other">Other</option>
            </select>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-gray-900 hover:bg-gray-800 disabled:opacity-40 rounded-lg text-sm font-medium text-white transition-colors"
              >
                {submitting ? "Sending..." : "Generate Link"}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setError(""); }}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {/* References list */}
      {references.length === 0 && !showForm ? (
        <p className="text-sm text-gray-400">No references yet. Request one from a professor, employer, or supervisor.</p>
      ) : (
        <div className="space-y-3">
          {references.map((ref) => (
            <div key={ref.id} className="p-4 rounded-xl border border-gray-100 bg-white">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  {ref.status === "completed" ? (
                    <>
                      <p className="text-sm font-medium text-gray-900">{ref.referee_name}</p>
                      <p className="text-xs text-gray-500">
                        {ref.referee_title && ref.referee_organization
                          ? `${ref.referee_title}, ${ref.referee_organization}`
                          : ref.referee_title || ref.referee_organization || ""}
                        {" · "}{RELATIONSHIP_LABELS[ref.relationship] || ref.relationship}
                      </p>
                      {ref.recommendation && (
                        <p className="mt-2 text-sm text-gray-600 leading-relaxed">&ldquo;{ref.recommendation}&rdquo;</p>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-gray-600">{ref.referee_email}</p>
                      <p className="text-xs text-gray-400">
                        {RELATIONSHIP_LABELS[ref.relationship] || ref.relationship} · Pending
                      </p>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {ref.status === "requested" && (
                    <>
                      <button
                        onClick={() => copyLink(ref.token, ref.id)}
                        className="px-2.5 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg transition-colors"
                      >
                        {copiedId === ref.id ? "Copied!" : "Copy Link"}
                      </button>
                      <button
                        onClick={() => handleDelete(ref.id)}
                        className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                      >
                        Remove
                      </button>
                    </>
                  )}
                  {ref.status === "completed" && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Received
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
