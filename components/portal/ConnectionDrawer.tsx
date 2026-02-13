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
  onWithdraw?: (connectionId: string) => void;
  onHide?: (connectionId: string) => void;
  /** Pre-fetched connection data from the page — enables instant drawer open */
  preloadedConnection?: ConnectionDetail | null;
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
  iconBg: string;
  iconBorder: string;
  icon: React.ReactNode;
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

/** Context-aware status chip config */
function getStatusConfig(
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

function ConfirmDialog({
  title,
  description,
  confirmLabel,
  confirmVariant = "danger",
  onConfirm,
  onCancel,
  loading,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  confirmVariant?: "danger" | "primary";
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-2xl p-6 mx-6 shadow-lg max-w-[400px] w-full">
        <h4 className="text-lg font-bold text-gray-900">{title}</h4>
        <p className="text-base text-gray-600 mt-2 leading-relaxed">{description}</p>
        <div className="flex gap-3 mt-5">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 min-h-[44px] text-base font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 min-h-[44px] text-base font-semibold text-white rounded-xl transition-colors disabled:opacity-50 ${
              confirmVariant === "danger"
                ? "bg-red-600 hover:bg-red-700"
                : "bg-primary-600 hover:bg-primary-700"
            }`}
          >
            {loading ? "..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
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

export default function ConnectionDrawer({
  connectionId,
  isOpen,
  onClose,
  onStatusChange,
  onWithdraw,
  onHide,
  preloadedConnection,
}: ConnectionDrawerProps) {
  const { activeProfile, membership } = useAuth();
  const conversationRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
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
  const [showMoreOptions, setShowMoreOptions] = useState(false);

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

  // Load connection data when opened — use preloaded data for instant display,
  // then do a lightweight background refresh for fresh thread/metadata.
  useEffect(() => {
    if (!isOpen || !connectionId || !activeProfile || !isSupabaseConfigured()) {
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
  }, [isOpen, connectionId, activeProfile, preloadedConnection]);

  // Keyboard dismiss
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onCloseRef.current();
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleKeyDown]);

  // Scroll conversation to top when connection changes
  useEffect(() => {
    if (isOpen && conversationRef.current) {
      conversationRef.current.scrollTop = 0;
    }
    setMessageText("");
    setNextStepConfirm(null);
    setNextStepNote("");
    setShowMoreOptions(false);
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
      setConnection((prev) =>
        prev ? { ...prev, status: "expired" as ConnectionStatus, metadata: { ...((prev.metadata || {}) as Record<string, unknown>), withdrawn: true } } : null
      );
      setConfirmAction(null);
      onWithdraw?.(connection.id);
    } catch {
      setError("Failed to withdraw request");
    } finally {
      setActionLoading(false);
    }
  };

  const handleHide = async () => {
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
      onHide?.(connection.id);
    } catch {
      setError("Failed to remove connection");
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
      setConfirmAction(null);
      onWithdraw?.(connection.id);
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

  // Next steps definitions — outcome-oriented copy
  const nextSteps: NextStepDef[] = [
    {
      id: "call",
      label: "Schedule a call",
      desc: "Talk directly to discuss care needs",
      msg: "would like to schedule a phone call",
      iconBg: "bg-primary-50",
      iconBorder: "border-primary-200",
      icon: <PhoneIcon className="w-4 h-4 text-primary-600" />,
    },
    {
      id: "consultation",
      label: "Request a consultation",
      desc: "Meet in person or virtually to assess fit",
      msg: "would like to request a consultation",
      iconBg: "bg-gray-100",
      iconBorder: "border-gray-200",
      icon: <ClipboardIcon className="w-4 h-4 text-gray-500" />,
    },
    ...(isHomeCareProvider
      ? [
          {
            id: "visit",
            label: "Request a home visit",
            desc: "See the care environment firsthand",
            msg: "would like to request a home visit",
            iconBg: "bg-gray-100",
            iconBorder: "border-gray-200",
            icon: <HomeIcon className="w-4 h-4 text-gray-500" />,
          },
        ]
      : []),
  ];

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
      <div className="space-y-3">
        {/* Family's note (if any) as the first message */}
        {!shouldBlur && parsedMsg?.notes && (
          <>
            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 border-t border-gray-100" />
              <span className="text-xs font-medium text-gray-400">
                {connection?.created_at ? formatDateSeparator(connection.created_at) : ""}
              </span>
              <div className="flex-1 border-t border-gray-100" />
            </div>
            <div className={`flex ${isInbound ? "justify-start" : "justify-end"}`}>
              <div className="max-w-[85%]">
                <div className={`rounded-2xl px-4 py-3 ${
                  isInbound
                    ? "bg-gray-100 text-gray-800 rounded-tl-sm"
                    : "bg-gray-800 text-white rounded-tr-sm"
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
          <div className="flex items-center gap-3 py-1">
            <div className="flex-1 border-t border-emerald-100" />
            <span className="text-xs font-medium text-emerald-600">
              Connected
            </span>
            <div className="flex-1 border-t border-emerald-100" />
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
                  <div className="flex items-center gap-3 py-1">
                    <div className="flex-1 border-t border-gray-100" />
                    <span className="text-xs font-medium text-gray-400">
                      {formatDateSeparator(msg.created_at)}
                    </span>
                    <div className="flex-1 border-t border-gray-100" />
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
                  <div className="flex items-center gap-3 py-1">
                    <div className="flex-1 border-t border-gray-100" />
                    <span className="text-xs font-medium text-gray-400">
                      {formatDateSeparator(msg.created_at)}
                    </span>
                    <div className="flex-1 border-t border-gray-100" />
                  </div>
                )}
                <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                  <div className="max-w-[85%]">
                    <div className={`rounded-2xl overflow-hidden border ${
                      isOwn
                        ? "bg-gray-800 border-gray-700"
                        : "bg-white border-gray-200"
                    }`}>
                      <div className={`flex items-center gap-2 px-4 py-2 border-b ${
                        isOwn ? "border-gray-700" : "border-gray-100 bg-gray-50"
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
                <div className="flex items-center gap-3 py-1">
                  <div className="flex-1 border-t border-gray-100" />
                  <span className="text-xs font-medium text-gray-400">
                    {formatDateSeparator(msg.created_at)}
                  </span>
                  <div className="flex-1 border-t border-gray-100" />
                </div>
              )}
              <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                <div className="max-w-[85%]">
                  <div className={`rounded-2xl px-4 py-3 ${
                    isOwn
                      ? "bg-gray-800 text-white rounded-tr-sm"
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

  // ── Message Input (pill-shaped) ──
  const renderMessageInput = () => {
    if (!showMessageInput) return null;
    const hasText = messageText.trim().length > 0;
    return (
      <div className="shrink-0 px-6 py-3 border-t border-gray-100">
        <div className="flex items-end gap-2 bg-gray-100 rounded-full pl-4 pr-1.5 py-1.5 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-300 transition-all">
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
            className="flex-1 bg-transparent text-[15px] text-gray-900 placeholder:text-gray-400 py-1.5 outline-none disabled:opacity-50"
          />
          <button
            type="button"
            onClick={handleSendMessage}
            disabled={sending || !hasText}
            className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              hasText
                ? "bg-primary-600 text-white hover:bg-primary-700"
                : "bg-gray-200 text-gray-400"
            } disabled:cursor-not-allowed`}
          >
            {sending ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
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

    // Requester view: compact inline status
    return (
      <div className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl bg-amber-50/50 border border-amber-100">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900">
            {nextStepRequest.type === "call" ? "Call" :
             nextStepRequest.type === "consultation" ? "Consultation" :
             "Home visit"} requested
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            Waiting for {otherName} &mdash; most respond within a few hours
          </p>
        </div>
        <button
          type="button"
          onClick={handleCancelNextStep}
          disabled={actionLoading}
          className="text-xs font-medium text-red-500 hover:text-red-700 transition-colors shrink-0"
        >
          {actionLoading ? "..." : "Cancel"}
        </button>
      </div>
    );
  };

  // ── Next Step Confirmation Modal ──
  const renderNextStepModal = () => {
    if (!nextStepConfirm) return null;

    return (
      <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40">
        <div
          className="bg-white rounded-2xl shadow-xl max-w-[420px] w-full mx-6 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-6 pt-6 pb-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                {nextStepConfirm.icon}
              </div>
              <h3 className="text-lg font-bold text-gray-900">{nextStepConfirm.label}</h3>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              A request will be sent to <strong className="text-gray-700">{otherName}</strong> asking them to suggest available times.
            </p>
            {nextStepConfirm.id === "call" && (
              <div className="mt-3 flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
                <PhoneIcon className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-800 leading-relaxed">
                  Your phone number will be shared with the provider so they can call you directly.
                </p>
              </div>
            )}
            <div className="mt-4">
              <label className="text-xs font-semibold text-gray-600 block mb-2">
                Add a note (optional)
              </label>
              <textarea
                value={nextStepNote}
                onChange={(e) => setNextStepNote(e.target.value)}
                placeholder="e.g., Afternoons work best, any day except Wednesday..."
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-primary-500 resize-vertical min-h-[60px]"
              />
            </div>
          </div>
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex gap-3">
            <button
              type="button"
              onClick={() => {
                setNextStepConfirm(null);
                setNextStepNote("");
              }}
              disabled={nextStepSending}
              className="flex-1 min-h-[44px] text-sm font-medium text-gray-600 border border-gray-200 bg-white rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleNextStepRequest(nextStepConfirm)}
              disabled={nextStepSending}
              className="flex-[2] min-h-[44px] text-sm font-semibold text-white bg-primary-600 rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {nextStepSending ? "Sending..." : "Send Request"}
            </button>
          </div>
        </div>
      </div>
    );
  };

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

      {/* Panel — always single-column 480px */}
      <div
        className={`absolute right-0 top-0 h-full w-full bg-white shadow-xl flex flex-col transition-transform duration-300 ease-out max-w-[480px] ${visible ? "translate-x-0" : "translate-x-full"}`}
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

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center h-64 shrink-0">
            <div className="animate-spin w-7 h-7 border-[3px] border-primary-600 border-t-transparent rounded-full" />
          </div>
        )}

        {/* Error (no connection) */}
        {error && !connection && (
          <div className="px-6 py-8 shrink-0">
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-base">
              {error}
            </div>
          </div>
        )}

        {connection && !loading && (
          <>
            {/* ── HEADER: Who + Status + Profile Link + Contact ── */}
            <div className="px-6 pt-5 pb-4 shrink-0">
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="shrink-0">
                  {imageUrl && !shouldBlur ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imageUrl}
                      alt={otherName}
                      className="w-12 h-12 rounded-xl object-cover"
                    />
                  ) : (
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold text-white"
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
                    {/* Status pill */}
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${status.bg} ${status.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                      {status.label}
                    </span>
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

            {/* ── CONTEXT CARD: Pinned request summary ── */}
            {parsedMsg && !shouldBlur && (
              <div className="px-6 pb-3 shrink-0">
                <div className="bg-gray-50 rounded-xl px-4 py-3">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {[parsedMsg.careType, parsedMsg.careRecipient ? `For ${parsedMsg.careRecipient}` : null, parsedMsg.urgency].filter(Boolean).join(" \u00b7 ")}
                  </p>
                  {connection.status === "pending" && (
                    <p className="text-xs text-gray-500 mt-1">
                      {isInbound
                        ? "Review their request and respond when ready"
                        : isProvider
                        ? `Sent ${shortDate} \u00b7 Waiting for a response`
                        : `Sent ${shortDate} \u00b7 Most providers respond within a few hours`}
                    </p>
                  )}
                  {connection.status !== "pending" && (
                    <p className="text-xs text-gray-400 mt-1">{isInbound ? "Received" : "Sent"} {shortDate}</p>
                  )}
                </div>
              </div>
            )}

            {/* ── CONVERSATION ── */}
            <div ref={conversationRef} className="flex-1 overflow-y-auto min-h-0 px-6 py-4">
              {renderConversation()}
            </div>

            {/* ── ACTION BAR: Fixed between conversation and input ── */}
            {isAccepted && !shouldBlur && (
              <div className="shrink-0 px-6 py-3 border-t border-gray-100 transition-all duration-200">
                {nextStepRequest ? (
                  renderRequestStatus()
                ) : !isProvider ? (
                  /* Family: Schedule CTA with contextual microcopy */
                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        setNextStepConfirm(nextSteps[0]);
                        setNextStepNote("");
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 shadow-sm transition-all duration-150"
                    >
                      <PhoneIcon className="w-3.5 h-3.5" />
                      Schedule a Call
                    </button>
                    <p className="text-xs text-gray-400 text-center mt-2 leading-relaxed">
                      {thread.length === 0
                        ? "A quick call is the best way to see if it\u2019s a good fit"
                        : thread.length <= 3
                        ? "Ready to take the next step?"
                        : "You\u2019ve been chatting \u2014 a call can help you decide faster"}
                    </p>
                    {/* Progressive disclosure for secondary options */}
                    {nextSteps.length > 1 && (
                      <div className="mt-2 text-center">
                        <button
                          type="button"
                          onClick={() => setShowMoreOptions(!showMoreOptions)}
                          className="text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors inline-flex items-center gap-1"
                        >
                          Other options
                          <svg className={`w-3 h-3 transition-transform duration-150 ${showMoreOptions ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {showMoreOptions && (
                          <div className="flex justify-center gap-4 mt-2">
                            {nextSteps.slice(1).map((step) => (
                              <button
                                key={step.id}
                                type="button"
                                onClick={() => {
                                  setNextStepConfirm(step);
                                  setNextStepNote("");
                                }}
                                className="text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors"
                              >
                                {step.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Provider: Soft contextual guidance */
                  <p className="text-xs text-gray-400 text-center italic leading-relaxed">
                    {thread.length === 0
                      ? "Introduce yourself and share what makes your care approach unique"
                      : thread.length <= 3
                      ? "Families often appreciate knowing your availability and rates"
                      : "This family seems interested \u2014 let them know you\u2019re available for a call"}
                  </p>
                )}
              </div>
            )}

            {renderMessageInput()}

            {/* ── FOOTER: End / Withdraw / Past actions ── */}
            {isAccepted && !shouldBlur && (
              <div className="shrink-0 px-6 py-2.5 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setConfirmAction("end")}
                  className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  End connection
                </button>
              </div>
            )}

            {/* Provider: Past Connection Actions */}
            {isProvider && !shouldBlur && (connection.status === "declined" || connection.status === "expired" || connection.status === "archived") && (
              <div className="shrink-0 px-6 py-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setConfirmAction("remove")}
                  className="flex items-center gap-2 text-base text-gray-500 hover:text-gray-700 transition-colors min-h-[44px]"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Remove from list
                </button>
              </div>
            )}

            {/* Family: Withdraw (pending outbound) */}
            {!isProvider && !isInbound && connection.status === "pending" && (
              <div className="shrink-0 px-6 py-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setConfirmAction("withdraw")}
                  className="flex items-center gap-2 text-base text-gray-500 hover:text-gray-700 transition-colors min-h-[44px]"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Withdraw request
                </button>
              </div>
            )}

            {/* Family: Past Connection Actions (declined / expired / withdrawn / ended) */}
            {!isProvider && !shouldBlur && (connection.status === "declined" || connection.status === "expired") && (
              <div className="shrink-0 px-6 py-5 border-t border-gray-100">
                {connection.status === "declined" && (
                  <div className="flex gap-3">
                    <Link href="/browse" className="flex-1">
                      <button
                        type="button"
                        className="w-full min-h-[44px] rounded-xl border border-gray-200 text-base font-medium text-primary-600 hover:bg-primary-50 transition-colors"
                      >
                        Browse similar &rarr;
                      </button>
                    </Link>
                    <button
                      type="button"
                      onClick={() => setConfirmAction("remove")}
                      className="flex-1 min-h-[44px] rounded-xl border border-gray-200 text-base font-medium text-gray-500 hover:bg-gray-50 transition-colors"
                    >
                      Remove from list
                    </button>
                  </div>
                )}
                {connection.status === "expired" && (
                  <div className="flex gap-3">
                    <Link href={profileHref} className="flex-1">
                      <button
                        type="button"
                        className="w-full min-h-[44px] rounded-xl bg-primary-600 text-white text-base font-semibold hover:bg-primary-700 transition-colors"
                      >
                        {isEnded ? "Reconnect" : "Connect again"}
                      </button>
                    </Link>
                    <button
                      type="button"
                      onClick={() => setConfirmAction("remove")}
                      className="flex-1 min-h-[44px] rounded-xl border border-gray-200 text-base font-medium text-gray-500 hover:bg-gray-50 transition-colors"
                    >
                      Remove from list
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── Error ── */}
            {error && (
              <div className="shrink-0 px-6 pb-5">
                <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-base">
                  {error}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Confirm Dialog Overlays ── */}
        {confirmAction === "withdraw" && (
          <ConfirmDialog
            title="Withdraw request?"
            description="This will cancel your connection request. The provider won't be notified. You can always reconnect later."
            confirmLabel="Withdraw"
            confirmVariant="danger"
            onConfirm={handleWithdraw}
            onCancel={() => setConfirmAction(null)}
            loading={actionLoading}
          />
        )}
        {confirmAction === "remove" && (
          <ConfirmDialog
            title="Remove from list?"
            description="This connection will be removed from your list. You can always reconnect later."
            confirmLabel="Remove"
            confirmVariant="danger"
            onConfirm={handleHide}
            onCancel={() => setConfirmAction(null)}
            loading={actionLoading}
          />
        )}
        {confirmAction === "end" && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/30">
            <div className="bg-white rounded-2xl p-6 mx-6 shadow-lg max-w-[400px] w-full">
              <h4 className="text-lg font-bold text-gray-900">
                End your connection with {otherName}?
              </h4>
              <p className="text-base text-gray-600 mt-2 leading-relaxed">
                They&apos;ll be notified that you&apos;re no longer looking. You can always reconnect later.
              </p>
              <div className="mt-3 flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
                <svg className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs text-amber-800 leading-relaxed">
                  The provider will be notified that you&apos;ve ended this connection.
                </p>
              </div>
              <div className="flex gap-3 mt-5">
                <button
                  type="button"
                  onClick={() => setConfirmAction(null)}
                  disabled={actionLoading}
                  className="flex-1 min-h-[44px] text-base font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleEndConnection}
                  disabled={actionLoading}
                  className="flex-1 min-h-[44px] text-base font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {actionLoading ? "..." : "End Connection"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Next Step Confirmation Modal ── */}
        {renderNextStepModal()}
      </div>
    </div>
  );

  return createPortal(drawerContent, document.body);
}
