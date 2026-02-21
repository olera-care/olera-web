"use client";

import { useState } from "react";
import Link from "next/link";
import type { Connection, Profile } from "@/lib/types";
import {
  getFamilyDisplayStatus,
  FAMILY_STATUS_CONFIG,
  type FamilyDisplayStatus,
} from "@/lib/connection-utils";
import Button from "@/components/ui/Button";

// ── Shared connection with profile data ──

export interface ConnectionWithProfile extends Connection {
  fromProfile: Profile | null;
  toProfile: Profile | null;
}

interface ConnectionDetailPanelProps {
  connection: ConnectionWithProfile;
  activeProfileId: string;
  onClose: () => void;
  onWithdraw: (connectionId: string) => void;
  onHide: (connectionId: string) => void;
  onConnectAgain: (connection: ConnectionWithProfile) => void;
}

// ── Helpers (ported from ConnectionDrawer) ──

function parseMessage(message: string | null): {
  careRecipient?: string;
  careType?: string;
  urgency?: string;
  notes?: string;
} | null {
  if (!message) return null;
  try {
    const p = JSON.parse(message);
    return {
      careRecipient: p.care_recipient
        ? String(p.care_recipient)
            .replace(/_/g, " ")
            .replace(/\b\w/g, (c: string) => c.toUpperCase())
        : undefined,
      careType: p.care_type
        ? String(p.care_type)
            .replace(/_/g, " ")
            .replace(/\b\w/g, (c: string) => c.toUpperCase())
        : undefined,
      urgency: p.urgency
        ? String(p.urgency)
            .replace(/_/g, " ")
            .replace(/\b\w/g, (c: string) => c.toUpperCase())
        : undefined,
      notes: p.additional_notes || undefined,
    };
  } catch {
    return null;
  }
}

