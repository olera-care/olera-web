import { NextRequest, NextResponse } from "next/server";
import { sendSlackAlert } from "@/lib/slack";

export async function POST(req: NextRequest) {
  try {
    const { email, city } = await req.json();

    if (!email || !city) {
      return NextResponse.json({ error: "Missing email or city" }, { status: 400 });
    }

    // Slack notification — lightweight, no DB table needed yet
    await sendSlackAlert(
      `MedJobs early access request: ${email} (${city})`,
      [
        {
          type: "header",
          text: { type: "plain_text", text: "MedJobs Early Access Request", emoji: true },
        },
        {
          type: "section",
          fields: [
            { type: "mrkdwn", text: `*Email:*\n${email}` },
            { type: "mrkdwn", text: `*City:*\n${city}` },
          ],
        },
      ]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[medjobs/early-access] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
