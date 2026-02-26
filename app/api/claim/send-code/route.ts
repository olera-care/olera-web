import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***@***.com";
  const maskedLocal =
    local.length <= 2 ? "*".repeat(local.length) : local[0] + "***" + local[local.length - 1];
  return `${maskedLocal}@${domain}`;
}

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * POST /api/claim/send-code
 *
 * Sends a 6-digit verification code to the provider's email on file.
 *
 * Request body: { providerId: string }
 * Returns: { emailHint: string } or error
 */
export async function POST(request: Request) {
  try {
    // Authenticate
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { providerId } = body;

    if (!providerId) {
      return NextResponse.json({ error: "Provider ID is required." }, { status: 400 });
    }

    const db = getAdminClient();
    if (!db) {
      return NextResponse.json({ error: "Server configuration error." }, { status: 500 });
    }

    // Look up provider email
    const { data: provider, error: providerErr } = await db
      .from("olera-providers")
      .select("email, provider_name")
      .eq("provider_id", providerId)
      .single();

    if (providerErr || !provider) {
      return NextResponse.json({ error: "Provider not found." }, { status: 404 });
    }

    if (!provider.email) {
      return NextResponse.json(
        { error: "No email on file for this provider. Please use the 'No access to email' option." },
        { status: 422 }
      );
    }

    // Rate limit: max 3 codes per provider+user per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await db
      .from("claim_verification_codes")
      .select("id", { count: "exact", head: true })
      .eq("provider_id", providerId)
      .eq("user_id", user.id)
      .gte("created_at", oneHourAgo);

    if ((count ?? 0) >= 3) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again in an hour." },
        { status: 429 }
      );
    }

    // Generate code and store
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min

    const { error: insertErr } = await db.from("claim_verification_codes").insert({
      provider_id: providerId,
      user_id: user.id,
      code,
      expires_at: expiresAt,
    });

    if (insertErr) {
      console.error("Insert verification code error:", insertErr);
      return NextResponse.json({ error: "Failed to generate code." }, { status: 500 });
    }

    // Send email via Resend
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return NextResponse.json({ error: "Email service not configured." }, { status: 500 });
    }

    const resend = new Resend(resendApiKey);
    const { error: emailErr } = await resend.emails.send({
      from: "Olera <noreply@olera.care>",
      to: provider.email,
      subject: "Your Olera verification code",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
          <h1 style="font-size: 24px; font-weight: 700; color: #111827; margin-bottom: 8px;">Verify your organization</h1>
          <p style="font-size: 16px; color: #6b7280; margin-bottom: 32px;">
            Someone is trying to claim the page for <strong>${provider.provider_name}</strong> on Olera.
            Use this code to complete verification:
          </p>
          <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 32px;">
            <span style="font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #111827;">${code}</span>
          </div>
          <p style="font-size: 14px; color: #9ca3af;">
            This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.
          </p>
        </div>
      `,
    });

    if (emailErr) {
      console.error("Resend email error:", emailErr);
      return NextResponse.json({ error: "Failed to send email." }, { status: 500 });
    }

    return NextResponse.json({ emailHint: maskEmail(provider.email) });
  } catch (err) {
    console.error("Send code error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
