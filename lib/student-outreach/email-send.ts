/**
 * Server-only: send a student-outreach email via Resend.
 *
 * v4: invoked from two places — the cron auto-send executor (every 15 min)
 * and the inline Day-0 send during `schedule_sequence`. The caller passes
 * a body SNAPSHOT (subject + body that the admin reviewed/edited at
 * pre-flight); per-recipient {first_name} substitution happens here.
 *
 * Reply-To is set to STUDENT_OUTREACH_REPLY_TO (a Google Group inbox
 * shared by the admin team) so stakeholder replies land in everyone's
 * inbox. The From address is a sending identity (e.g. noreply@olera.care).
 *
 * The PDF flyer is fetched once per process from STUDENT_OUTREACH_FLYER_URL
 * and attached to every send (fail-open if unset/unfetchable).
 *
 * Resend rate limit guard: 150ms throttle between sends keeps us
 * comfortably under the 10/sec default ceiling.
 */

import { sendEmail } from "@/lib/email";
import { firstNameOf, salutationFor, substituteVars } from "./templates";
import type { StakeholderType } from "./types";

const FROM_ADDRESS = process.env.STUDENT_OUTREACH_FROM_ADDRESS
  ?? "Olera Outreach <noreply@olera.care>";

const REPLY_TO_ADDRESS = process.env.STUDENT_OUTREACH_REPLY_TO ?? "";

const FLYER_URL = process.env.STUDENT_OUTREACH_FLYER_URL ?? "";
const FLYER_FILENAME = "olera-student-outreach-flyer.pdf";

const RESEND_THROTTLE_MS = 150;

export interface EmailRecipient {
  contact_id: string;
  name: string;
  /** Preferred for personalization. Falls back to first word of `name`. */
  first_name?: string | null;
  /** Used by salutation resolver for dept_head + professor. */
  last_name?: string | null;
  /** Optional formal title (e.g. "Dr."). Drives the formal salutation. */
  title?: string | null;
  email: string;
}

export interface SendOutreachEmailInput {
  outreach_id: string;
  /** Drives stakeholder-aware salutation resolution. */
  stakeholder_type: StakeholderType;
  campus_name: string;
  organization_name: string;
  /** Logged on touchpoints + email_log; not used for Reply-To. */
  admin_first_name: string;
  /** Snapshot subject (placeholders intact). */
  subject: string;
  /** Snapshot body (placeholders intact). */
  body: string;
  recipients: EmailRecipient[];
  cadence_day: number;
  template: string;
}

export interface PerRecipientResult {
  contact_id: string;
  recipient_email: string;
  recipient_name: string;
  success: boolean;
  email_log_id: string | null;
  error: string | null;
}

export interface SendOutreachEmailResult {
  results: PerRecipientResult[];
  success_count: number;
  failure_count: number;
  attachment_present: boolean;
}

let cachedAttachment: { content: string; type: string } | null = null;
let cachedAttachmentChecked = false;

async function loadFlyerAttachment(): Promise<
  Array<{ filename: string; content: string; encoding?: string; type?: string }> | undefined
> {
  if (!FLYER_URL) return undefined;
  if (cachedAttachmentChecked && cachedAttachment) {
    return [{
      filename: FLYER_FILENAME,
      content: cachedAttachment.content,
      encoding: "base64",
      type: cachedAttachment.type,
    }];
  }
  cachedAttachmentChecked = true;
  try {
    const res = await fetch(FLYER_URL);
    if (!res.ok) return undefined;
    const buf = await res.arrayBuffer();
    cachedAttachment = {
      content: Buffer.from(buf).toString("base64"),
      type: res.headers.get("content-type") ?? "application/pdf",
    };
    return [{
      filename: FLYER_FILENAME,
      content: cachedAttachment.content,
      encoding: "base64",
      type: cachedAttachment.type,
    }];
  } catch {
    return undefined;
  }
}

function bodyToHtml(text: string): string {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped
    .split(/\n{2,}/)
    .map((para) => `<p>${para.replace(/\n/g, "<br>")}</p>`)
    .join("\n");
}

