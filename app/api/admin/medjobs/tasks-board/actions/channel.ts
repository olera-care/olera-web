import type { SupabaseClient } from "@supabase/supabase-js";
import { CHANNELS, deriveStatus, type Channel } from "@/lib/medjobs/activation";
import { LADDERS, rungAt, type SectionKey } from "@/lib/medjobs/ladders";
import { dueIn, resolveNext } from "@/lib/medjobs/task-board";

/**
 * Writing a channel.
 *
 * A channel is not a record somebody created — it is a row in
 * `campus_channels`, one per university per channel, and its work lives in
 * `site_tasks` rather than `student_outreach_tasks`. So none of the record
 * ops next door reach it, and this is the other half.
 *
 * It is also the first ladder whose task completions are written down. That
 * is not a preference: the green light on the board is derived from
 * `campus_channels.criteria`, and a rung that only ever completed in a
 * browser tab could never tick one. Provider calls still live in memory
 * until a sitting ends; that gap is real and named, not forgotten.
 *
 * Two links and a contact live in `campus_channels.detail`, which migration
 * 219 created for exactly this and whose own comment names ST3 posting_url.
 */

/** Only the job board is worked as a ladder today. */
const SECTION_OF: Partial<Record<Channel, SectionKey>> = { st3: "jobboard" };

export interface ChannelRow {
  id: string;
  campus_id: string;
  channel: string;
  status: string;
  criteria: Record<string, string> | null;
  detail: Record<string, unknown> | null;
  first_activated_at: string | null;
}

export type ChannelOp =
  | { op: "save_channel"; recordId: string; fields: Record<string, string | undefined> }
  | { op: "complete_check"; recordId: string; step: number; round: number }
  | { op: "reopen_check"; recordId: string; step: number; round: number; actionIndex?: number }
  | {
      op: "complete_channel_task";
      recordId: string;
      step: number;
      round: number;
      actionIndex: number;
      note?: string;
    }
  | { op: "defer_channel_task"; recordId: string; step: number; round: number; days: number };

/** The screen sends these names; the database stores these keys. */
const DETAIL_KEYS: Record<string, string> = {
  boardUrl: "board_url",
  postingUrl: "posting_url",
  contact: "contact_name",
  email: "contact_email",
  servicesEmail: "services_email",
};

/**
 * The service client, as this file uses it. Typed from the library rather
 * than loosely, so a renamed column is a compile error here and not a
 * surprise in production.
 */
type Db = SupabaseClient;

type Result = { ok: true; body?: Record<string, unknown> } | { ok: false; error: string; status: number };

const fail = (error: string, status = 400): Result => ({ ok: false, error, status });

/**
 * Every task on this channel, pending or done. Small — a channel holds a
 * handful — so it is read once and matched in memory rather than with a
 * jsonb filter per lookup.
 */
async function tasksOn(db: Db, row: ChannelRow) {
  const { data, error } = await db
    .from("site_tasks")
    .select("id, status, payload, notes, due_at")
    .eq("campus_id", row.campus_id)
    .eq("channel", row.channel)
    .is("record_id", null)
    .in("status", ["pending", "completed"]);
  if (error) throw new Error(error.message);
  const at = (step: number, round?: number) =>
    (data ?? []).filter((t: { payload: unknown }) => {
      const p = (t.payload ?? {}) as { step?: number; round?: number };
      return (p.step ?? 0) === step && (round === undefined || (p.round ?? 0) === round);
    });
  return { rows: data ?? [], at };
}

/** Queue a rung, unless it is already waiting. */
async function queue(
  db: Db,
  row: ChannelRow,
  next: { step: number; round: number },
  delay: number,
  at: (step: number, round?: number) => Array<{ status: string }>,
) {
  if (at(next.step, next.round).some((t) => t.status === "pending")) return;
  const { error } = await db.from("site_tasks").insert({
    campus_id: row.campus_id,
    channel: row.channel,
    // The schema has one work type for this channel and the rung lives in
    // the payload, so a new rung needs no migration to be queueable.
    task_type: CHANNELS[row.channel as Channel].checkTask ?? "manual_followup",
    status: "pending",
    due_at: `${dueIn(delay)}T12:00:00Z`,
    payload: { step: next.step, round: next.round },
  });
  if (error) throw new Error(error.message);
}

/**
 * Apply an action's criterion ticks and let the status follow.
 *
 * The status is never chosen, only derived — the rule the activation guide
 * states and the one the green dot reads. `first_activated_at` is stamped
 * once and never cleared, because the channel did activate and that does not
 * stop being true if the posting later lapses.
 */
async function tick(db: Db, row: ChannelRow, keys: string[], userId: string) {
  if (!keys.length) return { status: row.status, live: false };
  const criteria = { ...(row.criteria ?? {}) };
  const now = new Date().toISOString();
  for (const k of keys) criteria[k] = criteria[k] ?? now;

  const def = CHANNELS[row.channel as Channel];
  const status = deriveStatus(criteria, def);
  const live = status === "live" && row.status !== "live";

  const patch: Record<string, unknown> = { criteria, status, updated_at: now };
  if (live && !row.first_activated_at) patch.first_activated_at = now;
  const { error } = await db.from("campus_channels").update(patch).eq("id", row.id);
  if (error) throw new Error(error.message);
  void userId;
  return { status, live };
}

