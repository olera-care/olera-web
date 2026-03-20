"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export interface SectionItem {
  id: string;
  label: string;
}

interface SectionNavProps {
  sections: SectionItem[];
  providerName: string;
  /** Distance (px) from top to consider a section "active". Defaults to 120. */
  offset?: number;
  /** Provider ID for connection state check */
  providerId?: string;
  /** Whether the provider is active */
  isActive?: boolean;
}

export default function SectionNav({
  sections,
  providerName,
  offset = 120,
  providerId,
  isActive = true,
}: SectionNavProps) {
  const [visible, setVisible] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { profiles } = useAuth();

  // Show the section nav after the user scrolls past the identity / image area
  // We use 400px as threshold — roughly past the breadcrumbs + name + image
  const SCROLL_THRESHOLD = 400;

  const handleScroll = useCallback(() => {
    const scrollY = window.scrollY;

    // Visibility
    setVisible(scrollY > SCROLL_THRESHOLD);

    // Active section detection — find the last section whose top is above the offset line
    let current: string | null = null;
    for (const section of sections) {
      const el = document.getElementById(section.id);
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.top <= offset) {
          current = section.id;
        }
      }
    }
    setActiveId(current);
  }, [sections, offset]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // initial check
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // Check for existing connection to this provider
  useEffect(() => {
    if (!providerId || !profiles.length || !isSupabaseConfigured()) return;

    const checkConnection = async () => {
      const supabase = createClient();
      const profileIds = profiles.map((p) => p.id);

      // Resolve provider ID if non-UUID
      let resolvedId: string | null = providerId;
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(providerId);
      if (!isUUID) {
        const { data: profile } = await supabase
          .from("business_profiles")
          .select("id")
          .eq("source_provider_id", providerId)
          .limit(1)
          .single();
        resolvedId = profile?.id || null;
      }

      if (!resolvedId) return;

      const { data } = await supabase
        .from("connections")
        .select("id, status")
        .in("from_profile_id", profileIds)
        .eq("to_profile_id", resolvedId)
        .eq("type", "inquiry")
        .in("status", ["pending", "accepted"])
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (data) {
        setConnectionId(data.id);
        setIsConnected(true);
      }
    };

    checkConnection();
  }, [providerId, profiles]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - (offset - 20);
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[51] transition-all duration-300 ${
        visible
          ? "translate-y-0 opacity-100"
          : "-translate-y-full opacity-0 pointer-events-none"
      }`}
    >
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Section tabs */}
            <nav className="flex items-center gap-1 overflow-x-auto scrollbar-hide -mb-px h-full">
              {sections.map((section) => {
                const isSectionActive = activeId === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => scrollTo(section.id)}
                    className={`relative whitespace-nowrap px-3 py-2 text-[14px] font-medium transition-colors h-full flex items-center ${
                      isSectionActive
                        ? "text-gray-900"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {section.label}
                    {/* Active underline */}
                    {isSectionActive && (
                      <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-gray-900 rounded-full" />
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Right: Provider name + CTA */}
            <div className="hidden md:flex items-center gap-4 flex-shrink-0 pl-6">
              <span className="text-[14px] font-semibold text-gray-900 truncate max-w-[200px]">
                {providerName}
              </span>
              {isConnected ? (
                <Link
                  href={connectionId ? `/portal/inbox?id=${connectionId}` : "/portal/inbox"}
                  className="px-4 py-2 text-[13px] font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Message
                </Link>
              ) : isActive ? (
                <button
                  onClick={() => scrollTo("connection-card")}
                  className="px-4 py-2 text-[13px] font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Connect
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
