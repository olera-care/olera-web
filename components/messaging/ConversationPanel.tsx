"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import type { Profile } from "@/lib/types";
import type { ConnectionWithProfile } from "./ConversationList";

interface ConversationPanelProps {
  connection: ConnectionWithProfile | null;
  activeProfile: Profile | null;
  onMessageSent: (connectionId: string, thread: ThreadMessage[]) => void;
  onBack?: () => void;
  className?: string;
}

interface ThreadMessage {
  from_profile_id: string;
  text: string;
  created_at: string;
  type?: string;
  next_step?: string;
}

// ── Helpers ──

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
    default:
      return { label: "Pending", color: "text-gray-500", bg: "bg-gray-100", dot: "bg-gray-400" };
  }
}

// ── SVG Icons ──

const PhoneIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

const ClipboardIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);

const HomeIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

// ── Component ──

export default function ConversationPanel({
  connection,
  activeProfile,
  onMessageSent,
  onBack,
  className = "",
}: ConversationPanelProps) {
  const conversationRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);

  // Reset message text when switching conversations
  useEffect(() => {
    setMessageText("");
  }, [connection?.id]);

  // Auto-scroll to bottom when thread updates
  useEffect(() => {
    if (conversationRef.current) {
      requestAnimationFrame(() => {
        conversationRef.current?.scrollTo({
          top: conversationRef.current.scrollHeight,
          behavior: "smooth",
        });
      });
    }
  }, [connection?.metadata]);

  const handleSendMessage = useCallback(async () => {
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
      setMessageText("");
      onMessageSent(connection.id, data.thread);
      requestAnimationFrame(() => {
        conversationRef.current?.scrollTo({
          top: conversationRef.current.scrollHeight,
          behavior: "smooth",
        });
      });
    } catch {
      // Silent fail — could add error toast later
    } finally {
      setSending(false);
    }
  }, [connection, messageText, activeProfile, onMessageSent]);

  // ── Empty state ──
  if (!connection) {
    return (
      <div className={`flex flex-col items-center justify-center bg-gray-50 ${className}`}>
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="2" y="4" width="20" height="16" rx="2" strokeWidth={1.5} />
              <path d="M22 7l-8.97 5.7a1.94 1.94 0 01-2.06 0L2 7" strokeWidth={1.5} />
            </svg>
          </div>
          <p className="text-base font-medium text-gray-900 mb-1">Select a conversation</p>
          <p className="text-sm text-gray-500">Choose from your existing conversations to start messaging</p>
        </div>
      </div>
    );
  }

  // ── Derived values ──
  const isInbound = connection.to_profile_id === activeProfile?.id;
  const otherProfile = isInbound ? connection.fromProfile : connection.toProfile;
  const otherName = otherProfile?.display_name || "Unknown";
  const otherInitial = otherName.charAt(0).toUpperCase();
  const imageUrl = otherProfile?.image_url;
  const parsedMsg = parseMessage(connection.message);

  const connMetadata = connection.metadata as Record<string, unknown> | undefined;
  const isWithdrawn = connection.status === "expired" && connMetadata?.withdrawn === true;
  const isEnded = connection.status === "expired" && connMetadata?.ended === true;
  const status = getStatusConfig(connection.status, isInbound, isWithdrawn, isEnded);
  const thread = (connMetadata?.thread as ThreadMessage[]) || [];

  const profileHref = otherProfile
    ? (otherProfile.type === "organization" || otherProfile.type === "caregiver") && otherProfile.slug
      ? `/provider/${otherProfile.slug}`
      : `/profile/${otherProfile.id}`
    : "#";

  const showMessageInput =
    (connection.status === "pending" || connection.status === "accepted");

  const messagePlaceholder =
    connection.status === "accepted"
      ? `Message ${otherName}...`
      : "Add a note...";

  const shortDate = new Date(connection.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  // Date helpers
  const formatDateSeparator = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };
  const getDateKey = (dateStr: string) => new Date(dateStr).toDateString();

  return (
    <div className={`flex flex-col bg-white ${className}`}>
      {/* ── Header ── */}
      <div className="shrink-0 px-6 py-3.5 border-b border-gray-200 flex items-center gap-3">
        {/* Back button (mobile) */}
        {onBack && (
          <button
            onClick={onBack}
            className="lg:hidden -ml-1 mr-1 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Back to conversations"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* Avatar */}
        <Link href={profileHref} className="shrink-0">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt={otherName} className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
              style={{ background: avatarGradient(otherName) }}
            >
              {otherInitial}
            </div>
          )}
        </Link>

        {/* Name + status */}
        <div className="flex-1 min-w-0">
          <Link href={profileHref} className="text-[15px] font-semibold text-gray-900 hover:underline truncate block">
            {otherName}
          </Link>
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
            <span className={`text-xs font-medium ${status.color}`}>{status.label}</span>
          </div>
        </div>

        {/* View profile link */}
        <Link
          href={profileHref}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          View profile
        </Link>
      </div>

      {/* ── Context card ── */}
      {parsedMsg && (parsedMsg.careType || parsedMsg.careRecipient) && (
        <div className="shrink-0 px-6 py-3 bg-gray-50 border-b border-gray-100">
          <div className="flex items-center gap-4 text-xs text-gray-600">
            {parsedMsg.careType && (
              <span className="font-medium">{parsedMsg.careType}</span>
            )}
            {parsedMsg.careRecipient && (
              <>
                <span className="text-gray-300">&middot;</span>
                <span>{parsedMsg.careRecipient}</span>
              </>
            )}
            {parsedMsg.urgency && (
              <>
                <span className="text-gray-300">&middot;</span>
                <span>{parsedMsg.urgency}</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Conversation thread ── */}
      <div
        ref={conversationRef}
        className="flex-1 overflow-y-auto px-6 py-5"
      >
        <div className="space-y-4 max-w-2xl mx-auto">
          {/* Family's initial note */}
          {parsedMsg?.notes && (
            <>
              <div className="flex justify-center py-1">
                <span className="text-[11px] font-medium text-gray-400">
                  {formatDateSeparator(connection.created_at)}
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

          {/* Connected milestone */}
          {connection.status === "accepted" && (
            <div className="flex justify-center py-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
                &#10003; Connected
              </span>
            </div>
          )}

          {/* Thread messages */}
          {thread.map((msg, i) => {
            const requestDate = connection.created_at ? getDateKey(connection.created_at) : "";
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

            // Next step request cards
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

            // Regular messages
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

          {/* Empty thread placeholder */}
          {thread.length === 0 && !parsedMsg?.notes && (
            <div className="text-center py-8">
              <p className="text-sm text-gray-400">No messages yet. Send the first message below.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Message input ── */}
      {showMessageInput && (
        <div className="shrink-0 px-6 py-3 border-t border-gray-200 bg-white">
          <div className="flex items-center border border-gray-200 rounded-xl pl-4 pr-1.5 py-1.5 focus-within:border-gray-300 focus-within:ring-1 focus-within:ring-gray-200 transition-all bg-white max-w-2xl mx-auto">
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
              className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 py-1.5 outline-none disabled:opacity-50"
            />
            <button
              type="button"
              onClick={handleSendMessage}
              disabled={sending || !messageText.trim()}
              className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                messageText.trim()
                  ? "bg-primary-600 text-white hover:bg-primary-700"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
