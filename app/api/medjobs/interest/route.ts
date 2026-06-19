/**
 * POST /api/medjobs/interest — the on-platform echo of the cold email's
 * "reply 'interested and eligible'".
 *
 * Fired (fire-and-forget) when an eligible provider clicks "Grab a time with
 * me" on the Dr. DuBose note. Sends a best-effort Slack ping so the team knows
 * to follow up on employer requirements + onboarding. Never blocks the user —
 * always returns ok; the booking link opens regardless.
 *
 * Auth: signed-in provider. No DB writes (the eligibility flag already records
 * the qualifying state); this is a notification only.
 */

import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { sendSlackAlert } from "@/lib/slack";

export async function POST(request: Request) {
  try {
    const supabaseUser = await createServerClient();
    const {
      data: { user },
    } = await supabaseUser.auth.getUser();
    if (!user) return NextResponse.json({ ok: false }, { status: 200 });

    let body: { source?: string; campus?: string | null } = {};
    try {
      body = (await request.json()) as { source?: string; campus?: string | null };
    } catch {
      /* empty body tolerated */
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    let orgName = "A provider";
    if (supabaseUrl && serviceKey) {
      const supabase = createServiceClient(supabaseUrl, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const { data: account } = await supabase
        .from("accounts")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (account) {
        const { data: bp } = await supabase
          .from("business_profiles")
          .select("display_name")
          .eq("account_id", (account as { id: string }).id)
          .in("type", ["organization", "caregiver"])
          .limit(1)
          .maybeSingle();
        if (bp?.display_name) orgName = bp.display_name as string;
      }
    }

    const campus = body.campus ? ` · ${body.campus}` : "";
    await sendSlackAlert(
      `🎓 MedJobs: *${orgName}* is interested + eligible — clicked "Grab a time with me"${campus} (${user.email ?? "no email"})`,
    );

    return NextResponse.json({ ok: true });
  } catch {
    // Best-effort — never fail the user's click.
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
