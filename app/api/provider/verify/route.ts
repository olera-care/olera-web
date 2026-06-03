import { NextRequest, NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Anthropic from "@anthropic-ai/sdk";
import { scoreClaimTrust, extractDomainFromWebsite } from "@/lib/claim-trust";
import { sendSlackAlert, slackVerificationReview } from "@/lib/slack";
import { sendEmail } from "@/lib/email";
import { verificationApprovedEmail, verificationMethodFailedEmail } from "@/lib/email-templates";
import { deliverPendingConnections } from "@/lib/notifications/deliver-pending-connections";
import { publishPendingQAAnswers } from "@/lib/notifications/publish-pending-qa-answers";
import { publishPendingInterviews } from "@/lib/notifications/publish-pending-interviews";

// Storage bucket for verification documents/screenshots
const VERIFICATION_BUCKET = "verification-docs";

// ============================================================
// Types
// ============================================================

type VerificationMethod = "email" | "linkedin" | "website" | "document";

interface VerifyRequest {
  profileId: string;
  method: VerificationMethod;
  value: string;
  /** For document uploads, the base64-encoded file */
  documentData?: string;
  /** Document MIME type */
  documentType?: string;
  /** Claimer's name (for verification context) */
  claimerName?: string;
  /** For LinkedIn verification with screenshots */
  linkedinScreenshots?: {
    headerData: string;
    headerType: string;
    experienceData: string;
    experienceType: string;
  };
  /** ISO timestamp when T&C was accepted (for compliance audit trail) */
  termsAcceptedAt?: string;
}

interface VerifyResponse {
  success: boolean;
  verified: boolean;
  reason: string;
  /** If not verified, optional suggestions */
  suggestion?: string;
  /** URLs of uploaded screenshots (for admin review) */
  screenshotUrls?: {
    header?: string;
    experience?: string;
  };
  /** URL of uploaded document (for admin review) */
  documentUrl?: string;
}

// ============================================================
// Supabase Admin Client
// ============================================================

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

// ============================================================
// Claude Client
// ============================================================

let anthropicClient: Anthropic | null = null;
function getAnthropic(): Anthropic {
  if (!anthropicClient) {
    anthropicClient = new Anthropic();
  }
  return anthropicClient;
}

// ============================================================
// Storage Helpers
// ============================================================

/**
 * Ensure the verification docs bucket exists
 * Uses try-catch to handle race conditions when multiple uploads happen in parallel
 */
async function ensureVerificationBucket(admin: SupabaseClient) {
  const { data: buckets } = await admin.storage.listBuckets();
  const bucketExists = buckets?.some((b) => b.name === VERIFICATION_BUCKET);
  if (!bucketExists) {
    try {
      await admin.storage.createBucket(VERIFICATION_BUCKET, {
        public: true,
        fileSizeLimit: 10 * 1024 * 1024, // 10MB
        allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"],
      });
    } catch (err) {
      // Ignore "already exists" errors from race conditions
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (!errorMessage.includes("already exists")) {
        throw err;
      }
    }
  }
}

/**
 * Upload a base64 image to storage and return the public URL
 */
async function uploadVerificationImage(
  admin: SupabaseClient,
  profileId: string,
  imageData: string,
  imageType: string,
  filePrefix: string
): Promise<string | null> {
  try {
    await ensureVerificationBucket(admin);

    // Convert base64 to buffer
    const buffer = Buffer.from(imageData, "base64");

    // Determine file extension from mime type
    const extMap: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/gif": "gif",
      "application/pdf": "pdf",
    };
    const ext = extMap[imageType] || "jpg";

    const filePath = `${profileId}/${filePrefix}-${Date.now()}.${ext}`;

    const { error: uploadError } = await admin.storage
      .from(VERIFICATION_BUCKET)
      .upload(filePath, buffer, {
        cacheControl: "3600",
        upsert: true,
        contentType: imageType,
      });

    if (uploadError) {
      console.error("[verify] Upload error:", uploadError);
      return null;
    }

    const { data: urlData } = admin.storage.from(VERIFICATION_BUCKET).getPublicUrl(filePath);
    return urlData.publicUrl;
  } catch (err) {
    console.error("[verify] Failed to upload verification image:", err);
    return null;
  }
}