function avatarGradient(name: string): string {
  const gradients = [
    "linear-gradient(135deg, #0ea5e9, #6366f1)",
    "linear-gradient(135deg, #14b8a6, #0ea5e9)",
    "linear-gradient(135deg, #8b5cf6, #ec4899)",
    "linear-gradient(135deg, #f59e0b, #ef4444)",
    "linear-gradient(135deg, #10b981, #14b8a6)",
    "linear-gradient(135deg, #6366f1, #a855f7)",
    "linear-gradient(135deg, #ec4899, #f43f5e)",
    "linear-gradient(135deg, #0891b2, #2dd4bf)",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
}

// ── Main Component ──

export default function ConnectionDetailPanel({
  connection,
  activeProfileId,
  onClose,
  onWithdraw,
  onHide,
  onConnectAgain,
}: ConnectionDetailPanelProps) {
  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [removing, setRemoving] = useState(false);

  const isInbound = connection.to_profile_id === activeProfileId;
  const otherProfile = isInbound
    ? connection.fromProfile
    : connection.toProfile;
  const otherName = otherProfile?.display_name || "Unknown";
  const otherLocation = otherProfile
    ? [otherProfile.city, otherProfile.state].filter(Boolean).join(", ")
    : "";
  const imageUrl = otherProfile?.image_url;
  const initial = otherName.charAt(0).toUpperCase();

  const displayStatus = getFamilyDisplayStatus(connection);
  const statusConfig = FAMILY_STATUS_CONFIG[displayStatus];

  const parsedMsg = parseMessage(connection.message);
  const categoryLabel = otherProfile?.category
    ? otherProfile.category
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c: string) => c.toUpperCase())
    : otherProfile?.type === "organization"
    ? "Organization"
    : otherProfile?.type === "caregiver"
    ? "Caregiver"
    : "Family";

  const shortDate = new Date(connection.created_at).toLocaleDateString(
    "en-US",
    { month: "short", day: "numeric" }
  );

  const profileHref = otherProfile
    ? (otherProfile.type === "organization" ||
        otherProfile.type === "caregiver") &&
      otherProfile.slug
      ? `/provider/${otherProfile.slug}`
      : `/profile/${otherProfile.id}`
    : "#";

  // Build summary for chat bubble
  const buildSummary = () => {
    if (!parsedMsg) return null;
    const parts: string[] = [];
    if (parsedMsg.careType) {
      parts.push(`I'm looking for ${parsedMsg.careType.toLowerCase()}`);
    }
    if (parsedMsg.careRecipient) {
      parts.push(`for ${parsedMsg.careRecipient.toLowerCase()}`);
    }
    if (parsedMsg.urgency) {
      parts.push(`needed ${parsedMsg.urgency.toLowerCase()}`);
    }
    return parts.length > 0 ? `Hi, ${parts.join(" ")}.` : null;
  };
  const summary = buildSummary();

  // Contact info — only for responded connections
  const isResponded = displayStatus === "responded";
  const hasPhone = isResponded && otherProfile?.phone;
  const hasEmail = isResponded && otherProfile?.email;

  // Which actions to show
  const isPending = displayStatus === "pending";
  const isPast =
    displayStatus === "declined" ||
    displayStatus === "withdrawn" ||
    displayStatus === "expired";

  const handleWithdraw = async () => {
    setWithdrawing(true);
    onWithdraw(connection.id);
    setShowWithdrawConfirm(false);
    setWithdrawing(false);
  };

  const handleRemove = async () => {
    setRemoving(true);
    onHide(connection.id);
    setShowRemoveConfirm(false);
    setRemoving(false);
  };

  return (
    <div className="h-full flex flex-col border-l border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-end px-6 pt-5 pb-3 shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* ── Provider Info ── */}
        <div className="px-6 pb-5">
          <div className="flex items-start gap-3">
            {/* Avatar */}
            <div className="shrink-0">
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl}
                  alt={otherName}
                  className="w-[52px] h-[52px] rounded-xl object-cover"
                />
              ) : (
                <div
                  className="w-[52px] h-[52px] rounded-xl flex items-center justify-center text-xl font-bold text-white"
                  style={{ background: avatarGradient(otherName) }}
                >
                  {initial}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <p className="text-base font-bold text-gray-900 leading-snug">
                {otherName}
              </p>
              {otherLocation && (
                <p className="text-xs text-gray-500 mt-0.5">{otherLocation}</p>
              )}
              <div className="flex items-center gap-2 mt-1">
                {otherProfile?.source_provider_id && (
                  <>
                    <span className="text-sm font-bold text-gray-900">
                      {/* Rating placeholder */}
                    </span>
                  </>
                )}
                <Link
                  href={profileHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary-600 hover:text-primary-700 underline transition-colors"
                >
                  View profile
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Status badge */}
        <div className="px-6 pb-4">
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg ${statusConfig.bg} ${statusConfig.color}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
            {statusConfig.label}
          </span>
        </div>

        {/* Divider */}
        <div className="mx-6 border-t border-gray-200" />

        {/* ── Conversation ── */}
        <div className="px-6 py-5">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-4">
            Conversation
          </p>

          <div className="space-y-4">
            {/* Connection request bubble (sent by care seeker) */}
            <div className="flex justify-end">
              <div className="max-w-[85%]">
                <div className="bg-primary-600 text-white rounded-2xl rounded-tr-sm px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wider mb-1.5 text-primary-100">
                    Connection request
                  </p>
                  {summary && (
                    <p className="text-sm leading-relaxed">{summary}</p>
                  )}
                  {parsedMsg?.notes && (
                    <p className="text-sm italic mt-1.5 text-primary-100">
                      &ldquo;{parsedMsg.notes}&rdquo;
                    </p>
                  )}
                </div>
                <p className="text-[10px] mt-1 text-right text-gray-400">
                  {shortDate}
                </p>
              </div>
            </div>

            {/* System note */}
            <SystemNote
              displayStatus={displayStatus}
              otherName={otherName}
            />

            {/* Provider response bubble (for responded connections) */}
            {isResponded && otherProfile && (
              <div className="flex justify-start">
                <div className="max-w-[85%]">
                  <div className="bg-gray-100 text-gray-800 rounded-2xl rounded-tl-sm px-4 py-3">
                    <p className="text-sm leading-relaxed">
                      {otherName} has accepted your connection request. You can
                      now get in touch directly.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Message Input (placeholder) ── */}
        {(isPending || isResponded) && (
          <>
            <div className="mx-6 border-t border-gray-100" />
            <div className="px-6 py-4">
              <div className="flex gap-2">
                <input
                  placeholder={
                    isResponded
                      ? "Reply to provider..."
                      : "Add a message..."
                  }
                  className="flex-1 px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-primary-600 transition-colors"
                  disabled
                />
                <button
                  type="button"
                  disabled
                  className="w-10 h-10 rounded-lg bg-gray-100 text-gray-300 flex items-center justify-center cursor-not-allowed"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                </button>
              </div>
            </div>
          </>
        )}

        {/* ── Withdraw action (pending only) ── */}
        {isPending && !showWithdrawConfirm && (
          <div className="px-6 pb-4">
            <div className="pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowWithdrawConfirm(true)}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                Withdraw request
              </button>
            </div>
          </div>
        )}

        {/* Withdraw confirmation */}
        {showWithdrawConfirm && (
          <div className="px-6 pb-5">
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <h4 className="text-sm font-bold text-gray-900 mb-1">
                Withdraw request?
              </h4>
              <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                This will cancel your connection request. The provider
                won&apos;t be notified. You can always reconnect later.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowWithdrawConfirm(false)}
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleWithdraw}
                  disabled={withdrawing}
                  className="flex-1 px-3 py-2 rounded-lg bg-red-800 text-sm font-semibold text-white hover:bg-red-900 transition-colors disabled:opacity-50"
                >
                  {withdrawing ? "..." : "Withdraw"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Past connection actions ── */}
        {isPast && !showRemoveConfirm && (
          <div className="px-6 pb-5">
            <div className="flex flex-col gap-2">
              {displayStatus === "expired" && (
                <Button
                  size="sm"
                  onClick={() => onConnectAgain(connection)}
                  className="w-full"
                >
                  Connect again
                </Button>
              )}
              {displayStatus === "declined" && (
                <Link href="/browse" className="block">
                  <button
                    type="button"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-primary-600 hover:bg-primary-50 transition-colors"
                  >
                    Browse similar providers &rarr;
                  </button>
                </Link>
              )}

              {/* Responded: show phone if available */}
              {isResponded && hasPhone && otherProfile && (
                <a
                  href={`tel:${otherProfile.phone}`}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-primary-600 hover:bg-primary-50 transition-colors flex items-center justify-center gap-2"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.24.89.55 1.86.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.95.15 1.92.46 2.81.7A2 2 0 0122 16.92z" />
                  </svg>
                  {otherProfile.phone}
                </a>
              )}

              <button
                type="button"
                onClick={() => setShowRemoveConfirm(true)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
              >
                Remove from list
              </button>
            </div>
          </div>
        )}

        {/* Remove confirmation */}
        {showRemoveConfirm && (
          <div className="px-6 pb-5">
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <h4 className="text-sm font-bold text-gray-900 mb-1">
                Remove from list?
              </h4>
              <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                This connection will be removed from your list. You can always
                reconnect with this provider later.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowRemoveConfirm(false)}
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRemove}
                  disabled={removing}
                  className="flex-1 px-3 py-2 rounded-lg bg-red-800 text-sm font-semibold text-white hover:bg-red-900 transition-colors disabled:opacity-50"
                >
                  {removing ? "..." : "Remove"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Responded actions (phone + contact) ── */}
        {isResponded && !isPast && (
          <div className="px-6 pb-5">
            <div className="pt-4 border-t border-gray-100">
              {hasPhone && otherProfile && (
                <a
                  href={`tel:${otherProfile.phone}`}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-primary-600 hover:bg-primary-50 transition-colors flex items-center justify-center gap-2"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.24.89.55 1.86.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.95.15 1.92.46 2.81.7A2 2 0 0122 16.92z" />
                  </svg>
                  {otherProfile.phone}
                </a>
              )}
              {hasEmail && otherProfile && (
                <a
                  href={`mailto:${otherProfile.email}`}
                  className="mt-2 w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  {otherProfile.email}
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── System Note ──

function SystemNote({
  displayStatus,
  otherName,
}: {
  displayStatus: FamilyDisplayStatus;
  otherName: string;
}) {
  let text: string | null = null;
  let color = "text-gray-500 bg-gray-50";

  switch (displayStatus) {
    case "pending":
      text = "Sent \u00b7 Providers typically respond within a few hours";
      break;
    case "responded":
      text = `\u2713 ${otherName} responded`;
      color = "text-emerald-700 bg-emerald-50";
      break;
    case "declined":
      text = `${otherName} isn\u2019t taking new clients`;
      break;
    case "withdrawn":
      text = "You withdrew this request";
      break;
    case "expired":
      text = `This request expired \u2014 ${otherName} didn\u2019t respond`;
      break;
  }

  if (!text) return null;

  return (
    <div className="flex justify-center">
      <span
        className={`text-xs font-medium px-3 py-1.5 rounded-full ${color}`}
      >
        {text}
      </span>
    </div>
  );
}
