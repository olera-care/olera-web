// Gmail Pub/Sub receiver. This endpoint deliberately does almost no work:
// validate the deployment secret, decode Google's notification, enqueue the
// mailbox history cursor, acknowledge. The authenticated Vercel cron owns
// Gmail reads, AI, and workflow writes.
//
// Configure the Pub/Sub push endpoint as:
//   https://<project>.supabase.co/functions/v1/gmail-webhook?token=<secret>

import { createClient } from "jsr:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);
const webhookSecret = Deno.env.get("GMAIL_WEBHOOK_SECRET") ?? "";

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return atob(padded);
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const token = new URL(request.url).searchParams.get("token") ?? "";
  if (!webhookSecret || token !== webhookSecret) return new Response("Unauthorized", { status: 401 });
  try {
    const envelope = await request.json() as {
      message?: { data?: string; messageId?: string; publishTime?: string };
    };
    if (!envelope.message?.data) return new Response("Missing Pub/Sub data", { status: 400 });
    const payload = JSON.parse(decodeBase64Url(envelope.message.data)) as {
      emailAddress?: string;
      historyId?: string;
    };
    if (!payload.emailAddress || !payload.historyId) return new Response("Invalid Gmail notification", { status: 400 });
    const { error } = await supabase.from("support_email_events").upsert({
      pubsub_message_id: envelope.message.messageId ?? null,
      mailbox_email: payload.emailAddress.toLowerCase(),
      gmail_history_id: payload.historyId,
      published_at: envelope.message.publishTime ?? null,
    }, { onConflict: "pubsub_message_id", ignoreDuplicates: true });
    if (error) {
      console.error("[gmail-webhook] queue insert failed:", error);
      return new Response("Queue unavailable", { status: 500 });
    }
    return new Response(null, { status: 204 });
  } catch (err) {
    console.error("[gmail-webhook] invalid request:", err);
    return new Response("Invalid request", { status: 400 });
  }
});