// ============================================================
// Main Handler
// ============================================================

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as VerifyRequest;
    const { profileId, method, value, documentData, documentType, claimerName, linkedinScreenshots, termsAcceptedAt } = body;

    if (!profileId || !method || !value) {
      return NextResponse.json(
        { success: false, verified: false, reason: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify user is authenticated and owns this profile
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, verified: false, reason: "Authentication required" },
        { status: 401 }
      );
    }

    const admin = getAdminClient();
    if (!admin) {
      return NextResponse.json(
        { success: false, verified: false, reason: "Server configuration error" },
        { status: 500 }
      );
    }

    // Fetch the profile and verify ownership
    const { data: profile, error: fetchError } = await admin
      .from("business_profiles")
      .select("id, slug, display_name, website, metadata, verification_state, account_id")
      .eq("id", profileId)
      .single();

    if (fetchError || !profile) {
      return NextResponse.json(
        { success: false, verified: false, reason: "Profile not found" },
        { status: 404 }
      );
    }

    // Verify user owns this profile (check account linkage)
    const { data: account } = await admin
      .from("accounts")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!account || profile.account_id !== account.id) {
      return NextResponse.json(
        { success: false, verified: false, reason: "Not authorized to verify this profile" },
        { status: 403 }
      );
    }

    // Already verified?
    if (profile.verification_state === "verified") {
      return NextResponse.json({
        success: true,
        verified: true,
        reason: "Already verified",
      });
    }

    // Dispatch to the appropriate verification handler
    let result: VerifyResponse;
    switch (method) {
      case "email":
        result = await verifyByEmail(value, profile.display_name, extractDomainFromWebsite(profile.website));
        break;
      case "linkedin":
        result = await verifyByLinkedIn(value, profile.display_name, claimerName, linkedinScreenshots, admin, profileId);
        break;
      case "website":
        result = await verifyByWebsite(value, profile.display_name, claimerName);
        break;
      case "document":
        result = await verifyByDocument(documentData, documentType, profile.display_name, claimerName, admin, profileId);
        break;
      default:
        return NextResponse.json(
          { success: false, verified: false, reason: "Invalid verification method" },
          { status: 400 }
        );
    }

    // If verified, update the profile
    if (result.verified) {
      const currentMetadata = (profile.metadata as Record<string, unknown>) || {};

      // Build the verification attempt record (same structure as failed attempts)
      const attemptRecord: Record<string, unknown> = {
        method,
        value: method === "document" ? "[document]" : value,
        submitted_at: new Date().toISOString(),
        reason: result.reason,
        claimer_name: claimerName,
        verified: true,
      };

      // Add screenshot URLs if present (for LinkedIn verification)
      if (result.screenshotUrls) {
        attemptRecord.screenshot_urls = result.screenshotUrls;
      }

      // Add document URL if present
      if (result.documentUrl) {
        attemptRecord.document_url = result.documentUrl;
      }

      // Get existing attempts array or create new one
      const existingAttempts = (currentMetadata.verification_attempts as Record<string, unknown>[]) || [];

      const updatedMetadata = {
        ...currentMetadata,
        verification_method: method,
        verification_value: method === "document" ? "[document]" : value,
        verified_at: new Date().toISOString(),
        verification_reason: result.reason,
        // Store T&C acceptance timestamp for compliance audit trail
        ...(termsAcceptedAt && { terms_accepted_at: termsAcceptedAt }),
        // Clear any previous rejection so they appear in Verified tab
        badge_rejected: null,
        badge_rejected_at: null,
        // Also record successful attempt in the attempts array for audit trail
        verification_attempt: attemptRecord,
        verification_attempts: [...existingAttempts, attemptRecord],
      };

      const { error: updateError } = await admin
        .from("business_profiles")
        .update({
          verification_state: "verified",
          metadata: updatedMetadata,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profileId);

      if (updateError) {
        console.error("[verify] Failed to update profile:", updateError);
        return NextResponse.json(
          { success: false, verified: false, reason: "Failed to save verification" },
          { status: 500 }
        );
      }

      // Send verification success email
      const claimerEmail = currentMetadata.claimer_email as string | undefined;
      if (claimerEmail) {
        const recipientName = claimerName || (currentMetadata.verification_submission as Record<string, unknown>)?.name as string || "there";
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://olera.care";
        // Fallback: public profile URL (if magic link fails)
        let dashboardUrl = `${siteUrl}/provider/${profile.slug || profileId}`;

        // Generate magic link for auto sign-in
        // Include ?next=/provider so AuthProvider knows the destination
        try {
          const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
            type: "magiclink",
            email: claimerEmail,
            options: {
              redirectTo: `${siteUrl}/provider?next=/provider`,
            },
          });
          if (!linkError && linkData?.properties?.action_link) {
            dashboardUrl = linkData.properties.action_link;
          }
        } catch (linkErr) {
          console.error("[verify] Failed to generate magic link:", linkErr);
          // Continue with fallback URL (public profile)
        }

        try {
          await sendEmail({
            to: claimerEmail,
            subject: "You're verified!",
            html: verificationApprovedEmail({
              providerName: profile.display_name || "your organization",
              recipientName,
              dashboardUrl,
              autoApproved: true,
            }),
            emailType: "verification_approved",
            recipientType: "provider",
            providerId: profile.slug,
            metadata: { method, auto_verified: true },
          });
        } catch (emailErr) {
          console.error("[verify] Failed to send verification email:", emailErr);
        }
      }

      // Publish any pending Q&A answers and notify askers (fire-and-forget)
      publishPendingQAAnswers(
        admin,
        profileId,
        profile.display_name || "A provider",
        profile.slug
      ).catch((err) => {
        console.error("[verify] Error publishing pending Q&A answers:", err);
      });

      // Deliver all pending_verification connections with notifications (fire-and-forget)
      // These are inquiries the provider saved while unverified
      deliverPendingConnections(
        admin,
        profileId,
        profile.display_name || "A provider",
        profile.slug
      ).catch((err) => {
        console.error("[verify] Error delivering pending connections:", err);
      });

      // Publish pending interviews and notify students (fire-and-forget)
      // These are interviews the provider scheduled while unverified
      publishPendingInterviews(
        admin,
        profileId,
        profile.display_name || "A provider",
        profile.slug
      ).catch((err) => {
        console.error("[verify] Error publishing pending interviews:", err);
      });

      console.log(`[verify] Auto-verified ${profile.display_name} via ${method}: ${result.reason}`);
    } else {
      // Not auto-verified — set to pending and send to Slack for manual review
      const currentMetadata = (profile.metadata as Record<string, unknown>) || {};
      // Use claimer_email from metadata, or fall back to auth user's email
      const claimerEmail = (currentMetadata.claimer_email as string) || user.email;
      const claimerRole = (currentMetadata.verification_submission as Record<string, unknown>)?.role as string || "unknown";

      // Check if this is the first failed attempt (not already pending)
      const isFirstFailure = profile.verification_state !== "pending";

      // Build the verification attempt record
      const attemptRecord: Record<string, unknown> = {
        method,
        value: method === "document" ? "[document]" : value,
        submitted_at: new Date().toISOString(),
        reason: result.reason,
        claimer_name: claimerName,
        verified: false,
      };

      // Add screenshot URLs if present (for LinkedIn verification)
      if (result.screenshotUrls) {
        attemptRecord.screenshot_urls = result.screenshotUrls;
      }

      // Add document URL if present
      if (result.documentUrl) {
        attemptRecord.document_url = result.documentUrl;
      }

      // Get existing attempts array or create new one
      const existingAttempts = (currentMetadata.verification_attempts as Record<string, unknown>[]) || [];

      // Update profile to pending state with verification attempt details
      // Also store claimer info for future reference
      const updatedMetadata = {
        ...currentMetadata,
        // Store claimer info if not already set
        claimer_email: currentMetadata.claimer_email || claimerEmail,
        claimer_name: currentMetadata.claimer_name || claimerName,
        // Keep legacy single attempt for backwards compatibility
        verification_attempt: attemptRecord,
        // Also store in array for multiple attempt tracking
        verification_attempts: [...existingAttempts, attemptRecord],
        // Store T&C acceptance timestamp for compliance audit trail
        ...(termsAcceptedAt && { terms_accepted_at: termsAcceptedAt }),
      };

      const { error: updateError } = await admin
        .from("business_profiles")
        .update({
          verification_state: "pending",
          metadata: updatedMetadata,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profileId);

      if (updateError) {
        console.error("[verify] Failed to update profile to pending:", updateError);
      }

      // Send Slack alert on the first failure
      // Now that we fall back to auth user email, this should always have claimerEmail
      if (isFirstFailure && claimerEmail && claimerName) {
        try {
          const alert = slackVerificationReview({
            providerName: profile.display_name || "Unknown",
            providerSlug: profile.slug || profileId,
            profileId,
            claimerName,
            claimerEmail,
            claimerRole,
            linkedinUrl: method === "linkedin" ? value : undefined,
            businessWebsiteUrl: method === "website" ? value : undefined,
            manualReviewRequested: true,
            autoVerifyReason: result.reason,
          });
          await sendSlackAlert(alert.text, alert.blocks);
        } catch (slackErr) {
          console.error("[verify] Failed to send Slack alert:", slackErr);
          // Non-blocking - continue even if Slack fails
        }
      }

      // Send verification failure email on every attempt
      // This helps providers understand what went wrong and what other options they have
      if (claimerEmail) {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://olera.care";
        const attemptNumber = existingAttempts.length + 1; // Current attempt (1-indexed)

        // Generate magic link for auto sign-in (same pattern as success email)
        // Redirect to onboard page so they can try another verification method
        let verifyUrl = `${siteUrl}/provider/${profile.slug || profileId}/onboard`;
        try {
          const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
            type: "magiclink",
            email: claimerEmail,
            options: {
              redirectTo: `${siteUrl}/provider/${profile.slug || profileId}/onboard`,
            },
          });
          if (!linkError && linkData?.properties?.action_link) {
            verifyUrl = linkData.properties.action_link;
          }
        } catch (linkErr) {
          console.error("[verify] Failed to generate magic link for failure email:", linkErr);
          // Continue with fallback URL (requires manual sign-in)
        }

        try {
          await sendEmail({
            to: claimerEmail,
            subject: "Let's try another way to verify",
            html: verificationMethodFailedEmail({
              providerName: profile.display_name || "your organization",
              recipientName: claimerName || "there",
              method,
              reason: result.reason,
              attemptNumber,
              verifyUrl,
            }),
            emailType: "verification_method_failed",
            recipientType: "provider",
            providerId: profile.slug,
            metadata: { method, attempt_number: attemptNumber },
          });
        } catch (emailErr) {
          console.error("[verify] Failed to send verification failure email:", emailErr);
          // Non-blocking - continue even if email fails
        }
      }

      console.log(`[verify] Manual review needed for ${profile.display_name} via ${method}: ${result.reason}`);
    }

    // Add pendingReview flag to response for non-verified submissions
    return NextResponse.json({
      ...result,
      pendingReview: !result.verified,
    });
  } catch (error) {
    console.error("[verify] Error:", error);
    return NextResponse.json(
      { success: false, verified: false, reason: "Internal server error" },
      { status: 500 }
    );
  }
}

