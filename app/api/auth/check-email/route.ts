import { NextResponse } from "next/server";

/**
 * POST /api/auth/check-email
 *
 * Checks whether an email address already exists in auth.users.
 * Used by the unified auth modal to detect new vs returning users
 * after the email-first entry screen.
 *
 * Uses the GoTrue admin REST API with the `filter` parameter for a
 * fast server-side lookup instead of listing all users.
 *
 * Request body: { email: string }
 * Response:     { exists: boolean }
 */
export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
      // Without admin access, we can't check — default to sign-up flow
      return NextResponse.json({ exists: false });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Direct REST call to GoTrue admin endpoint with filter parameter.
    // This does a server-side search instead of loading all users.
    const res = await fetch(
      `${url}/auth/v1/admin/users?filter=${encodeURIComponent(normalizedEmail)}&page=1&per_page=1`,
      {
        headers: {
          Authorization: `Bearer ${serviceKey}`,
          apikey: serviceKey,
        },
      }
    );

    if (!res.ok) {
      return NextResponse.json({ exists: false });
    }

    const data = await res.json();
    // Filter is a LIKE match — verify exact email match
    const exists = (data.users ?? []).some(
      (u: { email?: string }) => u.email?.toLowerCase() === normalizedEmail
    );

    return NextResponse.json({ exists });
  } catch {
    return NextResponse.json({ exists: false });
  }
}
