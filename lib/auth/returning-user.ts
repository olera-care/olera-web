import { sendEmail } from "@/lib/email";
import { getSiteUrl } from "@/lib/site-url";

/**
 * Returning-user (existing-account) sign-in for guest-capture flows.
 *
 * SECURITY: Public guest-capture endpoints (connection requests, benefits save,
 * compare/guide save, inline Q&A capture) take an email straight from the request
 * body. When that email belongs to an EXISTING account, minting and returning a
 * session for it is account takeover — anyone who knows the address gets in.
 *
 * So for existing accounts we do NOT mint or return any session material
 * (no access/refresh token, no tokenHash, no action_link to the caller). Instead
 * we email the user a magic link, so a session is only established after they
 * prove control of the inbox. Their submitted data is still attached to their
 * existing account server-side (callers use the returned `userId`).
 *
 * New users keep the instant-session UX — that branch lives in each caller; this
 * helper is only for the existing-account path.
 */
export async function emailReturningUserSignInLink(
  // The Supabase service-role client (admin auth). Typed loosely to avoid
  // importing the generated DB types into this shared helper.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  authClient: any,
  params: {
    /** Normalized (lowercased, trimmed) email of the existing account. */
    email: string;
    /** App path to land on after the user clicks the emailed link. */
    nextPath?: string;
    /** Optional subject override for context-specific copy. */
    subject?: string;
  },
): Promise<{ userId: string | null; emailed: boolean }> {
  const { email } = params;
  const nextPath = params.nextPath || "/portal";
  const siteUrl = getSiteUrl();

  try {
    // generateLink resolves the existing user (we read user.id from it) and
    // produces a magic link. CRITICAL: the link / its token is only ever sent
    // to the inbox below — never returned to the caller.
    const { data: linkData, error } = await authClient.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: {
        redirectTo: `${siteUrl}/auth/magic-link?next=${encodeURIComponent(nextPath)}`,
      },
    });

    const userId: string | null = linkData?.user?.id ?? null;
    const actionLink: string | undefined = linkData?.properties?.action_link;

    if (error || !actionLink) {
      console.error("[returning-user] generateLink failed:", error?.message);
      return { userId, emailed: false };
    }

    await sendEmail({
      to: email,
      subject: params.subject || "Sign in to your Olera account",
      html: returningSignInHtml(actionLink),
      emailType: "returning_signin",
      recipientType: "family",
    });

    return { userId, emailed: true };
  } catch (err) {
    console.error("[returning-user] failed to email sign-in link:", err);
    return { userId: null, emailed: false };
  }
}

function returningSignInHtml(actionLink: string): string {
  return `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #111827; background: #ffffff;">
  <p style="font-size: 15px; line-height: 1.6; margin: 0 0 16px; color: #6b7280;">
    Hi there,
  </p>

  <p style="font-size: 20px; line-height: 1.4; margin: 0 0 8px; color: #111827; font-weight: 600;">
    You already have an Olera account
  </p>

  <p style="font-size: 15px; line-height: 1.6; margin: 0 0 24px; color: #6b7280;">
    We saved what you just submitted to your account. For your security, sign in
    with the button below to pick up where you left off.
  </p>

  <a href="${actionLink}" style="display: inline-block; background: #111827; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 999px; font-weight: 600; font-size: 15px;">
    Sign in to Olera &rarr;
  </a>

  <p style="font-size: 13px; color: #9ca3af; margin: 24px 0 0; line-height: 1.6;">
    If you didn't request this, you can safely ignore this email — no one can
    access your account without this link.
  </p>

  <p style="font-size: 12px; color: #9ca3af; margin: 16px 0 0; line-height: 1.6; border-top: 1px solid #f3f4f6; padding-top: 16px;">
    Olera helps families find and connect with senior care providers. We never sell your info.
  </p>
</div>
  `;
}
