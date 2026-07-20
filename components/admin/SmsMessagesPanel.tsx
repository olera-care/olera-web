"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { SMS_VARIANTS, SMS_GROUP_ORDER, smsSegmentInfo, type SmsVariant } from "@/lib/sms-samples";
import SmsPhonePreview from "@/components/admin/SmsPhonePreview";

/**
 * "SMS messages — what we send" panel for /admin/family-comms: the texting
 * sibling of the email-performance table + EmailTypeDrawer. Every outbound SMS
 * renders from the LIVE template (lib/sms/templates.ts via lib/sms-samples.ts)
 * as a phone-style bubble, with the who/why rationale and the gates the send
 * path applies. No per-type performance strip — Twilio doesn't split delivery
 * by type and most SMS call sites don't log an email_type, so the delivery
 * panel above stays the delivery story.
 */

const AUDIENCE_CHIP: Record<SmsVariant["audience"], string> = {
  family: "bg-teal-50 text-teal-700",
  provider: "bg-sky-50 text-sky-700",
};

function SmsTypeDrawer({
  variant,
  body,
  senderLast4,
  onClose,
}: {
  variant: SmsVariant;
  body: string;
  senderLast4?: string | null;
  onClose: () => void;
}) {
  const seg = smsSegmentInfo(body);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-gray-900/30" onClick={onClose} aria-hidden />
      <div className="relative flex h-full w-full max-w-lg flex-col bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-lg font-semibold text-gray-900">{variant.label}</h2>
              <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${AUDIENCE_CHIP[variant.audience]}`}>
                to {variant.audience}
              </span>
            </div>
            <div className="mt-0.5 font-mono text-[11px] text-gray-400">{variant.emailType ?? variant.id}</div>
          </div>
          <button onClick={onClose} className="shrink-0 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700" aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Trigger / Who / Why */}
          <div className="space-y-3 border-b border-gray-100 px-5 py-4">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Trigger</div>
              <p className="mt-1 text-sm leading-relaxed text-gray-700">{variant.trigger}</p>
            </div>
            {variant.who && (
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Who gets this</div>
                <p className="mt-1 text-sm leading-relaxed text-gray-700">{variant.who}</p>
              </div>
            )}
            {variant.why && (
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Why</div>
                <p className="mt-1 text-sm leading-relaxed text-gray-700">{variant.why}</p>
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="border-b border-gray-100 px-5 py-4">
            <div className="mb-3 text-[10px] font-semibold uppercase tracking-wide text-gray-400">Message preview</div>
            <SmsPhonePreview body={body} senderLast4={senderLast4} />
            <p className="mt-3 text-center text-[11px] tabular-nums text-gray-400">
              {seg.chars} chars · {seg.segments} segment{seg.segments === 1 ? "" : "s"} · {seg.encoding}
              {seg.segments > 1 ? " — billed per segment" : ""}
            </p>
          </div>

          {/* Gates */}
          {variant.gates && variant.gates.length > 0 && (
            <div className="px-5 py-4">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Before it sends</div>
              <ul className="mt-2 space-y-1.5">
                {variant.gates.map((g, i) => (
                  <li key={i} className="flex gap-2 text-[13px] leading-relaxed text-gray-600">
                    <span className="mt-[7px] inline-block h-1 w-1 shrink-0 rounded-full bg-gray-300" />
                    <span>{g}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 border-t border-gray-100 px-5 py-3 text-[12px]">
          {variant.emailType ? (
            <Link href={`/admin/emails?type=${encodeURIComponent(variant.emailType)}`} className="text-gray-600 hover:text-teal-700">
              View sent log
            </Link>
          ) : (
            <span className="text-gray-400">Not written to the app send log — the Twilio delivery panel is the only record.</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SmsMessagesPanel({ senderLast4 }: { senderLast4?: string | null }) {
  const [openId, setOpenId] = useState<string | null>(null);

  // Bodies render once from the live templates — pure strings, no fetch.
  const rows = useMemo(
    () =>
      SMS_VARIANTS.map((v) => {
        const body = v.render();
        return { v, body, seg: smsSegmentInfo(body) };
      }),
    [],
  );
  const open = rows.find((r) => r.v.id === openId) ?? null;

  return (
    <>
      <div className="space-y-5">
        {SMS_GROUP_ORDER.map((group) => {
          const groupRows = rows.filter((r) => r.v.group === group);
          if (!groupRows.length) return null;
          return (
            <div key={group}>
              <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">{group}</div>
              <div className="divide-y divide-gray-100 rounded-lg border border-gray-100">
                {groupRows.map(({ v, body, seg }) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setOpenId(v.id)}
                    className="group flex w-full items-baseline gap-3 px-3 py-2 text-left transition-colors hover:bg-teal-50/40"
                  >
                    <span className="w-56 shrink-0 truncate text-sm text-gray-800 transition-colors group-hover:text-teal-700">
                      {v.label}
                    </span>
                    <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${AUDIENCE_CHIP[v.audience]}`}>
                      {v.audience}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[12px] text-gray-400">{body}</span>
                    <span className="shrink-0 text-[11px] tabular-nums text-gray-400">
                      {seg.chars}c · {seg.segments} seg
                    </span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-gray-400">
        Every outbound text, rendered from the live template with sample data — click a row for the full preview,
        who gets it, and the gates applied before send (quiet hours, daily cap, STOP). Family reply-alerts are
        transactional (the family started the thread); everything else here is event-triggered, not a drip.
      </p>

      {open && (
        <SmsTypeDrawer
          variant={open.v}
          body={open.body}
          senderLast4={senderLast4}
          onClose={() => setOpenId(null)}
        />
      )}
    </>
  );
}
