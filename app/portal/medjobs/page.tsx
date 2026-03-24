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
    [key: string]: unknown;
  };
}

type ChecklistItem = {
  key: string;
  label: string;
  desc: string;
  done: boolean;
  action?: "video" | "upload_license" | "upload_insurance";
};

function getChecklist(profile: StudentProfile | null): ChecklistItem[] {
  const meta = profile?.metadata || {};
  return [
    {
      key: "video",
      label: "Intro video",
      desc: "2-3 min video so providers can get to know you",
      done: !!meta.video_intro_url,
      action: meta.video_intro_url ? undefined : "video",
    },
    {
      key: "license",
      label: "Driver\u2019s license",
      desc: "Required before your first assignment",
      done: !!meta.drivers_license_url,
      action: meta.drivers_license_url ? undefined : "upload_license",
    },
    {
      key: "insurance",
      label: "Car insurance",
      desc: "Proof of coverage for transportation",
      done: !!meta.car_insurance_url,
      action: meta.car_insurance_url ? undefined : "upload_insurance",
    },
  ];
}

/* ─── Document Upload (inline) ─────────────────────────────── */

function InlineUpload({ profileId, documentType, label, onComplete }: {
  profileId: string; documentType: "drivers_license" | "car_insurance";
  label: string; onComplete: () => void;
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
    <div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf"
        className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} />
      {error && <p className="text-xs text-red-600 mb-1">{error}</p>}
      <button type="button" disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="text-sm font-medium text-gray-900 underline underline-offset-2 hover:text-gray-600 disabled:opacity-40 transition-colors">
        {uploading ? "Uploading..." : `Upload ${label.toLowerCase()}`}
      </button>
      <p className="text-xs text-gray-300 mt-0.5">JPEG, PNG, WebP, or PDF</p>
    </div>
  );
}

/* ─── Page ─────────────────────────────────────────────────── */