// ============================================================
// Email Verification
// ============================================================

async function verifyByEmail(
  email: string,
  businessName: string,
  businessDomain: string | null
): Promise<VerifyResponse> {
  // Use the existing trust scoring
  const trustResult = await scoreClaimTrust({
    email,
    providerName: businessName,
    providerDomain: businessDomain,
  });

  if (trustResult.level === "high") {
    return {
      success: true,
      verified: true,
      reason: `Email verified: ${trustResult.reason}`,
    };
  }

  // Medium or low trust — not auto-verified
  return {
    success: true,
    verified: false,
    reason: trustResult.reason,
    suggestion: trustResult.level === "low"
      ? "Try using your work email address or another verification method."
      : "Your email couldn't be automatically verified. We'll review manually.",
  };
}

// ============================================================
// LinkedIn Verification
// ============================================================

async function verifyByLinkedIn(
  linkedinUrl: string,
  businessName: string,
  claimerName?: string,
  screenshots?: {
    headerData: string;
    headerType: string;
    experienceData: string;
    experienceType: string;
  },
  admin?: SupabaseClient,
  profileId?: string
): Promise<VerifyResponse> {
  // Validate URL format
  if (!linkedinUrl.includes("linkedin.com/")) {
    return {
      success: true,
      verified: false,
      reason: "Invalid LinkedIn URL",
      suggestion: "Please provide a valid LinkedIn profile URL.",
    };
  }

  // If screenshots are provided, use Claude Vision for stronger verification
  if (screenshots?.headerData && screenshots?.experienceData) {
    return verifyLinkedInWithScreenshots(linkedinUrl, businessName, claimerName, screenshots, admin, profileId);
  }

  // Fallback to URL-only verification (weaker)
  try {
    const client = getAnthropic();
    const response = await Promise.race([
      client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 300,
        system: `You are verifying whether a LinkedIn profile URL likely belongs to someone who works at a specific business.

Return ONLY a JSON object (no prose, no markdown): {"verified":true|false,"confidence":"high"|"medium"|"low","reason":"<brief explanation>"}

Guidelines:
- If the LinkedIn URL contains the business name or a clear derivative in the profile path, that's a good sign
- If a claimer name is provided and appears in the URL, that adds confidence
- LinkedIn profile URLs typically look like: linkedin.com/in/firstname-lastname or linkedin.com/company/company-name
- We cannot actually fetch the LinkedIn page, so base your assessment on the URL structure alone
- If the URL appears legitimate and plausibly connected, give benefit of the doubt
- Err toward verified=true for reasonable URLs — we want to reduce friction`,
        messages: [
          {
            role: "user",
            content: `LinkedIn URL: ${linkedinUrl}\nBusiness name: ${businessName}${claimerName ? `\nClaimer name: ${claimerName}` : ""}`,
          },
        ],
      }),
      new Promise<Anthropic.Messages.Message>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), 8000)
      ),
    ]);

    const textBlock = response.content.find((b) => b.type === "text");
    const raw = textBlock?.type === "text" ? textBlock.text : "";

    try {
      const parsed = JSON.parse(raw.replace(/```json?|```/gi, "").trim()) as {
        verified?: boolean;
        confidence?: string;
        reason?: string;
      };

      if (parsed.verified && parsed.confidence !== "low") {
        return {
          success: true,
          verified: true,
          reason: `LinkedIn verified: ${parsed.reason || "Profile appears connected to business"}`,
        };
      }

      return {
        success: true,
        verified: false,
        reason: parsed.reason || "Could not verify LinkedIn connection",
        suggestion: "Make sure your LinkedIn profile shows you work at this business.",
      };
    } catch {
      // Couldn't parse — default to manual review
      return {
        success: true,
        verified: false,
        reason: "LinkedIn verification inconclusive",
        suggestion: "We'll review your LinkedIn profile manually.",
      };
    }
  } catch (err) {
    console.error("[verify] LinkedIn verification error:", err);
    // On error, don't block — send to manual review
    return {
      success: true,
      verified: false,
      reason: "LinkedIn verification unavailable",
      suggestion: "We'll review your LinkedIn profile manually.",
    };
  }
}

