"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import type { Interview } from "@/lib/types";

export default function InterviewsPage() {
  const [interviews, setInterviews] = useState<(Interview & { provider?: { display_name: string }; student?: { display_name: string } })[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchInterviews = useCallback(async () => {
    try {
      const res = await fetch("/api/medjobs/interviews");
      const data = await res.json();
      if (data.interviews) setInterviews(data.interviews);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchInterviews(); }, [fetchInterviews]);

  const updateStatus = async (interviewId: string, status: string, newTime?: string) => {
    setActionLoading(interviewId);
    try {
      await fetch("/api/medjobs/interviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interviewId, status, newTime }),
      });
      await fetchInterviews();
    } catch { /* ignore */ }
    finally { setActionLoading(null); }
  };

  const pending = interviews.filter((i) => i.status === "proposed");
  const upcoming = interviews.filter((i) => i.status === "confirmed");
  const past = interviews.filter((i) => ["completed", "cancelled", "no_show"].includes(i.status));

  if (loading) {
    return <main className="min-h-screen bg-[#FAFAF8] flex items-center justify-center"><div className="text-gray-300 text-sm">Loading...</div></main>;
  }

  return (
    <main className="min-h-screen bg-[#FAFAF8]">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Interviews</h1>
          {interviews.length > 0 && (
            <span className="text-sm text-gray-400">{upcoming.length} upcoming · {interviews.length} total</span>
          )}
        </div>

        {interviews.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <svg className="w-12 h-12 text-gray-200 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-500 mb-2">No interviews yet</p>
            <p className="text-sm text-gray-400 mb-6">Complete your profile and apply to providers to start getting interview requests.</p>
            <div className="flex items-center justify-center gap-3">
              <Link href="/portal/medjobs" className="px-4 py-2 bg-gray-900 hover:bg-gray-800 rounded-lg text-sm font-medium text-white transition-colors">
                Complete your profile
              </Link>
              <Link href="/portal/medjobs/jobs" className="px-4 py-2 border border-gray-200 hover:border-gray-300 rounded-lg text-sm font-medium text-gray-700 transition-colors">
                Browse open jobs
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Pending — needs action */}
            {pending.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  Pending ({pending.length})
                </h2>
                <div className="space-y-3">
                  {pending.map((interview) => (
                    <InterviewCard key={interview.id} interview={interview} isPending
                      onConfirm={() => updateStatus(interview.id, "confirmed")}
                      onCancel={() => updateStatus(interview.id, "cancelled")}
                      loading={actionLoading === interview.id} />
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming — confirmed */}
            {upcoming.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Upcoming ({upcoming.length})
                </h2>
                <div className="space-y-3">
                  {upcoming.map((interview) => (
                    <InterviewCard key={interview.id} interview={interview}
                      onCancel={() => updateStatus(interview.id, "cancelled")}
                      loading={actionLoading === interview.id} />
                  ))}
                </div>
              </div>
            )}

            {/* Past */}
            {past.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-900 mb-3 text-gray-400">Past ({past.length})</h2>
                <div className="space-y-3">
                  {past.map((interview) => (
                    <InterviewCard key={interview.id} interview={interview} loading={false} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function InterviewCard({ interview, isPending, onConfirm, onCancel, loading }: {
  interview: Interview & { provider?: { display_name: string }; student?: { display_name: string } };
  isPending?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
  loading: boolean;
}) {
  const time = new Date(interview.confirmed_time || interview.proposed_time);
  const typeLabel = interview.type === "video" ? "Video" : interview.type === "in_person" ? "In-Person" : "Phone";
  const otherName = interview.provider?.display_name || interview.student?.display_name || "Unknown";
  const statusColors: Record<string, string> = {
    proposed: "bg-amber-100 text-amber-700",
    confirmed: "bg-emerald-100 text-emerald-700",
    completed: "bg-gray-100 text-gray-500",
    cancelled: "bg-red-100 text-red-600",
    no_show: "bg-red-100 text-red-600",
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-sm font-medium text-gray-900">{otherName}</p>
          <p className="text-xs text-gray-500">
            {typeLabel} · {time.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} at {time.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
          </p>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[interview.status] || "bg-gray-100 text-gray-500"}`}>
          {interview.status}
        </span>
      </div>
      {interview.notes && <p className="text-xs text-gray-400 mb-3">{interview.notes}</p>}
      {isPending && onConfirm && (
        <div className="flex gap-2">
          <button type="button" onClick={onConfirm} disabled={loading}
            className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 rounded-lg text-sm font-medium text-white transition-colors">
            {loading ? "..." : "Confirm"}
          </button>
          <button type="button" onClick={onCancel} disabled={loading}
            className="px-3 py-2 border border-gray-200 hover:bg-gray-50 disabled:opacity-40 rounded-lg text-sm font-medium text-gray-700 transition-colors">
            Decline
          </button>
        </div>
      )}
      {!isPending && interview.status === "confirmed" && onCancel && (
        <button type="button" onClick={onCancel} disabled={loading}
          className="text-xs text-gray-400 hover:text-red-500 transition-colors">
          Cancel interview
        </button>
      )}
    </div>
  );
}
