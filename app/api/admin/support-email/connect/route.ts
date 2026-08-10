import { NextRequest, NextResponse } from "next/server";
import { getAdminUser, getAuthUser } from "@/lib/admin";
import { gmailOAuthRedirectUri, gmailOAuthUrl } from "@/lib/support-email/gmail.server";
import { createGmailOAuthState } from "@/lib/support-email/oauth-state.server";

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const admin = await getAdminUser(user.id);
  if (!admin) return NextResponse.json({ error: "Access denied" }, { status: 403 });
  try {
    const redirectUri = gmailOAuthRedirectUri(request.nextUrl.origin);
    return NextResponse.redirect(gmailOAuthUrl({
      redirectUri,
      state: createGmailOAuthState(user.id),
    }));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gmail OAuth is not configured";
    return NextResponse.redirect(`${request.nextUrl.origin}/admin/support-email?error=${encodeURIComponent(message)}`);
  }
}
