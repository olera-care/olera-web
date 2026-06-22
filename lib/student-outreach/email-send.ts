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
import {
  CALENDLY_URL,
  PROGRAM_URL,
  firstNameOf,
  salutationFor,
  substituteVars,
} from "./templates";
import { bodyToHtml } from "./email-markdown";
import { getProgramPdfConfig, GENERIC_SLUG } from "@/lib/program-pdf/configs";
import {
  programPdfFilename,
  renderProgramPdf,
} from "@/lib/program-pdf/generate";
import type { StakeholderType } from "./types";

/**
 * v9 final: sender identity is Graize Belandres directly, not a
 * generic "Olera Outreach" / noreply address. Recipients see a
 * human name in their inbox + a real mailbox they can reply to,
 * which improves deliverability (lower spam scores for non-
 * noreply From headers) and trust (the email feels like a real
 * person sent it).
 *
 * The address can still be overridden by env var when we move to
 * a dedicated outreach subdomain (see domain-strategy
 * recommendation in the README / ops doc). The display name stays
 * "Graize Belandres" regardless — the right side of the < > is
 * the routing identity, the left side is what humans see.
 */
const FROM_ADDRESS =
  process.env.STUDENT_OUTREACH_FROM_ADDRESS
  ?? "Graize Belandres <graize@olera.care>";

const REPLY_TO_ADDRESS =
  process.env.STUDENT_OUTREACH_REPLY_TO ?? "graize@olera.care";

const FLYER_URL = process.env.STUDENT_OUTREACH_FLYER_URL ?? "";
const FLYER_FILENAME = "olera-student-outreach-flyer.pdf";

/**
 * Signature photo URLs. Override via env var so we can repoint to
 * Supabase Storage, a CDN, or a per-environment Vercel deploy
 * without code edits. Defaults to /public assets which are served
 * from olera.care once the file is on main.
 *
 * For new deployments where the file may not yet live on main,
 * set these envs to a stable host (Supabase public bucket
 * URL is recommended — see domain-strategy ops doc).
 */
// olera.care/images/* is WAF-challenged (429) for non-browser fetches, so
// signature photos there fail to render in inboxes. Default to the Supabase
// public bucket (same host the Resend family templates use; both assets
// verified 200). Env overrides still win either way.
const LOGAN_PHOTO_URL =
  process.env.STUDENT_OUTREACH_LOGAN_PHOTO_URL ??
  "https://ocaabzfiiikjcgqwhbwr.supabase.co/storage/v1/object/public/content-images/team/logan.jpg";
const GRAZIE_PHOTO_URL =
  process.env.STUDENT_OUTREACH_GRAZIE_PHOTO_URL ??
  "https://ocaabzfiiikjcgqwhbwr.supabase.co/storage/v1/object/public/content-images/team/grazie.png";

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
  /** v9 final: campus slug. Drives which Program PDF is attached
   *  to the send (per-university config in lib/program-pdf). Null
   *  for legacy callers or stakeholder rows with no registered
   *  config — those fall back to the env-var-driven generic PDF. */
  campus_slug?: string | null;
  /** v9 final: per-campus PDF override URL from
   *  student_outreach_campuses.program_pdf_url. When set, the
   *  attachment loader uses this URL instead of the code-defined
   *  template. Lets admin attach a bespoke PDF without code
   *  changes. */
  campus_program_pdf_url?: string | null;
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

/**
 * v9 final: attachment loader. Four sources, in priority order:
 *   1. Per-campus override URL from student_outreach_campuses.
 *      program_pdf_url. Lets admin attach a bespoke PDF without
 *      code changes — fetched + base64'd at send time, cached
 *      per URL in-process.
 *   2. Per-university code-defined Program PDF generated on
 *      demand from lib/program-pdf (when campus_slug matches a
 *      registered config). Cached in-process per slug.
 *   3. Env-var-driven generic flyer (STUDENT_OUTREACH_FLYER_URL),
 *      used when the campus isn't configured yet or the caller
 *      doesn't pass a slug.
 *   4. No attachment (silent — send proceeds without a PDF). The
 *      body copy that references "the attached information
 *      packet" still goes; the recipient won't have the PDF, but
 *      the send doesn't fail.
 */
const cachedProgramPdfBySlug = new Map<string, { content: string; filename: string }>();
const cachedCustomPdfByUrl = new Map<string, { content: string; filename: string; type: string }>();
let cachedEnvAttachment: { content: string; type: string } | null = null;
let cachedEnvAttachmentChecked = false;

async function loadProgramPdfAttachment(
  campusSlug: string | null | undefined,
  campusProgramPdfUrl: string | null | undefined,
): Promise<
  Array<{ filename: string; content: string; encoding?: string; type?: string }> | undefined
