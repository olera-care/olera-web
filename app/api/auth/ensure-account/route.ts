import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import type { Account } from "@/lib/types";

/**
 * Creates a Supabase admin client with service role key.
 * This bypasses RLS and should only be used server-side.
 * Returns null if service role key is not configured.
 */
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.warn("SUPABASE_SERVICE_ROLE_KEY not configured - falling back to authenticated client");
    return null;
  }
  return createClient(url, serviceKey);
}

/**
 * POST /api/auth/ensure-account
 *
 * Ensures the authenticated user has an account row in the database.
 * Creates one if it doesn't exist. This handles the edge case where
 * the database trigger didn't fire during auth.
 *
 * Request body (optional):
 * - display_name: string - Name to use if creating a new account
 *
 * Returns:
 * - 200: { account: Account } - The account (existing or newly created)
 * - 401: User not authenticated
 * - 500: Server error
 */
export async function POST(request: Request) {
  try {
    // Get the authenticated user from cookies
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Parse optional body
    let displayName = "";
    try {
      const body = await request.json();
      displayName = body.display_name || "";
    } catch {
      // No body or invalid JSON - that's fine
    }

    // Try admin client first (bypasses RLS), fall back to authenticated client
    const adminClient = getAdminClient();
    const dbClient = adminClient || supabase;

    // Check if account already exists
    const { data: existingAccount, error: selectError } = await dbClient
      .from("accounts")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (existingAccount) {
      return NextResponse.json({ account: existingAccount as Account });
    }

    // Account doesn't exist - create it
    // Note: selectError will be PGRST116 (no rows) if account doesn't exist
    if (selectError && selectError.code !== "PGRST116") {
      console.error("Error checking for account:", selectError.message, selectError.code);
      // Don't fail - try to create the account anyway
    }

    // Create the account
    const { data: newAccount, error: insertError } = await dbClient
      .from("accounts")
      .insert({
        user_id: user.id,
        display_name: displayName || user.email?.split("@")[0] || "",
        onboarding_completed: false,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating account:", insertError.message, insertError.code);

      // Handle race condition - another request might have created it
      if (insertError.code === "23505") { // unique_violation
        const { data: raceAccount } = await dbClient
          .from("accounts")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (raceAccount) {
          return NextResponse.json({ account: raceAccount as Account });
        }
      }

      // If insert failed due to RLS, provide a more helpful error
      if (insertError.code === "42501") { // insufficient_privilege
        return NextResponse.json(
          { error: "Database permissions issue. Please contact support." },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { error: `Failed to create account: ${insertError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ account: newAccount as Account });
  } catch (err) {
    console.error("Ensure account error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
