/**
 * Resend Direct Email Integration for Staffing Outreach V2
 *
 * This module sends emails directly via Resend's /emails endpoint.
 * Much simpler and more reliable than automations.
 *
 * Sequence:
 *   1. Email 1 (Initial outreach) - sent immediately via startEmailSequence()
 *   2. Email 2 (Follow-up) - sent by cron job after 3 days
 *
 * MOCK MODE:
 *   When RESEND_STAFFING_AUDIENCE_ID is not configured, the module runs in mock mode.
 *   This allows testing the V2 UI flow without actual Resend integration.
 *   In mock mode:
 *   - startEmailSequence() returns success with a mock contact ID
 *   - No actual emails are sent
 */

import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY;

// Resend Automation audience ID - used for mock mode detection
const STAFFING_AUTOMATION_AUDIENCE_ID = process.env.RESEND_STAFFING_AUDIENCE_ID ?? "";

// Mock mode is enabled when audience ID is not configured
const IS_MOCK_MODE = !STAFFING_AUTOMATION_AUDIENCE_ID;

// Sender for staffing outreach emails
const SENDER_LOGAN = "Dr. Logan DuBose <logan@olera.care>";

let resendClient: Resend | null = null;

function getResend(): Resend | null {
  if (resendClient) return resendClient;
  if (!RESEND_API_KEY) return null;
  resendClient = new Resend(RESEND_API_KEY);
  return resendClient;
}

export interface StartSequenceParams {
  /** Provider's general email address */
  email: string;
  /** Staffing outreach row ID */
  outreachId: string;
  /** Provider ID */
  providerId: string;
  /** Provider name for email personalization */
  providerName: string;
  /** University name for email personalization */
  universityName: string;
  /** Service area (e.g., "Austin area") for email personalization */
  serviceArea: string;
  /** Batch ID for tracking */
  batchId: string;
}

export interface StartSequenceResult {
  success: boolean;
  contactId?: string;
  emailId?: string;
  error?: string;
}

/**
 * Start the email sequence for a provider by sending Email 1 directly.
 *
 * This sends the initial outreach email immediately via Resend's /emails endpoint.
 * Email 2 (follow-up) is sent by a separate cron job after 3 days.
 *
 * In MOCK MODE (no audience ID configured):
 * - Returns success with a mock contact ID
 * - No actual emails are sent
 * - Useful for testing the UI flow
 */
