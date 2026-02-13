"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { isSupabaseConfigured } from "@/lib/supabase/client";
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

/** Relative time label (e.g. "2 hours ago", "3 days ago") */
function relativeTime(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffMs = now - then;
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
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

const GlobeIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
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

  // ── Time proposal state ──
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [proposalSlots, setProposalSlots] = useState<Array<{ date: string; time: string; timezone: string }>>([
    { date: "", time: "", timezone: Intl.DateTimeFormat().resolvedOptions().timeZone },
  ]);
  const [proposalSending, setProposalSending] = useState(false);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  const [respondingProposal, setRespondingProposal] = useState(false);

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

  // Server-side fetch (bypasses all RLS) — used for initial load and polling
  const fetchConnectionFromServer = useCallback(async (connId: string): Promise<ConnectionDetail | null> => {
    try {
      const res = await fetch("/api/connections/get", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId: connId }),
      });
      if (!res.ok) {
        const data = await res.json();
        console.error("[ConnectionDrawer] fetch error:", data.error);
        return null;
      }
      const data = await res.json();
      return data.connection as ConnectionDetail;
    } catch (err) {
      console.error("[ConnectionDrawer] fetch error:", err);
      return null;
    }
  }, []);

  // Fetch connection data when opened
  useEffect(() => {
    if (!isOpen || !connectionId || !activeProfile || !isSupabaseConfigured()) {
      return;
    }

    setLoading(true);
    setError("");
    setConnection(null);
    setConfirmAction(null);

    const loadConnection = async () => {
      const conn = await fetchConnectionFromServer(connectionId);
      if (!conn) {
        setError("Connection not found.");
        setLoading(false);
        return;
      }
      console.log("[ConnectionDrawer] loaded connection:", conn.id, "status:", conn.status, "thread length:", ((conn.metadata as Record<string, unknown>)?.thread as unknown[] || []).length);
      setConnection(conn);
      setLoading(false);
    };

    loadConnection();
  }, [isOpen, connectionId, activeProfile, fetchConnectionFromServer]);

  // Polling: re-fetch from server every 5 seconds to catch changes
  useEffect(() => {
    if (!isOpen || !connectionId || !isSupabaseConfigured()) return;

    const poll = setInterval(async () => {
      const fresh = await fetchConnectionFromServer(connectionId);
      if (!fresh) return;

      setConnection((prev) => {
        if (!prev) return prev;
        // Only update if something actually changed
        if (prev.updated_at === fresh.updated_at) return prev;
        console.log("[ConnectionDrawer] poll update:", fresh.id, "status:", fresh.status, "thread length:", ((fresh.metadata as Record<string, unknown>)?.thread as unknown[] || []).length);
        return {
          ...prev,
          status: fresh.status,
          metadata: fresh.metadata,
          updated_at: fresh.updated_at,
        };
      });
    }, 5_000);

    return () => {
      clearInterval(poll);
    };
  }, [isOpen, connectionId, fetchConnectionFromServer]);

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
      console.log("[ConnectionDrawer] status update:", newStatus, "for connection:", connection.id);
      const res = await fetch("/api/connections/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connectionId: connection.id,
          action: newStatus,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        console.error("[ConnectionDrawer] status update failed:", res.status, data);
        throw new Error(data.error || "Failed to update");
      }
      const result = await res.json();
      console.log("[ConnectionDrawer] status updated to:", result.status);
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
              status: "archived" as ConnectionStatus,
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
      console.log("[ConnectionDrawer] sending message to connection:", connection.id);
      const res = await fetch("/api/connections/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connectionId: connection.id,
          text: messageText.trim(),
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        console.error("[ConnectionDrawer] message send failed:", res.status, errData);
        throw new Error(errData.error || "Failed to send");
      }
      const data = await res.json();
      console.log("[ConnectionDrawer] message sent, thread length:", data.thread?.length);
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
    } catch (err) {
      console.error("[ConnectionDrawer] message error:", err);
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
                time_proposal: null,
              },
            }
          : null
      );
      setShowTimePicker(false);
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

  // ── Propose times handler ──
  const handleProposeTimes = async () => {
    if (!connection) return;
    const validSlots = proposalSlots.filter((s) => s.date && s.time);
    if (validSlots.length === 0) return;

    setProposalSending(true);
    try {
      const res = await fetch("/api/connections/propose-times", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId: connection.id, slots: validSlots }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to propose times");
      }
      const data = await res.json();
      setConnection((prev) =>
        prev
          ? {
              ...prev,
              metadata: {
                ...((prev.metadata as Record<string, unknown>) || {}),
                thread: data.thread,
                time_proposal: data.time_proposal,
              },
            }
          : null
      );
      setShowTimePicker(false);
      setProposalSlots([{ date: "", time: "", timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }]);
      requestAnimationFrame(() => {
        conversationRef.current?.scrollTo({ top: conversationRef.current.scrollHeight, behavior: "smooth" });
      });
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "message" in err ? (err as { message: string }).message : "Failed to propose times";
      setError(msg);
    } finally {
      setProposalSending(false);
    }
  };

  // ── Respond to proposal handler ──
  const handleRespondProposal = async (action: "accept" | "decline", slotIndex?: number) => {
    if (!connection) return;
    setRespondingProposal(true);
    try {
      const res = await fetch("/api/connections/respond-proposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connectionId: connection.id,
          action,
          acceptedSlotIndex: slotIndex,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to respond");
      }
      const data = await res.json();
      setConnection((prev) =>
        prev
          ? {
              ...prev,
              metadata: {
                ...((prev.metadata as Record<string, unknown>) || {}),
                thread: data.thread,
                time_proposal: data.time_proposal,
                scheduled_call: data.scheduled_call,
                next_step_request: data.next_step_request,
              },
            }
          : null
      );
      setSelectedSlotIndex(null);
      requestAnimationFrame(() => {
        conversationRef.current?.scrollTo({ top: conversationRef.current.scrollHeight, behavior: "smooth" });
      });
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "message" in err ? (err as { message: string }).message : "Failed to respond";
      setError(msg);
    } finally {
      setRespondingProposal(false);
    }
  };

  // ── Cancel scheduled call handler ──
  const handleCancelScheduledCall = async () => {
    if (!connection) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/connections/cancel-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId: connection.id }),
      });
      if (!res.ok) throw new Error("Failed to cancel call");
      const data = await res.json();
      setConnection((prev) => {
        if (!prev) return prev;
        const meta = (prev.metadata as Record<string, unknown>) || {};
        return {
          ...prev,
          metadata: {
            ...meta,
            thread: data.thread,
            scheduled_call: data.scheduled_call,
            next_step_request: null,
            time_proposal: null,
          },
        };
      });
      setConfirmAction(null);
      requestAnimationFrame(() => {
        conversationRef.current?.scrollTo({ top: conversationRef.current.scrollHeight, behavior: "smooth" });
      });
    } catch {
      setError("Failed to cancel call");
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
  const isEnded = connection?.status === "archived" && connMetadata?.ended === true;
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
  const hasWebsite = isAccepted && !shouldBlur && otherProfile?.website;
  const hasAnyContact = hasPhone || hasEmail || hasWebsite;


  // Thread messages from metadata
  const thread = (connMetadata?.thread as ThreadMessage[]) || [];

  // Next step request from metadata
  const nextStepRequest = connMetadata?.next_step_request as { type: string; note: string | null; created_at: string } | null;

  // Time proposal from metadata
  const timeProposal = connMetadata?.time_proposal as {
    id: string; from_profile_id: string; type: string;
    slots: Array<{ date: string; time: string; timezone: string }>;
    status: string; accepted_slot_index?: number; created_at: string;
  } | null;

  // Scheduled call from metadata
  const scheduledCall = connMetadata?.scheduled_call as {
    type: string; date: string; time: string; timezone: string;
    proposed_by: string; confirmed_at: string; status: string;
  } | null;

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

  // ── Date separator helper ──
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
                        isOwn ? "border-gray-700 bg-gray-750" : "border-gray-100 bg-gray-50"
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

          // Time proposal — interactive card
          if (msg.type === "time_proposal") {
            const isProposalActive = timeProposal?.status === "pending" && timeProposal?.created_at === msg.created_at;
            const isProposalResolved = timeProposal?.status === "accepted" && timeProposal?.created_at === msg.created_at;
            const proposalData = isProposalActive || isProposalResolved ? timeProposal : null;
            const canRespond = isProposalActive && !isOwn;

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
                  <div className="max-w-[85%] w-full">
                    <div className={`rounded-2xl overflow-hidden border ${
                      isProposalResolved
                        ? "bg-emerald-50 border-emerald-200"
                        : isOwn ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                    }`}>
                      <div className={`flex items-center gap-2 px-4 py-2 border-b ${
                        isProposalResolved
                          ? "border-emerald-200 bg-emerald-100/50"
                          : isOwn ? "border-gray-700" : "border-gray-100 bg-gray-50"
                      }`}>
                        <svg className={`w-3.5 h-3.5 ${isProposalResolved ? "text-emerald-600" : isOwn ? "text-gray-400" : "text-gray-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className={`text-xs font-bold uppercase tracking-wider ${
                          isProposalResolved ? "text-emerald-700" : isOwn ? "text-gray-300" : "text-gray-600"
                        }`}>
                          {isProposalResolved ? "Time Confirmed" : "Suggested Times"}
                        </span>
                      </div>
                      <div className="px-4 py-3 space-y-2">
                        {proposalData?.slots.map((slot, si) => {
                          const d = new Date(`${slot.date}T${slot.time}:00`);
                          const label = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
                            + " \u00b7 " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
                            + " " + slot.timezone.replace(/_/g, " ").split("/").pop();
                          const isAcceptedSlot = isProposalResolved && proposalData.accepted_slot_index === si;
                          const isDeclinedSlot = isProposalResolved && proposalData.accepted_slot_index !== si;

                          return (
                            <label
                              key={si}
                              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                                isAcceptedSlot ? "bg-emerald-100 border border-emerald-300" :
                                isDeclinedSlot ? "opacity-40 line-through" :
                                canRespond ? "hover:bg-gray-50 cursor-pointer border border-gray-100" :
                                isOwn ? "border border-gray-600" : "border border-gray-100"
                              }`}
                            >
                              {canRespond && (
                                <input
                                  type="radio"
                                  name="slot-select"
                                  checked={selectedSlotIndex === si}
                                  onChange={() => setSelectedSlotIndex(si)}
                                  className="w-4 h-4 text-primary-600"
                                />
                              )}
                              {isAcceptedSlot && (
                                <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                              <span className={`text-sm ${
                                isAcceptedSlot ? "font-semibold text-emerald-800" :
                                isOwn && !isProposalResolved ? "text-white" : "text-gray-800"
                              }`}>
                                {label}
                              </span>
                            </label>
                          );
                        })}
                        {/* If no proposalData, just show the text */}
                        {!proposalData && (
                          <p className={`text-sm leading-relaxed ${isOwn ? "text-white" : "text-gray-800"}`}>
                            {msg.text}
                          </p>
                        )}
                      </div>
                      {canRespond && (
                        <div className="px-4 pb-3 flex gap-2">
                          <button
                            type="button"
                            onClick={() => selectedSlotIndex !== null && handleRespondProposal("accept", selectedSlotIndex)}
                            disabled={selectedSlotIndex === null || respondingProposal}
                            className="flex-[2] px-3 py-2 text-xs font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                          >
                            {respondingProposal ? "..." : "Accept Selected"}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowTimePicker(true);
                              setProposalSlots([{ date: "", time: "", timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }]);
                            }}
                            className="flex-1 px-3 py-2 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            Suggest Different
                          </button>
                        </div>
                      )}
                      {canRespond && (
                        <div className="px-4 pb-3 pt-0">
                          <button
                            type="button"
                            onClick={() => handleRespondProposal("decline")}
                            disabled={respondingProposal}
                            className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                          >
                            Decline
                          </button>
                        </div>
                      )}
                    </div>
                    <p className={`text-xs mt-1 ${isOwn ? "text-right" : "text-left"} text-gray-400`}>
                      {msgDate}
                    </p>
                  </div>
                </div>
              </div>
            );
          }

          // Time accepted — confirmation card
          if (msg.type === "time_accepted") {
            return (
              <div key={i}>
                {showSeparator && (
                  <div className="flex items-center gap-3 py-1">
                    <div className="flex-1 border-t border-emerald-100" />
                    <span className="text-xs font-medium text-emerald-600">
                      {formatDateSeparator(msg.created_at)}
                    </span>
                    <div className="flex-1 border-t border-emerald-100" />
                  </div>
                )}
                <div className="flex justify-center">
                  <span className="text-xs text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full font-medium">
                    {msg.text}
                  </span>
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

  // ── Message Input ──
  const renderMessageInput = () => {
    if (!showMessageInput) return null;
    return (
      <div className="shrink-0 px-6 py-4 border-t border-gray-100">
        <div className="flex gap-2">
          <input
            ref={messageInputRef}
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

  // ── Action Bar: Request Status ──
  // ── Time slot picker (inline) ──
  const TIME_OPTIONS = Array.from({ length: 23 }, (_, i) => {
    const hour = 9 + Math.floor(i / 2);
    const min = i % 2 === 0 ? "00" : "30";
    if (hour > 20) return null;
    const h24 = `${String(hour).padStart(2, "0")}:${min}`;
    const d = new Date(`2026-01-01T${h24}:00`);
    const label = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    return { value: h24, label };
  }).filter(Boolean) as Array<{ value: string; label: string }>;

  const US_TIMEZONES = [
    { value: "America/New_York", label: "Eastern" },
    { value: "America/Chicago", label: "Central" },
    { value: "America/Denver", label: "Mountain" },
    { value: "America/Los_Angeles", label: "Pacific" },
    { value: "America/Anchorage", label: "Alaska" },
    { value: "Pacific/Honolulu", label: "Hawaii" },
  ];

  // Get tomorrow's date as minimum
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  const renderTimePicker = () => {
    const validSlots = proposalSlots.filter((s) => s.date && s.time);

    return (
      <div className="space-y-3">
        {proposalSlots.map((slot, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="date"
              min={minDate}
              value={slot.date}
              onChange={(e) => {
                const updated = [...proposalSlots];
                updated[i] = { ...updated[i], date: e.target.value };
                setProposalSlots(updated);
              }}
              className="flex-1 px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
            />
            <select
              value={slot.time}
              onChange={(e) => {
                const updated = [...proposalSlots];
                updated[i] = { ...updated[i], time: e.target.value };
                setProposalSlots(updated);
              }}
              className="flex-1 px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Time</option>
              {TIME_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            {proposalSlots.length > 1 && (
              <button
                type="button"
                onClick={() => setProposalSlots(proposalSlots.filter((_, j) => j !== i))}
                className="text-gray-400 hover:text-red-500 transition-colors p-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        ))}

        {/* Timezone selector (shared across all slots) */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Timezone:</span>
          <select
            value={proposalSlots[0]?.timezone || "America/New_York"}
            onChange={(e) => {
              setProposalSlots(proposalSlots.map((s) => ({ ...s, timezone: e.target.value })));
            }}
            className="flex-1 px-2 py-1 text-xs border border-gray-200 rounded-lg"
          >
            {US_TIMEZONES.map((tz) => (
              <option key={tz.value} value={tz.value}>{tz.label}</option>
            ))}
          </select>
        </div>

        {proposalSlots.length < 3 && (
          <button
            type="button"
            onClick={() => setProposalSlots([...proposalSlots, { date: "", time: "", timezone: proposalSlots[0]?.timezone || "America/New_York" }])}
            className="text-xs text-primary-600 hover:text-primary-700 font-medium transition-colors"
          >
            + Add another time
          </button>
        )}

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={() => { setShowTimePicker(false); setProposalSlots([{ date: "", time: "", timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }]); }}
            className="flex-1 px-3 py-2 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleProposeTimes}
            disabled={validSlots.length === 0 || proposalSending}
            className="flex-[2] px-3 py-2 text-xs font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {proposalSending ? "Sending..." : `Send ${validSlots.length || ""} Time${validSlots.length !== 1 ? "s" : ""}`}
          </button>
        </div>
      </div>
    );
  };

  // ── Scheduled call status bar ──
  const renderScheduledCallStatus = () => {
    if (!scheduledCall || scheduledCall.status !== "confirmed") return null;

    const d = new Date(`${scheduledCall.date}T${scheduledCall.time}:00`);
    const dateLabel = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    const timeLabel = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    const tzLabel = scheduledCall.timezone.replace(/_/g, " ").split("/").pop();
    const proposedByOther = scheduledCall.proposed_by !== activeProfile?.id;

    // Check if call time has passed
    const callDateTime = new Date(`${scheduledCall.date}T${scheduledCall.time}:00`);
    const isPast = callDateTime < new Date();

    return (
      <div className={`p-3 rounded-xl border ${isPast ? "border-gray-200 bg-gray-50/50" : "border-emerald-200 bg-emerald-50/40"}`}>
        <div className="flex items-center gap-2 mb-1">
          <svg className={`w-4 h-4 ${isPast ? "text-gray-400" : "text-emerald-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <p className={`text-sm font-semibold ${isPast ? "text-gray-600" : "text-gray-900"}`}>
            {isPast ? "Call was scheduled" : `${scheduledCall.type === "call" ? "Call" : scheduledCall.type === "consultation" ? "Consultation" : "Visit"} confirmed`}
          </p>
        </div>
        <p className={`text-sm ${isPast ? "text-gray-400" : "text-gray-700"} ml-6 mb-2`}>
          {dateLabel} &middot; {timeLabel} {tzLabel}
        </p>
        {!isPast && (
          <div className="flex items-center gap-3 ml-6">
            <button
              type="button"
              onClick={() => {
                import("@/lib/ics").then(({ generateICS, downloadICS }) => {
                  const ics = generateICS({
                    date: scheduledCall.date,
                    time: scheduledCall.time,
                    timezone: scheduledCall.timezone,
                    title: `${scheduledCall.type === "call" ? "Call" : scheduledCall.type === "consultation" ? "Consultation" : "Visit"} with ${otherName} — Olera`,
                    description: `Scheduled via Olera`,
                  });
                  downloadICS(ics);
                });
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Add to Calendar
            </button>
            <button
              type="button"
              onClick={() => {
                setShowTimePicker(true);
                setProposalSlots([{ date: "", time: "", timezone: scheduledCall.timezone }]);
              }}
              className="text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
            >
              Reschedule
            </button>
            <button
              type="button"
              onClick={handleCancelScheduledCall}
              disabled={actionLoading}
              className="text-xs font-medium text-red-400 hover:text-red-600 transition-colors"
            >
              {actionLoading ? "..." : "Cancel call"}
            </button>
          </div>
        )}
        {isPast && (
          <div className="ml-6 mt-1">
            <p className="text-xs text-gray-400 mb-2">How did the call go?</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowTimePicker(true);
                  setProposalSlots([{ date: "", time: "", timezone: scheduledCall.timezone }]);
                }}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Reschedule
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ── Pre-qualification prompts (computed from existing data) ──
  const renderPreQualPrompts = () => {
    if (!scheduledCall || scheduledCall.status !== "confirmed") return null;
    const callDate = new Date(`${scheduledCall.date}T${scheduledCall.time}:00`);
    if (callDate < new Date()) return null;

    const prompts: Array<{ label: string; completed: boolean; prefill: string }> = [];

    if (!isProvider) {
      // Family prompts
      const hasCareType = !!(parsedMsg?.careType);
      const hasUrgency = !!(parsedMsg?.urgency);
      prompts.push({
        label: "Confirm care needs and schedule",
        completed: hasCareType && hasUrgency,
        prefill: "For our call, I want to confirm our care needs: ",
      });

      const familyMeta = (activeProfile?.metadata || {}) as Record<string, unknown>;
      const hasBudget = !!(familyMeta.budget_min || familyMeta.budget_max) || thread.some((m) => m.from_profile_id === activeProfile?.id && (m.text.includes("$") || m.text.toLowerCase().includes("budget")));
      prompts.push({
        label: "Share budget range",
        completed: hasBudget,
        prefill: "Our budget range is approximately ",
      });

      const hasLocation = !!(activeProfile?.city && activeProfile?.state);
      prompts.push({
        label: "Confirm location and service type",
        completed: hasLocation && hasCareType,
        prefill: "We're located in ",
      });
    } else {
      // Provider prompts
      const hasRepliedSinceConfirm = thread.some(
        (m) => m.from_profile_id === activeProfile?.id && new Date(m.created_at) > new Date(scheduledCall.confirmed_at)
      );
      prompts.push({
        label: "Review care needs",
        completed: hasRepliedSinceConfirm,
        prefill: "I've reviewed your care needs and ",
      });

      const providerMeta = (activeProfile?.metadata || {}) as Record<string, unknown>;
      if (activeProfile?.type === "caregiver") {
        prompts.push({
          label: "Confirm availability and rates",
          completed: !!(providerMeta.hourly_rate_min),
          prefill: "My availability is ",
        });
      } else {
        prompts.push({
          label: "Prepare service information",
          completed: !!(activeProfile?.description),
          prefill: "Here's what our services include: ",
        });
      }
    }

    const completedCount = prompts.filter((p) => p.completed).length;
    if (completedCount === prompts.length) return null;

    return (
      <div className="mt-2 p-3 rounded-xl border border-gray-100 bg-gray-50/40">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-gray-600">Prepare for your call</p>
          <span className="text-[10px] text-gray-400">{completedCount} of {prompts.length}</span>
        </div>
        <div className="space-y-1.5">
          {prompts.map((prompt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                if (!prompt.completed) {
                  setMessageText(prompt.prefill);
                  requestAnimationFrame(() => messageInputRef.current?.focus());
                }
              }}
              className={`flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-lg text-xs transition-colors ${
                prompt.completed
                  ? "text-gray-400"
                  : "text-gray-700 hover:bg-white"
              }`}
            >
              {prompt.completed ? (
                <svg className="w-3.5 h-3.5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <span className="w-3.5 h-3.5 border border-gray-300 rounded shrink-0" />
              )}
              <span className={prompt.completed ? "line-through" : ""}>{prompt.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  };

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
    const timeAgo = relativeTime(nextStepRequest.created_at);

    // ── Responder view: action card with structured time picker ──
    if (!isRequester) {
      return (
        <div className="p-3 rounded-xl border border-primary-100 bg-primary-50/40">
          <p className="text-sm font-medium text-gray-900 mb-1">
            {otherName} would like to schedule {stepNoun}
          </p>
          {nextStepRequest.note && (
            <p className="text-xs text-gray-500 italic mb-2">&ldquo;{nextStepRequest.note}&rdquo;</p>
          )}

          {showTimePicker ? (
            renderTimePicker()
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowTimePicker(true);
                  setProposalSlots([{ date: "", time: "", timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }]);
                }}
                className="flex-[2] px-3 py-2 text-xs font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
              >
                Suggest Times
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
          )}
        </div>
      );
    }

    // ── Requester view: compact inline status ──
    // Check if the other party has sent any regular messages after the request
    const otherRepliedAfterRequest = thread.some(
      (m) =>
        m.from_profile_id === otherProfile?.id &&
        m.type !== "system" &&
        m.type !== "next_step_request" &&
        new Date(m.created_at) > new Date(nextStepRequest.created_at)
    );

    return (
      <div className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl ${
        otherRepliedAfterRequest
          ? "bg-emerald-50/50 border border-emerald-100"
          : "bg-amber-50/50 border border-amber-100"
      }`}>
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900">
            {nextStepRequest.type === "call" ? "Call" :
             nextStepRequest.type === "consultation" ? "Consultation" :
             "Home visit"} requested
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {otherRepliedAfterRequest
              ? `${otherName} responded \u2014 check their message above`
              : <>Waiting for {otherName} &mdash; most respond within a few hours</>}
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

      {/* Panel */}
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
              {isInbound && connection.status === "pending" && (
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
                  {/* Pending hint line */}
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

            {/* ── UPCOMING CALL CHIP ── */}
            {scheduledCall?.status === "confirmed" && !shouldBlur && (() => {
              const cd = new Date(`${scheduledCall.date}T${scheduledCall.time}:00`);
              const isPast = cd < new Date();
              if (isPast) return null;
              const lbl = cd.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
                + " \u00b7 " + cd.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
              return (
                <div className="px-6 pb-2 shrink-0">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-100">
                    <PhoneIcon className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-xs font-medium text-emerald-700">
                      Upcoming {scheduledCall.type} &middot; {lbl}
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* ── CONVERSATION ── */}
            <>
              <div ref={conversationRef} className="flex-1 overflow-y-auto min-h-0 px-6 py-4">
                {renderConversation()}
              </div>

              {/* ── ACTION BAR: Fixed between conversation and input ── */}
              {isAccepted && !shouldBlur && (
                <div className="shrink-0 px-6 py-3 border-t border-gray-100 transition-all duration-200">
                  {/* Priority: scheduled call > time picker open > active proposal waiting > next step request > default */}
                  {scheduledCall?.status === "confirmed" ? (
                    showTimePicker ? (
                      <div className="p-3 rounded-xl border border-gray-200 bg-gray-50/40">
                        <p className="text-sm font-medium text-gray-900 mb-2">Reschedule — suggest new times</p>
                        {renderTimePicker()}
                      </div>
                    ) : (
                      <>{renderScheduledCallStatus()}{renderPreQualPrompts()}</>
                    )
                  ) : showTimePicker ? (
                    <div className="p-3 rounded-xl border border-primary-100 bg-primary-50/40">
                      <p className="text-sm font-medium text-gray-900 mb-2">Suggest times for {nextStepRequest?.type === "consultation" ? "a consultation" : nextStepRequest?.type === "visit" ? "a visit" : "a call"}</p>
                      {renderTimePicker()}
                    </div>
                  ) : nextStepRequest ? (
                    renderRequestStatus()
                  ) : !isProvider ? (
                    /* ── Family: Schedule CTA with contextual microcopy ── */
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
                    /* ── Provider: Soft contextual guidance ── */
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

                {/* ── Provider: Past Connection Actions ── */}
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
                {!isProvider && !shouldBlur && (connection.status === "declined" || connection.status === "expired" || connection.status === "archived") && (
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
                            Connect again
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
                    {connection.status === "archived" && (
                      <div className="flex gap-3">
                        <Link href={profileHref} className="flex-1">
                          <button
                            type="button"
                            className="w-full min-h-[44px] rounded-xl bg-primary-600 text-white text-base font-semibold hover:bg-primary-700 transition-colors"
                          >
                            Reconnect
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
                They&apos;ll be notified that this connection has ended. You can always reconnect later.
              </p>
              <div className="mt-3 flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
                <svg className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs text-amber-800 leading-relaxed">
                  {otherName} will be notified that you&apos;ve ended this connection.
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

