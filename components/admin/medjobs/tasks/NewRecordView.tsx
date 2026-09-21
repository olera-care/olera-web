"use client";

import { useState } from "react";
import { LADDERS, type ContactField, type SectionKey } from "@/lib/medjobs/ladders";
import { formatPhone } from "@/lib/medjobs/task-board";

/**
 * A record typed in by hand.
 *
 * The catchment can only find a provider the directory already knows about,
 * and the directory does not know about all of them. An agency somebody
 * heard of on a call has nowhere to go otherwise.
 *
 * It is the same form as the record itself on purpose — the same labels in
 * the same order — so the thing you fill in and the thing you come back to
 * are recognisably one object. Only the name is required: everything else is
 * what the first rung is for.
 */

const FIELDS: ContactField[] = ["contact", "role", "phone", "email"];
const LABEL: Record<ContactField, string> = {
  contact: "Primary contact",
  role: "Role",
  phone: "Phone",
  email: "Email",
};

export interface NewRecord {
  name: string;
  contact: string;
  role: string;
  phone: string;
  email: string;
  website: string;
  address: string;
}

const EMPTY: NewRecord = {
  name: "",
  contact: "",
  role: "",
  phone: "",
  email: "",
  website: "",
  address: "",
};

export default function NewRecordView({
  section,
  universityName,
  busy,
  onCancel,
  onCreate,
}: {
  section: SectionKey;
  universityName: string;
  busy?: boolean;
  onCancel: () => void;
  onCreate: (draft: NewRecord) => void;
}) {
  const [draft, setDraft] = useState<NewRecord>(EMPTY);
  const set = (k: keyof NewRecord, v: string) => setDraft((d) => ({ ...d, [k]: v }));
  const named = draft.name.trim().length > 0;
  const kind = LADDERS[section].label.replace(/s$/, "").toLowerCase();

  return (
    <form
      className="px-5 py-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!named || busy) return;
        onCreate({ ...draft, name: draft.name.trim(), phone: formatPhone(draft.phone) });
      }}
    >
      <input
        autoFocus
        value={draft.name}
        onChange={(e) => set("name", e.target.value)}
        placeholder={`New ${kind}`}
        aria-label="Name"
        className="w-full rounded-md border border-primary-600 bg-white px-2 py-1 text-[15px] font-semibold text-gray-900 placeholder:font-normal placeholder:text-gray-400 focus:outline-none"
      />
      <p className="mt-1 text-[12.5px] text-gray-500">
        Added to {universityName}. It starts on the first rung, the same as every other{" "}
        {kind}.
      </p>

      <div className="mt-4 space-y-1.5">
        {FIELDS.map((f) => (
          <label key={f} className="flex items-center gap-2.5">
            <span className="w-24 shrink-0 text-[12px] text-gray-500">{LABEL[f]}</span>
            <input
              value={draft[f]}
              onChange={(e) => set(f, e.target.value)}
              onBlur={() => f === "phone" && set("phone", formatPhone(draft.phone))}
              placeholder="—"
              className="min-w-0 flex-1 rounded-md border border-transparent bg-gray-50 px-2.5 py-1.5 text-[13px] text-gray-900 focus:border-primary-600 focus:bg-white focus:outline-none"
            />
          </label>
        ))}
        {(["website", "address"] as const).map((f) => (
          <label key={f} className="flex items-center gap-2.5">
            <span className="w-24 shrink-0 text-[12px] capitalize text-gray-500">{f}</span>
            <input
              value={draft[f]}
              onChange={(e) => set(f, e.target.value)}
              placeholder="—"
              className="min-w-0 flex-1 rounded-md border border-transparent bg-gray-50 px-2.5 py-1.5 text-[13px] text-gray-900 focus:border-primary-600 focus:bg-white focus:outline-none"
            />
          </label>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4">
        <button
          type="submit"
          disabled={!named || busy}
          className={`rounded-md border border-primary-600 bg-primary-600 px-3 py-2 text-[12.5px] font-semibold text-white hover:bg-primary-700 ${
            named && !busy ? "" : "cursor-not-allowed opacity-40"
          }`}
        >
          Add {kind}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-[12.5px] font-semibold text-gray-800 hover:bg-gray-50"
        >
          Cancel
        </button>
        {!named && <span className="text-[12px] text-gray-500">A name is all it needs.</span>}
      </div>
    </form>
  );
}
