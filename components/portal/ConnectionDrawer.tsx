"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { canEngage } from "@/lib/membership";
import { useAuth } from "@/components/auth/AuthProvider";
import type { Connection, ConnectionStatus, Profile } from "@/lib/types";
import Button from "@/components/ui/Button";
import UpgradePrompt from "@/components/providers/UpgradePrompt";

interface ConnectionDetail extends Connection {
  fromProfile: Profile | null;
  toProfile: Profile | null;
}

interface ConnectionDrawerProps {
  connectionId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: (connectionId: string, newStatus: ConnectionStatus) => void;
}

/** Parse the connection message JSON for display */
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
        ? String(p.care_recipient).replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())
        : undefined,
      careType: p.care_type
        ? String(p.care_type).replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())
        : undefined,
      urgency: p.urgency
        ? String(p.urgency).replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())
        : undefined,
      notes: p.additional_notes || undefined,
    };
  } catch {
    return null;
  }
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  pending: { label: "Pending", color: "text-amber-700", bg: "bg-amber-50", dot: "bg-amber-400" },
  accepted: { label: "Connected", color: "text-emerald-700", bg: "bg-emerald-50", dot: "bg-emerald-400" },
  declined: { label: "Declined", color: "text-gray-500", bg: "bg-gray-100", dot: "bg-gray-400" },
  archived: { label: "Archived", color: "text-gray-500", bg: "bg-gray-100", dot: "bg-gray-400" },
};

/** Deterministic gradient for fallback avatars */
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

function blurName(name: string): string {
  if (!name) return "***";
  return name
    .split(" ")
    .map((p) => p.charAt(0) + "***")
    .join(" ");
}

