/**
 * Article HTML processing utilities.
 *
 * Extracts headings from rendered article HTML, injects `id` attributes
 * for anchor links, and returns a flat list of headings for the TOC.
 */

export interface ArticleHeading {
  id: string;
  text: string;
  level: 2 | 3;
}

interface ProcessedArticle {
  html: string;
  headings: ArticleHeading[];
}

/** Strip HTML tags and decode common entities for plain text TOC labels. */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&mdash;/g, "\u2014")
    .replace(/&ndash;/g, "\u2013")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&rsquo;/g, "\u2019")
    .replace(/&lsquo;/g, "\u2018")
    .replace(/&rdquo;/g, "\u201D")
    .replace(/&ldquo;/g, "\u201C")
    .replace(/&nbsp;/g, " ")
    .trim();
}

/** Convert text to a URL-friendly slug. */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Process article HTML to extract headings and inject IDs.
 *
 * Finds all <h2> and <h3> tags, generates slugified IDs from their
 * text content, handles duplicate IDs by appending -2, -3, etc.,
 * and injects `id` attributes into the HTML.
 */
export function processArticleHtml(html: string): ProcessedArticle {
  const headings: ArticleHeading[] = [];
  const usedIds = new Map<string, number>();

  const processed = html.replace(
    /<(h[23])(\s[^>]*)?>(.+?)<\/\1>/gi,
    (_match, tag: string, attrs: string | undefined, inner: string) => {
      const level = (tag.toLowerCase() === "h2" ? 2 : 3) as 2 | 3;
      const text = stripHtml(inner);
      let id = slugify(text);

      // Handle empty slugs
      if (!id) id = `heading`;

      // Handle duplicate IDs
      const count = usedIds.get(id) ?? 0;
      usedIds.set(id, count + 1);
      if (count > 0) {
        id = `${id}-${count + 1}`;
      }

      headings.push({ id, text, level });

      // Preserve existing attributes, inject id
      const existingAttrs = attrs?.trim() ?? "";
      return `<${tag} id="${id}"${existingAttrs ? ` ${existingAttrs}` : ""}>${inner}</${tag}>`;
    }
  );

  return { html: processed, headings };
}
