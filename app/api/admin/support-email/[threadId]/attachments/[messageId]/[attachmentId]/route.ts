import { NextRequest, NextResponse } from "next/server";
import { getAdminUser, getAuthUser, getServiceClient } from "@/lib/admin";
import { decryptGmailToken } from "@/lib/support-email/crypto.server";
import { getGmailAttachment, gmailAccessToken } from "@/lib/support-email/gmail.server";

interface Context {
  params: Promise<{ threadId: string; messageId: string; attachmentId: string }>;
}

interface StoredAttachment {
  attachmentId?: string | null;
  filename?: string;
  mimeType?: string;
  size?: number;
}

const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024;
const SAFE_INLINE_TYPES = new Set([
  "application/pdf",
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/plain",
]);

function safeFilename(value: string): string {
  return value.replace(/["\\\r\n]/g, "_").replace(/[^\x20-\x7E]/g, "_").slice(0, 180) || "attachment";
}

export async function GET(request: NextRequest, context: Context) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const admin = await getAdminUser(user.id);
  if (!admin) return NextResponse.json({ error: "Access denied" }, { status: 403 });

  try {
    const { threadId, messageId, attachmentId } = await context.params;
    const db = getServiceClient();
    const [{ data: thread, error: threadError }, { data: message, error: messageError }] = await Promise.all([
      db.from("support_email_threads").select("mailbox_id, support_mailboxes(encrypted_refresh_token)").eq("id", threadId).single(),
      db.from("support_email_messages").select("gmail_message_id, attachments").eq("id", messageId).eq("thread_id", threadId).single(),
    ]);
    if (threadError || !thread) throw threadError ?? new Error("Thread not found");
    if (messageError || !message) throw messageError ?? new Error("Message not found");

    const attachments = (message.attachments ?? []) as StoredAttachment[];
    const metadata = attachments.find((attachment) => attachment.attachmentId === attachmentId);
    if (!metadata) return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
    if ((metadata.size ?? 0) > MAX_ATTACHMENT_BYTES) {
      return NextResponse.json({ error: "Attachment is too large to open here" }, { status: 413 });
    }

    const mailbox = Array.isArray(thread.support_mailboxes)
      ? thread.support_mailboxes[0]
      : thread.support_mailboxes;
    const encryptedToken = mailbox?.encrypted_refresh_token;
    if (!encryptedToken) throw new Error("This mailbox is not connected to Gmail.");
    const accessToken = await gmailAccessToken(decryptGmailToken(encryptedToken));
    const attachment = await getGmailAttachment(accessToken, String(message.gmail_message_id), attachmentId);
    const bytes = Buffer.from(attachment.data, "base64url");
    if (bytes.byteLength > MAX_ATTACHMENT_BYTES) {
      return NextResponse.json({ error: "Attachment is too large to open here" }, { status: 413 });
    }

    const filename = safeFilename(metadata.filename ?? "attachment");
    const mimeType = metadata.mimeType || "application/octet-stream";
    const canRenderInline = mimeType.startsWith("audio/") || SAFE_INLINE_TYPES.has(mimeType);
    const disposition = request.nextUrl.searchParams.get("download") === "1" || !canRenderInline ? "attachment" : "inline";
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": mimeType,
        "Content-Length": String(bytes.byteLength),
        "Content-Disposition": `${disposition}; filename="${filename}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err) {
    console.error("[support-email] attachment failed:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Could not load attachment" }, { status: 500 });
  }
}
