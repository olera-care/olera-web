"use client";

import { useEffect, useState } from "react";

/**
 * The family's confirmation title, saying what really happened to the request
 * (lib/connections/delivery.server.ts). Replaces "Connected with …", which every
 * family saw even when the agency had no email and was never told (Phase 4).
 *
 * Starts on "Request saved for …", which is true whatever the lookup says, so
 * it never shows "Sent" and then takes it back.
 */

type State = "sending" | "sent" | "unreachable";
interface Status {
  state: State;
  phone: string | null;
}

// One lookup per request, shared by every title on the page.
const lookups = new Map<string, Promise<Status | null>>();

function lookup(connectionId: string): Promise<Status | null> {
  let pending = lookups.get(connectionId);
  if (!pending) {
    pending = fetch(`/api/connections/delivery?connectionId=${encodeURIComponent(connectionId)}`, {
      cache: "no-store",
    })
      .then((res) => (res.ok ? (res.json() as Promise<Status>) : null))
      .catch(() => null);
    lookups.set(connectionId, pending);
  }
  return pending;
}

function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(-10);
  return d.length === 10 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : raw;
}

function useDelivery(connectionId: string | null | undefined): Status | null {
  const [status, setStatus] = useState<Status | null>(null);
  useEffect(() => {
    if (!connectionId) return;
    let live = true;
    lookup(connectionId).then((s) => {
      if (live) setStatus(s);
    });
    return () => {
      live = false;
    };
  }, [connectionId]);
  return status;
}

/** The phone line under the title when we couldn't email the agency. */
export function DeliveryNote({
  connectionId,
  className = "mt-1 text-[13px] font-normal leading-snug text-gray-600",
}: {
  connectionId: string | null | undefined;
  className?: string;
}) {
  const status = useDelivery(connectionId);
  if (status?.state !== "unreachable") return null;
  const digits = status.phone?.replace(/[^\d+]/g, "");
  return (
    <span className={`block ${className}`}>
      They don&apos;t list an email, so the fastest way is a call
      {status.phone && digits ? (
        <>
          :{" "}
          <a href={`tel:${digits}`} className="font-semibold text-primary-700 underline underline-offset-2">
            {formatPhone(status.phone)}
          </a>
        </>
      ) : null}
      .
    </span>
  );
}

/**
 * The title text. `withNote` adds the phone line inside the same element; pass
 * false where the title sits on one truncated line and render DeliveryNote below.
 */
export default function DeliveryTitle({
  connectionId,
  providerName,
  withNote = true,
}: {
  connectionId: string | null | undefined;
  providerName: string;
  withNote?: boolean;
}) {
  const status = useDelivery(connectionId);
  if (status?.state === "sent") return <>Sent to {providerName}</>;
  if (status?.state === "sending") return <>On its way to {providerName}</>;
  if (status?.state === "unreachable") {
    return (
      <>
        Saved, but we couldn&apos;t email {providerName}
        {withNote && <DeliveryNote connectionId={connectionId} />}
      </>
    );
  }
  return <>Request saved for {providerName}</>;
}

/** True once we know the agency couldn't be emailed; drives the amber banner. */
export function useDeliveryUnreachable(connectionId: string | null | undefined): boolean {
  return useDelivery(connectionId)?.state === "unreachable";
}

/**
 * The banner's round mark: the existing green check, or an amber phone when we
 * couldn't email the agency. A check there read as success (10 Oct QA).
 */
export function DeliveryMark({
  connectionId,
  circleClassName,
  iconClassName,
  children,
}: {
  connectionId: string | null | undefined;
  circleClassName: string;
  iconClassName: string;
  children: React.ReactNode;
}) {
  if (!useDeliveryUnreachable(connectionId)) return <>{children}</>;
  return (
    <div className={`${circleClassName} bg-amber-100 rounded-full flex items-center justify-center shrink-0`}>
      <svg className={`${iconClassName} text-amber-700`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
      </svg>
    </div>
  );
}