export default function ConnectionDrawer({
  connectionId,
  isOpen,
  onClose,
  onStatusChange,
}: ConnectionDrawerProps) {
  const { activeProfile, membership } = useAuth();
  const panelRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [connection, setConnection] = useState<ConnectionDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [responding, setResponding] = useState(false);
  const [error, setError] = useState("");

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const isProvider =
    activeProfile?.type === "organization" ||
    activeProfile?.type === "caregiver";

  const hasFullAccess = canEngage(
    activeProfile?.type,
    membership,
    "view_inquiry_details"
  );

  // Mount + animation (matches ProfileEditDrawer pattern)
  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setVisible(true));
      document.body.style.overflow = "hidden";
    } else {
      setVisible(false);
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // Fetch connection data when opened
  useEffect(() => {
    if (!isOpen || !connectionId || !activeProfile || !isSupabaseConfigured()) {
      return;
    }

    setLoading(true);
    setError("");
    setConnection(null);

    const fetchConnection = async () => {
      const supabase = createClient();

      const { data, error: fetchError } = await supabase
        .from("connections")
        .select(
          "id, type, status, from_profile_id, to_profile_id, message, created_at, updated_at"
        )
        .eq("id", connectionId)
        .single();

      if (fetchError || !data) {
        setError("Connection not found.");
        setLoading(false);
        return;
      }

      const conn = data as Connection;

      if (
        conn.from_profile_id !== activeProfile.id &&
        conn.to_profile_id !== activeProfile.id
      ) {
        setError("Connection not found.");
        setLoading(false);
        return;
      }

      const profileIds = [conn.from_profile_id, conn.to_profile_id];
      const { data: profileData } = await supabase
        .from("business_profiles")
        .select(
          "id, display_name, description, image_url, city, state, type, email, phone, website, slug, care_types, category, source_provider_id"
        )
        .in("id", profileIds);

      let profiles = (profileData as Profile[]) || [];

      // For profiles missing image_url, try to get image from iOS olera-providers
      const missingImageIds = profiles
        .filter((p) => !p.image_url && p.source_provider_id)
        .map((p) => p.source_provider_id as string);

      if (missingImageIds.length > 0) {
        const { data: iosProviders } = await supabase
          .from("olera-providers")
          .select("provider_id, provider_logo, provider_images")
          .in("provider_id", missingImageIds);

        if (iosProviders?.length) {
          const iosMap = new Map(
            iosProviders.map((p: { provider_id: string; provider_logo: string | null; provider_images: string | null }) => [
              p.provider_id,
              p.provider_logo || (p.provider_images?.split(" | ")[0]) || null,
            ])
          );
          profiles = profiles.map((p) => {
            if (!p.image_url && p.source_provider_id && iosMap.has(p.source_provider_id)) {
              return { ...p, image_url: iosMap.get(p.source_provider_id) || null };
            }
            return p;
          });
        }
      }

      const profileMap = new Map(profiles.map((p) => [p.id, p]));

      setConnection({
        ...conn,
        fromProfile: profileMap.get(conn.from_profile_id) || null,
        toProfile: profileMap.get(conn.to_profile_id) || null,
      });
      setLoading(false);
    };

    fetchConnection();
  }, [isOpen, connectionId, activeProfile]);

  // Keyboard dismiss
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onCloseRef.current();
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleKeyDown]);

  // Scroll to top when connection changes
  useEffect(() => {
    if (isOpen && panelRef.current) {
      panelRef.current.scrollTop = 0;
    }
  }, [isOpen, connectionId]);

  const handleStatusUpdate = async (
    newStatus: "accepted" | "declined" | "archived"
  ) => {
    if (!isSupabaseConfigured() || !activeProfile || !connection) return;

    setResponding(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from("connections")
        .update({ status: newStatus })
        .eq("id", connection.id);

      if (updateError) throw new Error(updateError.message);
      setConnection((prev) =>
        prev ? { ...prev, status: newStatus } : null
      );
      onStatusChange?.(connection.id, newStatus);
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? (err as { message: string }).message
          : String(err);
      setError(msg);
    } finally {
      setResponding(false);
    }
  };

  if (!mounted || !isOpen) return null;

  // Derived values
  const isInbound = connection
    ? connection.to_profile_id === activeProfile?.id
    : false;
  const otherProfile = connection
    ? isInbound
      ? connection.fromProfile
      : connection.toProfile
    : null;
  const shouldBlur = isProvider && !hasFullAccess && isInbound;

  const status = STATUS_CONFIG[connection?.status || "pending"] || STATUS_CONFIG.pending;
  const otherName = otherProfile?.display_name || "Unknown";
  const otherLocation = otherProfile
    ? [otherProfile.city, otherProfile.state].filter(Boolean).join(", ")
    : "";
  const imageUrl = otherProfile?.image_url;
  const initial = otherName.charAt(0).toUpperCase();
  const parsedMsg = connection ? parseMessage(connection.message) : null;

  const profileHref = otherProfile
    ? (otherProfile.type === "organization" || otherProfile.type === "caregiver") && otherProfile.slug
      ? `/provider/${otherProfile.slug}`
      : `/profile/${otherProfile.id}`
    : "#";

  const categoryLabel = otherProfile?.category
    ? otherProfile.category
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c: string) => c.toUpperCase())
    : otherProfile?.type === "organization"
    ? "Organization"
    : otherProfile?.type === "caregiver"
    ? "Caregiver"
    : "Family";

  const shortDate = connection
    ? new Date(connection.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : "";

  // Build natural language summary for chat bubble
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

  const drawerContent = (
    <div
      className={`fixed inset-0 z-[60] transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="Connection details"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-[2px]"
        onClick={() => onCloseRef.current()}
      />

      {/* Panel */}
      <div
        className={`absolute right-0 top-0 h-full w-full max-w-[480px] bg-white shadow-xl flex flex-col transition-transform duration-300 ease-out ${
          visible ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between shrink-0">
          <h3 className="text-xl font-bold text-gray-900">Connection</h3>
          <button
            type="button"
            onClick={() => onCloseRef.current()}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div ref={panelRef} className="flex-1 overflow-y-auto">
          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin w-7 h-7 border-[3px] border-primary-600 border-t-transparent rounded-full" />
            </div>
          )}

          {/* Error */}
          {error && !connection && (
            <div className="px-6 py-8">
              <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-base">
                {error}
              </div>
            </div>
          )}

          {connection && !loading && (
            <>
              {/* ── Provider Info ── */}
              <div className="px-6 pt-6 pb-5">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="shrink-0">
                    {imageUrl && !shouldBlur ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={imageUrl}
                        alt={otherName}
                        className="w-14 h-14 rounded-xl object-cover"
                      />
                    ) : (
                      <div
                        className="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold text-white"
                        style={{ background: shouldBlur ? "#9ca3af" : avatarGradient(otherName) }}
                      >
                        {shouldBlur ? "?" : initial}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1 pt-0.5">
                    <h2 className="text-xl font-bold text-gray-900 leading-snug">
                      {shouldBlur ? blurName(otherName) : otherName}
                    </h2>
                    {otherLocation && !shouldBlur && (
                      <p className="text-base text-gray-500 mt-0.5">{otherLocation}</p>
                    )}
                    {!shouldBlur && (
                      <p className="text-sm text-gray-400 mt-0.5">{categoryLabel}</p>
                    )}
                    {otherProfile && !shouldBlur && (
                      <Link
                        href={profileHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors mt-2"
                      >
                        View provider profile
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </Link>
                    )}
                  </div>
                </div>

                {/* Status badge */}
                <div className="mt-4">
                  <span className={`inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1 rounded-full ${status.bg} ${status.color}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                    {status.label}
                  </span>
                </div>
              </div>

              {/* ── Conversation ── */}
              <div className="mx-6 border-t border-gray-100" />
              <div className="px-6 py-5">
                <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                  Conversation
                </p>

                <div className="space-y-4">
                  {/* Connection request bubble */}
                  {!shouldBlur && (
                    <div className={`flex ${isInbound ? "justify-start" : "justify-end"}`}>
                      <div className="max-w-[85%]">
                        <div className={`rounded-2xl px-4 py-3 ${
                          isInbound
                            ? "bg-gray-100 text-gray-800 rounded-tl-sm"
                            : "bg-primary-600 text-white rounded-tr-sm"
                        }`}>
                          <p className={`text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                            isInbound ? "text-gray-400" : "text-primary-100"
                          }`}>
                            Connection request
                          </p>
                          {summary && (
                            <p className="text-base leading-relaxed">{summary}</p>
                          )}
                          {parsedMsg?.notes && (
                            <p className={`text-base italic mt-1.5 ${
                              isInbound ? "text-gray-600" : "text-primary-100"
                            }`}>
                              &ldquo;{parsedMsg.notes}&rdquo;
                            </p>
                          )}
                        </div>
                        <p className={`text-xs mt-1 ${
                          isInbound ? "text-left" : "text-right"
                        } text-gray-400`}>
                          {shortDate}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* System note */}
                  <SystemNote
                    connection={connection}
                    otherName={shouldBlur ? blurName(otherName) : otherName}
                    shouldBlur={shouldBlur}
                  />

                  {/* Provider responded (accepted, outbound = care seeker view) */}
                  {connection.status === "accepted" && !shouldBlur && otherProfile && !isInbound && (
                    <div className="flex justify-start">
                      <div className="max-w-[85%]">
                        <div className="bg-gray-100 text-gray-800 rounded-2xl rounded-tl-sm px-4 py-3">
                          <p className="text-base leading-relaxed">
                            {otherName} has accepted your connection request. You can now get in touch directly.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Provider accepted (accepted, inbound = provider view) */}
                  {connection.status === "accepted" && !shouldBlur && isInbound && (
                    <div className="flex justify-end">
                      <div className="max-w-[85%]">
                        <div className="bg-primary-600 text-white rounded-2xl rounded-tr-sm px-4 py-3">
                          <p className="text-base leading-relaxed">
                            You accepted this connection. Reach out to start the conversation.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Message Input (placeholder) ── */}
              {(connection.status === "pending" || connection.status === "accepted") && !shouldBlur && (
                <>
                  <div className="mx-6 border-t border-gray-100" />
                  <div className="px-6 py-4">
                    <div className="flex gap-2">
                      <div className="flex-1 bg-gray-100 rounded-xl px-4 py-3 text-base text-gray-400 cursor-not-allowed min-h-[44px] flex items-center">
                        Add a message...
                      </div>
                      <button
                        type="button"
                        disabled
                        className="px-4 py-3 rounded-xl bg-gray-100 text-gray-300 text-base font-medium cursor-not-allowed min-h-[44px]"
                      >
                        Send
                      </button>
                    </div>
                    <p className="text-sm text-gray-400 mt-1.5 text-center">
                      Messaging coming soon
                    </p>
                  </div>
                </>
              )}

              {/* ── Get in Touch (accepted) ── */}
              {connection.status === "accepted" && otherProfile && !shouldBlur && (
                <>
                  <div className="mx-6 border-t border-gray-100" />
                  <div className="px-6 py-5">
                    <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                      Get in touch
                    </p>
                    <div className="space-y-2">
                      {otherProfile.phone && (
                        <a
                          href={`tel:${otherProfile.phone}`}
                          className="w-full flex items-center justify-center gap-2 bg-white border-2 border-gray-200 rounded-xl px-4 py-3.5 text-base font-medium text-gray-900 hover:border-primary-300 hover:bg-primary-50/30 transition-colors"
                        >
                          <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          {otherProfile.phone}
                        </a>
                      )}
                      {otherProfile.email && (
                        <a
                          href={`mailto:${otherProfile.email}?subject=${encodeURIComponent(`Scheduling a visit \u2014 ${otherProfile.display_name}`)}`}
                          className="w-full flex items-center justify-center gap-2 bg-white border-2 border-gray-200 rounded-xl px-4 py-3.5 text-base font-medium text-gray-900 hover:border-primary-300 hover:bg-primary-50/30 transition-colors"
                        >
                          <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          Email {otherProfile.display_name?.split(" ")[0]}
                        </a>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* ── Provider Actions: Pending Inbound ── */}
              {isInbound && hasFullAccess && connection.status === "pending" && (
                <>
                  <div className="mx-6 border-t border-gray-100" />
                  <div className="px-6 py-5 flex gap-3">
                    <Button
                      onClick={() => handleStatusUpdate("accepted")}
                      loading={responding}
                      className="flex-1"
                    >
                      Accept
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => handleStatusUpdate("declined")}
                      loading={responding}
                      className="flex-1"
                    >
                      Decline
                    </Button>
                  </div>
                </>
              )}

              {/* ── Declined Action ── */}
              {connection.status === "declined" && !shouldBlur && (
                <>
                  <div className="mx-6 border-t border-gray-100" />
                  <div className="px-6 py-5">
                    <Link
                      href="/browse"
                      className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
                    >
                      Browse similar providers &rarr;
                    </Link>
                  </div>
                </>
              )}

              {/* ── Upgrade Prompt (blurred) ── */}
              {shouldBlur && (
                <div className="px-6 py-5">
                  <UpgradePrompt context="view full details and respond" />
                </div>
              )}

              {/* ── Error ── */}
              {error && (
                <div className="px-6 pb-5">
                  <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-base">
                    {error}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(drawerContent, document.body);
}

// ── System Note ──

function SystemNote({
  connection,
  otherName,
  shouldBlur,
}: {
  connection: ConnectionDetail;
  otherName: string;
  shouldBlur: boolean;
}) {
  let text: string | null = null;
  let color = "text-gray-500 bg-gray-100";

  switch (connection.status) {
    case "pending":
      text = "Sent \u00b7 Providers typically respond within a few hours";
      break;
    case "accepted":
      text = shouldBlur ? "Provider responded" : `\u2713 ${otherName} responded`;
      color = "text-emerald-700 bg-emerald-50";
      break;
    case "declined":
      text = shouldBlur ? "Provider isn\u2019t taking new clients" : `${otherName} isn\u2019t taking new clients`;
      color = "text-gray-500 bg-gray-100";
      break;
    case "archived":
      text = "Connection archived";
      break;
  }

  if (!text) return null;

  return (
    <div className="flex justify-center">
      <span className={`text-sm font-medium px-3 py-1.5 rounded-full ${color}`}>
        {text}
      </span>
    </div>
  );
}
