/**
 * GET  /api/admin/student-outreach/campuses     — list all
 * POST /api/admin/student-outreach/campuses     — create
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await getAdminUser(user.id);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const db = getServiceClient();
  const { data, error } = await db
    .from("student_outreach_campuses")
    .select("*")
    .order("name", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ campuses: data ?? [] });
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await getAdminUser(user.id);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const slug = (body.slug as string)?.trim().toLowerCase();
  const name = (body.name as string)?.trim();
  if (!slug || !name) {
    return NextResponse.json({ error: "slug and name required" }, { status: 400 });
  }
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json(
      { error: "slug must be lowercase alphanumeric with dashes" },
      { status: 400 },
    );
  }

  const db = getServiceClient();
  const { data, error } = await db
    .from("student_outreach_campuses")
    .insert({
      slug,
      name,
      city: (body.city as string)?.trim() || null,
      state: (body.state as string)?.trim().toUpperCase() || null,
      notes: (body.notes as string)?.trim() || null,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    const msg = error.code === "23505" ? "Campus slug already exists" : error.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  return NextResponse.json({ campus: data });
}
