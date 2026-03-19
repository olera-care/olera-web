"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Modal from "@/components/ui/Modal";

interface MessageComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  providerName: string;
  providerId: string;
  providerImage?: string | null;
  providerCategory?: string | null;
  onSend: (message: string) => Promise<void>;
  // For replying to interested providers
  isReply?: boolean;
  providerMessage?: string | null;
}

export default function MessageComposerModal({
  isOpen,
  onClose,
  providerName,
  providerId,
  providerImage,
  providerCategory,
  onSend,
  isReply = false,
  providerMessage,
}: MessageComposerModalProps) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [showContent, setShowContent] = useState(false);

  // Staggered entrance animation
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setShowContent(true), 100);
      return () => clearTimeout(timer);
    } else {
      setShowContent(false);
    }
  }, [isOpen]);

  // Reset message when modal opens
  useEffect(() => {
    if (isOpen) {
      setMessage("");
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!message.trim()) return;
    setSending(true);
    try {
      await onSend(message);
      setMessage("");
      onClose();
    } catch (err) {
      console.error("[MessageComposer] Failed to send:", err);
    } finally {
      setSending(false);
    }
  };

  // Get first name for more personal touch
  const firstName = providerName.split(" ")[0].split("-")[0];
  const isLongName = firstName.length > 12;
  const displayFirstName = firstName.length > 15 ? "them" : firstName;

  const suggestions = isReply
    ? [
        { icon: "👋", text: "Say hello" },
        { icon: "📅", text: "Ask availability" },
        { icon: "📞", text: "Request a call" },
      ]
    : [
        { icon: "👋", text: "Introduce myself" },
        { icon: "📋", text: "Ask about services" },
        { icon: "💰", text: "Ask about rates" },
      ];

  const getSuggestionMessage = (text: string) => {
    if (isReply) {
      switch (text) {
        case "Say hello":
          return `Hi ${firstName}! Thanks for reaching out. I'd love to learn more about how you can help with our care needs.`;
        case "Ask availability":
          return `Hi ${firstName}! Thanks for your interest. What does your availability look like? We're hoping to get started soon.`;
        case "Request a call":
          return `Hi ${firstName}! I'd love to chat more about our situation. Would you be available for a quick phone call?`;
        default:
          return "";
      }
    } else {
      switch (text) {
        case "Introduce myself":
          return `Hi! I'm looking for care for a family member and would love to learn more about your services.`;
        case "Ask about services":
          return `Hi! Can you tell me more about the services you offer and what types of care you specialize in?`;
        case "Ask about rates":
          return `Hi! I'm interested in your services. Could you share information about your availability and rates?`;
        default:
          return "";
      }
    }
  };

  // Generate initials for avatar fallback
  const initials = providerName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="py-2">
        {/* Provider header with avatar */}
        <div
          className={`flex items-center gap-4 mb-5 transition-all duration-300 ${
            showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          }`}
        >
          {/* Provider avatar */}
          <div className="relative">
            {providerImage ? (
              <Image
                src={providerImage}
                alt={providerName}
                width={56}
                height={56}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-md"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-lg font-semibold shadow-md">
                {initials}
              </div>
            )}
          </div>

          {/* Provider info */}
          <div className="flex-1 min-w-0">
            <h2 className={`font-semibold text-gray-900 leading-tight ${isLongName ? 'text-base' : 'text-lg'}`}>
              {isReply ? `Reply to ${isLongName ? firstName : providerName}` : `Message ${isLongName ? firstName : providerName}`}
            </h2>
            {providerCategory && (
              <p className="text-sm text-gray-500 mt-0.5">{providerCategory}</p>
            )}
          </div>
        </div>

        {/* Provider's original message (when replying) */}
        {isReply && providerMessage && (
          <div
            className={`mb-4 p-3.5 bg-gradient-to-br from-primary-50/60 to-warm-50/40 rounded-xl border border-primary-100/50 transition-all duration-300 delay-50 ${
              showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
            }`}
          >
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Their message to you
            </p>
            <p className="text-sm text-gray-700 leading-relaxed">
              &ldquo;{providerMessage}&rdquo;
            </p>
          </div>
        )}

        {/* Friendly prompt */}
        <div
          className={`mb-4 transition-all duration-300 delay-75 ${
            showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          }`}
        >
          <p className="text-sm text-gray-500">
            {isReply
              ? `${displayFirstName} reached out to you — send a reply to start the conversation.`
              : `Start a conversation — ${displayFirstName} typically responds within a few days.`}
          </p>
        </div>

        {/* Message input */}
        <div
          className={`transition-all duration-300 delay-100 ${
            showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          }`}
        >
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={
              isReply
                ? `Hi ${firstName}! Thanks for reaching out...`
                : `Hi! I'm looking for care services and came across your profile...`
            }
            rows={4}
            className="w-full px-4 py-3.5 text-[15px] bg-gray-50 border border-gray-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent focus:bg-white transition-colors placeholder:text-gray-400"
            autoFocus
          />
        </div>

        {/* Quick suggestions */}
        <div
          className={`mt-3 flex flex-wrap gap-2 transition-all duration-300 delay-150 ${
            showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          }`}
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.text}
              type="button"
              onClick={() => setMessage(getSuggestionMessage(suggestion.text))}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 transition-all"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <span>{suggestion.icon}</span>
              {suggestion.text}
            </button>
          ))}
        </div>

        {/* Contact sharing disclaimer for replies */}
        {isReply && (
          <div
            className={`mt-4 flex items-start gap-2.5 p-3 bg-amber-50/80 border border-amber-100 rounded-xl transition-all duration-300 delay-175 ${
              showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
            }`}
          >
            <svg className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
            <p className="text-xs text-amber-800 leading-relaxed">
              Once you reply, <span className="font-semibold">{firstName}</span> will be able to see your contact details and continue the conversation.
            </p>
          </div>
        )}

        {/* Actions */}
        <div
          className={`mt-5 flex gap-3 transition-all duration-300 delay-200 ${
            showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          }`}
        >
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={!message.trim() || sending}
            className="flex-1 px-4 py-3 text-sm font-semibold text-white bg-primary-600 rounded-xl hover:bg-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
          >
            {sending ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Sending...
              </>
            ) : (
              <>
                {isReply ? "Send reply" : "Send message"}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            )}
          </button>
        </div>

        {/* Privacy note (only for non-reply) */}
        {!isReply && (
          <p
            className={`mt-4 text-xs text-center text-gray-400 transition-all duration-300 delay-300 ${
              showContent ? "opacity-100" : "opacity-0"
            }`}
          >
            Your contact details stay private until you choose to share them.
          </p>
        )}
      </div>
    </Modal>
  );
}
