/**
 * ReplyBlock — the email-reply counterpart to CallScriptBlock.
 *
 * Renders the provider's actual incoming reply (captured by the Smartlead
 * webhook into the email_replied touchpoint payload) in the same grey box the
 * call script uses, so the Email outcome modal reads identically to the Call
 * one: context up top, outcome cards below. When no reply has landed yet it
 * shows a quiet empty state instead, keeping the next step obvious either way.
 */

type Reply = { created_at: string; payload: Record<string, unknown> | null } | null;

export function ReplyBlock({ reply }: { reply: Reply }) {
  const p = reply?.payload ?? {};
  const previewRaw =
    (typeof p.preview_text === "string" && p.preview_text.trim()) ||
    (typeof p.reply_body === "string"
      ? p.reply_body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
      : "");
  const preview = previewRaw ? previewRaw.slice(0, 600) : "";
  // Show the PROVIDER's address (the lead email Smartlead captured as
  // recipient_email), not from_email — Smartlead's reply payload puts our own
  // campaign sender in from_email, which would mislabel the reply as ours.
  const from =
    (typeof p.recipient_email === "string" && p.recipient_email.trim()) ||
    (typeof p.from_email === "string" && p.from_email.trim()) ||
    null;

  return (
    <section className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
        {reply ? `✉ They replied${from ? ` · ${from}` : ""}` : "✉ Reply"}
      </p>
      {reply ? (
        preview ? (
          <p className="mt-1 whitespace-pre-wrap font-sans text-[12px] leading-relaxed text-gray-700">
            {preview}
            {previewRaw.length > 600 ? "…" : ""}
          </p>
        ) : (
          <p className="mt-1 text-[12px] leading-relaxed text-gray-500">
            Reply received — open Smartlead to read the full message.
          </p>
        )
      ) : (
        <p className="mt-1 text-[12px] leading-relaxed text-gray-500">
          No reply yet — open Smartlead to check the full thread.
        </p>
      )}
    </section>
  );
}
