"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { canEngage } from "@/lib/membership";
import { useAuth } from "@/components/auth/AuthProvider";
import { useProfileCompleteness } from "@/components/portal/profile/completeness";
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

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  pending: { label: "Pending", color: "text-amber-700", bg: "bg-amber-50", dot: "bg-amber-400" },
  accepted: { label: "Connected", color: "text-emerald-700", bg: "bg-emerald-50", dot: "bg-emerald-400" },
  declined: { label: "Declined", color: "text-gray-500", bg: "bg-gray-100", dot: "bg-gray-400" },
  archived: { label: "Archived", color: "text-gray-500", bg: "bg-gray-100", dot: "bg-gray-400" },
  expired: { label: "Expired", color: "text-gray-500", bg: "bg-gray-100", dot: "bg-gray-400" },
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

const GlobeIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
  </svg>
);

const ChevronRightIcon = ({ className = "w-3.5 h-3.5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <polyline points="9 18 15 12 9 6" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
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
}: ConnectionDrawerProps) {
  const { activeProfile, membership, user } = useAuth();
  const { percentage: profilePercentage } = useProfileCompleteness(activeProfile, user?.email);
  const conversationRef = useRef<HTMLDivElement>(null);
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
    setConfirmAction(null);

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

  // Scroll conversation to top when connection changes
  useEffect(() => {
    if (isOpen && conversationRef.current) {
      conversationRef.current.scrollTop = 0;
    }
    setMessageText("");
    setNextStepConfirm(null);
    setNextStepNote("");
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
  const statusConfig = STATUS_CONFIG[connection?.status || "pending"] || STATUS_CONFIG.pending;
  const status = isEnded
    ? { label: "Ended", color: "text-gray-500", bg: "bg-gray-100", dot: "bg-gray-400" }
    : isWithdrawn
    ? { ...statusConfig, label: "Withdrawn" }
    : statusConfig;
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

  // Contact info — only shown after connection is accepted
  const isAccepted = connection?.status === "accepted";
  const hasPhone = isAccepted && !shouldBlur && otherProfile?.phone;
  const hasEmail = isAccepted && !shouldBlur && otherProfile?.email;
  const hasWebsite = isAccepted && !shouldBlur && otherProfile?.website;
  const hasAnyContact = hasPhone || hasEmail || hasWebsite;

  // Two-column layout: responded drawer (care seeker viewing accepted connection)
  const isRespondedDrawer = isAccepted && !isProvider && !isInbound;

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
    connection?.status === "accepted" ? "Reply to provider..." : "Add a message...";

  // Whether provider is home care / home health (show home visit option)
  const isHomeCareProvider =
    otherProfile?.category === "home_care_agency" ||
    otherProfile?.category === "home_health_agency";

  // Next steps definitions — teal-accented styling
  const nextSteps: NextStepDef[] = [
    {
      id: "call",
      label: "Request a call",
      desc: "",
      msg: "would like to request a phone call",
      iconBg: "bg-primary-50",
      iconBorder: "border-primary-100",
      icon: <PhoneIcon className="w-4 h-4 text-primary-600" />,
    },
    {
      id: "consultation",
      label: "Request a consultation",
      desc: "",
      msg: "would like to request a consultation",
      iconBg: "bg-primary-50",
      iconBorder: "border-primary-100",
      icon: <ClipboardIcon className="w-4 h-4 text-primary-600" />,
    },
    ...(isHomeCareProvider
      ? [
          {
            id: "visit",
            label: "Request an in-home assessment",
            desc: "",
            msg: "would like to request a home visit",
            iconBg: "bg-primary-50",
            iconBorder: "border-primary-100",
            icon: <HomeIcon className="w-4 h-4 text-primary-600" />,
          },
        ]
      : []),
  ];

  // ── Conversation thread rendering ──
  const renderConversation = () => (
    <div className="space-y-4">
      {/* Connection request bubble */}
      {!shouldBlur && (
        <div className={`flex ${isInbound ? "justify-start" : "justify-end"}`}>
          <div className="max-w-[85%]">
            <div className={`rounded-2xl px-4 py-3 ${
              isInbound
                ? "bg-gray-100 text-gray-800 rounded-tl-sm"
                : "bg-gray-800 text-white rounded-tr-sm"
            }`}>
              <p className={`text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                isInbound ? "text-gray-400" : "text-gray-400"
              }`}>
                Connection request
              </p>
              {summary && (
                <p className="text-base leading-relaxed">{summary}</p>
              )}
              {parsedMsg?.notes && (
                <p className={`text-base italic mt-1.5 ${
                  isInbound ? "text-gray-600" : "text-gray-400"
                }`}>
                  &ldquo;{parsedMsg.notes}&rdquo;
                </p>
              )}
            </div>
            <p className={`text-xs mt-1 ${
              isInbound ? "text-left" : "text-right"
            } text-gray-400`}>
              {!isInbound && (
                <>
                  <span className="text-amber-500">{"\u25CF"}</span>{" "}
                  {profilePercentage}% profile shared{" \u00b7 "}
                </>
              )}
              {shortDate}
            </p>
          </div>
        </div>
      )}

      {/* System note */}
      <SystemNote
        connection={connection!}
        otherName={shouldBlur ? blurName(otherName) : otherName}
        shouldBlur={shouldBlur}
        metadata={connMetadata}
      />

      {/* Provider responded (accepted, outbound = care seeker view) */}
      {connection!.status === "accepted" && !shouldBlur && otherProfile && !isInbound && (
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
      {connection!.status === "accepted" && !shouldBlur && isInbound && (
        <div className="flex justify-end">
          <div className="max-w-[85%]">
            <div className="bg-gray-800 text-white rounded-2xl rounded-tr-sm px-4 py-3">
              <p className="text-base leading-relaxed">
                You accepted this connection. Reach out to start the conversation.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Thread messages */}
      {thread.map((msg, i) => {
        // System messages (e.g. cancellation notes)
        if (msg.type === "system") {
          return (
            <div key={i} className="flex justify-center">
              <span className="text-xs text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full">
                {msg.text}
              </span>
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

        // Next step request messages get special rendering
        if (msg.type === "next_step_request") {
          const stepLabel =
            msg.next_step === "call" ? "Request a call" :
            msg.next_step === "consultation" ? "Request a consultation" :
            msg.next_step === "visit" ? "Request a home visit" : "Request";
          const stepIcon =
            msg.next_step === "call" ? "\u{1F4DE}" :
            msg.next_step === "consultation" ? "\u{1FA7A}" :
            msg.next_step === "visit" ? "\u{1F3E0}" : "\u{1F4CB}";

          return (
            <div key={i} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
              <div className="max-w-[85%]">
                <div className={`rounded-2xl px-4 py-3 ${
                  isOwn
                    ? "bg-gray-800 text-white rounded-tr-sm"
                    : "bg-gray-100 text-gray-800 rounded-tl-sm"
                }`}>
                  <p className={`text-xs font-semibold mb-1.5 ${
                    isOwn ? "text-gray-400" : "text-gray-500"
                  }`}>
                    {stepIcon} {stepLabel}
                  </p>
                  <p className="text-base leading-relaxed">{msg.text}</p>
                </div>
                <p className={`text-xs mt-1 ${isOwn ? "text-right" : "text-left"} text-gray-400`}>
                  {msgDate}
                </p>
              </div>
            </div>
          );
        }

        return (
          <div key={i} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
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
        );
      })}

      {/* Upgrade Prompt (blurred) */}
      {shouldBlur && (
        <div className="py-5">
          <UpgradePrompt context="view full details and respond" />
        </div>
      )}
    </div>
  );

  // ── Message Input ──
  const renderMessageInput = () => {
    if (!showMessageInput) return null;
    return (
      <div className="shrink-0 px-6 py-4 border-t border-gray-100">
        <div className="flex gap-2">
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && messageText.trim()) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={messagePlaceholder}
            disabled={sending}
            className="flex-1 bg-gray-100 rounded-xl px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 min-h-[44px] outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-colors disabled:opacity-50"
          />
          <button
            type="button"
            onClick={handleSendMessage}
            disabled={sending || !messageText.trim()}
            className="px-4 py-3 rounded-xl bg-primary-600 text-white text-base font-medium min-h-[44px] hover:bg-primary-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {sending ? "..." : "Send"}
          </button>
        </div>
      </div>
    );
  };

  // ── Right Column: Contact Section ──
  const renderContactSection = () => (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
        Contact
      </p>
      {hasAnyContact ? (
        <div className="flex flex-col gap-2">
          {hasPhone && (
            <a
              href={`tel:${otherProfile!.phone}`}
              className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-primary-600 hover:bg-primary-50 transition-colors"
            >
              <PhoneIcon className="w-3.5 h-3.5 text-primary-600 shrink-0" />
              <span className="truncate">{otherProfile!.phone}</span>
            </a>
          )}
          {hasEmail && (
            <a
              href={`mailto:${otherProfile!.email}`}
              className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <EmailIcon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span className="truncate">{otherProfile!.email}</span>
            </a>
          )}
          {hasWebsite && (
            <a
              href={otherProfile!.website!.startsWith("http") ? otherProfile!.website! : `https://${otherProfile!.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <GlobeIcon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span className="truncate">
                {otherProfile!.website!.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
              </span>
            </a>
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-400">Contact information not yet available.</p>
      )}
    </div>
  );

  // ── Right Column: Next Steps Cards ──
  const renderNextSteps = () => (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
        Next Steps
      </p>
      <div className="flex flex-col gap-2.5">
        {nextSteps.map((step) => (
          <button
            key={step.id}
            type="button"
            onClick={() => {
              setNextStepConfirm(step);
              setNextStepNote("");
            }}
            className="flex items-center gap-3 w-full h-[52px] px-3.5 rounded-xl border border-gray-200 bg-white text-left hover:border-primary-200 hover:bg-primary-25 transition-all group"
          >
            <div className={`w-8 h-8 rounded-lg ${step.iconBg} flex items-center justify-center shrink-0`}>{step.icon}</div>
            <p className="flex-1 min-w-0 text-sm font-semibold text-gray-900">{step.label}</p>
            <ChevronRightIcon className="w-3.5 h-3.5 text-gray-300 group-hover:text-primary-500 transition-colors shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );

  // ── Right Column: Request Status Card ──
  const renderRequestStatus = () => {
    if (!nextStepRequest) return null;

    const stepLabel =
      nextStepRequest.type === "call" ? "Request a call" :
      nextStepRequest.type === "consultation" ? "Request a consultation" :
      nextStepRequest.type === "visit" ? "Request a home visit" : "Request";
    const stepIcon =
      nextStepRequest.type === "call" ? <PhoneIcon className="w-4 h-4 text-primary-600" /> :
      nextStepRequest.type === "consultation" ? <ClipboardIcon className="w-4 h-4 text-primary-600" /> :
      <HomeIcon className="w-4 h-4 text-primary-600" />;

    const sentDate = new Date(nextStepRequest.created_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    return (
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Request Status
        </p>
        <div className="p-4 rounded-xl border border-amber-200/50 bg-amber-50/30">
          <div className="flex items-center gap-2.5 mb-3">
            {stepIcon}
            <span className="text-sm font-bold text-gray-900">{stepLabel}</span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span className="text-xs font-semibold text-amber-700">Requested</span>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            Sent {sentDate} &middot; Waiting for {otherName} to respond
          </p>
          {nextStepRequest.type === "call" && (
            <p className="text-xs text-gray-600 mt-2 bg-white px-3 py-2 rounded-lg border border-gray-200 flex items-center gap-2">
              <PhoneIcon className="w-3 h-3 text-gray-400 shrink-0" />
              Your phone number was shared
            </p>
          )}
          <button
            type="button"
            onClick={handleCancelNextStep}
            disabled={actionLoading}
            className="mt-3 px-3 py-1.5 text-xs font-medium text-red-600 bg-white border border-gray-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            {actionLoading ? "..." : "Cancel request"}
          </button>
        </div>
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
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
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

      {/* Panel */}
      <div
        className={`absolute right-0 top-0 h-full w-full bg-white shadow-xl flex flex-col transition-transform duration-300 ease-out ${
          isRespondedDrawer ? "max-w-[720px]" : "max-w-[480px]"
        } ${visible ? "translate-x-0" : "translate-x-full"}`}
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
            {/* ── Provider Info (shrink-0, full width) ── */}
            <div className="px-6 pt-6 pb-5 shrink-0">
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
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      {!shouldBlur && (
                        <p className="text-sm text-gray-400 leading-tight">{categoryLabel}</p>
                      )}
                      <h2 className="text-xl font-bold text-gray-900 leading-snug">
                        {shouldBlur ? blurName(otherName) : otherName}
                      </h2>
                      {otherLocation && !shouldBlur && (
                        <p className="text-base text-gray-500 mt-0.5">{otherLocation}</p>
                      )}
                    </div>
                    {/* Status pill */}
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${status.bg} ${status.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                      {status.label}
                    </span>
                  </div>
                  {otherProfile && !shouldBlur && (
                    <div className="flex items-center gap-2.5 mt-2 flex-wrap">
                      {/* Show inline contact info only for non-responded accepted (provider view) */}
                      {hasPhone && !isRespondedDrawer && (
                        <>
                          <a
                            href={`tel:${otherProfile.phone}`}
                            className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-primary-600 transition-colors"
                          >
                            <PhoneIcon className="w-3.5 h-3.5 text-gray-400" />
                            {otherProfile.phone}
                          </a>
                          <span className="text-gray-200">|</span>
                        </>
                      )}
                      <Link
                        href={profileHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
                      >
                        View provider profile
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact info (email/website) — only for non-responded view */}
              {!isRespondedDrawer && (hasEmail || hasWebsite) && (
                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5">
                  {hasEmail && (
                    <a
                      href={`mailto:${otherProfile!.email}`}
                      className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-primary-600 transition-colors"
                    >
                      <EmailIcon className="w-4 h-4 text-gray-400" />
                      {otherProfile!.email}
                    </a>
                  )}
                  {hasWebsite && (
                    <a
                      href={otherProfile!.website!.startsWith("http") ? otherProfile!.website! : `https://${otherProfile!.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-primary-600 transition-colors"
                    >
                      <GlobeIcon className="w-4 h-4 text-gray-400" />
                      {otherProfile!.website!.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
                    </a>
                  )}
                </div>
              )}

              {/* Provider Actions: Pending Inbound */}
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

            {/* ── Divider ── */}
            <div className="mx-6 border-t border-gray-100 shrink-0" />

            {/* ═══ TWO-COLUMN LAYOUT (Responded Drawer) ═══ */}
            {isRespondedDrawer ? (
              <div className="flex flex-1 min-h-0">
                {/* Left Column — Conversation + Message Input */}
                <div className="flex-1 flex flex-col min-w-0 border-r border-gray-100">
                  <div ref={conversationRef} className="flex-1 overflow-y-auto min-h-0 px-6 py-5">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                      Conversation
                    </p>
                    {renderConversation()}
                  </div>
                  {renderMessageInput()}
                </div>

                {/* Right Column — Contact + Next Steps + End Connection */}
                <div className="w-[280px] shrink-0 overflow-y-auto px-5 py-5 flex flex-col">
                  <div className="space-y-5 flex-1">
                    {renderContactSection()}
                    <div className="border-t border-gray-100" />
                    {nextStepRequest ? renderRequestStatus() : renderNextSteps()}
                  </div>
                  {/* End Connection link */}
                  <div className="pt-4 mt-4 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setConfirmAction("end")}
                      className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      End connection
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* ═══ SINGLE-COLUMN LAYOUT (Active / Past / Provider) ═══ */
              <>
                <div ref={conversationRef} className="flex-1 overflow-y-auto min-h-0 px-6 py-5">
                  <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                    Conversation
                  </p>
                  {renderConversation()}
                </div>

                {renderMessageInput()}

                {/* ── Family: Withdraw (pending outbound) ── */}
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

                {/* ── Family: Past Connection Actions (declined / expired / withdrawn / ended) ── */}
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
              </>
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

// ── System Note ──

function SystemNote({
  connection,
  otherName,
  shouldBlur,
  metadata,
}: {
  connection: ConnectionDetail;
  otherName: string;
  shouldBlur: boolean;
  metadata?: Record<string, unknown>;
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
    case "expired":
      text = metadata?.ended
        ? "You ended this connection"
        : metadata?.withdrawn
        ? "You withdrew this request"
        : "This request expired";
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
