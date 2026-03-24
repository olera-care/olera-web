"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { createBrowserClient } from "@supabase/ssr";

interface StudentProfile {
  id: string;
  slug: string;
  display_name: string;
  email: string;
  is_active: boolean;
  image_url: string | null;
  metadata: {
    university?: string;
    intended_professional_school?: string;
    program_track?: string;
    video_intro_url?: string;
    drivers_license_url?: string;
    drivers_license_uploaded_at?: string;
    car_insurance_url?: string;
    car_insurance_uploaded_at?: string;
    profile_completeness?: number;
    application_completed?: boolean;
    [key: string]: unknown;
  };
}

type Step = {
  key: string;
  label: string;
  done: boolean;
  locked?: boolean;
  action?: "video" | "upload_license" | "upload_insurance" | "complete_application";
};

function getSteps(profile: StudentProfile | null): Step[] {
  const meta = profile?.metadata || {};
  const appDone = !!meta.application_completed;

  const steps: Step[] = [];

  if (!appDone) {
    steps.push({ key: "application", label: "Complete your application", done: false, action: "complete_application" });
  }

  steps.push(
    { key: "video", label: "Intro video", done: !!meta.video_intro_url, locked: !appDone, action: meta.video_intro_url || !appDone ? undefined : "video" },
    { key: "license", label: "Driver\u2019s license", done: !!meta.drivers_license_url, locked: !appDone, action: meta.drivers_license_url || !appDone ? undefined : "upload_license" },
    { key: "insurance", label: "Car insurance", done: !!meta.car_insurance_url, locked: !appDone, action: meta.car_insurance_url || !appDone ? undefined : "upload_insurance" },
  );

  return steps;
}

/* ─── Inline Upload ────────────────────────────────────────── */

