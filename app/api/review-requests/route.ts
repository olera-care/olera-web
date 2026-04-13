import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getServiceClient } from "@/lib/admin";
import { sendEmail } from "@/lib/email";
import { reviewRequestEmail } from "@/lib/email-templates";

interface ReviewRequestClient {
  name: string;
  email?: string;
  phone?: string;
}

interface EmailLogRow {
  id: string;
  recipient: string;
  created_at: string;
  status: string;
  metadata: {
    client_name?: string;
    delivery_method?: string;
  } | null;
}

/**
 * GET /api/review-requests
 *
 * Fetch sent review request emails for the authenticated provider.
 * Returns list of sent requests with recipient info, method, date, and open status.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const db = getServiceClient();

    // Get the user's provider profile
    const { data: account } = await db
      .from("accounts")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!account) {
      return NextResponse.json({ error: "No account found" }, { status: 400 });
    }

    const { data: profile } = await db
      .from("business_profiles")
      .select("id")
      .eq("account_id", account.id)
      .in("type", ["organization", "caregiver"])
      .single();

    if (!profile) {
      return NextResponse.json({ error: "No provider profile found" }, { status: 400 });
    }

    // Fetch review request emails for this provider
    const { data: emails, error: emailsError } = await db
      .from("email_log")
      .select("id, recipient, created_at, status, metadata")
      .eq("provider_id", profile.id)
      .eq("email_type", "review_request")
      .order("created_at", { ascending: false })
      .limit(100);

    if (emailsError) {
      console.error("Failed to fetch review request emails:", emailsError);
      return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
    }

    // Transform the data for the frontend
    const requests = ((emails as EmailLogRow[]) || []).map((email) => ({
      id: email.id,
      clientName: email.metadata?.client_name || email.recipient.split("@")[0],
      recipient: email.recipient,
      deliveryMethod: email.metadata?.delivery_method || "email",
      sentAt: email.created_at,
      status: email.status,
    }));

    return NextResponse.json({ requests });
  } catch (err) {
    console.error("Review requests GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/review-requests
 *
 * Send review request emails to clients. Requires authentication.
 *
 * Body: {
 *   clients: Array<{ name: string, email?: string, phone?: string }>
 *   message: string
 *   delivery_method: "email" | "sms" | "both"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { clients, message, delivery_method } = body as {
      clients: ReviewRequestClient[];
      message: string;
      delivery_method: "email" | "sms" | "both";
    };

    // Validate inputs
    if (!clients || !Array.isArray(clients) || clients.length === 0) {
      return NextResponse.json({ error: "At least one client is required" }, { status: 400 });
    }

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    if (clients.length > 50) {
      return NextResponse.json({ error: "Maximum 50 clients per request" }, { status: 400 });
    }

    // Get the user's provider profile
    const db = getServiceClient();

    const { data: account } = await db
      .from("accounts")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!account) {
      return NextResponse.json({ error: "No account found" }, { status: 400 });
    }

    const { data: profile } = await db
      .from("business_profiles")
      .select("id, display_name, slug")
      .eq("account_id", account.id)
      .in("type", ["organization", "caregiver"])
      .single();

    if (!profile?.slug) {
      return NextResponse.json({ error: "No provider profile found" }, { status: 400 });
    }

    // Use request origin for correct preview/staging URLs, fallback to env variable
    const requestHost = request.headers.get("host");
    const protocol = requestHost?.includes("localhost") ? "http" : "https";
    const siteUrl = requestHost
      ? `${protocol}://${requestHost}`
      : process.env.NEXT_PUBLIC_SITE_URL || "https://olera.care";
    const results: { name: string; email?: string; status: "sent" | "skipped" | "failed"; error?: string }[] = [];

    // Process each client
    for (const client of clients) {
      // Skip clients without email if sending email
      if (delivery_method !== "sms" && client.email) {
        const reviewUrl = `${siteUrl}/review/${profile.slug}?ref=email&name=${encodeURIComponent(client.name)}`;

        try {
          await sendEmail({
            to: client.email,
            subject: `${profile.display_name} would love your feedback`,
            html: reviewRequestEmail({
              clientName: client.name,
              providerName: profile.display_name || "Your care provider",
              customMessage: message.trim(),
              reviewUrl,
            }),
            emailType: "review_request",
            recipientType: "family",
            providerId: profile.id,
            metadata: {
              client_name: client.name,
              delivery_method,
            },
          });

          results.push({ name: client.name, email: client.email, status: "sent" });
        } catch (emailErr) {
          console.error(`Failed to send review request to ${client.email}:`, emailErr);
          results.push({
            name: client.name,
            email: client.email,
            status: "failed",
            error: "Failed to send email",
          });
        }
      } else if (!client.email) {
        results.push({
          name: client.name,
          status: "skipped",
          error: "No email address provided",
        });
      }

      // Note: SMS sending is not implemented yet
      // When SMS is needed, integrate with Twilio or similar service
    }

    // Log the review requests for analytics
    try {
      await db.from("review_request_logs").insert({
        provider_id: profile.id,
        provider_slug: profile.slug,
        request_count: clients.length,
        sent_count: results.filter((r) => r.status === "sent").length,
        delivery_method,
        created_by: user.id,
      });
    } catch (logErr) {
      // Non-blocking — don't fail the request if logging fails
      console.error("Failed to log review requests:", logErr);
    }

    const sentCount = results.filter((r) => r.status === "sent").length;

    return NextResponse.json({
      success: true,
      sent: sentCount,
      total: clients.length,
      results,
    });
  } catch (err) {
    console.error("Review requests POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
