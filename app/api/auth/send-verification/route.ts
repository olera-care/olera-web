import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";
import { verificationCodeEmail } from "@/lib/email-templates";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * POST /api/auth/send-verification
 *
 * Sends a 6-digit verification code to any email address.
 * Used by provider onboarding to verify email before account creation.
 * No authentication required — tracked by session UUID.
 *
 * Request body: { email: string, sessionId: string }
 * Returns: { sent: true } or error
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, sessionId } = body;

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
    }

    if (!sessionId || !UUID_RE.test(sessionId)) {
      return NextResponse.json({ error: "Valid session ID is required." }, { status: 400 });
    }

    const db = getAdminClient();
    if (!db) {
      return NextResponse.json({ error: "Server configuration error." }, { status: 500 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Rate limiting: max 5 codes per 10 minutes per session
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { count } = await db
      .from("claim_verification_codes")
      .select("id", { count: "exact", head: true })
      .eq("claim_session", sessionId)
      .gte("created_at", tenMinAgo);

    if ((count ?? 0) >= 5) {
      return NextResponse.json({ error: "Too many attempts. Please wait a few minutes." }, { status: 429 });
    }

    const code = generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Store the code (reuse claim_verification_codes table)
    const { error: insertError } = await db
      .from("claim_verification_codes")
      .insert({
        provider_id: "00000000-0000-0000-0000-000000000000", // placeholder — not tied to a provider
        claim_session: sessionId,
        code,
        expires_at: expiresAt,
        attempts: 0,
      });

    if (insertError) {
      console.error("[send-verification] insert error:", insertError);
      return NextResponse.json({ error: "Failed to generate code." }, { status: 500 });
    }

    // Send the code via email
    try {
      await sendEmail({
        to: normalizedEmail,
        subject: "Your Olera verification code",
        html: verificationCodeEmail("your account", code),
        emailType: "verification_code",
      });
    } catch (emailErr) {
      console.error("[send-verification] email error:", emailErr);
      return NextResponse.json({ error: "Failed to send verification email." }, { status: 500 });
    }

    return NextResponse.json({ sent: true });
  } catch (err) {
    console.error("[send-verification] unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
