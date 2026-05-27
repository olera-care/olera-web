"use client";

import { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import type { Profile, FamilyMetadata } from "@/lib/types";
import ReachOutDrawer from "@/components/provider/matches/ReachOutDrawer";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type OutreachStatus = "pending" | "connected" | "declined";

interface OutreachItem {
  id: string; // connection id
  family: Profile;
  message: string | null;
  sentAt: string;
  status: OutreachStatus;
  replyMessage?: string | null;
  repliedAt?: string | null;
  reminderSent?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): { display: string; relative: string } {
  const date = new Date(dateStr);

  // Handle invalid dates
  if (isNaN(date.getTime())) {
    return { display: "Unknown", relative: "Unknown" };
  }

  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const display = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  });

  let relative: string;
  if (diffDays < 0) relative = "Today"; // Future date edge case
  else if (diffDays === 0) relative = "Today";
  else if (diffDays === 1) relative = "Yesterday";
  else if (diffDays < 7) relative = `${diffDays} days ago`;
  else if (diffDays < 14) relative = "1 week ago";
  else if (diffDays < 30) relative = `${Math.floor(diffDays / 7)} weeks ago`;
  else if (diffDays < 60) relative = "1 month ago";
  else relative = `${Math.floor(diffDays / 30)} months ago`;

  return { display, relative };
}

function getInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/);
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return trimmed.slice(0, 2).toUpperCase() || "?";
}

