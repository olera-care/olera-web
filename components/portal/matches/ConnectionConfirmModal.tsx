"use client";

import { useState } from "react";
import Link from "next/link";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import type { Provider } from "@/lib/types/provider";
import type { BusinessProfile, FamilyMetadata } from "@/lib/types";
import {
  getPrimaryImage,
  formatLocation,
  getCategoryDisplayName,
} from "@/lib/types/provider";
import { useProfileCompleteness } from "@/components/portal/profile/completeness";

interface ConnectionConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  provider: Provider | null;
  activeProfile: BusinessProfile | null;
  userEmail?: string;
}

function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#199087"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export default function ConnectionConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  provider,
  activeProfile,
  userEmail,
}: ConnectionConfirmModalProps) {
  const [sending, setSending] = useState(false);
  const { percentage } = useProfileCompleteness(activeProfile, userEmail);

  if (!provider) return null;

  const image = getPrimaryImage(provider);
  const location = formatLocation(provider);
  const rating = provider.google_rating || 0;

  const meta = (activeProfile?.metadata || {}) as FamilyMetadata;

  // Build profile summary fields
  const fields = [
    {
      label: "Care for",
      value: meta.relationship_to_recipient
        ? meta.relationship_to_recipient
            .replace(/_/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase())
        : null,
    },
    {
      label: "Type of care",
      value:
        activeProfile?.care_types?.length
          ? activeProfile.care_types
              .map((ct) =>
                ct
                  .replace(/_/g, " ")
                  .replace(/\b\w/g, (c) => c.toUpperCase())
              )
              .join(", ")
          : null,
    },
    {
      label: "Timeline",
      value: meta.timeline
        ? meta.timeline
            .replace(/_/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase())
        : null,
    },
    {
      label: "Location",
      value:
        activeProfile?.city && activeProfile?.state
          ? `${activeProfile.city}, ${activeProfile.state}`
          : null,
    },
    {
      label: "Payment",
      value: meta.payment_methods?.length
        ? meta.payment_methods.join(", ")
        : null,
    },
    {
      label: "Notes",
      value: meta.about_situation || activeProfile?.description || null,
    },
    {
      label: "Phone",
      value: activeProfile?.phone || null,
    },
  ];

  const handleConfirm = async () => {
    setSending(true);
    try {
      await onConfirm();
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className="-mx-7 -mb-7 -mt-2">
        {/* Header */}
        <div className="px-6 pb-4 border-b border-gray-200">
          <h3 className="text-[17px] font-bold text-gray-900">
            Send Connection Request
          </h3>
        </div>

        {/* Provider summary */}
        <div className="px-6 py-4 bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
              {image ? (
                <img
                  src={image}
                  alt={provider.provider_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl">
                  🏠
                </div>
              )}
            </div>
            <div>
              <p className="text-[15px] font-semibold text-gray-900">
                {provider.provider_name}
              </p>
              <p className="text-xs text-gray-500">
                {location}
                {rating > 0 && (
                  <>
                    {" "}
                    ·{" "}
                    <span className="text-primary-600 font-semibold">
                      Olera {rating.toFixed(1)}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Profile summary */}
        <div className="px-6 py-5">
          <p className="text-[13px] font-semibold text-gray-800 mb-3">
            Your profile will be shared:
          </p>

          <div className="flex flex-col gap-2">
            {fields.map((f, i) => (
              <div
                key={i}
                className={[
                  "flex items-center justify-between py-1.5",
                  i < fields.length - 1 ? "border-b border-gray-100" : "",
                ].join(" ")}
              >
                <div>
                  <span className="text-[11px] text-gray-400">{f.label}</span>
                  <p
                    className={[
                      "text-[13px] mt-0.5",
                      f.value
                        ? "text-gray-800 font-medium"
                        : "text-gray-400 italic",
                    ].join(" ")}
                  >
                    {f.value || "Not added yet"}
                  </p>
                </div>
                {f.value ? (
                  <CheckIcon />
                ) : (
                  <Link
                    href="/portal/profile"
                    className="text-[11px] text-primary-600 font-medium hover:text-primary-700"
                  >
                    + Add
                  </Link>
                )}
              </div>
            ))}
          </div>

          {/* Completeness bar */}
          <div className="flex items-center gap-2 px-3.5 py-3 bg-amber-50 rounded-xl mt-4 border border-amber-100">
            <div className="w-8 h-1.5 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary-600 to-primary-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="text-[11px] text-amber-800 font-medium">
              {percentage}% complete
            </span>
            <Link
              href="/portal/profile"
              className="text-[11px] text-primary-600 font-medium ml-auto hover:text-primary-700"
            >
              Edit profile →
            </Link>
          </div>

          {/* Privacy note */}
          <div className="flex items-start gap-2 px-3.5 py-2.5 bg-gray-50 rounded-xl mt-3 border border-gray-100">
            <span className="text-sm flex-shrink-0">👁</span>
            <p className="text-xs text-gray-600 leading-relaxed">
              Providers in your area who match your care type will see your
              request. Your email and phone are only shared when you accept a
              connection.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-5 flex gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="flex-1 border border-gray-200"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleConfirm}
            loading={sending}
            className="flex-[2]"
          >
            Send Request
          </Button>
        </div>
      </div>
    </Modal>
  );
}
