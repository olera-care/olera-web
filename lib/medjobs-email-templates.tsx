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
  const completeProfileUrl = magicLink || `${BASE_URL}/portal/medjobs`;

  const universityBlock = university
    ? `<table cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:8px;padding:16px;width:100%;margin:0 0 16px;">
      <tr><td>
        <p style="font-size:13px;color:#6b7280;margin:0 0 4px;">University</p>
        <p style="font-size:15px;color:#111827;font-weight:600;margin:0;">${university}</p>
      </td></tr>
    </table>`
    : "";

  return layout(`
    <h2 style="font-size:20px;font-weight:700;color:#111827;margin:0 0 8px;">Welcome to MedJobs, ${studentName}!</h2>
    <p style="font-size:14px;color:#6b7280;margin:0 0 16px;line-height:1.6;">
      Your account has been created. Your profile is <strong>not yet visible</strong> to providers.
      Complete the steps below to activate it.
    </p>
    ${universityBlock}
    <p style="font-size:14px;color:#6b7280;margin:0 0 8px;line-height:1.6;">
      <strong>To activate your profile:</strong>
    </p>
    <ol style="font-size:14px;color:#6b7280;margin:0 0 20px;padding-left:20px;line-height:1.8;">
      <li><strong>Complete your application</strong></li>
      <li><strong>Submit your intro video</strong></li>
      <li><strong>Upload driver&apos;s license</strong></li>
      <li><strong>Upload car insurance</strong></li>
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

/**
 * Sent immediately when Step 1 of onboarding creates an account (partial creation).
 * Purpose: orient the user, explain MedJobs, drive them back to complete their profile.
 */
export function studentAccountCreatedEmail({
  studentName,
  city,
}: {
  studentName: string;
  city?: string;
}): string {
  const firstName = studentName.split(" ")[0];
  const locationLine = city ? ` in ${city}` : "";

  return layout(`
    <h2 style="font-size:20px;font-weight:700;color:#111827;margin:0 0 8px;">Welcome to MedJobs, ${firstName}!</h2>
    <p style="font-size:14px;color:#6b7280;margin:0 0 16px;line-height:1.6;">
      Your account has been created. You&rsquo;re one step closer to connecting with healthcare providers${locationLine} who are actively hiring student caregivers.
    </p>
    <table cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:8px;padding:16px;width:100%;margin:0 0 16px;">
      <tr><td>
        <p style="font-size:13px;font-weight:600;color:#111827;margin:0 0 8px;">What is MedJobs?</p>
        <p style="font-size:13px;color:#6b7280;margin:0;line-height:1.6;">
          MedJobs connects pre-health students with home care agencies and healthcare providers who need reliable caregivers. A complete, verified profile is how providers find and reach out to you.
        </p>
      </td></tr>
    </table>
    <p style="font-size:14px;color:#6b7280;margin:0 0 8px;line-height:1.6;">
      <strong>Complete your profile to get started.</strong> It takes about 10 minutes and includes a short video, availability, and a few questions that show providers you&rsquo;re serious.
    </p>
    <p style="font-size:14px;color:#6b7280;margin:0 0 20px;line-height:1.6;">
      Providers reviewing candidates prioritize complete profiles. The more thorough your profile, the more likely you are to hear from hiring providers.
    </p>
    <p style="margin:0 0 16px;">
      ${button("Complete My Profile", `${BASE_URL}/portal/medjobs`)}
    </p>
  `);
}

/**
 * Sent when a student's profile reaches 100% completeness.
 * Celebrates, tells them they're live, encourages proactive outreach.
 */
export function studentActivationEmail({
  studentName,
  city,
  profileUrl,
}: {
  studentName: string;
  city?: string;
  profileUrl: string;
}): string {
  const firstName = studentName.split(" ")[0];
  const locationLine = city ? ` in ${city}` : "";

  return layout(`
    <h2 style="font-size:20px;font-weight:700;color:#111827;margin:0 0 8px;">Your profile is live, ${firstName}!</h2>
    <p style="font-size:14px;color:#6b7280;margin:0 0 16px;line-height:1.6;">
      Congratulations — your MedJobs profile is 100% complete and verified. Providers${locationLine} can now find you and reach out via the platform, email, or phone.
    </p>
    <table cellpadding="0" cellspacing="0" style="background:#f0fdf4;border-radius:8px;padding:16px;width:100%;margin:0 0 16px;">
      <tr><td>
        <p style="font-size:13px;font-weight:600;color:#166534;margin:0 0 8px;">What happens now?</p>
        <ol style="font-size:13px;color:#166534;margin:0;padding-left:16px;line-height:1.8;">
          <li>Providers can view your profile and reach out to you</li>
          <li>You can browse open positions and apply directly</li>
          <li>Reaching out to providers directly often leads to conversations faster</li>
        </ol>
      </td></tr>
    </table>
    <p style="font-size:14px;color:#6b7280;margin:0 0 8px;line-height:1.6;">
      <strong>Your profile link:</strong>
    </p>
    <p style="font-size:13px;margin:0 0 20px;">
      <a href="${profileUrl}" style="color:${BRAND_COLOR};">${profileUrl}</a>
    </p>
    <p style="font-size:14px;color:#6b7280;margin:0 0 20px;line-height:1.6;">
      Share this link when reaching out to providers — it shows your video, availability, and background at a glance.
    </p>
    <p style="margin:0 0 16px;">
      ${button("Browse Open Jobs", `${BASE_URL}/portal/medjobs/jobs`)}
    </p>
  `);
}

export function studentReturningEmail({
  studentName,
  profileSlug,
  magicLink,
}: {
  studentName: string;
  profileSlug: string;
  magicLink?: string;
}): string {
  const completeProfileUrl = magicLink || `${BASE_URL}/portal/medjobs`;

  return layout(`
    <h2 style="font-size:20px;font-weight:700;color:#111827;margin:0 0 8px;">Welcome back, ${studentName}!</h2>
    <p style="font-size:14px;color:#6b7280;margin:0 0 16px;line-height:1.6;">
      Looks like you already started an application. Your profile is still waiting for you &mdash; pick up where you left off.
    </p>
    <p style="margin:0 0 16px;">
      ${button("Continue Your Profile", completeProfileUrl)}
    </p>
    <p style="font-size:13px;color:#9ca3af;margin:0;line-height:1.6;">
      If you didn&apos;t request this, you can safely ignore this email.
    </p>
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
