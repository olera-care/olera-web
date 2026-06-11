/**
 * Shared token-auth for Recruitment Partner Portal write endpoints (Chunk
 * 3.3-3.5). The signed welcome token is the credential (partners have no admin
 * session); endpoints verify it and write via the service role — the same
 * narrow G4 exception the webhooks use. Keeps every portal endpoint consistent.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { verifyWelcomeToken } from "@/lib/medjobs/welcome-token";

export type PartnerAuth =
  | { ok: true; db: SupabaseClient; outreachId: string; email: string }
  | { ok: false; status: number; error: string };

const STAKEHOLDER_KINDS = ["advisor", "student_org", "dept_head", "professor"];

export async function authPartnerToken(token: unknown): Promise<PartnerAuth> {
  const secret = process.env.MEDJOBS_MAGIC_LINK_SECRET;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret || !supabaseUrl || !serviceKey) {
    return { ok: false, status: 500, error: "Server not configured" };
  }
  if (typeof token !== "string" || !token) {
    return { ok: false, status: 400, error: "Missing token" };
  }
  const verified = verifyWelcomeToken(token, secret);
  if (!verified.ok) {
    return { ok: false, status: 401, error: `Link ${verified.reason}` };
  }

  const db = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: row } = await db
    .from("student_outreach")
    .select("id, kind")
    .eq("id", verified.payload.outreach_id)
    .maybeSingle();
  if (!row || !STAKEHOLDER_KINDS.includes((row as { kind: string }).kind)) {
    return { ok: false, status: 404, error: "Not a partner" };
  }
  return { ok: true, db, outreachId: verified.payload.outreach_id, email: verified.payload.email };
}
