"use client";

/**
 * PartnerAddColleague — portal "add a colleague" (Chunk 3.4, S18/R12).
 * Safety-first copy to reduce hesitation; submissions become new Partner
 * Prospects (referred by this partner) for the admin team.
 */

import { useState } from "react";

const ROLES = [
  { v: "advisor", l: "Advisor" },
  { v: "dept_head", l: "Department head" },
  { v: "student_org", l: "Student org leader" },
  { v: "professor", l: "Professor" },
];

export function PartnerAddColleague({ token }: { token: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("advisor");
  const [email, setEmail] = useState("");
  const [context, setContext] = useState("");
  const [allow, setAllow] = useState(true);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!name.trim()) {
      setError("Add a name.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/medjobs/partner/colleague", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, name, role, email, context, allow_mention: allow }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Could not add");
      setDone(true);
      setName("");
      setEmail("");
      setContext("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not add");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between text-left">
        <span>
          <span className="block text-sm font-semibold text-gray-900">Add a colleague ＋</span>
          <span className="block text-xs text-gray-500">Suggest who else we should talk to.</span>
        </span>
        <span className="text-gray-400">{open ? "▴" : "▾"}</span>
      </button>

      {open && (
        <div className="mt-3 space-y-2">
          <p className="rounded-md bg-gray-50 px-3 py-2 text-[11px] text-gray-600">
            We reach out respectfully and never spam. We&apos;ll only mention you suggested
            them if you&apos;re comfortable with that.
          </p>
          {done ? (
            <p className="text-sm text-primary-700">Thanks — we&apos;ll reach out. Add another?{" "}
              <button onClick={() => setDone(false)} className="underline">Add</button>
            </p>
          ) : (
            <>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none" />
              <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none">
                {ROLES.map((r) => <option key={r.v} value={r.v}>{r.l}</option>)}
              </select>
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email or where to find them (optional)" className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none" />
              <input value={context} onChange={(e) => setContext(e.target.value)} placeholder="Context (optional) — e.g. teaches the pre-med seminar" className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none" />
              <label className="flex items-center gap-2 text-xs text-gray-700">
                <input type="checkbox" checked={allow} onChange={(e) => setAllow(e.target.checked)} />
                OK to mention I referred them
              </label>
              {error && <p className="text-xs text-red-600">{error}</p>}
              <button onClick={submit} disabled={busy} className="rounded-md bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700 disabled:opacity-50">
                {busy ? "Sending…" : "Send"}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
