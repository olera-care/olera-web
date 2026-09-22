"use client";

import { useState } from "react";
import {
  HEARD_FIELDS,
  HEARD_LABEL,
  type FamilyTouchChannel,
  type Heard,
  type HeardField,
} from "@/lib/seeker-touches/types";

/**
 * Log what happened with a family.
 *
 * TJ's rule from the provider build, after the seven-field version of this:
 * "way too manual and I'll quickly fall behind and probably not use this as it
 * should be. More simple, fewer touches, automatic when possible is best."
 *
 * So: one box. You type what happened and press Log. Channel is inferred from
 * the words, time defaults to now, direction defaults to outbound. The only
 * other control is the one thing nothing can infer and everything depends on —
 * whether you actually got hold of them. Calling someone and speaking to them
 * are different events, and only the second clears an owed call.
 *
 * WHAT THE SYSTEM HEARD. The box stays one box, and after the save the model
 * shows what it read out of it. That ordering is the whole design. Fields shown
 * BEFORE the save are the seven-field form quoted above; the same fields shown
 * after, already filled, are the system reporting back, which is why they can be
 * visible without being work. Nothing here gates the log: by the time a chip
 * renders the touch is already written, and a reader who ignores every one of
 * them has lost nothing, because the note itself is still the record.
 */

const CHANNEL_GUESS: { channel: FamilyTouchChannel; words: RegExp }[] = [
  { channel: "call", words: /\b(call(ed|ing)?|phone[d]?|voicemail|vm|rang|dial(led|ed)?|spoke|talked)\b/i },
  { channel: "text", words: /\b(text(ed)?|sms|messaged|whatsapp)\b/i },
  { channel: "email", words: /\b(email(ed)?|wrote to|replied to|inbox)\b/i },
  { channel: "meeting", words: /\b(met|meeting|zoom|visit(ed)?|in person)\b/i },
];

/** Cheap and revisable: the box is the record, this only picks an icon's worth. */
export function guessChannel(text: string): FamilyTouchChannel {
  for (const g of CHANNEL_GUESS) if (g.words.test(text)) return g.channel;
  return "note";
}

/** "they called us", "she emailed" — a touch that came the other way. */
export function guessInbound(text: string): boolean {
  return /\b(they|she|he|her|his|family)\s+(called|texted|emailed|wrote|replied|got back)/i.test(text);
}

