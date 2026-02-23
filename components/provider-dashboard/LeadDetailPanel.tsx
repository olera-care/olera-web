"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { canEngage } from "@/lib/membership";
import { useAuth } from "@/components/auth/AuthProvider";
import { useProviderProfile } from "@/hooks/useProviderProfile";
import type { Connection, Profile } from "@/lib/types";
import { parseMessage, avatarGradient, blurName } from "@/components/portal/ConnectionDetailContent";
import {
  getProviderDisplayStatus,
  PROVIDER_STATUS_CONFIG,
} from "@/lib/connection-utils";
import type { ConnectionWithProfile } from "@/components/portal/ConnectionListItem";

interface LeadDetailPanelProps {
  connectionId: string;
  preloadedConnection?: ConnectionWithProfile | null;
  onClose: () => void;
  onArchive?: (id: string) => void;
}

export default function LeadDetailPanel({
  connectionId,
  preloadedConnection,
  onClose,
  onArchive,
}: LeadDetailPanelProps) {
  const { membership } = useAuth();
  const providerProfile = useProviderProfile();

  const [connection, setConnection] = useState<ConnectionWithProfile | null>(
    preloadedConnection ?? null
  );
  const [loading, setLoading] = useState(!preloadedConnection);
  const [archiving, setArchiving] = useState(false);

  const hasFullAccess = canEngage(
    providerProfile?.type,
    membership,
    "view_inquiry_details"
  );

  // Fetch connection data
  useEffect(() => {
    if (preloadedConnection) {
      setConnection(preloadedConnection);
      setLoading(false);
      return;
    }

    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const { data: conn } = await supabase
          .from("connections")
          .select(
            "id, type, status, from_profile_id, to_profile_id, message, metadata, created_at, updated_at"
          )
          .eq("id", connectionId)
          .single<Connection>();

        if (cancelled || !conn) return;

        const profileIds = [conn.from_profile_id, conn.to_profile_id];
        const { data: profiles } = await supabase
          .from("business_profiles")
          .select(
            "id, display_name, description, image_url, city, state, type, email, phone, website, slug, care_types, category"
          )
          .in("id", profileIds);

        const profileMap = new Map(
          ((profiles as Profile[]) || []).map((p) => [p.id, p])
        );

        if (!cancelled) {
          setConnection({
            ...conn,
            fromProfile: profileMap.get(conn.from_profile_id) || null,
            toProfile: profileMap.get(conn.to_profile_id) || null,
          });
        }
      } catch (err) {
        console.error("[LeadDetailPanel] fetch error:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [connectionId, preloadedConnection]);

  // Archive handler
  const handleArchive = async () => {
    if (!connection || archiving) return;
    setArchiving(true);
    try {
      const res = await fetch("/api/connections/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId: connection.id, action: "archive" }),
      });
      if (res.ok) {
        onArchive?.(connection.id);
        onClose();
      }
    } catch (err) {
      console.error("[LeadDetailPanel] archive error:", err);
    } finally {
      setArchiving(false);
    }
  };

  // Loading
  if (loading) {
    return (
      <div className="flex flex-col h-full bg-white items-center justify-center">
        <div className="animate-spin w-7 h-7 border-[3px] border-primary-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  // No data
  if (!connection) {
    return (
      <div className="flex flex-col h-full bg-white items-center justify-center p-8">
        <p className="text-sm text-gray-500">Lead not found</p>
      </div>
    );
  }

  // Derive display data
  const isInbound = connection.to_profile_id === providerProfile?.id;
  const otherProfile = isInbound
    ? connection.fromProfile
    : connection.toProfile;
  const otherName = otherProfile?.display_name || "Unknown";
  const otherLocation = [otherProfile?.city, otherProfile?.state]
    .filter(Boolean)
    .join(", ");
  const shouldBlur = !hasFullAccess && isInbound;

  const displayStatus = getProviderDisplayStatus(connection, isInbound);
  const statusConfig = PROVIDER_STATUS_CONFIG[displayStatus];

  const parsedMsg = parseMessage(connection.message);
  const imageUrl = otherProfile?.image_url;
  const initial = otherName.charAt(0).toUpperCase();

  const receivedDate = new Date(connection.created_at).toLocaleDateString(
    "en-US",
    { month: "long", day: "numeric", year: "numeric" }
  );

  const hasPhone =
    !shouldBlur && otherProfile?.phone && connection.status === "accepted";
  const hasEmail =
    !shouldBlur && otherProfile?.email && connection.status === "accepted";

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Close button */}
      <div className="flex justify-end px-5 pt-4 shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:text-gray-700 hover:bg-gray-200 transition-colors"
          aria-label="Close"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-7 pb-8">
        {/* Profile header */}
        <div className="flex flex-col items-center text-center pt-2 pb-6">
          {imageUrl && !shouldBlur ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={otherName}
              className="w-20 h-20 rounded-2xl object-cover mb-4"
            />
          ) : (
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold text-white mb-4"
              style={{
                background: shouldBlur ? "#9ca3af" : avatarGradient(otherName),
              }}
            >
              {shouldBlur ? "?" : initial}
            </div>
          )}

          <h2 className="text-xl font-semibold text-gray-900">
            {shouldBlur ? blurName(otherName) : otherName}
          </h2>

          {otherLocation && !shouldBlur && (
            <p className="text-sm text-gray-500 mt-0.5">{otherLocation}</p>
          )}

          <div className="flex items-center gap-2 mt-3">
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${statusConfig.bg} ${statusConfig.color}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
              {statusConfig.label}
            </span>
          </div>

          <p className="text-xs text-gray-400 mt-2">Received {receivedDate}</p>
        </div>

        {/* Care request details */}
        {parsedMsg && !shouldBlur && (
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              What they&apos;re looking for
            </h3>
            <div className="bg-gray-50 rounded-xl p-4 space-y-2.5">
              {parsedMsg.careRecipient && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Care recipient</span>
                  <span className="text-gray-900 font-medium">
                    {parsedMsg.careRecipient}
                  </span>
                </div>
              )}
              {parsedMsg.careType && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Care type</span>
                  <span className="text-gray-900 font-medium">
                    {parsedMsg.careType}
                  </span>
                </div>
              )}
              {parsedMsg.urgency && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Urgency</span>
                  <span className="text-gray-900 font-medium">
                    {parsedMsg.urgency}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Personal note */}
        {parsedMsg?.notes && !shouldBlur && (
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Personal note
            </h3>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-700 leading-relaxed italic">
                &ldquo;{parsedMsg.notes}&rdquo;
              </p>
            </div>
          </div>
        )}

        {/* Contact info */}
        {(hasPhone || hasEmail) && (
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Contact
            </h3>
            <div className="space-y-2">
              {hasPhone && (
                <a
                  href={`tel:${otherProfile!.phone}`}
                  className="flex items-center gap-2.5 text-sm text-gray-700 hover:text-primary-600 transition-colors"
                >
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
                    />
                  </svg>
                  {otherProfile!.phone}
                </a>
              )}
              {hasEmail && (
                <a
                  href={`mailto:${otherProfile!.email}`}
                  className="flex items-center gap-2.5 text-sm text-gray-700 hover:text-primary-600 transition-colors"
                >
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                    />
                  </svg>
                  {otherProfile!.email}
                </a>
              )}
            </div>
          </div>
        )}

        {/* Blurred state message */}
        {shouldBlur && (
          <div className="mb-6 bg-gray-50 rounded-xl p-4 text-center">
            <p className="text-sm text-gray-500">
              Upgrade your plan to see full lead details and contact information.
            </p>
          </div>
        )}

        {/* Primary CTA */}
        <Link
          href={`/provider/inbox?id=${connectionId}`}
          className="flex items-center justify-center gap-2 w-full py-3 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 transition-colors"
        >
          Reply in Inbox
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
            />
          </svg>
        </Link>

        {/* Archive action */}
        {onArchive && (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={handleArchive}
              disabled={archiving}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            >
              {archiving ? "Archiving..." : "Archive lead"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
