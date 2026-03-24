import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { checklistEmail } from "@/lib/email-templates";

export async function POST(req: NextRequest) {
  const { email, programName, programShortName, stateName, checked } =
    await req.json();

  if (!email || typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  const html = checklistEmail({
    programName,
    programShortName,
    stateName,
    checked: checked || [],
  });

  const result = await sendEmail({
    to: email,
    subject: `Your ${programShortName} Document Checklist — Olera`,
    html,
    emailType: "checklist",
    recipientType: "family",
  });

  if (!result.success) {
    return NextResponse.json(
      { error: result.error || "Failed to send email" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
