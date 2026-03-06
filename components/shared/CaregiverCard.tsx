"use client";

import Link from "next/link";
import type { Profile, CaregiverMetadata } from "@/lib/types";
import ConnectButton from "@/components/shared/ConnectButton";
import { CAREGIVER_SKILL_LABELS } from "@/lib/constants/caregiver-skills";

function blurName(name: string): string {
  if (!name) return "***";
  return name.charAt(0) + "***";
}

interface CaregiverCardProps {
  caregiver: Profile;
  hasAccess: boolean;
  fromProfileId?: string;
  /** Text shown when user doesn't have access */
  lockedMessage?: string;
}

export default function CaregiverCard({
  caregiver,
  hasAccess,
  fromProfileId,
  lockedMessage = "Sign in to view full details and connect.",
}: CaregiverCardProps) {
  const meta = caregiver.metadata as CaregiverMetadata;
  const locationStr = [caregiver.city, caregiver.state].filter(Boolean).join(", ");
  const rateStr =
    meta?.hourly_rate_min && meta?.hourly_rate_max
      ? `$${meta.hourly_rate_min}-${meta.hourly_rate_max}/hr`
      : null;
  const certifications = meta?.certifications || [];
  const experience = meta?.years_experience;

  const cardBody = (
    <>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-secondary-100 text-secondary-700 rounded-full flex items-center justify-center text-sm font-semibold">
          {hasAccess ? caregiver.display_name.charAt(0).toUpperCase() : "?"}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {hasAccess ? caregiver.display_name : blurName(caregiver.display_name)}
          </h3>
          {locationStr && (
            <p className="text-sm text-gray-500">
              {hasAccess ? locationStr : "***"}
            </p>
          )}
        </div>
      </div>

      {experience && (
        <p className="text-base text-gray-600 mb-2">
          <span className="font-medium">{experience} years</span> experience
        </p>
      )}

      {rateStr && (
        <p className="text-base text-gray-600 mb-2">
          <span className="font-medium">Rate:</span> {rateStr}
        </p>
      )}

      {certifications.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {certifications.slice(0, 3).map((cert) => (
            <span
              key={cert}
              className="bg-secondary-50 text-secondary-700 text-xs px-2.5 py-1 rounded-full"
            >
              {cert}
            </span>
          ))}
          {certifications.length > 3 && (
            <span className="bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-full">
              +{certifications.length - 3} more
            </span>
          )}
        </div>
      )}

      {caregiver.care_types.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {caregiver.care_types.slice(0, 2).map((type) => (
            <span
              key={type}
              className="bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-full"
            >
              {CAREGIVER_SKILL_LABELS[type] || type}
            </span>
          ))}
        </div>
      )}

      {!hasAccess && (
        <p className="text-sm text-warm-600 font-medium mt-3">
          {lockedMessage}
        </p>
      )}

      {hasAccess && (
        <p className="mt-3 text-primary-600 font-medium text-sm">
          View profile &rarr;
        </p>
      )}
    </>
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 hover:shadow-md hover:border-primary-200 transition-shadow duration-200 cursor-pointer">
      {hasAccess && caregiver.slug ? (
        <Link href={`/provider/${caregiver.slug}`} target="_blank" className="block p-6">
          {cardBody}
        </Link>
      ) : (
        <div className="p-6">{cardBody}</div>
      )}

      {hasAccess && fromProfileId && (
        <div className="px-6 pb-6 -mt-2">
          <ConnectButton
            fromProfileId={fromProfileId}
            toProfileId={caregiver.id}
            toName={caregiver.display_name}
            connectionType="invitation"
            label="Invite to Apply"
            sentLabel="Invitation Sent"
          />
        </div>
      )}
    </div>
  );
}
