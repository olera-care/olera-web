"use client";

import { useState } from "react";
import { CHANNEL_LABEL, TOUCH_CHANNELS, type TouchChannel, type TouchDirection } from "@/lib/touches/types";

/**
 * The five-second capture. One touch: channel, direction, what happened, and the
 * next action it implies. Posts to /api/admin/touches.
 *
 * Kept deliberately small. If it takes longer than the call it records, nobody
 * will fill it in, and an empty log is worse than none.
 */

type ProviderOption = { provider_id: string; display_name: string; contact_name: string | null };

function localNowForInput(): string {
  const d = new Date();
  d.setSeconds(0, 0);
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

export default function TouchForm({
  providerId,
  providers,
  defaultOwner,
  onSaved,
  onCancel,
}: {
  /** Fixed provider (timeline page) … */
  providerId?: string;
  /** … or a list to pick from (Relationships page). */
  providers?: ProviderOption[];
  defaultOwner?: string;
  onSaved: () => void;
  onCancel?: () => void;
}) {
  const [provider, setProvider] = useState<string>(providerId ?? providers?.[0]?.provider_id ?? "");
  const [channel, setChannel] = useState<TouchChannel>("email");
  const [direction, setDirection] = useState<TouchDirection>("out");
  const [when, setWhen] = useState<string>(localNowForInput());
  const [summary, setSummary] = useState("");
  const [detail, setDetail] = useState("");
  const [handle, setHandle] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [due, setDue] = useState("");
  const [owner, setOwner] = useState(defaultOwner ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    if (!provider) return setError("Pick a provider.");
    if (!summary.trim()) return setError("Say what happened, in one line.");
    if ((due || owner) && !nextAction.trim()) return setError("A due date needs a next action.");
    setSaving(true);
    try {
      const res = await fetch("/api/admin/touches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider_id: provider,
          channel,
          direction,
          occurred_at: when ? new Date(when).toISOString() : undefined,
          summary: summary.trim(),
          detail: detail.trim() || null,
          contact_handle: handle.trim() || null,
          next_action: nextAction.trim() || null,
          next_action_due: due || null,
          next_action_owner: nextAction.trim() ? owner.trim() || null : null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to log touch");
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to log touch");
    } finally {
      setSaving(false);
    }
  }

  const seg = (active: boolean) =>
    `rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
      active ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
    }`;
  const label = "block text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-500 mb-1";
  const input = "w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:border-gray-400 focus:bg-white focus:outline-none";

  return (
    <div className="space-y-3">
      {providers && !providerId && (
        <div>
          <label className={label}>Provider</label>
          <select className={input} value={provider} onChange={(e) => setProvider(e.target.value)}>
            {providers.map((p) => (
              <option key={p.provider_id} value={p.provider_id}>
                {p.display_name}
                {p.contact_name ? ` · ${p.contact_name}` : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className={label}>Channel · direction</label>
        <div className="flex flex-wrap gap-1.5">
          {TOUCH_CHANNELS.map((c) => (
            <button key={c} type="button" className={seg(channel === c)} onClick={() => setChannel(c)}>
              {CHANNEL_LABEL[c]}
            </button>
          ))}
          <span className="mx-1 border-l border-gray-200" />
          <button type="button" className={seg(direction === "out")} onClick={() => setDirection("out")}>
            We reached them
          </button>
          <button type="button" className={seg(direction === "in")} onClick={() => setDirection("in")}>
            They reached us
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <div>
          <label className={label}>What happened</label>
          <input
            className={input}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="One line. Called at 8:30 her time, connected, walked through asking two families for reviews."
            maxLength={240}
          />
        </div>
        <div>
          <label className={label}>When</label>
          <input type="datetime-local" className={input} value={when} onChange={(e) => setWhen(e.target.value)} />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_260px]">
        <div>
          <label className={label}>Detail, quote, or pasted thread (optional)</label>
          <textarea className={`${input} min-h-[64px]`} value={detail} onChange={(e) => setDetail(e.target.value)} />
        </div>
        <div>
          <label className={label}>Address or number used (optional)</label>
          <input className={input} value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="sherrypace2007@gmail.com" />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_150px_120px]">
        <div>
          <label className={label}>Next action</label>
          <input className={input} value={nextAction} onChange={(e) => setNextAction(e.target.value)} placeholder="Check her Google listing for a new review" />
        </div>
        <div>
          <label className={label}>Due</label>
          <input type="date" className={input} value={due} onChange={(e) => setDue(e.target.value)} />
        </div>
        <div>
          <label className={label}>Owner</label>
          <input className={input} value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="TJ" />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-2 pt-1">
        {onCancel && (
          <button type="button" onClick={onCancel} className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={submit}
          disabled={saving}
          className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {saving ? "Logging…" : "Log touch"}
        </button>
      </div>
    </div>
  );
}
