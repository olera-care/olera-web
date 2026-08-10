"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

/**
 * /admin/sms-click-test — does a tap on a text's link actually register?
 *
 * Two halves had to meet: a text carries a tagged link, and an arrival on the
 * plan page stamps the send it came from. Confirming that by hand meant editing
 * a query string and reading a database column, which is not a check anyone
 * repeats. This is the button version, and it answers in plain language.
 *
 * The quick check redirects the browser at a tagged link — it proves tagging,
 * attribution and display without waiting on a carrier. The text version puts
 * Twilio and a real handset in the loop as well.
 */

type Status =
  | { state: "none" }
  | {
      state: "waiting" | "clicked";
      sentAt: string;
      clickedAt: string | null;
      secondsToClick: number | null;
      sentTo: string;
      hasSid: boolean;
      deliveredAt: string | null;
    };

export default function SmsClickTestPage() {
  const [status, setStatus] = useState<Status | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [phone, setPhone] = useState("");

  const refresh = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/sms-click-test?mode=status", { cache: "no-store" });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || `HTTP ${r.status}`);
      setStatus(await r.json());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read status");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // The link opens in a new tab, so this tab stays put to show the result. The
  // click is recorded server-side as that tab renders, so a poll a moment later
  // is what turns it green.
  const runQuickCheck = () => {
    setNote(null);
    setError(null);
    window.open("/api/admin/sms-click-test?mode=open", "_blank", "noopener");
    setBusy(true);
    let tries = 0;
    const timer = setInterval(async () => {
      tries += 1;
      await refresh();
      if (tries >= 6) {
        clearInterval(timer);
        setBusy(false);
      }
    }, 1500);
  };

  const sendTestText = async () => {
    setBusy(true);
    setNote(null);
    setError(null);
    try {
      const r = await fetch(`/api/admin/sms-click-test?mode=sms&to=${encodeURIComponent(phone)}`, {
        cache: "no-store",
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
      setNote(`Text sent to ${j.sentTo}. Tap the link on your phone, then hit Refresh.`);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send the test text");
    } finally {
      setBusy(false);
    }
  };

  const clicked = status?.state === "clicked";
  const waiting = status?.state === "waiting";

  return (
    <div className="mx-auto max-w-2xl px-5 py-10">
      <Link href="/admin/automations" className="text-sm text-teal-700 hover:underline">
        ← Automations
      </Link>
      <h1 className="mt-3 text-2xl font-semibold text-gray-900">Does a text click register?</h1>
      <p className="mt-2 text-sm leading-relaxed text-gray-500">
        Texts carry a link to the family&rsquo;s plan page. This confirms that tapping one is
        recorded and shows up in the admin panel. Nothing here touches a real family&rsquo;s
        numbers.
      </p>

      {/* Result first — it's the answer, and the buttons are only how you get it. */}
      <div
        className={`mt-6 rounded-xl border px-5 py-4 ${
          clicked
            ? "border-emerald-200 bg-emerald-50"
            : waiting
              ? "border-amber-200 bg-amber-50"
              : "border-gray-200 bg-gray-50"
        }`}
      >
        {!status || status.state === "none" ? (
          <p className="text-sm text-gray-600">
            No check run yet. Use a button below and this turns green if it worked.
          </p>
        ) : clicked ? (
          <>
            <p className="text-sm font-semibold text-emerald-900">
              Working. The click was recorded
              {status.secondsToClick != null && status.secondsToClick >= 0
                ? ` ${status.secondsToClick}s after the send`
                : ""}
              .
            </p>
            <p className="mt-1 text-xs text-emerald-800">
              Clicked {new Date(status.clickedAt!).toLocaleString()}. This is the same path a
              family&rsquo;s tap takes, so the Clicked column on{" "}
              <Link href="/admin/automations" className="underline">
                Automations
              </Link>{" "}
              is now trustworthy.
            </p>
          </>
        ) : (
          <>
            <p className="text-sm font-semibold text-amber-900">
              Sent, waiting for the tap.
            </p>
            <p className="mt-1 text-xs text-amber-800">
              Sent {new Date(status.sentAt).toLocaleString()} to {status.sentTo}.
              {status.hasSid && (
                <> Carrier {status.deliveredAt ? "confirmed delivery" : "has not confirmed delivery yet"}.</>
              )}{" "}
              Open the link, then Refresh.
            </p>
          </>
        )}
      </div>

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}
      {note && (
        <p className="mt-3 rounded-lg bg-teal-50 px-4 py-2 text-sm text-teal-800">{note}</p>
      )}

      <div className="mt-6 space-y-4">
        <div className="rounded-xl border border-gray-200 p-4">
          <h2 className="text-sm font-semibold text-gray-800">Quick check</h2>
          <p className="mt-1 text-xs text-gray-500">
            Opens a tagged link in a new tab, exactly like tapping one in a text. Proves the
            tracking and the panel. No phone, no message sent.
          </p>
          <button
            onClick={runQuickCheck}
            disabled={busy}
            className="mt-3 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {busy ? "Checking…" : "Run quick check"}
          </button>
        </div>

        <div className="rounded-xl border border-gray-200 p-4">
          <h2 className="text-sm font-semibold text-gray-800">Full check, with a real text</h2>
          <p className="mt-1 text-xs text-gray-500">
            Sends one text to your phone so the carrier and handset are in the loop too. Tap the
            link, then Refresh.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Your mobile number"
              className="min-w-52 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <button
              onClick={sendTestText}
              disabled={busy || phone.trim().length < 10}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50"
            >
              Text it to me
            </button>
          </div>
        </div>

        <button onClick={refresh} className="text-sm text-teal-700 hover:underline">
          Refresh
        </button>
      </div>

      <p className="mt-8 text-xs leading-relaxed text-gray-400">
        Running this twice only records the first tap of each send. That is deliberate: the
        column means &ldquo;first arrival&rdquo;, so a second visit to the same link changes
        nothing. Run the check again for a fresh send.
      </p>
    </div>
  );
}
