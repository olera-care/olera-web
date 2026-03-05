// @ts-nocheck
/**
 * Import articles from Sanity CMS (v1.0) into the Supabase content_articles table.
 *
 * Usage:
 *   npx tsx scripts/import-sanity.ts            # upsert to Supabase
 *   npx tsx scripts/import-sanity.ts --dry-run   # preview without writing
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from "@supabase/supabase-js";
import { toHTML } from "@portabletext/to-html";
import { config } from "dotenv";

config({ path: ".env.local" });

// ── Config ─────────────────────────────────────────────────────────
const SANITY_PROJECT = "krao7zrz";
const SANITY_DATASET = "production";
const SANITY_API_VERSION = "2021-10-21";
const SANITY_CDN_BASE = `https://cdn.sanity.io/images/${SANITY_PROJECT}/${SANITY_DATASET}`;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const DRY_RUN = process.argv.includes("--dry-run");

// ── Category mapping: Sanity category _id → v2 CareTypeId ─────────
const CATEGORY_MAP: Record<string, string> = {
  mojAQe6mvtteXwoWTCDBgO: "home-care",
  XlOMbyNcJVtsafKZNHa0fi: "home-health",
  "AbuPT0Y3LXidd4q94qwWjx": "assisted-living",
  mojAQe6mvtteXwoWTCDD9W: "memory-care",
  "AbuPT0Y3LXidd4q94qwXQj": "nursing-homes",
  XlOMbyNcJVtsafKZNHa4oZ: "independent-living",
};

// ── Helpers ────────────────────────────────────────────────────────

/** Convert a Sanity image asset _ref to a CDN URL. */
function imageRefToUrl(ref: string | undefined | null): string | null {
  if (!ref) return null;
  // Format: image-{hash}-{WxH}-{format}
  const match = ref.match(/^image-(.+)-(\d+x\d+)-(\w+)$/);
  if (!match) return null;
  const [, hash, dimensions, format] = match;
  return `${SANITY_CDN_BASE}/${hash}-${dimensions}.${format}`;
}

/** Convert a Sanity Portable Text block → Tiptap JSON nodes. */
function portableTextBlockToTiptap(block: any): any | null {
  if (!block) return null;

  // Handle list items
  if (block.listItem) {
    const paragraph = inlineChildrenToTiptap(block.children, block.markDefs);
    return { type: "listItem", content: [paragraph] };
  }

  // Handle headings (style h1-h6)
  const headingMatch = block.style?.match(/^h(\d)$/);
  if (headingMatch) {
    const level = parseInt(headingMatch[1], 10);
    return {
      type: "heading",
      attrs: { level },
      content: inlineChildrenToTiptapContent(block.children, block.markDefs),
    };
  }

  // Handle blockquotes
  if (block.style === "blockquote") {
    return {
      type: "blockquote",
      content: [
        {
          type: "paragraph",
          content: inlineChildrenToTiptapContent(block.children, block.markDefs),
        },
      ],
    };
  }

  // Default: paragraph
  const content = inlineChildrenToTiptapContent(block.children, block.markDefs);
  if (content.length === 0) return { type: "paragraph" };
  return { type: "paragraph", content };
}

/** Convert Sanity inline children to a Tiptap paragraph node. */
function inlineChildrenToTiptap(children: any[], markDefs?: any[]): any {
  const content = inlineChildrenToTiptapContent(children, markDefs);
  if (content.length === 0) return { type: "paragraph" };
  return { type: "paragraph", content };
}

/** Convert Sanity inline children to Tiptap content array (text nodes with marks). */
function inlineChildrenToTiptapContent(children: any[] | undefined, markDefs?: any[]): any[] {
  if (!children) return [];
  const markDefMap: Record<string, any> = {};
  for (const md of markDefs || []) {
    markDefMap[md._key] = md;
  }

  const nodes: any[] = [];
  for (const child of children) {
    if (!child.text && child.text !== "") continue;
    if (child.text === "") continue;

    const node: any = { type: "text", text: child.text };
    const marks: any[] = [];

    for (const m of child.marks || []) {
      if (m === "strong") marks.push({ type: "bold" });
      else if (m === "em") marks.push({ type: "italic" });
      else if (m === "underline") marks.push({ type: "underline" });
      else if (m === "code") marks.push({ type: "code" });
      else if (markDefMap[m]?._type === "link") {
        marks.push({ type: "link", attrs: { href: markDefMap[m].href, target: "_blank", rel: "noopener noreferrer", class: null } });
      }
    }

    if (marks.length > 0) node.marks = marks;
    nodes.push(node);
  }
  return nodes;
}

