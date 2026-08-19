import { NextRequest, NextResponse } from "next/server";
import {
  providerWelcomeEmail,
  onboardingVerificationEmail,
  onboardingNotificationsEmail,
  onboardingProfilePreviewEmail,
  verificationReminder21DayEmail,
} from "@/lib/email-templates";

/**
 * GET /api/admin/automations/preview-template?template=provider-welcome
 *
 * Renders an email template with sample data for local preview.
 * Dev-only — blocked in production by the check below.
 */
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  const template = request.nextUrl.searchParams.get("template");
  const html = (content: string) => new NextResponse(content, { headers: { "Content-Type": "text/html; charset=utf-8" } });

  if (template === "provider-welcome") {
    return html(providerWelcomeEmail({
      providerName: "BrightStar Care",
      dashboardUrl: "#",
      providerSlug: "brightstar-care",
    }));
  }

  if (template === "verification-nudge") {
    return html(onboardingVerificationEmail({
      providerName: "BrightStar Care",
      recipientName: "Sarah",
      verifyUrl: "#",
      providerSlug: "brightstar-care",
    }));
  }

  if (template === "notification-nudge") {
    return html(onboardingNotificationsEmail({
      recipientName: "Sarah",
      providerName: "BrightStar Care",
      notificationsUrl: "#",
      providerSlug: "brightstar-care",
    }));
  }

  if (template === "profile-preview") {
    return html(onboardingProfilePreviewEmail({
      providerName: "BrightStar Care",
      profileUrl: "#",
      providerSlug: "brightstar-care",
    }));
  }

  if (template === "verification-21d") {
    return html(verificationReminder21DayEmail({
      providerName: "BrightStar Care",
      recipientName: "Sarah",
      verifyUrl: "#",
      providerSlug: "brightstar-care",
    }));
  }

  return NextResponse.json(
    { error: "Unknown template. Supported: provider-welcome, verification-nudge, notification-nudge, profile-preview, verification-21d" },
    { status: 400 }
  );
}