function avatarGradient(name: string): string {
  const gradients = [
    "linear-gradient(135deg, #7fbfb5, #5a9e94)",
    "linear-gradient(135deg, #9683b5, #7c6a9a)",
    "linear-gradient(135deg, #7a8fa8, #5d7490)",
    "linear-gradient(135deg, #b59683, #9a7c6a)",
    "linear-gradient(135deg, #a89683, #8a7a68)",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
}

function getPrimaryCareType(family: Profile): string | null {
  const careTypes = family.care_types || [];
  return careTypes[0] || null;
}

function getTimeline(family: Profile): string | null {
  const meta = family.metadata as FamilyMetadata | null;
  if (!meta?.timeline) return null;

  const labels: Record<string, string> = {
    immediate: "ASAP",
    as_soon_as_possible: "ASAP",
    within_1_month: "In 1 month",
    within_a_month: "In 1 month",
    within_3_months: "In 2-3 months",
    in_a_few_months: "In 2-3 months",
    exploring: "Exploring",
    just_researching: "Exploring",
  };

  return labels[meta.timeline] || meta.timeline;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab Configuration
// ─────────────────────────────────────────────────────────────────────────────

const TABS: { id: OutreachStatus; label: string }[] = [
  { id: "pending", label: "Pending" },
  { id: "connected", label: "Connected" },
  { id: "declined", label: "Declined" },
];

// ─────────────────────────────────────────────────────────────────────────────
// OutreachRow Component
// ─────────────────────────────────────────────────────────────────────────────

function OutreachRow({
  item,
  onClick,
  onNudge,
  nudging,
}: {
  item: OutreachItem;
  onClick: () => void;
  onNudge?: () => void;
  nudging?: boolean;
}) {
  const { display: dateDisplay, relative: dateRelative } = formatDate(item.sentAt);
  const familyName = item.family.display_name || "Family";
  const location = [item.family.city, item.family.state].filter(Boolean).join(", ");
  const careType = getPrimaryCareType(item.family);
  const timeline = getTimeline(item.family);

  // Can nudge if pending, 48+ hours passed, and no reminder sent yet
  const canNudge = useMemo(() => {
    if (item.status !== "pending" || item.reminderSent) return false;
    const sentAt = new Date(item.sentAt).getTime();
    const hoursSince = (Date.now() - sentAt) / (1000 * 60 * 60);
    return hoursSince >= 48;
  }, [item.status, item.sentAt, item.reminderSent]);

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all duration-150 px-5 py-4 group"
    >
      <div className="flex items-center gap-4">
        {/* Date column */}
        <div className="w-24 shrink-0">
          <p className="text-[13px] font-medium text-gray-900">{dateDisplay}</p>
          <p className="text-[12px] text-gray-400 mt-0.5">{dateRelative}</p>
        </div>

        {/* Avatar + Name + Location */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {item.family.image_url ? (
            <Image
              src={item.family.image_url}
              alt={familyName}
              width={40}
              height={40}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-sm shrink-0"
            />
          ) : (
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center ring-2 ring-white shadow-sm shrink-0"
              style={{ background: avatarGradient(familyName) }}
            >
              <span className="text-xs font-bold text-white/90">{getInitials(familyName)}</span>
            </div>
          )}
          <div className="min-w-0">
            <p className="text-[15px] font-semibold text-gray-900 truncate group-hover:text-gray-700 transition-colors">
              {familyName}
            </p>
            <p className="text-[13px] text-gray-500 truncate">{location || "Location not specified"}</p>
          </div>
        </div>

        {/* Care type + Timeline */}
        <div className="hidden sm:block w-40 shrink-0">
          {(careType || timeline) && (
            <p className="text-[13px] text-gray-600 truncate">
              {[careType, timeline].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>

        {/* Status + Action */}
        <div className="flex items-center gap-3 shrink-0">
          {item.status === "pending" && (
            <>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-medium bg-amber-50 text-amber-700 border border-amber-100">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                Pending
              </span>
              {canNudge && onNudge && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNudge();
                  }}
                  disabled={nudging}
                  className="text-[12px] font-medium text-primary-600 hover:text-primary-700 disabled:opacity-50 transition-colors"
                >
                  {nudging ? "..." : "Nudge"}
                </button>
              )}
            </>
          )}
          {item.status === "connected" && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Connected
            </span>
          )}
          {item.status === "declined" && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-medium bg-gray-50 text-gray-500 border border-gray-100">
              Declined
            </span>
          )}

          {/* Chevron */}
          <svg
            className="w-4 h-4 text-gray-300 group-hover:text-gray-400 transition-colors"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </div>
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty State
// ─────────────────────────────────────────────────────────────────────────────

function EmptyState({ status }: { status: OutreachStatus }) {
  const content = {
    pending: {
      image: "/Pending.png",
      title: "No pending outreach",
      description: "When you reach out to families, they'll appear here until they respond.",
    },
    connected: {
      image: "/Connected.png",
      title: "No connections yet",
      description: "When families respond to your outreach, they'll appear here.",
    },
    declined: {
      image: "/Declined.png",
      title: "No declined outreach",
      description: "Outreach that didn't result in a connection will appear here.",
    },
  };

  const { image, title, description } = content[status];

  return (
    <div className="flex flex-col items-center justify-center py-12 px-8 text-center">
      <Image
        src={image}
        alt={title}
        width={180}
        height={180}
        className="mb-6"
      />
      <h3 className="text-[17px] font-display font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-[15px] text-gray-500 max-w-sm leading-relaxed">{description}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

// Validate status parameter
function isValidStatus(status: string | null): status is OutreachStatus {
  return status === "pending" || status === "connected" || status === "declined";
}

function OutreachPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusParam = searchParams.get("status");
  const initialStatus: OutreachStatus = isValidStatus(statusParam) ? statusParam : "pending";

  const [activeTab, setActiveTab] = useState<OutreachStatus>(initialStatus);
  const [outreachItems, setOutreachItems] = useState<OutreachItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Drawer state
  const [selectedItem, setSelectedItem] = useState<OutreachItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Provider profile for drawer
  const [providerProfile, setProviderProfile] = useState<Profile | null>(null);

  // Nudge state
  const [nudgingId, setNudgingId] = useState<string | null>(null);
  const [nudgeError, setNudgeError] = useState<string | null>(null);

  // Update URL when tab changes
  const handleTabChange = useCallback((tab: OutreachStatus) => {
    setActiveTab(tab);
    router.replace(`/provider/outreach?status=${tab}`, { scroll: false });
  }, [router]);

  // Fetch data
  useEffect(() => {
    async function fetchOutreach() {
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();

        // Get current user and their provider profile
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError("Please sign in to view your outreach");
          setLoading(false);
          return;
        }

        // Get provider's active profile
        const { data: account } = await supabase
          .from("accounts")
          .select("active_profile_id")
          .eq("user_id", user.id)
          .single();

        if (!account?.active_profile_id) {
          setError("No active profile found");
          setLoading(false);
          return;
        }

        // Fetch provider profile
        const { data: provider } = await supabase
          .from("business_profiles")
          .select("*")
          .eq("id", account.active_profile_id)
          .single();

        if (provider) {
          setProviderProfile(provider as Profile);
        }

        // Fetch connections with family profiles
        const { data: connections, error: connError } = await supabase
          .from("connections")
          .select(`
            id,
            to_profile_id,
            message,
            created_at,
            status,
            metadata,
            to_profile:business_profiles!connections_to_profile_id_fkey (
              id,
              display_name,
              image_url,
              city,
              state,
              care_types,
              metadata,
              created_at
            )
          `)
          .eq("from_profile_id", account.active_profile_id)
          .eq("type", "request")
          .in("status", ["pending", "accepted", "declined"])
          .order("created_at", { ascending: false });

        if (connError) {
          throw new Error(connError.message);
        }

        // Transform to OutreachItem format
        const items: OutreachItem[] = (connections || [])
          .filter((conn) => conn.to_profile) // Only include if family profile exists
          .map((conn) => {
            const meta = conn.metadata as { reminder_sent?: boolean; reply_message?: string; replied_at?: string } | null;
            return {
              id: conn.id,
              family: conn.to_profile as unknown as Profile,
              message: conn.message,
              sentAt: conn.created_at,
              status: conn.status === "accepted" ? "connected" : conn.status as OutreachStatus,
              replyMessage: meta?.reply_message,
              repliedAt: meta?.replied_at,
              reminderSent: meta?.reminder_sent,
            };
          });

        setOutreachItems(items);
      } catch (err) {
        console.error("Failed to fetch outreach:", err);
        setError(err instanceof Error ? err.message : "Failed to load outreach");
      } finally {
        setLoading(false);
      }
    }

    fetchOutreach();
  }, []);

  // Filter items by active tab
  const filteredItems = useMemo(() => {
    return outreachItems.filter((item) => item.status === activeTab);
  }, [outreachItems, activeTab]);

  // Counts for tabs
  const counts = useMemo(() => ({
    pending: outreachItems.filter((i) => i.status === "pending").length,
    connected: outreachItems.filter((i) => i.status === "connected").length,
    declined: outreachItems.filter((i) => i.status === "declined").length,
  }), [outreachItems]);

  // Handle nudge
  const handleNudge = useCallback(async (connectionId: string) => {
    setNudgingId(connectionId);
    setNudgeError(null);
    try {
      const res = await fetch("/api/connections/reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to send reminder");
      }

      // Update local state
      setOutreachItems((prev) =>
        prev.map((item) =>
          item.id === connectionId ? { ...item, reminderSent: true } : item
        )
      );
    } catch (err) {
      console.error("Nudge failed:", err);
      setNudgeError(err instanceof Error ? err.message : "Failed to send reminder");
      // Clear error after 5 seconds
      setTimeout(() => setNudgeError(null), 5000);
    } finally {
      setNudgingId(null);
    }
  }, []);

  // Open drawer
  const openDrawer = useCallback((item: OutreachItem) => {
    setSelectedItem(item);
    setIsDrawerOpen(true);
  }, []);

  // Close drawer
  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false);
    setTimeout(() => setSelectedItem(null), 300);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6 sm:py-8">
            {/* Back link */}
            <Link
              href="/provider/matches"
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-gray-500 hover:text-gray-700 transition-colors mb-4"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
              Find Families
            </Link>

            <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-900 tracking-tight">
              My Outreach
            </h1>
            <p className="text-[15px] text-gray-500 mt-1">
              Track your messages to families
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-6 -mb-px">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={`relative pb-3 text-[15px] font-medium transition-colors ${
                  activeTab === tab.id
                    ? "text-gray-900"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
                {counts[tab.id] > 0 && (
                  <span className={`ml-1.5 text-[13px] ${
                    activeTab === tab.id ? "text-gray-900" : "text-gray-400"
                  }`}>
                    ({counts[tab.id]})
                  </span>
                )}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Nudge Error Toast */}
      {nudgeError && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
          <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl shadow-lg">
            <p className="text-sm text-red-700">{nudgeError}</p>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-[15px] text-red-600">{error}</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <EmptyState status={activeTab} />
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <OutreachRow
                key={item.id}
                item={item}
                onClick={() => openDrawer(item)}
                onNudge={() => handleNudge(item.id)}
                nudging={nudgingId === item.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Drawer */}
      <ReachOutDrawer
        family={selectedItem?.family || null}
        isOpen={isDrawerOpen}
        onClose={closeDrawer}
        onSend={async () => {}} // No-op for view mode
        providerProfile={providerProfile}
        mode="view"
        sentMessage={selectedItem?.message || undefined}
        sentAt={selectedItem?.sentAt}
        outreachStatus={selectedItem?.status}
      />
    </div>
  );
}

// Loading fallback for Suspense
function OutreachPageLoading() {
  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-4" />
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        </div>
      </div>
    </div>
  );
}

// Wrap in Suspense for useSearchParams
export default function OutreachPage() {
  return (
    <Suspense fallback={<OutreachPageLoading />}>
      <OutreachPageContent />
    </Suspense>
  );
}
