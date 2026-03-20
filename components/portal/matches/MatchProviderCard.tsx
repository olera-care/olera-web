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
  // Match reasons (why they're a good fit)
  matchReasons?: string[];
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
  matchReasons = [],
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
  const firstName = provider.name.split(" ")[0];

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
        className="group flex flex-col h-full min-h-[420px] bg-white rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-lg hover:border-gray-300/80 hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
      >
        {/* Image Section */}
        <div className="relative h-44 flex-shrink-0 bg-gradient-to-br from-primary-50 via-gray-50 to-warm-50 overflow-hidden">
          {provider.image ? (
            <>
              <Image
                src={provider.image}
                alt={provider.name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {/* Subtle vignette overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/5" />
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm"
                style={{ background: avatarGradient(provider.name) }}
              >
                <span className="text-2xl font-bold text-white">
                  {getInitials(provider.name)}
                </span>
              </div>
              <span className="text-xs font-medium text-primary-500 mt-3 px-3 py-1 bg-white/80 rounded-full">
                {provider.category}
              </span>
            </div>
          )}

          {/* Save button - top right */}
          <button
            onClick={handleSave}
            className={`absolute top-3 right-3 w-10 h-10 rounded-full bg-white/95 backdrop-blur-sm flex items-center justify-center shadow-md hover:shadow-lg hover:bg-white transition-all duration-200 ${saved ? "scale-110" : "hover:scale-105"}`}
            aria-label={saved ? "Remove from saved" : "Save provider"}
          >
            <svg
              className={`w-5 h-5 transition-all duration-200 ${saved ? "text-rose-500 fill-rose-500" : "text-gray-400 hover:text-rose-400"}`}
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

          {/* Interested badge - top left */}
          {isInterested && (
            <div className="absolute top-3 left-3 px-3 py-1.5 bg-gradient-to-r from-primary-600 to-primary-500 text-white text-xs font-semibold rounded-full shadow-md flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-white/80 animate-pulse" />
              Interested in you
            </div>
          )}

          {/* Rating badge - bottom right on image */}
          {provider.rating && provider.rating > 0 && (
            <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2.5 py-1 bg-white/95 backdrop-blur-sm rounded-full shadow-sm">
              <svg className="w-4 h-4 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-sm font-bold text-gray-900">
                {provider.rating.toFixed(1)}
              </span>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-5 flex flex-col flex-1">
          {/* Provider name */}
          <h3 className="font-semibold text-gray-900 text-base leading-snug group-hover:text-primary-700 transition-colors line-clamp-2 min-h-[2.75rem]">
            {provider.name}
          </h3>

          {/* Category · Location */}
          <div className="flex items-center gap-1.5 mt-1.5 text-sm text-gray-500">
            <span className="truncate">{provider.category}</span>
            {location && (
              <>
                <span className="text-gray-300">·</span>
                <span className="truncate">{location}</span>
              </>
            )}
          </div>

          {/* Price */}
          <div className="mt-2.5">
            {provider.priceRange ? (
              <p className="text-sm font-semibold text-gray-900">{provider.priceRange}</p>
            ) : (
              <p className="text-sm text-gray-400 italic">Contact for pricing</p>
            )}
          </div>

          {/* Provider's message (if interested) */}
          {isInterested && interestedMessage && (
            <div className="mt-4 p-3.5 bg-gradient-to-br from-primary-50/50 to-warm-50/30 rounded-xl border border-primary-100/50">
              <p className="text-sm text-gray-700 leading-relaxed line-clamp-2">
                &ldquo;{interestedMessage}&rdquo;
              </p>
              {interestedAt && (
                <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {formatTimeAgo(interestedAt)}
                </p>
              )}
            </div>
          )}

          {/* Match reasons (if any) */}
          {matchReasons.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Why they're a good match
              </p>
              <div className="space-y-1.5">
                {matchReasons.slice(0, 2).map((reason, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="w-4 h-4 rounded-full bg-primary-100 flex items-center justify-center shrink-0 mt-0.5">
                      <svg className="w-2.5 h-2.5 text-primary-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">{reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Spacer to push actions to bottom */}
          <div className="flex-1 min-h-4" />

          {/* Actions */}
          <div className="pt-4 mt-auto border-t border-gray-100">
            {isInterested ? (
              <div className="flex gap-2.5">
                {/* Reply button */}
                <button
                  onClick={handleMessageClick}
                  className="flex-1 px-4 py-3 bg-gradient-to-b from-primary-500 to-primary-600 text-white text-sm font-semibold rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Reply to {firstName}
                </button>
                {/* Decline button */}
                <button
                  onClick={handleDecline}
                  disabled={declining}
                  className="px-4 py-3 bg-gray-100 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-200 hover:text-gray-700 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {declining ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Decline
                    </>
                  )}
                </button>
              </div>
            ) : (
              /* Message Provider button */
              <button
                onClick={handleMessageClick}
                className="w-full px-4 py-3 bg-gradient-to-b from-primary-500 to-primary-600 text-white text-sm font-semibold rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
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
        providerImage={provider.image}
        providerCategory={provider.category}
        onSend={handleSendMessage}
        isReply={isInterested}
        providerMessage={interestedMessage}
      />
    </>
  );
}