/**
 * Verify LinkedIn using profile screenshots (Claude Vision)
 */
async function verifyLinkedInWithScreenshots(
  linkedinUrl: string,
  businessName: string,
  claimerName: string | undefined,
  screenshots: {
    headerData: string;
    headerType: string;
    experienceData: string;
    experienceType: string;
  },
  admin?: SupabaseClient,
  profileId?: string
): Promise<VerifyResponse> {
  // Upload screenshots to storage first (so admins can review them later)
  let screenshotUrls: { header?: string; experience?: string } | undefined;
  if (admin && profileId) {
    const [headerUrl, experienceUrl] = await Promise.all([
      uploadVerificationImage(admin, profileId, screenshots.headerData, screenshots.headerType, "linkedin-header"),
      uploadVerificationImage(admin, profileId, screenshots.experienceData, screenshots.experienceType, "linkedin-experience"),
    ]);
    if (headerUrl || experienceUrl) {
      screenshotUrls = {};
      if (headerUrl) screenshotUrls.header = headerUrl;
      if (experienceUrl) screenshotUrls.experience = experienceUrl;
    }
  }

  try {
    const client = getAnthropic();

    // Analyze both screenshots with Claude Vision
    const response = await Promise.race([
      client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 500,
        // Short structured-JSON classification on a 20s timeout — keep it fast.
        // Sonnet 4.6 defaults to effort "high"; this is not a reasoning task.
        thinking: { type: "disabled" },
        output_config: { effort: "low" },
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `You are verifying that someone works at a specific business using their LinkedIn profile screenshots.

Business being verified: ${businessName}
${claimerName ? `Person claiming to work there: ${claimerName}` : ""}
LinkedIn URL they provided: ${linkedinUrl}

I'm providing two screenshots:
1. Profile header - showing name and photo
2. Experience section - showing work history

Verify:
1. Does the name in the profile header match "${claimerName || "the claimer"}"?
2. Does the Experience section show current employment at "${businessName}" or a clearly related entity?
3. Do the screenshots look like genuine LinkedIn screenshots (not edited)?

Return ONLY a JSON object (no prose, no markdown):
{"verified":true|false,"nameMatch":true|false,"employmentMatch":true|false,"confidence":"high"|"medium"|"low","reason":"<brief explanation>"}

Be reasonably lenient — we want to verify legitimate business representatives. If the profile shows current employment at the business, verify it.`,
              },
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: screenshots.headerType as "image/jpeg" | "image/png" | "image/webp" | "image/gif",
                  data: screenshots.headerData,
                },
              },
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: screenshots.experienceType as "image/jpeg" | "image/png" | "image/webp" | "image/gif",
                  data: screenshots.experienceData,
                },
              },
            ],
          },
        ],
      }),
      new Promise<Anthropic.Messages.Message>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), 25000)
      ),
    ]);

    const textBlock = response.content.find((b) => b.type === "text");
    const raw = textBlock?.type === "text" ? textBlock.text : "";

    try {
      const parsed = JSON.parse(raw.replace(/```json?|```/gi, "").trim()) as {
        verified?: boolean;
        nameMatch?: boolean;
        employmentMatch?: boolean;
        confidence?: string;
        reason?: string;
      };

      // Require both name match and employment match for instant verification
      if (parsed.verified && parsed.nameMatch && parsed.employmentMatch && parsed.confidence !== "low") {
        return {
          success: true,
          verified: true,
          reason: `LinkedIn verified: ${parsed.reason || "Profile confirms employment at business"}`,
          screenshotUrls,
        };
      }

      // Build helpful feedback
      let suggestion = "Make sure your screenshots clearly show your name and current employment.";
      if (!parsed.nameMatch) {
        suggestion = "The name on your LinkedIn doesn't seem to match. Please check your screenshots.";
      } else if (!parsed.employmentMatch) {
        suggestion = `We couldn't find ${businessName} in your Experience section. Make sure it shows as your current employer.`;
      }

      return {
        success: true,
        verified: false,
        reason: parsed.reason || "Could not verify LinkedIn connection from screenshots",
        suggestion,
        screenshotUrls,
      };
    } catch {
      return {
        success: true,
        verified: false,
        reason: "LinkedIn verification inconclusive",
        suggestion: "Please try another verification method.",
        screenshotUrls,
      };
    }
  } catch (err) {
    console.error("[verify] LinkedIn screenshot verification error:", err);
    return {
      success: true,
      verified: false,
      reason: "LinkedIn verification unavailable",
      suggestion: "Please try another verification method.",
      screenshotUrls,
    };
  }
}

