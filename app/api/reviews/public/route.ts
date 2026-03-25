import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";
import { sendEmail } from "@/lib/email";
import { newReviewEmail } from "@/lib/email-templates";
import { sendLoopsEvent } from "@/lib/loops";

/**
 * POST /api/reviews/public
 *
 * Submit a review without authentication.
 * Used by the public review page (/review/[slug]).
 *
 * Body: {
 *   provider_id: string (the business_profile.id or slug)
 *   rating: number (1-5)
 *   relationship: string
 *   title?: string
 *   comment: string
 *   reviewer_name?: string (defaults to "Anonymous")
 *   ref_source?: string (tracking: "email", "qr", "direct", etc.)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      provider_id,
      rating,
      relationship,
      title,
      comment,
      reviewer_name,
      ref_source,
    } = body;

    // Validate required fields
    if (!provider_id) {
      return NextResponse.json({ error: "provider_id is required" }, { status: 400 });
    }
    if (!rating || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return NextResponse.json({ error: "Rating must be an integer between 1 and 5" }, { status: 400 });
    }
    if (!comment?.trim()) {
      return NextResponse.json({ error: "Review text is required" }, { status: 400 });
    }
    if (!relationship) {
      return NextResponse.json({ error: "Relationship is required" }, { status: 400 });
    }

    const db = getServiceClient();

    // Look up the provider (could be slug or id)
    let providerId = provider_id;
    let providerSlug = provider_id;

    // Check if provider_id is a UUID (id) or a slug
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(provider_id);

    if (isUuid) {
      // It's an ID, get the slug
      const { data: profile } = await db
        .from("business_profiles")
        .select("slug")
        .eq("id", provider_id)
        .single();

      if (profile?.slug) {
        providerSlug = profile.slug;
      }
    } else {
      // It's a slug, get the ID
      const { data: profile } = await db
        .from("business_profiles")
        .select("id")
        .eq("slug", provider_id)
        .single();

      if (profile?.id) {
        providerId = profile.id;
      }
    }

    // Format reviewer name (use "Anonymous" if not provided)
    const rawName = reviewer_name?.trim() || "Anonymous";
    const parts = rawName.split(/\s+/);
    const formattedName = parts.length >= 2
      ? `${parts[0]} ${parts[parts.length - 1][0]}.`
      : parts[0];

    // Insert the review
    const { data: newReview, error } = await db
      .from("reviews")
      .insert({
        provider_id: providerSlug, // reviews table uses slug as provider_id
        account_id: null, // No account for public reviews
        reviewer_name: formattedName,
        rating,
        title: title?.trim() || null,
        comment: comment.trim(),
        relationship,
        status: "published",
        metadata: ref_source ? { ref_source } : null,
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to create public review:", error);
      return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
    }

    // Send notification email to provider (fire-and-forget)
    try {
      const { data: provider } = await db
        .from("business_profiles")
        .select("id, display_name, slug, account_id")
        .eq("slug", providerSlug)
        .single();

      if (provider?.account_id) {
        const { data: providerAccount } = await db
          .from("accounts")
          .select("user_id")
          .eq("id", provider.account_id)
          .single();

        if (providerAccount?.user_id) {
          const { data: authUser } = await db.auth.admin.getUserById(providerAccount.user_id);
          const providerEmail = authUser?.user?.email;

          if (providerEmail) {
            const viewUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://olera.care"}/provider/reviews`;
            await sendEmail({
              to: providerEmail,
              subject: `${formattedName.split(" ")[0]} left a review for ${provider.display_name || "your listing"}`,
              html: newReviewEmail({
                providerName: provider.display_name || "Your organization",
                reviewerName: formattedName,
                rating,
                comment: comment.trim().slice(0, 200) + (comment.trim().length > 200 ? "..." : ""),
                viewUrl,
                providerSlug: provider.slug || undefined,
              }),
              emailType: "new_review",
              recipientType: "provider",
              providerId: provider.id,
            });
            await sendLoopsEvent({
              email: providerEmail,
              eventName: "review_received",
              audience: "provider",
              eventProperties: {
                providerName: provider.display_name || "",
                rating,
                reviewerName: formattedName,
                refSource: ref_source || "direct",
              },
            });
          }
        }
      }
    } catch (notifyErr) {
      console.error("Failed to send review notification:", notifyErr);
    }

    return NextResponse.json({ review: newReview }, { status: 201 });
  } catch (err) {
    console.error("Public reviews POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