> {
  // Path 1: per-campus admin override URL.
  if (campusProgramPdfUrl) {
    const cached = cachedCustomPdfByUrl.get(campusProgramPdfUrl);
    if (cached) {
      return [
        {
          filename: cached.filename,
          content: cached.content,
          encoding: "base64",
          type: cached.type,
        },
      ];
    }
    try {
      const res = await fetch(campusProgramPdfUrl);
      if (res.ok) {
        const buf = await res.arrayBuffer();
        const filename =
          decodeURIComponent(
            campusProgramPdfUrl.split("/").pop() ?? "",
          ).split("?")[0] || "program.pdf";
        const entry = {
          filename,
          content: Buffer.from(buf).toString("base64"),
          type: res.headers.get("content-type") ?? "application/pdf",
        };
        cachedCustomPdfByUrl.set(campusProgramPdfUrl, entry);
        return [
          {
            filename: entry.filename,
            content: entry.content,
            encoding: "base64",
            type: entry.type,
          },
        ];
      }
    } catch (err) {
      console.error("[email-send] campus override PDF fetch failed:", err);
      // fall through to code-defined config
    }
  }

  // Path 2: code-defined Program PDF — the campus-specific config when one
  // exists, else the generic floor config (the standard brochure). This mirrors
  // the API route + launch guard: a flyer always resolves so emails never ship
  // without the promised attachment.
  const effectiveSlug =
    campusSlug && getProgramPdfConfig(campusSlug) ? campusSlug : GENERIC_SLUG;
  {
    const cached = cachedProgramPdfBySlug.get(effectiveSlug);
    if (cached) {
      return [
        {
          filename: cached.filename,
          content: cached.content,
          encoding: "base64",
          type: "application/pdf",
        },
      ];
    }
    try {
      const buf = await renderProgramPdf(effectiveSlug);
      const content = buf.toString("base64");
      const filename = programPdfFilename(effectiveSlug);
      cachedProgramPdfBySlug.set(effectiveSlug, { content, filename });
      return [
        {
          filename,
          content,
          encoding: "base64",
          type: "application/pdf",
        },
      ];
    } catch (err) {
      console.error("[email-send] program PDF render failed:", err);
      // fall through to env-var path
    }
  }

  // Path 3: env-var generic flyer (legacy fallback).
  if (!FLYER_URL) return undefined;
  if (cachedEnvAttachmentChecked && cachedEnvAttachment) {
    return [
      {
        filename: FLYER_FILENAME,
        content: cachedEnvAttachment.content,
        encoding: "base64",
        type: cachedEnvAttachment.type,
      },
    ];
  }
  cachedEnvAttachmentChecked = true;
  try {
    const res = await fetch(FLYER_URL);
    if (!res.ok) return undefined;
    const buf = await res.arrayBuffer();
    cachedEnvAttachment = {
      content: Buffer.from(buf).toString("base64"),
      type: res.headers.get("content-type") ?? "application/pdf",
    };
    return [
      {
        filename: FLYER_FILENAME,
        content: cachedEnvAttachment.content,
        encoding: "base64",
        type: cachedEnvAttachment.type,
      },
    ];
  } catch {
    return undefined;
  }
}

// bodyToHtml moved to ./email-markdown (shared with the Smartlead cold
// path so both channels render identical HTML); imported above.

/**
 * v9 final: HTML footer composer. Appended after the email body
 * on every send. Six-block stack in the order the user wants
 * recipients to read it:
 *
 *   1. "Best, Graize"               (warm sign-off, inline)
 *   2. Graize Belandres signature   (photo + role + contact)
 *   3. Divider line
 *   4. "Message Approved by Dr. Logan DuBose, MD/MBA"
 *   5. Dr. Logan DuBose signature   (photo + credentials)
 *   6. "Reply STOP …"               (compliance line, smallest)
 *
 * Single source of truth — template bodies don't include any of
 * these. Keeps email chrome consistent across every variant and
 * decouples the sender identity from cadence copy edits.
 */
function composeFooterHtml(): string {
  return [
    // 1+2: warm sign-off + Graize block. Sits directly under the
    //      body so the email reads like a real note from Graize,
    //      not a marketing footer.
    `<p style="margin:16px 0 4px;font-size:13px;line-height:1.5;color:#374151;font-family:Inter,Arial,sans-serif;">Best,</p>`,
    `<p style="margin:0;font-size:13px;line-height:1.5;color:#374151;font-family:Inter,Arial,sans-serif;">Graize</p>`,
    grazieSignatureHtml(),
    // 3: divider — separates the sender identity from the
    //    "approved by" attribution + principal signature.
    `<hr style="margin:20px 0;border:none;border-top:1px solid #e5e7eb;" />`,
    // 4+5: Approved-by line + Logan block.
    `<p style="margin:0 0 8px;font-size:12px;line-height:1.5;color:#6b7280;font-family:Inter,Arial,sans-serif;">Message Approved by Dr. Logan DuBose, MD/MBA</p>`,
    loganSignatureHtml(),
    // 6: compliance line — bottom, smallest, gray.
    `<p style="margin:24px 0 0;font-size:11px;line-height:1.5;color:#9ca3af;font-family:Inter,Arial,sans-serif;">Reply STOP if you would like us to stop reaching out.</p>`,
  ].join("\n");
}

/**
 * v9 final: plain-text version of the footer for the text/* MIME
 * alternative. Resend sends html + text together for accessibility
 * and spam-score reasons; both must match conceptually.
 */
