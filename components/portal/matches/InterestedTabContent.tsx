"use client";

import { useState, useCallback, useMemo, useEffect, type ReactNode } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import SplitViewLayout from "@/components/portal/SplitViewLayout";
import InterestedCard from "@/components/portal/matches/InterestedCard";
import InterestedListItem from "@/components/portal/matches/InterestedListItem";
import InterestedDetailContent from "@/components/portal/matches/InterestedDetailContent";
import {
  useInterestedProviders,
  type InterestedProvider,
} from "@/hooks/useInterestedProviders";

interface InterestedTabContentProps {
  profileId: string;
  hasCarePost: boolean;
  onSwitchToCarePost: () => void;
  /** Called when selection state changes so parent can adjust layout */
  onSelectionChange?: (hasSelection: boolean) => void;
  /** Parent's sub-tab bar to include in left panel header during split view */
  matchesTabBar?: ReactNode;
}

export default function InterestedTabContent({
  profileId,
  hasCarePost,
  onSwitchToCarePost,
  onSelectionChange,
  matchesTabBar,
}: InterestedTabContentProps) {
  const { pending, declined, loading, refetch, updateLocal } =
    useInterestedProviders(profileId);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [declinedExpanded, setDeclinedExpanded] = useState(false);
  const [acceptedInfo, setAcceptedInfo] = useState<{
    connectionId: string;
    providerName: string;
  } | null>(null);

  // Notify parent when selection state changes (for layout adjustments)
  useEffect(() => {
    onSelectionChange?.(selectedId !== null);
  }, [selectedId, onSelectionChange]);

  const selectedItem = useMemo(
    () =>
      selectedId
        ? pending.find((c) => c.id === selectedId) ||
          declined.find((c) => c.id === selectedId) ||
          null
        : null,
    [selectedId, pending, declined]
  );

  // ── Mark as viewed when selecting ──
  const handleSelect = useCallback(
    async (id: string) => {
      setSelectedId(id);

      // Find the item and mark viewed optimistically
      const item = pending.find((c) => c.id === id);
      if (item && !(item.metadata as Record<string, unknown>)?.viewed) {
        const prevMeta = item.metadata as Record<string, unknown>;

        updateLocal(id, {
          metadata: { ...prevMeta, viewed: true },
        });

        // Notify other hook instances (sidebar badge) to update
        window.dispatchEvent(
          new CustomEvent("olera:interested-viewed", { detail: { connectionId: id } })
        );

        // Fire API call — revert optimistic update on failure
        try {
          const res = await fetch("/api/connections/respond-interest", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ connectionId: id, action: "view" }),
          });
          if (!res.ok) {
            console.error("[InterestedTab] view API failed, reverting");
            updateLocal(id, { metadata: { ...prevMeta, viewed: false } });
          }
        } catch {
          console.error("[InterestedTab] view API error, reverting");
          updateLocal(id, { metadata: { ...prevMeta, viewed: false } });
        }
      }
    },
    [pending, updateLocal]
  );

  const handleAccept = useCallback(
    async (id: string) => {
      // Capture provider info before removal
      const item = pending.find((c) => c.id === id) || declined.find((c) => c.id === id);
      const providerName = item?.providerProfile?.display_name || "the provider";

      const res = await fetch("/api/connections/respond-interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId: id, action: "accept" }),
      });
      if (!res.ok) throw new Error("Failed to accept");

      // Remove from interested list
      updateLocal(id, "remove");

      // Show success panel with connection link
      setAcceptedInfo({ connectionId: id, providerName });

      // Notify sidebar badge to re-fetch unread connections count
      window.dispatchEvent(new CustomEvent("olera:connection-accepted"));
    },
    [pending, declined, updateLocal]
  );

  const handleDecline = useCallback(
    async (id: string) => {
      const res = await fetch("/api/connections/respond-interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId: id, action: "decline" }),
      });
      if (!res.ok) throw new Error("Failed to decline");

      // Optimistic update: move to declined
      updateLocal(id, {
        status: "declined",
        metadata: {
          ...(((pending.find((c) => c.id === id) || declined.find((c) => c.id === id))
            ?.metadata as Record<string, unknown>) || {}),
          viewed: true,
          declined_at: new Date().toISOString(),
        },
      } as Partial<InterestedProvider>);

      setSelectedId(null);
    },
    [pending, declined, updateLocal]
  );

  const handleReconsider = useCallback(
    async (id: string) => {
      const res = await fetch("/api/connections/respond-interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId: id, action: "reconsider" }),
      });
      if (!res.ok) return;

      // Optimistic update: move back to pending
      const item = declined.find((c) => c.id === id);
      if (item) {
        const meta = (item.metadata || {}) as Record<string, unknown>;
        const { declined_at, ...restMeta } = meta as Record<string, unknown> & { declined_at?: unknown };
        updateLocal(id, {
          status: "pending",
          metadata: { ...restMeta, viewed: true },
        } as Partial<InterestedProvider>);
      }
    },
    [declined, updateLocal]
  );

  const handleCloseDetail = useCallback(() => {
    setSelectedId(null);
    setAcceptedInfo(null);
    refetch();
  }, [refetch]);

  // ── Loading state ──
  if (loading) {
    return (
      <div className="space-y-5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="animate-pulse rounded-2xl border border-gray-200/80 bg-white p-7"
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gray-200 shrink-0" />
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="h-5 w-40 bg-gray-200 rounded mb-2" />
                <div className="h-3.5 w-28 bg-gray-200 rounded" />
              </div>
            </div>
            <div className="h-12 bg-gray-100 rounded-xl mt-5 w-full" />
            <div className="flex gap-2 mt-5">
              <div className="h-7 w-24 bg-gray-100 rounded-full" />
              <div className="h-7 w-20 bg-gray-100 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ── Empty states ──
  if (pending.length === 0 && declined.length === 0) {
    if (!hasCarePost) {
      // No care post published
      return (
        <div className="py-16 text-center">
          <div
            className="w-14 h-14 rounded-full bg-warm-100/60 flex items-center justify-center text-2xl mx-auto mb-5"
            style={{ animation: "emptyFloat 3s ease-in-out infinite" }}
          >
            📝
          </div>
          <h3 className="text-base font-display font-bold text-gray-900">
            Publish your care post to let providers find you
          </h3>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed max-w-[320px] mx-auto">
            Once your care post is live, providers in your area can see it and
            reach out.
          </p>
          <div className="mt-5">
            <Button size="sm" onClick={onSwitchToCarePost}>
              Go to My Care Post
            </Button>
          </div>
          <style jsx>{`
            @keyframes emptyFloat {
              0%,
              100% {
                transform: translateY(0);
              }
              50% {
                transform: translateY(-6px);
              }
            }
          `}</style>
        </div>
      );
    }

    // Care post active, no interest yet
    return (
      <div className="py-16 text-center">
        <div
          className="w-14 h-14 rounded-full bg-warm-100/60 flex items-center justify-center text-2xl mx-auto mb-5"
          style={{ animation: "emptyFloat 3s ease-in-out infinite" }}
        >
          👀
        </div>
        <h3 className="text-base font-display font-bold text-gray-900">
          No providers have reached out yet
        </h3>
        <p className="text-sm text-gray-500 mt-2 leading-relaxed max-w-[320px] mx-auto">
          Providers in your area are reviewing care posts daily. You&apos;ll be
          notified when someone expresses interest.
        </p>
        <style jsx>{`
          @keyframes emptyFloat {
            0%,
            100% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-6px);
            }
          }
        `}</style>
      </div>
    );
  }

  // ── Has data — use SplitViewLayout ──
  const hasSelection = selectedId !== null;

  return (
    <SplitViewLayout
      selectedId={selectedId}
      onBack={handleCloseDetail}
      expandWhenEmpty
      equalWidth
      left={
        hasSelection ? (
          /* ── Compact list mode (split view) — mirrors connections/page.tsx lines 417-453 ── */
          <div className="flex flex-col h-full">
            <div className="px-4 pt-4 pb-2 shrink-0">
              <h2 className="text-lg font-semibold text-gray-900">Matches</h2>
            </div>

            {matchesTabBar && (
              <div className="sticky top-0 z-10 bg-white px-4 pb-2 shrink-0">
                {matchesTabBar}
              </div>
            )}

            <div className="flex-1 overflow-y-auto">
              {pending.map((item) => (
                <InterestedListItem
                  key={item.id}
                  item={item}
                  selected={item.id === selectedId}
                  onSelect={handleSelect}
                />
              ))}

              {/* Declined section in compact list */}
              {declined.length > 0 && (
                <>
                  <div className="px-4 py-2 bg-gray-50 border-y border-gray-100">
                    <span className="text-xs font-semibold text-gray-400">
                      Declined &middot; {declined.length}
                    </span>
                  </div>
                  {declined.map((item) => (
                    <div
                      key={item.id}
                      className="px-4 py-3 border-b border-gray-100 opacity-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-400 shrink-0">
                          {(
                            item.providerProfile?.display_name || "?"
                          )
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm text-gray-400 truncate">
                            {item.providerProfile?.display_name || "Unknown"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        ) : (
          /* ── Full-width card grid mode (parent MatchesPage provides px-8 py-6) ── */
          <div className="h-full overflow-y-auto">
            {/* Pending cards grid */}
            {pending.length > 0 && (
              <div className="space-y-5 mb-6">
                {pending.map((item) => (
                  <InterestedCard
                    key={item.id}
                    item={item}
                    onSelect={handleSelect}
                  />
                ))}
              </div>
            )}

            {/* If no pending but some declined */}
            {pending.length === 0 && declined.length > 0 && (
              <div className="py-8 text-center mb-4">
                <p className="text-sm text-gray-500">
                  No pending providers. Check declined providers below if
                  you&apos;d like to reconsider.
                </p>
              </div>
            )}

            {/* Declined collapsible section */}
            {declined.length > 0 && (
              <div>
                <button
                  type="button"
                  onClick={() => setDeclinedExpanded(!declinedExpanded)}
                  className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-700 transition-colors mb-3"
                >
                  <svg
                    className={[
                      "w-4 h-4 transition-transform duration-200",
                      declinedExpanded ? "rotate-90" : "",
                    ].join(" ")}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                  Declined ({declined.length})
                </button>

                {declinedExpanded && (
                  <div className="space-y-5">
                    {declined.map((item) => (
                      <InterestedCard
                        key={item.id}
                        item={item}
                        onSelect={handleSelect}
                        onReconsider={handleReconsider}
                        isDeclined
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      }
      right={
        acceptedInfo ? (
          /* ── Success panel after accepting ── */
          <div className="flex flex-col h-full">
            <div className="flex justify-end px-7 pt-4">
              <button
                type="button"
                onClick={handleCloseDetail}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:text-gray-700 hover:bg-gray-200 transition-colors"
                aria-label="Close"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 flex items-center justify-center px-7">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Connected!</h3>
                <p className="text-sm text-gray-500 mb-6 max-w-[280px] mx-auto">
                  You can now start chatting with {acceptedInfo.providerName} in My Connections.
                </p>
                <Link href={`/portal/inbox?id=${acceptedInfo.connectionId}`}>
                  <Button size="sm">Send a message</Button>
                </Link>
              </div>
            </div>
          </div>
        ) : selectedItem && selectedItem.status === "pending" ? (
          <InterestedDetailContent
            item={selectedItem}
            onClose={handleCloseDetail}
            onAccept={handleAccept}
            onDecline={handleDecline}
          />
        ) : null
      }
    />
  );
}