/**
 * v9: HTML signature block appended after the body. Photo +
 * credentials for Dr. Logan DuBose; "from" identity for Grazie
 * already lives in the body's sign-off (text). Mirrors the
 * existing loganSignature() in lib/staffing-outreach/
 * resend-automation.ts so v9 outreach renders the same trust
 * scaffolding as the staffing pipeline.
 */
function loganSignatureHtml(): string {
  const photoUrl = "https://olera.care/images/for-providers/team/logan.jpg";
  const calendarUrl = "https://calendly.com/caregivers979/home-care-agency-manager-interview";
  return `
<table cellpadding="0" cellspacing="0" style="margin-top:24px;border-top:1px solid #e5e7eb;padding-top:20px;">
  <tr>
    <td style="vertical-align:top;padding-right:16px;">
      <img src="${photoUrl}" alt="Dr. Logan DuBose" width="100" height="100" style="border-radius:8px;display:block;" />
    </td>
    <td style="vertical-align:top;font-size:13px;line-height:1.5;color:#374151;font-family:Inter,Arial,sans-serif;">
      <p style="margin:0 0 4px;font-weight:600;color:#111827;">Dr. Logan DuBose, MD, MBA</p>
      <p style="margin:0 0 2px;">Texas A&amp;M College of Medicine, Class of 2022</p>
      <p style="margin:0 0 2px;">Affiliate Faculty, Texas A&amp;M School of Public Health</p>
      <p style="margin:0 0 2px;">Researcher, funded by NIH SBIR Program</p>
      <p style="margin:0 0 2px;">General Practitioner (GP), Licensed in VA</p>
      <p style="margin:0 0 8px;">Co-founder, <a href="https://www.olera.care" style="color:#059669;">www.olera.care</a></p>
      <p style="margin:0;">
        <a href="${calendarUrl}" style="color:#059669;font-weight:500;">Schedule a meeting with Dr. DuBose →</a>
      </p>
    </td>
  </tr>
</table>`;
}

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

export async function sendOutreachEmail(
  input: SendOutreachEmailInput,
): Promise<SendOutreachEmailResult> {
  const attachments = await loadFlyerAttachment();

  const staticVars = {
    organization_name: input.organization_name,
    campus_name: input.campus_name,
    admin_first_name: input.admin_first_name,
  };

  const results: PerRecipientResult[] = [];
  for (let i = 0; i < input.recipients.length; i++) {
    const r = input.recipients[i];
    const firstName = (r.first_name && r.first_name.trim()) || firstNameOf(r.name);
    const salutation = salutationFor(
      input.stakeholder_type,
      firstName,
      r.last_name ?? null,
      r.title ?? null,
    );
    const subject = substituteVars(input.subject, {
      first_name: firstName,
      salutation,
      ...staticVars,
    });
    const body = substituteVars(input.body, {
      first_name: firstName,
      salutation,
      ...staticVars,
    });
    // v9: body body-to-HTML converted, then Dr. Logan signature
    // appended so every outreach email lands with consistent
    // trust scaffolding (photo + credentials + Calendly CTA).
    const html = bodyToHtml(body) + loganSignatureHtml();

    try {
      const send = await sendEmail({
        to: r.email,
        from: FROM_ADDRESS,
        replyTo: REPLY_TO_ADDRESS || undefined,
        subject,
        html,
        emailType: "student_outreach",
        recipientType: "student",
        attachments,
        metadata: {
          outreach_id: input.outreach_id,
          contact_id: r.contact_id,
          cadence_day: input.cadence_day,
          template: input.template,
        },
      });
      results.push({
        contact_id: r.contact_id,
        recipient_email: r.email,
        recipient_name: r.name,
        success: send.success,
        email_log_id: send.emailLogId ?? null,
        error: send.error ?? null,
      });
    } catch (err) {
      results.push({
        contact_id: r.contact_id,
        recipient_email: r.email,
        recipient_name: r.name,
        success: false,
        email_log_id: null,
        error: err instanceof Error ? err.message : "send failed",
      });
    }

    if (i < input.recipients.length - 1) {
      await sleep(RESEND_THROTTLE_MS);
    }
  }

  return {
    results,
    success_count: results.filter((r) => r.success).length,
    failure_count: results.filter((r) => !r.success).length,
    attachment_present: Boolean(attachments),
  };
}