// ============================================================
// Website Verification
// ============================================================

async function verifyByWebsite(
  websiteUrl: string,
  businessName: string,
  claimerName?: string
): Promise<VerifyResponse> {
  // Validate URL format
  if (!websiteUrl.includes(".")) {
    return {
      success: true,
      verified: false,
      reason: "Invalid website URL",
      suggestion: "Please provide a valid website URL.",
    };
  }

  // Normalize URL
  const normalizedUrl = websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`;

  // Try to fetch the website and verify with Claude
  try {
    // Fetch the page content
    const fetchResponse = await Promise.race([
      fetch(normalizedUrl, {
        headers: {
          "User-Agent": "OleraBot/1.0 (verification)",
        },
      }),
      new Promise<Response>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), 10000)
      ),
    ]);

    if (!fetchResponse.ok) {
      return {
        success: true,
        verified: false,
        reason: `Could not access website (${fetchResponse.status})`,
        suggestion: "Make sure the URL is correct and publicly accessible.",
      };
    }

    const html = await fetchResponse.text();

    // Truncate HTML to avoid token limits (keep first 15k chars)
    const truncatedHtml = html.slice(0, 15000);

    // Use Claude to verify
    const client = getAnthropic();
    const response = await Promise.race([
      client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 300,
        system: `You are verifying whether a webpage shows that a specific person works at a specific business.

Return ONLY a JSON object (no prose, no markdown): {"verified":true|false,"confidence":"high"|"medium"|"low","reason":"<brief explanation>"}

Guidelines:
- Look for the claimer's name on the page (staff list, about page, team section)
- Check if the business name appears on the page
- Common indicators: "Meet the Team", "Our Staff", "About Us", employee bios
- If you find the name clearly listed as staff/employee, that's verified
- If you can't find the name but the page looks legitimate, that's still unverified
- Be lenient — we want to reduce friction for legitimate users`,
        messages: [
          {
            role: "user",
            content: `Business name: ${businessName}\nClaimer name: ${claimerName || "Unknown"}\nURL: ${normalizedUrl}\n\nPage content (truncated):\n${truncatedHtml}`,
          },
        ],
      }),
      new Promise<Anthropic.Messages.Message>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), 12000)
      ),
    ]);

    const textBlock = response.content.find((b) => b.type === "text");
    const raw = textBlock?.type === "text" ? textBlock.text : "";

    try {
      const parsed = JSON.parse(raw.replace(/```json?|```/gi, "").trim()) as {
        verified?: boolean;
        confidence?: string;
        reason?: string;
      };

      if (parsed.verified) {
        return {
          success: true,
          verified: true,
          reason: `Website verified: ${parsed.reason || "Name found on business website"}`,
        };
      }

      return {
        success: true,
        verified: false,
        reason: parsed.reason || "Could not find your name on the website",
        suggestion: "Make sure the page you linked includes your name as staff.",
      };
    } catch {
      return {
        success: true,
        verified: false,
        reason: "Website verification inconclusive",
        suggestion: "We'll review your website link manually.",
      };
    }
  } catch (err) {
    console.error("[verify] Website verification error:", err);
    return {
      success: true,
      verified: false,
      reason: "Could not access website",
      suggestion: "Make sure the URL is correct and try again.",
    };
  }
}

// ============================================================
// Document Verification (Claude Vision)
// ============================================================

async function verifyByDocument(
  documentData: string | undefined,
  documentType: string | undefined,
  businessName: string,
  claimerName?: string,
  admin?: SupabaseClient,
  profileId?: string
): Promise<VerifyResponse> {
  if (!documentData || !documentType) {
    return {
      success: true,
      verified: false,
      reason: "No document provided",
      suggestion: "Please upload a document to verify.",
    };
  }

  // Validate document type
  const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];
  if (!validTypes.includes(documentType)) {
    return {
      success: true,
      verified: false,
      reason: "Invalid document type",
      suggestion: "Please upload a JPG, PNG, or PDF file.",
    };
  }

  // Upload document to storage first (so admins can review it later)
  let documentUrl: string | undefined;
  if (admin && profileId) {
    const url = await uploadVerificationImage(admin, profileId, documentData, documentType, "document");
    if (url) documentUrl = url;
  }

  // For PDFs, we can't use vision directly — need to convert or handle differently
  // For now, send PDFs to manual review
  if (documentType === "application/pdf") {
    return {
      success: true,
      verified: false,
      reason: "PDF documents require manual review",
      suggestion: "We'll review your document within 1-2 business days.",
      documentUrl,
    };
  }

  // Use Claude Vision to verify the document
  try {
    const client = getAnthropic();
    const response = await Promise.race([
      client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 500,
        // Short structured-JSON classification on a 20s timeout — keep it fast.
        // Sonnet 4.6 defaults to effort "high"; this is not a reasoning task.
        thinking: { type: "disabled" },
        output_config: { effort: "low" },
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: documentType as "image/jpeg" | "image/png" | "image/webp" | "image/gif",
                  data: documentData,
                },
              },
              {
                type: "text",
                text: `Analyze this document for business verification purposes.

Business being verified: ${businessName}
${claimerName ? `Person claiming to work there: ${claimerName}` : ""}

Look for:
1. Is this a legitimate business document (license, ID badge, business card, letterhead, etc.)?
2. Does it show connection to "${businessName}" or a clearly related entity?
3. Does it show "${claimerName || "any person's name"}"?
4. Are there any signs this is fake or manipulated?

Return ONLY a JSON object (no prose, no markdown):
{"verified":true|false,"documentType":"<what kind of document>","confidence":"high"|"medium"|"low","reason":"<brief explanation>"}

Be reasonably lenient — we want to verify legitimate business representatives. If the document looks genuine and shows connection to the business, verify it.`,
              },
            ],
          },
        ],
      }),
      new Promise<Anthropic.Messages.Message>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), 20000)
      ),
    ]);

    const textBlock = response.content.find((b) => b.type === "text");
    const raw = textBlock?.type === "text" ? textBlock.text : "";

    try {
      const parsed = JSON.parse(raw.replace(/```json?|```/gi, "").trim()) as {
        verified?: boolean;
        documentType?: string;
        confidence?: string;
        reason?: string;
      };

      if (parsed.verified && parsed.confidence !== "low") {
        return {
          success: true,
          verified: true,
          reason: `Document verified: ${parsed.documentType || "business document"} - ${parsed.reason || "Shows connection to business"}`,
          documentUrl,
        };
      }

      return {
        success: true,
        verified: false,
        reason: parsed.reason || "Could not verify document",
        suggestion: "Try uploading a clearer photo of your business license or ID badge.",
        documentUrl,
      };
    } catch {
      return {
        success: true,
        verified: false,
        reason: "Document verification inconclusive",
        suggestion: "We'll review your document manually.",
        documentUrl,
      };
    }
  } catch (err) {
    console.error("[verify] Document verification error:", err);
    return {
      success: true,
      verified: false,
      reason: "Document verification unavailable",
      suggestion: "We'll review your document manually.",
      documentUrl,
    };
  }
}
