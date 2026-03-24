"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { createBrowserClient } from "@supabase/ssr";

const VIDEO_PROMPTS = [
  "Your name, university, and what you're studying",
  "Why you're interested in caregiving",
  "Any relevant experience (professional, volunteer, or personal)",
  "What reliability means to you in a caregiving context",
  "Your career goals and how this fits in",
];

const SCENARIO_PROMPTS = [
  "A client seems confused and agitated \u2014 how do you handle it?",
  "You're running 15 minutes late to a shift \u2014 what do you do?",
  "A family member asks you to do something outside your duties \u2014 how do you respond?",
];

function isValidVideoUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    return (
      host === "youtube.com" || host === "www.youtube.com" ||
      host === "youtu.be" || host === "loom.com" || host === "www.loom.com"
    );
  } catch { return false; }
}

export default function SubmitVideoPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-300 text-sm">Loading...</div>
      </main>
    }>
      <SubmitVideoContent />
    </Suspense>
  );
}

function SubmitVideoContent() {
  const searchParams = useSearchParams();
  const paramSlug = searchParams.get("slug") || "";
  const paramProfileId = searchParams.get("profileId") || "";

  const { account, profiles, isLoading: authLoading } = useAuth();

  // Resolved profile info — from URL params or auth session
  const [slug, setSlug] = useState(paramSlug);
  const [profileId, setProfileId] = useState(paramProfileId);
  const [resolving, setResolving] = useState(!paramSlug);

  // If no URL params, find student profile from auth session
  useEffect(() => {
    if (paramSlug && paramProfileId) { setResolving(false); return; }
    if (authLoading) return;

    const studentProfile = profiles?.find((p) => p.type === "student");
    if (studentProfile) {
      setProfileId(studentProfile.id);
      setSlug(studentProfile.slug);
      setResolving(false);
      return;
    }

    // Fallback: query by account_id
    if (account?.id) {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      supabase
        .from("business_profiles")
        .select("id, slug")
        .eq("account_id", account.id)
        .eq("type", "student")
        .limit(1)
        .maybeSingle()
        .then(({ data }) => {
          if (data) { setProfileId(data.id); setSlug(data.slug); }
          setResolving(false);
        });
    } else {
      setResolving(false);
    }
  }, [paramSlug, paramProfileId, authLoading, account?.id, profiles]);

  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    setError("");
    if (!slug) { setError("Missing profile. Please use the link from your email or sign in first."); return; }
    if (!videoUrl.trim()) { setError("Please enter your video URL."); return; }
    if (!isValidVideoUrl(videoUrl.trim())) { setError("Please enter a valid YouTube or Loom URL."); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/medjobs/submit-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, videoUrl: videoUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Something went wrong."); return; }
      setSuccess(true);
    } catch { setError("Network error."); }
    finally { setLoading(false); }
  };

  /* ─── Loading ──────────────────────────────────────────── */

  if (resolving || authLoading) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-300 text-sm">Loading...</div>
      </main>
    );
  }

  /* ─── Success ──────────────────────────────────────────── */

  if (success) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-50 mb-6">
            <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"
              style={{ animation: "scale-in 0.4s ease-out" }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-semibold text-gray-900 mb-3">Video submitted!</h1>
          <p className="text-gray-500 text-lg mb-8">
            Your profile is one step closer to going live.
          </p>
          <Link href="/portal/medjobs"
            className="inline-flex items-center justify-center w-full px-6 py-3.5 bg-gray-900 hover:bg-gray-800 rounded-lg text-sm font-semibold text-white transition-colors">
            Back to your dashboard
          </Link>
          <style>{`@keyframes scale-in { 0% { transform: scale(0); opacity: 0; } 60% { transform: scale(1.15); } 100% { transform: scale(1); opacity: 1; } }`}</style>
        </div>
      </main>
    );
  }

  /* ─── Form ─────────────────────────────────────────────── */

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="mb-2">
          <Link href="/portal/medjobs" className="text-sm text-gray-300 hover:text-gray-500 transition-colors">
            &larr; Dashboard
          </Link>
        </div>

        <div className="mb-10 pt-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-gray-900 text-white text-xs font-medium">1</span>
            <h1 className="text-2xl font-semibold text-gray-900">Intro video</h1>
          </div>
          <p className="text-sm text-gray-400 ml-9">
            Record a 2-3 minute video. Upload to{" "}
            <a href="https://www.youtube.com" target="_blank" rel="noopener noreferrer" className="text-gray-600 underline underline-offset-2">YouTube</a>{" "}
            (unlisted) or{" "}
            <a href="https://www.loom.com" target="_blank" rel="noopener noreferrer" className="text-gray-600 underline underline-offset-2">Loom</a>{" "}
            (free), then paste the link.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 rounded-lg text-sm text-red-700">{error}</div>
        )}

        {/* Prompts */}
        <details className="mb-8 group">
          <summary className="text-xs text-gray-400 uppercase tracking-wide font-medium cursor-pointer hover:text-gray-600 transition-colors">
            What to cover in your video
          </summary>
          <div className="mt-3 space-y-4 pl-1">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-2">Talk about</p>
              <ol className="space-y-1.5">
                {VIDEO_PROMPTS.map((p, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-gray-300 shrink-0">{i + 1}.</span> {p}
                  </li>
                ))}
              </ol>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-2">Pick one scenario</p>
              <ol className="space-y-1.5">
                {SCENARIO_PROMPTS.map((p, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-gray-300 shrink-0">&bull;</span> {p}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </details>

        {/* URL input */}
        <div className="mb-6">
          <label className="block text-xs text-gray-400 uppercase tracking-wide font-medium mb-2">Video URL</label>
          <input
            type="url"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://youtu.be/... or https://loom.com/share/..."
            className="w-full border-0 border-b-2 border-gray-200 focus:border-gray-900 outline-none text-lg text-gray-900 placeholder:text-gray-300 py-2 bg-transparent transition-colors"
            autoFocus
          />
          <p className="mt-1.5 text-xs text-gray-300">YouTube or Loom links</p>
        </div>

        <button type="button" onClick={handleSubmit}
          disabled={loading || !videoUrl.trim()}
          className="inline-flex items-center gap-2 px-8 py-3 bg-gray-900 hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg text-sm font-semibold text-white transition-colors">
          {loading ? "Submitting..." : "Submit video"}
        </button>
      </div>
    </main>
  );
}