export async function handleChannelOp(
  db: Db,
  body: ChannelOp,
  row: ChannelRow,
  userId: string,
): Promise<Result> {
  const section = SECTION_OF[row.channel as Channel];
  if (!section) return fail("That channel is not worked as a ladder yet");

  if (body.op === "save_channel") {
    const detail = { ...((row.detail ?? {}) as Record<string, unknown>) };
    for (const [name, key] of Object.entries(DETAIL_KEYS)) {
      const value = body.fields?.[name];
      if (typeof value !== "string") continue;
      const v = value.trim();
      // An emptied field is removed rather than stored blank, so "has a
      // listing link" stays a question the data can answer.
      if (v) detail[key] = v;
      else delete detail[key];
    }
    const { error } = await db
      .from("campus_channels")
      .update({ detail, updated_at: new Date().toISOString() })
      .eq("id", row.id);
    if (error) return fail(error.message, 500);
    return { ok: true };
  }

  const step = Number(body.step);
  const round = Number(body.round);
  if (!Number.isInteger(step) || !Number.isInteger(round)) {
    return fail("Missing step or round");
  }
  const rung = rungAt(section, step, round);
  if (!rung) return fail("That rung does not exist");

  const { at } = await tasksOn(db, row);
  const mine = at(step, round);

  if (body.op === "defer_channel_task") {
    const open = mine.find((t: { status: string }) => t.status === "pending");
    if (!open) return fail("Nothing to put off");
    const { error } = await db
      .from("site_tasks")
      .update({ due_at: `${dueIn(Number(body.days) || 1)}T12:00:00Z` })
      .eq("id", open.id);
    if (error) return fail(error.message, 500);
    return { ok: true };
  }

  if (body.op === "reopen_check") {
    // Any rung, not only a ticked one. Undo has to reach the database or it
    // is not undo: the screen would show the rung open and the next refetch
    // would put it back, which is worse than refusing.
    const action = rung.actions[Number(body.actionIndex) || 0] ?? rung.actions[0];
    const next = action ? resolveNext(section, step, round, action) : null;
    const after = next ? at(next.step, next.round) : [];
    if (after.some((t: { status: string; notes: string | null }) => t.status === "completed" || (t.notes ?? "").trim())) {
      return fail("Work has already moved on, so this can't be unticked", 409);
    }
    const ids = after.filter((t: { status: string }) => t.status === "pending").map((t: { id: string }) => t.id);
    if (ids.length) {
      const { error } = await db.from("site_tasks").delete().in("id", ids);
      if (error) return fail(error.message, 500);
    }
    const closed = mine.find((t: { status: string }) => t.status === "completed");
    if (closed) {
      const { error } = await db
        .from("site_tasks")
        .update({ status: "pending", completed_at: null, due_at: `${dueIn(0)}T12:00:00Z` })
        .eq("id", closed.id);
      if (error) return fail(error.message, 500);
    }

    // Take back what the rung answered. The channel can fall out of live
    // this way, which is right — the criterion is no longer true. The
    // activation date is not cleared: it did happen, and undoing a tick does
    // not make it not have happened.
    const undo = action?.ticks ?? [];
    if (undo.length) {
      const criteria = { ...(row.criteria ?? {}) };
      for (const k of undo) delete criteria[k];
      const { error } = await db
        .from("campus_channels")
        .update({
          criteria,
          status: deriveStatus(criteria, CHANNELS[row.channel as Channel]),
          updated_at: new Date().toISOString(),
        })
        .eq("id", row.id);
      if (error) return fail(error.message, 500);
    }
    return { ok: true };
  }

  // ── completing a rung, ticked or logged ────────────────────────────
  const index = body.op === "complete_check" ? 0 : Number(body.actionIndex);
  const action = rung.actions[index];
  if (!action) return fail("That outcome does not exist on this rung");
  if (body.op === "complete_check" && !rung.check) {
    return fail("That rung is not worked on the record");
  }

  const note = body.op === "complete_channel_task" ? (body.note ?? "").trim() : "";
  const open = mine.find((t: { status: string }) => t.status === "pending");
  const stamp = {
    status: "completed",
    completed_at: new Date().toISOString(),
    completed_by: userId,
  };

  try {
    if (open) {
      const { error } = await db
        .from("site_tasks")
        .update(note ? { ...stamp, notes: note } : stamp)
        .eq("id", open.id);
      if (error) return fail(error.message, 500);
      // See the note in the record route: the snapshot must agree with what
      // was just written, or a "repeat" outcome queues nothing.
      open.status = "completed";
    } else if (!mine.some((t: { status: string }) => t.status === "completed")) {
      // No row to close — a rung reached before anything queued it. Write
      // the fact rather than dropping it.
      const { error } = await db.from("site_tasks").insert({
        campus_id: row.campus_id,
        channel: row.channel,
        task_type: CHANNELS[row.channel as Channel].checkTask ?? "manual_followup",
        ...stamp,
        due_at: `${dueIn(0)}T12:00:00Z`,
        payload: { step, round },
        notes: note || null,
      });
      if (error) return fail(error.message, 500);
    }

    const next = resolveNext(section, step, round, action);
    if (next) await queue(db, row, next, action.delay, at);

    const result = await tick(db, row, action.ticks ?? [], userId);
    return {
      ok: true,
      body: { status: result.status, live: result.live, goal: LADDERS[section].goal },
    };
  } catch (e) {
    return fail(e instanceof Error ? e.message : "That did not save", 500);
  }
}
