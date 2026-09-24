"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** The family's reply box. Posts to /api/city-thread, then re-reads the page. */
export default function ThreadReply({ token, providerName }: { token: string; providerName: string }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function send() {
    if (!text.trim()) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/city-thread", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, body: text }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Couldn't send that. Try again in a moment.");
      setText("");
      setSent(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't send that. Try again in a moment.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mt-8">
      <label htmlFor="thread-reply" className="text-sm font-semibold text-gray-900">
        Reply
      </label>
      <textarea
        id="thread-reply"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        maxLength={2000}
        placeholder={`Write to ${providerName} and the Olera team`}
        className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-[15px] focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
      />
      <button
        type="button"
        onClick={send}
        disabled={sending || !text.trim()}
        className="mt-3 w-full rounded-xl bg-primary-600 px-4 py-3 text-[15px] font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
      >
        {sending ? "Sending…" : "Send"}
      </button>
      {sent && !error && <p className="mt-2 text-sm text-primary-700">Sent. {providerName} will see it.</p>}
      {error && (
        <p className="mt-2 text-sm text-error-700" role="alert">
          {error}
        </p>
      )}
      <p className="mt-4 text-xs text-gray-500">You can also reply to our text message. It lands here too.</p>
    </div>
  );
}
