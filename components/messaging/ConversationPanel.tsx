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
  detailOpen?: boolean;
  onToggleDetail?: () => void;
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

function parseInitialNotes(message: string | null): string | null {
  if (!message) return null;
  try {
    const p = JSON.parse(message);
    return p.additional_notes || null;
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
  detailOpen,
  onToggleDetail,
  className = "",
}: ConversationPanelProps) {
  const conversationRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
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
      if (messageInputRef.current) messageInputRef.current.style.height = 'auto';
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
  const initialNotes = parseInitialNotes(connection.message);

  const connMetadata = connection.metadata as Record<string, unknown> | undefined;
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

  // Date helpers
  const formatDateSeparator = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };
  const getDateKey = (dateStr: string) => new Date(dateStr).toDateString();
  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  return (
    <div className={`flex flex-col bg-white ${className}`}>
      {/* ── Header ── */}
      <div className="shrink-0 px-6 h-[68px] border-b border-gray-200 flex items-center gap-3">
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
          {otherProfile?.city || otherProfile?.state ? (
            <p className="text-xs text-gray-500 truncate">
              {[otherProfile.city, otherProfile.state].filter(Boolean).join(", ")}
            </p>
          ) : null}
        </div>

        {/* Show Details toggle */}
        {onToggleDetail && (
          <button
            onClick={onToggleDetail}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-lg transition-colors ${
              detailOpen
                ? "text-primary-700 border-primary-200 bg-primary-50 hover:bg-primary-100"
                : "text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}
          >
            {detailOpen ? "Hide Details" : "Show Details"}
          </button>
        )}
      </div>

      {/* ── Conversation thread ── */}
      <div
        ref={conversationRef}
        className="flex-1 overflow-y-auto px-6 py-6"
      >
        <div className="space-y-5 max-w-2xl mx-auto">
          {/* Family's initial note */}
          {initialNotes && (
            <>
              <div className="flex justify-center py-3">
                <span className="text-xs font-semibold text-gray-500">
                  {formatDateSeparator(connection.created_at)}
                </span>
              </div>
              {isInbound ? (
                <p className="text-xs text-gray-400 mb-1">{otherName} &middot; {formatTime(connection.created_at)}</p>
              ) : (
                <p className="text-xs text-gray-400 text-right mb-1">{formatTime(connection.created_at)}</p>
              )}
              <div className={`flex ${isInbound ? "justify-start" : "justify-end"}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                  isInbound
                    ? "bg-gray-100 text-gray-800"
                    : "bg-gray-800 text-white"
                }`}>
                  <p className="text-[15px] leading-relaxed">{initialNotes}</p>
                </div>
              </div>
            </>
          )}

          {/* Connected milestone */}
          {connection.status === "accepted" && (
            <div className="flex justify-center py-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3.5 py-1.5 rounded-full">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Connected
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
                    <div className="flex justify-center py-3">
                      <span className="text-xs font-semibold text-gray-500">
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
            const msgTime = formatTime(msg.created_at);

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
                    <div className="flex justify-center py-3">
                      <span className="text-xs font-semibold text-gray-500">
                        {formatDateSeparator(msg.created_at)}
                      </span>
                    </div>
                  )}
                  <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                    <div className="max-w-[75%]">
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
                            isOwn ? "text-gray-400" : "text-gray-600"
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
                        {msgTime}
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
                  <div className="flex justify-center py-3">
                    <span className="text-xs font-semibold text-gray-500">
                      {formatDateSeparator(msg.created_at)}
                    </span>
                  </div>
                )}
                {isOwn ? (
                  <p className="text-xs text-gray-400 text-right mb-1">{msgTime}</p>
                ) : (
                  <p className="text-xs text-gray-400 mb-1">{otherName} &middot; {msgTime}</p>
                )}
                <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                    isOwn
                      ? "bg-gray-800 text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}>
                    <p className="text-[15px] leading-relaxed">{msg.text}</p>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Empty thread placeholder */}
          {thread.length === 0 && !initialNotes && (
            <div className="text-center py-12">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-sm text-gray-500">No messages yet</p>
              <p className="text-xs text-gray-400 mt-1">Send the first message to start the conversation</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Response time hint + Message input ── */}
      {showMessageInput && (
        <div className="shrink-0 border-t border-gray-200 bg-white">
          {/* Response time hint */}
          <div className="flex items-center justify-center gap-1.5 py-2.5 bg-gray-50/80 border-b border-gray-100">
            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" strokeWidth={1.5} />
              <path strokeLinecap="round" strokeWidth={1.5} d="M12 6v6l4 2" />
            </svg>
            <span className="text-xs text-gray-500">Providers typically respond within a few hours</span>
          </div>

          {/* Input area */}
          <div className="px-6 py-4">
            <div className="max-w-2xl mx-auto border border-gray-300 rounded-2xl focus-within:border-gray-400 focus-within:shadow-sm transition-all overflow-hidden">
              <textarea
                ref={messageInputRef}
                value={messageText}
                onChange={(e) => {
                  setMessageText(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && messageText.trim()) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={messagePlaceholder}
                disabled={sending}
                rows={1}
                className="w-full px-4 pt-3.5 pb-1 text-[15px] text-gray-900 placeholder:text-gray-400 outline-none resize-none disabled:opacity-50 leading-relaxed bg-transparent"
              />
              <div className="flex items-center justify-end px-3 pb-3">
                <button
                  type="button"
                  onClick={handleSendMessage}
                  disabled={sending || !messageText.trim()}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    messageText.trim()
                      ? "bg-gray-900 text-white hover:bg-gray-800"
                      : "bg-gray-200 text-gray-400"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V5m0 0l-7 7m7-7l7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
