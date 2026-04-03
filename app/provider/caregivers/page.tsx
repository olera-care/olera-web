"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Interview } from "@/lib/types";

type InterviewWithProfiles = Interview & {
  provider?: { id: string; display_name: string; image_url?: string };
  student?: { id: string; slug?: string; display_name: string; image_url?: string; email?: string; metadata?: Record<string, unknown> };
};

export default function ProviderCaregiversPage() {
  const [interviews, setInterviews] = useState<InterviewWithProfiles[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [tab, setTab] = useState<"pending" | "upcoming" | "past">("upcoming");

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
  const past = interviews.filter((i) => ["completed", "cancelled", "no_show", "rescheduled"].includes(i.status));

  const tabs = [
    { key: "upcoming" as const, label: "Upcoming", count: upcoming.length, color: "bg-emerald-400" },
    { key: "pending" as const, label: "Pending", count: pending.length, color: "bg-amber-400" },
    { key: "past" as const, label: "Past", count: past.length, color: "bg-gray-300" },
  ];

  const activeList = tab === "pending" ? pending : tab === "upcoming" ? upcoming : past;

  if (loading) {
    return (
      <main className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <div className="text-gray-300 text-sm">Loading...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FAFAF8]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Caregivers</h1>
            <p className="text-sm text-gray-500 mt-1">Track interview requests and scheduled meetings with candidates.</p>
          </div>
          {interviews.length > 0 && (
            <div className="text-right text-sm text-gray-400">
              {upcoming.length} upcoming · {pending.length} pending
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t.key
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${t.color}`} />
              {t.label}
              {t.count > 0 && (
                <span className="text-xs text-gray-400">({t.count})</span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeList.length === 0 ? (
          <EmptyState tab={tab} hasAny={interviews.length > 0} />
        ) : (
          <div className="space-y-3">
            {activeList.map((interview) => (
              <InterviewCard
                key={interview.id}
                interview={interview}
                isPending={tab === "pending"}
                onConfirm={() => updateStatus(interview.id, "confirmed")}
                onCancel={() => updateStatus(interview.id, "cancelled")}
                loading={actionLoading === interview.id}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

/* ── Empty state ── */
function EmptyState({ tab, hasAny }: { tab: string; hasAny: boolean }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
      <svg className="w-12 h-12 text-gray-200 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      {!hasAny ? (
        <>
          <p className="text-gray-500 mb-2">No interviews yet</p>
          <p className="text-sm text-gray-400 mb-6">
            Browse caregivers and schedule interviews to start building your team.
          </p>
          <Link
            href="/provider/medjobs/candidates"
            className="inline-flex px-4 py-2 bg-gray-900 hover:bg-gray-800 rounded-lg text-sm font-medium text-white transition-colors"
          >
            Browse caregivers
          </Link>
        </>
      ) : (
        <p className="text-gray-400 text-sm">
          {tab === "pending" ? "No pending interview requests." : tab === "upcoming" ? "No upcoming interviews." : "No past interviews."}
        </p>
      )}
    </div>
  );
}

/* ── Interview card ── */
function InterviewCard({ interview, isPending, onConfirm, onCancel, loading }: {
  interview: InterviewWithProfiles;
  isPending?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
  loading: boolean;
}) {
  const time = new Date(interview.confirmed_time || interview.proposed_time);
  const typeLabel = interview.type === "video" ? "Video" : interview.type === "in_person" ? "In-Person" : "Phone";
  const candidate = interview.student;
  const candidateName = candidate?.display_name || "Unknown Candidate";

  const statusColors: Record<string, string> = {
    proposed: "bg-amber-100 text-amber-700",
    confirmed: "bg-emerald-100 text-emerald-700",
    completed: "bg-gray-100 text-gray-500",
    cancelled: "bg-red-100 text-red-600",
    no_show: "bg-red-100 text-red-600",
    rescheduled: "bg-blue-100 text-blue-600",
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className="flex items-start gap-3">
        {/* Candidate avatar */}
        <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden shrink-0">
          {candidate?.image_url ? (
            <Image src={candidate.image_url} alt={candidateName} width={40} height={40} className="object-cover w-full h-full" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sm font-medium text-gray-400">
              {candidateName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1">
            <div>
              {candidate?.slug ? (
                <Link href={`/provider/medjobs/candidates/${candidate.slug}`} className="text-sm font-medium text-gray-900 hover:text-primary-600 transition-colors">
                  {candidateName}
                </Link>
              ) : (
                <p className="text-sm font-medium text-gray-900">{candidateName}</p>
              )}
              <p className="text-xs text-gray-500">
                {typeLabel} · {time.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} at {time.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                {interview.duration_minutes && ` · ${interview.duration_minutes} min`}
              </p>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${statusColors[interview.status] || "bg-gray-100 text-gray-500"}`}>
              {interview.status}
            </span>
          </div>

          {interview.location && (
            <p className="text-xs text-gray-400 mt-1">
              <span className="font-medium">Location:</span> {interview.location}
            </p>
          )}
          {interview.notes && <p className="text-xs text-gray-400 mt-1">{interview.notes}</p>}

          {/* Actions */}
          {isPending && onConfirm && (
            <div className="flex gap-2 mt-3">
              <button type="button" onClick={onConfirm} disabled={loading}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 rounded-lg text-xs font-medium text-white transition-colors">
                {loading ? "..." : "Confirm"}
              </button>
              <button type="button" onClick={onCancel} disabled={loading}
                className="px-3 py-1.5 border border-gray-200 hover:bg-gray-50 disabled:opacity-40 rounded-lg text-xs font-medium text-gray-700 transition-colors">
                Decline
              </button>
            </div>
          )}
          {!isPending && interview.status === "confirmed" && onCancel && (
            <button type="button" onClick={onCancel} disabled={loading}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors mt-2">
              Cancel interview
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
