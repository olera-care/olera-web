/**
 * One-click magic-link failure telemetry.
 *
 * The email otk → validate-token → auto-sign-in → verifyOtp → finalize
 * pipeline used to fail silently (console.warn in the provider's browser).
 * Every failure hop now writes a `one_click_failed` provider_activity row so
 * the drop-off between "clicked the email" and "signed in + claimed" is
 * attributable to a specific stage and reason.
 *
 * Requires migration 155 (one_click_failed in the event_type allowlist).
 */

import { createClient } from "@supabase/supabase-js";
import { sendSlackAlert, slackOneClickFailed } from "@/lib/slack";

export type OneClickFailureStage =
  | "validate_token"
  | "auto_sign_in"
  | "finalize"
  | "client_auto_sign_in_http"
  | "client_verify_otp"
  | "client_finalize_http"
  | "client_exception";

export function maskEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  const maskedLocal =
    local.length <= 2 ? "*".repeat(local.length) : local[0] + "***" + local[local.length - 1];
  return `${maskedLocal}@${domain}`;
}

/**
 * Record a one-click pipeline failure. Never throws — telemetry must not
 * break the flow it observes. Await it in serverless routes (Vercel kills
 * pending promises after the response returns).
 */
export async function logOneClickFailed(params: {
  providerId?: string | null;
  stage: OneClickFailureStage;
  reason: string;
  action?: string | null;
  actionId?: string | null;
  email?: string | null;
}): Promise<void> {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) return;
    const db = createClient(url, serviceKey);

    const { error } = await db.from("provider_activity").insert({
      provider_id: params.providerId || "unknown",
      event_type: "one_click_failed",
      metadata: {
        stage: params.stage,
        reason: params.reason,
        action: params.action || null,
        action_id: params.actionId || null,
        email_masked: maskEmail(params.email),
      },
    });
    if (error) {
      console.error("[one-click-telemetry] insert failed:", error.message);
    }

    // Real-time visibility: every failure pings Slack (awaited — Vercel kills
    // pending promises after the response). Client stages alert from
    // /api/activity/track instead, so no failure double-pings.
    try {
      const alert = slackOneClickFailed({
        providerSlug: params.providerId || "unknown",
        stage: params.stage,
        reason: params.reason,
        action: params.action,
        emailMasked: maskEmail(params.email),
      });
      await sendSlackAlert(alert.text, alert.blocks);
    } catch (slackErr) {
      console.error("[one-click-telemetry] Slack alert failed:", slackErr);
    }
  } catch (err) {
    console.error("[one-click-telemetry] error:", err);
  }
}
