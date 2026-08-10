import { NextRequest, NextResponse } from "next/server";
import { getAdminUser, getAuthUser, getServiceClient } from "@/lib/admin";
import { encryptGmailToken } from "@/lib/support-email/crypto.server";
import { exchangeGmailCode, getGmailProfile, gmailOAuthRedirectUri, watchGmail } from "@/lib/support-email/gmail.server";
import { verifyGmailOAuthState } from "@/lib/support-email/oauth-state.server";

function back(request: NextRequest, params: Record<string, string>) {
  const url = new URL("/admin/support-email", request.nextUrl.origin);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return back(request, { error: "Sign in again before connecting Gmail." });
  const admin = await getAdminUser(user.id);
  if (!admin) return back(request, { error: "Admin access is required." });
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const oauthError = request.nextUrl.searchParams.get("error");
  if (oauthError) return back(request, { error: `Google declined the connection: ${oauthError}` });
  if (!code || !state || !verifyGmailOAuthState(state, user.id)) {
    return back(request, { error: "The Gmail connection expired or could not be verified." });
  }

  try {
    const redirectUri = gmailOAuthRedirectUri(request.nextUrl.origin);
    const token = await exchangeGmailCode(code, redirectUri);
    if (!token.refresh_token) throw new Error("Google did not return a refresh token. Reconnect and approve mailbox access.");
    const profile = await getGmailProfile(token.access_token);
    const db = getServiceClient();
    const { data: existing } = await db
      .from("support_mailboxes")
      .select("id, gmail_history_id")
      .eq("email", profile.emailAddress.toLowerCase())
      .maybeSingle();
    const now = new Date().toISOString();
    const base = {
      email: profile.emailAddress.toLowerCase(),
      encrypted_refresh_token: encryptGmailToken(token.refresh_token),
      oauth_scopes: (token.scope ?? "").split(" ").filter(Boolean),
      sync_status: existing ? "connected" : "backfilling",
      gmail_history_id: existing?.gmail_history_id ?? profile.historyId,
      connected_by: admin.email,
      last_error: null,
      updated_at: now,
    };
    let mailboxId: string;
    if (existing) {
      const { error } = await db.from("support_mailboxes").update(base).eq("id", existing.id);
      if (error) throw error;
      mailboxId = String(existing.id);
    } else {
      const { data, error } = await db.from("support_mailboxes").insert(base).select("id").single();
      if (error || !data) throw error ?? new Error("Could not create support mailbox");
      mailboxId = String(data.id);
    }

    const topic = process.env.GMAIL_PUBSUB_TOPIC;
    if (topic) {
      try {
        const watch = await watchGmail(token.access_token, topic);
        const watchUpdate: Record<string, unknown> = {
          watch_expiration: new Date(Number(watch.expiration)).toISOString(),
        };
        // A watch response is a new notification baseline, not proof that an
        // already-connected mailbox has consumed everything before it. Preserve
        // the existing cursor so the next sync closes that interval safely.
        if (!existing?.gmail_history_id) watchUpdate.gmail_history_id = watch.historyId;
        const { error } = await db.from("support_mailboxes").update(watchUpdate).eq("id", mailboxId);
        if (error) throw error;
      } catch (err) {
        console.error("[support-email] Gmail connected but watch failed:", err);
        await db.from("support_mailboxes").update({
          last_error: "Gmail connected; push watch is unavailable, so polling will keep it synchronized.",
        }).eq("id", mailboxId);
      }
    }
    return back(request, { connected: profile.emailAddress });
  } catch (err) {
    console.error("[support-email] OAuth callback failed:", err);
    return back(request, { error: err instanceof Error ? err.message : "Gmail connection failed." });
  }
}
