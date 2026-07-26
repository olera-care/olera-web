"use client";

import { useEffect } from "react";
import { getAdminColor, UNASSIGNED_CHIP_COLOR } from "@/lib/provider-outreach/admin-colors";

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
  selectedAdminId: string | null; // null = "All"
  onSelect: (adminId: string | null) => void;
  tabKey: string; // For localStorage persistence
}

/**
 * Filter row for filtering providers by assigned admin.
 * Uses plain colored text instead of pills.
 *
 * Layout: All 23 · Grace 12 · Ces 8 · Unassigned 3
 *
 * - Selected item is underlined
 * - Admin names use their stable color
 * - "All" and counts are in gray
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
  // Load persisted selection on mount, validate it exists in current adminCounts
  useEffect(() => {
    const stored = localStorage.getItem(`provider-outreach-filter-${tabKey}`);
    if (stored !== null) {
      const value = stored === "null" ? null : stored;
      // Validate the stored admin ID still exists (or is "unassigned" or null)
      const isValidSelection = value === null || value === "unassigned" || value in adminCounts;
      if (isValidSelection && value !== selectedAdminId) {
        onSelect(value);
      } else if (!isValidSelection && selectedAdminId !== null) {
        // Stored admin no longer exists, reset to "All"
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

  // Sort admins by display name, with unassigned at the end
  const adminIds = Object.keys(adminCounts).filter((id) => id !== "unassigned");
  adminIds.sort((a, b) => {
    const nameA = adminCounts[a].display_name || "";
    const nameB = adminCounts[b].display_name || "";
    return nameA.localeCompare(nameB);
  });

  const unassignedCount = adminCounts["unassigned"]?.count || 0;

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4 text-sm">
      {/* All */}
      <FilterItem
        label="All"
        count={totalCount}
        isSelected={selectedAdminId === null}
        onClick={() => handleSelect(null)}
        textColorClass="text-gray-700"
      />

      {/* Admin names */}
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

      {/* Unassigned */}
      {unassignedCount > 0 && (
        <FilterItem
          label="Unassigned"
          count={unassignedCount}
          isSelected={selectedAdminId === "unassigned"}
          onClick={() => handleSelect("unassigned")}
          textColorClass={UNASSIGNED_CHIP_COLOR.text}
        />
      )}
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