/** Group consecutive list items into bulletList/orderedList nodes. */
function groupListItems(nodes: { node: any; listItem?: string; level?: number }[]): any[] {
  const result: any[] = [];
  let i = 0;

  while (i < nodes.length) {
    const { node, listItem } = nodes[i];
    if (!listItem) {
      result.push(node);
      i++;
      continue;
    }

    // Collect consecutive list items of the same type
    const listType = listItem === "number" ? "orderedList" : "bulletList";
    const items: any[] = [];
    while (i < nodes.length && nodes[i].listItem === listItem) {
      items.push(nodes[i].node);
      i++;
    }
    result.push({ type: listType, content: items });
  }

  return result;
}

/** Convert Sanity components[] → Tiptap JSON document. */
function componentsToTiptapJson(components: any[] | undefined | null): Record<string, unknown> {
  if (!components || components.length === 0) {
    return { type: "doc", content: [{ type: "paragraph" }] };
  }

  const docContent: any[] = [];

  for (const comp of components) {
    if (comp._type === "contentBlock") {
      if (comp.title) {
        docContent.push({
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: comp.title }],
        });
      }
      if (comp.content && Array.isArray(comp.content)) {
        // Build nodes, tracking list items for grouping
        const rawNodes: { node: any; listItem?: string; level?: number }[] = [];
        for (const block of comp.content) {
          if (block._type === "image") {
            const url = imageRefToUrl(block.asset?._ref);
            if (url) {
              rawNodes.push({ node: { type: "image", attrs: { src: url, alt: "", title: null } } });
            }
            continue;
          }
          const tiptapNode = portableTextBlockToTiptap(block);
          if (tiptapNode) {
            rawNodes.push({
              node: tiptapNode,
              listItem: block.listItem,
              level: block.level,
            });
          }
        }
        docContent.push(...groupListItems(rawNodes));
      }
    } else if (comp._type === "imageComponent") {
      const url = imageRefToUrl(comp?.image?.asset?._ref);
      if (url) {
        docContent.push({
          type: "image",
          attrs: { src: url, alt: comp.imageAlt || comp.alt || "", title: null },
        });
      }
    }
  }

  if (docContent.length === 0) {
    docContent.push({ type: "paragraph" });
  }

  return { type: "doc", content: docContent };
}

/** Convert Sanity components[] array → HTML string. */
function componentsToHtml(components: any[] | undefined | null): string {
  if (!components || components.length === 0) return "";

  const parts: string[] = [];

  for (const comp of components) {
    if (comp._type === "contentBlock") {
      if (comp.title) {
        parts.push(`<h2>${escapeHtml(comp.title)}</h2>`);
      }
      if (comp.content && Array.isArray(comp.content)) {
        try {
          const html = toHTML(comp.content, {
            components: {
              types: {
                image: ({ value }: any) => {
                  const url = imageRefToUrl(value?.asset?._ref);
                  if (!url) return "";
                  return `<figure><img src="${url}" alt="" loading="lazy" /></figure>`;
                },
              },
              marks: {
                link: ({ children, value }: any) => {
                  const href = value?.href || "#";
                  return `<a href="${escapeHtml(href)}">${children}</a>`;
                },
              },
            },
          });
          parts.push(html);
        } catch {
          // Fallback: extract raw text from blocks
          for (const block of comp.content) {
            if (block.children) {
              const text = block.children.map((c: any) => c.text || "").join("");
              if (text) parts.push(`<p>${escapeHtml(text)}</p>`);
            }
          }
        }
      }
    } else if (comp._type === "imageComponent") {
      const url = imageRefToUrl(comp?.image?.asset?._ref);
      if (url) {
        const alt = escapeHtml(comp.imageAlt || comp.alt || "");
        parts.push(`<figure><img src="${url}" alt="${alt}" loading="lazy" /></figure>`);
      }
    }
  }

  return parts.join("\n");
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Estimate reading time from HTML content. */
function estimateReadingTime(html: string): string {
  const text = html.replace(/<[^>]+>/g, " ");
  const words = text.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 200));
  return `${minutes} min`;
}

