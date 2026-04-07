import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { validateClaimToken } from "@/lib/claim-tokens";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * POST /api/medjobs/validate-interview-token
 *
 * Validates a magic link token and returns the interview data if valid.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, interviewId } = body;

    if (!token || !interviewId) {
      return NextResponse.json(
        { valid: false, error: "Token and interviewId are required" },
        { status: 400 }
      );
    }

    // Validate the token
    const tokenResult = validateClaimToken(token);

    if (!tokenResult.valid) {
      return NextResponse.json(
        { valid: false, error: tokenResult.error },
        { status: 400 }
      );
    }

    const { providerId, email } = tokenResult;

    const admin = getAdminClient();

    // Fetch the interview with student and provider details
    const { data: interview, error: interviewError } = await admin
      .from("interviews")
      .select(`
        id,
        type,
        proposed_time,
        notes,
        status,
        provider:business_profiles!interviews_provider_profile_id_fkey(id, display_name, email, account_id),
        student:business_profiles!interviews_student_profile_id_fkey(id, display_name, image_url, slug)
      `)
      .eq("id", interviewId)
      .single();

    if (interviewError || !interview) {
      return NextResponse.json(
        { valid: false, error: "Interview not found" },
        { status: 404 }
      );
    }

    // Verify the token's profileId matches the interview's provider
    // Supabase joins return arrays, but with .single() we get one interview with one provider
    const providerData = interview.provider as unknown as {
      id: string;
      display_name: string;
      email: string;
      account_id: string | null;
    } | null;

    if (!providerData) {
      return NextResponse.json(
        { valid: false, error: "Provider not found" },
        { status: 404 }
      );
    }

    const provider = providerData;

    if (provider.id !== providerId) {
      return NextResponse.json(
        { valid: false, error: "Token does not match this interview" },
        { status: 403 }
      );
    }

    // Verify the email matches
    if (provider.email?.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json(
        { valid: false, error: "Email mismatch" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      valid: true,
      email,
      profileId: provider.id,
      interview: {
        id: interview.id,
        type: interview.type,
        proposed_time: interview.proposed_time,
        notes: interview.notes,
        status: interview.status,
        student: interview.student,
        provider: {
          id: provider.id,
          display_name: provider.display_name,
          email: provider.email,
          account_id: provider.account_id,
        },
      },
    });
  } catch (err) {
    console.error("[medjobs/validate-interview-token] error:", err);
    return NextResponse.json({ valid: false, error: "Internal error" }, { status: 500 });
  }
}
