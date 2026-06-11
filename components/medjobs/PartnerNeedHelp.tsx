"use client";

/**
 * PartnerNeedHelp — top-right "Need help?" chat (Chunk 3.5, S26/R14).
 * A small message box (replies within a few business days) or book a call.
 */

import { useState } from "react";

export function PartnerNeedHelp({
  token,
  calendlyUrl,
}: {
  token: string;
  calendlyUrl: string;
}) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    if (!message.trim()) {
      setError("Type a message first.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/medjobs/partner/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, message }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Could not send");
      setDone(true);
      setMessage("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
      >
        ? Need help
      </button>
      {open && (
        <div className="absolute right-0 z-10 mt-2 w-72 rounded-xl border border-gray-200 bg-white p-4 shadow-lg">
          <p className="text-sm font-semibold text-gray-900">Message us</p>
          <p className="mt-0.5 text-[11px] text-gray-500">
            Graize and Dr. DuBose&apos;s team reply within a few business days.
          </p>
          {done ? (
            <p className="mt-2 text-sm text-primary-700">Sent — thank you! We&apos;ll be in touch.</p>
          ) : (
            <>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                placeholder="Your question or idea…"
                className="mt-2 w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:border-gray-400 focus:outline-none"
              />
              {error && <p className="text-xs text-red-600">{error}</p>}
              <div className="mt-2 flex items-center justify-between">
                <a href={calendlyUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-600 hover:underline">
                  or book a call ↗
                </a>
                <button onClick={send} disabled={busy} className="rounded-md bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700 disabled:opacity-50">
                  {busy ? "Sending…" : "Send"}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