/** Extract plain text from Sanity components for excerpt fallback. */
function extractPlainText(components: any[] | undefined | null): string {
  if (!components) return "";
  const texts: string[] = [];
  for (const comp of components) {
    if (comp._type === "contentBlock" && comp.content) {
      for (const block of comp.content) {
        if (block.children) {
          texts.push(block.children.map((c: any) => c.text || "").join(""));
        }
      }
    }
  }
  return texts.join(" ").slice(0, 200);
}

// ── Main ───────────────────────────────────────────────────────────

async function fetchSanityArticles() {
  const query = `*[_type in ["eduMaterial", "researchAndPress"]] | order(_createdAt desc) {
    _id, _type, _createdAt, _updatedAt,
    title, slug, author, description,
    metaTitle, metaDescription, canonical,
    publishedAt, readTime, featured, tags,
    heroImage, ogImage,
    "categoryRefs": categories[]._ref,
    components
  }`;

  const url = `https://${SANITY_PROJECT}.api.sanity.io/v${SANITY_API_VERSION}/data/query/${SANITY_DATASET}?query=${encodeURIComponent(query)}`;

  console.log("Fetching articles from Sanity...");
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Sanity API error: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  const articles = json.result;
  console.log(`Fetched ${articles.length} articles from Sanity.\n`);
  return articles;
}

function mapArticle(sanity: any) {
  const slug = sanity.slug?.current;
  if (!slug) return null;

  const contentHtml = componentsToHtml(sanity.components);
  const contentJson = componentsToTiptapJson(sanity.components);
  const readTime = sanity.readTime
    ? `${sanity.readTime} min`
    : estimateReadingTime(contentHtml);

  const excerpt =
    sanity.metaDescription ||
    sanity.description ||
    extractPlainText(sanity.components);

  const careTypes = (sanity.categoryRefs || [])
    .map((ref: string) => CATEGORY_MAP[ref])
    .filter(Boolean);

  return {
    slug,
    title: sanity.title || "Untitled",
    excerpt,
    content_html: contentHtml,
    content_json: contentJson,
    cover_image_url: imageRefToUrl(sanity.heroImage?.image?.asset?._ref),
    og_image_url: imageRefToUrl(sanity.ogImage?.asset?._ref),
    care_types: careTypes,
    category: "guide",
    author_name: sanity.author || "Olera Team",
    meta_title: sanity.metaTitle || null,
    meta_description: sanity.metaDescription || null,
    canonical_url: `https://olera.care/caregiver-support/${slug}`,
    published_at: sanity.publishedAt || sanity._createdAt,
    reading_time: readTime,
    featured: sanity.featured || false,
    tags: sanity.tags || [],
    status: "published",
  };
}

async function main() {
  if (!DRY_RUN && (!SUPABASE_URL || !SERVICE_KEY)) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
    process.exit(1);
  }

  const sanityArticles = await fetchSanityArticles();

  const mapped: any[] = [];
  const skipped: string[] = [];

  for (const article of sanityArticles) {
    const row = mapArticle(article);
    if (row) {
      mapped.push(row);
    } else {
      skipped.push(article._id);
    }
  }

  console.log(`Mapped: ${mapped.length} articles`);
  if (skipped.length > 0) {
    console.log(`Skipped (no slug): ${skipped.length} — ${skipped.join(", ")}`);
  }

  if (DRY_RUN) {
    console.log("\n--- DRY RUN (no writes) ---\n");
    for (const row of mapped) {
      const htmlLen = row.content_html?.length || 0;
      console.log(
        `  [${row.care_types.join(", ") || "uncategorized"}] ${row.slug}` +
          ` — "${row.title}" (${row.reading_time}, ${htmlLen} chars HTML)`
      );
    }
    console.log(`\nTotal: ${mapped.length} articles ready to import.`);
    return;
  }

  // Upsert to Supabase
  const db = createClient(SUPABASE_URL, SERVICE_KEY);

  console.log("\nUpserting to Supabase...");

  // Batch upsert in chunks of 20
  const BATCH_SIZE = 20;
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < mapped.length; i += BATCH_SIZE) {
    const batch = mapped.slice(i, i + BATCH_SIZE);
    const { error, data } = await db
      .from("content_articles")
      .upsert(batch, { onConflict: "slug" })
      .select("slug");

    if (error) {
      console.error(`  Batch error (items ${i}-${i + batch.length - 1}):`, error.message);
      errors += batch.length;
    } else {
      inserted += data.length;
      for (const row of data) {
        console.log(`  Upserted: ${row.slug}`);
      }
    }
  }

  console.log(`\nDone. Upserted: ${inserted}, Errors: ${errors}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
