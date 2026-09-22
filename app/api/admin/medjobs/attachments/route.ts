import { NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * Collateral on a MedJobs record.
 *
 * Screenshots of a reply, a brochure they attached, a deck a career centre
 * handed over. Uploaded from the record or from the task it arrived with;
 * a file uploaded from a task carries both, so the record shows everything
 * and the task in the history shows what came with it.
 *
 * The bucket is private and nothing is ever served from it directly. A read
 * mints a signed URL that expires, because these are screenshots of other
 * people's email and carry names, addresses and phone numbers that have no
 * business sitting behind a guessable path.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "medjobs-collateral";
const MAX_BYTES = 25 * 1024 * 1024;
/** Kept in step with the bucket's own allowed_mime_types in migration 247. */
const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
]);
/** Long enough to open and read, short enough not to be a shareable link. */
const SIGNED_FOR = 60 * 60;

export type RecordKind = "outreach" | "student" | "jobboard";

const KINDS = new Set<RecordKind>(["outreach", "student", "jobboard"]);

export interface AttachmentRow {
  id: string;
  taskId: string | null;
  filename: string;
  mime: string;
  sizeBytes: number;
  caption: string | null;
  uploadedAt: string;
  /** Signed, and good for an hour. */
  url: string | null;
}

/**
 * A storage key that cannot collide and cannot escape its folder.
 *
 * The original filename is kept on the row, not in the path: a name typed by
 * somebody else is not something to build a path out of.
 */
const keyFor = (recordId: string, filename: string) => {
  const dot = filename.lastIndexOf(".");
  const ext = dot > 0 ? filename.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, "") : "";
  return `${recordId}/${crypto.randomUUID()}${ext ? `.${ext}` : ""}`;
};

/**
 * Whether the record exists, and its campus where the server can know it.
 *
 * A student's campus is not on their profile — the board derives it by
 * matching the application's metadata against campus slugs — so rather than
 * duplicate that here or take it on trust from the uploader, a student's
 * file is stored without one. campus_id is a cleanup convenience; nothing
 * reads it for a student.
 */
async function resolveRecord(
  db: ReturnType<typeof getServiceClient>,
  kind: RecordKind,
  id: string,
): Promise<{ found: boolean; campusId: string | null }> {
  if (kind === "outreach") {
    const { data } = await db
      .from("student_outreach")
      .select("campus_id")
      .eq("id", id)
      .maybeSingle();
    return { found: Boolean(data), campusId: data?.campus_id ?? null };
  }
  if (kind === "jobboard") {
    const { data } = await db
      .from("campus_channels")
      .select("campus_id")
      .eq("id", id)
      .maybeSingle();
    return { found: Boolean(data), campusId: data?.campus_id ?? null };
  }
  const { data } = await db.from("business_profiles").select("id").eq("id", id).maybeSingle();
  return { found: Boolean(data), campusId: null };
}

async function guard() {
  const user = await getAuthUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const admin = await getAdminUser(user.id);
  if (!admin) return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { user, db: getServiceClient() };
}

export async function GET(req: Request) {
  const g = await guard();
  if (g.error) return g.error;
  const { db } = g;

  const params = new URL(req.url).searchParams;
  const recordId = params.get("recordId");
  const kind = params.get("recordKind") as RecordKind | null;
  if (!recordId || !kind || !KINDS.has(kind)) {
    return NextResponse.json({ error: "Missing the record" }, { status: 400 });
  }

  const { data, error } = await db
    .from("medjobs_attachments")
    .select("*")
    .eq("record_kind", kind)
    .eq("record_id", recordId)
    .order("uploaded_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // One call for every file rather than one per file. A record with a dozen
  // screenshots would otherwise make a dozen round trips on every open.
  const paths = (data ?? []).map((r) => r.path as string);
  const signed = new Map<string, string>();
  if (paths.length > 0) {
    const { data: urls } = await db.storage.from(BUCKET).createSignedUrls(paths, SIGNED_FOR);
    for (const u of urls ?? []) {
      if (u.signedUrl && u.path) signed.set(u.path, u.signedUrl);
    }
  }

  const rows: AttachmentRow[] = (data ?? []).map((r) => ({
    id: r.id,
    taskId: r.task_id,
    filename: r.filename,
    mime: r.mime,
    sizeBytes: r.size_bytes,
    caption: r.caption,
    uploadedAt: r.uploaded_at,
    url: signed.get(r.path) ?? null,
  }));
  return NextResponse.json({ rows });
}

export async function POST(req: Request) {
  const g = await guard();
  if (g.error) return g.error;
  const { db, user } = g;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected a file upload" }, { status: 400 });
  }

  const file = form.get("file");
  const recordId = String(form.get("recordId") ?? "").trim();
  const kind = String(form.get("recordKind") ?? "").trim() as RecordKind;
  const taskIdRaw = String(form.get("taskId") ?? "").trim();
  const caption = String(form.get("caption") ?? "").trim().slice(0, 500) || null;

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file" }, { status: 400 });
  }
  if (!recordId || !KINDS.has(kind)) {
    return NextResponse.json({ error: "Missing the record" }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json(
      { error: "Images, PDFs, Word documents and slide decks only" },
      { status: 400 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "That file is over 25MB" }, { status: 400 });
  }

  // The record decides the campus. Taking it from the request would let a
  // file be filed against a campus its record does not belong to.
  //
  // Which table to ask depends on the kind, because only two of the four
  // sections are student_outreach rows. A job board is a campus_channels row
  // and carries its campus directly; a student has no campus of their own —
  // they belong to the university their application named, which the board
  // knows and the profile does not, so that one is taken on trust from the
  // task board's own view of the record.
  const { found, campusId } = await resolveRecord(db, kind, recordId);
  if (!found) return NextResponse.json({ error: "No such record" }, { status: 404 });

  // A synthetic task id — the sweeps have one — is not a row, so it is not
  // stored. The file still lands on the record.
  const taskId = /^[0-9a-f-]{36}$/i.test(taskIdRaw) ? taskIdRaw : null;

  const path = keyFor(recordId, file.name);
  const { error: uploadError } = await db.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: row, error } = await db
    .from("medjobs_attachments")
    .insert({
      record_kind: kind,
      record_id: recordId,
      // Kept in step with record_id by a CHECK, and kept so deleting a
      // provider still takes its files with it.
      outreach_id: kind === "outreach" ? recordId : null,
      task_id: taskId,
      campus_id: campusId,
      path,
      filename: file.name.slice(0, 260),
      mime: file.type,
      size_bytes: file.size,
      caption,
      uploaded_by: user.id,
    })
    .select("id")
    .single();
  if (error) {
    // The row is what makes the object findable. Without it the upload is
    // litter in a bucket nobody can see, so it goes back out.
    await db.storage.from(BUCKET).remove([path]);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: row.id });
}

export async function DELETE(req: Request) {
  const g = await guard();
  if (g.error) return g.error;
  const { db } = g;

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { data: row, error } = await db
    .from("medjobs_attachments")
    .select("id, path")
    .eq("id", id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!row) return NextResponse.json({ error: "No such file" }, { status: 404 });

  // Object first. A row with no object is a broken link somebody can delete;
  // an object with no row is invisible and stays forever.
  const { error: removeError } = await db.storage.from(BUCKET).remove([row.path]);
  if (removeError) return NextResponse.json({ error: removeError.message }, { status: 500 });

  const { error: rowError } = await db.from("medjobs_attachments").delete().eq("id", id);
  if (rowError) return NextResponse.json({ error: rowError.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
