"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import InterviewCalendar from "@/components/medjobs/InterviewCalendar";
import UpgradeModal from "@/components/medjobs/UpgradeModal";
import { getAccessTier } from "@/lib/medjobs-access";
import type { Interview } from "@/lib/types";

type InterviewWithProfiles = Interview & {
  provider?: { id: string; display_name: string; image_url?: string };
  student?: { id: string; slug?: string; display_name: string; image_url?: string; email?: string; metadata?: Record<string, unknown> };
};

export default function ProviderCaregiversPage() {
  const { activeProfile } = useAuth();
  const [interviews, setInterviews] = useState<InterviewWithProfiles[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Compute access tier from the provider's metadata
  const providerMeta = (activeProfile?.metadata ?? {}) as Record<string, unknown>;
  const accessInfo = getAccessTier(!!activeProfile, providerMeta);

  const fetchInterviews = useCallback(async () => {
    try {
      const res = await fetch("/api/medjobs/interviews");
      const data = await res.json();
      if (data.interviews) setInterviews(data.interviews);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchInterviews(); }, [fetchInterviews]);

  const updateStatus = async (interviewId: string, status: string) => {
    setActionLoading(interviewId);
    try {
      const res = await fetch("/api/medjobs/interviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interviewId, status }),
      });
      if (res.status === 402) {
        setShowUpgradeModal(true);
        return;
      }
      await fetchInterviews();
    } catch { /* ignore */ }
    finally { setActionLoading(null); }
  };

  return (
    <main className="min-h-screen bg-[#FAFAF8]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Interviews</h1>
          <p className="text-sm text-gray-500 mt-1">Track interview requests and scheduled meetings with candidates.</p>
        </div>

        <InterviewCalendar
          interviews={interviews}
          perspective="provider"
          loading={loading}
          onUpdateStatus={updateStatus}
          actionLoading={actionLoading}
          accessTier={accessInfo.tier}
        />
      </div>

      {showUpgradeModal && (
        <UpgradeModal
          interviewsUsed={accessInfo.interviewsUsed}
          onClose={() => setShowUpgradeModal(false)}
        />
      )}
    </main>
  );
}
