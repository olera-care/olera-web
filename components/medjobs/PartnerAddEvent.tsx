"use client";

/**
 * PartnerAddEvent — portal "tell us about an event" (Chunk 3.4, S19/R13).
 * It's a signal, not a booking: existing events vs ones we could help create.
 */

import { useState } from "react";

export function PartnerAddEvent({ token }: { token: string }) {
  const [open, setOpen] = useState(false);
  const [bucket, setBucket] = useState<"existing" | "new">("existing");
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [timing, setTiming] = useState("");
  const [mode, setMode] = useState<"in_person" | "virtual">("in_person");
  const [location, setLocation] = useState("");
  const [contact, setContact] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!name.trim()) {
      setError("Add an event name.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/medjobs/partner/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, bucket, name, date, timing, mode, location, contact, notes }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Could not send");
      setDone(true);
      setName(""); setDate(""); setTiming(""); setLocation(""); setContact(""); setNotes("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send");
    } finally {
      setBusy(false);
    }
  };

  const input = "w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none";

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between text-left">
        <span>
          <span className="block text-sm font-semibold text-gray-900">Tell us about an event 📅</span>
          <span className="block text-xs text-gray-500">Career fairs, org meetings, class visits.</span>
        </span>
        <span className="text-gray-400">{open ? "▴" : "▾"}</span>
      </button>

      {open && (
        <div className="mt-3 space-y-2">
          <p className="text-[11px] text-gray-500">You&apos;re flagging an opportunity — not booking. We follow up, ideally 1+ month ahead.</p>
          {done ? (
            <p className="text-sm text-primary-700">Thanks — we&apos;ll be in touch.{" "}
              <button onClick={() => setDone(false)} className="underline">Add another</button>
            </p>
          ) : (
            <>
              <div className="flex gap-3 text-xs text-gray-700">
                <label className="flex items-center gap-1.5"><input type="radio" checked={bucket === "existing"} onChange={() => setBucket("existing")} /> Existing event</label>
                <label className="flex items-center gap-1.5"><input type="radio" checked={bucket === "new"} onChange={() => setBucket("new")} /> One we could create</label>
              </div>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="What is it? (e.g. Pre-Health Career Fair)" className={input} />
              <div className="flex gap-2">
                <input value={date} onChange={(e) => setDate(e.target.value)} placeholder="Date (or 'next spring')" className={input} />
                <input value={timing} onChange={(e) => setTiming(e.target.value)} placeholder="Approx timing" className={input} />
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-700">
                <label className="flex items-center gap-1.5"><input type="radio" checked={mode === "in_person"} onChange={() => setMode("in_person")} /> In person</label>
                <label className="flex items-center gap-1.5"><input type="radio" checked={mode === "virtual"} onChange={() => setMode("virtual")} /> Virtual</label>
                <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" className={input} />
              </div>
              <input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Who to contact (optional)" className={input} />
              <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (optional)" className={input} />
              {error && <p className="text-xs text-red-600">{error}</p>}
              <button onClick={submit} disabled={busy} className="rounded-md bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700 disabled:opacity-50">
                {busy ? "Sending…" : "Send to our team"}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