export default function StudentPortalPage() {
  const { account, profiles, isLoading: authLoading } = useAuth();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Find student profile from auth context or fetch directly
  useEffect(() => {
    if (authLoading) return;

    const studentProfile = profiles?.find((p) => p.type === "student");
    if (studentProfile) {
      // We have the basic profile from auth context, but need full metadata
      fetchFullProfile(studentProfile.id);
      return;
    }

    // Fallback: query by account_id
    if (account?.id) {
      fetchByAccount(account.id);
      return;
    }

    setLoading(false);
  }, [authLoading, account?.id, profiles, refreshKey]);

  const fetchFullProfile = useCallback(async (profileId: string) => {
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data } = await supabase
        .from("business_profiles")
        .select("id, slug, display_name, email, is_active, image_url, metadata")
        .eq("id", profileId)
        .single();
      if (data) setProfile(data as StudentProfile);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  const fetchByAccount = useCallback(async (accountId: string) => {
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data } = await supabase
        .from("business_profiles")
        .select("id, slug, display_name, email, is_active, image_url, metadata")
        .eq("account_id", accountId)
        .eq("type", "student")
        .limit(1)
        .maybeSingle();
      if (data) setProfile(data as StudentProfile);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  const handleUploadComplete = () => setRefreshKey((k) => k + 1);

  /* ─── Loading ──────────────────────────────────────────── */

  if (authLoading || loading) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-300 text-sm">Loading your profile...</div>
      </main>
    );
  }

  /* ─── No Student Profile ───────────────────────────────── */

  if (!profile) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="max-w-sm text-center">
          <h1 className="text-2xl font-semibold text-gray-900 mb-3">No student profile found</h1>
          <p className="text-gray-500 mb-6">
            It looks like you haven&apos;t applied to MedJobs yet.
          </p>
          <Link href="/medjobs/apply"
            className="inline-flex items-center justify-center px-6 py-3 bg-gray-900 hover:bg-gray-800 rounded-lg text-sm font-semibold text-white transition-colors">
            Apply now
          </Link>
        </div>
      </main>
    );
  }

  /* ─── Dashboard ────────────────────────────────────────── */

  const checklist = getChecklist(profile);
  const doneCount = checklist.filter((i) => i.done).length;
  const allDone = doneCount === checklist.length;
  const firstName = profile.display_name?.split(" ")[0] || "there";

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-2">
          <Link href="/medjobs" className="text-sm text-gray-300 hover:text-gray-500 transition-colors">
            &larr; MedJobs
          </Link>
        </div>

        <div className="mb-10 pt-4">
          <h1 className="text-2xl font-semibold text-gray-900">
            {allDone ? `You\u2019re all set, ${firstName}!` : `Hey ${firstName}, let\u2019s finish up`}
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {allDone
              ? "Your profile is live. Providers can see you now."
              : `${doneCount} of ${checklist.length} steps complete`
            }
          </p>
        </div>

        {/* Status badge */}
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-8 ${
          profile.is_active
            ? "bg-emerald-50 text-emerald-700"
            : "bg-amber-50 text-amber-700"
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full ${profile.is_active ? "bg-emerald-500" : "bg-amber-500"}`} />
          {profile.is_active ? "Profile visible to providers" : "Profile not yet visible"}
        </div>

        {/* Checklist */}
        <div className="space-y-3 mb-10">
          {checklist.map((item, i) => (
            <div key={item.key}
              className={`flex items-start gap-4 p-4 rounded-lg transition-all ${
                item.done ? "bg-gray-50" : "border border-gray-200"
              }`}>
              {/* Badge */}
              <span className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-semibold shrink-0 mt-0.5 ${
                item.done ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-400"
              }`}>
                {item.done ? "\u2713" : i + 1}
              </span>

              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${item.done ? "text-gray-500" : "text-gray-900"}`}>
                  {item.label}
                  {item.done && <span className="ml-2 text-xs text-gray-400">Done</span>}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>

                {/* Actions */}
                {!item.done && item.action === "video" && (
                  <div className="mt-3">
                    <Link href={`/medjobs/submit-video?slug=${profile.slug}&profileId=${profile.id}`}
                      className="text-sm font-medium text-gray-900 underline underline-offset-2 hover:text-gray-600 transition-colors">
                      Submit video
                    </Link>
                  </div>
                )}
                {!item.done && item.action === "upload_license" && (
                  <div className="mt-3">
                    <InlineUpload profileId={profile.id} documentType="drivers_license"
                      label="Driver's license" onComplete={handleUploadComplete} />
                  </div>
                )}
                {!item.done && item.action === "upload_insurance" && (
                  <div className="mt-3">
                    <InlineUpload profileId={profile.id} documentType="car_insurance"
                      label="Car insurance" onComplete={handleUploadComplete} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Profile preview */}
        {profile.is_active && (
          <Link href={`/medjobs/candidates/${profile.slug}`}
            className="inline-flex items-center justify-center w-full px-6 py-3.5 bg-gray-900 hover:bg-gray-800 rounded-lg text-sm font-semibold text-white transition-colors">
            View your public profile
          </Link>
        )}

        {/* Profile info card */}
        <div className="mt-10 border-t border-gray-100 pt-8">
          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-4">Your application</p>
          <div className="grid grid-cols-2 gap-4">
            {profile.metadata.university && (
              <div>
                <p className="text-xs text-gray-400">University</p>
                <p className="text-sm text-gray-900">{profile.metadata.university}</p>
              </div>
            )}
            {profile.metadata.intended_professional_school && (
              <div>
                <p className="text-xs text-gray-400">Career path</p>
                <p className="text-sm text-gray-900 capitalize">{profile.metadata.intended_professional_school.replace(/_/g, " ")}</p>
              </div>
            )}
            {profile.email && (
              <div>
                <p className="text-xs text-gray-400">Email</p>
                <p className="text-sm text-gray-900">{profile.email}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
