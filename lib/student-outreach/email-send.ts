/**
 * Server-only: send a student outreach email via Resend.
 *
 * Per-recipient personalization: one Resend send per recipient, with
 * `{first_name}` substituted from the recipient's name. Subject + body
 * passed in by the caller are templates with placeholders intact —
 * the admin may have edited them before sending.
 *
 * The PDF flyer is fetched once from STUDENT_OUTREACH_FLYER_URL and
 * attached to every send (fail-open: if the URL is missing or the
 * fetch fails, we still send without the attachment).
 */

import { sendEmail } from "@/lib/email";
import { firstNameOf, substituteVars } from "./templates";

const FROM_ADDRESS = process.env.STUDENT_OUTREACH_FROM_ADDRESS
  ?? "Olera Outreach <noreply@olera.care>";

const FLYER_URL = process.env.STUDENT_OUTREACH_FLYER_URL ?? "";
const FLYER_FILENAME = "olera-student-outreach-flyer.pdf";

export interface EmailRecipient {
  contact_id: string;
  name: string;
  email: string;
}

export interface SendOutreachEmailInput {
  /** The outreach row id. Logged into email_log metadata. */
  outreach_id: string;
  /** Campus name for tracking. */
  campus_name: string;
  /** Stakeholder organization name. */
  organization_name: string;
  /** Admin first name, substituted into {admin_first_name}. */
  admin_first_name: string;
  /** Editable subject (template placeholders allowed). */
  subject: string;
  /** Editable body (template placeholders allowed; plain text). */
  body: string;
  /** One send per recipient. */
  recipients: EmailRecipient[];
  /** Cadence day this send corresponds to (logged on touchpoints). */
  cadence_day: number;
  /** Template key (logged on touchpoints). */
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

/** Fetch the PDF flyer and base64-encode it. Cached per-process. */
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

/** Plain-text body → simple HTML, preserving line breaks + paragraphs. */
function bodyToHtml(text: string): string {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  // Two consecutive newlines → paragraph; single newline → <br>.
  return escaped
    .split(/\n{2,}/)
    .map((para) => `<p>${para.replace(/\n/g, "<br>")}</p>`)
    .join("\n");
}

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
  for (const r of input.recipients) {
    const firstName = firstNameOf(r.name);
    const subject = substituteVars(input.subject, { first_name: firstName, ...staticVars });
    const body = substituteVars(input.body, { first_name: firstName, ...staticVars });
    const html = bodyToHtml(body);

    try {
      const send = await sendEmail({
        to: r.email,
        from: FROM_ADDRESS,
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
  }

  return {
    results,
    success_count: results.filter((r) => r.success).length,
    failure_count: results.filter((r) => !r.success).length,
    attachment_present: Boolean(attachments),
  };
}
