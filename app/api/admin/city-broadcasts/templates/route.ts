/**
 * GET /api/admin/city-broadcasts/templates
 *
 * Returns both broadcast email templates rendered with sample data.
 * Used for previewing templates on the admin dashboard.
 */

import { NextResponse } from "next/server";
import { getAuthUser, getAdminUser } from "@/lib/admin";
import {
  renderQuestionBroadcast,
  renderProfileBroadcast,
  type BroadcastTemplateContext,
} from "@/lib/city-broadcasts/templates";

// Sample data for template previews
const SAMPLE_CONTEXT: BroadcastTemplateContext = {
  providerId: "sample-provider-123",
  providerName: "Sunrise Senior Care",
  providerSlug: "sunrise-senior-care-dallas-tx",
  providerEmail: "contact@sunriseseniorcare.com",
  city: "Dallas",
  category: "Home Care",
  questionText: "What types of dementia care services do you offer, and do you have staff trained in memory care?",
};

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const adminUser = await getAdminUser(user.id);
  if (!adminUser) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // Render both templates with sample data
    const questionTemplate = renderQuestionBroadcast(SAMPLE_CONTEXT);
    const profileTemplate = renderProfileBroadcast({
      ...SAMPLE_CONTEXT,
      questionText: undefined, // Profile broadcast doesn't use question text
    });

    return NextResponse.json({
      templates: [
        {
          id: "question_asked",
          name: "Question Broadcast",
          description: "Sent when a family asks a question in a city with eligible providers",
          subject: questionTemplate.subject,
          preheader: questionTemplate.preheader,
          html: questionTemplate.html,
        },
        {
          id: "profile_published",
          name: "Profile Broadcast",
          description: "Sent when a family publishes their care-seeker profile",
          subject: profileTemplate.subject,
          preheader: profileTemplate.preheader,
          html: profileTemplate.html,
        },
      ],
    });
  } catch (err) {
    console.error("[city-broadcasts/templates] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
