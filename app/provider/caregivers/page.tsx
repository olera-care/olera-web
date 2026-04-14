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

const PENDING_KEY = "medjobs:pending_interviews";
const PENDING_TTL_MS = 5 * 60 * 1000; // 5 minutes — only fresh stashes matter

// Hydrate initial state from sessionStorage (stashed by the onboard page
// right before navigation). Survives the post-magic-link race where the
// fresh API fetch may return empty.
function readPendingStash(): InterviewWithProfiles[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { list: InterviewWithProfiles[]; at: number };
    if (!parsed?.list || Date.now() - parsed.at > PENDING_TTL_MS) {
      sessionStorage.removeItem(PENDING_KEY);
      return [];
    }
    return parsed.list;
  } catch {
    return [];
  }
}

export default function ProviderCaregiversPage() {
  const { activeProfile, isLoading: authLoading } = useAuth();
  const [interviews, setInterviews] = useState<InterviewWithProfiles[]>(readPendingStash);
  // Start not-loading if we have stashed interviews — otherwise the spinner
  // would briefly hide the interviews the user came here to see.
  const [loading, setLoading] = useState(() => interviews.length === 0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Compute access tier from the provider's metadata
  const providerMeta = (activeProfile?.metadata ?? {}) as Record<string, unknown>;
  const accessInfo = getAccessTier(!!activeProfile, providerMeta);

  const fetchInterviews = useCallback(async () => {
    try {
      const res = await fetch("/api/medjobs/interviews");
      const data = await res.json();
      if (!data.interviews) return;
      const apiList = data.interviews as InterviewWithProfiles[];
      // Merge API result with any pending stash — API wins on conflict, but
      // a stashed interview survives if the API race returned empty.
      setInterviews((prev) => {
        const apiIds = new Set(apiList.map((iv) => iv.id));
        const pendingExtras = prev.filter((iv) => !apiIds.has(iv.id));
        const merged = [...apiList, ...pendingExtras];
        // Clear the stash once API has caught up — no extras means API
        // saw everything we had locally.
        if (pendingExtras.length === 0 && typeof window !== "undefined") {
          try { sessionStorage.removeItem(PENDING_KEY); } catch {}
        }
        return merged;
      });
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  // Wait for auth to complete before fetching interviews
  useEffect(() => {
    if (!authLoading) {
      fetchInterviews();
    }
  }, [fetchInterviews, authLoading]);

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
          loading={loading || authLoading}
          onUpdateStatus={updateStatus}
          actionLoading={actionLoading}
          accessTier={accessInfo.tier}
        />
      </div>

      {showUpgradeModal && (
        <UpgradeModal
          creditsUsed={accessInfo.creditsUsed}
          onClose={() => setShowUpgradeModal(false)}
        />
      )}
    </main>
  );
}
