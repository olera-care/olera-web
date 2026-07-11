"use client";

/**
 * Cold Outreach Demo Drawer
 *
 * Shows provider detail with:
 * - Provider info card
 * - Sequence timeline
 * - Engagement signals
 * - Email preview
 * - Action buttons
 */

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

type OutreachStage = "not_started" | "sending" | "awaiting_response" | "completed" | "closed";

type ProviderRow = {
  id: string;
  slug: string;
  name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  category: string | null;
  views: number;
  created_at: string;
  stage: OutreachStage;
  sequence_started_at: string | null;
  email1_sent_at: string | null;
  email1_opened: boolean;
  email1_clicked: boolean;
  email2_sent_at: string | null;
  email2_opened: boolean;
  responded: boolean;
};

interface DrawerProps {
  provider: ProviderRow;
  onClose: () => void;
  onAction: () => void;
}

// ============================================================
// Icons
// ============================================================

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
    </svg>
  );
}

// ============================================================
// Status Badge
// ============================================================

const STAGE_LABELS: Record<OutreachStage, string> = {
  not_started: "Not Started",
  sending: "Sending",
  awaiting_response: "Needs Follow-up",
  completed: "Claimed",
  closed: "Closed",
};

const STAGE_COLORS: Record<OutreachStage, string> = {
  not_started: "bg-gray-100 text-gray-700",
  sending: "bg-blue-100 text-blue-700",
  awaiting_response: "bg-amber-100 text-amber-700",
  completed: "bg-emerald-100 text-emerald-700",
  closed: "bg-gray-100 text-gray-500",
};

