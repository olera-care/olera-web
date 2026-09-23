/**
 * Text out of a shared document.
 *
 * On 2026-09-23 the founder asked Cortex to summarize study feedback that
 * Minh-Nguyet shared in Slack as a Word document. Cortex could find the message
 * and name the file, and nothing more: attachments were stored as a file name.
 * The document usually is the substance; the message around it says "attached".
 *
 * Word, PDF and plain text, capped. Anything else is skipped with a reason, so
 * a skipped file is visible rather than silently absent.
 */
export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
export const MAX_ATTACHMENT_CHARS = 40_000;

export type AttachmentFile = {
  id?: string;
  name?: string;
  title?: string;
  mimetype?: string;
  filetype?: string;
  size?: number;
  url_private_download?: string;
  url_private?: string;
};

export function attachmentKind(file: AttachmentFile): "docx" | "pdf" | "text" | null {
  const type = (file.filetype ?? "").toLowerCase();
  const mime = (file.mimetype ?? "").toLowerCase();
  const name = (file.name ?? "").toLowerCase();
  if (type === "docx" || mime.includes("wordprocessingml") || name.endsWith(".docx")) return "docx";
  if (type === "pdf" || mime === "application/pdf" || name.endsWith(".pdf")) return "pdf";
  if (["text", "markdown", "md", "csv", "plain"].includes(type) || mime.startsWith("text/") || /\.(txt|md|csv)$/.test(name)) return "text";
  return null;
}

export async function extractAttachmentText(bytes: ArrayBuffer, kind: "docx" | "pdf" | "text"): Promise<string> {
  let text = "";
  if (kind === "docx") {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });
    text = result.value;
  } else if (kind === "pdf") {
    const { extractText, getDocumentProxy } = await import("unpdf");
    const pdf = await getDocumentProxy(new Uint8Array(bytes));
    const result = await extractText(pdf, { mergePages: true });
    text = Array.isArray(result.text) ? result.text.join("\n") : result.text;
  } else {
    text = new TextDecoder("utf-8").decode(bytes);
  }
  return text.replace(/\n{3,}/g, "\n\n").trim().slice(0, MAX_ATTACHMENT_CHARS);
}

/**
 * Download a Slack file with the bot token.
 *
 * Slack answers an unauthorized download with a 200 and an HTML sign-in page,
 * not an error, so a missing files:read scope would otherwise be stored as a
 * document full of login markup. The content type is checked instead.
 */
export async function downloadSlackFile(token: string, file: AttachmentFile): Promise<ArrayBuffer> {
  const url = file.url_private_download || file.url_private;
  if (!url) throw new Error("no download url");
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(20_000) });
  if (!response.ok) throw new Error(`download failed: HTTP ${response.status}`);
  const type = response.headers.get("content-type") ?? "";
  if (type.includes("text/html")) throw new Error("Slack returned a sign-in page; the app likely lacks the files:read permission");
  const bytes = await response.arrayBuffer();
  if (bytes.byteLength > MAX_ATTACHMENT_BYTES) throw new Error("file too large");
  return bytes;
}
