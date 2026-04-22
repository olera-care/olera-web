import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * POST /api/dev/demo-signin
 *
 * Creates a real Supabase session for demo purposes.
 * This bypasses the OTP email check while still providing a valid auth session.
 */
export async function POST(request: Request) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const db = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    // Check if user exists
    const { data: existingUsers } = await db.auth.admin.listUsers();
    let user = existingUsers?.users?.find((u) => u.email === email);

    // Create user if doesn't exist
    if (!user) {
      const { data: newUser, error: createError } = await db.auth.admin.createUser({
        email,
        email_confirm: true, // Skip email confirmation
      });

      if (createError) {
        return NextResponse.json({ error: "Failed to create user: " + createError.message }, { status: 500 });
      }
      user = newUser.user;
    }

    if (!user) {
      return NextResponse.json({ error: "Failed to get user" }, { status: 500 });
    }

    // Generate a magic link that we can use to create a session
    const { data: linkData, error: linkError } = await db.auth.admin.generateLink({
      type: "magiclink",
      email,
    });

    if (linkError || !linkData) {
      return NextResponse.json({ error: "Failed to generate session: " + linkError?.message }, { status: 500 });
    }

    // Return the token hash for the frontend to verify
    const tokenHash = linkData.properties?.hashed_token;

    return NextResponse.json({
      success: true,
      tokenHash,
      email,
    });
  } catch (err) {
    console.error("Demo signin error:", err);
    return NextResponse.json(
      { error: "Internal server error: " + (err instanceof Error ? err.message : String(err)) },
      { status: 500 }
    );
  }
}
