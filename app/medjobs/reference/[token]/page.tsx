"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

type PageState = "loading" | "form" | "completed" | "already_completed" | "invalid";

export default function RefereeSubmissionPage() {
  const params = useParams();
  const token = params.token as string;

  const [state, setState] = useState<PageState>("loading");
  const [studentName, setStudentName] = useState("");
  const [relationship, setRelationship] = useState("");

  // Form fields
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [organization, setOrganization] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function validate() {
      try {
        const res = await fetch(`/api/medjobs/references/submit?token=${token}`);
        const data = await res.json();

        if (res.status === 409) {
          setState("already_completed");
          return;
        }
        if (!res.ok) {
          setState("invalid");
          return;
        }

        setStudentName(data.studentName);
        setRelationship(data.relationship);
        setState("form");
      } catch {
        setState("invalid");
      }
    }
    validate();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (recommendation.trim().length < 50) {
      setError("Please write at least 50 characters.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/medjobs/references/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          refereeName: name,
          refereeTitle: title || undefined,
          refereeOrganization: organization || undefined,
          recommendation,
        }),
      });
      const data = await res.json();

      if (res.status === 409) {
        setState("already_completed");
        return;
      }
      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      setState("completed");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const firstName = studentName.split(" ")[0] || "the student";

  const RELATIONSHIP_LABELS: Record<string, string> = {
    professor: "Professor",
    employer: "Employer",
    supervisor: "Supervisor",
    colleague: "Colleague",
    other: "Reference",
  };

  if (state === "loading") {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-300 text-sm">Loading...</div>
      </main>
    );
  }

  if (state === "invalid") {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="max-w-sm text-center">
          <h1 className="text-2xl font-semibold text-gray-900 mb-3">Invalid Link</h1>
          <p className="text-gray-400 mb-6">This reference link is invalid or has expired.</p>
          <Link href="/medjobs" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
            Go to MedJobs
          </Link>
        </div>
      </main>
    );
  }

  if (state === "already_completed") {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="max-w-sm text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-emerald-50 flex items-center justify-center">
            <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-3">Already Submitted</h1>
          <p className="text-gray-400">This reference has already been completed. Thank you!</p>
        </div>
      </main>
    );
  }

  if (state === "completed") {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="max-w-sm text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-emerald-50 flex items-center justify-center">
            <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-3">Thank You!</h1>
          <p className="text-gray-400">
            Your recommendation for {firstName} has been submitted and will appear on their profile.
          </p>
        </div>
      </main>
    );
  }

  // Form state
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <div className="mb-8">
          <p className="text-sm text-gray-400 mb-1">Olera MedJobs</p>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Write a recommendation for {firstName}
          </h1>
          <p className="text-sm text-gray-500">
            {firstName} listed you as a {(RELATIONSHIP_LABELS[relationship] || "reference").toLowerCase()}.
            Your recommendation will appear on their public candidate profile.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Dr. Jane Smith"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Professor of Biology"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Organization</label>
            <input
              type="text"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              placeholder="University of Texas at Austin"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Recommendation *</label>
            <textarea
              required
              value={recommendation}
              onChange={(e) => setRecommendation(e.target.value)}
              rows={6}
              placeholder={`Describe your experience working with ${firstName}, their strengths, and why you'd recommend them...`}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none resize-none"
            />
            <p className="mt-1 text-xs text-gray-400">
              {recommendation.length}/50 minimum characters
            </p>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full px-6 py-3 bg-gray-900 hover:bg-gray-800 disabled:opacity-40 rounded-xl text-sm font-semibold text-white transition-colors"
          >
            {submitting ? "Submitting..." : "Submit Recommendation"}
          </button>
        </form>
      </div>
    </main>
  );
}
