"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { AdminAvatar } from "./AdminChip";
import { X } from "lucide-react";

interface Admin {
  id: string;
  email: string;
  display_name: string | null;
}

interface AdminAutocompleteProps {
  selectedAdminId: string | null;
  selectedAdminName: string | null;
  onSelect: (adminId: string | null, adminName: string | null) => void;
  onClose?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}

/**
 * Determines if the dropdown should open upward based on available viewport space.
 * Returns true if there's more space above the input than below.
 */
function shouldOpenUpward(inputElement: HTMLElement): boolean {
  const rect = inputElement.getBoundingClientRect();
  const spaceBelow = window.innerHeight - rect.bottom;
  const spaceAbove = rect.top;
  // Open upward if less than 200px below and more space above
  return spaceBelow < 200 && spaceAbove > spaceBelow;
}

/**
 * Inline autocomplete input for selecting an admin user.
 * Fetches admin list from /api/admin/provider-outreach/admins
 *
 * Features:
 * - Type to filter matching admins
 * - Dropdown shows matching admins with initial avatar + name
 * - X button to clear/unassign
 * - Keyboard navigation (arrow keys, enter, escape)
 */
export function AdminAutocomplete({
  selectedAdminId,
  selectedAdminName,
  onSelect,
  onClose,
  placeholder = "Search admins...",
  autoFocus = true,
}: AdminAutocompleteProps) {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [openUpward, setOpenUpward] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Check dropdown position when opening
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setOpenUpward(shouldOpenUpward(inputRef.current));
    }
  }, [isOpen]);

  // Fetch admins on mount
  useEffect(() => {
    async function fetchAdmins() {
      try {
        const res = await fetch("/api/admin/provider-outreach/admins");
        if (res.ok) {
          const data = await res.json();
          setAdmins(data.admins || []);
        }
      } catch (err) {
        console.error("Failed to fetch admins:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAdmins();
  }, []);

  // Auto-focus input on mount
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Filter admins by query
  const filteredAdmins = admins.filter((admin) => {
    if (!query) return true;
    const searchTerm = query.toLowerCase();
    const name = admin.display_name?.toLowerCase() || "";
    const email = admin.email.toLowerCase();
    return name.includes(searchTerm) || email.includes(searchTerm);
  });

  // Reset highlighted index when filtered list changes
  useEffect(() => {
    setHighlightedIndex(0);
  }, [query]);

  // Handle click outside to close
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        onClose?.();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const handleSelect = useCallback(
    (admin: Admin) => {
      onSelect(admin.id, admin.display_name || admin.email.split("@")[0]);
      setQuery("");
      setIsOpen(false);
      onClose?.();
    },
    [onSelect, onClose]
  );

  const handleClear = useCallback(() => {
    onSelect(null, null);
    setQuery("");
    onClose?.();
  }, [onSelect, onClose]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredAdmins.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredAdmins[highlightedIndex]) {
        handleSelect(filteredAdmins[highlightedIndex]);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
      onClose?.();
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-1">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        />
        {(selectedAdminId || query) && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            title="Clear assignment"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isOpen && !loading && filteredAdmins.length > 0 && (
        <div
          ref={dropdownRef}
          className={`absolute z-50 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-auto ${
            openUpward ? "bottom-full mb-1" : "top-full mt-1"
          }`}
        >
          {/* Show Unassign option at top if there's currently an assignment */}
          {selectedAdminId && !query && (
            <button
              type="button"
              onClick={handleClear}
              className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 border-b border-gray-100"
            >
              <X className="w-4 h-4" />
              <span>Unassign</span>
            </button>
          )}
          {filteredAdmins.map((admin, index) => (
            <button
              key={admin.id}
              type="button"
              onClick={() => handleSelect(admin)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50 ${
                index === highlightedIndex ? "bg-gray-100" : ""
              } ${admin.id === selectedAdminId ? "bg-blue-50" : ""}`}
            >
              <AdminAvatar
                adminId={admin.id}
                adminName={admin.display_name || admin.email.split("@")[0]}
                size="sm"
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">
                  {admin.display_name || admin.email.split("@")[0]}
                </div>
                {admin.display_name && (
                  <div className="text-xs text-gray-500 truncate">
                    {admin.email}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {isOpen && !loading && filteredAdmins.length === 0 && query && (
        <div
          ref={dropdownRef}
          className={`absolute z-50 w-full bg-white border border-gray-200 rounded-md shadow-lg p-3 text-sm text-gray-500 ${
            openUpward ? "bottom-full mb-1" : "top-full mt-1"
          }`}
        >
          No admins found matching "{query}"
        </div>
      )}

      {isOpen && loading && (
        <div
          ref={dropdownRef}
          className={`absolute z-50 w-full bg-white border border-gray-200 rounded-md shadow-lg p-3 text-sm text-gray-500 ${
            openUpward ? "bottom-full mb-1" : "top-full mt-1"
          }`}
        >
          Loading...
        </div>
      )}
    </div>
  );
}