export async function startEmailSequence(
  params: StartSequenceParams
): Promise<StartSequenceResult> {
  // Mock mode: return success without calling Resend
  if (IS_MOCK_MODE) {
    const mockContactId = `mock_${params.outreachId.slice(0, 8)}`;
    console.log(
      `[resend-automation] MOCK MODE: Simulating sequence start for ${params.email} (outreach: ${params.outreachId})`
    );
    return {
      success: true,
      contactId: mockContactId,
    };
  }

  const resend = getResend();
  if (!resend) {
    console.error("[resend-automation] RESEND_API_KEY not configured");
    return { success: false, error: "Resend not configured" };
  }

  try {
    // Generate Email 1 content
    const email1 = generateEmail1({
      universityName: params.universityName,
      serviceArea: params.serviceArea,
    });

    // Send Email 1 directly
    const { data, error } = await resend.emails.send({
      from: SENDER_LOGAN,
      to: params.email,
      subject: email1.subject,
      html: email1.html,
      tags: [
        { name: "outreach_id", value: params.outreachId },
        { name: "email_number", value: "1" },
        { name: "type", value: "staffing_outreach" },
      ],
    });

    if (error) {
      console.error("[resend-automation] Failed to send Email 1:", error);
      return { success: false, error: error.message };
    }

    console.log(
      `[resend-automation] Sent Email 1 to ${params.email} (outreach: ${params.outreachId}, emailId: ${data?.id})`
    );

    return {
      success: true,
      emailId: data?.id,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[resend-automation] Error sending Email 1:", message);
    return { success: false, error: message };
  }
}

/**
 * Send Email 2 (follow-up) to a provider.
 * Called by the cron job after 3 days.
 */
export async function sendFollowUpEmail(params: {
  email: string;
  outreachId: string;
  universityName: string;
}): Promise<{ success: boolean; emailId?: string; error?: string }> {
  // Mock mode: return success without calling Resend
  if (IS_MOCK_MODE) {
    console.log(
      `[resend-automation] MOCK MODE: Simulating Email 2 for ${params.email}`
    );
    return { success: true };
  }

  const resend = getResend();
  if (!resend) {
    return { success: false, error: "Resend not configured" };
  }

  try {
    const email2 = generateEmail2({ universityName: params.universityName });

    const { data, error } = await resend.emails.send({
      from: SENDER_LOGAN,
      to: params.email,
      subject: email2.subject,
      html: email2.html,
      tags: [
        { name: "outreach_id", value: params.outreachId },
        { name: "email_number", value: "2" },
        { name: "type", value: "staffing_outreach" },
      ],
    });

    if (error) {
      console.error("[resend-automation] Failed to send Email 2:", error);
      return { success: false, error: error.message };
    }

    console.log(
      `[resend-automation] Sent Email 2 to ${params.email} (outreach: ${params.outreachId}, emailId: ${data?.id})`
    );

    return { success: true, emailId: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[resend-automation] Error sending Email 2:", message);
    return { success: false, error: message };
  }
}

/**
 * Stop the email sequence for a provider.
 * In the direct email approach, we just mark them as stopped in our DB.
 * The cron job checks status before sending Email 2.
 */
export async function stopEmailSequence(
  email: string
): Promise<{ success: boolean; error?: string }> {
  // No external API call needed - just log
  console.log(`[resend-automation] Sequence stopped for ${email}`);
  return { success: true };
}

/**
 * Check if the module is running in mock mode.
 * Useful for showing warnings in the UI.
 */
export function isResendMockMode(): boolean {
  return IS_MOCK_MODE;
}

// ─────────────────────────────────────────────────────────────────────────────
// Email Templates (HTML versions)
// ─────────────────────────────────────────────────────────────────────────────

const BRAND_COLOR = "#198087";
const FONT_STACK = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Dr. Logan's email signature with photo and credentials
 */
function loganSignature(): string {
  const photoUrl = "https://olera.care/images/for-providers/team/logan.jpg";
  const calendarUrl = "https://calendly.com/caregivers979/home-care-agency-manager-interview";

  return `
    <table cellpadding="0" cellspacing="0" style="margin-top:24px;border-top:1px solid #e5e7eb;padding-top:20px;">
      <tr>
        <td style="vertical-align:top;padding-right:16px;">
          <img src="${photoUrl}" alt="Dr. Logan DuBose" width="100" height="100" style="border-radius:8px;display:block;" />
        </td>
        <td style="vertical-align:top;font-size:13px;line-height:1.5;color:#374151;">
          <p style="margin:0 0 4px;font-weight:600;color:#111827;">Dr. Logan DuBose, MD, MBA</p>
          <p style="margin:0 0 2px;">Chief Research Officer (CRO), <a href="https://www.olera.care" style="color:${BRAND_COLOR};">Olera</a></p>
          <p style="margin:0 0 2px;">Researcher, funded by <a href="https://www.sbir.gov/" style="color:${BRAND_COLOR};">NIH SBIR Program</a></p>
          <p style="margin:0 0 2px;">Texas A&amp;M College of Medicine, Class of 2022</p>
          <p style="margin:0 0 8px;">General Practitioner (GP), Licensed in VA</p>
          <p style="margin:0 0 8px;">
            <a href="https://www.linkedin.com/in/logan-dubose/" style="color:${BRAND_COLOR};">LinkedIn</a> |
            <a href="https://www.facebook.com/oleracare/" style="color:${BRAND_COLOR};">Facebook</a> |
            <a href="https://www.youtube.com/@OleraCare" style="color:${BRAND_COLOR};">YouTube</a>
          </p>
          <p style="margin:0;">
            <a href="${calendarUrl}" style="color:${BRAND_COLOR};font-weight:500;">Schedule a meeting →</a>
          </p>
        </td>
      </tr>
    </table>
  `;
}

function emailLayout(body: string, preheaderText?: string): string {
  const preheader = preheaderText
    ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#f9fafb;opacity:0;">${escapeHtml(preheaderText)}${"&zwnj;&nbsp;".repeat(80)}</div>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:${FONT_STACK};">
  ${preheader}
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 0;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:520px;width:100%;">
        <tr><td style="padding:24px 32px 8px;">
          <span style="font-size:18px;font-weight:700;color:${BRAND_COLOR};letter-spacing:-0.3px;">Olera</span>
        </td></tr>
        <tr><td style="padding:8px 32px 32px;color:#111827;font-size:15px;line-height:1.6;">
          ${body}
        </td></tr>
        <tr><td style="padding:16px 32px;border-top:1px solid #f3f4f6;">
          <p style="font-size:12px;color:#9ca3af;margin:0;">
            &copy; ${new Date().getFullYear()} Olera, Inc. &middot;
            <a href="https://olera.care" style="color:#9ca3af;">olera.care</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/**
 * Generate Email 1 (Initial outreach) HTML
 */
export function generateEmail1(params: {
  universityName: string;
  serviceArea: string;
}): { subject: string; html: string } {
  const { universityName, serviceArea } = params;

  const subject = `${universityName} Student Caregiver Program`;

  const body = `
    <p>Hello</p>
    <p>I am hoping to reach the person who handles hiring to share more information on a pilot ${escapeHtml(universityName)} Student Caregiver Program.</p>
    <p>My name is Dr. Logan DuBose. I am a physician-researcher funded by the National Institutes of Health (NIH) Small Business Innovation Research (SBIR) Program and Chief Research Officer at Olera. I am currently working on a pilot program to match pre-nursing and pre-medical students with care agency jobs so they can help improve community care worker turnover and shortages, while gaining critical experience for their future careers as doctors and nurses.</p>
    <p>Would you be interested in hearing more about this program? In pilot testing in the ${escapeHtml(serviceArea)}, I have seen potential for it to be an evergreen pipeline delivering vetted pre-health ${escapeHtml(universityName)} students seeking employment in caregiver roles.</p>
    <p>Some materials to consider:</p>
    <ul style="margin:16px 0;padding-left:20px;">
      <li style="margin:8px 0;">Pilot website here (demo profiles): <a href="https://olera.care/medjobs/providers" style="color:${BRAND_COLOR};">olera.care/medjobs/providers</a></li>
      <li style="margin:8px 0;">Demo video I made here: <a href="https://www.youtube.com/watch?v=ParY1tGaiew" style="color:${BRAND_COLOR};">YouTube (~7 minutes long)</a></li>
      <li style="margin:8px 0;">Recent system improvements since the last pilot include a more robust candidate vetting and scheduling system, and the price point potentially being lowered to $50/month (however, for earlier adopters, I am not charging anything for a period of time, and instead would appreciate feedback and reviews of the system)</li>
      <li style="margin:8px 0;">Goal to send 5 new candidates a week with 1-3 solid hires per month in perpetuity</li>
    </ul>
    <p>Please let me know if you have any questions, would like to meet, or if there is any interest in restarting the program. If I can get your team's buy-in, then I will begin recruitment for you at ${escapeHtml(universityName)} pre-nursing and pre-medical organizations this month (and could be sending vetted candidates for summer caregiving roles ASAP)!</p>
    <p>Take care!</p>
    <p style="margin:20px 0 0;">Best,</p>
    ${loganSignature()}
  `;

  return {
    subject,
    html: emailLayout(body, `${universityName} student caregiver pilot program`),
  };
}

/**
 * Generate Email 2 (Follow-up) HTML
 */
function generateEmail2(params: {
  universityName: string;
}): { subject: string; html: string } {
  const { universityName } = params;

  const subject = `Quick follow-up – ${universityName} Student Program`;

  const body = `
    <p>Hi,</p>
    <p>Just wanted to follow up in case this got buried.</p>
    <p>We're starting to connect agencies with pre-nursing students from ${escapeHtml(universityName)} who are actively looking for caregiving roles.</p>
    <p>Would it make sense to share a quick overview or schedule a brief call?</p>
    <p style="margin:20px 0 0;">Best,</p>
    ${loganSignature()}
  `;

  return {
    subject,
    html: emailLayout(body, `Following up on ${universityName} student program`),
  };
}

/**
 * Get sequence email templates for preview in the drawer.
 */
export function getSequenceEmailPreviews(params: {
  providerName: string;
  universityName: string;
  serviceArea: string;
}): { email1: { subject: string; body: string }; email2: { subject: string; body: string } } {
  const { universityName, serviceArea } = params;

  return {
    email1: {
      subject: `${universityName} Student Caregiver Program`,
      body: `Hello

I am hoping to reach the person who handles hiring to share more information on a pilot ${universityName} Student Caregiver Program.

My name is Dr. Logan DuBose. I am a physician-researcher funded by the National Institutes of Health (NIH) Small Business Innovation Research (SBIR) Program and Chief Research Officer at Olera. I am currently working on a pilot program to match pre-nursing and pre-medical students with care agency jobs so they can help improve community care worker turnover and shortages, while gaining critical experience for their future careers as doctors and nurses.

Would you be interested in hearing more about this program? In pilot testing in the ${serviceArea}, I have seen potential for it to be an evergreen pipeline delivering vetted pre-health ${universityName} students seeking employment in caregiver roles.

Some materials to consider:
• Pilot website here (demo profiles): https://olera.care/medjobs/providers
• Demo video I made here: https://www.youtube.com/watch?v=ParY1tGaiew (~7 minutes long)
• Recent system improvements since the last pilot include a more robust candidate vetting and scheduling system, and the price point potentially being lowered to $50/month (however, for earlier adopters, I am not charging anything for a period of time, and instead would appreciate feedback and reviews of the system)
• Goal to send 5 new candidates a week with 1-3 solid hires per month in perpetuity

Please let me know if you have any questions, would like to meet, or if there is any interest in restarting the program. If I can get your team's buy-in, then I will begin recruitment for you at ${universityName} pre-nursing and pre-medical organizations this month (and could be sending vetted candidates for summer caregiving roles ASAP)!

Take care!

Best,
Logan`,
    },
    email2: {
      subject: `Quick follow-up – ${universityName} Student Program`,
      body: `Hi,

Just wanted to follow up in case this got buried.

We're starting to connect agencies with pre-nursing students from ${universityName} who are actively looking for caregiving roles.

Would it make sense to share a quick overview or schedule a brief call?

Best,
Logan`,
    },
  };
}
