import { NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { LADDERS, type ContactField, type SectionKey } from "@/lib/medjobs/ladders";
import {
  SKIPPED,
  SWEEPS,
  parseSweepId,
  carryFrom,
  dueFor,
  dueIn,
  forwardStep,
  formatPhone,
  resolveNext,
} from "@/lib/medjobs/task-board";
import { handleChannelOp, type ChannelOp, type ChannelRow } from "./channel";
import { handleStudentOp, type StudentOp, type StudentRow } from "./student";

/**
 * The Tasks board, writing.
 *
 * The board itself is one GET next door. This is the other half: the small
 * set of changes an admin makes while reviewing records. It is deliberately
 * narrow — archive, delete, and edit the contact details — because those are
 * what a review pass needs. Completing and deferring tasks come later.
 *
 * Archive and delete are different promises, not two words for the same
 * thing:
 *
 *   archive  the record leaves the board and keeps everything. Reversible,
 *            and self-protecting: the catchment populate skips a provider
 *            that already has a record, archived or not.
 *   delete   the record is destroyed. The foreign keys cascade, so its
 *            tasks, contacts, touchpoints and approvals go with it. Because
 *            nothing is left to skip, the populate would recreate it on the
 *            next run — so a row goes into medjobs_excluded_records first,
 *            carrying a snapshot of what was destroyed.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body =
  | ChannelOp
  | StudentOp
  | { op: "archive_record"; recordId: string; reason?: string }
  | { op: "complete_check"; recordId: string; step: number; round: number }
  | { op: "reopen_check"; recordId: string; step: number; round: number }
  | {
      op: "complete_record_task";
      recordId: string;
      step: number;
      round: number;
      actionIndex: number;
      note?: string;
      /** Typed values the outcome asked for — a link, a date, a choice. */
      fields?: Record<string, string>;
      /** Names typed into a fan-out rung. Each becomes its own record. */
      found?: string[];
    }
  | { op: "defer_record_task"; recordId: string; step: number; round: number; days: number }
  | {
      op: "create_record";
      campusId: string;
      section: SectionKey;
      name: string;
      contact?: string;
      role?: string;
      phone?: string;
      email?: string;
      website?: string;
      address?: string;
    }
  | { op: "unarchive_record"; recordId: string }
  | { op: "clear_flag"; recordId: string }
  | { op: "delete_record"; recordId: string; reason?: string }
  | {
      op: "save_fields";
      recordId: string;
      fields: Partial<Record<ContactField, string>>;
      /** An admin correction. Absent means keep using the directory. */
      website?: string;
      /** The organisation's real name, when the one on file turns out wrong. */
      name?: string;
      /** An admin correction. Absent means keep using the directory. */
      address?: string;
      second?: Partial<Record<ContactField, string>>;
    };

const ARCHIVED_STATUS = "archived";
/** A provider who has said they are ready to receive a student. The goal. */
const READY_STATUS = "ready_for_students";

/**
 * The work type a rung is queued under.
 *
 * `research_initial` exists in the schema already and means exactly this:
 * establishing what is true about a record before anybody contacts it.
 * Everything else on the provider ladder is a round of contact.
 */
const taskTypeFor = (section: SectionKey, step: number): string =>
  LADDERS[section].steps[step]?.check ? "research_initial" : "outreach_contact";

/** Which ladder a record climbs — the same mapping the board reads with. */
const STAKEHOLDER_SECTION: Record<string, SectionKey> = {
  advisor: "advisors",
  student_org: "orgs",
  professor: "professors",
  dept_head: "professors",
};

const sectionOf = (row: { kind: string; stakeholder_type?: string | null }): SectionKey | null =>
  row.kind === "provider" ? "providers" : STAKEHOLDER_SECTION[row.stakeholder_type ?? ""] ?? null;

/**
 * student_outreach carries last_edited_by and last_edited_at, and nothing
 * maintains them — there is no trigger, so they are the application's job.
 * Left unset they keep saying the row was last touched when it was created,
 * which is worse than having no audit column at all.
 */
