"use client";

import Image from "next/image";
import type { ExtendedMetadata } from "@/lib/profile-completeness";
import type { StaffInfo } from "@/lib/types";
import DashboardSectionCard from "./DashboardSectionCard";
import SectionEmptyState from "@/components/providers/SectionEmptyState";

interface OwnerCardProps {
  metadata: ExtendedMetadata;
  onEdit?: () => void;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function OwnerCard({ metadata, onEdit }: OwnerCardProps) {
  const staff = metadata.staff as StaffInfo | undefined;

  return (
    <DashboardSectionCard
      title="Facility Manager"
      id="owner"
      onEdit={onEdit}
    >
      {!staff?.name ? (
        <SectionEmptyState
          icon="info"
          message="No facility manager info"
          subMessage="Add your name, photo, and care motivation to build trust with families."
        />
      ) : (
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {staff.image ? (
              <Image
                src={staff.image}
                alt={staff.name}
                width={56}
                height={56}
                className="w-14 h-14 rounded-full object-cover"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
                <span className="text-lg font-bold text-gray-400">{getInitials(staff.name)}</span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">{staff.name}</p>
            {staff.position && (
              <p className="text-xs text-gray-500 mt-0.5">{staff.position}</p>
            )}
            {(staff.care_motivation || staff.bio) && (
              <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                {staff.care_motivation || staff.bio}
              </p>
            )}
          </div>
        </div>
      )}
    </DashboardSectionCard>
  );
}
