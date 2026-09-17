import { NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import type { ContactField } from "@/lib/medjobs/ladders";
import { formatPhone } from "@/lib/medjobs/task-board";

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
  | { op: "archive_record"; recordId: string; reason?: string }
  | { op: "unarchive_record"; recordId: string }
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
  if (!body || typeof body !== "object" || !("op" in body) || !body.recordId) {
    return NextResponse.json({ error: "Missing op or recordId" }, { status: 400 });
  }

  const db = getServiceClient();

  const { data: outreach } = await db
    .from("student_outreach")
    .select("id, campus_id, kind, organization_name, status, research_data")
    .eq("id", body.recordId)
    .maybeSingle();

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
