import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Click attribution for texts.
 *
 * Texts carry a link to the family's plan page, and until now an arrival there
 * was unattributable: /m/{token} bumped a single overwritten last_viewed_at, so
 * 225 of 362 families had "viewed at some point" and nothing said which message
 * sent them or how many times. The Clicked column on /admin/automations was a
 * dash for every text row because nothing ever wrote first_clicked_at.
 *
 * The mechanism is a one-character marker on the link (?s=f) resolved back to
 * an email_type on arrival. Kept to three characters total because SMS bodies
 * are length-budgeted and the plan URL is already long.
 *
 * Email is deliberately NOT marked this way. Apple Mail rewrites links and
 * strips parameters, so a marker there is unreliable; Resend's own click
 * webhook already fills first_clicked_at for email
 * (lib/resend-events.ts). This exists because SMS has no equivalent.
 */

/**
 * email_type → URL marker. Values are single characters and must stay stable:
 * a link already sent to a family carries the old code forever.
 */
const SOURCE_CODES: Record<string, string> = {
  benefits_results_sms: "r",
  benefits_first_step_sms: "f",
  benefits_check_in_sms: "c",
  benefits_concierge_reply_sms: "n",
};

const EMAIL_TYPE_BY_CODE: Record<string, string> = Object.fromEntries(
  Object.entries(SOURCE_CODES).map(([type, code]) => [code, type]),
);

/** The query parameter carrying the marker. One letter, for SMS length. */
export const SMS_SOURCE_PARAM = "s";

/**
 * Tag a plan link so an arrival can be attributed to the text that sent it.
 * Returns the URL unchanged for an email_type with no code, so an untagged
 * caller degrades to today's behaviour rather than producing a broken link.
 */
export function withSmsSource(url: string, emailType: string): string {
  const code = SOURCE_CODES[emailType];
  if (!code) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}${SMS_SOURCE_PARAM}=${code}`;
}

/** Marker back to the email_type that sent it, or null if unrecognized. */
export function emailTypeForSmsSource(code: string | null | undefined): string | null {
  if (!code || typeof code !== "string") return null;
  return EMAIL_TYPE_BY_CODE[code] ?? null;
}

/**
 * Stamp first_clicked_at on the send this arrival came from.
 *
 * Matching: the newest unclicked SMS row for this family of this email_type.
 * The link cannot carry the email_log row id because the URL is built before
 * the row exists, so profile + type + recency is the available join. A family
 * receiving two of the same rung days apart would attribute a late click to
 * the newer send; that is the known imprecision, and it is bounded because the
 * rung types are sent on a cadence rather than in bursts.
 *
 * Write-once, mirroring the email path (lib/resend-events.ts): a second visit
 * leaves the first click time alone, so the column means "first arrival" on
 * both channels rather than "most recent" on one.
 *
 * Fire-and-forget at the call site. Supabase resolves with {data, error}
 * rather than rejecting, so errors are read explicitly.
 */
export async function recordSmsClick(
  client: SupabaseClient,
  opts: { profileId: string; sourceCode: string | null | undefined },
): Promise<void> {
  const emailType = emailTypeForSmsSource(opts.sourceCode);
  if (!emailType || !opts.profileId) return;

  const { data: row, error: findErr } = await client
    .from("email_log")
    .select("id")
    .eq("channel", "sms")
    .eq("email_type", emailType)
    .eq("provider_id", opts.profileId)
    .is("first_clicked_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (findErr) {
    console.error("[sms-click] lookup failed:", findErr.message);
    return;
  }
  // No unclicked send of this type: either already attributed, or the send
  // predates click tracking. Both are expected, neither is an error.
  if (!row) return;

  const { error: updateErr } = await client
    .from("email_log")
    .update({ first_clicked_at: new Date().toISOString() })
    .eq("id", row.id);
  if (updateErr) console.error("[sms-click] update failed:", updateErr.message);
}
