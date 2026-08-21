"use client";

import { useEffect } from "react";
import { getAdminColor } from "@/lib/provider-outreach/admin-colors";

export interface AdminCount {
  count: number;
  display_name?: string;
}

export interface AdminCounts {
  [adminId: string]: AdminCount;
}

interface AdminFilterChipsProps {
  adminCounts: AdminCounts;
  totalCount: number;
  selectedAdminId: string | null; // null = show all assigned work combined
  onSelect: (adminId: string | null) => void;
  tabKey: string; // For localStorage persistence
}

/**
 * Filter row for filtering providers by assigned admin.
 * Uses plain colored text instead of pills.
 *
 * Layout: Grace 12 · Ces 8 (only admins with assignments)
 *
 * - Selected item is underlined
 * - Admin names use their stable color
 * - No "All" or "Unassigned" chips - focus on assigned work
 * - null selection shows combined view of all assigned admins
 *
 * Selection is persisted per-tab in localStorage.
 */
export function AdminFilterChips({
  adminCounts,
  totalCount,
  selectedAdminId,
  onSelect,
  tabKey,
}: AdminFilterChipsProps) {
  // Filter to only admins with assignments (exclude "unassigned" and count > 0)
  const adminIds = Object.keys(adminCounts)
    .filter((id) => id !== "unassigned" && adminCounts[id].count > 0);

  // Sort admins by display name
  adminIds.sort((a, b) => {
    const nameA = adminCounts[a].display_name || "";
    const nameB = adminCounts[b].display_name || "";
    return nameA.localeCompare(nameB);
  });

  // Calculate total assigned count (sum of all admin counts, excluding unassigned)
  const totalAssignedCount = adminIds.reduce((sum, id) => sum + adminCounts[id].count, 0);

  // Load persisted selection on mount, validate it exists in current adminCounts
  useEffect(() => {
    const stored = localStorage.getItem(`provider-outreach-filter-${tabKey}`);
    if (stored !== null) {
      const value = stored === "null" ? null : stored;
      // Only allow selecting existing admins with assignments, or null for combined view
      // Don't allow "unassigned" anymore since we're focused on assigned work
      const isValidSelection = value === null || (value !== "unassigned" && value in adminCounts && adminCounts[value].count > 0);
      if (isValidSelection && value !== selectedAdminId) {
        onSelect(value);
      } else if (!isValidSelection && selectedAdminId !== null) {
        // Invalid selection (admin no longer exists or has 0 count), reset to combined view
        localStorage.removeItem(`provider-outreach-filter-${tabKey}`);
        onSelect(null);
      }
    }
  }, [tabKey, adminCounts]); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist selection changes
  const handleSelect = (adminId: string | null) => {
    localStorage.setItem(
      `provider-outreach-filter-${tabKey}`,
      adminId === null ? "null" : adminId
    );
    onSelect(adminId);
  };

  // If no admins have assignments, don't render anything
  if (adminIds.length === 0) {
    return null;
  }

  // If only one admin has assignments, no need for filter chips
  if (adminIds.length === 1) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4 text-sm">
      {/* Combined view (all assigned work) */}
      <FilterItem
        label="All Assigned"
        count={totalAssignedCount}
        isSelected={selectedAdminId === null}
        onClick={() => handleSelect(null)}
        textColorClass="text-gray-700"
      />

      {/* Admin names - only those with assignments */}
      {adminIds.map((adminId) => {
        const { count, display_name } = adminCounts[adminId];
        const color = getAdminColor(adminId);
        return (
          <FilterItem
            key={adminId}
            label={display_name || adminId}
            count={count}
            isSelected={selectedAdminId === adminId}
            onClick={() => handleSelect(adminId)}
            textColorClass={color.text}
          />
        );
      })}
    </div>
  );
}

interface FilterItemProps {
  label: string;
  count: number;
  isSelected: boolean;
  onClick: () => void;
  textColorClass: string;
}

function FilterItem({
  label,
  count,
  isSelected,
  onClick,
  textColorClass,
}: FilterItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 font-medium transition-colors hover:opacity-70 ${textColorClass} ${
        isSelected ? "underline underline-offset-4" : ""
      }`}
    >
      <span>{label}</span>
      <span className="text-gray-400 font-normal">{count}</span>
    </button>
  );
}
