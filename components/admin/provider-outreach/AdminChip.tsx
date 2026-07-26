"use client";

import { getAdminColor, UNASSIGNED_CHIP_COLOR } from "@/lib/provider-outreach/admin-colors";

interface AdminNameProps {
  adminId: string | null;
  adminName: string | null;
  onClick?: () => void;
  size?: "sm" | "md";
  showUnassigned?: boolean;
}

/**
 * Colored text displaying an admin's name with stable color based on their ID.
 * Shows "Unassigned" in gray when no admin is assigned.
 *
 * This is just colored text - no pill/chip styling.
 */
export function AdminChip({
  adminId,
  adminName,
  onClick,
  size = "md",
  showUnassigned = true,
}: AdminNameProps) {
  const isUnassigned = !adminId || !adminName;

  if (isUnassigned && !showUnassigned) {
    return null;
  }

  const color = isUnassigned ? UNASSIGNED_CHIP_COLOR : getAdminColor(adminId!);
  const displayName = isUnassigned ? "Unassigned" : adminName;

  const sizeClasses = size === "sm" ? "text-xs" : "text-sm";
  const interactiveClasses = onClick ? "cursor-pointer hover:underline" : "";

  return (
    <span
      className={`font-medium ${color.text} ${sizeClasses} ${interactiveClasses}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      } : undefined}
    >
      {displayName}
    </span>
  );
}

/**
 * Small avatar circle with admin's initial and stable color.
 * Useful for compact displays in dropdowns.
 */
export function AdminAvatar({
  adminId,
  adminName,
  size = "md",
}: {
  adminId: string | null;
  adminName: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const isUnassigned = !adminId || !adminName;
  const color = isUnassigned ? UNASSIGNED_CHIP_COLOR : getAdminColor(adminId!);
  const initial = isUnassigned ? "?" : adminName.charAt(0).toUpperCase();

  const sizeClasses = {
    sm: "w-5 h-5 text-xs",
    md: "w-6 h-6 text-sm",
    lg: "w-8 h-8 text-base",
  }[size];

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full border font-medium ${sizeClasses} ${color.bg} ${color.text} ${color.border}`}
      title={isUnassigned ? "Unassigned" : adminName}
    >
      {initial}
    </span>
  );
}