const SPOKE = /\b(spoke|talked|reached (her|him|them)|got (her|him|them) on|she said|he said|they said|answered|picked up)\b/i;
const MISSED =
  /\b(no answer|didn'?t (pick up|answer)|voicemail|mailbox (is )?full|left a (message|vm)|straight to voicemail|no pickup|couldn'?t reach|didn'?t reach|unreachable|rang out)\b/i;

/**
 * Did we get hold of them, as far as the words say.
 *
 * This is inferred rather than left blank because it is the one field that
 * changes what the list does, and a required-but-optional control defaulting to
 * the value that changes nothing is a trap: "Spoke to her, she'll call the
 * agency" would log as neither, and the row would stay red forever. MISSED is
 * tested first — "left her a voicemail, spoke to her son" is still a miss for
 * the person we owe the call to.
 *
 * An inbound touch counts as reached unless the words say otherwise: if they got
 * hold of us, contact happened, which is what an owed call is actually asking
 * for. "She called us back" is a yes even though nothing in it says "spoke".
 */
export function guessReached(text: string): boolean | null {
  if (MISSED.test(text)) return false;
  if (SPOKE.test(text)) return true;
  if (guessInbound(text)) return true;
  return null;
}

type Props = {
  seekerId: string;
  /** Called after a successful write so the timeline reloads. */
  onLogged: () => void;
};

export default function LogFamilyTouch({ seekerId, onLogged }: Props) {
  const [text, setText] = useState("");
  // undefined = nobody has chosen, so the words decide and keep deciding as you
  // type. A click pins it and stops the guessing.
  const [reachedChoice, setReachedChoice] = useState<boolean | null | undefined>(undefined);
  const [nextAction, setNextAction] = useState("");
  const [due, setDue] = useState("");
  const [showNext, setShowNext] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // What the last save was read to contain. Cleared when the next log starts,
  // so it always describes the note above it and never an older one.
  const [heard, setHeard] = useState<Heard | null>(null);
  // Details typed straight into the fields, for a log that needs no sentence.
  const [details, setDetails] = useState<Partial<Record<HeardField, string>>>({});
  const [showDetails, setShowDetails] = useState(false);

  const channel = guessChannel(text);
  const reached = reachedChoice === undefined ? guessReached(text) : reachedChoice;
  const filledDetails = Object.entries(details).filter(([, v]) => v && v.trim());
  // EITHER input is a complete log. Requiring the sentence would put the note
  // back in the way of someone who just wants to tap six things and move on.
  const canSave = (text.trim().length > 0 || filledDetails.length > 0) && !saving;

  async function save() {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    setHeard(null);
    try {
      const res = await fetch("/api/admin/seeker-touches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seeker_id: seekerId,
          channel,
          direction: guessInbound(text) ? "in" : "out",
          summary: text.trim().slice(0, 240),
          detail: text.trim().length > 240 ? text.trim() : null,
          reached,
          next_action: nextAction.trim() || null,
          next_action_due: due || null,
          care_details: filledDetails.length ? Object.fromEntries(filledDetails) : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Could not save that");
      setText("");
      setReachedChoice(undefined);
      setNextAction("");
      setDue("");
      setShowNext(false);
      setDetails({});
      setShowDetails(false);
      // Absent on an older deployment, or null when the note was too short to
      // read or the model was unavailable. Either way the log already succeeded.
      setHeard((data?.heard as Heard | null) ?? null);
      onLogged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save that");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-baseline justify-between">
        <p className="font-mono text-[9.5px] uppercase tracking-[0.11em] text-gray-500">Log what happened</p>
        {text.trim() && (
          <span className="font-mono text-[10.5px] text-gray-400">
            filing as {channel}
            {guessInbound(text) ? ", from them" : ""}
          </span>
        )}
      </div>

      <textarea
        id="family-touch-summary"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") save();
        }}
        rows={2}
        placeholder="Called, mailbox full, texted instead"
        className="mt-2 w-full resize-y rounded-lg border border-gray-200 px-3 py-2 text-[15px] text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none"
      />

      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <span className="text-[12px] text-gray-500">
          Did you get hold of them?
          {reachedChoice === undefined && reached !== null && (
            <span className="ml-1 text-gray-400">(read from what you wrote)</span>
          )}
        </span>
        {(
          [
            [true, "Yes, spoke to them"],
            [false, "No, didn't reach them"],
            [null, "Not applicable"],
          ] as const
        ).map(([v, label]) => (
          <button
            key={String(v)}
            type="button"
            onClick={() => setReachedChoice(v)}
            className={`rounded-full border px-2.5 py-1 text-[12px] font-medium ${
              reached === v
                ? v === true
                  ? "border-emerald-600 bg-emerald-600 text-white"
                  : v === false
                    ? "border-red-600 bg-red-600 text-white"
                    : "border-gray-900 bg-gray-900 text-white"
                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {showNext ? (
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <input
            id="family-touch-next"
            value={nextAction}
            onChange={(e) => setNextAction(e.target.value)}
            placeholder="What happens next"
            className="min-w-[220px] flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-[14px] text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none"
          />
          <input
            id="family-touch-due"
            type="date"
            value={due}
            onChange={(e) => setDue(e.target.value)}
            className="rounded-lg border border-gray-200 px-2 py-1.5 font-mono text-[12px] text-gray-700 focus:border-gray-400 focus:outline-none"
          />
        </div>
      ) : null}

      <div className="mt-2.5 flex flex-wrap items-center gap-4">
        {!showNext && (
          <button
            type="button"
            onClick={() => setShowNext(true)}
            className="text-[12px] font-medium text-teal-700 hover:underline"
          >
            + Set what happens next
          </button>
        )}
        {!showDetails && (
          <button
            type="button"
            onClick={() => setShowDetails(true)}
            className="text-[12px] font-medium text-teal-700 hover:underline"
          >
            + Add the details
          </button>
        )}
      </div>

      {showDetails && (
        <DetailFields
          values={details}
          onChange={(k, v) => setDetails((d) => ({ ...d, [k]: v }))}
          onClose={() => setShowDetails(false)}
        />
      )}

      {error && <p className="mt-2 text-[13px] text-red-600">{error}</p>}

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={!canSave}
          className="rounded-md bg-gray-900 px-3.5 py-1.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {saving ? "Logging…" : "Log it"}
        </button>
        <span className="font-mono text-[10.5px] text-gray-400">⌘↵ to log · time defaults to now</span>
      </div>

      {heard && <HeardStrip heard={heard} onDismiss={() => setHeard(null)} />}
    </div>
  );
}

/**
 * The same details, typed rather than read.
 *
 * Placeholders carry the explaining so the labels can stay as terse as the
 * chips they become. That is deliberate: someone who fills this in once
 * recognises the chips afterwards, and someone who reads the chips first knows
 * what these boxes want. One vocabulary, two directions.
 *
 * Nothing in here is required. A person opens it, fills the two things they
 * know, and presses Log.
 */
const FIELD_HINT: Record<HeardField, string> = {
  care_for: "Geraldine Wilson, 81",
  relationship: "sister, daughter, self",
  care_type: "home care, memory care",
  care_zip: "Oak Cliff, Dallas 75224",
  interim_location: "where they are now",
  hours: "6/day, mornings",
  transfers: "one person, two people, lift",
  payment: "private pay, Medicaid",
  starts: "late Oct",
  budget: "$30/hr",
};

function DetailFields({
  values,
  onChange,
  onClose,
}: {
  values: Partial<Record<HeardField, string>>;
  onChange: (k: HeardField, v: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="mt-2.5 rounded-lg border border-gray-200 bg-gray-50 p-3">
      <div className="flex items-baseline justify-between">
        <p className="font-mono text-[9.5px] uppercase tracking-[0.11em] text-gray-500">The details</p>
        <button type="button" onClick={onClose} className="font-mono text-[10.5px] text-gray-400 hover:text-gray-600">
          close
        </button>
      </div>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {HEARD_FIELDS.map((f) => (
          <label key={f} className="flex items-center gap-2">
            <span className="w-[74px] shrink-0 font-mono text-[9.5px] uppercase tracking-[0.06em] text-gray-500">
              {HEARD_LABEL[f]}
            </span>
            <input
              id={`family-detail-${f}`}
              value={values[f] ?? ""}
              onChange={(e) => onChange(f, e.target.value)}
              placeholder={FIELD_HINT[f]}
              className="min-w-0 flex-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-[13px] text-gray-900 placeholder:text-gray-300 focus:border-gray-400 focus:outline-none"
            />
          </label>
        ))}
      </div>
      <p className="mt-2 font-mono text-[10.5px] text-gray-400">
        Anything you type here wins over what the note is read to say, now and later.
      </p>
    </div>
  );
}

/**
 * What the model read out of the note that was just saved.
 *
 * Three states, because a guess that looks like a fact is how one invented
 * value ends up in front of a provider:
 *   teal   — read plainly from the words
 *   amber  — inferred, and worth a glance
 *   dashed — the note never mentioned it
 *
 * The dashed ones are the only thing here that reads as an invitation, and they
 * are capped: listing every unmentioned field on a two-line voicemail note turns
 * a receipt back into a form.
 */
function HeardStrip({ heard, onDismiss }: { heard: Heard; onDismiss: () => void }) {
  // Same defence as mergeHeard: a stored shape missing either key must degrade
  // to fewer chips, never to a blank page from a render throw.
  const fields = heard.fields ?? {};
  const alsoNoted = heard.also_noted ?? [];
  const got = HEARD_FIELDS.filter((f) => fields[f]);
  const missing = HEARD_FIELDS.filter((f) => !fields[f]);
  const shownMissing = missing.slice(0, 3);
  const unsure = got.filter((f) => fields[f]?.sure === false).length;

  return (
    <div className="mt-3 border-t border-dashed border-gray-200 pt-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-mono text-[9.5px] uppercase tracking-[0.11em] text-teal-700">What I got from that</p>
        <button
          type="button"
          onClick={onDismiss}
          className="font-mono text-[10.5px] text-gray-400 hover:text-gray-600"
        >
          {got.length} read{unsure > 0 ? ` · ${unsure} unsure` : ""} · dismiss
        </button>
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {got.map((f) => {
          const v = fields[f]!;
          return (
            <span
              key={f}
              className={`inline-flex items-baseline gap-1.5 rounded-md border px-2 py-1 text-[12.5px] ${
                v.sure ? "border-teal-600 bg-teal-50 text-gray-900" : "border-amber-400 bg-amber-50 text-gray-900"
              }`}
            >
              <span
                className={`font-mono text-[9.5px] uppercase tracking-[0.06em] ${
                  v.sure ? "text-teal-700" : "text-amber-700"
                }`}
              >
                {HEARD_LABEL[f as HeardField]}
              </span>
              <span className={`font-medium ${v.sure ? "" : "underline decoration-dotted underline-offset-2"}`}>
                {v.value}
              </span>
            </span>
          );
        })}
        {shownMissing.map((f) => (
          <span
            key={f}
            className="inline-flex items-baseline gap-1.5 rounded-md border border-dashed border-gray-300 px-2 py-1 text-[12.5px] text-gray-400"
          >
            <span className="font-mono text-[9.5px] uppercase tracking-[0.06em]">{HEARD_LABEL[f as HeardField]}</span>
            <span>not mentioned</span>
          </span>
        ))}
      </div>

      {alsoNoted.length > 0 && (
        <p className="mt-2 border-l-2 border-teal-600 pl-2.5 text-[12.5px] leading-relaxed text-gray-600">
          Also noted, in your words:{" "}
          {alsoNoted.map((q, i) => (
            <span key={i}>
              {i > 0 && " · "}
              <span className="bg-teal-50 px-0.5">&ldquo;{q}&rdquo;</span>
            </span>
          ))}
        </p>
      )}
    </div>
  );
}
