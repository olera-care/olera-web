"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSavedProviders } from "@/hooks/use-saved-providers";
import MessageComposerModal from "./MessageComposerModal";

interface MatchProviderCardProps {
  provider: {
    id: string;
    name: string;
    slug?: string;
    image?: string | null;
    category: string;
    city?: string | null;
    state?: string | null;
    rating?: number | null;
    priceRange?: string | null;
  };
  // If provider reached out, include their message
  interestedMessage?: string | null;
  interestedAt?: string | null;
  connectionId?: string;
  // Callbacks
  onMessage?: (providerId: string, message: string) => Promise<void>;
  onDecline?: (connectionId: string) => Promise<void>;
  // Display variant
  variant?: "default" | "compact";
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function avatarGradient(name: string): string {
  const gradients = [
    "linear-gradient(135deg, #5fa3a3, #7ab8b8)",
    "linear-gradient(135deg, #417272, #5fa3a3)",
    "linear-gradient(135deg, #4d8a8a, #7ab8b8)",
    "linear-gradient(135deg, #385e5e, #5fa3a3)",
    "linear-gradient(135deg, #5fa3a3, #96c8c8)",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function MatchProviderCard({
  provider,
  interestedMessage,
  interestedAt,
  connectionId,
  onMessage,
  onDecline,
  variant = "default",
}: MatchProviderCardProps) {
  const { isSaved, toggleSave } = useSavedProviders();
  const saved = isSaved(provider.id);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [declining, setDeclining] = useState(false);

  const location = [provider.city, provider.state].filter(Boolean).join(", ");
  const providerUrl = `/provider/${provider.slug || provider.id}`;
  const isInterested = Boolean(interestedMessage);

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleSave({
      providerId: provider.id,
      slug: provider.slug || provider.id,
      name: provider.name,
      location: location,
      careTypes: [provider.category],
      image: provider.image || null,
      rating: provider.rating ?? undefined,
    });
  };

  const handleMessageClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowMessageModal(true);
  };

  const handleDecline = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!connectionId || !onDecline) return;
    setDeclining(true);
    try {
      await onDecline(connectionId);
    } finally {
      setDeclining(false);
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!onMessage) return;
    await onMessage(provider.id, message);
  };

  return (
    <>
      <Link
        href={providerUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group block bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-all overflow-hidden"
      >
        {/* Image */}
        <div className="relative h-40 bg-gradient-to-br from-primary-50 via-gray-50 to-warm-50">
          {provider.image ? (
            <Image
              src={provider.image}
              alt={provider.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{ background: avatarGradient(provider.name) }}
              >
                <span className="text-xl font-bold text-white">
                  {getInitials(provider.name)}
                </span>
              </div>
              <span className="text-xs font-medium text-primary-400 mt-2">
                {provider.category}
              </span>
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />

          {/* Save button */}
          <button
            onClick={handleSave}
            className={`absolute top-2 right-2 w-9 h-9 rounded-full bg-white/95 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white hover:shadow-md transition-all ${saved ? "scale-105" : ""}`}
            aria-label={saved ? "Remove from saved" : "Save provider"}
          >
            <svg
              className={`w-4 h-4 transition-all ${saved ? "text-primary-600 fill-primary-600" : "text-gray-400 hover:text-primary-600"}`}
              fill={saved ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </button>

          {/* Interested badge */}
          {isInterested && (
            <div className="absolute top-2 left-2 px-2.5 py-1 bg-primary-600 text-white text-xs font-medium rounded-full shadow-sm">
              Interested in you
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Name + Rating */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-gray-900 text-[15px] group-hover:text-primary-700 transition-colors line-clamp-2 flex-1 leading-snug">
              {provider.name}
            </h3>
            {provider.rating && provider.rating > 0 && (
              <div className="flex items-center gap-1 flex-shrink-0">
                <svg className="w-4 h-4 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-sm font-semibold text-gray-900">
                  {provider.rating.toFixed(1)}
                </span>
              </div>
            )}
          </div>

          {/* Category · Location */}
          <p className="text-sm text-gray-500 mt-1 line-clamp-1">
            {provider.category}
            {location && ` · ${location}`}
          </p>

          {/* Price if available */}
          {provider.priceRange && (
            <p className="text-sm font-semibold text-gray-900 mt-2">
              {provider.priceRange}
            </p>
          )}

          {/* Provider's message (if interested) */}
          {isInterested && interestedMessage && (
            <div className="mt-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-sm text-gray-600 line-clamp-3">
                &ldquo;{interestedMessage}&rdquo;
              </p>
              {interestedAt && (
                <p className="text-xs text-gray-400 mt-1.5">
                  {formatTimeAgo(interestedAt)}
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="mt-4 flex gap-2">
            {isInterested ? (
              <>
                {/* Reply / Continue conversation */}
                <button
                  onClick={handleMessageClick}
                  className="flex-1 px-4 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Message
                </button>
                {/* Decline */}
                <button
                  onClick={handleDecline}
                  disabled={declining}
                  className="px-4 py-2.5 bg-gray-100 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
                  aria-label="Decline"
                >
                  {declining ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </button>
              </>
            ) : (
              /* Not interested yet — prompt to message */
              <button
                onClick={handleMessageClick}
                className="w-full px-4 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Message Provider
              </button>
            )}
          </div>
        </div>
      </Link>

      {/* Message Composer Modal */}
      <MessageComposerModal
        isOpen={showMessageModal}
        onClose={() => setShowMessageModal(false)}
        providerName={provider.name}
        providerId={provider.id}
        onSend={handleSendMessage}
      />
    </>
  );
}
