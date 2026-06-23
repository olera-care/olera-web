"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import InterviewCalendar from "@/components/medjobs/InterviewCalendar";
import type { Interview } from "@/lib/types";
import type { Placement } from "@/lib/medjobs/placements";

type InterviewWithProfiles = Interview & {
  provider?: { id: string; display_name: string; image_url?: string; city?: string; state?: string; email?: string; phone?: string };
  student?: { id: string; slug?: string; display_name: string; image_url?: string };
};

// useSearchParams requires a Suspense boundary for Next.js static prerender.
export default function InterviewsPage() {
  return (
    <Suspense fallback={null}>
      <InterviewsPageInner />
    </Suspense>
  );
}

function InterviewsPageInner() {
  const { isLoading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const newInterviewId = searchParams.get("newInterview") || undefined;
  const [interviews, setInterviews] = useState<InterviewWithProfiles[]>([]);
  const [placements, setPlacements] = useState<Placement[]>([]);
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

  const fetchPlacements = useCallback(async () => {
    try {
      const res = await fetch("/api/medjobs/placements");
      const data = await res.json();
      if (data.placements) setPlacements(data.placements);
    } catch { /* ignore */ }
  }, []);

  // Wait for auth before fetching.
  useEffect(() => {
    if (!authLoading) {
      fetchInterviews();
      fetchPlacements();
    }
  }, [fetchInterviews, fetchPlacements, authLoading]);

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

  const handlePlacementAction = async (placementId: string, action: "accept" | "decline") => {
    try {
      await fetch("/api/medjobs/placements", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placement_id: placementId, action }),
      });
      await fetchPlacements();
    } catch { /* ignore */ }
  };

  return (
    <main className="min-h-screen bg-[#FAFAF8]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Interviews</h1>
          <p className="text-sm text-gray-500 mt-1">View and manage your scheduled interviews with the families you&apos;re matching with.</p>
        </div>

        <InterviewCalendar
          interviews={interviews}
          perspective="student"
          loading={loading || authLoading}
          onUpdateStatus={updateStatus}
          actionLoading={actionLoading}
          placements={placements}
          onPlacementAction={handlePlacementAction}
          initialSelectedId={newInterviewId}
        />
      </div>
    </main>
  );
}
