import { generateHTML } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";

/**
 * Render Tiptap JSON to HTML on the server.
 * Used as a fallback when `content_html` is empty.
 */
export function renderContentToHTML(json: Record<string, unknown>): string {
  if (!json || !json.type) return "";

  try {
    return generateHTML(json as Parameters<typeof generateHTML>[0], [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Image,
      Link,
      Underline,
    ]);
  } catch (err) {
    console.error("renderContentToHTML error:", err);
    return "";
  }
}