function StageBadge({ stage }: { stage: OutreachStage }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${STAGE_COLORS[stage]}`}>
      {STAGE_LABELS[stage]}
    </span>
  );
}

// ============================================================
// Copy Button
// ============================================================

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="group flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
    >
      {copied ? (
        <CheckIcon className="h-4 w-4 text-emerald-500" />
      ) : (
        <CopyIcon className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
      )}
      {label}
    </button>
  );
}

// ============================================================
// Main Drawer
// ============================================================

export function ColdOutreachDrawer({ provider, onClose, onAction }: DrawerProps) {
  const [actionLoading, setActionLoading] = useState(false);

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const handleStartSequence = async () => {
    setActionLoading(true);
    // Simulate API delay
    await new Promise((r) => setTimeout(r, 1000));
    setActionLoading(false);
    onAction();
  };

  const location = [provider.city, provider.state].filter(Boolean).join(", ") || "Location not set";
  const category = provider.category
    ?.replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Drawer */}
      <div className="relative z-10 flex h-full w-full max-w-xl flex-col bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{provider.name}</h2>
            <p className="text-sm text-gray-500 mt-0.5">{location}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Status + Stats */}
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <StageBadge stage={provider.stage} />
              {provider.views > 0 && (
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">{provider.views}</p>
                  <p className="text-xs text-gray-500">profile views</p>
                </div>
              )}
            </div>
          </div>

          {/* Contact Info */}
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Contact</h3>
            <div className="space-y-2">
              {provider.email && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{provider.email}</span>
                  <CopyButton text={provider.email} label="Copy" />
                </div>
              )}
              {provider.phone && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{provider.phone}</span>
                  <CopyButton text={provider.phone} label="Copy" />
                </div>
              )}
              {!provider.email && !provider.phone && (
                <p className="text-sm text-gray-400">No contact info available</p>
              )}
            </div>
            {category && (
              <p className="text-xs text-gray-400 mt-3">{category}</p>
            )}
          </div>

          {/* Sequence Timeline */}
          {provider.stage !== "not_started" && (
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Sequence Timeline</h3>
              <div className="space-y-3">
                {/* Email 1 */}
                <TimelineItem
                  label="Email 1 sent"
                  timestamp={provider.email1_sent_at}
                  completed={!!provider.email1_sent_at}
                  engagement={
                    provider.email1_opened
                      ? provider.email1_clicked
                        ? "Opened & Clicked"
                        : "Opened"
                      : undefined
                  }
                />

                {/* Wait period */}
                {provider.email1_sent_at && !provider.email2_sent_at && (
                  <TimelineItem
                    label="Waiting 3 days..."
                    timestamp={null}
                    completed={false}
                    pending
                  />
                )}

                {/* Email 2 */}
                {provider.email2_sent_at && (
                  <TimelineItem
                    label="Email 2 sent"
                    timestamp={provider.email2_sent_at}
                    completed={true}
                    engagement={provider.email2_opened ? "Opened" : undefined}
                  />
                )}

                {/* Response */}
                {provider.responded && (
                  <TimelineItem
                    label="Provider claimed profile"
                    timestamp={null}
                    completed={true}
                    success
                  />
                )}
              </div>
            </div>
          )}

          {/* Email Preview - show for not_started */}
          {provider.stage === "not_started" && (
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Email Preview</h3>
              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-4 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <Image
                      src="/images/for-providers/team/logan.jpg"
                      alt="Logan"
                      width={36}
                      height={36}
                      className="w-9 h-9 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Dr. Logan DuBose</p>
                      <p className="text-xs text-gray-400">logan@olera.care</p>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-sm font-medium text-gray-900 mb-2">
                    Subject: Families are looking at your listing on Olera
                  </p>
                  <p className="text-sm text-gray-600">
                    Hi,
                    <br /><br />
                    We found your listing on the web and added it to Olera so families searching for senior care can discover you.
                  </p>
                  {provider.views > 0 && (
                    <div className="mt-3 p-3 bg-primary-50 border border-primary-100 rounded-lg">
                      <p className="text-sm font-semibold text-primary-900">
                        {provider.views} families viewed your profile this month.
                      </p>
                    </div>
                  )}
                  <p className="text-sm text-gray-600 mt-3">
                    Complete your profile so families can see your photos, services, and what makes you special.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Engagement Summary - show for sending/awaiting */}
          {(provider.stage === "sending" || provider.stage === "awaiting_response") && (
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Engagement</h3>
              <div className="flex flex-wrap gap-2">
                {provider.email1_opened && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700">
                    👁 Email opened
                  </span>
                )}
                {provider.email1_clicked && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700">
                    🔗 Link clicked
                  </span>
                )}
                {provider.email2_opened && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700">
                    👁 Email 2 opened
                  </span>
                )}
                {!provider.email1_opened && !provider.email1_clicked && (
                  <span className="text-sm text-gray-400">No engagement yet</span>
                )}
              </div>
            </div>
          )}

          {/* Links */}
          <div className="px-6 py-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Links</h3>
            <div className="flex flex-wrap gap-2">
              {provider.slug && (
                <Link
                  href={`/browse/${provider.slug}`}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  View Profile
                  <ExternalLinkIcon className="h-3.5 w-3.5" />
                </Link>
              )}
              <Link
                href={`/admin/directory/${provider.id}`}
                target="_blank"
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Admin Directory
                <ExternalLinkIcon className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-100 px-6 py-4">
          {provider.stage === "not_started" ? (
            <button
              onClick={handleStartSequence}
              disabled={actionLoading || !provider.email}
              className="w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading ? "Starting..." : "Start Sequence"}
            </button>
          ) : provider.stage === "awaiting_response" ? (
            <div className="flex gap-3">
              <button
                onClick={onAction}
                className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Mark Closed
              </button>
              <button
                onClick={onAction}
                className="flex-1 rounded-xl bg-gray-900 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800"
              >
                Resend Email
              </button>
            </div>
          ) : (
            <button
              onClick={onClose}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Close
            </button>
          )}

          {provider.stage === "not_started" && !provider.email && (
            <p className="text-xs text-amber-600 mt-2 text-center">
              No email address — sequence cannot start
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Timeline Item
// ============================================================

function TimelineItem({
  label,
  timestamp,
  completed,
  engagement,
  pending,
  success,
}: {
  label: string;
  timestamp: string | null;
  completed: boolean;
  engagement?: string;
  pending?: boolean;
  success?: boolean;
}) {
  const formatDate = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex items-start gap-3">
      {/* Icon */}
      <div
        className={`flex h-6 w-6 items-center justify-center rounded-full ${
          success
            ? "bg-emerald-100"
            : completed
            ? "bg-blue-100"
            : pending
            ? "bg-gray-100"
            : "bg-gray-100"
        }`}
      >
        {success ? (
          <CheckIcon className="h-3.5 w-3.5 text-emerald-600" />
        ) : completed ? (
          <CheckIcon className="h-3.5 w-3.5 text-blue-600" />
        ) : pending ? (
          <div className="h-2 w-2 rounded-full bg-gray-300 animate-pulse" />
        ) : (
          <div className="h-2 w-2 rounded-full bg-gray-300" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${completed || success ? "text-gray-900" : "text-gray-500"}`}>
          {label}
        </p>
        {timestamp && (
          <p className="text-xs text-gray-400">{formatDate(timestamp)}</p>
        )}
        {engagement && (
          <p className="text-xs text-emerald-600 mt-0.5">{engagement}</p>
        )}
      </div>
    </div>
  );
}
