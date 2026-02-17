"use client";

import { useState } from "react";
import { avatarGradient } from "@/components/portal/ConnectionDetailContent";
import type { InterestedProvider } from "@/hooks/useInterestedProviders";
import type { OrganizationMetadata } from "@/lib/types";
import Button from "@/components/ui/Button";

interface InterestedDetailContentProps {
  item: InterestedProvider;
  onClose: () => void;
  onAccept: (id: string) => Promise<void>;
  onDecline: (id: string) => Promise<void>;
}

export default function InterestedDetailContent({
  item,
  onClose,
  onAccept,
  onDecline,
}: InterestedDetailContentProps) {
  const [actionState, setActionState] = useState<
    "idle" | "accepting" | "declining" | "accepted"
  >("idle");

  const profile = item.providerProfile;
  const name = profile?.display_name || "Unknown Provider";
  const imageUrl = profile?.image_url;
  const initial = name.charAt(0).toUpperCase();
  const location = [profile?.city, profile?.state].filter(Boolean).join(", ");
  const description = profile?.description;
  const slug = profile?.slug;

  const careTypes = profile?.care_types || [];
  const typeLabel = careTypes[0] || "Care Provider";

  const matchReasons =
    ((item.metadata as Record<string, unknown>)?.match_reasons as string[]) ||
    [];

  // Provider metadata for pricing/payment
  const provMeta = (profile?.metadata || {}) as OrganizationMetadata;
  const priceRange = provMeta.price_range || "Contact for pricing";
  const acceptsMedicaid = provMeta.accepts_medicaid;
  const acceptsMedicare = provMeta.accepts_medicare;
  const paymentMethods: string[] = [];
  if (acceptsMedicaid) paymentMethods.push("Medicaid");
  if (acceptsMedicare) paymentMethods.push("Medicare");
  if (paymentMethods.length === 0) paymentMethods.push("Contact provider");

  const handleAccept = async () => {
    setActionState("accepting");
    try {
      await onAccept(item.id);
      setActionState("accepted");
    } catch {
      setActionState("idle");
    }
  };

  const handleDecline = async () => {
    setActionState("declining");
    try {
      await onDecline(item.id);
    } catch {
      setActionState("idle");
    }
  };

  // ── Accepted confirmation state ──
  if (actionState === "accepted") {
    return (
      <div className="flex flex-col h-full">
        {/* Close button */}
        <div className="flex justify-end px-6 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Connected!
            </h3>
            <p className="text-sm text-gray-500 mb-6 max-w-[280px] mx-auto">
              You can now message {name} in My Connections.
            </p>
            <a href="/portal/connections">
              <Button size="sm">Go to My Connections</Button>
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ── Normal detail view ──
  return (
    <div className="flex flex-col h-full">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3.5">
              {/* Avatar */}
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl}
                  alt={name}
                  className="w-12 h-12 rounded-full object-cover shrink-0"
                />
              ) : (
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                  style={{ background: avatarGradient(name) }}
                >
                  {initial}
                </div>
              )}

              <div className="min-w-0">
                <h2 className="text-base font-bold text-gray-900 truncate">
                  {name}
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {typeLabel} {location && `\u00B7 ${location}`}
                </p>
              </div>
            </div>

            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors shrink-0"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Match reasons */}
        {matchReasons.length > 0 && (
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Why this provider reached out
            </h3>
            <div className="space-y-2">
              {matchReasons.map((reason) => (
                <div key={reason} className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
                    <svg
                      className="w-3 h-3 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-700">{reason}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* About */}
        {description && (
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">About</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {description}
            </p>
          </div>
        )}

        {/* Pricing & Payment */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Pricing
              </span>
              <span className="text-sm text-gray-700">{priceRange}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Payment
              </span>
              <div className="flex flex-wrap gap-1.5 justify-end">
                {paymentMethods.map((method) => (
                  <span
                    key={method}
                    className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700"
                  >
                    {method}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* View full profile link */}
        {slug && (
          <div className="px-6 py-4">
            <a
              href={`/provider/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors inline-flex items-center gap-1"
            >
              View full profile
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          </div>
        )}
      </div>

      {/* Sticky action buttons */}
      <div className="shrink-0 px-6 py-4 border-t border-gray-200 bg-white">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleDecline}
            disabled={actionState !== "idle"}
            className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {actionState === "declining" ? "Declining..." : "Decline"}
          </button>
          <button
            type="button"
            onClick={handleAccept}
            disabled={actionState !== "idle"}
            className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {actionState === "accepting"
              ? "Connecting..."
              : "Accept & Connect"}
          </button>
        </div>
      </div>
    </div>
  );
}