function composeFooterText(): string {
  return [
    ``,
    `Best,`,
    `Graize`,
    ``,
    `Graize Belandres`,
    `Research Assistant to Dr. Logan DuBose`,
    `Program flyer: ${PROGRAM_URL}`,
    ``,
    `---`,
    `Message Approved by Dr. Logan DuBose, MD/MBA`,
    ``,
    `Dr. Logan DuBose, MD, MBA`,
    `Chief Research Officer (CRO), Olera`,
    `Researcher funded by the National Institutes of Health Small Business Innovation Research (SBIR) Program`,
    `Texas A&M College of Medicine, Class of 2022`,
    `General Practitioner, Fredericksburg Christian Health Clinic, Virginia`,
    `Director, Student Caregiver Program (${PROGRAM_URL})`,
    `Schedule a meeting: ${CALENDLY_URL}`,
    ``,
    `Reply STOP if you would like us to stop reaching out.`,
  ].join("\n");
}

/**
 * Dr. Logan DuBose signature block. Photo + credentials + Calendly
 * CTA. Carries the trust scaffolding (CRO title, NIH SBIR funding,
 * clinical practice) and folds the program URL into the directorship
 * line so it lives in the signature instead of the body copy.
 */
function loganSignatureHtml(): string {
  const photoUrl = LOGAN_PHOTO_URL;
  return `
<table cellpadding="0" cellspacing="0" style="margin-top:16px;">
  <tr>
    <td style="vertical-align:top;padding-right:16px;">
      <img src="${photoUrl}" alt="Dr. Logan DuBose" width="100" height="100" style="border-radius:8px;display:block;" />
    </td>
    <td style="vertical-align:top;font-size:13px;line-height:1.5;color:#374151;font-family:Inter,Arial,sans-serif;">
      <p style="margin:0 0 4px;font-weight:600;color:#111827;">Dr. Logan DuBose, MD, MBA</p>
      <p style="margin:0 0 2px;">Chief Research Officer (CRO), <a href="https://www.olera.care" style="color:#059669;">Olera</a></p>
      <p style="margin:0 0 2px;">Researcher funded by the National Institutes of Health Small Business Innovation Research (SBIR) Program</p>
      <p style="margin:0 0 2px;">Texas A&amp;M College of Medicine, Class of 2022</p>
      <p style="margin:0 0 2px;">General Practitioner, Fredericksburg Christian Health Clinic, Virginia</p>
      <p style="margin:0 0 8px;">Director, <a href="${PROGRAM_URL}" style="color:#059669;">Student Caregiver Program</a></p>
      <p style="margin:0;">
        <a href="${CALENDLY_URL}" style="color:#059669;font-weight:500;">Schedule a meeting with Dr. DuBose →</a>
      </p>
    </td>
  </tr>
</table>`;
}

/**
 * Graize Belandres signature block. Sender identity — photo +
 * "Research Assistant to Dr. Logan DuBose" + program link + email.
 * Distinct from Dr. DuBose's block above (Graize is the operator;
 * Dr. DuBose is the principal admin is being introduced to).
 *
 * Headshot URL follows the same /images/for-providers/team/ path
 * as logan.jpg — upload the actual file at that path; the URL
 * stays stable across env. If the file isn't on the CDN yet, the
 * <img> tag still renders (broken-image fallback); recipient still
 * sees the text block, no copy is lost.
 */
function grazieSignatureHtml(): string {
  const photoUrl = GRAZIE_PHOTO_URL;
  return `
<table cellpadding="0" cellspacing="0" style="margin-top:6px;">
  <tr>
    <td style="vertical-align:top;padding-right:16px;">
      <img src="${photoUrl}" alt="Graize Belandres" width="100" height="100" style="border-radius:8px;display:block;" />
    </td>
    <td style="vertical-align:top;font-size:13px;line-height:1.5;color:#374151;font-family:Inter,Arial,sans-serif;">
      <p style="margin:0 0 4px;font-weight:600;color:#111827;">Graize Belandres</p>
      <p style="margin:0 0 2px;">Research Assistant to Dr. Logan DuBose</p>
      <p style="margin:0;"><a href="${PROGRAM_URL}" style="color:#059669;">Program flyer</a></p>
    </td>
  </tr>
</table>`;
}

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

export async function sendOutreachEmail(
  input: SendOutreachEmailInput,
): Promise<SendOutreachEmailResult> {
  const attachments = await loadProgramPdfAttachment(
    input.campus_slug ?? null,
    input.campus_program_pdf_url ?? null,
  );

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
    const vars = {
      first_name: firstName,
      salutation,
      ...staticVars,
      calendly_url: CALENDLY_URL,
      program_url: PROGRAM_URL,
    };
    const subject = substituteVars(input.subject, vars);
    const body = substituteVars(input.body, vars);
    // Body markdown → HTML, then append the canonical footer
    // (divider + STOP + Approved by + Logan signature + Graize
    // signature). Footer is composed once in composeFooterHtml;
    // body never carries any signature copy.
    const html = bodyToHtml(body) + composeFooterHtml();

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
