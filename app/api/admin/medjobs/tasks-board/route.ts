import { NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { LADDERS, SECTION_ORDER, type SectionKey } from "@/lib/medjobs/ladders";
import type {
  BoardRecord,
  BoardTask,
  BoardUniversity,
  ChannelStatus,
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

  const [campusesRes, channelsRes, outreachRes, contactsRes, outreachTasksRes, siteTasksRes] =
    await Promise.all([
      db.from("student_outreach_campuses").select("id, slug, name").order("name"),
      db.from("campus_channels").select("id, campus_id, channel, status"),
      db
        .from("student_outreach")
        .select("id, campus_id, kind, stakeholder_type, organization_name, status, cadence_day, notes"),
      db.from("student_outreach_contacts").select("outreach_id, name, first_name, last_name, email, phone"),
      db
        .from("student_outreach_tasks")
        .select("id, outreach_id, task_type, due_at, status, payload, notes, completed_at")
        .in("status", ["pending", "completed"]),
      db
        .from("site_tasks")
        .select("id, campus_id, task_type, due_at, status, payload, notes, completed_at")
        .in("status", ["pending", "completed"]),
    ]);

  const firstError =
    campusesRes.error ??
    channelsRes.error ??
    outreachRes.error ??
    contactsRes.error ??
    outreachTasksRes.error ??
    siteTasksRes.error;
  if (firstError) {
    return NextResponse.json({ error: firstError.message }, { status: 500 });
  }

  // ── contacts, one per record: the first with anything usable on it ──
  const contactOf = new Map<string, { contact: string; email: string; phone: string }>();
  for (const c of contactsRes.data ?? []) {
    if (contactOf.has(c.outreach_id)) continue;
    const name = c.name || [c.first_name, c.last_name].filter(Boolean).join(" ");
    if (!name && !c.email && !c.phone) continue;
    contactOf.set(c.outreach_id, { contact: name ?? "", email: c.email ?? "", phone: c.phone ?? "" });
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

      const c = contactOf.get(row.id);
      const tasks = (tasksByOutreach.get(row.id) ?? []).map((t) => ({ ...t, section }));
      const pending = tasks.filter((t) => !t.done);
      const closed = CLOSED_STATUSES.has(row.status);

      records[section].push({
        id: row.id,
        section,
        name: row.organization_name ?? "Unnamed",
        contact: c?.contact ?? "",
        phone: c?.phone ?? "",
        email: c?.email ?? "",
        // Position is derived from the work in flight, not stored twice.
        step: closed ? null : pending[0]?.step ?? 0,
        round: pending[0]?.round ?? 0,
        state: closed ? row.status.replace(/_/g, " ") : null,
        tasks,
      });
    }

    // The channel itself is a record where the ladder has no stakeholder to
    // hang off — the job board is a thing you do, not a person you chase.
    for (const ch of channelsRes.data ?? []) {
      if (ch.campus_id !== campus.id) continue;
      const section = CHANNEL_SECTION[ch.channel];
      if (section !== "jobboard") continue;
      const tasks: BoardTask[] = (siteTasksByCampus.get(campus.id) ?? [])
        .filter((t) => String(t.task_type).includes("job_board"))
        .map((t) => {
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
        });
      const pending = tasks.filter((t) => !t.done);
      records.jobboard.push({
        id: ch.id,
        section: "jobboard",
        name: "University job board",
        contact: "",
        phone: "",
        email: "",
        step: ch.status === "live" ? null : pending[0]?.step ?? 0,
        round: 0,
        state: ch.status === "live" ? LADDERS.jobboard.goal : null,
        tasks,
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
