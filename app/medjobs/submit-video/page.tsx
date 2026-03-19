"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const VIDEO_PROMPTS = [
  "Tell us your name, university, and what you're studying.",
  "Why are you interested in caregiving?",
  "Describe any relevant experience you have (professional, volunteer, or personal).",
  "What does reliability mean to you in a caregiving context?",
  "What are your career goals and how does this experience fit in?",
];

const SCENARIO_PROMPTS = [
  "A client seems confused and agitated. How would you handle the situation?",
  "You're running 15 minutes late to a shift. What do you do?",
  "A family member asks you to do something outside your normal duties. How do you respond?",
];

function isValidVideoUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    return (
      host === "youtube.com" ||
      host === "www.youtube.com" ||
      host === "youtu.be" ||
      host === "loom.com" ||
      host === "www.loom.com"
    );
  } catch {
    return false;
  }
}

export default function SubmitVideoPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </main>
    }>
      <SubmitVideoContent />
    </Suspense>
  );
}

function SubmitVideoContent() {
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug") || "";

  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    setError("");

    if (!slug) {
      setError("Missing profile slug. Please use the link from your confirmation page.");
      return;
    }

    if (!videoUrl.trim()) {
      setError("Please enter your video URL.");
      return;
    }

    if (!isValidVideoUrl(videoUrl.trim())) {
      setError("Please enter a valid YouTube or Loom URL.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/medjobs/submit-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, videoUrl: videoUrl.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Profile Activated!</h1>
          <p className="text-gray-500 mb-6">
            Your intro video has been submitted and your profile is now visible to providers.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href={`/medjobs/candidates/${slug}`}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 rounded-xl text-sm font-semibold text-white transition-colors"
            >
              View Your Profile
            </Link>
            <Link
              href="/medjobs"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Back to MedJobs
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8 sm:py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="mb-8">
          <Link href="/medjobs" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
            &larr; Back to MedJobs
          </Link>
          <h1 className="mt-3 text-2xl sm:text-3xl font-bold text-gray-900">
            Submit Your Intro Video
          </h1>
          <p className="mt-1 text-gray-500">
            Record a 2-3 minute video and share the link below. This is required to activate your profile.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 space-y-6">
          {/* Prompts */}
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-3">In your video, please address:</h2>
            <ol className="space-y-2 list-decimal list-inside">
              {VIDEO_PROMPTS.map((prompt) => (
                <li key={prompt} className="text-sm text-gray-600">{prompt}</li>
              ))}
            </ol>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Scenario questions (pick at least one):</h2>
            <ol className="space-y-2 list-decimal list-inside">
              {SCENARIO_PROMPTS.map((prompt) => (
                <li key={prompt} className="text-sm text-gray-600">{prompt}</li>
              ))}
            </ol>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm text-gray-600">
              <strong>How to record:</strong> Use your phone or laptop to record, then upload to{" "}
              <a href="https://www.youtube.com" target="_blank" rel="noopener noreferrer" className="text-primary-600 underline">YouTube</a>{" "}
              (unlisted) or{" "}
              <a href="https://www.loom.com" target="_blank" rel="noopener noreferrer" className="text-primary-600 underline">Loom</a>{" "}
              (free). Paste the link below.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Video URL *</label>
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              placeholder="https://youtu.be/... or https://www.loom.com/share/..."
            />
            <p className="mt-1 text-xs text-gray-400">Accepts YouTube or Loom links</p>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !videoUrl.trim()}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm font-semibold text-white transition-colors"
          >
            {loading ? "Submitting..." : "Submit Video & Activate Profile"}
          </button>
        </div>
      </div>
    </main>
  );
}