const stamp = (userId: string) => ({
  last_edited_by: userId,
  last_edited_at: new Date().toISOString(),
});

/**
 * A stakeholder record, created by a sweep or a fan-out.
 *
 * Starts at rung 1, not rung 0: rung 0 on these ladders is the research that
 * found it, and handing somebody a research task for a record they have just
 * researched is asking them to do it twice.
 *
 * `kind` and `stakeholder_type` both say advisor, and
 * provider_business_profile_id stays null — the partial constraint from
 * migration 072 requires exactly that of anything that is not a provider.
 */
async function createStakeholder(
  db: ReturnType<typeof getServiceClient>,
  campusId: string,
  name: string,
  userId: string,
): Promise<{ id?: string; error?: string }> {
  const { data, error } = await db
    .from("student_outreach")
    .insert({
      campus_id: campusId,
      kind: "advisor",
      stakeholder_type: "advisor",
      organization_name: name.slice(0, 200),
      status: "researched",
      cadence_day: 0,
      research_data: {
        found_by: "advisor_sweep",
        added_by: userId,
        added_at: new Date().toISOString(),
      },
      ...stamp(userId),
    })
    .select("id")
    .single();
  if (error || !data) return { error: error?.message ?? "Could not create the record" };

  const { error: taskError } = await db.from("student_outreach_tasks").insert({
    outreach_id: data.id,
    task_type: taskTypeFor("advisors", 1),
    status: "pending",
    due_at: new Date().toISOString().slice(0, 10),
    payload: { step: 1, round: LADDERS.advisors.steps[1]?.rounds ? 1 : 0 },
  });
  if (taskError) return { error: taskError.message };

  return { id: data.id };
}

