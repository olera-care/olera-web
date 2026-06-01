/**
 * Body markdown → HTML. Shared renderer for outreach email bodies.
 *
 * Consumed by both the Resend send path (`email-send.ts`) and the
 * Smartlead cold path (`lib/medjobs/smartlead-bridge.ts`) so the two
 * channels render identical HTML from the same template copy. Extracted
 * from email-send.ts (was private) for that single-source-of-truth reuse;
 * behavior is unchanged.
 *
 * Two markers supported in template bodies:
 *   **text**       → <strong>text</strong>
 *   [label](url)   → <a href="url">label</a>
 *
 * v9 final: body renders inside a single <div> with <br><br> for
 * paragraph breaks (not multiple <p> tags). Gmail's auto-trim
 * heuristic ("…" expander between similar paragraphs) treats
 * top-level <p> blocks as candidate trim sections; collapsing
 * the body into one container removes that hook and keeps the
 * email reading continuously from greeting to close.
 *
 * Trade-off: paragraph spacing relies on <br><br> instead of CSS
 * margin. Email clients render that consistently — slightly
 * tighter than two <p>s but readable. Single <br> within a
 * paragraph still works for soft line breaks.
 */
export function bodyToHtml(text: string): string {
  // 1) HTML-escape first so user copy can't inject tags.
  let s = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // 2) [label](url) → <a href>. Run before **bold** so a link's
  //    label can itself contain bold text without the brackets
  //    getting consumed.
  s = s.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (_m, label: string, href: string) =>
      `<a href="${href}" style="color:#059669;font-weight:500;text-decoration:underline;">${label}</a>`,
  );

  // 3) **text** → <strong>. Simple non-greedy match — covers
  //    single-paragraph bold sentences (the canonical template
  //    use case). Multi-paragraph bold is not supported.
  s = s.replace(/\*\*([^*]+)\*\*/g, (_m, inner: string) => `<strong>${inner}</strong>`);

  // 4) Single-div body: split on \n{2,} to identify paragraphs,
  //    then join with <br><br>. Single \n inside a paragraph
  //    becomes <br>. The whole body is one container — Gmail
  //    can't pivot a trim ellipsis inside this.
  const paragraphs = s.split(/\n{2,}/).map((p) => p.replace(/\n/g, "<br>"));
  return `<div style="font-family:Inter,Arial,sans-serif;font-size:14px;line-height:1.55;color:#1f2937;">${paragraphs.join("<br><br>")}</div>`;
}
