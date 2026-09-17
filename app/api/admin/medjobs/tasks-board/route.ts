import { NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { LADDERS, SECTION_ORDER, type SectionKey } from "@/lib/medjobs/ladders";
import {
  formatPhone,
  type BoardRecord,
  type BoardTask,
  type BoardUniversity,
  type ChannelStatus,
} from "@/lib/medjobs/task-board";

/**
 * The Tasks tab, as one read.
 *
 * Every university, the state of its five channels, the records inside it
 * and the tasks on those records. Assembled here rather than in the client
 * so the tab is one request, and so the shape the screen renders is the
 * shape the engine in lib/medjobs/task-board.ts already understands.
 *
 * Records come from two tables and always have. `student_outreach` holds
 * everything we contact in rounds — providers, advising offices, student
 * orgs, professors. `campus_channel_records` holds the activation ledger
 * for the list channels. They are read side by side rather than merged:
 * merging rows we cannot verify would lose history, and nothing here is
 * worth that.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STAKEHOLDER_SECTION: Record<string, SectionKey> = {
  advisor: "advisors",
  student_org: "orgs",
  professor: "professors",
  dept_head: "professors",
};

const CHANNEL_SECTION: Record<string, SectionKey> = {
  st3: "jobboard",
  st4: "advisors",
  st5: "orgs",
  st6: "events",
  st7: "professors",
};

const RECORD_KIND_SECTION: Record<string, SectionKey> = {
  organization: "orgs",
  event: "events",
  professor: "professors",
};

/** A record that has reached its goal, or stopped, stops climbing. */
const CLOSED_STATUSES = new Set([
  "active_partner",
  "not_interested",
  "no_response_closed",
  "do_not_contact",
  "wrong_contact",
  "archived",
]);

function emptyRecords(): Record<SectionKey, BoardRecord[]> {
  const out = {} as Record<SectionKey, BoardRecord[]>;
  for (const s of SECTION_ORDER) out[s] = [];
  return out;
}

const day = (iso: string | null): string =>
  iso ? new Date(iso).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await getAdminUser(user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = getServiceClient();

  const [
    campusesRes,
    channelsRes,
    channelRecordsRes,
    outreachRes,
    contactsRes,
    outreachTasksRes,
    siteTasksRes,
  ] =
    await Promise.all([
      db.from("student_outreach_campuses").select("id, slug, name").order("name"),
      db.from("campus_channels").select("id, campus_id, channel, status"),
      db
        .from("campus_channel_records")
        .select("id, channel_id, kind, name, status, contacts"),
      db
        .from("student_outreach")
        .select(
          "id, campus_id, kind, stakeholder_type, organization_name, status, cadence_day, notes, research_data",
        ),
      db
        .from("student_outreach_contacts")
        .select("outreach_id, name, first_name, last_name, role, email, phone, is_primary, created_at")
        // Ordered, because "the contact" has to be a decision rather than
        // whichever row the database happened to return first. Primary
        // wins; otherwise the oldest, which is the one somebody found first.
        .order("is_primary", { ascending: false })
        .order("created_at", { ascending: true }),
      db
        .from("student_outreach_tasks")
        .select("id, outreach_id, task_type, due_at, status, payload, notes, completed_at")
        .in("status", ["pending", "completed"]),
      db
        .from("site_tasks")
        .select("id, campus_id, record_id, task_type, due_at, status, payload, notes, completed_at")
        .in("status", ["pending", "completed"]),
    ]);

  const firstError =
    campusesRes.error ??
    channelsRes.error ??
    channelRecordsRes.error ??
    outreachRes.error ??
    contactsRes.error ??
    outreachTasksRes.error ??
    siteTasksRes.error;
  if (firstError) {
    return NextResponse.json({ error: firstError.message }, { status: 500 });
  }

  // ── websites ────────────────────────────────────────────────────────
  // Providers get theirs from the directory; an admin correction lives on
  // the record and wins. Only the ids actually on a board are fetched, so
  // this stays one small query rather than a scan of the directory.
  const providerIds = Array.from(
    new Set(
      (outreachRes.data ?? [])
        .map((r) => (r.research_data as { olera_provider_id?: string } | null)?.olera_provider_id)
        .filter((id): id is string => typeof id === "string" && id.length > 0),
    ),
  );
  const dirSite = new Map<string, string>();
  for (let i = 0; i < providerIds.length; i += 500) {
    const { data } = await db
      .from("olera-providers")
      .select("provider_id, website")
      .in("provider_id", providerIds.slice(i, i + 500));
    for (const row of data ?? []) {
      if (row.website) dirSite.set(row.provider_id, row.website);
    }
  }

  // ── contacts, one per record: the first with anything usable on it ──
  type Person = { contact: string; role: string; email: string; phone: string };
  const contactOf = new Map<string, Person>();
  const secondOf = new Map<string, Person>();
  for (const c of contactsRes.data ?? []) {
    const name = c.name || [c.first_name, c.last_name].filter(Boolean).join(" ");
    if (!name && !c.email && !c.phone) continue;
    const person: Person = {
      contact: name ?? "",
      role: c.role ?? "",
      email: c.email ?? "",
      // Punctuated on the way out, so a number stored before this existed
      // still reads the same as one saved today.
      phone: formatPhone(c.phone ?? ""),
    };
    if (!contactOf.has(c.outreach_id)) contactOf.set(c.outreach_id, person);
    else if (!secondOf.has(c.outreach_id)) secondOf.set(c.outreach_id, person);
  }

  // ── tasks, grouped by what they hang off ──────────────────────────
  const tasksByOutreach = new Map<string, BoardTask[]>();
  for (const t of outreachTasksRes.data ?? []) {
    const payload = (t.payload ?? {}) as { step?: number; round?: number; section?: string };
    const list = tasksByOutreach.get(t.outreach_id) ?? [];
    list.push({
      id: t.id,
      // Section is filled in once we know which record the task is on.
      section: "providers",
      step: typeof payload.step === "number" ? payload.step : 0,
      round: typeof payload.round === "number" ? payload.round : 0,
      dueAt: day(t.due_at),
      done: t.status === "completed",
      outcome: t.status === "completed" ? "Logged" : null,
      note: t.notes ?? "",
      loggedOn: t.completed_at ? day(t.completed_at) : null,
      spawned: [],
      spawnedRecords: [],
    });
    tasksByOutreach.set(t.outreach_id, list);
  }

  const siteTask = (
    t: NonNullable<typeof siteTasksRes.data>[number],
    section: SectionKey,
  ): BoardTask => {
    const payload = (t.payload ?? {}) as { step?: number; round?: number };
    return {
      id: t.id,
      section,
      step: typeof payload.step === "number" ? payload.step : 0,
      round: typeof payload.round === "number" ? payload.round : 0,
      dueAt: day(t.due_at),
      done: t.status === "completed",
      outcome: t.status === "completed" ? "Logged" : null,
      note: t.notes ?? "",
      loggedOn: t.completed_at ? day(t.completed_at) : null,
      spawned: [],
      spawnedRecords: [],
    };
  };

  const siteTasksByCampus = new Map<string, typeof siteTasksRes.data>();
  for (const t of siteTasksRes.data ?? []) {
    const list = siteTasksByCampus.get(t.campus_id) ?? [];
    list.push(t);
    siteTasksByCampus.set(t.campus_id, list);
  }

  // ── build one university at a time ────────────────────────────────
  const universities: BoardUniversity[] = (campusesRes.data ?? []).map((campus) => {
    const channels: BoardUniversity["channels"] = {};
    for (const ch of channelsRes.data ?? []) {
      if (ch.campus_id !== campus.id) continue;
      channels[ch.channel as keyof BoardUniversity["channels"]] = ch.status as ChannelStatus;
    }

    const records = emptyRecords();

    for (const row of outreachRes.data ?? []) {
      if (row.campus_id !== campus.id) continue;
      const section =
        row.kind === "provider"
          ? "providers"
          : STAKEHOLDER_SECTION[row.stakeholder_type ?? ""] ?? null;
      if (!section) continue;

      // Archiving is the promise that a record leaves the board. It still
      // exists, which is what stops the catchment populate recreating it,
      // but it does not belong in a queue of work.
      if (row.status === "archived") continue;

      const c = contactOf.get(row.id);
      const tasks = (tasksByOutreach.get(row.id) ?? []).map((t) => ({ ...t, section }));
      const pending = tasks.filter((t) => !t.done);
      const closed = CLOSED_STATUSES.has(row.status);

      const research = (row.research_data ?? {}) as {
        olera_provider_id?: string;
        website?: string;
      };
      const edited = (research.website ?? "").trim();
      const fromDirectory = dirSite.get(research.olera_provider_id ?? "") ?? "";

      records[section].push({
        id: row.id,
        section,
        name: row.organization_name ?? "Unnamed",
        contact: c?.contact ?? "",
        role: c?.role ?? "",
        phone: c?.phone ?? "",
        email: c?.email ?? "",
        website: edited || fromDirectory,
        websiteEdited: Boolean(edited),
        contact2: secondOf.get(row.id),
        // Position is derived from the work in flight, not stored twice.
        step: closed ? null : pending[0]?.step ?? 0,
        round: pending[0]?.round ?? 0,
        state: closed ? row.status.replace(/_/g, " ") : null,
        tasks,
      });
    }

    // The job board has no person to chase, so the channel itself is the
    // record. Its tasks are the campus-level site tasks — the ones not bound
    // to a channel record.
    for (const ch of channelsRes.data ?? []) {
      if (ch.campus_id !== campus.id) continue;
      if (CHANNEL_SECTION[ch.channel] !== "jobboard") continue;
      const tasks = (siteTasksByCampus.get(campus.id) ?? [])
        .filter((t) => !t.record_id)
        .map((t) => siteTask(t, "jobboard"));
      const pending = tasks.filter((t) => !t.done);
      records.jobboard.push({
        id: ch.id,
        section: "jobboard",
        name: "University job board",
        contact: "",
        role: "",
        phone: "",
        email: "",
        website: "",
        step: ch.status === "live" ? null : pending[0]?.step ?? 0,
        round: 0,
        state: ch.status === "live" ? LADDERS.jobboard.goal : null,
        tasks,
      });
    }

    // Orgs, events and professors also exist as channel records — the
    // activation ledger. An event in particular lives only here, because an
    // event is not someone you run follow-up rounds at.
    for (const rec of channelRecordsRes.data ?? []) {
      const channel = (channelsRes.data ?? []).find((c) => c.id === rec.channel_id);
      if (!channel || channel.campus_id !== campus.id) continue;
      const section = RECORD_KIND_SECTION[rec.kind];
      if (!section) continue;
      // An org or professor already carried as an outreach row is the same
      // thing twice; the outreach row wins, because it holds the cadence.
      if (records[section].some((r) => r.name === rec.name)) continue;

      const tasks = (siteTasksByCampus.get(campus.id) ?? [])
        .filter((t) => t.record_id === rec.id)
        .map((t) => siteTask(t, section));
      const pending = tasks.filter((t) => !t.done);
      const contact = ((rec.contacts ?? []) as Array<{ name?: string; role?: string; email?: string; phone?: string }>)[0];
      const done = rec.status === "live" || rec.status === "declined";

      records[section].push({
        id: rec.id,
        section,
        name: rec.name,
        contact: contact?.name ?? "",
        role: (contact as { role?: string } | undefined)?.role ?? "",
        phone: formatPhone(contact?.phone ?? ""),
        email: contact?.email ?? "",
        website: "",
        step: done ? null : pending[0]?.step ?? 0,
        round: pending[0]?.round ?? 0,
        state: done ? (rec.status === "live" ? LADDERS[section].goal : "declined") : null,
        tasks,
      });
    }

    // Every section a university needs starts itself. A campus with no
    // student orgs yet does not need someone to press Start — it needs the
    // first rung of the orgs ladder, which is "go and find them". Providers
    // and students are excluded: those arrive from the catchment and from
    // applications, so an empty section there is a fact, not a to-do.
    for (const section of SECTION_ORDER) {
      const ladder = LADDERS[section];
      if (ladder.auto) continue;
      if (records[section].length > 0) continue;
      records[section].push({
        id: `new:${campus.id}:${section}`,
        section,
        name: ladder.label,
        contact: "",
        role: "",
        phone: "",
        email: "",
        website: "",
        step: 0,
        round: ladder.steps[0]?.rounds ? 1 : 0,
        state: null,
        tasks: [
          {
            id: `new:${campus.id}:${section}:0`,
            section,
            step: 0,
            round: ladder.steps[0]?.rounds ? 1 : 0,
            dueAt: day(null),
            done: false,
            outcome: null,
            note: "",
            loggedOn: null,
            spawned: [],
            spawnedRecords: [],
          },
        ],
      });
    }

    return { id: campus.id, slug: campus.slug, name: campus.name, channels, records };
  });

  // A university with nothing on it at all is noise on the board.
  const withSomething = universities.filter((u) =>
    SECTION_ORDER.some((s) => (u.records[s] ?? []).length > 0),
  );

  return NextResponse.json({ universities: withSomething });
}

/** Kinds we know how to place, exported so the tab can say what it skipped. */
export const PLACEABLE = { STAKEHOLDER_SECTION, CHANNEL_SECTION, RECORD_KIND_SECTION };