function InlineUpload({ profileId, documentType, onComplete }: {
  profileId: string; documentType: "drivers_license" | "car_insurance"; onComplete: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleUpload = async (file: File) => {
    setError("");
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("profileId", profileId);
      formData.append("documentType", documentType);
      const res = await fetch("/api/medjobs/upload-document", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Upload failed."); return; }
      onComplete();
    } catch { setError("Network error."); }
    finally { setUploading(false); }
  };

  return (
    <>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf"
        className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} />
      {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
      <button type="button" disabled={uploading} onClick={() => inputRef.current?.click()}
        className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 disabled:opacity-40 rounded-lg text-sm font-medium text-white transition-colors">
        {uploading ? "Uploading..." : "Upload"}
      </button>
    </>
  );
}

/* ─── Page ─────────────────────────────────────────────────── */

export default function StudentPortalPage() {
  const { account, profiles, isLoading: authLoading } = useAuth();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (authLoading) return;
    const studentProfile = profiles?.find((p) => p.type === "student");
    if (studentProfile) { fetchFullProfile(studentProfile.id); return; }
    if (account?.id) { fetchByAccount(account.id); return; }
    setLoading(false);
  }, [authLoading, account?.id, profiles, refreshKey]);

  const fetchFullProfile = useCallback(async (profileId: string) => {
    try {
      const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
      const { data } = await sb.from("business_profiles").select("id, slug, display_name, email, is_active, image_url, metadata").eq("id", profileId).single();
      if (data) setProfile(data as StudentProfile);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  const fetchByAccount = useCallback(async (accountId: string) => {
    try {
      const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
      const { data } = await sb.from("business_profiles").select("id, slug, display_name, email, is_active, image_url, metadata").eq("account_id", accountId).eq("type", "student").limit(1).maybeSingle();
      if (data) setProfile(data as StudentProfile);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  const handleUploadComplete = () => setRefreshKey((k) => k + 1);

  if (authLoading || loading) {
    return <main className="min-h-screen bg-white flex items-center justify-center"><div className="text-gray-300 text-sm">Loading...</div></main>;
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="max-w-sm text-center">
          <h1 className="text-2xl font-semibold text-gray-900 mb-3">No profile yet</h1>
          <p className="text-gray-400 mb-6">Apply to MedJobs to get started.</p>
          <Link href="/medjobs/apply" className="inline-flex items-center justify-center px-6 py-3 bg-gray-900 hover:bg-gray-800 rounded-lg text-sm font-semibold text-white transition-colors">
            Apply now
          </Link>
        </div>
      </main>
    );
  }

  const steps = getSteps(profile);
  const doneCount = steps.filter((s) => s.done).length;
  const totalCount = steps.length;
  const allDone = doneCount === totalCount;
  const firstName = profile.display_name?.split(" ")[0] || "there";

  // Find the first incomplete, unlocked step — this is the "hero" action
  const nextStep = steps.find((s) => !s.done && !s.locked);
  const remainingSteps = steps.filter((s) => s !== nextStep);

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-10 sm:py-16">
        {/* Back */}
        <Link href="/medjobs" className="text-sm text-gray-300 hover:text-gray-500 transition-colors">
          &larr; MedJobs
        </Link>

        {/* Heading */}
        <div className="mt-8 mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">
            {allDone ? `You\u2019re live, ${firstName}` : `Hey ${firstName}`}
          </h1>
          <p className="text-sm text-gray-400">
            {allDone
              ? "Providers in your area can now find your profile."
              : "Complete these steps and providers will be able to find you."
            }
          </p>
        </div>

        {/* Progress arc — simple segmented bar */}
        <div className="flex gap-1.5 mb-10">
          {steps.map((s) => (
            <div key={s.key} className={`h-1 flex-1 rounded-full transition-colors ${s.done ? "bg-gray-900" : "bg-gray-100"}`} />
          ))}
        </div>

        {/* ── Hero: Next Action ── */}
        {nextStep && !allDone && (
          <div className="mb-8">
            {nextStep.action === "complete_application" && (
              <div className="p-6 rounded-xl border border-gray-200">
                <p className="text-lg font-medium text-gray-900 mb-1">Finish your application</p>
                <p className="text-sm text-gray-400 mb-5">Pick up where you left off — takes about 3 minutes.</p>
                <Link href="/medjobs/apply"
                  className="inline-flex items-center px-6 py-3 bg-gray-900 hover:bg-gray-800 rounded-lg text-sm font-semibold text-white transition-colors">
                  Continue
                </Link>
              </div>
            )}
            {nextStep.action === "video" && (
              <div className="p-6 rounded-xl border border-gray-200">
                <p className="text-lg font-medium text-gray-900 mb-1">Record your intro video</p>
                <p className="text-sm text-gray-400 mb-5">2-3 minutes. Providers want to see who they&apos;re working with.</p>
                <Link href={`/medjobs/submit-video?slug=${profile.slug}&profileId=${profile.id}`}
                  className="inline-flex items-center px-6 py-3 bg-gray-900 hover:bg-gray-800 rounded-lg text-sm font-semibold text-white transition-colors">
                  Submit video
                </Link>
              </div>
            )}
            {nextStep.action === "upload_license" && (
              <div className="p-6 rounded-xl border border-gray-200">
                <p className="text-lg font-medium text-gray-900 mb-1">Upload your driver&apos;s license</p>
                <p className="text-sm text-gray-400 mb-5">Required before your first assignment. Stored securely.</p>
                <InlineUpload profileId={profile.id} documentType="drivers_license" onComplete={handleUploadComplete} />
              </div>
            )}
            {nextStep.action === "upload_insurance" && (
              <div className="p-6 rounded-xl border border-gray-200">
                <p className="text-lg font-medium text-gray-900 mb-1">Upload your car insurance</p>
                <p className="text-sm text-gray-400 mb-5">Proof of coverage for getting to assignments.</p>
                <InlineUpload profileId={profile.id} documentType="car_insurance" onComplete={handleUploadComplete} />
              </div>
            )}
          </div>
        )}

        {/* ── Remaining steps: compact list ── */}
        {remainingSteps.length > 0 && !allDone && (
          <div className="space-y-0 mb-10">
            {remainingSteps.map((s) => (
              <div key={s.key} className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
                {s.done ? (
                  <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <div className="w-4 h-4 rounded-full border border-gray-200 shrink-0" />
                )}
                <span className={`text-sm ${s.done ? "text-gray-400 line-through" : s.locked ? "text-gray-300" : "text-gray-600"}`}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* ── All done state ── */}
        {allDone && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-6">
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                profile.is_active ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${profile.is_active ? "bg-emerald-500" : "bg-amber-500"}`} />
                {profile.is_active ? "Live" : "Under review"}
              </div>
            </div>

            {profile.is_active && (
              <Link href={`/medjobs/candidates/${profile.slug}`}
                className="inline-flex items-center justify-center w-full px-6 py-3.5 bg-gray-900 hover:bg-gray-800 rounded-lg text-sm font-semibold text-white transition-colors">
                View your public profile
              </Link>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
