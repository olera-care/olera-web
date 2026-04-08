import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

function getDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

async function requireAuth(): Promise<{ user: { id: string; email?: string } } | null> {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user ? { user } : null;
  } catch {
    return null;
  }
}

/**
 * GET /api/admin/draft-reviews?state=MI
 * Returns all reviews for a state's programs, latest first
 */
export async function GET(request: Request) {
  const auth = await requireAuth();
  if (!auth) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const stateId = searchParams.get("state");

  const db = getDb();
  if (!db) return NextResponse.json({ error: "DB not configured" }, { status: 500 });

  const query = db
    .from("draft_reviews")
    .select("*")
    .order("created_at", { ascending: false });

  if (stateId) {
    query.eq("state_id", stateId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ reviews: data });
}

/**
 * POST /api/admin/draft-reviews
 * Add a review/status change for a program draft
 */
export async function POST(request: Request) {
  const auth = await requireAuth();
  if (!auth) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const db = getDb();
  if (!db) return NextResponse.json({ error: "DB not configured" }, { status: 500 });

  const body = await request.json();
  const { programId, stateId, status, comment, reviewedBy } = body as {
    programId: string;
    stateId: string;
    status: string;
    comment?: string;
    reviewedBy: string;
  };

  if (!programId || !stateId || !status || !reviewedBy) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { data, error } = await db.from("draft_reviews").insert({
    program_id: programId,
    state_id: stateId,
    status,
    comment: comment || null,
    reviewed_by: reviewedBy,
  }).select().single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ review: data });
}