export async function POST(req: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await getAdminUser(user.id);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Body must be JSON" }, { status: 400 });
  }
  if (!body || typeof body !== "object" || !("op" in body)) {
    return NextResponse.json({ error: "Missing op" }, { status: 400 });
  }

  const db = getServiceClient();

  // ── a record typed in by hand ─────────────────────────────────────────
  // Handled before the lookup below, because this is the one op whose
  // record does not exist yet.
  if (body.op === "create_record") {
    const name = (body.name ?? "").trim();
    if (!name) return NextResponse.json({ error: "A record needs a name" }, { status: 400 });
    if (body.section !== "providers") {
      // Everything else on the board is found by a rung or arrives from a
      // system, and a hand-typed row would sit outside the count those are
      // measured on. Refused rather than half-supported.
      return NextResponse.json(
        { error: "Only providers can be added by hand" },
        { status: 400 },
      );
    }

    const research: Record<string, unknown> = {
      // No directory row behind this one, which is why migration 235 exists:
      // the provider-link constraint accepts a record that says so.
      manual_entry: true,
      added_by: user.id,
      added_at: new Date().toISOString(),
      source: "typed_by_admin",
    };
    for (const key of ["website", "address"] as const) {
      const v = (body[key] ?? "").trim();
      if (v) research[key] = v;
    }

    const { data: created, error: createError } = await db
      .from("student_outreach")
      .insert({
        campus_id: body.campusId,
        kind: "provider",
        stakeholder_type: null,
        organization_name: name,
        status: "researched",
        cadence_day: 0,
        research_data: research,
        ...stamp(user.id),
      })
      .select("id")
      .single();
    if (createError || !created) {
      return NextResponse.json(
        { error: createError?.message ?? "Could not create the record" },
        { status: 500 },
      );
    }

    const person: Record<string, string> = {};
    if ((body.contact ?? "").trim()) person.name = body.contact!.trim();
    if ((body.role ?? "").trim()) person.role = body.role!.trim();
    if ((body.email ?? "").trim()) person.email = body.email!.trim();
    if ((body.phone ?? "").trim()) person.phone = formatPhone(body.phone!);
    if (Object.keys(person).length > 0) {
      await db
        .from("student_outreach_contacts")
        .insert({ outreach_id: created.id, is_primary: true, name: "", ...person });
    }

    // The opening rungs, the same as every record the catchment creates.
    // Providers open three at once: look them up, ring them, send them the
    // programme. They are one sitting's work.
    const block = Math.max(1, LADDERS[body.section].openTogether ?? 1);
    const today = new Date().toISOString().slice(0, 10);
    await db.from("student_outreach_tasks").insert(
      Array.from({ length: block }, (_, k) => ({
        outreach_id: created.id,
        task_type: taskTypeFor(body.section, k),
        status: "pending",
        due_at: today,
        payload: { step: k, round: LADDERS[body.section].steps[k]?.rounds ? 1 : 0 },
      })),
    );

    return NextResponse.json({ ok: true, id: created.id, name });
  }

  if (!body.recordId) {
    return NextResponse.json({ error: "Missing recordId" }, { status: 400 });
  }

  const { data: outreach } = await db
    .from("student_outreach")
    .select("id, campus_id, kind, stakeholder_type, organization_name, status, research_data")
    .eq("id", body.recordId)
    .maybeSingle();

  // Four kinds of thing carry an id on this board and only one of them is a
  // student_outreach row. A job board is the channel row itself; a student is
  // their own profile; the map sweep has no row at all until it is done. So a
  // miss here is a question rather than an answer.
  //
  // The sweep goes first because its id is synthetic — there is nothing to
  // look up, and every other lookup would miss it and cost a round trip.
  const sweep = parseSweepId(body.recordId);
  if (sweep) {
    const { taskType, section } = SWEEPS[sweep.kind];
    if (body.op !== "complete_record_task") {
      return NextResponse.json(
        { error: "A sweep can only be logged, not deferred or reopened." },
        { status: 400 },
      );
    }
    const fields =
      body.fields && typeof body.fields === "object"
        ? (body.fields as Record<string, string>)
        : {};

    // The advisor sweep's whole output is the offices it found, so they are
    // created before the sweep is marked done. The other order would let a
    // failure halfway leave a campus with its sweep closed and nothing to
    // show for it, and the sweep cannot be reopened.
    const found: string[] = Array.isArray(body.found)
      ? [...new Set(body.found.map((n) => String(n).trim()).filter(Boolean))].slice(0, 50)
      : [];
    let made = 0;
    if (sweep.kind === "advisor" && found.length > 0) {
      const { data: existing } = await db
        .from("student_outreach")
        .select("organization_name")
        .eq("campus_id", sweep.campusId)
        .eq("kind", "advisor");
      const already = new Set(
        (existing ?? []).map((r) => (r.organization_name ?? "").trim().toLowerCase()),
      );
      for (const name of found) {
        if (already.has(name.toLowerCase())) continue;
        const created = await createStakeholder(db, sweep.campusId, name, user.id);
        if (created.error) {
          return NextResponse.json({ error: created.error }, { status: 500 });
        }
        already.add(name.toLowerCase());
        made += 1;
      }
    }

    // A plain insert, not an upsert. The unique index behind each sweep is
    // partial, and a partial index cannot satisfy ON CONFLICT (campus_id) —
    // Postgres answers "no unique or exclusion constraint matching the ON
    // CONFLICT specification", which is a 500 to whoever pressed the button.
    // So: insert, and treat the unique violation a double click causes as
    // what it is, which is the row already being there.
    const { error } = await db.from("site_tasks").insert({
      campus_id: sweep.campusId,
      task_type: taskType,
      channel: null,
      due_at: new Date().toISOString(),
      status: "completed",
      completed_at: new Date().toISOString(),
      completed_by: user.id,
      created_by: user.id,
      payload:
        sweep.kind === "advisor"
          ? { found, added: made }
          : { added: Number(fields.added ?? 0) },
      notes: (body.note ?? "").trim() || null,
    });
    if (error && error.code !== "23505") {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, swept: sweep.campusId, section, added: made });
  }

  if (!outreach) {
    const { data: student } = await db
      .from("business_profiles")
      .select("id, display_name, city, state, metadata")
      .eq("id", body.recordId)
      .eq("type", "student")
      .maybeSingle();
    if (student) {
      const result = await handleStudentOp(db, body as StudentOp, student as StudentRow, user.id);
      return result.ok
        ? NextResponse.json({ ok: true, ...(result.body ?? {}) })
        : NextResponse.json({ error: result.error }, { status: result.status });
    }

    const { data: channel } = await db
      .from("campus_channels")
      .select("id, campus_id, channel, status, criteria, detail, first_activated_at")
      .eq("id", body.recordId)
      .maybeSingle();
    if (channel) {
      const result = await handleChannelOp(db, body as ChannelOp, channel as ChannelRow, user.id);
      return result.ok
        ? NextResponse.json({ ok: true, ...(result.body ?? {}) })
        : NextResponse.json({ error: result.error }, { status: result.status });
    }
  }

  if (!outreach) {
    // A synthetic starter row ("new:campus:section") has no database record
    // behind it, so there is nothing to archive, delete or edit.
    return NextResponse.json(
      { error: "That record does not exist yet. Start it before editing it." },
      { status: 404 },
    );
  }

  switch (body.op) {
    // ── archive ───────────────────────────────────────────────────────────
    case "archive_record": {
      const { error } = await db
        .from("student_outreach")
        .update({
          ...stamp(user.id),
          status: ARCHIVED_STATUS,
          research_data: {
            ...((outreach.research_data ?? {}) as Record<string, unknown>),
            archived_reason: body.reason ?? null,
            archived_by: user.id,
            archived_at: new Date().toISOString(),
          },
        })
        .eq("id", outreach.id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      // Nobody should be given work on a record that has left the board.
      await db
        .from("student_outreach_tasks")
        .update({ status: "cancelled" })
        .eq("outreach_id", outreach.id)
        .eq("status", "pending");

      return NextResponse.json({ ok: true, archived: outreach.organization_name });
    }

    // ── put it back ───────────────────────────────────────────────────────
    case "clear_flag": {
      const research = { ...((outreach.research_data ?? {}) as Record<string, unknown>) };
      delete research.flagged_on;
      const { error } = await db
        .from("student_outreach")
        .update({ ...stamp(user.id), research_data: research })
        .eq("id", outreach.id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    case "unarchive_record": {
      const research = { ...((outreach.research_data ?? {}) as Record<string, unknown>) };
      delete research.archived_reason;
      delete research.archived_by;
      delete research.archived_at;

      const { error } = await db
        .from("student_outreach")
        .update({ ...stamp(user.id), status: "researched", research_data: research })
        .eq("id", outreach.id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      // Give it something to do again, but only if nothing is open already.
      // A provider restarts at rung 0, which is now Research: a record that
      // has been off the board wants looking at before it is called. An
      // advisor starts at 1, because rung 0 there is the fan-out that found
      // it in the first place.
      const { count } = await db
        .from("student_outreach_tasks")
        .select("id", { count: "exact", head: true })
        .eq("outreach_id", outreach.id)
        .eq("status", "pending");
      if (!count) {
        await db.from("student_outreach_tasks").insert({
          outreach_id: outreach.id,
          task_type: "outreach_contact",
          status: "pending",
          due_at: new Date().toISOString().slice(0, 10),
          payload: { step: outreach.kind === "provider" ? 0 : 1, round: 0 },
        });
      }
      return NextResponse.json({ ok: true, restored: outreach.organization_name });
    }

    // ── delete ────────────────────────────────────────────────────────────
    case "delete_record": {
      // Everything about to be destroyed, kept so the decision can be
      // explained or undone by hand later.
      const [{ data: tasks }, { data: contacts }] = await Promise.all([
        db
          .from("student_outreach_tasks")
          .select("task_type, status, due_at, completed_at, payload, notes")
          .eq("outreach_id", outreach.id),
        db
          .from("student_outreach_contacts")
          .select("name, role, email, phone")
          .eq("outreach_id", outreach.id),
      ]);

      const research = (outreach.research_data ?? {}) as { olera_provider_id?: string };

      const { error: logError } = await db.from("medjobs_excluded_records").upsert(
        {
          campus_id: outreach.campus_id,
          olera_provider_id: research.olera_provider_id ?? null,
          organization_name: outreach.organization_name,
          kind: outreach.kind,
          reason: body.reason ?? null,
          snapshot: { record: outreach, tasks: tasks ?? [], contacts: contacts ?? [] },
          deleted_by: user.id,
        },
        { onConflict: "campus_id,olera_provider_id" },
      );
      // The exclusion row is what makes a delete stick. Without it the
      // populate brings the record back, so a failure here stops the delete
      // rather than letting it quietly undo itself.
      if (logError) {
        return NextResponse.json(
          { error: `Could not record the exclusion, so nothing was deleted: ${logError.message}` },
          { status: 500 },
        );
      }

      // Files next. The rows cascade with the record but the objects in the
      // bucket do not — storage has no foreign keys — so deleting the record
      // without this leaves collateral nobody can see and nobody can remove.
      // Before the cascade, because after it there is nothing left to read
      // the paths from.
      const { data: files } = await db
        .from("medjobs_attachments")
        .select("path")
        .eq("outreach_id", outreach.id);
      if (files && files.length > 0) {
        const { error: filesError } = await db.storage
          .from("medjobs-collateral")
          .remove(files.map((f) => f.path as string));
        if (filesError) {
          return NextResponse.json(
            { error: `Could not remove the files, so nothing was deleted: ${filesError.message}` },
            { status: 500 },
          );
        }
      }

      // student_outreach_touchpoints is append-only and its guard fires on a
      // cascade delete too, so those rows go first through a function that
      // is allowed to remove them.
      const { error: purgeError } = await db.rpc("medjobs_purge_touchpoints", {
        p_outreach_id: outreach.id,
      });
      if (purgeError && !/does not exist/i.test(purgeError.message)) {
        return NextResponse.json({ error: purgeError.message }, { status: 500 });
      }

      const { error } = await db.from("student_outreach").delete().eq("id", outreach.id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      return NextResponse.json({ ok: true, deleted: outreach.organization_name });
    }

    // ── a rung worked on the record itself ────────────────────────────────
    // Research is not a call to log. It is read the record, fix what is
    // wrong, and say so — which is why it is a checkbox rather than a
    // screen, and why it is the one rung that reaches the database as it
    // happens rather than at the end of a sitting.
    case "complete_check":
    case "complete_record_task":
    case "defer_record_task":
    case "reopen_check": {
      const section = sectionOf(outreach);
      if (!section) {
        return NextResponse.json({ error: "That record has no ladder" }, { status: 400 });
      }
      const step = Number(body.step);
      const round = Number(body.round);
      if (!Number.isInteger(step) || !Number.isInteger(round)) {
        return NextResponse.json({ error: "Missing step or round" }, { status: 400 });
      }
      const rung = LADDERS[section].steps[step];
      if (!rung) return NextResponse.json({ error: "That rung does not exist" }, { status: 400 });
      // The checkbox ops are for rungs worked on the record; the task ops
      // for every other kind. Crossing them would let a screen record an
      // outcome the rung does not offer.
      if (body.op === "complete_check" && !rung.check) {
        return NextResponse.json(
          { error: "That rung is not worked on the record" },
          { status: 400 },
        );
      }

      const { data: rows, error: readError } = await db
        .from("student_outreach_tasks")
        .select("id, status, payload, notes")
        .eq("outreach_id", outreach.id)
        .in("status", ["pending", "completed"]);
      if (readError) return NextResponse.json({ error: readError.message }, { status: 500 });

      const where = (t: { payload: unknown }) =>
        (t.payload ?? {}) as { step?: number; round?: number };
      const atStep = (n: number) => (rows ?? []).filter((t) => (where(t).step ?? 0) === n);

      // Which rung an outcome leads to is the ladder's decision, not this
      // file's — the same call the screen made before it sent this.
      const action =
        body.op === "complete_record_task" ? rung.actions[Number(body.actionIndex)] : rung.actions[0];
      if (body.op === "complete_record_task" && !action) {
        return NextResponse.json(
          { error: "That outcome does not exist on this rung" },
          { status: 400 },
        );
      }
      const fields =
        body.op === "complete_record_task" && body.fields && typeof body.fields === "object"
          ? Object.fromEntries(
              Object.entries(body.fields).map(([k, v]) => [k, String(v ?? "").slice(0, 500)]),
            )
          : {};
      // `fields` is not optional here: it is where a resuming outcome reads
      // its way back to. Without it the server sent every provider to round
      // one of the block they had left, while the screen showed the right
      // one until the next reload.
      const nextRung = action ? resolveNext(section, step, round, action, undefined, fields) : null;
      const next = nextRung?.step ?? null;
      const mine = atStep(step).filter((t) => (where(t).round ?? 0) === round);
      const after = next === null ? [] : atStep(next).filter(
        (t) => (where(t).round ?? 0) === (nextRung?.round ?? 0),
      );

      if (body.op === "defer_record_task") {
        const open = mine.find((t) => t.status === "pending");
        if (!open) return NextResponse.json({ error: "Nothing to put off" }, { status: 400 });
        const { error } = await db
          .from("student_outreach_tasks")
          .update({ due_at: dueIn(Number(body.days) || 1) })
          .eq("id", open.id);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        await db.from("student_outreach").update(stamp(user.id)).eq("id", outreach.id);
        return NextResponse.json({ ok: true });
      }

      if (body.op === "complete_check" || body.op === "complete_record_task") {
        const note = body.op === "complete_record_task" ? (body.note ?? "").trim() : "";
        const open = mine.find((t) => t.status === "pending");
        if (open) {
          const { error } = await db
            .from("student_outreach_tasks")
            .update({
              status: "completed",
              // A record migrated before this rung existed carries the
              // contact type on its opening task. It is the Research rung
              // now, so say so rather than leaving the row mislabelled.
              task_type: taskTypeFor(section, step),
              completed_at: new Date().toISOString(),
              // Which button was pressed. Without it every finished task
              // reads "Logged" and four attempts are indistinguishable.
              payload: {
                ...(open.payload ?? {}),
                step,
                round,
                outcome: action?.label,
                // What the outcome asked for. Unstored until now, which meant
                // a booked meeting kept its time only until the page reloaded.
                ...(Object.keys(fields).length ? { fields } : {}),
              },
              ...(note ? { notes: note } : {}),
            })
            .eq("id", open.id);
          if (error) return NextResponse.json({ error: error.message }, { status: 500 });
          // The snapshot still says pending, and for a "repeat" outcome the
          // rung it leads to is this one — so the guard below would see the
          // row we just closed, decide the next task was already waiting,
          // and queue nothing. A voicemail would close the call rung and
          // leave the provider with no task at all.
          open.status = "completed";
        } else if (!mine.some((t) => t.status === "completed")) {
          // No row to close — a record that predates the rung. Write the
          // fact rather than dropping it, so the history is still true.
          const { error } = await db.from("student_outreach_tasks").insert({
            outreach_id: outreach.id,
            task_type: taskTypeFor(section, step),
            status: "completed",
            due_at: new Date().toISOString().slice(0, 10),
            completed_at: new Date().toISOString(),
            payload: {
              step,
              round,
              outcome: action?.label,
              ...(Object.keys(fields).length ? { fields } : {}),
            },
            notes: note || null,
          });
          if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Somebody hit something they could not settle alone. The flag is
        // on the record rather than the task, because the point of it is to
        // be visible from the list without opening anything.
        if (fields.flag_review) {
          const research = (outreach.research_data ?? {}) as Record<string, unknown>;
          const { error } = await db
            .from("student_outreach")
            .update({
              ...stamp(user.id),
              research_data: { ...research, flagged_on: new Date().toISOString() },
            })
            .eq("id", outreach.id);
          if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Close the rungs a jump went past. The opening block leaves three
        // waiting at once, so a provider who says yes on the confirming call
        // would otherwise still be told to send the programme email.
        if (next !== null && next > step) {
          const passed = (rows ?? []).filter((t) => {
            const at = where(t).step ?? 0;
            return (
              t.status === "pending" && at > step && at < next && !(t.notes ?? "").trim()
            );
          });
          for (const t of passed) {
            const { error } = await db
              .from("student_outreach_tasks")
              .update({
                status: "completed",
                completed_at: new Date().toISOString(),
                payload: { ...((t.payload ?? {}) as object), outcome: SKIPPED },
              })
              .eq("id", t.id);
            if (error) return NextResponse.json({ error: error.message }, { status: 500 });
            t.status = "completed";
          }
        }

        // Queue what comes next, unless it is already waiting.
        if (next !== null && nextRung && !after.some((t) => t.status === "pending")) {
          const { error } = await db.from("student_outreach_tasks").insert({
            outreach_id: outreach.id,
            task_type: taskTypeFor(section, next),
            status: "pending",
            due_at: action ? dueFor(action, fields) : dueIn(0),
            payload: {
              step: nextRung.step,
              round: nextRung.round,
              // What the errand is, so the queued rung names itself.
              // Including where the record was, which is what a branch
              // reads to find its way home.
              ...(action && carryFrom(action, fields, { step, round })
                ? { fields: carryFrom(action, fields, { step, round }) }
                : {}),
            },
          });
          if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        }
      } else {
        // Unticking. Safe only while the rung it queued is untouched: a
        // pending row with nothing written on it is work nobody has started.
        const started = after.find((t) => t.status === "completed" || (t.notes ?? "").trim());
        if (started) {
          return NextResponse.json(
            { error: "Work has already moved on, so this can't be unticked" },
            { status: 409 },
          );
        }
        const ids = after.filter((t) => t.status === "pending").map((t) => t.id);
        if (ids.length) {
          const { error } = await db.from("student_outreach_tasks").delete().in("id", ids);
          if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        }
        const closed = mine.find((t) => t.status === "completed");
        if (closed) {
          const { error } = await db
            .from("student_outreach_tasks")
            .update({
              status: "pending",
              completed_at: null,
              due_at: new Date().toISOString().slice(0, 10),
            })
            .eq("id", closed.id);
          if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        }
      }

      // An outcome that closes the record closes it here too, or the board
      // shows it again on the next read.
      if (action?.outcome === "archive" || action?.outcome === "closed") {
        const { error } = await db
          .from("student_outreach")
          .update({
            ...stamp(user.id),
            status: ARCHIVED_STATUS,
            research_data: {
              ...((outreach.research_data ?? {}) as Record<string, unknown>),
              archived_reason: action.label,
              archived_by: user.id,
              archived_at: new Date().toISOString(),
            },
          })
          .eq("id", outreach.id);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        await db
          .from("student_outreach_tasks")
          .update({ status: "cancelled" })
          .eq("outreach_id", outreach.id)
          .eq("status", "pending");
        return NextResponse.json({ ok: true, archived: outreach.organization_name });
      }

      // Reaching the providers goal is a fact worth keeping. Nothing else
      // recorded it: the goal queues no task and left the status alone, so a
      // provider who had said they were ready looked exactly like one nobody
      // had started — no open task, no state — and the board could not count
      // them. Only providers: every other ladder either recurs from its goal
      // or means something different by it.
      if (section === "providers" && action?.outcome === "goal") {
        const { error } = await db
          .from("student_outreach")
          .update({ ...stamp(user.id), status: READY_STATUS })
          .eq("id", outreach.id);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ ok: true, ready: outreach.organization_name });
      }

      await db.from("student_outreach").update(stamp(user.id)).eq("id", outreach.id);
      return NextResponse.json({ ok: true });
    }

    // ── contact details ───────────────────────────────────────────────────
    case "save_fields": {
      const f = body.fields ?? {};
      const patch: Record<string, string> = {};
      if (typeof f.contact === "string") patch.name = f.contact.trim();
      if (typeof f.role === "string") patch.role = f.role.trim();
      if (typeof f.email === "string") patch.email = f.email.trim();
      // Normalised here as well as in the field, so a value that arrives by
      // any other route is stored the same way.
      if (typeof f.phone === "string") patch.phone = formatPhone(f.phone);

      // ── the primary contact ───────────────────────────────────────────
      if (Object.keys(patch).length > 0) {
        const { data: primary } = await db
          .from("student_outreach_contacts")
          .select("id")
          .eq("outreach_id", outreach.id)
          .order("is_primary", { ascending: false })
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle();

        const { error } = primary
          ? await db.from("student_outreach_contacts").update(patch).eq("id", primary.id)
          : await db
              .from("student_outreach_contacts")
              .insert({ outreach_id: outreach.id, is_primary: true, ...patch });
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // ── the second contact ────────────────────────────────────────────
      // Written only when something was actually typed, so opening the
      // disclosure and closing it again does not leave an empty person
      // behind for the next reader to wonder about.
      const s2 = body.second ?? {};
      const patch2: Record<string, string> = {};
      if (typeof s2.contact === "string") patch2.name = s2.contact.trim();
      if (typeof s2.role === "string") patch2.role = s2.role.trim();
      if (typeof s2.email === "string") patch2.email = s2.email.trim();
      if (typeof s2.phone === "string") patch2.phone = formatPhone(s2.phone);
      const second_has_content = Object.values(patch2).some((v) => v !== "");

      if (second_has_content) {
        const { data: rows } = await db
          .from("student_outreach_contacts")
          .select("id")
          .eq("outreach_id", outreach.id)
          .order("is_primary", { ascending: false })
          .order("created_at", { ascending: true });

        const existingSecond = (rows ?? [])[1];
        const { error } = existingSecond
          ? await db.from("student_outreach_contacts").update(patch2).eq("id", existingSecond.id)
          : await db
              .from("student_outreach_contacts")
              .insert({ outreach_id: outreach.id, is_primary: false, name: "", ...patch2 });
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // ── the record itself: name, address, website ─────────────────────
      // Gathered into one update on purpose. Each of these lives in
      // research_data, and they arrive together on every blur; writing them
      // one at a time means the second read of research_data is already
      // stale and quietly drops what the first one wrote.
      const research = { ...((outreach.research_data ?? {}) as Record<string, unknown>) };
      const columns: Record<string, unknown> = {};
      let touched = false;

      // Renaming the record, not the directory. If research shows the agency
      // trades under a different name, MedJobs should show it — but editing
      // olera-providers from here would change what the whole public site
      // calls them on the strength of one phone call.
      if (typeof body.name === "string") {
        const name = body.name.trim();
        if (!name) {
          return NextResponse.json({ error: "A record needs a name" }, { status: 400 });
        }
        if (name !== outreach.organization_name) {
          // Keep what it was called, once. A later rename should not erase
          // the name the spreadsheet and the directory still use.
          if (!research.original_name) research.original_name = outreach.organization_name;
          columns.organization_name = name;
          touched = true;
        }
      }

      for (const [key, value] of [
        ["address", body.address],
        ["website", body.website],
      ] as const) {
        if (typeof value !== "string") continue;
        const v = value.trim();
        if (v) research[key] = v;
        else delete research[key];
        touched = true;
      }

      if (touched) {
        const { error } = await db
          .from("student_outreach")
          .update({ ...columns, ...stamp(user.id), research_data: research })
          .eq("id", outreach.id);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ ok: true });
    }

    default:
      return NextResponse.json({ error: "Unknown op" }, { status: 400 });
  }
}
