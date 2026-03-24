/**
 * MedJobs email templates — follows the same pattern as lib/email-templates.tsx.
 * Kept separate for modularity (design constraint #3).
 */

const BRAND_COLOR = "#198087";
const FONT_STACK =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://olera.care";

function layout(body: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:${FONT_STACK};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 0;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:480px;width:100%;">
        <!-- Header -->
        <tr><td style="padding:24px 32px 16px;">
          <span style="font-size:18px;font-weight:700;color:${BRAND_COLOR};letter-spacing:-0.3px;">Olera MedJobs</span>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:0 32px 32px;">
          ${body}
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:16px 32px;border-top:1px solid #f3f4f6;">
          <p style="font-size:12px;color:#9ca3af;margin:0;">
            &copy; ${new Date().getFullYear()} Olera &middot;
            <a href="${BASE_URL}/medjobs" style="color:#9ca3af;">Olera MedJobs</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function button(label: string, href: string): string {
  return `<a href="${href}" style="display:inline-block;padding:12px 24px;background:${BRAND_COLOR};color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;">${label}</a>`;
}

// ── Student Templates ────────────────────────────────────────────

export function studentWelcomeEmail({
  studentName,
  university,
  profileSlug,
  magicLink,
}: {
  studentName: string;
  university: string;
  profileSlug: string;
  magicLink?: string;
}): string {
  const completeProfileUrl = magicLink || `${BASE_URL}/medjobs/submit-video?slug=${profileSlug}`;

  return layout(`
    <h2 style="font-size:20px;font-weight:700;color:#111827;margin:0 0 8px;">Welcome to MedJobs, ${studentName}!</h2>
    <p style="font-size:14px;color:#6b7280;margin:0 0 16px;line-height:1.6;">
      Your account has been created. Your profile is <strong>not yet visible</strong> to providers.
      Complete the steps below to activate it.
    </p>
    <table cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:8px;padding:16px;width:100%;margin:0 0 16px;">
      <tr><td>
        <p style="font-size:13px;color:#6b7280;margin:0 0 4px;">University</p>
        <p style="font-size:15px;color:#111827;font-weight:600;margin:0;">${university}</p>
      </td></tr>
    </table>
    <p style="font-size:14px;color:#6b7280;margin:0 0 8px;line-height:1.6;">
      <strong>To activate your profile:</strong>
    </p>
    <ol style="font-size:14px;color:#6b7280;margin:0 0 20px;padding-left:20px;line-height:1.8;">
      <li><strong>Submit your intro video</strong> (required)</li>
      <li><strong>Upload driver&apos;s license</strong> (required)</li>
      <li><strong>Upload car insurance</strong> (required)</li>
    </ol>
    <p style="margin:0 0 16px;">
      ${button("Complete Your Profile", completeProfileUrl)}
    </p>
    <table cellpadding="0" cellspacing="0" style="background:#f0fdf4;border-radius:8px;padding:16px;width:100%;margin:0 0 4px;">
      <tr><td>
        <p style="font-size:13px;font-weight:600;color:#166534;margin:0 0 6px;">What happens next?</p>
        <ol style="font-size:13px;color:#166534;margin:0;padding-left:16px;line-height:1.8;">
          <li>Complete the steps above to activate your profile</li>
          <li>Providers in your area will be able to view your profile</li>
          <li>You&apos;ll receive an email when a provider is interested</li>
        </ol>
      </td></tr>
    </table>
  `);
}

export function applicationReceivedEmail({
  providerName,
  studentName,
  university,
  programTrack,
  profileSlug,
}: {
  providerName: string;
  studentName: string;
  university: string;
  programTrack: string;
  profileSlug: string;
}): string {
  return layout(`
    <h2 style="font-size:20px;font-weight:700;color:#111827;margin:0 0 8px;">New Student Application</h2>
    <p style="font-size:14px;color:#6b7280;margin:0 0 16px;line-height:1.6;">
      Hi ${providerName}, a student has applied to work with you through Olera MedJobs.
    </p>
    <table cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:8px;padding:16px;width:100%;margin:0 0 16px;">
      <tr><td>
        <p style="font-size:15px;color:#111827;font-weight:600;margin:0 0 8px;">${studentName}</p>
        <p style="font-size:13px;color:#6b7280;margin:0 0 4px;">${university}</p>
        <p style="font-size:13px;color:#6b7280;margin:0;">${programTrack}</p>
      </td></tr>
    </table>
    <p style="margin:0;">
      ${button("View Candidate", `${BASE_URL}/medjobs/candidates/${profileSlug}`)}
    </p>
  `);
}

export function applicationSentEmail({
  studentName,
  providerName,
}: {
  studentName: string;
  providerName: string;
}): string {
  return layout(`
    <h2 style="font-size:20px;font-weight:700;color:#111827;margin:0 0 8px;">Application Sent!</h2>
    <p style="font-size:14px;color:#6b7280;margin:0 0 16px;line-height:1.6;">
      Hi ${studentName}, your application to <strong>${providerName}</strong> has been sent.
      They&apos;ll receive your profile and can reach out if interested.
    </p>
    <p style="font-size:14px;color:#6b7280;margin:0 0 16px;line-height:1.6;">
      In the meantime, make sure your profile is complete &mdash; students with resumes
      and video intros get 3x more responses.
    </p>
    <p style="margin:0;">
      ${button("View Your Profile", `${BASE_URL}/portal/medjobs`)}
    </p>
  `);
}

export function applicationResponseEmail({
  studentName,
  providerName,
  accepted,
}: {
  studentName: string;
  providerName: string;
  accepted: boolean;
}): string {
  const statusText = accepted ? "accepted" : "declined";
  const statusColor = accepted ? "#059669" : "#dc2626";

  return layout(`
    <h2 style="font-size:20px;font-weight:700;color:#111827;margin:0 0 8px;">Application Update</h2>
    <p style="font-size:14px;color:#6b7280;margin:0 0 16px;line-height:1.6;">
      Hi ${studentName}, <strong>${providerName}</strong> has
      <span style="color:${statusColor};font-weight:600;">${statusText}</span>
      your application.
    </p>
    ${accepted ? `
    <p style="font-size:14px;color:#6b7280;margin:0 0 16px;line-height:1.6;">
      They may reach out to you directly to discuss next steps. Check your email and phone for messages.
    </p>
    ` : `
    <p style="font-size:14px;color:#6b7280;margin:0 0 16px;line-height:1.6;">
      Don&apos;t be discouraged &mdash; there are many providers looking for student caregivers.
      Keep your profile updated and keep applying.
    </p>
    `}
    <p style="margin:0;">
      ${button("Browse More Opportunities", `${BASE_URL}/medjobs`)}
    </p>
  `);
}

export function newCandidateAlertEmail({
  providerName,
  candidates,
}: {
  providerName: string;
  candidates: Array<{
    name: string;
    university: string;
    programTrack: string;
    slug: string;
  }>;
}): string {
  const candidateRows = candidates
    .map(
      (c) => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;">
        <p style="font-size:14px;color:#111827;font-weight:600;margin:0;">${c.name}</p>
        <p style="font-size:13px;color:#6b7280;margin:4px 0 0;">${c.university} &middot; ${c.programTrack}</p>
      </td>
      <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;text-align:right;">
        <a href="${BASE_URL}/medjobs/candidates/${c.slug}" style="font-size:13px;color:${BRAND_COLOR};text-decoration:none;font-weight:600;">View</a>
      </td>
    </tr>`
    )
    .join("");

  return layout(`
    <h2 style="font-size:20px;font-weight:700;color:#111827;margin:0 0 8px;">New Candidates This Week</h2>
    <p style="font-size:14px;color:#6b7280;margin:0 0 16px;line-height:1.6;">
      Hi ${providerName}, here are the newest student caregivers near you on Olera MedJobs.
    </p>
    <table cellpadding="0" cellspacing="0" style="width:100%;">
      ${candidateRows}
    </table>
    <p style="margin:20px 0 0;">
      ${button("Browse All Candidates", `${BASE_URL}/medjobs/candidates`)}
    </p>
  `);
}

export function profileIncompleteNudgeEmail({
  studentName,
  completeness,
  missingItems,
}: {
  studentName: string;
  completeness: number;
  missingItems: string[];
}): string {
  const itemsList = missingItems
    .map((item) => `<li>${item}</li>`)
    .join("");

  return layout(`
    <h2 style="font-size:20px;font-weight:700;color:#111827;margin:0 0 8px;">Complete Your Profile</h2>
    <p style="font-size:14px;color:#6b7280;margin:0 0 16px;line-height:1.6;">
      Hi ${studentName}, your MedJobs profile is ${completeness}% complete.
      Students with complete profiles get significantly more responses from providers.
    </p>
    <p style="font-size:14px;color:#6b7280;margin:0 0 8px;font-weight:600;">
      Missing:
    </p>
    <ul style="font-size:14px;color:#6b7280;margin:0 0 20px;padding-left:20px;line-height:1.8;">
      ${itemsList}
    </ul>
    <p style="margin:0;">
      ${button("Complete Your Profile", `${BASE_URL}/portal/medjobs/profile`)}
    </p>
  `);
}
