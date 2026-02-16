"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { canEngage } from "@/lib/membership";
import { useAuth } from "@/components/auth/AuthProvider";
import type { Connection, ConnectionStatus, Profile } from "@/lib/types";
import Button from "@/components/ui/Button";
import UpgradePrompt from "@/components/providers/UpgradePrompt";

// ── Shared types ──

export interface ConnectionDetail extends Connection {
  fromProfile: Profile | null;
  toProfile: Profile | null;
}

interface ThreadMessage {
  from_profile_id: string;
  text: string;
  created_at: string;
  type?: string;
  next_step?: string;
}

interface NextStepDef {
  id: string;
  label: string;
  desc: string;
  msg: string;
  emoji: string;
  cardBg: string;
  cardBorder: string;
  iconBg: string;
  iconBorder: string;
  icon: React.ReactNode;
}

// ── Helpers ──

/** Parse the connection message JSON for display */
export function parseMessage(message: string | null): {
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

/** Context-aware status chip config */
export function getStatusConfig(
  status: string,
  isInbound: boolean,
  isWithdrawn: boolean,
  isEnded: boolean
): { label: string; color: string; bg: string; dot: string } {
  if (isEnded) return { label: "Ended", color: "text-gray-500", bg: "bg-gray-100", dot: "bg-gray-400" };
  if (isWithdrawn) return { label: "Withdrawn", color: "text-gray-500", bg: "bg-gray-100", dot: "bg-gray-400" };
  switch (status) {
    case "pending":
      return isInbound
        ? { label: "Needs response", color: "text-amber-700", bg: "bg-amber-50", dot: "bg-amber-400" }
        : { label: "Awaiting reply", color: "text-blue-700", bg: "bg-blue-50", dot: "bg-blue-400" };
    case "accepted":
      return { label: "Connected", color: "text-emerald-700", bg: "bg-emerald-50", dot: "bg-emerald-400" };
    case "declined":
      return { label: "Not available", color: "text-gray-500", bg: "bg-gray-100", dot: "bg-gray-400" };
    case "archived":
      return { label: "Archived", color: "text-gray-500", bg: "bg-gray-100", dot: "bg-gray-400" };
    case "expired":
      return { label: "Expired", color: "text-gray-500", bg: "bg-gray-100", dot: "bg-gray-400" };
    default:
      return { label: "Pending", color: "text-gray-500", bg: "bg-gray-100", dot: "bg-gray-400" };
  }
}

/** Deterministic gradient for fallback avatars */
export function avatarGradient(name: string): string {
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

export function blurName(name: string): string {
  if (!name) return "***";
  return name
    .split(" ")
    .map((p) => p.charAt(0) + "***")
    .join(" ");
}

// ── SVG Icons ──

const PhoneIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

const EmailIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const HomeIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const ClipboardIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);

// ── Props ──

export interface ConnectionDetailContentProps {
  connectionId: string | null;
  onClose: () => void;
  onStatusChange?: (connectionId: string, newStatus: ConnectionStatus) => void;
  onWithdraw?: (connectionId: string) => void;
  onHide?: (connectionId: string) => void;
  /** Pre-fetched connection data — enables instant display */
  preloadedConnection?: ConnectionDetail | null;
  /** Whether the component should actively fetch data. Default true. */
  isActive?: boolean;
  /** Show the "Connection" header bar with close button. Default true. */
  showHeader?: boolean;
}

// ── Component ──

export default function ConnectionDetailContent({
  connectionId,
  onClose,
  onStatusChange,
  onWithdraw,
  onHide,
  preloadedConnection,
  isActive = true,
  showHeader = true,
}: ConnectionDetailContentProps) {
  const { activeProfile, membership } = useAuth();
  const conversationRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);
  const [connection, setConnection] = useState<ConnectionDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [responding, setResponding] = useState(false);
  const [error, setError] = useState("");
  const [confirmAction, setConfirmAction] = useState<"withdraw" | "remove" | "end" | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [nextStepConfirm, setNextStepConfirm] = useState<NextStepDef | null>(null);
  const [nextStepNote, setNextStepNote] = useState("");
  const [nextStepSending, setNextStepSending] = useState(false);
  const [inlineSuccess, setInlineSuccess] = useState<string | null>(null);
  const [confirmCancelNextStep, setConfirmCancelNextStep] = useState(false);

  const isProvider =
    activeProfile?.type === "organization" ||
    activeProfile?.type === "caregiver";

  const hasFullAccess = canEngage(
    activeProfile?.type,
    membership,
    "view_inquiry_details"
  );

  // Load connection data — use preloaded data for instant display,
  // then do a lightweight background refresh for fresh thread/metadata.
  useEffect(() => {
    if (!isActive || !connectionId || !activeProfile || !isSupabaseConfigured()) {
      return;
    }

    setError("");
    setConfirmAction(null);

    // If preloaded data is available, use it immediately (no loading state)
    if (preloadedConnection && preloadedConnection.id === connectionId) {
      setConnection(preloadedConnection as ConnectionDetail);
      setLoading(false);

      // Background refresh: fetch only the connection record for fresh thread/metadata
      const refreshConnection = async () => {
        const supabase = createClient();
        const { data } = await supabase
          .from("connections")
          .select(
            "id, type, status, from_profile_id, to_profile_id, message, metadata, created_at, updated_at"
          )
          .eq("id", connectionId)
          .single();

        if (data) {
          const conn = data as Connection;
          // Update with fresh connection data, keep preloaded profiles
          setConnection((prev) =>
            prev
              ? { ...conn, fromProfile: prev.fromProfile, toProfile: prev.toProfile }
              : null
          );
        }
      };
      refreshConnection();
      return;
    }

    // No preloaded data — full fetch (fallback path)
    setLoading(true);
    setConnection(null);

    const fetchConnection = async () => {
      const supabase = createClient();

      const { data, error: fetchError } = await supabase
        .from("connections")
        .select(
          "id, type, status, from_profile_id, to_profile_id, message, metadata, created_at, updated_at"
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
  }, [isActive, connectionId, activeProfile, preloadedConnection]);

  // Reset state when connection changes
  useEffect(() => {
    if (conversationRef.current) {
      conversationRef.current.scrollTop = 0;
    }
    setMessageText("");
    setNextStepConfirm(null);
    setNextStepNote("");
    setInlineSuccess(null);
    setConfirmCancelNextStep(false);
  }, [connectionId]);

  // ── Handlers ──

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

  const handleWithdraw = async () => {
    if (!connection) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/connections/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId: connection.id }),
      });
      if (!res.ok) throw new Error("Failed to withdraw");
      setConfirmAction(null);
      setInlineSuccess("withdraw");
      setTimeout(() => {
        setConnection((prev) =>
          prev ? { ...prev, status: "expired" as ConnectionStatus, metadata: { ...((prev.metadata || {}) as Record<string, unknown>), withdrawn: true } } : null
        );
        setInlineSuccess(null);
        onWithdraw?.(connection.id);
      }, 2000);
    } catch {
      setError("Failed to withdraw request");
    } finally {
      setActionLoading(false);
    }
  };

  const handleHideInline = async () => {
    if (!connection) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/connections/hide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId: connection.id }),
      });
      if (!res.ok) throw new Error("Failed to hide");
      setConfirmAction(null);
      setInlineSuccess("remove");
      setTimeout(() => {
        setInlineSuccess(null);
        onHide?.(connection.id);
      }, 2000);
    } catch {
      setError("Failed to remove connection");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReconnect = async () => {
    if (!connection) return;
    // Determine the other profile (provider) from connection data
    const isInb = connection.to_profile_id === activeProfile?.id;
    const provider = isInb ? connection.fromProfile : connection.toProfile;
    if (!provider) return;

    setActionLoading(true);
    setError("");
    try {
      // Re-use the original intent data from the connection message
      const parsed = parseMessage(connection.message);
      const res = await fetch("/api/connections/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerId: provider.source_provider_id || provider.id,
          providerName: provider.display_name,
          providerSlug: provider.slug,
          intentData: {
            careRecipient: parsed?.careRecipient?.toLowerCase().replace(/ /g, "_") || null,
            careType: parsed?.careType?.toLowerCase().replace(/ /g, "_") || null,
            urgency: parsed?.urgency?.toLowerCase().replace(/ /g, "_") || null,
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to reconnect");
      }

      setConfirmAction(null);
      setInlineSuccess("reconnect");
      setTimeout(() => {
        setConnection((prev) =>
          prev ? { ...prev, status: "pending" as ConnectionStatus } : null
        );
        setInlineSuccess(null);
        onStatusChange?.(connection.id, "pending" as ConnectionStatus);
      }, 2000);
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? (err as { message: string }).message
          : "Failed to reconnect";
      setError(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEndConnection = async () => {
    if (!connection) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/connections/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId: connection.id }),
      });
      if (!res.ok) throw new Error("Failed to end connection");
      setConfirmAction(null);
      setInlineSuccess("end");
      setTimeout(() => {
        setConnection((prev) =>
          prev
            ? {
                ...prev,
                status: "expired" as ConnectionStatus,
                metadata: {
                  ...((prev.metadata || {}) as Record<string, unknown>),
                  ended: true,
                  next_step_request: null,
                },
              }
            : null
        );
        setInlineSuccess(null);
        onWithdraw?.(connection.id);
      }, 2000);
    } catch {
      setError("Failed to end connection");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!connection || !messageText.trim() || !activeProfile) return;
    setSending(true);
    try {
      const res = await fetch("/api/connections/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connectionId: connection.id,
          text: messageText.trim(),
        }),
      });
      if (!res.ok) throw new Error("Failed to send");
      const data = await res.json();
      setConnection((prev) =>
        prev
          ? {
              ...prev,
              metadata: {
                ...((prev.metadata as Record<string, unknown>) || {}),
                thread: data.thread,
              },
            }
          : null
      );
      setMessageText("");
      requestAnimationFrame(() => {
        conversationRef.current?.scrollTo({
          top: conversationRef.current.scrollHeight,
          behavior: "smooth",
        });
      });
    } catch {
      setError("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleNextStepRequest = async (step: NextStepDef) => {
    if (!connection || !activeProfile) return;
    setNextStepSending(true);
    try {
      const res = await fetch("/api/connections/next-step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connectionId: connection.id,
          action: "request",
          type: step.id,
          note: nextStepNote.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to send request");
      }
      const data = await res.json();
      setConnection((prev) =>
        prev
          ? {
              ...prev,
              metadata: {
                ...((prev.metadata as Record<string, unknown>) || {}),
                thread: data.thread,
                next_step_request: data.next_step_request,
              },
            }
          : null
      );
      setNextStepConfirm(null);
      setNextStepNote("");
      requestAnimationFrame(() => {
        conversationRef.current?.scrollTo({
          top: conversationRef.current.scrollHeight,
          behavior: "smooth",
        });
      });
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? (err as { message: string }).message
          : "Failed to send request";
      setError(msg);
    } finally {
      setNextStepSending(false);
    }
  };

  const handleCancelNextStep = async () => {
    if (!connection) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/connections/next-step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connectionId: connection.id,
          action: "cancel",
        }),
      });
      if (!res.ok) throw new Error("Failed to cancel");
      const data = await res.json();
      setConfirmCancelNextStep(false);
      setConnection((prev) =>
        prev
          ? {
              ...prev,
              metadata: {
                ...((prev.metadata as Record<string, unknown>) || {}),
                thread: data.thread,
                next_step_request: null,
              },
            }
          : null
      );
      requestAnimationFrame(() => {
        conversationRef.current?.scrollTo({
          top: conversationRef.current.scrollHeight,
          behavior: "smooth",
        });
      });
    } catch {
      setError("Failed to cancel request");
    } finally {
      setActionLoading(false);
    }
  };

  // ── Derived values ──

  const isInbound = connection
    ? connection.to_profile_id === activeProfile?.id
    : false;
  const otherProfile = connection
    ? isInbound
      ? connection.fromProfile
      : connection.toProfile
    : null;
  const shouldBlur = isProvider && !hasFullAccess && isInbound;

  const connMetadata = connection?.metadata as Record<string, unknown> | undefined;
  const isWithdrawn = connection?.status === "expired" && connMetadata?.withdrawn === true;
  const isEnded = connection?.status === "expired" && connMetadata?.ended === true;
  const status = getStatusConfig(connection?.status || "pending", isInbound, isWithdrawn, isEnded);
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

  // Contact info — only shown after connection is accepted
  const isAccepted = connection?.status === "accepted";
  const hasPhone = isAccepted && !shouldBlur && otherProfile?.phone;
  const hasEmail = isAccepted && !shouldBlur && otherProfile?.email;

  // Thread messages from metadata
  const thread = (connMetadata?.thread as ThreadMessage[]) || [];

  // Next step request from metadata
  const nextStepRequest = connMetadata?.next_step_request as { type: string; note: string | null; created_at: string } | null;

  // Whether message input should show (pending or accepted, not blurred)
  const showMessageInput =
    connection &&
    (connection.status === "pending" || connection.status === "accepted") &&
    !shouldBlur;

  const messagePlaceholder =
    connection?.status === "accepted"
      ? `Message ${otherName}...`
      : "Add a note...";

  // Whether provider is home care / home health (show home visit option)
  const isHomeCareProvider =
    otherProfile?.category === "home_care_agency" ||
    otherProfile?.category === "home_health_agency";

  // Primary next step — contextual based on provider type
  const primaryNextStep: NextStepDef = isHomeCareProvider
    ? {
        id: "visit",
        label: "Request a home visit",
        desc: "See the care environment firsthand",
        msg: "would like to request a home visit",
        emoji: "\u{1F3E0}",
        cardBg: "bg-amber-50",
        cardBorder: "border-amber-200",
        iconBg: "bg-amber-50",
        iconBorder: "border-amber-200",
        icon: <HomeIcon className="w-4 h-4 text-amber-700" />,
      }
    : {
        id: "consultation",
        label: "Request a consultation",
        desc: "Meet in person or virtually to assess fit",
        msg: "would like to request a consultation",
        emoji: "\u{1FA7A}",
        cardBg: "bg-green-50",
        cardBorder: "border-green-200",
        iconBg: "bg-green-50",
        iconBorder: "border-green-200",
        icon: <ClipboardIcon className="w-4 h-4 text-green-700" />,
      };

  // ── Date separator helpers ──
  const formatDateSeparator = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  const getDateKey = (dateStr: string) => new Date(dateStr).toDateString();

  // ── Conversation thread rendering ──
  const renderConversation = () => {
    const requestDate = connection?.created_at ? getDateKey(connection.created_at) : "";

    return (
      <div className="space-y-4">
        {/* Family's note (if any) as the first message */}
        {!shouldBlur && parsedMsg?.notes && (
          <>
            <div className="flex justify-center py-1">
              <span className="text-[11px] font-medium text-gray-400">
                {connection?.created_at ? formatDateSeparator(connection.created_at) : ""}
              </span>
            </div>
            <div className={`flex ${isInbound ? "justify-start" : "justify-end"}`}>
              <div className="max-w-[85%]">
                <div className={`rounded-2xl px-4 py-3 ${
                  isInbound
                    ? "bg-gray-100 text-gray-800 rounded-tl-sm"
                    : "bg-primary-800 text-white rounded-tr-sm"
                }`}>
                  <p className="text-sm leading-relaxed">{parsedMsg.notes}</p>
                </div>
                <p className={`text-xs mt-1 ${isInbound ? "text-left" : "text-right"} text-gray-400`}>
                  {shortDate}
                </p>
              </div>
            </div>
          </>
        )}

        {/* Connected milestone marker */}
        {connection!.status === "accepted" && !shouldBlur && (
          <div className="flex justify-center py-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
              &#10003; Connected
            </span>
          </div>
        )}

        {/* Upgrade Prompt (blurred) */}
        {shouldBlur && (
          <div className="py-5">
            <UpgradePrompt context="view full details and respond" />
          </div>
        )}

        {/* Thread messages with date separators */}
        {thread.map((msg, i) => {
          const prevDate = i > 0 ? getDateKey(thread[i - 1].created_at) : requestDate;
          const thisDate = getDateKey(msg.created_at);
          const showSeparator = thisDate !== prevDate;

          // System messages
          if (msg.type === "system") {
            return (
              <div key={i}>
                {showSeparator && (
                  <div className="flex justify-center py-1">
                    <span className="text-[11px] font-medium text-gray-400">
                      {formatDateSeparator(msg.created_at)}
                    </span>
                  </div>
                )}
                <div className="flex justify-center">
                  <span className="text-xs text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full">
                    {msg.text}
                  </span>
                </div>
              </div>
            );
          }

          const isOwn = msg.from_profile_id === activeProfile?.id;
          const msgDate = new Date(msg.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          });

          // Next step request — structured card styling
          if (msg.type === "next_step_request") {
            const stepLabel =
              msg.next_step === "call" ? "Call requested" :
              msg.next_step === "consultation" ? "Consultation requested" :
              msg.next_step === "visit" ? "Home visit requested" : "Request";
            const StepIcon = msg.next_step === "call" ? PhoneIcon :
              msg.next_step === "consultation" ? ClipboardIcon : HomeIcon;

            return (
              <div key={i}>
                {showSeparator && (
                  <div className="flex justify-center py-1">
                    <span className="text-[11px] font-medium text-gray-400">
                      {formatDateSeparator(msg.created_at)}
                    </span>
                  </div>
                )}
                <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                  <div className="max-w-[85%]">
                    <div className={`rounded-2xl overflow-hidden border ${
                      isOwn
                        ? "bg-primary-800 border-primary-700"
                        : "bg-white border-gray-200"
                    }`}>
                      <div className={`flex items-center gap-2 px-4 py-2 border-b ${
                        isOwn ? "border-primary-700" : "border-gray-100 bg-gray-50"
                      }`}>
                        <StepIcon className={`w-3.5 h-3.5 ${isOwn ? "text-gray-400" : "text-gray-500"}`} />
                        <span className={`text-xs font-bold uppercase tracking-wider ${
                          isOwn ? "text-gray-300" : "text-gray-600"
                        }`}>
                          {stepLabel}
                        </span>
                      </div>
                      <div className="px-4 py-3">
                        <p className={`text-base leading-relaxed ${
                          isOwn ? "text-white" : "text-gray-800"
                        }`}>{msg.text}</p>
                      </div>
                    </div>
                    <p className={`text-xs mt-1 ${isOwn ? "text-right" : "text-left"} text-gray-400`}>
                      {msgDate}
                    </p>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div key={i}>
              {showSeparator && (
                <div className="flex justify-center py-1">
                  <span className="text-[11px] font-medium text-gray-400">
                    {formatDateSeparator(msg.created_at)}
                  </span>
                </div>
              )}
              <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                <div className="max-w-[85%]">
                  <div className={`rounded-2xl px-4 py-3 ${
                    isOwn
                      ? "bg-primary-800 text-white rounded-tr-sm"
                      : "bg-gray-100 text-gray-800 rounded-tl-sm"
                  }`}>
                    <p className="text-base leading-relaxed">{msg.text}</p>
                  </div>
                  <p className={`text-xs mt-1 ${isOwn ? "text-right" : "text-left"} text-gray-400`}>
                    {msgDate}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ── Message Input ──
  const renderMessageInput = () => {
    if (!showMessageInput) return null;
    const hasText = messageText.trim().length > 0;
    return (
      <div className="shrink-0 px-7 py-2.5">
        <div className="flex items-center border border-gray-200 rounded-xl pl-4 pr-1.5 py-1.5 focus-within:border-gray-300 focus-within:ring-1 focus-within:ring-gray-200 transition-all bg-white">
          <input
            ref={messageInputRef}
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && hasText) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={messagePlaceholder}
            disabled={sending}
            className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 py-1.5 outline-none disabled:opacity-50"
          />
          <button
            type="button"
            onClick={handleSendMessage}
            disabled={sending || !hasText}
            className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
              hasText
                ? "bg-primary-600 text-white hover:bg-primary-700"
                : "bg-gray-100 text-gray-400"
            } disabled:cursor-not-allowed`}
          >
            {sending ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
            )}
          </button>
        </div>
      </div>
    );
  };

  // ── Action Bar: Request Status ──
  const renderRequestStatus = () => {
    if (!nextStepRequest) return null;

    const stepNoun =
      nextStepRequest.type === "call" ? "a call" :
      nextStepRequest.type === "consultation" ? "a consultation" :
      nextStepRequest.type === "visit" ? "a home visit" : "a next step";

    // Determine if current user is the requester or the responder
    const requestThreadMsg = thread.find(
      (m) => m.type === "next_step_request" && m.created_at === nextStepRequest.created_at
    );
    const isRequester = requestThreadMsg?.from_profile_id === activeProfile?.id;

    // Responder view: action card
    if (!isRequester) {
      return (
        <div className="p-3 rounded-xl border border-primary-100 bg-primary-50/40">
          <p className="text-sm font-medium text-gray-900 mb-1">
            {otherName} would like to schedule {stepNoun}
          </p>
          {nextStepRequest.note && (
            <p className="text-xs text-gray-500 italic mb-2">&ldquo;{nextStepRequest.note}&rdquo;</p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                const prefix = nextStepRequest.type === "call"
                  ? "I'm available for a call "
                  : nextStepRequest.type === "consultation"
                  ? "I'm available for a consultation "
                  : "I'm available for a visit ";
                setMessageText(prefix);
                requestAnimationFrame(() => messageInputRef.current?.focus());
              }}
              className="flex-[2] px-3 py-2 text-xs font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Share Your Availability
            </button>
            <button
              type="button"
              onClick={handleCancelNextStep}
              disabled={actionLoading}
              className="flex-1 px-3 py-2 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {actionLoading ? "..." : "Decline"}
            </button>
          </div>
        </div>
      );
    }

    // Requester view — now handled inline in consolidated footer
    return null;
  };

  // ── Render ──

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Optional header bar */}
      {showHeader && (
        <div className="px-7 py-5 border-b border-gray-200 flex items-center justify-between shrink-0">
          <h3 className="text-xl font-bold text-gray-900">Connection</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center h-64 shrink-0">
          <div className="animate-spin w-7 h-7 border-[3px] border-primary-600 border-t-transparent rounded-full" />
        </div>
      )}

      {/* Error (no connection) */}
      {error && !connection && (
        <div className="px-7 py-8 shrink-0">
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-base">
            {error}
          </div>
        </div>
      )}

      {connection && !loading && (
        <>
          {/* ── HEADER: Who + Status + Profile Link + Contact ── */}
          <div className="px-7 pt-5 pb-4 shrink-0 border-b border-gray-100">
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
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-lg font-bold text-white"
                    style={{ background: shouldBlur ? "#9ca3af" : avatarGradient(otherName) }}
                  >
                    {shouldBlur ? "?" : initial}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="text-lg font-bold text-gray-900 leading-snug">
                      {shouldBlur ? blurName(otherName) : otherName}
                    </h2>
                    {!shouldBlur && (
                      <p className="text-sm text-gray-500 leading-tight">
                        {categoryLabel}{otherLocation ? ` \u00b7 ${otherLocation}` : ""}
                      </p>
                    )}
                  </div>
                  {/* Status pill + Close button */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${status.bg} ${status.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                      {status.label}
                    </span>
                    <button
                      type="button"
                      onClick={onClose}
                      className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                      aria-label="Close"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
                {/* Profile link + inline contact */}
                {otherProfile && !shouldBlur && (
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <Link
                      href={profileHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors"
                    >
                      View profile
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </Link>
                    {hasPhone && (
                      <a
                        href={`tel:${otherProfile.phone}`}
                        className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-primary-600 transition-colors"
                      >
                        <PhoneIcon className="w-3 h-3" />
                        {otherProfile.phone}
                      </a>
                    )}
                    {hasEmail && (
                      <a
                        href={`mailto:${otherProfile.email}`}
                        className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-primary-600 transition-colors"
                      >
                        <EmailIcon className="w-3 h-3" />
                        {otherProfile.email}
                      </a>
                    )}
                  </div>
                )}
                {/* Request summary (folded from context card) */}
                {parsedMsg && !shouldBlur && (
                  <p className="text-xs text-gray-400 mt-1.5">
                    {[parsedMsg.careType, parsedMsg.careRecipient ? `For ${parsedMsg.careRecipient}` : null, parsedMsg.urgency, `${isInbound ? "Received" : "Sent"} ${shortDate}`].filter(Boolean).join(" · ")}
                  </p>
                )}
              </div>
            </div>

            {/* Accept / Decline (pending inbound only) */}
            {isInbound && hasFullAccess && connection.status === "pending" && (
              <div className="mt-4 flex gap-3">
                <Button
                  size="sm"
                  onClick={() => handleStatusUpdate("accepted")}
                  loading={responding}
                  className="flex-1"
                >
                  Accept
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleStatusUpdate("declined")}
                  loading={responding}
                  className="flex-1"
                >
                  Decline
                </Button>
              </div>
            )}
          </div>

          {/* ── CONVERSATION ── */}
          <div ref={conversationRef} className="flex-1 overflow-y-auto min-h-0 px-7 py-4">
            {renderConversation()}
          </div>

          {/* ── ACTION CARD: Next step (only when connected, no active request, family) ── */}
          {isAccepted && !shouldBlur && !isProvider && !nextStepRequest && (
            <div className="shrink-0 px-7 pt-2.5 pb-1 border-t border-gray-100">
              {nextStepConfirm ? (
                /* Expanded inline form — uses matching card colors */
                <div className={`p-3.5 rounded-xl border ${nextStepConfirm.cardBg} ${nextStepConfirm.cardBorder}`}>
                  <div className="flex items-center gap-2.5 mb-3">
                    <span className="text-base">{nextStepConfirm.emoji}</span>
                    <span className="text-[13px] font-semibold text-gray-900">{nextStepConfirm.label}</span>
                  </div>
                  {nextStepConfirm.id === "call" && (
                    <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
                      <PhoneIcon className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
                      <p className="text-xs text-amber-800 leading-relaxed">
                        Your phone number will be shared with the provider.
                      </p>
                    </div>
                  )}
                  <p className="text-[11px] font-medium text-gray-600 mb-1">Add a note (optional)</p>
                  <textarea
                    value={nextStepNote}
                    onChange={(e) => setNextStepNote(e.target.value)}
                    placeholder={nextStepConfirm.id === "visit"
                      ? "e.g., Mornings work best, we\u2019re in a single-story home..."
                      : "e.g., Afternoons work best, any day except Wednesday..."}
                    className="w-full px-2.5 py-2 rounded-lg border border-gray-200 text-xs text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-primary-500 resize-none min-h-[44px] bg-white"
                  />
                  <div className="flex gap-2 mt-2.5">
                    <button
                      type="button"
                      onClick={() => { setNextStepConfirm(null); setNextStepNote(""); }}
                      disabled={nextStepSending}
                      className="flex-1 py-2 text-xs font-medium text-gray-600 border border-gray-200 bg-white rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNextStepRequest(nextStepConfirm)}
                      disabled={nextStepSending}
                      className="flex-1 py-2 text-xs font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                    >
                      {nextStepSending ? "Sending..." : "Send Request"}
                    </button>
                  </div>
                </div>
              ) : (
                /* Idle — single action card */
                <div
                  onClick={() => { setNextStepConfirm(primaryNextStep); setNextStepNote(""); }}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border cursor-pointer transition-all hover:shadow-sm ${primaryNextStep.cardBg} ${primaryNextStep.cardBorder}`}
                >
                  <span className="text-base">{primaryNextStep.emoji}</span>
                  <span className="flex-1 text-[13px] font-semibold text-gray-900">{primaryNextStep.label}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                </div>
              )}
            </div>
          )}

          {/* Provider: responder action card (when request active) */}
          {isAccepted && !shouldBlur && isProvider && nextStepRequest && (
            <div className="shrink-0 px-7 py-3 border-t border-gray-100">
              {renderRequestStatus()}
            </div>
          )}

          {/* Provider: contextual guidance (no active request) */}
          {isAccepted && !shouldBlur && isProvider && !nextStepRequest && (
            <div className="shrink-0 px-7 py-3 border-t border-gray-100">
              <p className="text-xs text-gray-400 text-center italic leading-relaxed">
                {thread.length === 0
                  ? "Introduce yourself and share what makes your care approach unique"
                  : thread.length <= 3
                  ? "Families often appreciate knowing your availability and rates"
                  : "This family seems interested \u2014 let them know you\u2019re available for a call"}
              </p>
            </div>
          )}

          {renderMessageInput()}

          {/* ── CONSOLIDATED FOOTER: request status + end connection ── */}
          {isAccepted && !shouldBlur && (
            <div className="shrink-0 px-7 py-3 border-t border-gray-100">
              {/* Request status (family requester only — compact single line) */}
              {nextStepRequest && !isProvider && (
                (() => {
                  const requestThreadMsg = thread.find(
                    (m) => m.type === "next_step_request" && m.created_at === nextStepRequest.created_at
                  );
                  const isRequester = requestThreadMsg?.from_profile_id === activeProfile?.id;
                  if (!isRequester) return null;

                  const stepEmoji = nextStepRequest.type === "call" ? "\u{1F4DE}" : nextStepRequest.type === "visit" ? "\u{1F3E0}" : "\u{1FA7A}";
                  const statusLabel = nextStepRequest.type === "call" ? "Call requested"
                    : nextStepRequest.type === "visit" ? "Home visit requested"
                    : "Consultation requested";
                  const typeLabel = nextStepRequest.type === "call" ? "call"
                    : nextStepRequest.type === "consultation" ? "consultation" : "home visit";

                  if (confirmCancelNextStep) {
                    return (
                      <div className="px-3 py-2.5 bg-red-50 rounded-lg border border-red-200 mb-2">
                        <p className="text-xs font-semibold text-gray-900 mb-2">Cancel this {typeLabel} request?</p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setConfirmCancelNextStep(false)}
                            disabled={actionLoading}
                            className="flex-1 py-1.5 text-[11px] font-medium text-gray-600 border border-gray-200 bg-white rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
                          >
                            Keep it
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelNextStep}
                            disabled={actionLoading}
                            className="flex-1 py-1.5 text-[11px] font-semibold text-white bg-red-800 rounded-md hover:bg-red-900 transition-colors disabled:opacity-50"
                          >
                            {actionLoading ? "..." : "Cancel request"}
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div className="flex items-center justify-between py-1 mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{stepEmoji}</span>
                        <span className="text-xs text-gray-600">{statusLabel}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setConfirmCancelNextStep(true)}
                        className="text-[11px] font-medium text-red-700 hover:text-red-900 transition-colors"
                      >
                        Cancel request
                      </button>
                    </div>
                  );
                })()
              )}

              {/* End connection */}
              {inlineSuccess === "end" ? (
                <div className="px-3 py-2.5 bg-gray-100 rounded-lg text-center">
                  <p className="text-xs font-semibold text-gray-900">Connection ended &middot; Moved to Past</p>
                </div>
              ) : confirmAction === "end" ? (
                <div className="px-3 py-2.5 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-xs font-semibold text-gray-900 mb-2">End this connection? The provider will be notified.</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmAction(null)}
                      disabled={actionLoading}
                      className="flex-1 py-1.5 text-[11px] font-medium text-gray-600 border border-gray-200 bg-white rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleEndConnection}
                      disabled={actionLoading}
                      className="flex-1 py-1.5 text-[11px] font-semibold text-white bg-red-800 rounded-md hover:bg-red-900 transition-colors disabled:opacity-50"
                    >
                      {actionLoading ? "..." : "End Connection"}
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => setConfirmAction("end")}
                  className="flex items-center gap-1.5 cursor-pointer py-1"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                  <span className="text-xs text-gray-500">End connection</span>
                </div>
              )}
            </div>
          )}

          {/* Provider: Past Connection Actions */}
          {isProvider && !shouldBlur && (connection.status === "declined" || connection.status === "expired" || connection.status === "archived") && (
            <div className="shrink-0 px-7 py-3 border-t border-gray-100">
              {inlineSuccess === "remove" ? (
                <div className="px-3 py-2.5 bg-gray-100 rounded-lg text-center">
                  <p className="text-xs font-semibold text-gray-900">Removed from list</p>
                </div>
              ) : confirmAction === "remove" ? (
                <div className="px-3 py-2.5 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-xs font-semibold text-gray-900 mb-2">Remove from your list? You can always reconnect later.</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmAction(null)}
                      disabled={actionLoading}
                      className="flex-1 py-1.5 text-[11px] font-medium text-gray-600 border border-gray-200 bg-white rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleHideInline}
                      disabled={actionLoading}
                      className="flex-1 py-1.5 text-[11px] font-semibold text-white bg-red-800 rounded-md hover:bg-red-900 transition-colors disabled:opacity-50"
                    >
                      {actionLoading ? "..." : "Remove"}
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => setConfirmAction("remove")}
                  className="flex items-center gap-1.5 cursor-pointer py-1"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                  <span className="text-xs text-gray-500">Remove from list</span>
                </div>
              )}
            </div>
          )}

          {/* Family: Withdraw (pending outbound) — inline confirmation */}
          {!isProvider && !isInbound && connection.status === "pending" && (
            <div className="shrink-0 px-7 py-3 border-t border-gray-100">
              {inlineSuccess === "withdraw" ? (
                <div className="px-3 py-2.5 bg-gray-100 rounded-lg text-center">
                  <p className="text-xs font-semibold text-gray-900">Request withdrawn &middot; Moved to Past</p>
                </div>
              ) : confirmAction === "withdraw" ? (
                <div className="px-3 py-2.5 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-xs font-semibold text-gray-900 mb-2">Withdraw this request? The provider won&apos;t be notified.</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmAction(null)}
                      disabled={actionLoading}
                      className="flex-1 py-1.5 text-[11px] font-medium text-gray-600 border border-gray-200 bg-white rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleWithdraw}
                      disabled={actionLoading}
                      className="flex-1 py-1.5 text-[11px] font-semibold text-white bg-red-800 rounded-md hover:bg-red-900 transition-colors disabled:opacity-50"
                    >
                      {actionLoading ? "..." : "Withdraw"}
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => setConfirmAction("withdraw")}
                  className="flex items-center gap-1.5 cursor-pointer py-1"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                  <span className="text-xs text-gray-500">Withdraw request</span>
                </div>
              )}
            </div>
          )}

          {/* Family: Past Connection Actions (declined / expired / withdrawn / ended) */}
          {!isProvider && !shouldBlur && (connection.status === "declined" || connection.status === "expired") && (
            <div className="shrink-0 px-7 py-4 border-t border-gray-100">
              {inlineSuccess === "remove" ? (
                <div className="px-3 py-2.5 bg-gray-100 rounded-lg text-center">
                  <p className="text-xs font-semibold text-gray-900">Removed from list</p>
                </div>
              ) : confirmAction === "remove" ? (
                <div className="px-3 py-2.5 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-xs font-semibold text-gray-900 mb-2">Remove from your list? You can always reconnect later.</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmAction(null)}
                      disabled={actionLoading}
                      className="flex-1 py-1.5 text-[11px] font-medium text-gray-600 border border-gray-200 bg-white rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleHideInline}
                      disabled={actionLoading}
                      className="flex-1 py-1.5 text-[11px] font-semibold text-white bg-red-800 rounded-md hover:bg-red-900 transition-colors disabled:opacity-50"
                    >
                      {actionLoading ? "..." : "Remove"}
                    </button>
                  </div>
                </div>
              ) : inlineSuccess === "reconnect" ? (
                <div className="px-3 py-2.5 bg-emerald-50 rounded-lg text-center border border-emerald-200">
                  <p className="text-xs font-semibold text-emerald-800">Reconnected! Track in your Active tab.</p>
                </div>
              ) : (
                <>
                  {connection.status === "expired" && (
                    <button
                      type="button"
                      onClick={handleReconnect}
                      disabled={actionLoading}
                      className="w-full min-h-[44px] rounded-xl bg-primary-600 text-white text-base font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 mb-3"
                    >
                      {actionLoading ? "Reconnecting..." : isEnded ? "Reconnect" : "Connect again"}
                    </button>
                  )}
                  {connection.status === "declined" && (
                    <Link href="/browse" className="block mb-3">
                      <button
                        type="button"
                        className="w-full min-h-[44px] rounded-xl border border-gray-200 text-base font-medium text-primary-600 hover:bg-primary-50 transition-colors"
                      >
                        Browse similar &rarr;
                      </button>
                    </Link>
                  )}
                  <div
                    onClick={() => setConfirmAction("remove")}
                    className="flex items-center gap-1.5 cursor-pointer py-1"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                    <span className="text-xs text-gray-500">Remove from list</span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Error ── */}
          {error && (
            <div className="shrink-0 px-7 pb-5">
              <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-base">
                {error}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
