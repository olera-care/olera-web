"use client";

import { useState, useCallback } from "react";
import Button from "@/components/ui/Button";
import InterestedCard from "@/components/portal/matches/InterestedCard";
import {
  useInterestedProviders,
  type InterestedProvider,
} from "@/hooks/useInterestedProviders";

interface InterestedTabContentProps {
  profileId: string;
  hasCarePost: boolean;
  onSwitchToCarePost: () => void;
  familyLat?: number | null;
  familyLng?: number | null;
}

export default function InterestedTabContent({
  profileId,
  hasCarePost,
  onSwitchToCarePost,
  familyLat,
  familyLng,
}: InterestedTabContentProps) {
  const { pending, declined, loading, updateLocal } =
    useInterestedProviders(profileId);
  const [declinedExpanded, setDeclinedExpanded] = useState(false);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [decliningId, setDecliningId] = useState<string | null>(null);
  const [acceptedId, setAcceptedId] = useState<string | null>(null);
  const [declinedConfirmId, setDeclinedConfirmId] = useState<string | null>(null);

  // ── Expand card (also marks as viewed) ──
  const handleExpand = useCallback(
    async (id: string) => {
      setExpandedCardId(id);

      // Mark as viewed optimistically
      const item = pending.find((c) => c.id === id);
      if (item && !(item.metadata as Record<string, unknown>)?.viewed) {
        const prevMeta = item.metadata as Record<string, unknown>;

        updateLocal(id, {
          metadata: { ...prevMeta, viewed: true },
        });

        window.dispatchEvent(
          new CustomEvent("olera:interested-viewed", { detail: { connectionId: id } })
        );

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

  const handleCollapse = useCallback(() => {
    setExpandedCardId(null);
  }, []);

  // ── Accept (Start conversation) ──
  const handleAccept = useCallback(
    async (id: string) => {
      setAcceptingId(id);
      try {
        const res = await fetch("/api/connections/respond-interest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ connectionId: id, action: "accept" }),
        });
        if (!res.ok) {
          console.error("[InterestedTab] accept API failed");
          return;
        }

        // Show success state instead of removing
        setAcceptedId(id);
        setExpandedCardId(null);
      } catch {
        console.error("[InterestedTab] accept API error");
      } finally {
        setAcceptingId(null);
      }
    },
    []
  );

  // ── Dismiss accepted card ──
  const handleDismiss = useCallback(
    (id: string) => {
      setAcceptedId(null);
      updateLocal(id, "remove");
    },
    [updateLocal]
  );

  // ── Decline ──
  const handleDecline = useCallback(
    async (id: string) => {
      setDecliningId(id);
      try {
        const res = await fetch("/api/connections/respond-interest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ connectionId: id, action: "decline" }),
        });
        if (!res.ok) {
          console.error("[InterestedTab] decline API failed");
          return;
        }

        // Show feedback view instead of moving to declined immediately
        setDeclinedConfirmId(id);
        setExpandedCardId(null);
      } catch {
        console.error("[InterestedTab] decline API error");
      } finally {
        setDecliningId(null);
      }
    },
    []
  );

  // ── Undo decline (reconsider) ──
  const handleUndoDecline = useCallback(
    async (id: string) => {
      const res = await fetch("/api/connections/respond-interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId: id, action: "reconsider" }),
      });
      if (!res.ok) return;

      setDeclinedConfirmId(null);
    },
    []
  );

  // ── Done with decline feedback ──
  const handleDoneDecline = useCallback(
    async (id: string, reasons: string[]) => {
      // Send feedback reasons if any were selected
      if (reasons.length > 0) {
        try {
          await fetch("/api/connections/respond-interest", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ connectionId: id, action: "decline_feedback", reasons }),
          });
        } catch {
          // Non-critical — don't block the flow
        }
      }

      // Move to declined and clear feedback view
      const item = pending.find((c) => c.id === id);
      if (item) {
        const meta = (item.metadata || {}) as Record<string, unknown>;
        updateLocal(id, {
          status: "declined",
          metadata: { ...meta, declined_at: new Date().toISOString(), decline_reasons: reasons },
        } as Partial<InterestedProvider>);
      }
      setDeclinedConfirmId(null);
    },
    [pending, updateLocal]
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

  // ── Loading state ──
  if (loading) {
    return (
      <div className="space-y-5 max-w-2xl">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="animate-pulse rounded-2xl border border-gray-200/80 bg-white p-7"
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gray-200 shrink-0" />
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="h-3 w-24 bg-gray-100 rounded mb-2" />
                <div className="h-5 w-40 bg-gray-200 rounded mb-2" />
                <div className="h-3.5 w-28 bg-gray-200 rounded" />
              </div>
            </div>
            <div className="h-20 bg-gray-50 rounded-xl mt-5 w-full" />
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

  // ── Card list ──
  return (
    <div className="max-w-2xl">
      {/* Pending cards */}
      {pending.length > 0 && (
        <div className="space-y-5 mb-6">
          {pending.map((item) => (
            <InterestedCard
              key={item.id}
              item={item}
              isExpanded={expandedCardId === item.id}
              onExpand={handleExpand}
              onCollapse={handleCollapse}
              onAccept={handleAccept}
              onDecline={handleDecline}
              isAccepting={acceptingId === item.id}
              isDeclining={decliningId === item.id}
              isAccepted={acceptedId === item.id}
              onDismiss={handleDismiss}
              isDeclinedConfirm={declinedConfirmId === item.id}
              onUndoDecline={handleUndoDecline}
              onDoneDecline={handleDoneDecline}
              familyLat={familyLat}
              familyLng={familyLng}
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
                  onReconsider={handleReconsider}
                  isDeclined
                  familyLat={familyLat}
                  familyLng={familyLng}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
