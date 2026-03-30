"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { createBrowserClient } from "@supabase/ssr";
import { LifecycleProgress } from "@/components/medjobs/LifecycleProgress";

interface JobProvider {
  id: string;
  slug: string;
  display_name: string;
  city: string | null;
  state: string | null;
  category: string | null;
  image_url: string | null;
}

export default function OpenJobsPage() {
  const { account, profiles, isLoading: authLoading } = useAuth();
  const [providers, setProviders] = useState<JobProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentProfileId, setStudentProfileId] = useState<string | null>(null);
  const [applying, setApplying] = useState<string | null>(null);
  const [applied, setApplied] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (authLoading) return;
    const studentProfile = profiles?.find((p) => p.type === "student");
    if (studentProfile) setStudentProfileId(studentProfile.id);
    fetchProviders();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, profiles]);

  const fetchProviders = useCallback(async () => {
    try {
      const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
      const { data } = await sb
        .from("business_profiles")
        .select("id, slug, display_name, city, state, category, image_url")
        .in("type", ["organization", "caregiver"])
        .eq("is_active", true)
        .order("display_name")
        .limit(50);
      if (data) setProviders(data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  const handleApply = async (providerId: string) => {
    if (!studentProfileId || applying) return;
    setApplying(providerId);
    try {
      const res = await fetch("/api/medjobs/apply-to-provider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerProfileId: providerId }),
      });
      if (res.ok || res.status === 409) {
        setApplied((prev) => new Set(prev).add(providerId));
      }
    } catch { /* ignore */ }
    finally { setApplying(null); }
  };

  if (authLoading || loading) {
    return <main className="min-h-screen bg-[#FAFAF8] flex items-center justify-center"><div className="text-gray-300 text-sm">Loading...</div></main>;
  }

  return (
    <main className="min-h-screen bg-[#FAFAF8]">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <LifecycleProgress currentPhase="interview" />

        <div className="mt-8 mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Open Jobs</h1>
          <p className="text-sm text-gray-500 mt-1">
            Browse providers hiring through MedJobs. Apply, then call to introduce yourself — students who follow up get interviewed faster.
          </p>
        </div>

        {providers.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <p className="text-gray-500 mb-2">No open positions right now.</p>
            <p className="text-sm text-gray-400">
              Make sure your profile is complete — providers in your area will be able to find you when they start hiring.
            </p>
            <Link href="/portal/medjobs" className="mt-4 inline-flex items-center text-sm font-medium text-gray-900 hover:text-gray-700">
              &larr; Back to your profile
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {providers.map((p) => (
              <div key={p.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  {p.image_url ? (
                    <img src={p.image_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                  ) : (
                    <span className="text-sm font-bold text-gray-400">{p.display_name?.charAt(0)}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{p.display_name}</p>
                  <p className="text-xs text-gray-500">
                    {[p.city, p.state].filter(Boolean).join(", ")}
                    {p.category && ` · ${p.category.replace(/_/g, " ")}`}
                  </p>
                </div>
                {applied.has(p.id) ? (
                  <span className="text-xs font-medium text-emerald-600 px-3 py-1.5">Applied</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleApply(p.id)}
                    disabled={applying === p.id || !studentProfileId}
                    className="px-4 py-2 bg-gray-900 hover:bg-gray-800 disabled:opacity-40 rounded-lg text-xs font-medium text-white transition-colors"
                  >
                    {applying === p.id ? "..." : "Apply"}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
