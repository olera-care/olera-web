"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import InterviewCalendar from "@/components/medjobs/InterviewCalendar";
import type { Interview } from "@/lib/types";

type InterviewWithProfiles = Interview & {
  provider?: { id: string; display_name: string; image_url?: string; city?: string; state?: string; email?: string; phone?: string };
  student?: { id: string; slug?: string; display_name: string; image_url?: string };
};

export default function InterviewsPage() {
  const { user, activeProfile, isLoading: authLoading } = useAuth();
  const [interviews, setInterviews] = useState<InterviewWithProfiles[]>([]);
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

  // Re-fetch when auth resolves AND when the user/profile becomes available.
  // This self-heals the post-magic-link race where the page first mounts
  // before the session cookie or placeholder-profile link has settled.
  useEffect(() => {
    if (!authLoading) {
      fetchInterviews();
    }
  }, [fetchInterviews, authLoading, user?.id, activeProfile?.id]);

  const updateStatus = async (interviewId: string, status: string) => {
    setActionLoading(interviewId);
    try {
      await fetch("/api/medjobs/interviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interviewId, status }),
      });
      await fetchInterviews();
    } catch { /* ignore */ }
    finally { setActionLoading(null); }
  };

  return (
    <main className="min-h-screen bg-[#FAFAF8]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Interviews</h1>
          <p className="text-sm text-gray-500 mt-1">View and manage your scheduled interviews with organizations.</p>
        </div>

        <InterviewCalendar
          interviews={interviews}
          perspective="student"
          loading={loading || authLoading}
          onUpdateStatus={updateStatus}
          actionLoading={actionLoading}
        />
      </div>
    </main>
  );
}
