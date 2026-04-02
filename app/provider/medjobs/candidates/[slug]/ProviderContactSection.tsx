"use client";

import { useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";

interface ProviderContactSectionProps {
  studentId: string;
  studentName: string;
  studentEmail: string | null;
  studentPhone: string | null;
  studentSlug: string;
  variant?: "sidebar" | "sticky";
}

export default function ProviderContactSection({
  studentId,
  studentName,
  studentEmail,
  studentPhone,
  studentSlug,
  variant = "sidebar",
}: ProviderContactSectionProps) {
  const pathname = usePathname();
  const { activeProfile, user, openAuth } = useAuth();
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  // Check if user needs to authenticate
  const requiresAuth = !user;
  const requiresProviderProfile = user && !activeProfile;

  const handleAuthRequired = useCallback(() => {
    openAuth({
      intent: "provider",
      headline: `Connect with ${studentName.split(" ")[0]}`,
      subline: "Sign in or create a provider account to schedule an interview",
      deferred: {
        action: "hire-candidate",
        returnUrl: pathname,
      },
    });
  }, [openAuth, studentName, pathname]);

  const firstName = studentName.split(" ")[0];
  const providerName = activeProfile?.display_name || "";

  const subject = `Interview — ${providerName} × ${studentName}`;
  const body = `Hi ${firstName},\n\nWe'd like to schedule a brief interview to learn more about your availability and experience. Are you free this week for a 15-minute call?\n\nBest,\n${providerName}`;
  const scheduleHref = studentEmail
    ? `mailto:${studentEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    : null;

  const handleSendInvitation = useCallback(async () => {
    // Auth gate: if not logged in or no provider profile, prompt auth
    if (requiresAuth || requiresProviderProfile) {
      handleAuthRequired();
      return;
    }
    if (!activeProfile) return;

    setSending(true);
    setError("");

    try {
      const res = await fetch("/api/medjobs/apply-to-provider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerProfileId: studentId,
          message: message.trim() || `We'd like to invite you to work with us at ${providerName}.`,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to send invitation");
        return;
      }

      setSent(true);
      setShowInviteForm(false);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSending(false);
    }
  }, [activeProfile, studentId, message, providerName, requiresAuth, requiresProviderProfile, handleAuthRequired]);

  // ── Sticky mobile bar ──
  if (variant === "sticky") {
    // If not authenticated, show auth-gated CTA
    if (requiresAuth || requiresProviderProfile) {
      return (
        <div className="fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-sm border-t border-gray-200 px-4 py-3 safe-area-pb">
          <button
            onClick={handleAuthRequired}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 hover:bg-gray-800 rounded-xl text-sm font-semibold text-white transition-colors"
          >
            <CalendarIcon />
            Schedule Interview
          </button>
        </div>
      );
    }

    return (
      <div className="fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-sm border-t border-gray-200 px-4 py-3 safe-area-pb">
        <div className="flex gap-2">
          {scheduleHref && (
            <a
              href={scheduleHref}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 hover:bg-gray-800 rounded-xl text-sm font-semibold text-white transition-colors"
            >
              <CalendarIcon />
              Schedule Interview
            </a>
          )}
          {studentPhone && (
            <a
              href={`tel:${studentPhone}`}
              className="w-12 h-12 flex items-center justify-center bg-primary-50 hover:bg-primary-100 rounded-xl transition-colors"
            >
              <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
            </a>
          )}
        </div>
      </div>
    );
  }

  // ── Sidebar variant (desktop) ──
  // If not authenticated, show auth-gated UI
  if (requiresAuth || requiresProviderProfile) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
        <div className="text-center py-2">
          <p className="text-sm text-gray-500 mb-4">
            Sign in to contact {firstName} and schedule an interview
          </p>
          <button
            onClick={handleAuthRequired}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-gray-900 hover:bg-gray-800 rounded-xl text-sm font-semibold text-white transition-colors"
          >
            <CalendarIcon />
            Schedule Interview
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
      {/* Contact Info */}
      {(studentEmail || studentPhone) && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-900">Contact Info</h3>
          {studentEmail && (
            <a
              href={`mailto:${studentEmail}`}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600 transition-colors"
            >
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              <span className="truncate">{studentEmail}</span>
            </a>
          )}
          {studentPhone && (
            <a
              href={`tel:${studentPhone}`}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600 transition-colors"
            >
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
              {studentPhone}
            </a>
          )}
        </div>
      )}

      {/* Primary CTA - Schedule Interview */}
      {scheduleHref && (
        <a
          href={scheduleHref}
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-gray-900 hover:bg-gray-800 rounded-xl text-sm font-semibold text-white transition-colors"
        >
          <CalendarIcon />
          Schedule Interview
        </a>
      )}

      {/* Send Invitation */}
      {sent ? (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700 font-medium text-center">
          Invitation sent to {firstName}!
        </div>
      ) : showInviteForm ? (
        <div className="space-y-3">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            placeholder={`Hi ${firstName}, we'd love to have you on our team...`}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none text-sm"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleSendInvitation}
              disabled={sending}
              className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 rounded-xl text-sm font-semibold text-white transition-colors"
            >
              {sending ? "Sending..." : "Send"}
            </button>
            <button
              onClick={() => setShowInviteForm(false)}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowInviteForm(true)}
          className="w-full px-4 py-2.5 border border-primary-200 text-primary-700 hover:bg-primary-50 rounded-xl text-sm font-medium transition-colors"
        >
          Send Connection Request
        </button>
      )}
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  );
}
